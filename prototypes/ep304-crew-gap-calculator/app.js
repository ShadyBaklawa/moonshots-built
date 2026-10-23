(function () {
  "use strict";

  // Fixed phase timing model: each phase is a ramp-up/ramp-down window expressed
  // as a fraction of the total build duration. This is a documented assumption
  // (see README) — the editable numbers are the peak staffing ratios below.
  var PHASES = [
    { key: "rough", label: "Rough-in", varName: "--rough", start: 0.0, peak: 0.25, end: 0.55 },
    { key: "switch", label: "Switchgear & MV", varName: "--switch", start: 0.35, peak: 0.6, end: 0.85 },
    { key: "comm", label: "Commissioning", varName: "--comm", start: 0.7, peak: 0.95, end: 1.0 }
  ];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  var REGION_DEFAULTS = { tight: 0.4, mid: 0.6, loose: 0.8 };

  var els = {
    sizeMW: document.getElementById("sizeMW"),
    targetDate: document.getElementById("targetDate"),
    region: document.getElementById("region"),
    committed: document.getElementById("committed"),
    monthsNote: document.getElementById("monthsNote"),
    ratioRough: document.getElementById("ratioRough"),
    ratioSwitch: document.getElementById("ratioSwitch"),
    ratioComm: document.getElementById("ratioComm"),
    localAvail: document.getElementById("localAvail"),
    chart: document.getElementById("chart"),
    peakNeed: document.getElementById("peakNeed"),
    peakGap: document.getElementById("peakGap"),
    gapMonths: document.getElementById("gapMonths"),
    riskBanner: document.getElementById("riskBanner"),
    tbody: document.querySelector("#breakdown tbody"),
    exportBtn: document.getElementById("exportBtn")
  };

  // Default target date: 12 months out from today.
  (function setDefaultDate() {
    var d = new Date();
    d.setMonth(d.getMonth() + 12);
    els.targetDate.value = d.toISOString().slice(0, 10);
  })();

  els.region.addEventListener("change", function () {
    els.localAvail.value = REGION_DEFAULTS[els.region.value];
    recompute();
  });

  [els.sizeMW, els.targetDate, els.committed, els.ratioRough, els.ratioSwitch, els.ratioComm, els.localAvail]
    .forEach(function (el) { el.addEventListener("input", recompute); });

  function monthsBetween(from, to) {
    var months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() >= from.getDate()) months += 0; // ignore day-of-month precision
    return months;
  }

  function phaseValueAtMonth(phase, month, N, peakValue) {
    var start = phase.start * N, peak = phase.peak * N, end = phase.end * N;
    if (month < start || month > end) return 0;
    if (month <= peak) {
      return peak > start ? peakValue * (month - start) / (peak - start) : peakValue;
    }
    return end > peak ? peakValue * (end - month) / (end - peak) : peakValue;
  }

  function monthLabel(baseDate, offset) {
    var d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }

  var lastModel = null;

  function recompute() {
    var sizeMW = parseFloat(els.sizeMW.value) || 0;
    var committed = Math.max(0, parseFloat(els.committed.value) || 0);
    var today = new Date();
    var target = new Date(els.targetDate.value);
    var N = monthsBetween(today, target);

    if (!els.targetDate.value || isNaN(target.getTime()) || N < 2) {
      els.monthsNote.textContent = "Pick an energization date at least 2 months out.";
      lastModel = null;
      renderEmpty();
      return;
    }
    N = Math.min(N, 48);
    els.monthsNote.textContent = N + " months from today to energization.";

    var ratios = {
      rough: parseFloat(els.ratioRough.value) || 0,
      switch: parseFloat(els.ratioSwitch.value) || 0,
      comm: parseFloat(els.ratioComm.value) || 0
    };
    var localAvail = Math.min(1, Math.max(0, parseFloat(els.localAvail.value) || 0));

    var months = [];
    for (var m = 0; m <= N; m++) {
      var row = { index: m, label: monthLabel(today, m), phases: {}, needed: 0 };
      PHASES.forEach(function (phase) {
        var peakValue = ratios[phase.key] * sizeMW;
        var v = phaseValueAtMonth(phase, m, N, peakValue);
        row.phases[phase.key] = v;
        row.needed += v;
      });
      row.neededRounded = Math.ceil(row.needed);
      row.gap = Math.max(0, row.neededRounded - committed);
      months.push(row);
    }

    var peakNeed = 0, peakGap = 0, peakGapMonth = null, gapMonthCount = 0;
    months.forEach(function (row) {
      if (row.neededRounded > peakNeed) peakNeed = row.neededRounded;
      if (row.gap > 0) gapMonthCount++;
      if (row.gap > peakGap) { peakGap = row.gap; peakGapMonth = row; }
    });

    lastModel = { months: months, committed: committed, peakNeed: peakNeed, peakGap: peakGap,
      peakGapMonth: peakGapMonth, gapMonthCount: gapMonthCount, localAvail: localAvail, N: N };

    renderChart(lastModel);
    renderCards(lastModel);
    renderRisk(lastModel);
    renderTable(lastModel);
  }

  function renderEmpty() {
    els.chart.innerHTML = "";
    els.peakNeed.textContent = "—";
    els.peakGap.textContent = "—";
    els.gapMonths.textContent = "—";
    els.riskBanner.className = "risk-banner";
    els.riskBanner.textContent = "";
    els.tbody.innerHTML = "";
  }

  function renderCards(model) {
    els.peakNeed.textContent = model.peakNeed + " electricians";
    els.peakGap.textContent = model.peakGap > 0 ? model.peakGap + " short" : "0 — covered";
    els.gapMonths.textContent = model.gapMonthCount + " of " + (model.N + 1);
  }

  function renderRisk(model) {
    var banner = els.riskBanner;
    if (model.peakGap <= 0) {
      banner.className = "risk-banner ok";
      banner.textContent = "On pace: your committed crew of " + model.committed +
        " covers the modeled peak demand of " + model.peakNeed + ". Re-check this monthly as scope firms up.";
      return;
    }
    var riskScore = model.peakGap / Math.max(0.15, model.localAvail);
    var tier = riskScore >= 6 ? "high" : "moderate";
    var monthLabel = model.peakGapMonth ? model.peakGapMonth.label : "?";
    banner.className = "risk-banner " + tier;
    banner.textContent = (tier === "high" ? "High schedule risk: " : "Moderate schedule risk: ") +
      "you're modeled " + model.peakGap + " electrician" + (model.peakGap === 1 ? "" : "s") +
      " short at the peak, around " + monthLabel + ", across " + model.gapMonthCount +
      " month" + (model.gapMonthCount === 1 ? "" : "s") + " total. At the region availability assumption " +
      "below, expect to recruit outside the local market to hold the energization date.";
  }

  function renderTable(model) {
    var rows = model.months.map(function (row) {
      var cls = row.gap > 0 ? ' class="gap-row"' : "";
      return "<tr" + cls + "><td>" + row.label + "</td>" +
        "<td>" + row.phases.rough.toFixed(1) + "</td>" +
        "<td>" + row.phases.switch.toFixed(1) + "</td>" +
        "<td>" + row.phases.comm.toFixed(1) + "</td>" +
        "<td>" + row.neededRounded + "</td>" +
        "<td>" + model.committed + "</td>" +
        "<td>" + row.gap + "</td></tr>";
    });
    els.tbody.innerHTML = rows.join("");
  }

  function renderChart(model) {
    var svg = els.chart;
    var months = model.months;
    var N = months.length;
    var barW = 26, gap = 6;
    var width = Math.max(560, N * (barW + gap) + 60);
    var height = 240;
    var padL = 44, padB = 24, padT = 10;
    var maxVal = Math.max(model.peakNeed, model.committed, 1) * 1.15;
    var plotH = height - padB - padT;

    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);

    function y(v) { return padT + plotH - (v / maxVal) * plotH; }

    var colorLine = cssVar("--line");
    var colorTextDim = cssVar("--text-dim");
    var colorText = cssVar("--text");
    var colorGap = cssVar("--gap-color");

    var parts = [];

    // y-axis gridlines + labels
    var ticks = 4;
    for (var t = 0; t <= ticks; t++) {
      var val = Math.round((maxVal / ticks) * t);
      var yy = y(val);
      parts.push('<line x1="' + padL + '" y1="' + yy + '" x2="' + width + '" y2="' + yy +
        '" stroke="' + colorLine + '" stroke-width="1" />');
      parts.push('<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="' + colorTextDim + '">' + val + '</text>');
    }

    months.forEach(function (row, i) {
      var x = padL + 8 + i * (barW + gap);
      var yCursor = y(0);
      PHASES.forEach(function (phase) {
        var v = row.phases[phase.key];
        if (v <= 0) return;
        var h = (v / maxVal) * plotH;
        yCursor -= h;
        parts.push('<rect x="' + x + '" y="' + yCursor + '" width="' + barW + '" height="' + h +
          '" fill="' + cssVar(phase.varName) + '" />');
      });
      if (row.gap > 0) {
        var gapTop = y(row.neededRounded);
        var gapBottom = y(model.committed);
        parts.push('<rect x="' + x + '" y="' + gapTop + '" width="' + barW + '" height="' + (gapBottom - gapTop) +
          '" fill="' + colorGap + '" opacity="0.35" />');
      }
      if (i % Math.ceil(N / 12 || 1) === 0 || i === N - 1) {
        parts.push('<text x="' + (x + barW / 2) + '" y="' + (height - 6) + '" text-anchor="middle" font-size="10" fill="' + colorTextDim + '">' + row.label + '</text>');
      }
    });

    var committedY = y(model.committed);
    parts.unshift('<line x1="' + padL + '" y1="' + committedY + '" x2="' + width + '" y2="' + committedY +
      '" stroke="' + colorText + '" stroke-width="2" stroke-dasharray="6,4" />');

    svg.innerHTML = parts.join("");
  }

  function dominantPhase(row) {
    var best = null, bestVal = -1;
    PHASES.forEach(function (phase) {
      if (row.phases[phase.key] > bestVal) { bestVal = row.phases[phase.key]; best = phase; }
    });
    return best;
  }

  var ROLE_COPY = {
    rough: {
      title: "Journeyman Electricians — Data Center Rough-In",
      bullets: [
        "Pull and terminate branch and feeder circuits per spec on an active data center build",
        "Read and work from electrical construction drawings and panel schedules",
        "Valid journeyman electrician license in the work state",
        "OSHA 10 (OSHA 30 preferred) and site safety orientation on day one"
      ]
    },
    switch: {
      title: "Licensed Master/Journeyman Electricians — Switchgear & Medium Voltage",
      bullets: [
        "Install and terminate medium-voltage switchgear, UPS, and distribution gear",
        "Comfortable with lockout/tagout and energized-equipment procedures (NFPA 70E)",
        "Prior data center, substation, or industrial MV experience strongly preferred",
        "Master or journeyman electrician license in the work state"
      ]
    },
    comm: {
      title: "Licensed Electricians — Commissioning & Energization Support",
      bullets: [
        "Support integrated systems testing and energization on a live data center build",
        "Troubleshoot punch-list electrical issues against drawings and RFIs under schedule pressure",
        "Prior commissioning or energization experience on critical facilities a plus",
        "Licensed electrician, available for compressed-schedule shifts through energization"
      ]
    }
  };

  els.exportBtn.addEventListener("click", function () {
    if (!lastModel || lastModel.peakGap <= 0) {
      alert("No shortfall is modeled at your current inputs — nothing to post. Adjust the inputs to see a gap.");
      return;
    }
    var row = lastModel.peakGapMonth;
    var phase = dominantPhase(row);
    var role = ROLE_COPY[phase.key];
    var regionLabel = els.region.options[els.region.selectedIndex].text;

    var text = "[DRAFT — edit before posting. Generated by the Livewire Bench Crew Gap Calculator.]\n\n" +
      role.title + "\n" +
      "Location: " + regionLabel + " (data center construction site)\n" +
      "Headcount needed: " + lastModel.peakGap + " beyond your current committed crew of " + lastModel.committed + "\n" +
      "Target start: around " + row.label + ", ahead of a modeled energization window in " +
      lastModel.months[lastModel.months.length - 1].label + "\n\n" +
      "About the project:\n" +
      "A " + (els.sizeMW.value || "?") + " MW data center build needs additional licensed electrical " +
      "crew to hold its energization date. This role sits in the " + phase.label.toLowerCase() + " phase of the build.\n\n" +
      "What you'll do:\n" +
      role.bullets.map(function (b) { return "- " + b; }).join("\n") + "\n\n" +
      "Note: this draft is generated from the project's own planning inputs and editable staffing " +
      "assumptions in the calculator — it is a starting point for a real job post, not a verified labor-market figure.\n";

    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "crew-gap-job-description.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  recompute();
})();
