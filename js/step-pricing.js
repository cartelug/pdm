/* ==========================================================================
   Step pricing — country, currency and the price of one step
   --------------------------------------------------------------------------
   Loaded (deferred) before the scripts that show an amount: the campaign shell,
   the contribution form, the receipt and the certificate check.

   One price per country, in that country's currency, comes from
   assets/data/step-prices.json, the same file the payment API reads. This
   module loads it, works out the visitor's likely country, remembers their
   choice for the session and formats amounts. If the file cannot be loaded,
   published Uganda/Kenya prices stay available for pledges, with a visible
   fallback notice. An unavailable international country is never replaced by Uganda.

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
    featured: ["UG", "KE"],
    currencies: { UGX: "UGX", KES: "KSh" },
    countries: [
      { code: "UG", name: "Uganda", currency: "UGX", step: 5000 },
      { code: "KE", name: "Kenya", currency: "KES", step: 200 },
    ],
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
  var loaded = false;
  var fresh = false;
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
        return c.code === "UG" && c.currency === "UGX" && c.step === 5000;
      }) &&
      table.countries.some(function (c) {
        return c.code === "KE" && c.currency === "KES" && c.step === 200;
      }) &&
      table.minimumSteps === 5 &&
      table.maximumSteps === 20000
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
    var country = byCode[code];
    if (!country)
      return {
        code: code,
        name: "Selected country",
        currency: "",
        step: 0,
        label: "",
        ready: loaded,
        available: false,
        fresh: fresh,
        approved: false,
      };
    return {
      code: country.code,
      name: country.name,
      currency: country.currency,
      step: country.step,
      label: label(country.currency),
      ready: loaded,
      available: true,
      fresh: fresh,
      approved:
        country.priceStatus === "published" ||
        (!country.priceStatus && (country.code === "UG" || country.code === "KE")),
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
    if (byCode[fromUrl] || (!fresh && /^[A-Z]{2}$/.test(fromUrl))) return fromUrl;
    var remembered = read(STORAGE_COUNTRY);
    if (remembered && (byCode[remembered] || (!fresh && /^[A-Z]{2}$/.test(remembered)))) return remembered;
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
    var next = String(code || "").toUpperCase();
    if (!byCode[next]) return;
    var changed = next !== selected;
    chosen = true;
    selected = next;
    write(STORAGE_COUNTRY, selected);
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("country", selected);
      window.history.replaceState(window.history.state, "", url.href);
    } catch (error) {
      /* A country choice still works when history updates are unavailable. */
    }
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
      if (kind === "policy")
        node.textContent = now.approved
          ? "Your country sets the currency. A pledge is not a payment."
          : "Indicative pledge amount only. PCI will confirm the amount in your currency; no payment is taken.";
      else if (!now.available) node.textContent = "—";
      else if (kind === "unit") node.textContent = format(now.step, now.currency);
      else if (kind === "min") node.textContent = format(now.step * data.minimumSteps, now.currency);
      else if (kind === "code") node.textContent = now.currency;
      else if (kind === "label") node.textContent = now.label;
    });
    (scope || document).querySelectorAll("[data-sp-amount]").forEach(function (node) {
      node.textContent = now.available ? number.format(now.step * Number(node.getAttribute("data-sp-amount"))) : "—";
    });
    (scope || document).querySelectorAll("[data-sp-steps]").forEach(function (node) {
      node.textContent = now.available
        ? format(now.step * Number(node.getAttribute("data-sp-steps")), now.currency)
        : "—";
    });
    (scope || document).querySelectorAll("[data-country-featured]").forEach(function (button) {
      var code = button.getAttribute("data-country-featured");
      var active = code === "INT" ? now.code !== "UG" && now.code !== "KE" : now.code === code;
      button.setAttribute("aria-pressed", String(active));
      button.disabled = !loaded || (code === "INT" ? !byCode.US : !byCode[code]);
    });
    (scope || document).querySelectorAll("[data-pricing-status]").forEach(function (node) {
      node.textContent = !loaded
        ? "Loading country prices…"
        : !now.available
          ? "Country prices could not load. Reload to try again, or contact PCI for assistance."
          : !fresh
            ? "Using saved or published pledge prices. The server checks your amount when you save."
            : "";
      node.hidden = loaded && now.available && fresh;
    });
  }

  /** Fill a <select> with the campaign region first, then every country A–Z. */
  function fillSelect(selectEl, query) {
    selectEl.textContent = "";
    var search = String(query || "")
      .trim()
      .toLowerCase();
    var matches = function (country) {
      return (
        !search || (country.name + " " + country.code + " " + country.currency).toLowerCase().indexOf(search) !== -1
      );
    };
    var featured = (data.featured || []).filter(function (code) {
      return byCode[code] && matches(byCode[code]);
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
        return featured.indexOf(country.code) === -1 && matches(country);
      })
      .forEach(function (country) {
        rest.appendChild(option(country));
      });
    selectEl.appendChild(rest);
    selectEl.value = current().code;
    if (!selectEl.value) {
      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = search ? "Choose a search result" : "Choose your country";
      placeholder.disabled = true;
      placeholder.selected = true;
      selectEl.insertBefore(placeholder, selectEl.firstChild);
    }
  }

  function setupControls() {
    document.querySelectorAll("[data-country-featured]").forEach(function (button) {
      button.addEventListener("click", function () {
        var code = button.getAttribute("data-country-featured");
        if (code === "INT") code = current().code !== "UG" && current().code !== "KE" ? current().code : "US";
        document.querySelectorAll("[data-country-search]").forEach(function (input) {
          input.value = "";
        });
        document.querySelectorAll("[data-country-panel] select").forEach(function (selectEl) {
          fillSelect(selectEl);
        });
        select(code);
        document.querySelectorAll("details[data-country-panel]").forEach(function (panel) {
          panel.open = button.getAttribute("data-country-featured") === "INT";
          if (panel.open) {
            var search = panel.querySelector("[data-country-search]");
            if (search) search.focus();
          }
        });
        document.querySelectorAll("[data-country-panel] select").forEach(function (selectEl) {
          selectEl.value = current().code;
        });
      });
    });
    document.querySelectorAll("[data-country-search]").forEach(function (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        var panel = input.closest("[data-country-panel]");
        var selectEl = panel && panel.querySelector("select");
        if (selectEl) selectEl.focus();
      });
      input.addEventListener("input", function () {
        var panel = input.closest("[data-country-panel]");
        var selectEl = panel && panel.querySelector("select");
        if (selectEl) fillSelect(selectEl, input.value);
      });
    });
  }

  // Use the table from earlier on this visit straight away, so later pages never flash the wrong currency.
  try {
    var cached = JSON.parse(read(STORAGE_TABLE) || "null");
    if (usable(cached)) adopt(cached);
  } catch (error) {
    /* fetch below */
  }

  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timeout = controller
    ? window.setTimeout(function () {
        controller.abort();
      }, 8000)
    : null;
  var ready = fetch(root + "assets/data/step-prices.json", {
    credentials: "same-origin",
    signal: controller ? controller.signal : undefined,
  })
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (table) {
      if (!usable(table)) throw new Error("Invalid price table");
      adopt(table);
      fresh = true;
      write(STORAGE_TABLE, JSON.stringify(table));
      // detection ran against the small fallback table if this load was the first; run it again on the full one
      if (!byCode[selected] || !chosen) selected = resolveInitial();
      return data;
    })
    .catch(function () {
      return data; // The published UG/KE fallback or cached preview stays in force; PHP checks every pledge.
    })
    .then(function () {
      if (timeout) window.clearTimeout(timeout);
      loaded = true;
      document.querySelectorAll("details[data-country-panel]").forEach(function (panel) {
        panel.open = current().code !== "UG" && current().code !== "KE";
      });
      bind(document);
      announce();
      // Change listeners render both summaries synchronously before revealing any financial values.
      document.documentElement.classList.remove("pricing-pending");
      return data;
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
  setupControls();
  bind(document);
})();
