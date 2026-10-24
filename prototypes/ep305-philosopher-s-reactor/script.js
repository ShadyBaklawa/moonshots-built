(() => {
  const gwInput = document.getElementById('gw');
  const gwOut = document.getElementById('gwOut');
  const plantsInput = document.getElementById('plants');
  const plantsOut = document.getElementById('plantsOut');
  const plantsEcho = document.getElementById('plantsEcho');

  const yearOut = document.getElementById('yearOut');
  const tonsOut = document.getElementById('tonsOut');
  const barsOut = document.getElementById('barsOut');
  const rack = document.getElementById('rack');

  const goldPriceInput = document.getElementById('goldPrice');
  const elecPriceInput = document.getElementById('elecPrice');
  const goldFill = document.getElementById('goldFill');
  const elecFill = document.getElementById('elecFill');
  const goldRevOut = document.getElementById('goldRevOut');
  const elecRevOut = document.getElementById('elecRevOut');

  const meterFill = document.getElementById('meterFill');
  const meterReadout = document.getElementById('meterReadout');

  const nucleusCore = document.getElementById('nucleusCore');
  const nucleusLabel = document.getElementById('nucleusLabel');
  const neutron = document.getElementById('neutron');
  const flash = document.getElementById('flash');
  const resultTag = document.getElementById('resultTag');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TROY_OZ_PER_TON = 32150.7466;
  const KG_PER_BAR = 12.44139072; // standard 400 troy oz Good Delivery gold bar
  const MAX_RACK_BARS = 48;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const fmtTons = (n) => n.toFixed(2) + ' t';

  let tonsTotal = 0;
  let year = 1;
  let yearElapsed = 0;
  let lastTs = null;
  let barsShown = 0;

  const START = { x: 40, y: 30 };
  const TARGET = { x: 200, y: 140 };

  function tonsPerYear(gw) { return gw * 2; } // company's 2025 paper: ~2 t / GW / yr

  function updateSliderLabels() {
    gwOut.textContent = parseFloat(gwInput.value).toFixed(1) + ' GW';
    const p = parseInt(plantsInput.value, 10);
    plantsOut.textContent = p + (p === 1 ? ' plant' : ' plants');
    plantsEcho.textContent = p;
  }

  function addBarToRack() {
    if (rack.children.length >= MAX_RACK_BARS) {
      let more = rack.querySelector('.rack-more');
      if (!more) {
        more = document.createElement('p');
        more.className = 'rack-more';
        more.style.cssText = 'font-family:system-ui,sans-serif;font-size:12px;color:var(--text-dim);margin:0;align-self:center;';
        rack.appendChild(more);
      }
      more.textContent = '+ more bars than we can draw…';
      return;
    }
    const bar = document.createElement('div');
    bar.className = 'rack-bar';
    rack.appendChild(bar);
  }

  function updateRevenue(gw) {
    const tpy = tonsPerYear(gw);
    const goldPrice = Math.max(0, parseFloat(goldPriceInput.value) || 0);
    const elecCentsPerKwh = Math.max(0, parseFloat(elecPriceInput.value) || 0);

    const goldRev = tpy * TROY_OZ_PER_TON * goldPrice;
    const kwhPerYear = gw * 1e6 * 8760; // GW -> kW, * hours/yr, full-time baseload (illustrative)
    const elecRev = kwhPerYear * (elecCentsPerKwh / 100);

    const max = Math.max(goldRev, elecRev, 1);
    goldFill.style.width = clamp((goldRev / max) * 100, 0, 100) + '%';
    elecFill.style.width = clamp((elecRev / max) * 100, 0, 100) + '%';
    goldRevOut.textContent = fmtMoney(goldRev);
    elecRevOut.textContent = fmtMoney(elecRev);
  }

  function updateScarcity(gw, plants) {
    const totalTons = tonsPerYear(gw) * plants;
    const lo = Math.log10(0.2);
    const hi = Math.log10(5000);
    const pct = clamp(((Math.log10(Math.max(totalTons, 0.01)) - lo) / (hi - lo)) * 100, 0, 100);
    meterFill.style.left = pct + '%';
    meterReadout.textContent = '~' + totalTons.toFixed(1) + ' tons/yr worldwide from this scenario (illustrative)';
  }

  // --- Reactor visual: decorative neutron-strike loop, independent of counters ---
  function reactorFrame(ts) {
    const gw = parseFloat(gwInput.value);
    const cycleMs = clamp(2200 / Math.sqrt(gw), 500, 2600);
    const phase = (ts % cycleMs) / cycleMs;

    if (phase < 0.65) {
      const t = phase / 0.65;
      const x = START.x + (TARGET.x - START.x) * t;
      const y = START.y + (TARGET.y - START.y) * t;
      neutron.setAttribute('transform', `translate(${x} ${y})`);
      neutron.style.opacity = '1';
      flash.setAttribute('opacity', '0');
      nucleusCore.setAttribute('fill', 'url(#mercuryGrad)');
      nucleusLabel.textContent = 'Hg';
      resultTag.setAttribute('opacity', '0');
    } else if (phase < 0.72) {
      neutron.style.opacity = '0';
      const t = (phase - 0.65) / 0.07;
      flash.setAttribute('r', String(4 + t * 56));
      flash.setAttribute('opacity', String(1 - t * 0.2));
      nucleusCore.setAttribute('fill', 'url(#goldGrad)');
      nucleusLabel.textContent = 'Au';
      resultTag.setAttribute('opacity', '1');
    } else if (phase < 0.93) {
      neutron.style.opacity = '0';
      flash.setAttribute('opacity', '0');
      nucleusCore.setAttribute('fill', 'url(#goldGrad)');
      nucleusLabel.textContent = 'Au';
      resultTag.setAttribute('opacity', '1');
    } else {
      neutron.setAttribute('transform', `translate(${START.x} ${START.y})`);
      neutron.style.opacity = '0';
      flash.setAttribute('opacity', '0');
      nucleusCore.setAttribute('fill', 'url(#mercuryGrad)');
      nucleusLabel.textContent = 'Hg';
      resultTag.setAttribute('opacity', '0');
    }
    requestAnimationFrame(reactorFrame);
  }

  function staticReactorView() {
    neutron.style.opacity = '0';
    flash.setAttribute('opacity', '0');
    nucleusCore.setAttribute('fill', 'url(#goldGrad)');
    nucleusLabel.textContent = 'Au';
    resultTag.setAttribute('opacity', '1');
  }

  // --- Counters: tons/year accumulate continuously, speeding up with GW ---
  function countersFrame(ts) {
    if (lastTs == null) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;

    const gw = parseFloat(gwInput.value);
    const tpy = tonsPerYear(gw);
    const yearDurationMs = clamp(6000 / Math.sqrt(gw), 1200, 8000);

    yearElapsed += dt;
    tonsTotal += (tpy / yearDurationMs) * dt;
    if (yearElapsed >= yearDurationMs) {
      yearElapsed -= yearDurationMs;
      year += 1;
      yearOut.textContent = String(year);
    }

    tonsOut.textContent = fmtTons(tonsTotal);
    const bars = Math.floor((tonsTotal * 1000) / KG_PER_BAR);
    if (bars !== barsShown) {
      for (let i = barsShown; i < bars; i++) addBarToRack();
      barsShown = bars;
    }
    barsOut.textContent = bars.toLocaleString('en-US');

    requestAnimationFrame(countersFrame);
  }

  function refreshAll() {
    updateSliderLabels();
    const gw = parseFloat(gwInput.value);
    const plants = parseInt(plantsInput.value, 10);
    updateRevenue(gw);
    updateScarcity(gw, plants);
  }

  gwInput.addEventListener('input', refreshAll);
  plantsInput.addEventListener('input', refreshAll);
  goldPriceInput.addEventListener('input', refreshAll);
  elecPriceInput.addEventListener('input', refreshAll);

  refreshAll();
  requestAnimationFrame(countersFrame);

  if (reducedMotion) {
    staticReactorView();
  } else {
    requestAnimationFrame(reactorFrame);
  }
})();
