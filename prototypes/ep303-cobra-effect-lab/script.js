(() => {
  "use strict";

  // Fallback copy of data/scenarios.json, used only if fetch() can't reach the file
  // (e.g. opened directly via file:// instead of a static server).
  const FALLBACK_DATA = {
    scenarios: [
      {
        id: "rats", name: "Rat Tail Bounty", icon: "🐀", setting: "Colonial Hanoi, 1902",
        intendedLabel: "Rat tails turned in", realLabel: "Wild rats actually removed",
        dialLabel: "Bounty per tail", gamedIcon: "🕳️", gamedLabel: "Rat farms opened",
        onsetWeek: 4, growthIntended: 7.5, growthHonest: 6, gamingSeverity: 0.85,
        gamingNarrative: "Tail-collectors realize killing wild rats is slow and dangerous. Breeding rats in backyard farms is faster — and the bounty office can't tell a farmed tail from a wild one.",
        historical: { source: "podcast", headline: "What actually happened in Hanoi", facts: [
          "French colonial administrators paid a bounty for every rat tail turned in.",
          "Hunters started cutting off tails and releasing the rats alive to breed more tails.",
          "Some residents began farming rats specifically to harvest tails for cash.",
          "The wild rat population kept climbing even as tail payouts hit historic highs."
        ]}
      },
      {
        id: "sales", name: "Cross-Sell Quota", icon: "🏦", setting: "Retail bank branches, 2011–2016",
        intendedLabel: "New accounts opened", realLabel: "Real customers who wanted them",
        dialLabel: "Quota pressure", gamedIcon: "📄", gamedLabel: "Unauthorized accounts opened",
        onsetWeek: 3, growthIntended: 8, growthHonest: 5, gamingSeverity: 0.9,
        gamingNarrative: "Branch staff facing an \"8-accounts-a-day\" quota start opening extra checking and credit accounts in existing customers' names — without telling them.",
        historical: { source: "podcast", headline: "What actually happened at the bank", facts: [
          "A nationwide cross-sell quota pushed staff to open as many new accounts as possible per customer.",
          "Employees opened an estimated 3.5 million accounts customers never asked for.",
          "Many customers were charged fees on accounts they didn't know existed.",
          "The bank paid over $3 billion in fines and settlements once regulators uncovered the practice."
        ]}
      },
      {
        id: "tickets", name: "Ticket Quota Precinct", icon: "🚨", setting: "A generalized pattern seen in traffic-enforcement units",
        intendedLabel: "Citations issued", realLabel: "Dangerous driving actually reduced",
        dialLabel: "Monthly ticket quota", gamedIcon: "🅿️", gamedLabel: "Easy repeat stops (same low-risk drivers)",
        onsetWeek: 4, growthIntended: 7, growthHonest: 4.5, gamingSeverity: 0.75,
        gamingNarrative: "To hit a ticket count, officers start writing citations for trivial, easy-to-prove infractions near the station instead of patrolling the actual high-risk stretches of road.",
        historical: { source: "generalized", headline: "A widely documented pattern, not one specific case", facts: [
          "This scenario is a generalized pattern described in criminology and public-administration research on quota policing, not a single real agency.",
          "Researchers have repeatedly found that raw ticket-count quotas can shift effort toward easy, low-value stops.",
          "The result: citation counts look great on a dashboard while the riskiest roads see little change in actual safety.",
          "Several police departments have since moved to outcome-based metrics (crash rates, repeat offenders) instead of raw ticket counts."
        ]}
      }
    ]
  };

  const WEEKS = 10;

  const state = {
    scenarios: [],
    selected: null,
    dial: 6,
    running: false,
  };

  const grid = document.getElementById("scenario-grid");
  const dial = document.getElementById("dial");
  const dialValue = document.getElementById("dial-value");
  const dialLabel = document.getElementById("dial-label");
  const runBtn = document.getElementById("run-btn");
  const setupPanel = document.getElementById("setup-panel");
  const simPanel = document.getElementById("sim-panel");
  const historyPanel = document.getElementById("history-panel");
  const simScenarioName = document.getElementById("sim-scenario-name");
  const weekNow = document.getElementById("week-now");
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext("2d");
  const legendIntended = document.getElementById("legend-intended");
  const legendReal = document.getElementById("legend-real");
  const gamedStrip = document.getElementById("gamed-strip");
  const gamedIcons = document.getElementById("gamed-icons");
  const gamedLabel = document.getElementById("gamed-label");
  const gamedCount = document.getElementById("gamed-count");
  const revealBanner = document.getElementById("reveal-banner");
  const revealText = document.getElementById("reveal-text");
  const resetBtn = document.getElementById("reset-btn");
  const historyHeadline = document.getElementById("history-headline");
  const historyTag = document.getElementById("history-tag");
  const historyFacts = document.getElementById("history-facts");
  const againBtn = document.getElementById("again-btn");
  const dialRecap = document.getElementById("dial-recap");

  function severityTier(dialStrength) {
    if (dialStrength <= 3) return "mild";
    if (dialStrength <= 7) return "moderate";
    return "extreme";
  }

  function revealLeadIn(dialStrength) {
    const tier = severityTier(dialStrength);
    if (tier === "mild") {
      return "The incentive was mild, so gaming crept in slowly and stayed small-scale — but it still showed up:";
    }
    if (tier === "moderate") {
      return "The incentive was strong enough that gaming became the easier path:";
    }
    return "The incentive was so extreme that gaming wasn't a side effect — it was the dominant strategy:";
  }

  function dialRecapText(dialStrength) {
    const tier = severityTier(dialStrength);
    if (tier === "mild") {
      return `You set the dial to ${dialStrength}/10. At this low a setting, the model shows only mild gaming — real-world cases like the one below are usually driven by much stronger pressure than this.`;
    }
    if (tier === "moderate") {
      return `You set the dial to ${dialStrength}/10. That's roughly the range where this model starts to resemble what actually happened historically.`;
    }
    return `You set the dial to ${dialStrength}/10 — near the top. The model shows gaming overwhelming the real outcome fast, echoing just how bad the historical case below got.`;
  }

  function loadData() {
    return fetch("data/scenarios.json")
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .catch(() => FALLBACK_DATA);
  }

  function renderScenarioCards() {
    grid.innerHTML = "";
    state.scenarios.forEach((sc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scenario-card";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.tabIndex = sc.id === state.scenarios[0].id ? 0 : -1;
      btn.dataset.id = sc.id;
      btn.innerHTML = `
        <span class="sc-icon">${sc.icon}</span>
        <span class="sc-name">${sc.name}</span>
        <span class="sc-setting">${sc.setting}</span>
      `;
      btn.addEventListener("click", () => selectScenario(sc.id));
      btn.addEventListener("keydown", onScenarioKeydown);
      grid.appendChild(btn);
    });
  }

  function onScenarioKeydown(e) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const cards = [...grid.children];
    const i = cards.indexOf(e.currentTarget);
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = cards[(i + dir + cards.length) % cards.length];
    next.focus();
    selectScenario(next.dataset.id);
  }

  function selectScenario(id) {
    state.selected = state.scenarios.find((s) => s.id === id);
    [...grid.children].forEach((card) => {
      const isSel = card.dataset.id === id;
      card.classList.toggle("selected", isSel);
      card.setAttribute("aria-checked", String(isSel));
      card.tabIndex = isSel ? 0 : -1;
    });
    dialLabel.textContent = state.selected.dialLabel;
    runBtn.disabled = false;
  }

  function computeWeekValues(sc, dialStrength, week) {
    const gamingFactor = dialStrength / 10;
    const intendedRaw = week * (5 + gamingFactor * sc.growthIntended);
    const intended = Math.min(100, Math.round(intendedRaw));

    const honest = Math.min(70, week * sc.growthHonest);
    let real;
    if (week <= sc.onsetWeek) {
      real = honest;
    } else {
      const weeksSinceOnset = week - sc.onsetWeek;
      const honestAtOnset = Math.min(70, sc.onsetWeek * sc.growthHonest);
      const decay = gamingFactor * sc.gamingSeverity * weeksSinceOnset * 3.2;
      real = Math.max(honestAtOnset * 0.15, honestAtOnset - decay);
    }
    real = Math.round(Math.min(70, real));

    const gamedUnits = Math.max(0, intended - real);
    return { intended, real, gamedUnits };
  }

  function drawChart(history) {
    const w = canvas.width;
    const h = canvas.height;
    const padL = 36, padR = 10, padT = 16, padB = 28;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    // grid lines
    ctx.strokeStyle = "#1c2630";
    ctx.lineWidth = 1;
    ctx.font = "11px monospace";
    ctx.fillStyle = "#5c7282";
    for (let v = 0; v <= 100; v += 25) {
      const y = padT + plotH - (v / 100) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillText(String(v), 4, y + 4);
    }

    const xForWeek = (wk) => padL + (wk / WEEKS) * plotW;
    const yForVal = (val) => padT + plotH - (Math.max(0, Math.min(100, val)) / 100) * plotH;

    // x axis labels
    for (let wk = 0; wk <= WEEKS; wk += 2) {
      ctx.fillText("W" + wk, xForWeek(wk) - 8, h - 8);
    }

    function drawLine(key, color, dash, shape) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash(dash);
      history.forEach((pt, i) => {
        const x = xForWeek(pt.week);
        const y = yForVal(pt[key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      history.forEach((pt) => {
        const x = xForWeek(pt.week);
        const y = yForVal(pt[key]);
        ctx.fillStyle = color;
        if (shape === "square") {
          ctx.fillRect(x - 4, y - 4, 8, 8);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    drawLine("real", "#ff6b5e", [6, 4], "square");
    drawLine("intended", "#3fe0a5", [], "circle");
  }

  let timer = null;

  function startSimulation() {
    const sc = state.selected;
    const dialStrength = Number(dial.value);

    setupPanel.hidden = true;
    simPanel.hidden = false;
    historyPanel.hidden = true;
    revealBanner.hidden = true;
    gamedStrip.hidden = false;
    resetBtn.hidden = true;

    simScenarioName.textContent = `${sc.icon} ${sc.name}`;
    legendIntended.textContent = sc.intendedLabel;
    legendReal.textContent = sc.realLabel;
    gamedLabel.textContent = sc.gamedLabel;
    gamedIcons.textContent = "";
    gamedCount.textContent = "0";
    weekNow.textContent = "0";

    const history = [];
    drawChart(history);

    let week = 0;
    let revealed = false;
    runBtn.disabled = true;

    timer = setInterval(() => {
      week += 1;
      const vals = computeWeekValues(sc, dialStrength, week);
      history.push({ week, intended: vals.intended, real: vals.real });
      drawChart(history);
      weekNow.textContent = String(week);
      gamedCount.textContent = String(vals.gamedUnits);
      gamedIcons.textContent = sc.gamedIcon.repeat(Math.min(40, Math.max(0, Math.round(vals.gamedUnits / 3))));

      if (!revealed && week >= sc.onsetWeek + 1 && vals.gamedUnits > 8) {
        revealed = true;
        revealBanner.hidden = false;
        revealText.textContent = `${revealLeadIn(dialStrength)} ${sc.gamingNarrative}`;
      }

      if (week >= WEEKS) {
        clearInterval(timer);
        resetBtn.hidden = false;
        showHistory(sc, dialStrength);
      }
    }, 550);
  }

  function showHistory(sc, dialStrength) {
    historyPanel.hidden = false;
    dialRecap.textContent = dialRecapText(dialStrength);
    historyHeadline.textContent = sc.historical.headline;
    historyTag.textContent = sc.historical.source === "podcast"
      ? "as stated on the podcast"
      : "generalized pattern, not a specific real case";
    historyFacts.innerHTML = "";
    sc.historical.facts.forEach((f) => {
      const li = document.createElement("li");
      li.textContent = f;
      historyFacts.appendChild(li);
    });
    historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetToSetup() {
    if (timer) clearInterval(timer);
    setupPanel.hidden = false;
    simPanel.hidden = true;
    historyPanel.hidden = true;
    runBtn.disabled = !state.selected;
    setupPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  dial.addEventListener("input", () => {
    state.dial = Number(dial.value);
    dialValue.textContent = dial.value;
  });

  runBtn.addEventListener("click", () => {
    if (!state.selected || state.running) return;
    startSimulation();
  });

  resetBtn.addEventListener("click", resetToSetup);
  againBtn.addEventListener("click", resetToSetup);

  loadData().then((data) => {
    state.scenarios = data.scenarios;
    renderScenarioCards();
  });
})();
