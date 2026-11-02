(function () {
  "use strict";

  const DEFAULTS = {
    foundryMargin: 50,
    chipMargin: 83,
    labMargin: 83,
    costBase: 100, // cents -> $1.00
    chipShare: 60
  };

  const RMAX = 150;
  const K = 12;
  const CENTER = 180;

  const els = {
    foundryMargin: document.getElementById("foundryMargin"),
    chipMargin: document.getElementById("chipMargin"),
    labMargin: document.getElementById("labMargin"),
    costBase: document.getElementById("costBase"),
    chipShare: document.getElementById("chipShare"),
    foundryMarginVal: document.getElementById("foundryMarginVal"),
    chipMarginVal: document.getElementById("chipMarginVal"),
    labMarginVal: document.getElementById("labMarginVal"),
    costBaseVal: document.getElementById("costBaseVal"),
    chipShareVal: document.getElementById("chipShareVal"),
    chipMarginRow: document.getElementById("chipMarginRow"),
    labMarginRow: document.getElementById("labMarginRow"),
    foundryMergedNote: document.getElementById("foundryMergedNote"),
    chipMergedNote: document.getElementById("chipMergedNote"),
    tokenPrice: document.getElementById("tokenPrice"),
    legend: document.getElementById("legend"),
    ledger: document.getElementById("ledger"),
    integrateBtn: document.getElementById("integrateBtn"),
    resetBtn: document.getElementById("resetBtn"),
    barManufacturing: document.getElementById("barManufacturing"),
    barMarkup: document.getElementById("barMarkup"),
    manufacturingPct: document.getElementById("manufacturingPct"),
    markupPct: document.getElementById("markupPct"),
    ringsGroup: document.getElementById("ringsGroup")
  };

  let mergeLevel = 0;
  let ledgerEntries = [];

  const RING_SPECS = [
    { key: "tokenPrice", id: "ringLab", fill: "var(--lab)", stroke: "var(--lab-line)" },
    { key: "chipPrice", id: "ringChip", fill: "var(--chip)", stroke: "var(--chip-line)" },
    { key: "foundryPrice", id: "ringFoundry", fill: "var(--foundry)", stroke: "var(--foundry-line)" },
    { key: "C", id: "ringCore", fill: "var(--core)", stroke: "var(--core-line)" }
  ];

  function buildRings() {
    RING_SPECS.forEach((spec) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("id", spec.id);
      circle.setAttribute("cx", CENTER);
      circle.setAttribute("cy", CENTER);
      circle.setAttribute("r", 0);
      circle.setAttribute("fill", spec.fill);
      circle.setAttribute("stroke", spec.stroke);
      circle.setAttribute("stroke-width", "2");
      circle.classList.add("ring-layer");
      els.ringsGroup.appendChild(circle);
    });
  }

  function radiusFor(price) {
    return RMAX * price / (price + K);
  }

  function getSliderValues() {
    return {
      foundryMargin: Number(els.foundryMargin.value) / 100,
      chipMargin: Number(els.chipMargin.value) / 100,
      labMargin: Number(els.labMargin.value) / 100,
      costBase: Number(els.costBase.value) / 100,
      chipShare: Number(els.chipShare.value) / 100
    };
  }

  function calcPrices(vals, level) {
    const C = vals.costBase;
    const foundryPrice = level >= 1 ? C : C / (1 - vals.foundryMargin);
    const chipPrice = level >= 2 ? foundryPrice : foundryPrice / (1 - vals.chipMargin);
    const labCost = chipPrice / vals.chipShare;
    const tokenPrice = labCost / (1 - vals.labMargin);
    return { C, foundryPrice, chipPrice, labCost, tokenPrice };
  }

  function money(n) {
    return "$" + n.toFixed(2);
  }

  function updateSliderLabels() {
    els.foundryMarginVal.textContent = els.foundryMargin.value + "%";
    els.chipMarginVal.textContent = els.chipMargin.value + "%";
    els.labMarginVal.textContent = els.labMargin.value + "%";
    els.costBaseVal.textContent = money(Number(els.costBase.value) / 100);
    els.chipShareVal.textContent = els.chipShare.value + "%";
  }

  function updateMergeUI() {
    const foundryMerged = mergeLevel >= 1;
    const chipMerged = mergeLevel >= 2;

    els.foundryMargin.disabled = foundryMerged;
    els.chipMarginRow.classList.toggle("merged", foundryMerged);
    els.foundryMergedNote.hidden = !foundryMerged;

    els.chipMargin.disabled = chipMerged;
    els.labMarginRow.classList.toggle("merged", chipMerged);
    els.chipMergedNote.hidden = !chipMerged;

    if (mergeLevel === 0) {
      els.integrateBtn.textContent = "⚡ Merge Foundry + Chipmaker";
      els.integrateBtn.disabled = false;
    } else if (mergeLevel === 1) {
      els.integrateBtn.textContent = "⚡ Merge Chipmaker + AI Lab";
      els.integrateBtn.disabled = false;
    } else {
      els.integrateBtn.textContent = "✅ Fully integrated";
      els.integrateBtn.disabled = true;
    }
  }

  function renderLedger() {
    if (ledgerEntries.length === 0) {
      els.ledger.innerHTML = '<p class="empty">No layers merged yet. Click “vertically integrate” to see the squeeze.</p>';
      return;
    }
    const items = ledgerEntries
      .map((entry) => `<li>${entry}</li>`)
      .join("");
    els.ledger.innerHTML = `<ul>${items}</ul>`;
  }

  function renderLegend(prices, vals) {
    const rows = [
      {
        swatch: "swatch-core",
        label: "Manufacturing (cost base)",
        value: money(prices.C)
      },
      {
        swatch: "swatch-foundry",
        label: mergeLevel >= 1 ? "Foundry (merged, at cost)" : `Foundry (${els.foundryMargin.value}% margin)`,
        value: money(prices.foundryPrice)
      },
      {
        swatch: "swatch-chip",
        label: mergeLevel >= 2 ? "Chipmaker (merged, at cost)" : `Chipmaker (${els.chipMargin.value}% margin)`,
        value: money(prices.chipPrice)
      },
      {
        swatch: "swatch-lab",
        label: `AI Lab (${els.labMargin.value}% margin)`,
        value: money(prices.tokenPrice)
      }
    ];
    els.legend.innerHTML = rows
      .map(
        (r) =>
          `<div class="legend-row"><span><i class="swatch ${r.swatch}"></i>${r.label}</span><span>${r.value}</span></div>`
      )
      .join("");
  }

  function renderRings(prices) {
    document.getElementById("ringCore").setAttribute("r", radiusFor(prices.C));
    document.getElementById("ringFoundry").setAttribute("r", radiusFor(prices.foundryPrice));
    document.getElementById("ringChip").setAttribute("r", radiusFor(prices.chipPrice));
    document.getElementById("ringLab").setAttribute("r", radiusFor(prices.tokenPrice));
  }

  function renderBreakdown(prices) {
    const manufacturingShare = Math.max(0, Math.min(1, prices.C / prices.tokenPrice));
    const markupShare = 1 - manufacturingShare;
    els.barManufacturing.style.width = (manufacturingShare * 100).toFixed(1) + "%";
    els.barMarkup.style.width = (markupShare * 100).toFixed(1) + "%";
    els.manufacturingPct.textContent = (manufacturingShare * 100).toFixed(0) + "%";
    els.markupPct.textContent = (markupShare * 100).toFixed(0) + "%";
  }

  function renderAll() {
    updateSliderLabels();
    updateMergeUI();
    const vals = getSliderValues();
    const prices = calcPrices(vals, mergeLevel);
    els.tokenPrice.textContent = money(prices.tokenPrice);
    renderRings(prices);
    renderLegend(prices, vals);
    renderBreakdown(prices);
    renderLedger();
  }

  function onIntegrateClick() {
    if (mergeLevel >= 2) return;
    const vals = getSliderValues();
    const before = calcPrices(vals, mergeLevel).tokenPrice;
    const label = mergeLevel === 0 ? "Foundry + Chipmaker" : "Chipmaker + AI Lab";
    mergeLevel += 1;
    const after = calcPrices(vals, mergeLevel).tokenPrice;
    ledgerEntries.push(
      `Merged <strong>${label}</strong>: ${money(before)} &rarr; ${money(after)}`
    );
    renderAll();
  }

  function onResetClick() {
    mergeLevel = 0;
    ledgerEntries = [];
    els.foundryMargin.value = DEFAULTS.foundryMargin;
    els.chipMargin.value = DEFAULTS.chipMargin;
    els.labMargin.value = DEFAULTS.labMargin;
    els.costBase.value = DEFAULTS.costBase;
    els.chipShare.value = DEFAULTS.chipShare;
    renderAll();
  }

  [els.foundryMargin, els.chipMargin, els.labMargin, els.costBase, els.chipShare].forEach((input) => {
    input.addEventListener("input", renderAll);
  });
  els.integrateBtn.addEventListener("click", onIntegrateClick);
  els.resetBtn.addEventListener("click", onResetClick);

  buildRings();
  renderAll();
})();
