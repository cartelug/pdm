/* Rebuild the precise, watermarked demonstration from native SVG and approved logos. */
import fs from "node:fs/promises";
import sharp from "sharp";
const logo = async (p) => "data:image/png;base64," + (await fs.readFile(p)).toString("base64");
const images = await Promise.all(
  [
    "assets/brand/pamodzi/pamodzi-logo-320.png",
    "assets/walk-for-education/walk-for-education-logo.png",
    "assets/walk-for-education/south-rwenzori.png",
  ].map(logo),
);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<rect width="1080" height="1350" fill="#0b2646"/><circle cx="1060" cy="1320" r="620" fill="#163d69"/>
<rect x="65" y="65" width="950" height="124" fill="white"/>
${images.map((src, i) => `<image href="${src}" x="${[100, 320, 790][i]}" y="75" width="${[160, 390, 130][i]}" height="104" preserveAspectRatio="xMidYMid meet"/>`).join("")}
<g font-family="Arial, sans-serif"><text x="65" y="247" font-size="24" fill="#82d2ef" font-weight="bold">PAMODZI COMMUNITY INITIATIVE</text>
<g font-size="68" fill="white" font-weight="bold"><text x="65" y="325">Every contribution.</text><text x="65" y="404">Accounted for.</text></g>
<text x="65" y="510" font-size="27" fill="#82d2ef" font-weight="bold">FINANCE-RECONCILED COLLECTIONS</text>
<text x="65" y="576" font-size="64" fill="white" font-weight="bold">UGX 500,000</text>
<text x="65" y="655" font-size="31" fill="white" font-weight="bold">100 confirmed sponsored steps</text>
<text x="65" y="707" font-size="26" fill="white">UGX 1,000,000 pledged · UGX 500,000 outstanding</text>
<text x="120" y="810" font-size="105" fill="white" opacity=".28" font-weight="bold" transform="rotate(-24 120 810)">SAMPLE DATA</text>
<path d="M65 1158H1015" stroke="#82d2ef" stroke-width="2"/>
<g font-size="24" fill="#82d2ef"><text x="65" y="1200">Reporting cut-off: 24 Oct 2026, 12:00 EAT</text><text x="65" y="1240">SAMPLE DATA · NOT LIVE COLLECTIONS</text></g>
<text x="65" y="1287" font-size="25" fill="white">pamodzici.com/walk-for-education</text></g></svg>`;
await sharp(Buffer.from(svg)).png().toFile("assets/operations/samples/PCI-SAMPLE-collections-feed.png");
console.log("Updated watermarked three-logo campaign demonstration.");
