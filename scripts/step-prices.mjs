/* ==========================================================================
   step-prices — generate assets/data/step-prices.json
   --------------------------------------------------------------------------
   usage: node scripts/step-prices.mjs           write the file
          node scripts/step-prices.mjs --check   fail if the file is out of date

   The campaign sells "steps". Each country has one price per step, in that
   country's currency, as a whole number. The server (api/lib/payments.php)
   and every page read the same JSON file, so a price is changed in exactly one
   place: edit OVERRIDES (or RATES) below, run `npm run prices`, commit.

   How a price is derived
     • Uganda (UGX 5,000) and Kenya (KES 200) are fixed by the campaign.
     • Everywhere else the target is about US$1.50 per step: the target is
       converted at the approximate rate in RATES and rounded to the nearest
       "friendly" whole number (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10ⁿ).
     • Currencies that are unstable, restricted, pegged to the dollar, or worth
       so much that a whole unit overshoots the target (RATES value "usd")
       are priced in US dollars instead: US$2 per step.

   RATES are approximate market rates (units per US$1). They only anchor the
   rounding; they are not used to convert real payments. Finance should review
   the table before online payments open in any new currency.
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUTPUT = path.join(ROOT, "assets/data/step-prices.json");
const TARGET_USD = 1.5;
const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/** Fixed by the campaign. */
const OVERRIDES = { UG: { currency: "UGX", step: 5000 }, KE: { currency: "KES", step: 200 } };

/** Shown first in the country list: where the campaign walks and is based. */
const FEATURED = ["UG", "KE", "TZ", "RW", "BI", "SS", "CD"];

/** Currency → units per US$1 (approximate), or "usd" to price that country in US dollars. */
const RATES = {
  AED: 3.67,
  ALL: 90,
  AMD: 385,
  ANG: 1.79,
  AOA: 915,
  AUD: 1.53,
  AWG: 1.79,
  AZN: 1.7,
  BAM: 1.7,
  BBD: 2,
  BDT: 122,
  BIF: 2950,
  BND: 1.3,
  BOB: 6.9,
  BRL: 5.5,
  BSD: 1,
  BTN: 85,
  BWP: 13.5,
  BYN: 3.3,
  BZD: 2,
  CAD: 1.38,
  CDF: 2850,
  CHF: 0.82,
  CLP: 950,
  CNY: 7.2,
  COP: 4100,
  CRC: 510,
  CVE: 96,
  CZK: 22,
  DJF: 178,
  DKK: 6.9,
  DOP: 62,
  DZD: 133,
  EGP: 49,
  ERN: 15,
  ETB: 135,
  EUR: 0.92,
  FJD: 2.25,
  GBP: 0.77,
  GEL: 2.7,
  GHS: 11,
  GMD: 72,
  GNF: 8650,
  GTQ: 7.7,
  GYD: 209,
  HKD: 7.8,
  HNL: 26,
  HTG: 131,
  HUF: 360,
  IDR: 16300,
  ILS: 3.5,
  INR: 85,
  IQD: 1310,
  ISK: 125,
  JMD: 158,
  JOD: 0.71,
  JPY: 150,
  KES: 129,
  KGS: 87,
  KHR: 4000,
  KMF: 450,
  KRW: 1400,
  KZT: 520,
  LAK: 21500,
  LKR: 300,
  LRD: 195,
  LSL: 18,
  LYD: 5.4,
  MAD: 9.3,
  MDL: 17.5,
  MGA: 4500,
  MKD: 52.5,
  MNT: 3500,
  MOP: 8,
  MRU: 40,
  MUR: 45,
  MVR: 15.4,
  MWK: 1730,
  MXN: 19.5,
  MYR: 4.3,
  MZN: 64,
  NAD: 18,
  NGN: 1550,
  NIO: 36.8,
  NOK: 10.5,
  NPR: 135,
  NZD: 1.65,
  PEN: 3.6,
  PGK: 4.1,
  PHP: 57,
  PKR: 280,
  PLN: 3.8,
  PYG: 7900,
  QAR: 3.64,
  RON: 4.6,
  RSD: 100,
  RUB: 85,
  RWF: 1440,
  SAR: 3.75,
  SBD: 8.4,
  SCR: 14.5,
  SEK: 9.8,
  SGD: 1.3,
  SLE: 22.8,
  STN: 21.4,
  SRD: 37,
  SZL: 18,
  THB: 33,
  TJS: 10,
  TMT: 3.5,
  TND: 3,
  TOP: 2.4,
  TRY: 40,
  TTD: 6.8,
  TWD: 32,
  TZS: 2650,
  UAH: 41,
  UGX: 3700,
  UYU: 40,
  UZS: 12800,
  VND: 25500,
  VUV: 120,
  WST: 2.7,
  XAF: 600,
  XCD: 2.7,
  XOF: 600,
  ZAR: 18,
  ZMW: 25,
  USD: 1,
  // priced in US dollars instead of the local currency
  AFN: "usd",
  ARS: "usd",
  BHD: "usd",
  CUP: "usd",
  IRR: "usd",
  KPW: "usd",
  KWD: "usd",
  LBP: "usd",
  MMK: "usd",
  OMR: "usd",
  SDG: "usd",
  SOS: "usd",
  SSP: "usd",
  SYP: "usd",
  VES: "usd",
  YER: "usd",
  ZWG: "usd",
};

/** Short labels where a familiar one exists; every other currency shows its code. */
const LABELS = {
  USD: "US$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  TZS: "TSh",
  BIF: "FBu",
  CDF: "FC",
  ETB: "Br",
  ZAR: "R",
  NGN: "₦",
  GHS: "GH₵",
  INR: "₹",
  JPY: "¥",
  CNY: "CN¥",
  KRW: "₩",
  BRL: "R$",
  CAD: "CA$",
  AUD: "A$",
  NZD: "NZ$",
  HKD: "HK$",
  SGD: "S$",
  MXN: "MX$",
  PHP: "₱",
  TRY: "₺",
  ILS: "₪",
  CHF: "CHF",
  AED: "AED",
  SAR: "SAR",
  PKR: "Rs",
  LKR: "Rs",
  NPR: "Rs",
  BDT: "৳",
  ZMW: "ZK",
  MWK: "MK",
  TWD: "NT$",
  VND: "₫",
  THB: "฿",
};

// [ISO 3166-1 alpha-2, name, currency]; "usd" currency means US dollars are the local currency or the fallback.
const COUNTRIES = `
AF Afghanistan AFN|AL Albania ALL|DZ Algeria DZD|AD Andorra EUR|AO Angola AOA|AG Antigua and Barbuda XCD|AR Argentina ARS|
AM Armenia AMD|AU Australia AUD|AT Austria EUR|AZ Azerbaijan AZN|BS Bahamas BSD|BH Bahrain BHD|BD Bangladesh BDT|
BB Barbados BBD|BY Belarus BYN|BE Belgium EUR|BZ Belize BZD|BJ Benin XOF|BT Bhutan BTN|BO Bolivia BOB|
BA Bosnia and Herzegovina BAM|BW Botswana BWP|BR Brazil BRL|BN Brunei BND|BG Bulgaria EUR|BF Burkina Faso XOF|
BI Burundi BIF|CV Cabo Verde CVE|KH Cambodia KHR|CM Cameroon XAF|CA Canada CAD|CF Central African Republic XAF|
TD Chad XAF|CL Chile CLP|CN China CNY|CO Colombia COP|KM Comoros KMF|CG Republic of the Congo XAF|CD DR Congo CDF|
CR Costa Rica CRC|CI Côte d'Ivoire XOF|HR Croatia EUR|CU Cuba CUP|CY Cyprus EUR|CZ Czechia CZK|DK Denmark DKK|
DJ Djibouti DJF|DM Dominica XCD|DO Dominican Republic DOP|EC Ecuador USD|EG Egypt EGP|SV El Salvador USD|
GQ Equatorial Guinea XAF|ER Eritrea ERN|EE Estonia EUR|SZ Eswatini SZL|ET Ethiopia ETB|FJ Fiji FJD|FI Finland EUR|
FR France EUR|GA Gabon XAF|GM Gambia GMD|GE Georgia GEL|DE Germany EUR|GH Ghana GHS|GR Greece EUR|GD Grenada XCD|
GT Guatemala GTQ|GN Guinea GNF|GW Guinea-Bissau XOF|GY Guyana GYD|HT Haiti HTG|HN Honduras HNL|HK Hong Kong HKD|
HU Hungary HUF|IS Iceland ISK|IN India INR|ID Indonesia IDR|IR Iran IRR|IQ Iraq IQD|IE Ireland EUR|IL Israel ILS|
IT Italy EUR|JM Jamaica JMD|JP Japan JPY|JO Jordan JOD|KZ Kazakhstan KZT|KE Kenya KES|KI Kiribati AUD|
XK Kosovo EUR|KW Kuwait KWD|KG Kyrgyzstan KGS|LA Laos LAK|LV Latvia EUR|LB Lebanon LBP|LS Lesotho LSL|LR Liberia LRD|
LY Libya LYD|LI Liechtenstein CHF|LT Lithuania EUR|LU Luxembourg EUR|MO Macao MOP|MG Madagascar MGA|MW Malawi MWK|
MY Malaysia MYR|MV Maldives MVR|ML Mali XOF|MT Malta EUR|MH Marshall Islands USD|MR Mauritania MRU|MU Mauritius MUR|
MX Mexico MXN|FM Micronesia USD|MD Moldova MDL|MC Monaco EUR|MN Mongolia MNT|ME Montenegro EUR|MA Morocco MAD|
MZ Mozambique MZN|MM Myanmar MMK|NA Namibia NAD|NR Nauru AUD|NP Nepal NPR|NL Netherlands EUR|NZ New Zealand NZD|
NI Nicaragua NIO|NE Niger XOF|NG Nigeria NGN|KP North Korea KPW|MK North Macedonia MKD|NO Norway NOK|OM Oman OMR|
PK Pakistan PKR|PW Palau USD|PS Palestine ILS|PA Panama USD|PG Papua New Guinea PGK|PY Paraguay PYG|PE Peru PEN|
PH Philippines PHP|PL Poland PLN|PT Portugal EUR|QA Qatar QAR|RO Romania RON|RU Russia RUB|RW Rwanda RWF|
KN Saint Kitts and Nevis XCD|LC Saint Lucia XCD|VC Saint Vincent and the Grenadines XCD|WS Samoa WST|SM San Marino EUR|
ST São Tomé and Príncipe STN|SA Saudi Arabia SAR|SN Senegal XOF|RS Serbia RSD|SC Seychelles SCR|SL Sierra Leone SLE|
SG Singapore SGD|SK Slovakia EUR|SI Slovenia EUR|SB Solomon Islands SBD|SO Somalia SOS|ZA South Africa ZAR|
KR South Korea KRW|SS South Sudan SSP|ES Spain EUR|LK Sri Lanka LKR|SD Sudan SDG|SR Suriname SRD|SE Sweden SEK|
CH Switzerland CHF|SY Syria SYP|TW Taiwan TWD|TJ Tajikistan TJS|TZ Tanzania TZS|TH Thailand THB|TL Timor-Leste USD|
TG Togo XOF|TO Tonga TOP|TT Trinidad and Tobago TTD|TN Tunisia TND|TR Türkiye TRY|TM Turkmenistan TMT|TV Tuvalu AUD|
UG Uganda UGX|UA Ukraine UAH|AE United Arab Emirates AED|GB United Kingdom GBP|US United States USD|UY Uruguay UYU|
UZ Uzbekistan UZS|VU Vanuatu VUV|VA Vatican City EUR|VE Venezuela VES|VN Vietnam VND|YE Yemen YER|ZM Zambia ZMW|
ZW Zimbabwe ZWG
`;

function friendlyWhole(raw) {
  let best = null;
  for (let power = 0; power <= 9; power++) {
    for (const base of NICE) {
      const value = base * 10 ** power;
      if (!Number.isInteger(value) || value < 1) continue;
      const distance = Math.abs(Math.log(value / raw));
      if (!best || distance < best.distance) best = { value, distance };
    }
  }
  return best.value;
}

function parseCountries() {
  return COUNTRIES.replace(/\n/g, "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^([A-Z]{2}) (.+) ([A-Z]{3})$/);
      if (!match) throw new Error(`Cannot read country entry: "${entry}"`);
      return { code: match[1], name: match[2], currency: match[3] };
    });
}

function build() {
  const countries = parseCountries();
  const seen = new Set();
  const usedCurrencies = new Set(["USD"]);
  const rows = countries.map(({ code, name, currency }) => {
    if (seen.has(code)) throw new Error(`Duplicate country ${code}`);
    seen.add(code);
    let priced;
    if (OVERRIDES[code]) priced = OVERRIDES[code];
    else {
      const rate = RATES[currency];
      if (rate === undefined) throw new Error(`No rate for ${currency} (${name})`);
      if (rate === "usd" || currency === "USD") priced = { currency: "USD", step: friendlyWhole(TARGET_USD) };
      else {
        const raw = TARGET_USD * rate;
        // a whole unit that is worth far more than the target is no use: price in US dollars
        priced =
          raw < 0.9 ? { currency: "USD", step: friendlyWhole(TARGET_USD) } : { currency, step: friendlyWhole(raw) };
      }
    }
    usedCurrencies.add(priced.currency);
    return { code, name, currency: priced.currency, step: priced.step };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name, "en"));
  for (const code of FEATURED) if (!seen.has(code)) throw new Error(`Featured country ${code} is not in the list`);

  const currencies = {};
  for (const code of [...usedCurrencies].sort()) currencies[code] = LABELS[code] || code;

  const get = (code) => rows.find((r) => r.code === code);
  if (get("UG").currency !== "UGX" || get("UG").step !== 5000) throw new Error("Uganda must stay UGX 5,000");
  if (get("KE").currency !== "KES" || get("KE").step !== 200) throw new Error("Kenya must stay KES 200");
  for (const r of rows) if (!Number.isInteger(r.step) || r.step < 1) throw new Error(`Bad price for ${r.code}`);

  return {
    _about:
      "One sponsored step costs `step` in `currency` for each country. Generated by scripts/step-prices.mjs; edit that script, not this file. Prices other than Uganda and Kenya are approximate equivalents of about US$1.50 and need finance approval before online payment opens in that currency.",
    version: 1,
    defaultCountry: "UG",
    minimumSteps: 5,
    maximumSteps: 20000,
    featured: FEATURED,
    currencies,
    countries: rows,
  };
}

const text =
  JSON.stringify(build(), null, 1).replace(
    /\n {2}\{\n {3}"code": "(\w+)",\n {3}"name": ("(?:[^"\\]|\\.)*"),\n {3}"currency": "(\w+)",\n {3}"step": (\d+)\n {2}\}/g,
    '\n  {"code":"$1","name":$2,"currency":"$3","step":$4}',
  ) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, "utf8") : "";
  if (current !== text) {
    console.error("assets/data/step-prices.json is out of date. Run: npm run prices");
    process.exit(1);
  }
  console.log("assets/data/step-prices.json matches scripts/step-prices.mjs.");
} else {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, text);
  const data = JSON.parse(text);
  console.log(`Wrote ${data.countries.length} countries in ${Object.keys(data.currencies).length} currencies.`);
}
