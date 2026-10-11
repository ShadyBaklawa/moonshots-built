(() => {
  "use strict";

  const YEAR_MS = 365.25 * 24 * 3600 * 1000;
  const MAX_VIEW_YEARS = 12;

  const els = {
    startCost: document.getElementById("startCost"),
    startCostSlider: document.getElementById("startCostSlider"),
    decline: document.getElementById("decline"),
    declineSlider: document.getElementById("declineSlider"),
    coffee: document.getElementById("coffee"),
    coffeeSlider: document.getElementById("coffeeSlider"),
    presetBtns: Array.from(document.querySelectorAll(".preset-btn")),
    note: document.getElementById("activeNote"),
    crossDate: document.getElementById("crossDate"),
    crossSub: document.getElementById("crossSub"),
    strip: document.getElementById("strip"),
    svg: document.getElementById("chart"),
  };

  const layers = {
    grid: document.getElementById("gridLayer"),
    coffee: document.getElementById("coffeeLayer"),
    curve: document.getElementById("curveLayer"),
    marker: document.getElementById("markerLayer"),
    axis: document.getElementById("axisLayer"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduce-motion: reduce), (prefers-reduced-motion: reduce)").matches;

  let presets = [];
  let brownFactor = Math.sqrt(300000 / 20);

  const state = {
    startCost: 300000,
    decline: brownFactor,
    coffee: 5,
  };

  // ---------- math ----------

  function costAt(startCost, decline, t) {
    return startCost / Math.pow(decline, t);
  }

  function yearsToCross(startCost, decline, coffee) {
    if (startCost <= coffee) return 0;
    if (!(decline > 1)) return Infinity;
    return Math.log(startCost / coffee) / Math.log(decline);
  }

  function dateAfterYears(years) {
    return new Date(Date.now() + years * YEAR_MS);
  }

  function formatMoney(v) {
    if (v >= 1e6) return "$" + trimNum(v / 1e6) + "M";
    if (v >= 1e3) return "$" + trimNum(v / 1e3) + "K";
    return "$" + trimNum(v);
  }

  function trimNum(n) {
    const r = Math.round(n * 100) / 100;
    return r % 1 === 0 ? String(r) : String(r.toFixed(r * 10 % 1 === 0 ? 1 : 2));
  }

  function formatDate(d) {
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  function formatYears(y) {
    if (y < 0.08) return "almost immediately";
    if (y < 1) return Math.round(y * 12) + " months";
    const years = Math.floor(y);
    const months = Math.round((y - years) * 12);
    if (months === 0) return years + (years === 1 ? " year" : " years");
    return years + "y " + months + "mo";
  }

  // ---------- presets ----------

  async function loadPresets() {
    try {
      const res = await fetch("data/presets.json");
      presets = await res.json();
      const brown = presets.find((p) => p.id === "brown");
      if (brown) brownFactor = Math.pow(brown.startCost / brown.endCost, 1 / brown.years);
    } catch (e) {
      // bundled fallback already set via defaults above
      presets = [
        { id: "brown", label: "Noam Brown's claim", source: "as stated on the podcast", startCost: 300000, endCost: 20, years: 2, note: "$300K → $20 in 2 years." },
        { id: "mathresult", label: "This week's math result", source: "as stated on the podcast, projected", startCost: 3000000, years: null, note: "$3M, projected on Brown's curve." },
      ];
    }
    renderStrip();
  }

  function getPreset(id) {
    return presets.find((p) => p.id === id);
  }

  // ---------- controls wiring ----------

  function setActivePreset(id) {
    els.presetBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.preset === id));
  }

  function applyPreset(id) {
    if (id === "custom") {
      setActivePreset("custom");
      els.note.textContent = "Your own numbers — adjust the sliders to explore any scenario.";
      return;
    }
    const p = getPreset(id);
    if (!p) return;
    state.startCost = p.startCost;
    state.decline = p.years ? Math.pow(p.startCost / p.endCost, 1 / p.years) : brownFactor;
    syncInputsFromState();
    setActivePreset(id);
    els.note.textContent = `${p.note} (${p.source})`;
    render();
  }

  function syncInputsFromState() {
    els.startCost.value = trimNum(state.startCost);
    els.startCostSlider.value = Math.log10(state.startCost);
    els.decline.value = trimNum(state.decline);
    els.declineSlider.value = state.decline;
    els.coffee.value = trimNum(state.coffee);
    els.coffeeSlider.value = state.coffee;
  }

  function onManualEdit() {
    setActivePreset("custom");
    els.note.textContent = "Your own numbers — adjust the sliders to explore any scenario.";
  }

  function clampNum(v, min, fallback) {
    const n = parseFloat(v);
    if (!isFinite(n) || n < min) return fallback;
    return n;
  }

  els.startCost.addEventListener("input", () => {
    state.startCost = clampNum(els.startCost.value, 0.01, state.startCost);
    els.startCostSlider.value = Math.log10(Math.max(state.startCost, 1));
    onManualEdit();
    render();
  });
  els.startCostSlider.addEventListener("input", () => {
    state.startCost = Math.pow(10, parseFloat(els.startCostSlider.value));
    els.startCost.value = trimNum(state.startCost);
    onManualEdit();
    render();
  });

  els.decline.addEventListener("input", () => {
    state.decline = clampNum(els.decline.value, 1.01, state.decline);
    els.declineSlider.value = state.decline;
    onManualEdit();
    render();
  });
  els.declineSlider.addEventListener("input", () => {
    state.decline = parseFloat(els.declineSlider.value);
    els.decline.value = trimNum(state.decline);
    onManualEdit();
    render();
  });

  els.coffee.addEventListener("input", () => {
    state.coffee = clampNum(els.coffee.value, 0.5, state.coffee);
    els.coffeeSlider.value = state.coffee;
    onManualEdit();
    render();
    renderStrip();
  });
  els.coffeeSlider.addEventListener("input", () => {
    state.coffee = parseFloat(els.coffeeSlider.value);
    els.coffee.value = trimNum(state.coffee);
    onManualEdit();
    render();
    renderStrip();
  });

  els.presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });

  // ---------- chart ----------

  const svgNS = "http://www.w3.org/2000/svg";
  const PAD = { left: 70, right: 24, top: 20, bottom: 40 };
  const VB_W = 800, VB_H = 440;

  function el(tag, attrs) {
    const n = document.createElementNS(svgNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function clearLayer(g) {
    while (g.firstChild) g.removeChild(g.firstChild);
  }

  function render() {
    const { startCost, decline, coffee } = state;
    const tCrossRaw = yearsToCross(startCost, decline, coffee);
    const tCross = isFinite(tCrossRaw) ? Math.max(tCrossRaw, 0) : Infinity;

    let tMax = isFinite(tCross) ? Math.max(tCross * 1.25, 1) : MAX_VIEW_YEARS;
    tMax = Math.min(Math.max(tMax, 1), MAX_VIEW_YEARS);

    const yMax = startCost * 1.4;
    const yMin = Math.min(coffee, startCost) * 0.5;
    const logMax = Math.log10(yMax);
    const logMin = Math.log10(Math.max(yMin, 0.01));

    const plotW = VB_W - PAD.left - PAD.right;
    const plotH = VB_H - PAD.top - PAD.bottom;

    function X(t) { return PAD.left + (t / tMax) * plotW; }
    function Y(cost) {
      const l = Math.log10(Math.max(cost, 1e-6));
      const frac = (l - logMin) / (logMax - logMin);
      return PAD.top + plotH - frac * plotH;
    }

    drawGrid(logMin, logMax, tMax, X, Y);
    drawCoffeeLine(coffee, Y, plotW);
    drawCurve(startCost, decline, tMax, X, Y);
    drawMarker(tCross, coffee, tMax, X, Y);

    // readout
    if (startCost <= coffee) {
      els.crossDate.textContent = "Already there";
      els.crossSub.textContent = `${formatMoney(startCost)} is already at or below ${formatMoney(coffee)}`;
    } else if (!isFinite(tCross)) {
      els.crossDate.textContent = "Never, at this rate";
      els.crossSub.textContent = "Decline needs to be greater than 1× per year";
    } else {
      els.crossDate.textContent = formatDate(dateAfterYears(tCross));
      els.crossSub.textContent = `in about ${formatYears(tCross)}`;
    }
  }

  function drawGrid(logMin, logMax, tMax, X, Y) {
    clearLayer(layers.grid);
    clearLayer(layers.axis);

    const startPow = Math.floor(logMin);
    const endPow = Math.ceil(logMax);
    for (let p = startPow; p <= endPow; p++) {
      const val = Math.pow(10, p);
      const y = Y(val);
      if (y < PAD.top - 1 || y > VB_H - PAD.bottom + 1) continue;
      layers.grid.appendChild(el("line", {
        class: "grid-line", x1: PAD.left, x2: VB_W - PAD.right, y1: y, y2: y,
      }));
      layers.axis.appendChild(labelText(formatMoney(val), PAD.left - 10, y + 4, "end"));
    }

    const step = tMax <= 3 ? 0.5 : (tMax <= 6 ? 1 : 2);
    for (let t = 0; t <= tMax + 0.001; t += step) {
      const x = X(t);
      layers.axis.appendChild(labelText(
        (t === 0 ? "today" : "+" + trimNum(t) + "y"),
        x, VB_H - PAD.bottom + 24, "middle"
      ));
    }
    layers.axis.appendChild(labelText("← time from today", VB_W / 2, VB_H - 6, "middle", true));
  }

  function labelText(str, x, y, anchor, muted) {
    const t = el("text", { class: muted ? "axis-label" : "grid-label", x, y, "text-anchor": anchor || "start" });
    t.textContent = str;
    return t;
  }

  function drawCoffeeLine(coffee, Y, plotW) {
    clearLayer(layers.coffee);
    const y = Y(coffee);
    layers.coffee.appendChild(el("line", {
      class: "coffee-line", x1: PAD.left, x2: VB_W - PAD.right, y1: y, y2: y,
    }));
    const label = el("text", { class: "coffee-label", x: PAD.left + 6, y: y - 8, "text-anchor": "start" });
    label.textContent = `☕ cup of coffee — ${formatMoney(state.coffee)}`;
    layers.coffee.appendChild(label);
  }

  function drawCurve(startCost, decline, tMax, X, Y) {
    clearLayer(layers.curve);
    const steps = 80;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * tMax;
      const c = costAt(startCost, decline, t);
      const x = X(t), y = Y(c);
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
    }
    const path = el("path", { class: "cost-curve", d });
    layers.curve.appendChild(path);

    const len = path.getTotalLength();
    if (reduceMotion) {
      path.style.strokeDasharray = "none";
    } else {
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.getBoundingClientRect(); // force reflow
      path.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.3,.7,.2,1)";
      requestAnimationFrame(() => { path.style.strokeDashoffset = "0"; });
    }
  }

  function drawMarker(tCross, coffee, tMax, X, Y) {
    clearLayer(layers.marker);
    if (!isFinite(tCross) || tCross > tMax + 0.0001) {
      const t = el("text", { class: "past-text", x: VB_W - PAD.right, y: PAD.top + 16, "text-anchor": "end" });
      t.textContent = isFinite(tCross) ? "" : `beyond ${MAX_VIEW_YEARS}y at this rate`;
      if (t.textContent) layers.marker.appendChild(t);
      return;
    }
    const x = X(tCross), y = Y(coffee);
    layers.marker.appendChild(el("line", {
      class: "cross-guide", x1: x, x2: x, y1: y, y2: VB_H - PAD.bottom,
    }));
    layers.marker.appendChild(el("circle", { class: "cross-dot", cx: x, cy: y, r: 6 }));
    const label = el("text", {
      class: "cross-text", x: Math.min(x + 10, VB_W - PAD.right - 4), y: y - 12,
      "text-anchor": x > VB_W - 140 ? "end" : "start",
    });
    label.textContent = tCross <= 0.01 ? "already here" : formatDate(dateAfterYears(tCross));
    layers.marker.appendChild(label);
  }

  // ---------- strip ----------

  function renderStrip() {
    const cards = [];

    const brown = getPreset("brown");
    if (brown) {
      const bFactor = Math.pow(brown.startCost / brown.endCost, 1 / brown.years);
      cards.push(cardFor("Noam Brown's claim", "as stated on the podcast", brown.startCost, bFactor, false));
    }
    const math = getPreset("mathresult");
    if (math) {
      cards.push(cardFor("This week's math result", "podcast + projected", math.startCost, brownFactor, false));
    }
    cards.push(cardFor("Your scenario", "live", state.startCost, state.decline, true));

    els.strip.innerHTML = "";
    cards.forEach((c) => els.strip.appendChild(c));
  }

  function cardFor(name, tag, startCost, decline, isLive) {
    const t = yearsToCross(startCost, decline, state.coffee);
    const div = document.createElement("div");
    div.className = "strip-card" + (isLive ? " is-live" : "");
    const crossText = startCost <= state.coffee
      ? "already there"
      : (!isFinite(t) ? "never at this rate" : formatDate(dateAfterYears(t)));
    div.innerHTML = `
      <span class="tag">${tag}</span>
      <h3>${name}</h3>
      <p class="cost-line">${formatMoney(startCost)} ÷ ${trimNum(decline)}×/yr</p>
      <p class="cross">${crossText}</p>
    `;
    return div;
  }

  // ---------- init ----------

  syncInputsFromState();
  setActivePreset("brown");
  els.note.textContent = "A frontier AI result that cost “hundreds of thousands of dollars” became doable for about $20 within roughly two years — cited by Peter Diamandis, attributed to Noam Brown. (as stated on the podcast)";
  render();
  loadPresets().then(() => { render(); renderStrip(); });

  window.addEventListener("resize", render);
})();
