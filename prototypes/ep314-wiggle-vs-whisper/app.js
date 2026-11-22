(() => {
  "use strict";

  // ---------- deterministic PRNG (simulated, reproducible toy data) ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- toy "two moons" dataset ----------
  function makeDataset(n = 90, seed = 42) {
    const rnd = mulberry32(seed);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const label = i % 2;
      const t = rnd() * Math.PI;
      const noise = (rnd() - 0.5) * 0.25;
      let x, y;
      if (label === 0) {
        x = Math.cos(t) + noise;
        y = Math.sin(t) + noise - 0.15;
      } else {
        x = 1 - Math.cos(t) + noise;
        y = 1 - Math.sin(t) - 0.5 + noise + 0.15;
      }
      pts.push({ x: x * 1.1, y: y * 1.1, label });
    }
    return pts;
  }

  const DATA = makeDataset();

  // ---------- tiny 2 -> H -> 1 network ----------
  function tanh(z) { return Math.tanh(z); }
  function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }

  function createNet(H, seed) {
    const rnd = mulberry32(seed);
    const net = { H, W1: [], b1: [], W2: [], b2: 0 };
    for (let h = 0; h < H; h++) {
      net.W1.push([(rnd() - 0.5) * 2, (rnd() - 0.5) * 2]);
      net.b1.push((rnd() - 0.5) * 0.5);
      net.W2.push((rnd() - 0.5) * 2);
    }
    net.b2 = (rnd() - 0.5) * 0.5;
    return net;
  }

  function cloneNet(net) {
    return {
      H: net.H,
      W1: net.W1.map((w) => w.slice()),
      b1: net.b1.slice(),
      W2: net.W2.slice(),
      b2: net.b2,
    };
  }

  function forward(net, x, y) {
    const hidden = new Array(net.H);
    for (let h = 0; h < net.H; h++) {
      hidden[h] = tanh(net.W1[h][0] * x + net.W1[h][1] * y + net.b1[h]);
    }
    let z2 = net.b2;
    for (let h = 0; h < net.H; h++) z2 += net.W2[h] * hidden[h];
    return { hidden, out: sigmoid(z2) };
  }

  function datasetLoss(net, data) {
    let sum = 0;
    for (const p of data) {
      const { out } = forward(net, p.x, p.y);
      const d = out - p.label;
      sum += d * d;
    }
    return sum / data.length / 2;
  }

  function weightCount(net) {
    return net.H * 2 + net.H + net.H + 1; // W1 + b1 + W2 + b2
  }

  // one full-batch backprop step; returns new loss. Costs exactly 1 forward pass.
  function backpropStep(net, data, lr) {
    const H = net.H;
    const gW1 = Array.from({ length: H }, () => [0, 0]);
    const gb1 = new Array(H).fill(0);
    const gW2 = new Array(H).fill(0);
    let gb2 = 0;
    let lossSum = 0;

    for (const p of data) {
      const { hidden, out } = forward(net, p.x, p.y);
      const err = out - p.label;
      lossSum += err * err;
      const dOut = err * out * (1 - out); // d(loss)/d(z2)
      for (let h = 0; h < H; h++) {
        gW2[h] += dOut * hidden[h];
        const dHidden = dOut * net.W2[h] * (1 - hidden[h] * hidden[h]);
        gW1[h][0] += dHidden * p.x;
        gW1[h][1] += dHidden * p.y;
        gb1[h] += dHidden;
      }
      gb2 += dOut;
    }

    const n = data.length;
    for (let h = 0; h < H; h++) {
      net.W1[h][0] -= lr * gW1[h][0] / n;
      net.W1[h][1] -= lr * gW1[h][1] / n;
      net.b1[h] -= lr * gb1[h] / n;
      net.W2[h] -= lr * gW2[h] / n;
    }
    net.b2 -= lr * gb2 / n;

    return lossSum / n / 2;
  }

  // one epoch of weight perturbation: test every weight once (random order, random sign).
  // Costs 1 (baseline) + weightCount forward passes.
  function perturbStep(net, data, rnd, epsilon) {
    let baseline = datasetLoss(net, data); // 1 pass
    let passes = 1;

    const slots = [];
    for (let h = 0; h < net.H; h++) {
      slots.push({ get: () => net.W1[h][0], set: (v) => (net.W1[h][0] = v) });
      slots.push({ get: () => net.W1[h][1], set: (v) => (net.W1[h][1] = v) });
      slots.push({ get: () => net.b1[h], set: (v) => (net.b1[h] = v) });
      slots.push({ get: () => net.W2[h], set: (v) => (net.W2[h] = v) });
    }
    slots.push({ get: () => net.b2, set: (v) => (net.b2 = v) });

    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    for (const slot of slots) {
      const original = slot.get();
      const sign = rnd() < 0.5 ? 1 : -1;
      slot.set(original + sign * epsilon);
      const trialLoss = datasetLoss(net, data); // 1 pass
      passes += 1;
      if (trialLoss < baseline) {
        baseline = trialLoss;
      } else {
        slot.set(original);
      }
    }

    return { loss: baseline, passes };
  }

  // ---------- state ----------
  let H = 6;
  let bpNet, pbNet, pbRnd;
  let bpEpoch = 0, pbEpoch = 0;
  let bpPasses = 0, pbPasses = 0;
  let bpLossHistory = [], pbLossHistory = [];
  let bpPassHistory = [], pbPassHistory = [];
  let training = false;
  let rafId = null, lastStepTime = 0;
  const STEP_INTERVAL = 90; // ms between epochs
  let targetLoss = 0.12;
  let bpTargetHit = null, pbTargetHit = null; // {epoch, passes}

  function resetState() {
    const initSeed = 1000 + H;
    bpNet = createNet(H, initSeed);
    pbNet = cloneNet(bpNet);
    pbRnd = mulberry32(initSeed + 777);
    bpEpoch = 0; pbEpoch = 0;
    bpPasses = 0; pbPasses = 0;
    bpLossHistory = [datasetLoss(bpNet, DATA)];
    pbLossHistory = [datasetLoss(pbNet, DATA)];
    bpPassHistory = [0];
    pbPassHistory = [0];
    bpTargetHit = null; pbTargetHit = null;
    renderAll();
  }

  function stepEpoch() {
    const lr = 0.6;
    const epsilon = 0.08;

    const bpLoss = backpropStep(bpNet, DATA, lr);
    bpEpoch += 1;
    bpPasses += 1;
    bpLossHistory.push(bpLoss);
    bpPassHistory.push(bpPasses);
    if (bpTargetHit === null && bpLoss <= targetLoss) {
      bpTargetHit = { epoch: bpEpoch, passes: bpPasses };
    }

    const { loss: pbLoss, passes: usedPasses } = perturbStep(pbNet, DATA, pbRnd, epsilon);
    pbEpoch += 1;
    pbPasses += usedPasses;
    pbLossHistory.push(pbLoss);
    pbPassHistory.push(pbPasses);
    if (pbTargetHit === null && pbLoss <= targetLoss) {
      pbTargetHit = { epoch: pbEpoch, passes: pbPasses };
    }
  }

  // ---------- rendering ----------
  const bpCanvas = document.getElementById("bpCanvas");
  const pbCanvas = document.getElementById("pbCanvas");
  const lossChart = document.getElementById("lossChart");

  function drawHeatmap(canvas, net, color) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, Hc = canvas.height;
    const grid = 36;
    const img = ctx.createImageData(grid, grid);
    const range = 2.4;

    const [r1, g1, b1] = color.class1;
    const [r0, g0, b0] = color.class0;

    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const x = (gx / (grid - 1)) * range * 2 - range;
        const y = range - (gy / (grid - 1)) * range * 2;
        const { out } = forward(net, x, y);
        const idx = (gy * grid + gx) * 4;
        img.data[idx] = r0 + (r1 - r0) * out;
        img.data[idx + 1] = g0 + (g1 - g0) * out;
        img.data[idx + 2] = b0 + (b1 - b0) * out;
        img.data[idx + 3] = 255;
      }
    }

    const off = document.createElement("canvas");
    off.width = grid; off.height = grid;
    off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, W, Hc);
    ctx.drawImage(off, 0, 0, W, Hc);

    // scatter data points
    for (const p of DATA) {
      const px = ((p.x + range) / (range * 2)) * W;
      const py = ((range - p.y) / (range * 2)) * Hc;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? "rgba(255,255,255,0.95)" : "rgba(20,20,25,0.9)";
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
  }

  const bpColors = { class0: [16, 30, 50], class1: [90, 176, 255] };
  const pbColors = { class0: [40, 22, 14], class1: [255, 138, 61] };

  function drawLossChart() {
    const ctx = lossChart.getContext("2d");
    const W = lossChart.width, H2 = lossChart.height;
    ctx.clearRect(0, 0, W, H2);
    ctx.fillStyle = "#060709";
    ctx.fillRect(0, 0, W, H2);

    const maxEpoch = Math.max(bpLossHistory.length, pbLossHistory.length, 2);
    const maxLoss = Math.max(0.3, ...bpLossHistory, ...pbLossHistory);
    const pad = 28;

    // gridlines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const gy = pad + ((H2 - pad * 1.5) * i) / 4;
      ctx.moveTo(pad, gy);
      ctx.lineTo(W - 10, gy);
    }
    ctx.stroke();

    // target loss line
    const targetY = H2 - pad * 0.5 - (targetLoss / maxLoss) * (H2 - pad * 1.5);
    ctx.strokeStyle = "rgba(255,209,102,0.55)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(pad, targetY);
    ctx.lineTo(W - 10, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffd166";
    ctx.font = "11px sans-serif";
    ctx.fillText("target loss", pad + 4, targetY - 4);

    function plot(history, strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach((loss, i) => {
        const px = pad + ((W - pad - 10) * i) / (maxEpoch - 1 || 1);
        const py = H2 - pad * 0.5 - (loss / maxLoss) * (H2 - pad * 1.5);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    plot(bpLossHistory, "#5ab0ff");
    plot(pbLossHistory, "#ff8a3d");

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px sans-serif";
    ctx.fillText("epoch " + maxEpoch, W - 90, H2 - 8);
    ctx.fillText("loss " + maxLoss.toFixed(2), pad, 16);
  }

  function fmt(n) {
    return n.toLocaleString("en-US");
  }

  function renderGap() {
    const bpBar = document.getElementById("bpBar");
    const pbBar = document.getElementById("pbBar");
    const bpLabel = document.getElementById("bpBarLabel");
    const pbLabel = document.getElementById("pbBarLabel");
    const ratioLine = document.getElementById("ratioLine");

    const bpP = bpTargetHit ? bpTargetHit.passes : bpPasses;
    const pbP = pbTargetHit ? pbTargetHit.passes : pbPasses;
    const maxP = Math.max(bpP, pbP, 1);

    bpBar.style.width = Math.max(2, (bpP / maxP) * 100) + "%";
    pbBar.style.width = Math.max(2, (pbP / maxP) * 100) + "%";
    bpLabel.textContent = (bpTargetHit ? fmt(bpP) + " passes (reached)" : fmt(bpP) + " so far");
    pbLabel.textContent = (pbTargetHit ? fmt(pbP) + " passes (reached)" : fmt(pbP) + " so far");

    if (bpTargetHit && pbTargetHit) {
      const ratio = pbTargetHit.passes / bpTargetHit.passes;
      ratioLine.innerHTML = `Both reached loss ${targetLoss.toFixed(2)}. Perturbation needed <span class="ratio">${ratio.toFixed(1)}×</span> more forward passes than backprop (${fmt(pbTargetHit.passes)} vs ${fmt(bpTargetHit.passes)}), with hidden size ${H} (${weightCount(bpNet)} weights).`;
    } else if (bpTargetHit && !pbTargetHit) {
      ratioLine.innerHTML = `Backprop reached loss ${targetLoss.toFixed(2)} in ${fmt(bpTargetHit.passes)} forward passes. Perturbation is still at ${fmt(pbPasses)} passes and climbing — already ${(pbPasses / bpTargetHit.passes).toFixed(1)}× more, and not there yet.`;
    } else {
      ratioLine.textContent = "Training in progress — keep watching the forward-pass counters.";
    }
  }

  function renderAll() {
    drawHeatmap(bpCanvas, bpNet, bpColors);
    drawHeatmap(pbCanvas, pbNet, pbColors);
    drawLossChart();
    renderGap();

    document.getElementById("bpLoss").textContent = bpLossHistory[bpLossHistory.length - 1].toFixed(4);
    document.getElementById("pbLoss").textContent = pbLossHistory[pbLossHistory.length - 1].toFixed(4);
    document.getElementById("bpEpoch").textContent = fmt(bpEpoch);
    document.getElementById("pbEpoch").textContent = fmt(pbEpoch);
    document.getElementById("bpPasses").textContent = fmt(bpPasses);
    document.getElementById("pbPasses").textContent = fmt(pbPasses);
  }

  // ---------- training loop ----------
  function tick(timestamp) {
    if (!training) return;
    if (timestamp - lastStepTime >= STEP_INTERVAL) {
      lastStepTime = timestamp;
      stepEpoch();
      renderAll();
    }
    rafId = requestAnimationFrame(tick);
  }

  function setTraining(on) {
    training = on;
    const btn = document.getElementById("trainBtn");
    if (on) {
      btn.textContent = "⏸ Pause";
      btn.classList.add("active");
      lastStepTime = 0;
      rafId = requestAnimationFrame(tick);
    } else {
      btn.textContent = "▶ Train";
      btn.classList.remove("active");
      if (rafId) cancelAnimationFrame(rafId);
    }
  }

  // ---------- wiring ----------
  const hiddenSlider = document.getElementById("hiddenSlider");
  const hiddenVal = document.getElementById("hiddenVal");
  const targetSlider = document.getElementById("targetSlider");
  const targetVal = document.getElementById("targetVal");

  hiddenSlider.addEventListener("input", () => {
    H = parseInt(hiddenSlider.value, 10);
    hiddenVal.textContent = H;
    setTraining(false);
    resetState();
  });

  targetSlider.addEventListener("input", () => {
    targetLoss = parseFloat(targetSlider.value);
    targetVal.textContent = targetLoss.toFixed(2);
    bpTargetHit = null;
    pbTargetHit = null;
    for (let i = 0; i < bpLossHistory.length; i++) {
      if (bpLossHistory[i] <= targetLoss) { bpTargetHit = { epoch: i, passes: bpPassHistory[i] }; break; }
    }
    for (let i = 0; i < pbLossHistory.length; i++) {
      if (pbLossHistory[i] <= targetLoss) { pbTargetHit = { epoch: i, passes: pbPassHistory[i] }; break; }
    }
    renderAll();
  });

  document.getElementById("trainBtn").addEventListener("click", () => setTraining(!training));
  document.getElementById("resetBtn").addEventListener("click", () => {
    setTraining(false);
    resetState();
  });

  resetState();
})();
