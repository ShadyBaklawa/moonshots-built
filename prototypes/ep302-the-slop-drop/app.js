(() => {
  "use strict";

  const FALLBACK_STATS = {
    total_problems: 722,
    hours_per_problem: 3,
    solve_rate_used: 0.17,
    cost_total_used: 24000000,
    human_pace_years: 10,
    ai_pace_days: 14
  };

  const tilesEl = document.getElementById("tiles");
  const gridCountEl = document.getElementById("gridCount");
  const progressBar = document.getElementById("progressBar");
  const runBtn = document.getElementById("runBtn");
  const resetBtn = document.getElementById("resetBtn");
  const statusLine = document.getElementById("statusLine");
  const hoursVal = document.getElementById("hoursVal");
  const costVal = document.getElementById("costVal");
  const solvedVal = document.getElementById("solvedVal");
  const pctVal = document.getElementById("pctVal");
  const attemptedVal = document.getElementById("attemptedVal");
  const speedBtns = Array.from(document.querySelectorAll(".segbtn"));

  let stats = FALLBACK_STATS;
  let order = [];
  let isSolved = [];
  let processed = 0;
  let solvedCount = 0;
  let speed = 5;
  let playing = false;
  let timerId = null;

  function shuffledIndices(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildGrid() {
    const n = stats.total_problems;
    const solveCount = Math.round(n * stats.solve_rate_used);
    order = shuffledIndices(n);
    isSolved = new Array(n).fill(false);
    for (let i = 0; i < solveCount; i++) {
      isSolved[order[i]] = true;
    }
    tilesEl.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "tile";
      d.dataset.index = String(i);
      frag.appendChild(d);
    }
    tilesEl.appendChild(frag);
    gridCountEl.textContent = `0 / ${n} attempted`;
  }

  function fmtInt(n) {
    return Math.round(n).toLocaleString("en-US");
  }

  function updateCounters() {
    const n = stats.total_problems;
    const hours = processed * stats.hours_per_problem;
    const cost = processed * (stats.cost_total_used / n);
    const pct = processed > 0 ? (solvedCount / processed) * 100 : 0;

    hoursVal.textContent = fmtInt(hours);
    costVal.textContent = fmtInt(cost / 1000) + "K";
    solvedVal.textContent = fmtInt(solvedCount);
    pctVal.textContent = pct.toFixed(0);
    attemptedVal.textContent = fmtInt(processed);
    gridCountEl.textContent = `${fmtInt(processed)} / ${n} attempted`;
    progressBar.style.width = `${(processed / n) * 100}%`;
  }

  function tick() {
    const n = stats.total_problems;
    const batch = Math.min(speed, n - processed);
    for (let i = 0; i < batch; i++) {
      const idx = order[processed];
      const tile = tilesEl.children[idx];
      if (isSolved[idx]) {
        tile.classList.add("solved");
        solvedCount++;
      } else {
        tile.classList.add("unsolved");
      }
      processed++;
    }
    updateCounters();

    if (processed >= n) {
      stopPlaying();
      const finalPct = ((solvedCount / n) * 100).toFixed(1);
      statusLine.textContent = `Done. ${fmtInt(solvedCount)} of ${n} solved (${finalPct}%) after ${fmtInt(n * stats.hours_per_problem)} compute-hours — and real mathematicians still pushed back on the quality.`;
      runBtn.textContent = "▶ Run again";
      runBtn.disabled = false;
    }
  }

  function startPlaying() {
    if (playing || processed >= stats.total_problems) return;
    playing = true;
    runBtn.textContent = "⏸ Pause";
    statusLine.textContent = "Running the bulk-solve...";
    timerId = setInterval(tick, 25);
  }

  function stopPlaying() {
    playing = false;
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    if (processed < stats.total_problems) {
      runBtn.textContent = "▶ Resume";
      statusLine.textContent = "Paused.";
    }
  }

  function resetAll() {
    stopPlaying();
    processed = 0;
    solvedCount = 0;
    buildGrid();
    updateCounters();
    runBtn.textContent = "▶ Run the drop";
    runBtn.disabled = false;
    statusLine.textContent = "Idle. Click run to start the simulated bulk-solve.";
  }

  runBtn.addEventListener("click", () => {
    if (processed >= stats.total_problems) {
      resetAll();
      startPlaying();
      return;
    }
    if (playing) {
      stopPlaying();
    } else {
      startPlaying();
    }
  });

  resetBtn.addEventListener("click", resetAll);

  speedBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      speedBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      speed = Number(btn.dataset.speed);
    });
  });

  // --- Timeline comparison ---
  const humanBtn = document.getElementById("humanBtn");
  const aiBtn = document.getElementById("aiBtn");
  const timelineFill = document.getElementById("timelineFill");
  const timelineLabel = document.getElementById("timelineLabel");
  const timelinePlay = document.getElementById("timelinePlay");

  let timelineMode = "human";
  let timelineRaf = null;
  const TIMELINE_DURATION_MS = 4500;

  function setTimelineMode(mode) {
    timelineMode = mode;
    humanBtn.classList.toggle("active", mode === "human");
    aiBtn.classList.toggle("active", mode === "ai");
    resetTimelineVisual();
  }

  function resetTimelineVisual() {
    if (timelineRaf) {
      cancelAnimationFrame(timelineRaf);
      timelineRaf = null;
    }
    timelineFill.style.width = "0%";
    if (timelineMode === "human") {
      timelineLabel.textContent = `Year 0 of ${stats.human_pace_years}`;
    } else {
      timelineLabel.textContent = `Day 0 of ${stats.ai_pace_days}`;
    }
  }

  function playTimeline() {
    if (timelineRaf) cancelAnimationFrame(timelineRaf);
    const start = performance.now();
    const total = timelineMode === "human" ? stats.human_pace_years : stats.ai_pace_days;
    const unit = timelineMode === "human" ? "Year" : "Day";

    function frame(now) {
      const elapsed = now - start;
      const frac = Math.min(1, elapsed / TIMELINE_DURATION_MS);
      timelineFill.style.width = `${frac * 100}%`;
      const units = Math.min(total, frac * total);
      timelineLabel.textContent = `${unit} ${units.toFixed(1)} of ${total}`;
      if (frac < 1) {
        timelineRaf = requestAnimationFrame(frame);
      } else {
        timelineLabel.textContent = `${unit} ${total} of ${total} — done`;
      }
    }
    timelineRaf = requestAnimationFrame(frame);
  }

  humanBtn.addEventListener("click", () => setTimelineMode("human"));
  aiBtn.addEventListener("click", () => setTimelineMode("ai"));
  timelinePlay.addEventListener("click", playTimeline);

  // --- Init ---
  async function init() {
    try {
      const res = await fetch("data/stats.json");
      if (res.ok) {
        const data = await res.json();
        stats = Object.assign({}, FALLBACK_STATS, data);
      }
    } catch (e) {
      stats = FALLBACK_STATS;
    }
    buildGrid();
    updateCounters();
    resetTimelineVisual();
  }

  init();
})();
