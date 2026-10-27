/* Private offline exports. Fetch a new consistent ledger snapshot for every download. */
(function (root) {
  "use strict";
  const columns = [
    "ledger",
    "id",
    "name",
    "amount",
    "currency",
    "kind",
    "date",
    "channel",
    "transaction_ref",
    "pledge_id",
    "country",
    "step_unit",
    "status",
    "reconciled_at",
    "source",
    "source_row",
    "created_at",
    "environment",
    "included_received",
    "notes",
    "evidence",
  ];
  async function pdf(report, logos = [], fonts = null) {
    const { PDFDocument, StandardFonts, rgb } = root.PDFLib;
    const doc = await PDFDocument.create();
    if (fonts) doc.registerFontkit(root.fontkit);
    const bytes = (s) => Uint8Array.from(atob(s.replace(/^data:[^,]+,/, "")), (c) => c.charCodeAt(0));
    const normal = await doc.embedFont(fonts ? bytes(fonts.regular) : StandardFonts.Helvetica);
    const bold = await doc.embedFont(fonts ? bytes(fonts.bold) : StandardFonts.HelveticaBold);
    const images = await Promise.all(logos.map((logo) => doc.embedPng(bytes(logo.data))));
    const form = doc.getForm(),
      mm = (n) => (n * 72) / 25.4;
    const navy = rgb(11 / 255, 38 / 255, 70 / 255),
      white = rgb(1, 1, 1),
      muted = rgb(0.25, 0.31, 0.37);
    const widths = [27, 76, 16, 29, 17, 21, 36, 43];
    const labels = ["Record", "Supporter", "Steps*", "Amount", "Currency", "Type", "Status", "Counts as received"];
    const count = Math.max(1, Math.ceil(report.rows.length / 14));
    const stamp = new Date(report.exportedAt).toLocaleString("en-GB", { timeZone: "Africa/Kampala" });
    for (let p = 0; p < count; p++) {
      const page = doc.addPage([mm(297), mm(210)]);
      const rect = (x, y, w, h, color) =>
        page.drawRectangle({ x: mm(x), y: mm(210 - y - h), width: mm(w), height: mm(h), color });
      const text = (s, x, y, size = 9, font = normal, color = navy) =>
        page.drawText(String(s), { x: mm(x), y: mm(210 - y), size, font, color });
      rect(0, 0, 297, 38, navy);
      text("WALK FOR EDUCATION", 16, 16, 19, bold, white);
      text("PAMODZI COMMUNITY INITIATIVE / UCU KAGANDO", 16, 25, 10, bold, white);
      text(report.scope || "NAIROBI TO KAGANDO | EVERY STEP BUILDS A FUTURE", 16, 32, 8, normal, white);
      if (images.length) {
        rect(220, 5, 61, 28, white);
        images.forEach((image, i) => {
          const scale = Math.min(18 / image.width, 23 / image.height),
            w = image.width * scale,
            h = image.height * scale;
          page.drawImage(image, {
            x: mm(222 + i * 19 + (18 - w) / 2),
            y: mm(210 - 7 - (23 - h) / 2 - h),
            width: mm(w),
            height: mm(h),
          });
        });
      }
      let summaryY = 44;
      const totals = report.totals.currencies;
      if (!totals.length) text("No recorded contributions. No opening balance inferred.", 16, summaryY, 9);
      for (let i = 0; i < totals.length; i += 2) {
        text(
          totals
            .slice(i, i + 2)
            .map(
              (c) =>
                c.currency +
                ": pledged " +
                Number(c.pledged).toLocaleString("en-UG") +
                " | received " +
                Number(c.received).toLocaleString("en-UG"),
            )
            .join("     /     "),
          16,
          summaryY,
          8,
        );
        summaryY += 3.4;
      }
      text("Private report | Exported " + stamp + " EAT | " + report.rows.length + " records", 16, 57, 7.5);
      rect(6, 61, 285, 9, rgb(0.9, 0.93, 0.96));
      let x = 6;
      labels.forEach((label, i) => {
        text(label, x + 1, 66.5, 7.5, bold);
        x += widths[i];
      });
      let y = 71;
      report.rows.slice(p * 14, p * 14 + 14).forEach((r, n) => {
        const bg = n % 2 === 0 ? rgb(0.965, 0.975, 0.985) : white;
        rect(6, y, 285, 8, bg);
        x = 6;
        const values = [
          String(r.id).slice(-17),
          r.name,
          r.step_unit > 0 ? Number((r.amount / r.step_unit).toFixed(4)) : "Unconfirmed",
          Number(r.amount).toLocaleString("en-UG"),
          r.currency,
          r.kind,
          r.status,
          r.included_received ? "YES - reconciled" : "NO",
        ];
        values.forEach((value, i) => {
          const field = form.createTextField("row_" + (p * 14 + n) + "_" + i);
          field.enableMultiline();
          field.setText(String(value ?? ""));
          field.addToPage(page, {
            x: mm(x + 0.5),
            y: mm(210 - y - 7.7),
            width: mm(widths[i] - 1),
            height: mm(7.4),
            font: normal,
            textColor: navy,
            backgroundColor: bg,
            borderWidth: 0,
          });
          field.setFontSize(8);
          if (i === 0 || i === 7) field.enableReadOnly();
          field.updateAppearances(normal);
          x += widths[i];
        });
        y += 8.2;
      });
      text(
        "*Steps are contribution units, not kilometres walked. Pledges and unverified payments are excluded from received totals.",
        16,
        190,
        7,
        normal,
        muted,
      );
      text(
        "Editable offline copy. Edits do not update the database or summary. Save changes in the console and download a fresh report.",
        16,
        195,
        7,
        normal,
        muted,
      );
      text(
        "pamodzici.com | PCI campaign operations | Fonts: MTN Brighter Sans / Sky Text, CC BY 4.0",
        16,
        202,
        7,
        normal,
        muted,
      );
      text("Page " + (p + 1) + " / " + count, 265, 202, 7, normal, muted);
    }
    form.updateFieldAppearances(normal);
    doc.setTitle("Walk for Education - Collections register");
    doc.setAuthor("Pamodzi Community Initiative");
    return doc.save();
  }
  const xml = (s) =>
    String(s ?? "")
      .split("")
      .filter((c) => c.charCodeAt(0) >= 32 || "\t\n\r".includes(c))
      .join("")
      .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
  const cell = (v, style = 0) =>
    typeof v === "number" && Number.isFinite(v)
      ? '<c s="' + style + '"><v>' + v + "</v></c>"
      : '<c s="' + style + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + "</t></is></c>";
  function sheet(rows, widths, freeze) {
    return (
      '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">' +
      (freeze ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : "") +
      "</sheetView></sheetViews><cols>" +
      widths
        .map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>')
        .join("") +
      "</cols><sheetData>" +
      rows
        .map((r, i) => '<row r="' + (i + 1) + '">' + r.map((v) => cell(v, i === 0 ? 1 : 0)).join("") + "</row>")
        .join("") +
      "</sheetData>" +
      (freeze ? '<autoFilter ref="A1:U' + rows.length + '"/>' : "") +
      "</worksheet>"
    );
  }
  /* Standards-based, uncompressed ZIP: no remote scripts, macros or executable spreadsheet formulas. */
  function zip(files) {
    const enc = new TextEncoder(),
      pieces = [],
      directory = [];
    let offset = 0,
      size = 0;
    const crc = (bytes) => {
      let c = -1;
      for (const b of bytes) {
        c ^= b;
        for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
      return (c ^ -1) >>> 0;
    };
    for (const [name, source] of Object.entries(files)) {
      const n = enc.encode(name),
        b = enc.encode(source),
        sum = crc(b);
      const header = new Uint8Array(30 + n.length),
        h = new DataView(header.buffer);
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint32(14, sum, true);
      h.setUint32(18, b.length, true);
      h.setUint32(22, b.length, true);
      h.setUint16(26, n.length, true);
      header.set(n, 30);
      pieces.push(header, b);
      const central = new Uint8Array(46 + n.length),
        d = new DataView(central.buffer);
      d.setUint32(0, 0x02014b50, true);
      d.setUint16(4, 20, true);
      d.setUint16(6, 20, true);
      d.setUint32(16, sum, true);
      d.setUint32(20, b.length, true);
      d.setUint32(24, b.length, true);
      d.setUint16(28, n.length, true);
      d.setUint32(42, offset, true);
      central.set(n, 46);
      directory.push(central);
      size += central.length;
      offset += header.length + b.length;
    }
    const end = new Uint8Array(22),
      e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true);
    e.setUint16(8, directory.length, true);
    e.setUint16(10, directory.length, true);
    e.setUint32(12, size, true);
    e.setUint32(16, offset, true);
    return new Blob([...pieces, ...directory, end], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  function xlsx(report) {
    const summary = [
      ["WALK FOR EDUCATION", "PCI - collections report"],
      ["Exported at", report.exportedAt],
      ["Scope", "Complete manual and gateway register; all environments"],
      ["Offline copy", "Update the console and export again for current totals."],
      [],
      ["Currency", "Pledged", "Received - finance reconciled", "Pending payment", "Outstanding pledge"],
    ];
    report.totals.currencies.forEach((c) =>
      summary.push([c.currency, c.pledged, c.received, c.pending, c.outstanding]),
    );
    summary.push(
      [],
      ["Counting rule", "Only included_received=yes rows count as received. Never sum unlike currencies."],
      ["Confirmed funded steps", report.totals.confirmedSteps],
    );
    const rows = [
      columns,
      ...report.rows.map((r) =>
        columns.map((c) =>
          c === "included_received"
            ? r[c]
              ? "yes"
              : "no"
            : c === "amount" || c === "step_unit"
              ? Number(r[c] || 0)
              : (r[c] ?? ""),
        ),
      ),
    ];
    return zip({
      "[Content_Types].xml":
        '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      "_rels/.rels":
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      "xl/workbook.xml":
        '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Summary" sheetId="1" r:id="rId1"/><sheet name="Register" sheetId="2" r:id="rId2"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      "xl/styles.xml":
        '<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B2646"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0" xfId="0"/><xf fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>',
      "xl/worksheets/sheet1.xml": sheet(summary, [32, 75, 38, 23, 25], false),
      "xl/worksheets/sheet2.xml": sheet(
        rows,
        columns.map((c) => (c === "name" ? 65 : /notes|evidence/.test(c) ? 70 : 25)),
        true,
      ),
    });
  }
  root.PCIReports = { pdf, xlsx };
})(typeof window === "undefined" ? globalThis : window);
