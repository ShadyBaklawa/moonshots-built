// Site Heat Scorecard — scoring, ranking, memo export, talking points.

const FACTORS = [
  {
    key: "moratorium",
    label: "Moratorium status",
    defaultWeight: 3,
    score(site) {
      if (site.moratorium === "passed") return 100;
      if (site.moratorium === "proposed") return 60;
      return 0;
    },
    reason(site) {
      if (site.moratorium === "passed") return "Moratorium already in effect";
      if (site.moratorium === "proposed") return "Moratorium proposed, vote pending";
      return "No moratorium on the table";
    },
  },
  {
    key: "voteTiming",
    label: "Vote timing",
    defaultWeight: 2,
    score(site) {
      if (!site.voteDate) return 0;
      const days = (new Date(site.voteDate) - new Date()) / 86400000;
      if (days <= 30) return 90;
      if (days <= 90) return 55;
      return 25;
    },
    reason(site) {
      if (!site.voteDate) return "No vote currently scheduled";
      const days = Math.round((new Date(site.voteDate) - new Date()) / 86400000);
      if (days < 0) return "Relevant vote already passed";
      if (days <= 30) return `Vote in ${days} day(s) — very near-term`;
      if (days <= 90) return `Vote in ${days} days — near-term`;
      return `Vote in ${days} days — not imminent`;
    },
  },
  {
    key: "distance",
    label: "Distance to nearest homes",
    defaultWeight: 2,
    score(site) {
      const d = site.distance;
      if (d < 0.25) return 100;
      if (d < 0.5) return 75;
      if (d < 1) return 50;
      if (d < 2) return 25;
      return 5;
    },
    reason(site) {
      return `${site.distance} mi from nearest homes`;
    },
  },
  {
    key: "water",
    label: "Water source",
    defaultWeight: 1.5,
    score(site) {
      const map = { "closed-loop": 5, recycled: 30, groundwater: 65, municipal: 100 };
      return map[site.water] ?? 50;
    },
    reason(site) {
      const map = {
        "closed-loop": "Closed-loop / air-cooled — low community water competition",
        recycled: "Recycled / reclaimed water — moderate concern",
        groundwater: "Groundwater / well sourced — raises aquifer concerns",
        municipal: "Municipal / potable supply — competes with residential use",
      };
      return map[site.water] ?? "Water source unclear";
    },
  },
  {
    key: "abatement",
    label: "Tax abatement",
    defaultWeight: 1,
    score(site) {
      const map = { none: 5, pending: 45, approved: 75 };
      return map[site.abatement] ?? 5;
    },
    reason(site) {
      const map = {
        none: "No tax abatement requested",
        pending: "Tax abatement pending — a visible target for critics",
        approved: "Tax abatement approved — \"corporate welfare\" attack line likely",
      };
      return map[site.abatement] ?? "Tax abatement status unclear";
    },
  },
  {
    key: "opposition",
    label: "Opposition groups",
    defaultWeight: 1.5,
    score(site) {
      const n = site.oppositionGroups.length;
      if (n >= 3) return 100;
      if (n === 2) return 65;
      if (n === 1) return 35;
      return 5;
    },
    reason(site) {
      const n = site.oppositionGroups.length;
      if (n === 0) return "No known organized opposition";
      return `${n} known opposition group${n > 1 ? "s" : ""}: ${site.oppositionGroups.join(", ")}`;
    },
  },
];

const STORAGE_KEY = "ep309-site-heat-scorecard-api-key";

let sites = [];
let weights = Object.fromEntries(FACTORS.map((f) => [f.key, f.defaultWeight]));
let nextId = 1;

// ---------- helpers ----------

function heatColor(score) {
  // 0 -> blue (safe), 50 -> green/yellow, 100 -> red (hot risk)
  const hue = 200 - (score / 100) * 200;
  return { fill: `hsl(${hue}, 78%, 48%)`, glow: `hsl(${hue}, 85%, 55%)` };
}

function computeSite(site) {
  let weightedSum = 0;
  let weightTotal = 0;
  const reasons = [];
  for (const factor of FACTORS) {
    const raw = factor.score(site);
    const w = weights[factor.key];
    weightedSum += raw * w;
    weightTotal += w;
    reasons.push({ label: factor.label, points: Math.round(raw), text: factor.reason(site) });
  }
  const score = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;
  return { score, reasons };
}

function fmtDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---------- rendering ----------

function renderWeights() {
  const container = document.getElementById("weights");
  container.innerHTML = "";
  for (const factor of FACTORS) {
    const row = document.createElement("div");
    row.className = "weight-row";
    row.innerHTML = `
      <div class="weight-row-label">
        <span>${factor.label}</span>
        <span data-out="${factor.key}">${weights[factor.key].toFixed(1)}×</span>
      </div>
      <input type="range" min="0" max="5" step="0.5" value="${weights[factor.key]}" data-weight="${factor.key}">
    `;
    container.appendChild(row);
  }
  container.querySelectorAll("input[type=range]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const key = e.target.dataset.weight;
      weights[key] = parseFloat(e.target.value);
      container.querySelector(`[data-out="${key}"]`).textContent = weights[key].toFixed(1) + "×";
      renderScorecard();
    });
  });
}

function renderScorecard() {
  const container = document.getElementById("scorecard");
  const emptyHint = document.getElementById("empty-hint");
  const countEl = document.getElementById("site-count");

  if (sites.length === 0) {
    container.innerHTML = "";
    emptyHint.style.display = "block";
    countEl.textContent = "";
    return;
  }
  emptyHint.style.display = "none";
  countEl.textContent = `(${sites.length} site${sites.length > 1 ? "s" : ""})`;

  const scored = sites
    .map((site) => ({ site, ...computeSite(site) }))
    .sort((a, b) => b.score - a.score);

  container.innerHTML = "";
  scored.forEach(({ site, score, reasons }, i) => {
    const { fill, glow } = heatColor(score);
    const card = document.createElement("article");
    card.className = "site-card";
    card.style.setProperty("--heat-color", fill);
    card.style.setProperty("--heat-glow", glow);

    const reasonItems = reasons
      .map((r) => `<li><span>${r.text}</span><span class="pts">${r.points}</span></li>`)
      .join("");

    card.innerHTML = `
      <div class="site-card-top">
        <div class="site-card-heading">
          <span class="rank-badge">Rank #${i + 1} of ${scored.length}</span>
          <h3>${escapeHtml(site.name)}</h3>
          <div class="loc">${escapeHtml(site.county)} County, ${escapeHtml(site.state)}</div>
        </div>
        <div class="score-badge">
          <span class="num">${score}</span>
          <span class="lbl">/ 100</span>
        </div>
      </div>
      <div class="heat-bar"><div class="heat-bar-fill" style="width:${score}%"></div></div>
      <ul class="reasons">${reasonItems}</ul>
      <div class="site-actions">
        <button type="button" class="btn btn-talk" data-talk="${site.id}">Draft community talking points</button>
        <button type="button" class="btn btn-remove" data-remove="${site.id}">Remove site</button>
      </div>
      <div class="talk-slot" data-talk-slot="${site.id}"></div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sites = sites.filter((s) => s.id !== Number(btn.dataset.remove));
      renderScorecard();
    });
  });
  container.querySelectorAll("[data-talk]").forEach((btn) => {
    btn.addEventListener("click", () => handleTalkingPoints(Number(btn.dataset.talk), btn));
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- talking points ----------

function exampleTalkingPoints(site, reasons) {
  const top = [...reasons].sort((a, b) => b.points - a.points)[0];
  return [
    `"${site.name}" supports local jobs and tax revenue for ${site.county} County while ${site.water === "municipal" ? "working with the utility on a water plan that protects residential supply" : "using a water approach designed to limit impact on nearby wells"}.`,
    `We are proposing a community benefit agreement and a public comment session ahead of the ${site.voteDate ? "scheduled vote" : "next zoning review"}.`,
    `On the top concern raised (${top.text.toLowerCase()}), we are open to independent monitoring and a published mitigation plan.`,
  ];
}

async function handleTalkingPoints(id, btn) {
  const site = sites.find((s) => s.id === id);
  if (!site) return;
  const slot = document.querySelector(`[data-talk-slot="${id}"]`);
  const { reasons } = computeSite(site);
  const apiKey = document.getElementById("api-key").value.trim();

  if (!apiKey) {
    const points = exampleTalkingPoints(site, reasons);
    slot.innerHTML = `
      <div class="talk-box">
        <span class="tag">Example</span>
        <ul>${points.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      </div>`;
    return;
  }

  slot.innerHTML = `<div class="talk-box"><span class="tag live">Drafting…</span><p class="talk-loading">Calling your API key…</p></div>`;
  btn.disabled = true;
  try {
    const prompt = `You are helping a data center developer draft 3 short, honest community talking points (one sentence each) for a public meeting about this candidate site. Be concrete and non-dismissive of concerns.
Site: ${site.name}, ${site.county} County, ${site.state}
Moratorium status: ${site.moratorium}
Water source: ${site.water}
Tax abatement: ${site.abatement}
Distance to nearest homes: ${site.distance} miles
Known opposition groups: ${site.oppositionGroups.join(", ") || "none known"}
Top risk factors: ${reasons.map((r) => `${r.label} (${r.points}/100)`).join("; ")}
Return exactly 3 bullet points, no preamble.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || "No response text returned.";
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    slot.innerHTML = `
      <div class="talk-box">
        <span class="tag live">Drafted with your API key</span>
        <ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
      </div>`;
  } catch (err) {
    slot.innerHTML = `
      <div class="talk-box">
        <span class="tag">Error</span>
        <p class="talk-error">Could not draft with your key (${escapeHtml(err.message)}). Showing example instead.</p>
        <span class="tag">Example</span>
        <ul>${exampleTalkingPoints(site, reasons).map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
      </div>`;
  } finally {
    btn.disabled = false;
  }
}

// ---------- memo export ----------

function buildMemo() {
  const scored = sites
    .map((site) => ({ site, ...computeSite(site) }))
    .sort((a, b) => b.score - a.score);

  document.getElementById("memo-date").textContent = `Generated ${fmtDate(new Date())} · Site Heat Scorecard`;
  const body = document.getElementById("memo-body");
  if (scored.length === 0) {
    body.innerHTML = "<p>No sites added yet.</p>";
    return;
  }
  body.innerHTML = scored
    .map(
      ({ site, score, reasons }, i) => `
    <div class="memo-site">
      <h3>#${i + 1} — ${escapeHtml(site.name)} <span class="memo-score">(${score}/100 risk)</span></h3>
      <div>${escapeHtml(site.county)} County, ${escapeHtml(site.state)}</div>
      <ul>${reasons.map((r) => `<li>${escapeHtml(r.text)} — ${r.points} pts</li>`).join("")}</ul>
    </div>`
    )
    .join("");
}

// ---------- form ----------

function setupForm() {
  const form = document.getElementById("site-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get("name").trim();
    const state = fd.get("state").trim();
    const county = fd.get("county").trim();
    const distance = parseFloat(fd.get("distance"));
    if (!name || !state || !county || Number.isNaN(distance)) return;

    const oppositionRaw = fd.get("opposition").trim();
    const oppositionGroups = oppositionRaw
      ? oppositionRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    sites.push({
      id: nextId++,
      name,
      state,
      county,
      moratorium: fd.get("moratorium"),
      voteDate: fd.get("voteDate") || null,
      distance,
      water: fd.get("water"),
      abatement: fd.get("abatement"),
      oppositionGroups,
    });
    form.reset();
    renderScorecard();
    document.getElementById("f-name").focus();
  });
}

function setupMisc() {
  document.getElementById("reset-weights").addEventListener("click", () => {
    weights = Object.fromEntries(FACTORS.map((f) => [f.key, f.defaultWeight]));
    renderWeights();
    renderScorecard();
  });

  document.getElementById("export-memo").addEventListener("click", () => {
    buildMemo();
    window.print();
  });

  const apiKeyInput = document.getElementById("api-key");
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) apiKeyInput.value = saved;
  apiKeyInput.addEventListener("input", () => {
    if (apiKeyInput.value.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  });
}

function seedExampleSites() {
  sites.push(
    {
      id: nextId++,
      name: "Example: Riverton Parcel 12",
      state: "GA",
      county: "Walton",
      moratorium: "proposed",
      voteDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
      distance: 0.4,
      water: "municipal",
      abatement: "pending",
      oppositionGroups: ["Save Walton Water"],
    },
    {
      id: nextId++,
      name: "Example: Cedar Ridge Site B",
      state: "VA",
      county: "Loudoun",
      moratorium: "passed",
      voteDate: null,
      distance: 0.2,
      water: "groundwater",
      abatement: "approved",
      oppositionGroups: ["Loudoun Residents United", "Quiet Skies Coalition", "Water Watch"],
    },
    {
      id: nextId++,
      name: "Example: Open Prairie Campus",
      state: "WY",
      county: "Laramie",
      moratorium: "none",
      voteDate: null,
      distance: 3.2,
      water: "closed-loop",
      abatement: "none",
      oppositionGroups: [],
    }
  );
}

function init() {
  seedExampleSites();
  renderWeights();
  renderScorecard();
  setupForm();
  setupMisc();
}

document.addEventListener("DOMContentLoaded", init);
