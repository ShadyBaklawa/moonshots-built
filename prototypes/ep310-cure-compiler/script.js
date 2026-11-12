(() => {
  "use strict";

  const TOTAL_DISEASES = 5000;
  const COST_MIN = 2_000_000;
  const COST_MAX = 2_000_000_000;
  const LOG_MIN = Math.log10(COST_MIN);
  const LOG_MAX = Math.log10(COST_MAX);
  const SLIDER_MAX = 1000;

  // Fallback mirrors data/figures.json so the demo still works if the fetch fails.
  const FALLBACK_TISSUES = [
    { id: "liver", label: "Liver", diseases: 1200, lockedByDefault: false, note: "Lipid nanoparticles and AAV reliably reach the liver today." },
    { id: "blood", label: "Blood / bone marrow", diseases: 950, lockedByDefault: false, note: "Ex vivo editing of blood stem cells is already in clinical use." },
    { id: "eye", label: "Eye", diseases: 450, lockedByDefault: false, note: "A small, enclosed, easily injected compartment." },
    { id: "kidney", label: "Kidney", diseases: 900, lockedByDefault: true, note: "Filtration and tissue structure make durable delivery hard." },
    { id: "brain", label: "Brain (most regions)", diseases: 1500, lockedByDefault: true, note: "The blood-brain barrier blocks most delivery vehicles." }
  ];

  const costSlider = document.getElementById("cost-slider");
  const costPerDiseaseEl = document.getElementById("cost-per-disease");
  const totalCostEl = document.getElementById("total-cost");
  const legendEl = document.getElementById("legend");
  const reachableCountEl = document.getElementById("reachable-count");

  const unlocked = new Set();
  let tissues = FALLBACK_TISSUES;

  function formatMoney(n) {
    if (n >= 1_000_000_000_000) {
      return "$" + (n / 1_000_000_000_000).toFixed(2) + " trillion";
    }
    if (n >= 1_000_000_000) {
      return "$" + (n / 1_000_000_000).toFixed(2) + " billion";
    }
    if (n >= 1_000_000) {
      return "$" + (n / 1_000_000).toFixed(2) + " million";
    }
    return "$" + n.toLocaleString("en-US");
  }

  function sliderToCost(value) {
    const t = value / SLIDER_MAX;
    const logCost = LOG_MIN + t * (LOG_MAX - LOG_MIN);
    const raw = Math.pow(10, logCost);
    // Snap the extremes exactly to the cited $2M / $2B figures.
    if (value <= 0) return COST_MIN;
    if (value >= SLIDER_MAX) return COST_MAX;
    return Math.round(raw);
  }

  function updateCost() {
    const value = Number(costSlider.value);
    const cost = sliderToCost(value);
    const total = cost * TOTAL_DISEASES;
    costPerDiseaseEl.textContent = "$" + cost.toLocaleString("en-US");
    totalCostEl.textContent = formatMoney(total);
    costSlider.setAttribute("aria-valuenow", String(value));
    costSlider.setAttribute("aria-valuetext", "$" + cost.toLocaleString("en-US") + " per disease, total " + formatMoney(total));
  }

  function renderLegend() {
    legendEl.innerHTML = "";
    tissues.forEach((t) => {
      const li = document.createElement("li");
      li.tabIndex = 0;
      li.dataset.tissue = t.id;
      li.setAttribute("role", "button");
      syncLegendItem(li, t);
      li.addEventListener("click", () => toggleTissue(t.id));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTissue(t.id);
        }
      });
      legendEl.appendChild(li);
    });
  }

  function syncLegendItem(li, t) {
    const isUnlocked = unlocked.has(t.id);
    li.classList.toggle("is-unlocked", isUnlocked);
    li.classList.toggle("is-locked", !isUnlocked);
    li.setAttribute("aria-pressed", String(isUnlocked));
    li.innerHTML =
      '<span class="dot" aria-hidden="true"></span>' +
      '<span><span class="legend-name">' + t.label + "</span><br>" +
      '<span class="legend-state">' + (isUnlocked ? t.diseases.toLocaleString() + " diseases reachable" : "locked — " + t.note) + "</span></span>";
  }

  function toggleTissue(id) {
    if (unlocked.has(id)) {
      unlocked.delete(id);
    } else {
      unlocked.add(id);
    }
    applyState();
  }

  function applyState() {
    tissues.forEach((t) => {
      const isUnlocked = unlocked.has(t.id);
      document.querySelectorAll('[data-tissue="' + t.id + '"]').forEach((node) => {
        if (node.tagName === "circle") {
          node.classList.toggle("unlocked", isUnlocked);
          node.classList.toggle("locked", !isUnlocked);
        } else {
          syncLegendItem(node, t);
        }
      });
    });
    const reachable = tissues.reduce((sum, t) => sum + (unlocked.has(t.id) ? t.diseases : 0), 0);
    reachableCountEl.textContent = reachable.toLocaleString("en-US");
  }

  function initTissueClicks() {
    document.querySelectorAll(".tissue").forEach((circle) => {
      circle.setAttribute("tabindex", "0");
      circle.setAttribute("role", "button");
      const id = circle.dataset.tissue;
      const t = tissues.find((x) => x.id === id);
      circle.setAttribute("aria-label", t ? t.label + (t.lockedByDefault ? " (locked)" : " (unlocked)") : id);
      circle.addEventListener("click", () => toggleTissue(id));
      circle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTissue(id);
        }
      });
    });
  }

  function init(data) {
    tissues = data;
    tissues.forEach((t) => {
      if (!t.lockedByDefault) unlocked.add(t.id);
    });
    renderLegend();
    initTissueClicks();
    applyState();
    updateCost();
  }

  fetch("data/figures.json")
    .then((res) => {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then((data) => init(data.tissues || FALLBACK_TISSUES))
    .catch(() => init(FALLBACK_TISSUES));

  costSlider.addEventListener("input", updateCost);
})();
