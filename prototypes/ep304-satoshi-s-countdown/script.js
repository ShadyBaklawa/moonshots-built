(() => {
  "use strict";

  // --- Dramatized, clearly-fictional model constants --------------------
  // baseline: log2(ops/sec) the simulated "AI" starts at, anchored near the
  // order of magnitude of today's entire Bitcoin network hash rate (~10^21 H/s).
  const BASELINE_LOG2_OPS = 70;
  const CLASSICAL_BITS = 256;
  const QUANTUM_BITS = 128; // Grover's algorithm quadratic speedup (real math, hypothetical hardware scale)
  const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
  const LOG2_LN2 = Math.log2(Math.LN2); // log2(ln 2)

  const els = {
    doubling: document.getElementById("doubling"),
    doublingVal: document.getElementById("doublingVal"),
    quantumToggle: document.getElementById("quantumToggle"),
    runBtn: document.getElementById("runBtn"),
    fill: document.getElementById("fill"),
    track: document.getElementById("track"),
    progressReadout: document.getElementById("progressReadout"),
    balance: document.getElementById("balance"),
    status: document.getElementById("status"),
    crackEstimate: document.getElementById("crackEstimate"),
    keyspaceVal: document.getElementById("keyspaceVal"),
    realityCheck: document.getElementById("realityCheck"),
    assumptionsBody: document.getElementById("assumptionsBody"),
    trackMid: document.getElementById("trackMid"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isQuantum() {
    return els.quantumToggle.getAttribute("aria-pressed") === "true";
  }

  // Returns { seconds, years } for the dramatized crack time, computed in
  // log2 space throughout so the math never overflows on 2^256-scale numbers.
  function crackTime(doublingDays, quantum) {
    const D = doublingDays * 86400; // doubling period, seconds
    const L = (quantum ? QUANTUM_BITS : CLASSICAL_BITS) - 1; // log2(keyspace/2)
    const log2D = Math.log2(D);
    // Derived from: cumulative(t) = D/ln2 * baseline * (2^(t/D) - 1) = target
    const exponent = (L - BASELINE_LOG2_OPS) - log2D - LOG2_LN2;
    const seconds = Math.max(D * exponent, 1);
    return { seconds, years: seconds / SECONDS_PER_YEAR };
  }

  function formatDuration(years) {
    if (years < 1 / 365.25) {
      const hours = years * 365.25 * 24;
      return `~${hours.toFixed(1)} hours`;
    }
    if (years < 1) {
      const days = years * 365.25;
      return `~${days.toFixed(1)} days`;
    }
    if (years < 1000) {
      return `~${years.toFixed(1)} years`;
    }
    const exp = Math.floor(Math.log10(years));
    const mantissa = years / Math.pow(10, exp);
    return `~${mantissa.toFixed(2)} × 10^${exp} years`;
  }

  function updateDoublingLabel() {
    const days = Number(els.doubling.value);
    const label = days < 30
      ? `${days} day${days === 1 ? "" : "s"}`
      : `${(days / 30).toFixed(1)} months`;
    els.doublingVal.textContent = label;
  }

  function updateKeyspaceLabel() {
    const quantum = isQuantum();
    els.keyspaceVal.textContent = quantum
      ? "2¹²⁸ (quantum-assisted, Grover's)"
      : "2²⁵⁶ (classical)";
    els.trackMid.classList.toggle("active", quantum);
  }

  function previewEstimate() {
    const days = Number(els.doubling.value);
    const { years } = crackTime(days, isQuantum());
    els.crackEstimate.textContent = `${formatDuration(years)} (dramatized)`;
    els.progressReadout.textContent = `Press RUN to race toward ${formatDuration(years)} (dramatized).`;
  }

  function resetVault() {
    els.balance.textContent = "₿ 50.00000000";
    els.status.textContent = "LOCKED";
    els.status.className = "status locked";
    els.fill.style.width = "0%";
    previewEstimate();
  }

  function animateRun() {
    const days = Number(els.doubling.value);
    const quantum = isQuantum();
    const { years } = crackTime(days, quantum);
    const targetBits = quantum ? QUANTUM_BITS : CLASSICAL_BITS;
    const targetPercent = (targetBits / CLASSICAL_BITS) * 100;

    els.runBtn.disabled = true;
    els.balance.textContent = "₿ 50.00000000";
    els.status.textContent = "SEARCHING…";
    els.status.className = "status locked";
    els.fill.classList.toggle("quantum", quantum);
    els.fill.style.width = "0%";

    const durationMs = reduceMotion
      ? 50
      : Math.min(9500, Math.max(2000, 2000 + Math.log10(years + 1) * 3000));

    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 2);
      const pct = eased * targetPercent;
      els.fill.style.width = `${pct}%`;
      const exponent = (pct / 100) * CLASSICAL_BITS;
      els.progressReadout.textContent =
        `Simulated keys attempted: ~2^${exponent.toFixed(1)} of 2^256`;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        els.balance.textContent = "₿ 0.00000000";
        els.status.textContent = "WALLET DRAINED (simulated)";
        els.status.className = "status drained";
        els.progressReadout.textContent =
          `Simulated drain complete at 2^${targetBits} — dramatized estimate: ${formatDuration(years)}`;
        els.runBtn.disabled = false;
      }
    }

    requestAnimationFrame(frame);
  }

  function renderAssumptions(data) {
    if (!data) {
      els.assumptionsBody.textContent = "Could not load model assumptions.";
      els.realityCheck.textContent = "unavailable";
      return;
    }
    els.realityCheck.textContent = data.reality_check;
    const dl = document.createElement("dl");
    const rows = [
      ["Classical keyspace", `2^${data.classical_keyspace_bits}`],
      ["Quantum-assisted target", `2^${data.quantum_keyspace_bits} — ${data.quantum_note}`],
      ["Expected attempts needed", `${data.expected_attempts_fraction * 100}% of keyspace — ${data.expected_attempts_note}`],
      ["Baseline AI compute", `~2^${data.baseline_ops_log2_per_second} ops/sec — ${data.baseline_note}`],
      ["Growth model", data.growth_model],
    ];
    for (const [label, value] of rows) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      dl.append(dt, dd);
    }
    els.assumptionsBody.innerHTML = "";
    els.assumptionsBody.appendChild(dl);
  }

  els.doubling.addEventListener("input", () => {
    updateDoublingLabel();
    previewEstimate();
  });

  els.quantumToggle.addEventListener("click", () => {
    const pressed = isQuantum();
    els.quantumToggle.setAttribute("aria-pressed", String(!pressed));
    updateKeyspaceLabel();
    els.fill.classList.toggle("quantum", !pressed);
    resetVault();
  });

  els.runBtn.addEventListener("click", animateRun);

  updateDoublingLabel();
  updateKeyspaceLabel();
  previewEstimate();

  fetch("data/assumptions.json")
    .then((r) => r.json())
    .then(renderAssumptions)
    .catch(() => renderAssumptions(null));
})();
