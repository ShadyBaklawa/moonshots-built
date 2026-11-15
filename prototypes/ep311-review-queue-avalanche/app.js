(() => {
  "use strict";

  // Illustrative conversion assumption, not an episode figure: how many tokens of
  // AI output roughly correspond to one reviewable pull request.
  const TOKENS_PER_PR = 50000;

  const els = {
    multiplier: document.getElementById("multiplier"),
    multiplierOut: document.getElementById("multiplier-out"),
    instances: document.getElementById("instances"),
    instancesOut: document.getElementById("instances-out"),
    tokens: document.getElementById("tokens"),
    tokensOut: document.getElementById("tokens-out"),
    reviewers: document.getElementById("reviewers"),
    reviewersOut: document.getElementById("reviewers-out"),
    reviewSpeed: document.getElementById("review-speed"),
    reviewSpeedOut: document.getElementById("review-speed-out"),
    threshold: document.getElementById("threshold"),
    thresholdOut: document.getElementById("threshold-out"),
    statProduction: document.getElementById("stat-production"),
    statCapacity: document.getElementById("stat-capacity"),
    gaugeFill: document.getElementById("gauge-fill"),
    gaugeThresholdMarker: document.getElementById("gauge-threshold-marker"),
    gaugeReadout: document.getElementById("gauge-readout"),
    banner: document.getElementById("closed-loop-banner"),
    presetDemis: document.getElementById("preset-demis"),
    presetEmad: document.getElementById("preset-emad"),
    presetReset: document.getElementById("preset-reset"),
    canvas: document.getElementById("avalanche"),
    stage: document.querySelector(".stage"),
  };

  const DEFAULTS = {
    multiplier: 1,
    instancesExp: 0, // instances = 10^exp
    tokens: 200,
    reviewers: 10,
    reviewSpeed: 4,
    threshold: 20,
  };

  const PRESETS = {
    demis: { multiplier: 4, instancesExp: 0, tokens: 200, reviewers: 10, reviewSpeed: 4, threshold: 20 },
    emad: { multiplier: 1, instancesExp: 5, tokens: 10000, reviewers: 10, reviewSpeed: 4, threshold: 20 },
  };

  function instancesFromExp(exp) {
    return Math.max(1, Math.round(Math.pow(10, exp)));
  }

  const fmtCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const fmtInt = new Intl.NumberFormat("en-US");

  function formatRate(prsPerSec) {
    if (prsPerSec >= 1000) return fmtCompact.format(prsPerSec);
    if (prsPerSec >= 1) return prsPerSec.toFixed(1);
    return prsPerSec.toFixed(3);
  }

  function readState() {
    const instancesExp = parseFloat(els.instances.value);
    return {
      multiplier: parseFloat(els.multiplier.value),
      instances: instancesFromExp(instancesExp),
      tokens: parseFloat(els.tokens.value),
      reviewers: parseFloat(els.reviewers.value),
      reviewSpeed: parseFloat(els.reviewSpeed.value),
      threshold: parseFloat(els.threshold.value),
    };
  }

  function applyState(s) {
    els.multiplier.value = s.multiplier;
    els.instances.value = s.instancesExp;
    els.tokens.value = s.tokens;
    els.reviewers.value = s.reviewers;
    els.reviewSpeed.value = s.reviewSpeed;
    els.threshold.value = s.threshold;
    updateReadouts();
    updateStats();
  }

  function updateReadouts() {
    els.multiplierOut.textContent = `${parseFloat(els.multiplier.value).toFixed(1)}x`;
    els.instancesOut.textContent = fmtInt.format(instancesFromExp(parseFloat(els.instances.value)));
    els.tokensOut.textContent = fmtInt.format(parseFloat(els.tokens.value));
    els.reviewersOut.textContent = fmtInt.format(parseFloat(els.reviewers.value));
    els.reviewSpeedOut.textContent = fmtInt.format(parseFloat(els.reviewSpeed.value));
    els.thresholdOut.textContent = `${els.threshold.value}%`;
  }

  let latest = { productionRate: 0, capacityRate: 0, share: 100, threshold: 20 };

  function updateStats() {
    const s = readState();
    const productionRate = s.multiplier * s.instances * s.tokens / TOKENS_PER_PR; // PRs / sec
    const capacityRate = (s.reviewers * s.reviewSpeed) / 3600; // PRs / sec
    const share = productionRate > 0 ? Math.min(100, (capacityRate / productionRate) * 100) : 100;

    latest = { productionRate, capacityRate, share, threshold: s.threshold };

    els.statProduction.textContent = formatRate(productionRate);
    els.statCapacity.textContent = formatRate(capacityRate);
    els.gaugeFill.style.width = `${Math.max(0, Math.min(100, share))}%`;
    els.gaugeThresholdMarker.style.left = `${s.threshold}%`;
    els.gaugeReadout.textContent = `${share >= 1 ? share.toFixed(1) : share.toFixed(2)}%`;

    const closed = share < s.threshold;
    els.gaugeFill.style.background = closed
      ? "linear-gradient(90deg, #ff5a6e, #ff8a97)"
      : "linear-gradient(90deg, #58e6a0, #5fc7ff)";
    els.banner.hidden = !closed;
  }

  [els.multiplier, els.instances, els.tokens, els.reviewers, els.reviewSpeed, els.threshold].forEach((el) => {
    el.addEventListener("input", () => {
      updateReadouts();
      updateStats();
    });
  });

  els.presetDemis.addEventListener("click", () => applyState(PRESETS.demis));
  els.presetEmad.addEventListener("click", () => applyState(PRESETS.emad));
  els.presetReset.addEventListener("click", () => applyState(DEFAULTS));

  applyState(DEFAULTS);

  // ---- Avalanche visualization ----
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let width = 0;
  let height = 0;
  let bins = 10;
  let binWidth = 0;
  const BLOCK_H = 16;
  let maxBlocksPerBin = 16;
  let stackHeights = [];
  let fallingBlocks = [];
  let shakeUntil = 0;
  let flashBins = new Set();

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bins = Math.max(6, Math.min(16, Math.floor(width / 42)));
    binWidth = width / bins;
    maxBlocksPerBin = Math.max(6, Math.floor(height / BLOCK_H) - 1);
    stackHeights = new Array(bins).fill(0);
    fallingBlocks = [];
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function spawnRateFor(productionRate) {
    // Visual spawn rate (blocks/sec) on a log scale so huge real rates stay animatable.
    return Math.max(0.6, Math.min(26, 1.6 + Math.log10(1 + productionRate * 20) * 5));
  }

  function removalRateFor(capacityRate) {
    return Math.max(0.3, Math.min(14, 1 + Math.log10(1 + capacityRate * 2000) * 3));
  }

  let spawnAcc = 0;
  let removeAcc = 0;
  let lastTs = performance.now();

  function spawnBlock() {
    const bin = Math.floor(Math.random() * bins);
    fallingBlocks.push({
      bin,
      x: bin * binWidth + binWidth / 2,
      y: -BLOCK_H,
      vy: 260 + Math.random() * 60,
    });
  }

  function triggerAvalanche(bin) {
    shakeUntil = performance.now() + 260;
    stackHeights[bin] = Math.max(0, Math.floor(maxBlocksPerBin * 0.55));
    const left = bin - 1 >= 0 ? bin - 1 : bin;
    const right = bin + 1 < bins ? bin + 1 : bin;
    stackHeights[left] = Math.min(maxBlocksPerBin, stackHeights[left] + 1);
    stackHeights[right] = Math.min(maxBlocksPerBin, stackHeights[right] + 1);
    flashBins.add(bin);
    setTimeout(() => flashBins.delete(bin), 260);
  }

  function removeOne() {
    let maxIdx = -1;
    let maxVal = 0;
    for (let i = 0; i < bins; i++) {
      if (stackHeights[i] > maxVal) {
        maxVal = stackHeights[i];
        maxIdx = i;
      }
    }
    if (maxIdx >= 0) {
      stackHeights[maxIdx] -= 1;
      flashBins.add(maxIdx);
      setTimeout(() => flashBins.delete(maxIdx), 150);
    }
  }

  function step(ts) {
    const dt = Math.min(0.1, (ts - lastTs) / 1000);
    lastTs = ts;

    if (!prefersReducedMotion) {
      const spawnRate = spawnRateFor(latest.productionRate);
      spawnAcc += spawnRate * dt;
      while (spawnAcc >= 1) {
        spawnBlock();
        spawnAcc -= 1;
      }

      const removeRate = removalRateFor(latest.capacityRate);
      removeAcc += removeRate * dt;
      while (removeAcc >= 1) {
        removeOne();
        removeAcc -= 1;
      }

      for (let i = fallingBlocks.length - 1; i >= 0; i--) {
        const b = fallingBlocks[i];
        b.y += b.vy * dt;
        const floorY = height - stackHeights[b.bin] * BLOCK_H;
        if (b.y >= floorY) {
          if (stackHeights[b.bin] >= maxBlocksPerBin) {
            triggerAvalanche(b.bin);
          } else {
            stackHeights[b.bin] += 1;
          }
          fallingBlocks.splice(i, 1);
        }
      }
    }

    draw();
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    let shakeX = 0;
    if (performance.now() < shakeUntil) {
      shakeX = (Math.random() - 0.5) * 6;
    }
    ctx.save();
    ctx.translate(shakeX, 0);

    const closed = latest.share < latest.threshold;

    // ground line
    ctx.strokeStyle = "rgba(143, 176, 217, 0.25)";
    ctx.beginPath();
    ctx.moveTo(0, height - 2);
    ctx.lineTo(width, height - 2);
    ctx.stroke();

    for (let i = 0; i < bins; i++) {
      const h = stackHeights[i];
      const x = i * binWidth + 2;
      const w = binWidth - 4;
      const flashing = flashBins.has(i);
      for (let j = 0; j < h; j++) {
        const y = height - (j + 1) * BLOCK_H;
        drawBlock(x, y, w, BLOCK_H - 3, closed, flashing && j === h - 1);
      }
      // reviewer marker at the base of each bin
      ctx.fillStyle = closed ? "rgba(255, 90, 110, 0.35)" : "rgba(95, 199, 255, 0.35)";
      ctx.fillRect(x, height - 2, w, 2);
    }

    for (const b of fallingBlocks) {
      drawBlock(b.bin * binWidth + 2, b.y, binWidth - 4, BLOCK_H - 3, closed, false);
    }

    ctx.restore();
  }

  function drawBlock(x, y, w, h, closed, flash) {
    const base = closed ? "#ff5a6e" : "#5fc7ff";
    ctx.fillStyle = flash ? "#ffffff" : base;
    ctx.globalAlpha = flash ? 0.9 : 0.85;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(11, 18, 32, 0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  requestAnimationFrame((ts) => {
    lastTs = ts;
    requestAnimationFrame(step);
  });
})();
