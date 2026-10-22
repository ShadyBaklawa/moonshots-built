(() => {
  "use strict";

  const FALLBACK_FIGURES = {
    kids_count: 72000000,
    total_gift_usd: 10500000000,
    spacex_gift_per_kid_usd: 146,
    spacex_share_price_usd: 1408,
    dell_gift_per_kid_usd: 250,
    birth_dividend_usd: 2000,
    assets: [
      { id: "spacex", label: "SpaceX fractional share", principal: 146,
        blurb: "Elon pledged a ~$146 SpaceX stake (about a tenth of one $1,408 share) to every American kid via a Trump account." },
      { id: "dividend", label: "Birth dividend", principal: 2000,
        blurb: "Chamath proposed a locked $2,000 cash dividend at birth instead, left to compound untouched." }
    ],
    growth_presets: [
      { id: "conservative", label: "S&P 500 average", rate: 0.07, note: "as stated on the podcast as the sober baseline comparison" },
      { id: "bullish", label: "Elon's bullish SpaceX case", rate: 0.20, note: "illustrative scenario floated on the episode, not a forecast" },
      { id: "moonshot", label: "Chamath's \"orders of magnitude\" bet", rate: 0.45, note: "speculative framing from the episode — definitely not financial advice" }
    ]
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CURRENT_YEAR = new Date().getFullYear();

  const state = {
    figures: FALLBACK_FIGURES,
    birthYear: 2026,
    assetId: "spacex",
    rate: 0.20,
    sellAge: 18,
    sold: false,
    animProgress: 1
  };

  const els = {
    birthYear: document.getElementById("birthYear"),
    birthYearOut: document.getElementById("birthYearOut"),
    birthYearHint: document.getElementById("birthYearHint"),
    heldYearLabel: document.getElementById("heldYearLabel"),
    sellYearLabel: document.getElementById("sellYearLabel"),
    assetToggle: document.getElementById("assetToggle"),
    assetBlurb: document.getElementById("assetBlurb"),
    presetGroup: document.getElementById("presetGroup"),
    rateSlider: document.getElementById("rateSlider"),
    rateOut: document.getElementById("rateOut"),
    sellAge: document.getElementById("sellAge"),
    sellAgeOut: document.getElementById("sellAgeOut"),
    sellAgeLabel: document.getElementById("sellAgeLabel"),
    sellBtn: document.getElementById("sellBtn"),
    resetBtn: document.getElementById("resetBtn"),
    heldValue: document.getElementById("heldValue"),
    soldValue: document.getElementById("soldValue"),
    forfeitValue: document.getElementById("forfeitValue"),
    forfeitMultiple: document.getElementById("forfeitMultiple"),
    factsList: document.getElementById("factsList"),
    chart: document.getElementById("chart")
  };

  const ctx = els.chart.getContext("2d");

  function formatMoney(n) {
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    const units = [
      [1e18, "Qi"], [1e15, "Qa"], [1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]
    ];
    for (const [val, suffix] of units) {
      if (n >= val) {
        const num = n / val;
        const digits = num >= 100 ? 0 : num >= 10 ? 1 : 2;
        return sign + "$" + num.toFixed(digits) + suffix;
      }
    }
    return sign + "$" + n.toFixed(n < 10 ? 2 : 0);
  }

  function principal() {
    const asset = state.figures.assets.find(a => a.id === state.assetId) || state.figures.assets[0];
    return asset.principal;
  }

  function valueAt(age) {
    return principal() * Math.pow(1 + state.rate, age);
  }

  const REINVEST_RATE = 0.05;

  function heldAt65() { return valueAt(65); }
  function soldAt(age) { return valueAt(age); }

  // Cash from an early sale isn't assumed to sit at $0 growth — it earns a modest
  // reinvestment rate from the sale age onward (simulated, see chart hint).
  function soldCashAt(saleAge, atAge) {
    const proceeds = valueAt(saleAge);
    if (atAge <= saleAge) return proceeds;
    return proceeds * Math.pow(1 + REINVEST_RATE, atAge - saleAge);
  }

  function yearAt(age) { return state.birthYear + age; }
  function currentAge() { return Math.max(0, Math.min(65, CURRENT_YEAR - state.birthYear)); }

  function renderBirthYearHint() {
    els.birthYearHint.textContent = `Born in ${state.birthYear} → turns 65 in ${yearAt(65)}. ` +
      `Today (${CURRENT_YEAR}) they'd be ${currentAge()}.`;
  }

  function renderAssetUI() {
    const asset = state.figures.assets.find(a => a.id === state.assetId) || state.figures.assets[0];
    els.assetBlurb.textContent = asset.blurb;
    [...els.assetToggle.querySelectorAll(".seg-btn")].forEach(btn => {
      const active = btn.dataset.asset === state.assetId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-checked", String(active));
    });
  }

  function renderPresets() {
    els.presetGroup.innerHTML = "";
    state.figures.growth_presets.forEach(preset => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-btn";
      btn.textContent = preset.label + " (" + Math.round(preset.rate * 100) + "%)";
      btn.title = preset.note;
      btn.addEventListener("click", () => {
        state.rate = preset.rate;
        els.rateSlider.value = String(Math.round(preset.rate * 100));
        syncPresetActive();
        updateRateOut();
        triggerRedraw();
      });
      els.presetGroup.appendChild(btn);
    });
    syncPresetActive();
  }

  function syncPresetActive() {
    const ratePct = Math.round(state.rate * 100);
    [...els.presetGroup.querySelectorAll(".preset-btn")].forEach((btn, i) => {
      const preset = state.figures.growth_presets[i];
      btn.classList.toggle("active", Math.round(preset.rate * 100) === ratePct);
    });
  }

  function renderFacts() {
    const f = state.figures;
    const kidsM = (f.kids_count / 1e6).toFixed(0);
    const totalB = (f.total_gift_usd / 1e9).toFixed(1);
    els.factsList.innerHTML = "";
    const items = [
      `Elon pledged roughly $${f.spacex_gift_per_kid_usd} of SpaceX stock to each of ${kidsM} million American kids — about $${totalB}B total.`,
      `A full SpaceX share was valued around $${f.spacex_share_price_usd.toLocaleString()}, so each kid's gift is a sliver of one share.`,
      `Chamath countered with a simpler idea: lock a $${f.birth_dividend_usd.toLocaleString()} cash dividend at birth instead of stock.`,
      `Michael Dell floated a $${f.dell_gift_per_kid_usd}/kid version too — the hosts debated who should fund it and whether kids would just cash out.`
    ];
    items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      els.factsList.appendChild(li);
    });
  }

  function updateRateOut() {
    els.rateOut.textContent = Math.round(state.rate * 100) + "%/yr";
  }

  // ---- Chart ----
  const PAD = { left: 78, right: 22, top: 24, bottom: 40 };

  function logScale(value, yMin, yMax, plotH) {
    const lv = Math.log10(Math.max(value, yMin));
    const t = (lv - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
    return PAD.top + plotH * (1 - clamp01(t));
  }

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }

  function drawChart() {
    const w = els.chart.width, h = els.chart.height;
    const plotW = w - PAD.left - PAD.right;
    const plotH = h - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, w, h);

    const held65 = heldAt65();
    const soldReinvested65 = soldCashAt(state.sellAge, 65);
    const yMin = Math.max(10, principal() * 0.8);
    const yMax = Math.max(held65, soldReinvested65) * 1.15;

    // grid lines (log decades)
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillStyle = "#9aa1d9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const startDecade = Math.floor(Math.log10(yMin));
    const endDecade = Math.ceil(Math.log10(yMax));
    for (let d = startDecade; d <= endDecade; d++) {
      const val = Math.pow(10, d);
      if (val < yMin * 0.99 || val > yMax * 1.01) continue;
      const y = logScale(val, yMin, yMax, plotH);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(w - PAD.right, y);
      ctx.stroke();
      ctx.fillText(formatMoney(val), PAD.left - 10, y);
    }

    // x axis ticks every ~10 years
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let age = 0; age <= 65; age += 10) {
      const x = PAD.left + (age / 65) * plotW;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, h - PAD.bottom);
      ctx.stroke();
      ctx.fillStyle = "#9aa1d9";
      ctx.fillText("age " + age, x, h - PAD.bottom + 10);
    }
    // ensure 65 tick
    const x65 = PAD.left + plotW;
    ctx.fillText("age 65", x65, h - PAD.bottom + 10);

    const progressAge = reduceMotion ? 65 : 65 * state.animProgress;

    function pointFor(age) {
      const x = PAD.left + (age / 65) * plotW;
      const y = logScale(valueAt(age), yMin, yMax, plotH);
      return [x, y];
    }

    // Held curve (gold) up to progressAge
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffcc66";
    ctx.beginPath();
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const age = (i / steps) * Math.min(65, progressAge);
      const [x, y] = pointFor(age);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (state.sold && progressAge >= state.sellAge) {
      // Forfeited continuation (dashed red) from sellAge to min(65, progressAge)
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const endAge = Math.min(65, progressAge);
      for (let i = 0; i <= steps; i++) {
        const age = state.sellAge + (i / steps) * (endAge - state.sellAge);
        if (age < state.sellAge) continue;
        const [x, y] = pointFor(age);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Sold cash line (cyan), reinvested at REINVEST_RATE from sellAge to min(65, progressAge)
      function cashPointFor(age) {
        const x = PAD.left + (age / 65) * plotW;
        const y = logScale(soldCashAt(state.sellAge, age), yMin, yMax, plotH);
        return [x, y];
      }
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#5ee6ff";
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const age = state.sellAge + (i / steps) * (endAge - state.sellAge);
        const [x, y] = cashPointFor(age);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // marker dot at sell point
      const [sx, sy] = cashPointFor(state.sellAge);
      ctx.fillStyle = "#5ee6ff";
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // sell-age vertical marker
    const [mx] = pointFor(state.sellAge);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, PAD.top);
    ctx.lineTo(mx, h - PAD.bottom);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#e9ecff";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("sells here → age " + state.sellAge + " (" + yearAt(state.sellAge) + ")", mx, PAD.top - 6 >= 10 ? PAD.top + 14 : PAD.top + 14);

    // "today" marker: where this birth year actually places the kid right now
    const todayAge = currentAge();
    const [tx] = pointFor(todayAge);
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "rgba(94, 230, 255, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, PAD.top);
    ctx.lineTo(tx, h - PAD.bottom);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#9fe9ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("today · age " + todayAge, tx, h - PAD.bottom - 44);

    // rocket/cradle marker at head of held curve
    if (progressAge < 65 || !state.sold) {
      const headAge = Math.min(65, progressAge);
      const [hx, hy] = pointFor(headAge);
      ctx.font = "20px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(state.assetId === "spacex" ? "🚀" : "🍼", hx, hy);
    }
  }

  let animHandle = null;
  function triggerRedraw() {
    updateDerived();
    if (reduceMotion) {
      state.animProgress = 1;
      drawChart();
      return;
    }
    if (animHandle) cancelAnimationFrame(animHandle);
    const start = performance.now();
    const duration = 900;
    state.animProgress = 0;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      state.animProgress = 1 - Math.pow(1 - t, 3);
      drawChart();
      if (t < 1) {
        animHandle = requestAnimationFrame(step);
      }
    }
    animHandle = requestAnimationFrame(step);
  }

  function updateDerived() {
    const held = heldAt65();
    const sold = soldAt(state.sellAge);
    const soldReinvestedTo65 = soldCashAt(state.sellAge, 65);
    const forfeit = Math.max(0, held - soldReinvestedTo65);
    els.heldValue.textContent = formatMoney(held);
    els.soldValue.textContent = formatMoney(sold);
    els.sellAgeLabel.textContent = String(state.sellAge);
    els.heldYearLabel.textContent = `(year ${yearAt(65)})`;
    els.sellYearLabel.textContent = `(year ${yearAt(state.sellAge)})`;
    if (state.sold) {
      els.forfeitValue.textContent = formatMoney(forfeit);
      const multiple = soldReinvestedTo65 > 0 ? (held / soldReinvestedTo65) : 0;
      els.forfeitMultiple.textContent = multiple >= 1.05
        ? `That's ${multiple.toFixed(1)}× more than the cash would be worth by 65, even reinvested at ${Math.round(REINVEST_RATE * 100)}%/yr.`
        : "Selling this late barely costs anything — most of the growth was already captured.";
    } else {
      els.forfeitValue.textContent = "—";
      els.forfeitMultiple.textContent = "Hasn't sold yet. Click “Sell now” to see what's forfeited.";
    }
  }

  function bindEvents() {
    els.birthYear.addEventListener("input", () => {
      state.birthYear = Number(els.birthYear.value);
      els.birthYearOut.textContent = String(state.birthYear);
      renderBirthYearHint();
      drawChart();
      updateDerived();
    });

    els.assetToggle.querySelectorAll(".seg-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.assetId = btn.dataset.asset;
        renderAssetUI();
        triggerRedraw();
      });
    });

    els.rateSlider.addEventListener("input", () => {
      state.rate = Number(els.rateSlider.value) / 100;
      updateRateOut();
      syncPresetActive();
      triggerRedraw();
    });

    els.sellAge.addEventListener("input", () => {
      state.sellAge = Number(els.sellAge.value);
      els.sellAgeOut.textContent = String(state.sellAge);
      drawChart();
      updateDerived();
    });

    els.sellBtn.addEventListener("click", () => {
      state.sold = true;
      triggerRedraw();
    });

    els.resetBtn.addEventListener("click", () => {
      state.sold = false;
      triggerRedraw();
    });
  }

  // ---- Starfield background ----
  function initStars() {
    const canvas = document.getElementById("stars");
    const sctx = canvas.getContext("2d");
    let stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.2
      }));
    }

    function render(time) {
      sctx.clearRect(0, 0, canvas.width, canvas.height);
      sctx.fillStyle = "#e9ecff";
      const t = time / 1000;
      for (const s of stars) {
        const twinkle = reduceMotion ? 0.8 : 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        sctx.globalAlpha = 0.25 + twinkle * 0.6;
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sctx.fill();
      }
      sctx.globalAlpha = 1;
      if (!reduceMotion) requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(render);
  }

  async function loadFigures() {
    try {
      const res = await fetch("data/figures.json");
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      state.figures = data;
    } catch (e) {
      state.figures = FALLBACK_FIGURES;
    }
  }

  async function init() {
    initStars();
    await loadFigures();
    state.rate = state.figures.growth_presets[1].rate;
    els.rateSlider.value = String(Math.round(state.rate * 100));
    updateRateOut();
    renderAssetUI();
    renderPresets();
    renderFacts();
    renderBirthYearHint();
    bindEvents();
    triggerRedraw();
  }

  init();
})();
