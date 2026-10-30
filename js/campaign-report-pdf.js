/* Branded public updates and private pledge confirmations. No ledger writes. */
(function (root) {
  "use strict";
  const textValue = (value) =>
    String(value ?? "")
      .replace(/[\u2010-\u2015\u2212]/g, "-")
      .replace(/[\u00a0\u202f]/g, " ");
  const money = (value) => Number(value).toLocaleString("en-UG");
  function stamp(value) {
    if (!value) return "Awaiting first finance verification";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error("The report date is unavailable. Please retry.");
    return (
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Kampala",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(date) + " EAT"
    );
  }
  async function create(data, assets, pledge) {
    if (!assets?.fonts?.regular || !assets.fonts.bold || assets.logos?.length !== 3)
      throw new Error("The approved report fonts and logos must load before downloading.");
    const { PDFDocument, rgb } = root.PDFLib;
    const doc = await PDFDocument.create();
    doc.registerFontkit(root.fontkit);
    const bytes = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
    const normal = await doc.embedFont(bytes(assets.fonts.regular), { subset: true });
    const bold = await doc.embedFont(bytes(assets.fonts.bold), { subset: true });
    const logos = await Promise.all(assets.logos.map((value) => doc.embedPng(bytes(value))));
    const ink = rgb(11 / 255, 38 / 255, 70 / 255);
    const muted = rgb(0.28, 0.33, 0.38);
    const red = rgb(0.75, 0.07, 0.2);
    const paper = rgb(0.97, 0.96, 0.94);
    const line = rgb(0.87, 0.88, 0.88);
    const white = rgb(1, 1, 1);
    const width = 595.28,
      height = 841.89,
      margin = 36,
      usable = width - margin * 2;
    let page, cursor;
    const title = pledge ? "Pledge confirmation" : "Campaign update";
    const reportDate = pledge ? data.created_at : data.reportingCutoff;
    const reportId = pledge ? data.reference : data.reportId;
    if (!reportDate || !reportId) throw new Error("Save the record before downloading its report.");
    const draw = (value, x, y, size = 10.5, font = normal, color = ink) =>
      page.drawText(textValue(value), { x, y, size, font, color });
    function fit(value, maxWidth, size = 14, font = bold) {
      const text = textValue(value);
      while (font.widthOfTextAtSize(text, size) > maxWidth && size > 8.5) size -= 0.25;
      if (font.widthOfTextAtSize(text, size) > maxWidth)
        throw new Error("A report value is too long. Please ask the campaign team to review it.");
      return size;
    }
    function addPage(first = false) {
      page = doc.addPage([width, height]);
      page.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: red });
      if (first) {
        let x = margin;
        for (const logo of logos) {
          const scale = Math.min(91 / logo.width, 43 / logo.height);
          page.drawImage(logo, { x, y: height - 73, width: logo.width * scale, height: logo.height * scale });
          x += 108;
        }
        draw(
          data.sample ? "SAMPLE DATA" : pledge ? "PRIVATE PLEDGE COPY" : "PUBLIC UPDATE",
          399,
          height - 48,
          9,
          bold,
          red,
        );
        draw("Walk for Education", margin, height - 118, 27, bold);
        draw(title + "  /  UCU Kagando", margin, height - 143, 14, bold, muted);
        draw("As of " + stamp(reportDate), margin, height - 164, 10, normal, muted);
        cursor = height - 192;
      } else {
        draw("Walk for Education  /  " + title, margin, height - 48, 15, bold);
        cursor = height - 79;
      }
    }
    function ensure(space) {
      if (cursor - space < 100) addPage();
    }
    function wrappedLines(value, font, size, maxWidth) {
      const result = [];
      for (const paragraph of textValue(value).split("\n")) {
        if (!paragraph.trim()) {
          result.push("");
          continue;
        }
        let current = "";
        for (const word of paragraph.trim().split(/\s+/)) {
          if (font.widthOfTextAtSize(word, size) > maxWidth) {
            if (current) result.push(current);
            current = "";
            for (const char of word) {
              if (font.widthOfTextAtSize(current + char, size) > maxWidth) {
                result.push(current);
                current = "";
              }
              current += char;
            }
          } else if (current && font.widthOfTextAtSize(current + " " + word, size) > maxWidth) {
            result.push(current);
            current = word;
          } else current += (current ? " " : "") + word;
        }
        if (current) result.push(current);
      }
      return result;
    }
    function paragraph(value, size = 10.5, font = normal, color = muted) {
      for (const valueLine of wrappedLines(value, font, size, usable)) {
        ensure(size * 1.45);
        draw(valueLine, margin, cursor, size, font, color);
        cursor -= size * 1.45;
      }
      cursor -= 9;
    }
    function heading(value) {
      ensure(52);
      draw(value, margin, cursor, 14, bold);
      cursor -= 23;
    }
    addPage(true);
    if (pledge) {
      if (!Number.isSafeInteger(Number(data.amount)) || Number(data.amount) <= 0 || !Number(data.steps))
        throw new Error("The saved pledge details are unavailable.");
      heading("Your promise of support");
      if (data.name) paragraph(data.name, 14, bold, ink);
      paragraph(data.steps + " steps  /  " + data.currency + " " + money(data.amount), 20, bold, ink);
      if (data.country && data.country !== "UG" && data.country !== "KE")
        paragraph("Indicative pledge amount. The campaign team will confirm your contribution amount.");
      paragraph("Pledge reference: " + data.reference, 11, bold, ink);
      if (Number(data.step_unit) > 0)
        paragraph("Recorded step price: " + data.currency + " " + money(data.step_unit) + " per sponsored step.");
      heading("Pledge confirmation - not a payment receipt");
      paragraph(
        "This document records an intention to support Walk for Education. No money was taken on the website. A pledge is separate from finance-verified funds received.",
      );
      paragraph(
        "Contribute using the approved campaign instructions and send your payment reference privately to the team so finance can match it to this pledge.",
      );
      paragraph("Sponsored steps are contribution units. They do not represent kilometres walked.");
    } else {
      if (data.audience !== "public" || !Array.isArray(data.totals?.currencies))
        throw new Error("The approved public report is unavailable.");
      heading("Collections at a glance");
      const columnWidths = [65, 153, 153, usable - 371];
      const labels = ["Currency", "Verified collected", "Total pledged", "Outstanding"];
      function tableHeader() {
        ensure(66);
        page.drawRectangle({ x: margin, y: cursor - 29, width: usable, height: 30, color: ink });
        let x = margin;
        labels.forEach((value, i) => {
          draw(value, x + 9, cursor - 18, 9, bold, white);
          x += columnWidths[i];
        });
        cursor -= 30;
      }
      tableHeader();
      for (const row of data.totals.currencies) {
        for (const key of ["received", "pledged", "outstanding"])
          if (!Number.isSafeInteger(row[key]) || row[key] < 0) throw new Error("The report figures need review.");
        if (cursor - 43 < 100) {
          addPage();
          tableHeader();
        }
        page.drawRectangle({ x: margin, y: cursor - 43, width: usable, height: 43, color: paper });
        page.drawLine({
          start: { x: margin, y: cursor - 43 },
          end: { x: width - margin, y: cursor - 43 },
          thickness: 0.5,
          color: line,
        });
        let x = margin;
        [row.currency, money(row.received), money(row.pledged), money(row.outstanding)].forEach((value, i) => {
          const size = fit(value, columnWidths[i] - 18, i ? 14 : 11);
          const right = x + columnWidths[i] - 9;
          draw(value, i ? right - bold.widthOfTextAtSize(value, size) : x + 9, cursor - 27, size, bold);
          x += columnWidths[i];
        });
        cursor -= 43;
      }
      cursor -= 20;
      if (!data.totals.currencies.length)
        paragraph(
          "No itemised receipts or pledges have been recorded in this reporting ledger. No historical opening balance is inferred.",
        );
      paragraph("Last finance verification: " + stamp(data.totals.lastReconciledAt), 9.5);
      paragraph(
        "Collected includes finance-reconciled receipts only. Pledges and unverified payments are excluded. Outstanding balances relate to their linked pledges.",
        9.5,
      );
      if (data.walk) {
        heading("Latest approved walking update");
        paragraph(data.walk.town + "  /  Update dated " + data.walk.date, 11, bold, ink);
        paragraph(
          data.walk.km +
            " km confirmed  /  " +
            data.walk.physical.replaceAll("-", " ") +
            "  /  " +
            data.walk.activity +
            " campaign",
        );
        paragraph(data.walk.story);
      } else {
        heading("Walking update");
        paragraph("The next approved walking update awaits publication. No current town or distance is inferred.");
      }
      paragraph(
        "Check the website for current figures. This PDF is a dated copy; later contributions appear in a new report.",
        9.5,
      );
    }
    const pages = doc.getPages();
    pages.forEach((p, index) => {
      page = p;
      page.drawLine({ start: { x: margin, y: 74 }, end: { x: width - margin, y: 74 }, thickness: 0.7, color: line });
      draw("pamodzici.com/walk-for-education/" + (pledge ? "" : "accountability/#collections"), margin, 57, 8.5, bold);
      draw((data.sample ? "SAMPLE DATA  /  " : "") + reportId, margin, 42, 8.5, normal, muted);
      draw("Page " + (index + 1) + " / " + pages.length, width - margin - 58, 42, 8.5, normal, muted);
      draw("Fonts: MTN Brighter Sans / Sky Text, CC BY 4.0", margin, 27, 8.5, normal, muted);
      const url = "https://pamodzici.com/walk-for-education/" + (pledge ? "" : "accountability/#collections");
      const link = doc.context.register(
        doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [margin, 52, width - margin, 69],
          Border: [0, 0, 0],
          A: { S: "URI", URI: root.PDFLib.PDFString.of(url) },
        }),
      );
      page.node.set(root.PDFLib.PDFName.of("Annots"), doc.context.obj([link]));
    });
    doc.setTitle("Walk for Education - " + title);
    doc.setAuthor("Pamodzi Community Initiative");
    doc.setSubject(
      pledge ? "Pledge only. Not a payment receipt." : "Approved public collections snapshot. " + reportId,
    );
    doc.setCreationDate(new Date(reportDate));
    doc.setModificationDate(new Date(reportDate));
    return doc.save();
  }
  root.PCICampaignPDF = {
    update: (data, assets) => create(data, assets, false),
    pledge: (data, assets) => create(data, assets, true),
  };
})(globalThis);
