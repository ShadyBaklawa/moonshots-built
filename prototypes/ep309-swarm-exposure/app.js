(() => {
  "use strict";

  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const exposeBtn = document.getElementById("exposeBtn");
  const futureSlider = document.getElementById("futureSlider");
  const futureState = document.getElementById("futureState");
  const frameCountEl = document.getElementById("frameCount");
  const satCountEl = document.getElementById("satCount");
  const satLabelEl = document.getElementById("satLabel");
  const trailCountEl = document.getElementById("trailCount");

  const TOTAL_FRAMES = 578;
  const TOTAL_TRAILS = 15000;
  const TOTAL_SATS = 1400;
  const FUTURE_MAX = 60000; // illustrative projection, not a measurement

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- deterministic RNG so the scene is stable across redraws/resizes ---
  function mulberry32(seed) {
    return function () {
      seed += 0x6d2b79f5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- static starfield (relative coords) ---
  const stars = (() => {
    const rng = mulberry32(42);
    const list = [];
    for (let i = 0; i < 190; i++) {
      list.push({
        x: rng(),
        y: rng() * 0.72,
        r: 0.4 + rng() * 1.3,
        a: 0.25 + rng() * 0.6,
      });
    }
    return list;
  })();

  // --- baseline "today" satellite trail lines, biased into a band ---
  const baselineLines = (() => {
    const rng = mulberry32(1337);
    const list = [];
    const count = 650;
    for (let i = 0; i < count; i++) {
      const scattered = rng() < 0.12;
      const bandY = 0.3 + rng() * 0.26;
      const y = scattered ? 0.08 + rng() * 0.55 : bandY;
      const len = 0.05 + rng() * 0.16;
      const x1 = rng() * (1 - len);
      const angle = (rng() - 0.5) * 0.09;
      const x2 = x1 + len;
      const y2 = y + len * angle;
      const warm = rng() < 0.15;
      list.push({
        x1, y1: y, x2, y2,
        a: 0.14 + rng() * 0.3,
        hue: warm ? "255,221,170" : "180,225,255",
      });
    }
    return list;
  })();

  // --- future / sun-synchronous ring lines: tight horizon band, illustrative ---
  const futureLines = (() => {
    const rng = mulberry32(9001);
    const list = [];
    const count = 1400;
    for (let i = 0; i < count; i++) {
      const y = 0.55 + rng() * 0.16;
      const len = 0.1 + rng() * 0.28;
      const x1 = rng() * (1 - len);
      const angle = (rng() - 0.5) * 0.04;
      const x2 = x1 + len;
      const y2 = y + len * angle;
      list.push({
        x1, y1: y, x2, y2,
        a: 0.08 + rng() * 0.16,
      });
    }
    return list;
  })();

  // --- state ---
  let frame = 0;          // 0..578, baseline exposure progress
  let futureValue = 0;    // 0..100, future-satellites slider
  let exposing = false;

  function futureSatCount(v) {
    return Math.round(Math.pow(v / 100, 1.5) * FUTURE_MAX);
  }

  function futurePresetLabel(v) {
    if (v <= 0) return "— today —";
    if (v < 40) return "near future";
    if (v < 80) return "swarm growing";
    return "compute halo";
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function drawMountain(w, h, duskMix) {
    const baseY = h * 0.78;
    const peakY = h * 0.42;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY + h * 0.03);
    ctx.lineTo(w * 0.22, baseY - h * 0.02);
    ctx.lineTo(w * 0.37, peakY + h * 0.05);
    ctx.lineTo(w * 0.47, peakY);
    ctx.lineTo(w * 0.5, peakY - h * 0.015);
    ctx.lineTo(w * 0.53, peakY + h * 0.02);
    ctx.lineTo(w * 0.64, baseY - h * 0.01);
    ctx.lineTo(w * 0.8, baseY + h * 0.02);
    ctx.lineTo(w, baseY - h * 0.005);
    ctx.lineTo(w, h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, peakY, 0, h);
    g.addColorStop(0, `rgba(${20 + duskMix * 30},${16 + duskMix * 10},${30 - duskMix * 10},1)`);
    g.addColorStop(1, "rgba(3,3,8,1)");
    ctx.fillStyle = g;
    ctx.fill();

    // faint snow cap highlight
    ctx.beginPath();
    ctx.moveTo(w * 0.44, peakY + h * 0.03);
    ctx.lineTo(w * 0.5, peakY - h * 0.015);
    ctx.lineTo(w * 0.56, peakY + h * 0.035);
    ctx.lineTo(w * 0.5, peakY + h * 0.06);
    ctx.closePath();
    ctx.fillStyle = `rgba(190,200,220,${0.18 + duskMix * 0.12})`;
    ctx.fill();
  }

  function render() {
    layout();
    const w = canvas.width;
    const h = canvas.height;
    const duskMix = Math.min(1, futureValue / 100);

    // sky gradient: deep night, warming slightly toward the horizon as the
    // future-satellite ring thickens (illustrating a dusk-lit halo)
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#02030a");
    sky.addColorStop(0.55, `rgba(${8 + duskMix * 20},${10 + duskMix * 8},${26 - duskMix * 4},1)`);
    sky.addColorStop(0.82, `rgba(${18 + duskMix * 70},${12 + duskMix * 40},${30 - duskMix * 10},1)`);
    sky.addColorStop(1, "#05060c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // stars
    ctx.save();
    for (const s of stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#eef3ff";
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r * (w / 900 + 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // baseline "today" trails, revealed as exposure progresses
    const baseFrac = frame / TOTAL_FRAMES;
    const revealedBase = Math.round(baselineLines.length * baseFrac);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < revealedBase; i++) {
      const l = baselineLines[i];
      ctx.strokeStyle = `rgba(${l.hue},${l.a})`;
      ctx.lineWidth = Math.max(1, w / 700);
      ctx.beginPath();
      ctx.moveTo(l.x1 * w, l.y1 * h);
      ctx.lineTo(l.x2 * w, l.y2 * h);
      ctx.stroke();
    }
    ctx.restore();

    // future / sun-synchronous ring, revealed by the slider
    const futFrac = Math.pow(futureValue / 100, 0.65);
    const revealedFut = Math.round(futureLines.length * futFrac);
    if (revealedFut > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      const boost = 0.6 + futFrac * 0.8;
      for (let i = 0; i < revealedFut; i++) {
        const l = futureLines[i];
        ctx.strokeStyle = `rgba(255,${196 + Math.round(futFrac * 40)},140,${Math.min(0.62, l.a * boost)})`;
        ctx.lineWidth = Math.max(1, (w / 640) * (1 + futFrac));
        ctx.beginPath();
        ctx.moveTo(l.x1 * w, l.y1 * h);
        ctx.lineTo(l.x2 * w, l.y2 * h);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawMountain(w, h, duskMix);
  }

  function updateReadouts() {
    const baseFrac = frame / TOTAL_FRAMES;
    const seenSats = Math.round(TOTAL_SATS * Math.sqrt(baseFrac));
    const trails = Math.round(TOTAL_TRAILS * baseFrac);
    const futAdd = futureSatCount(futureValue);

    frameCountEl.textContent = frame.toLocaleString();
    trailCountEl.textContent = trails.toLocaleString();
    satCountEl.textContent = (seenSats + futAdd).toLocaleString();
    satLabelEl.textContent = futureValue > 0
      ? "satellites (today + illustrative future)"
      : "satellites (today)";
    futureState.textContent = futurePresetLabel(futureValue);
  }

  function frameTick() {
    updateReadouts();
    render();
  }

  let rafId = null;
  function startExposure() {
    if (exposing) return;
    exposing = true;
    exposeBtn.disabled = true;
    exposeBtn.textContent = "Exposing…";
    frame = 0;

    if (reduceMotion) {
      frame = TOTAL_FRAMES;
      frameTick();
      finishExposure();
      return;
    }

    const duration = 4800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - start) / duration);
      frame = Math.round(progress * TOTAL_FRAMES);
      frameTick();
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        finishExposure();
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function finishExposure() {
    exposing = false;
    exposeBtn.disabled = false;
    exposeBtn.textContent = "Expose again";
  }

  exposeBtn.addEventListener("click", startExposure);

  futureSlider.addEventListener("input", () => {
    futureValue = Number(futureSlider.value);
    frameTick();
  });

  window.addEventListener("resize", () => frameTick());
  if (window.ResizeObserver) {
    new ResizeObserver(() => frameTick()).observe(canvas);
  }

  frameTick();
})();
