/* ==========================================================================
   Step pricing — country, currency and the price of one step
   --------------------------------------------------------------------------
   Loaded (deferred) before the scripts that show an amount: the campaign shell,
   the contribution form, the receipt and the certificate check.

   One price per country, in that country's currency, comes from
   assets/data/step-prices.json, the same file the payment API reads. This
   module loads it, works out the visitor's likely country, remembers their
   choice for the session and formats amounts. If the file cannot be loaded,
   Uganda (UGX 5,000) stays available, so a failure never blocks giving.

     StepPricing.ready                    Promise, resolves when the table is available
     StepPricing.current()                { code, name, currency, step, label }
     StepPricing.select("KE")             choose a country (remembered, announced)
     StepPricing.format(10000, "KES")     "KSh 10,000"
     StepPricing.amountFor(50)            50 steps in the current currency
     StepPricing.fillSelect(selectEl)     fill a <select> with every country
     StepPricing.bind(rootEl)             refresh [data-sp] elements:
                                            data-sp="unit"      "KSh 200"
                                            data-sp="min"       "KSh 1,000"
                                            data-sp="code"      "KES"
                                            data-sp="label"     "KSh"
                                            data-sp-steps="50"  "KSh 10,000"
                                            data-sp-amount="50" "10,000" (number only)
     document "steppricing:change"        fired with the current country as detail
   ========================================================================== */
(function () {
  "use strict";

  var script = document.currentScript;
  var root = script && script.src ? script.src.replace(/js\/step-pricing\.js(?:\?.*)?$/, "") : "/";
  var STORAGE_COUNTRY = "wfe_country";
  var STORAGE_TABLE = "wfe_step_prices";

  var FALLBACK = {
    version: 0,
    defaultCountry: "UG",
    minimumSteps: 5,
    maximumSteps: 20000,
    featured: ["UG"],
    currencies: { UGX: "UGX" },
    countries: [{ code: "UG", name: "Uganda", currency: "UGX", step: 5000 }],
  };

  /* Time zone → country, for the countries most visitors come from. A time zone says where a phone is
     much more reliably than its language setting (many phones in Africa are set to US English). */
  var ZONES = {
    "Africa/Kampala": "UG",
    "Africa/Nairobi": "KE",
    "Africa/Dar_es_Salaam": "TZ",
    "Africa/Kigali": "RW",
    "Africa/Bujumbura": "BI",
    "Africa/Juba": "SS",
    "Africa/Kinshasa": "CD",
    "Africa/Lubumbashi": "CD",
    "Africa/Addis_Ababa": "ET",
    "Africa/Mogadishu": "SO",
    "Africa/Khartoum": "SD",
    "Africa/Lagos": "NG",
    "Africa/Accra": "GH",
    "Africa/Abidjan": "CI",
    "Africa/Dakar": "SN",
    "Africa/Johannesburg": "ZA",
    "Africa/Lusaka": "ZM",
    "Africa/Blantyre": "MW",
    "Africa/Harare": "ZW",
    "Africa/Maputo": "MZ",
    "Africa/Luanda": "AO",
    "Africa/Gaborone": "BW",
    "Africa/Windhoek": "NA",
    "Africa/Cairo": "EG",
    "Africa/Casablanca": "MA",
    "Africa/Tunis": "TN",
    "Africa/Algiers": "DZ",
    "Europe/London": "GB",
    "Europe/Dublin": "IE",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Madrid": "ES",
    "Europe/Rome": "IT",
    "Europe/Amsterdam": "NL",
    "Europe/Brussels": "BE",
    "Europe/Zurich": "CH",
    "Europe/Vienna": "AT",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI",
    "Europe/Lisbon": "PT",
    "Europe/Warsaw": "PL",
    "Europe/Athens": "GR",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Phoenix": "US",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "America/Mexico_City": "MX",
    "America/Sao_Paulo": "BR",
    "America/Bogota": "CO",
    "America/Lima": "PE",
    "America/Santiago": "CL",
    "Asia/Kolkata": "IN",
    "Asia/Calcutta": "IN",
    "Asia/Karachi": "PK",
    "Asia/Dhaka": "BD",
    "Asia/Dubai": "AE",
    "Asia/Riyadh": "SA",
    "Asia/Qatar": "QA",
    "Asia/Singapore": "SG",
    "Asia/Kuala_Lumpur": "MY",
    "Asia/Manila": "PH",
    "Asia/Jakarta": "ID",
    "Asia/Bangkok": "TH",
    "Asia/Ho_Chi_Minh": "VN",
    "Asia/Tokyo": "JP",
    "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN",
    "Asia/Hong_Kong": "HK",
    "Asia/Jerusalem": "IL",
    "Asia/Istanbul": "TR",
    "Europe/Istanbul": "TR",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Australia/Brisbane": "AU",
    "Australia/Perth": "AU",
    "Pacific/Auckland": "NZ",
  };

  var data = FALLBACK;
  var byCode = index(FALLBACK);
  var selected = null;
  var chosen = false; // true once the visitor (or a link) picked a country, so detection never overrides it
  var number = new Intl.NumberFormat("en-US");

  function index(table) {
    var map = {};
    table.countries.forEach(function (country) {
      map[country.code] = country;
    });
    return map;
  }

  function usable(table) {
    return (
      !!table &&
      Array.isArray(table.countries) &&
      table.countries.length > 0 &&
      table.currencies &&
      typeof table.currencies === "object" &&
      table.countries.every(function (c) {
        return (
          c && /^[A-Z]{2}$/.test(c.code) && /^[A-Z]{3}$/.test(c.currency) && Number.isInteger(c.step) && c.step >= 1
        );
      }) &&
      table.countries.some(function (c) {
        return c.code === "UG";
      })
    );
  }

  function adopt(table) {
    data = table;
    byCode = index(table);
  }

  function read(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }
  function write(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      /* remembering is optional */
    }
  }

  function label(currency) {
    return (data.currencies && data.currencies[currency]) || currency;
  }

  function format(amount, currency) {
    var text = label(currency || "UGX");
    var joiner = /[A-Za-z]$/.test(text) ? " " : "";
    return text + joiner + number.format(Number(amount) || 0);
  }

  function entry(code) {
    var country = byCode[code] || byCode[data.defaultCountry] || data.countries[0];
    return {
      code: country.code,
      name: country.name,
      currency: country.currency,
      step: country.step,
      label: label(country.currency),
    };
  }

  function detect() {
    var zone;
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      zone = "";
    }
    if (ZONES[zone] && byCode[ZONES[zone]]) return ZONES[zone];
    var languages =
      navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (var i = 0; i < languages.length; i++) {
      var region = (String(languages[i]).split("-")[1] || "").toUpperCase();
      // en-US is the default of many phones elsewhere, so a US locale alone is not trusted
      if (region && region !== "US" && byCode[region]) return region;
    }
    return data.defaultCountry;
  }

  function resolveInitial() {
    var fromUrl = (new URLSearchParams(window.location.search).get("country") || "").toUpperCase();
    if (byCode[fromUrl]) return fromUrl;
    var remembered = read(STORAGE_COUNTRY);
    if (remembered && byCode[remembered]) return remembered;
    return detect();
  }

  function announce() {
    var detail = entry(selected);
    var event;
    try {
      event = new CustomEvent("steppricing:change", { detail: detail });
    } catch (error) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("steppricing:change", false, false, detail);
    }
    document.dispatchEvent(event);
  }

  function select(code) {
    var next = byCode[code] ? code : data.defaultCountry;
    var changed = next !== selected;
    chosen = true;
    selected = next;
    write(STORAGE_COUNTRY, selected);
    bind(document);
    if (changed) announce();
  }

  function current() {
    if (!selected) selected = resolveInitial();
    return entry(selected);
  }

  function amountFor(steps) {
    return current().step * Number(steps || 0);
  }

  function bind(scope) {
    var now = current();
    (scope || document).querySelectorAll("[data-sp]").forEach(function (node) {
      var kind = node.getAttribute("data-sp");
      if (kind === "unit") node.textContent = format(now.step, now.currency);
      else if (kind === "min") node.textContent = format(now.step * data.minimumSteps, now.currency);
      else if (kind === "code") node.textContent = now.currency;
      else if (kind === "label") node.textContent = now.label;
    });
    (scope || document).querySelectorAll("[data-sp-amount]").forEach(function (node) {
      node.textContent = number.format(now.step * Number(node.getAttribute("data-sp-amount")));
    });
    (scope || document).querySelectorAll("[data-sp-steps]").forEach(function (node) {
      node.textContent = format(now.step * Number(node.getAttribute("data-sp-steps")), now.currency);
    });
  }

  /** Fill a <select> with the campaign region first, then every country A–Z. */
  function fillSelect(selectEl) {
    selectEl.textContent = "";
    var featured = (data.featured || []).filter(function (code) {
      return byCode[code];
    });
    function option(country) {
      var o = document.createElement("option");
      o.value = country.code;
      o.textContent = country.name;
      return o;
    }
    if (featured.length) {
      var group = document.createElement("optgroup");
      group.label = "Campaign region";
      featured.forEach(function (code) {
        group.appendChild(option(byCode[code]));
      });
      selectEl.appendChild(group);
    }
    var rest = document.createElement("optgroup");
    rest.label = "All countries";
    data.countries
      .filter(function (country) {
        return featured.indexOf(country.code) === -1;
      })
      .forEach(function (country) {
        rest.appendChild(option(country));
      });
    selectEl.appendChild(rest);
    selectEl.value = current().code;
  }

  // Use the table from earlier on this visit straight away, so later pages never flash the wrong currency.
  try {
    var cached = JSON.parse(read(STORAGE_TABLE) || "null");
    if (usable(cached)) adopt(cached);
  } catch (error) {
    /* fetch below */
  }

  var ready = fetch(root + "assets/data/step-prices.json", { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (table) {
      if (!usable(table)) throw new Error("Invalid price table");
      var changed = JSON.stringify(table) !== JSON.stringify(data);
      adopt(table);
      write(STORAGE_TABLE, JSON.stringify(table));
      // detection ran against the small fallback table if this load was the first; run it again on the full one
      var before = selected;
      if (!byCode[selected] || !chosen) selected = resolveInitial();
      if (selected !== before) changed = true;
      if (changed) {
        bind(document);
        announce();
      }
      return data;
    })
    .catch(function () {
      return data; // the Uganda fallback or the cached table stays in force
    });

  window.StepPricing = {
    ready: ready,
    current: current,
    select: select,
    format: format,
    amountFor: amountFor,
    fillSelect: fillSelect,
    bind: bind,
    get minimumSteps() {
      return data.minimumSteps;
    },
    get maximumSteps() {
      return data.maximumSteps;
    },
    isKnownCountry: function (code) {
      return !!byCode[code];
    },
  };
})();
