/* Local Canvas PNG export. Sample data never touches an operational write route. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const sizes = { feed: [1080, 1350], story: [1080, 1920], square: [1080, 1080] };
  let snapshot = null,
    exported = false;
  const sample = () => ({
    sample: true,
    snapshotId: "SAMPLE-ONLY",
    reportingCutoff: "2026-10-24T12:00:00+03:00",
    verificationLabel: "SAMPLE DATA · NOT LIVE COLLECTIONS",
    totals: {
      currencies: [{ currency: "UGX", received: 500000, pledged: 1000000, outstanding: 500000, pending: 0 }],
      confirmedSteps: 100,
      lastReconciledAt: "2026-10-24T12:00:00+03:00",
      milestone: { label: "Sample operational milestone", amount: 25000000, currency: "UGX", remaining: 24500000 },
    },
    walk: {
      town: "Sample stage",
      km: 100,
      physical: "on-the-road",
      activity: "active",
      date: "2026-10-24",
      story: "A demonstration of a verified walking update. These figures are illustrative.",
      photo: "",
      photoAlt: "",
    },
  });
  function wrap(ctx, text, x, y, width, lineHeight, maxLines = 5) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
      if (ctx.measureText(word).width > width) {
        if (line) {
          lines.push(line);
        }
        let part = "";
        for (const char of word) {
          if (ctx.measureText(part + char).width > width) {
            lines.push(part);
            part = "";
          }
          part += char;
        }
        line = part;
        continue;
      }
      if (ctx.measureText(line + " " + word).width > width && line) {
        lines.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const px = Number(ctx.font.match(/(\d+)px/)?.[1] || 0);
      if (px > 24 && text.length <= 200) {
        ctx.font = ctx.font.replace(/\d+px/, px - 2 + "px");
        return wrap(ctx, text, x, y, width, lineHeight, maxLines);
      }
      const final = lines[maxLines - 1];
      lines[maxLines - 1] = final.slice(0, -2) + "…";
    }
    lines.slice(0, maxLines).forEach((s, i) => {
      ctx.fillText(s, x, y + i * lineHeight);
    });
    return y + Math.min(lines.length, maxLines) * lineHeight;
  }
  async function image(src) {
    const i = new Image();
    i.src = src;
    await i.decode();
    return i;
  }
  function contain(ctx, img, x, y, w, h) {
    const scale = Math.min(w / img.width, h / img.height);
    ctx.drawImage(
      img,
      x + (w - img.width * scale) / 2,
      y + (h - img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
  }
  async function draw(d, recognition) {
    const type = $("graphic-template").value,
      format = $("graphic-format").value;
    const [w, h] = sizes[format];
    const c = $("graphic");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    await Promise.all([document.fonts.load("800 64px Archivo"), document.fonts.load("400 28px Lexend")]);
    await document.fonts.ready;
    if (!document.fonts.check("800 64px Archivo") || !document.fonts.check("400 28px Lexend"))
      throw new Error("Brand fonts are unavailable; retry before downloading");
    const logos = await Promise.all([
      image("/assets/brand/pamodzi/pamodzi-logo-320.png"),
      image("/assets/walk-for-education/walk-for-education-logo.png"),
      image("/assets/walk-for-education/south-rwenzori.png"),
      image("/assets/brand/rotary/rotary-logo.png"),
    ]);
    const top = format === "story" ? 310 : 65,
      end = format === "story" ? 1600 : h - 65;
    ctx.fillStyle = "#0b2646";
    ctx.fillRect(0, 0, w, h);
    // Ratio-specific rhythm: Story has extended safe-area spacing, square a compact report grid.
    ctx.fillStyle = "#163d69";
    ctx.beginPath();
    ctx.arc(1060, h - 30, format === "square" ? 400 : 620, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(65, top, 950, 124);
    contain(ctx, logos[0], 80, top + 10, 135, 104);
    contain(ctx, logos[1], 245, top + 10, 330, 104);
    contain(ctx, logos[2], 600, top + 10, 105, 104);
    contain(ctx, logos[3], 745, top + 20, 245, 84);
    ctx.fillStyle = "#82d2ef";
    ctx.font = "600 24px Lexend";
    ctx.fillText("PAMODZI COMMUNITY INITIATIVE", 65, top + 182);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 " + (format === "square" ? 60 : 70) + "px Archivo";
    const defaults = {
      collections: "Every contribution. Accounted for.",
      weekly: "Our weekly campaign report.",
      walk: "Every step brings us closer.",
      milestone: "Progress we can stand behind.",
      thanks: "Thank you for moving education forward.",
    };
    let y =
      wrap(
        ctx,
        $("graphic-headline").value.trim() || defaults[type],
        65,
        top + 260,
        940,
        format === "square" ? 66 : 78,
        3,
      ) + 28;
    ctx.fillStyle = "#ffffff";
    const ugx = d.totals.currencies.find((t) => t.currency === "UGX");
    const currencyLines = d.totals.currencies.map((t) => t.currency + " " + Number(t.received).toLocaleString("en-UG"));
    if (type === "walk") {
      if (!d.walk) throw new Error("Publish an approved walk update before exporting this template.");
      ctx.font = "800 68px Archivo";
      ctx.fillText(d.walk.km + " km confirmed", 65, y);
      y += 68;
      ctx.font = "500 30px Lexend";
      y =
        wrap(ctx, d.walk.town + " · " + d.walk.date + " · " + d.walk.physical.replaceAll("-", " "), 65, y, 930, 42, 2) +
        15;
      ctx.font = "400 27px Lexend";
      y = wrap(ctx, d.walk.story, 65, y, 925, 40, format === "square" ? 3 : 5);
      if (d.walk.photo && format !== "square") {
        const photo = await image("/" + d.walk.photo);
        const available = end - 170 - y;
        if (available > 100) contain(ctx, photo, 65, y + 5, 950, available);
      }
    } else if (type === "thanks") {
      const s = recognition?.[0];
      ctx.font = "800 42px Archivo";
      y = wrap(ctx, s?.name || "Our anonymous supporters", 65, y, 925, 50, 4) + 18;
      ctx.font = "400 30px Lexend";
      wrap(
        ctx,
        s?.amount !== null && s?.amount !== undefined
          ? s.currency + " " + s.amount.toLocaleString("en-UG") + " · reconciled support"
          : "Your generosity supports the Walk for Education.",
        65,
        y,
        925,
        44,
        3,
      );
    } else {
      ctx.font = "600 26px Lexend";
      ctx.fillStyle = "#82d2ef";
      ctx.fillText("FINANCE-RECONCILED COLLECTIONS", 65, y);
      y += format === "square" ? 54 : 66;
      ctx.fillStyle = "#ffffff";
      const lines = currencyLines.length ? currencyLines : ["No reconciled receipts yet"];
      if (lines.length > 3)
        throw new Error("More than three reporting currencies: use the full CSV report or a focused campaign graphic.");
      for (const line of lines) {
        ctx.font = "800 66px Archivo";
        while (ctx.measureText(line).width > 930) {
          const size = Number(ctx.font.match(/\d+/)[0]);
          ctx.font = "800 " + (size - 2) + "px Archivo";
        }
        ctx.fillText(line, 65, y);
        y += format === "square" ? 62 : 72;
      }
      ctx.font = "600 30px Lexend";
      ctx.fillText(d.totals.confirmedSteps.toLocaleString("en-UG") + " confirmed sponsored steps", 65, y + 7);
      y += format === "square" ? 48 : 58;
      ctx.font = "400 25px Lexend";
      if (type === "milestone") {
        if (!d.totals.milestone)
          throw new Error("An operational milestone must be approved before this template can be exported.");
        const m = d.totals.milestone;
        wrap(
          ctx,
          m.label + " · " + m.currency + " " + m.remaining.toLocaleString("en-UG") + " remaining",
          65,
          y,
          920,
          38,
          2,
        );
      } else if (ugx) {
        wrap(
          ctx,
          "UGX " +
            ugx.pledged.toLocaleString("en-UG") +
            " pledged · UGX " +
            ugx.outstanding.toLocaleString("en-UG") +
            " outstanding on pledges",
          65,
          y,
          920,
          38,
          2,
        );
      }
    }
    ctx.fillStyle = "#82d2ef";
    ctx.fillRect(65, end - 128, 950, 2);
    ctx.font = "400 22px Lexend";
    ctx.fillText(
      "Reporting cut-off: " +
        new Date(d.reportingCutoff).toLocaleString("en-GB", {
          timeZone: "Africa/Kampala",
          dateStyle: "medium",
          timeStyle: "short",
        }) +
        " EAT",
      65,
      end - 87,
    );
    ctx.fillText(
      d.sample
        ? "SAMPLE DATA · NOT LIVE COLLECTIONS"
        : "Finance-reconciled receipts only · currencies shown separately",
      65,
      end - 48,
    );
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 25px Archivo";
    ctx.fillText("pamodzici.com/walk-for-education", 65, end);
    if (d.sample) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.36);
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 110px Archivo";
      ctx.textAlign = "center";
      ctx.fillText("SAMPLE DATA", 0, 0);
      ctx.restore();
    }
    $("graphic-label").textContent =
      (d.sample ? "SAMPLE DATA" : "Approved snapshot " + d.snapshotId) + " · " + w + " × " + h + " px";
    exported = true;
    $("graphic-download").disabled = false;
  }
  const run = (fn) => async () => {
    try {
      $("graphic-download").disabled = true;
      exported = false;
      await fn();
    } catch (e) {
      window.PCIOperations.say(e.message);
    }
  };
  $("graphic-preview").addEventListener(
    "click",
    run(async () => {
      snapshot = $("graphic-source").value === "sample" ? sample() : await window.PCIOperations.api("snapshot", {});
      const current = snapshot.sample ? null : await window.PCIOperations.api("public");
      await draw(snapshot, current?.supporters);
    }),
  );
  for (const id of ["graphic-template", "graphic-format", "graphic-headline", "graphic-source"])
    $(id).addEventListener("input", () => {
      exported = false;
      $("graphic-download").disabled = true;
    });
  $("graphic-download").addEventListener(
    "click",
    run(async () => {
      if (!snapshot) return;
      // Immutable figures + current recognition consent, including withdrawal after preview.
      if (!snapshot.sample) {
        snapshot = await window.PCIOperations.api("snapshot-read", { id: snapshot.snapshotId });
        const fresh = await window.PCIOperations.api("public");
        await draw(snapshot, fresh.supporters);
      } else await draw(snapshot, null);
      if (!exported) return;
      const blob = await new Promise((resolve) => $("graphic").toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG export failed");
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download =
        "PCI-" +
        (snapshot.sample ? "SAMPLE-" : "") +
        $("graphic-template").value +
        "-" +
        $("graphic-format").value +
        ".png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),
  );
})();
