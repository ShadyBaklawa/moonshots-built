(() => {
  "use strict";

  const TIERS = [
    { v: 1, label: "1 — Basic" },
    { v: 2, label: "2 — Standard" },
    { v: 3, label: "3 — Advanced" },
    { v: 4, label: "4 — Frontier-class" },
    { v: 5, label: "5 — Top frontier" },
  ];

  let nextWorkloadId = 1;
  let nextModelId = 1;

  const defaultWorkloads = () => [
    { id: nextWorkloadId++, name: "Support chatbot", inputM: 100, outputM: 20, tier: 3 },
  ];

  const defaultModels = () => [
    {
      id: nextModelId++,
      name: "Kimi K3.1 Pro",
      inputPrice: 2,
      outputPrice: 10,
      tier: 4,
      current: false,
      badge: "episode",
    },
    {
      id: nextModelId++,
      name: "Your current model",
      inputPrice: 15,
      outputPrice: 60,
      tier: 5,
      current: true,
      badge: "example",
    },
  ];

  const STORAGE_KEY = "moonshots-model-switch-savings-sheet.v1";

  function loadStoredState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.workloads) || !Array.isArray(parsed.models)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  const stored = loadStoredState();

  const workloads = stored ? stored.workloads : defaultWorkloads();
  const models = stored ? stored.models : defaultModels();
  if (stored) {
    nextWorkloadId = Math.max(0, ...workloads.map((w) => w.id)) + 1;
    nextModelId = Math.max(0, ...models.map((m) => m.id)) + 1;
  }

  let halvingDays = stored && typeof stored.halvingDays === "number" ? stored.halvingDays : 53;

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ workloads, models, halvingDays })
      );
    } catch {
      // storage unavailable (e.g. private browsing) — fail silently, nothing is lost beyond this tab
    }
  }

  const $ = (id) => document.getElementById(id);
  const money = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const money2 = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function tierOptions(selected) {
    return TIERS.map(
      (t) => `<option value="${t.v}" ${t.v === selected ? "selected" : ""}>${t.label}</option>`
    ).join("");
  }

  function cost(workload, model) {
    return workload.inputM * model.inputPrice + workload.outputM * model.outputPrice;
  }

  function qualifies(workload, model) {
    return model.tier >= workload.tier;
  }

  function cheapestQualifyingModel(workload) {
    const candidates = models.filter((m) => qualifies(workload, m));
    if (candidates.length === 0) return null;
    return candidates.reduce((best, m) => (cost(workload, m) < cost(workload, best) ? m : best));
  }

  function currentModel() {
    return models.find((m) => m.current) || models[0] || null;
  }

  // ---------- Workload table ----------
  function renderWorkloadTable() {
    const body = $("workloadBody");
    body.innerHTML = "";
    workloads.forEach((w) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.className = "cell-name";
      tdName.setAttribute("data-label", "Workload");
      tdName.innerHTML = `<input type="text" value="${escapeAttr(w.name)}" aria-label="Workload name">`;
      tdName.querySelector("input").addEventListener("input", (e) => {
        w.name = e.target.value;
        renderResults();
        renderChart();
      });

      const tdIn = document.createElement("td");
      tdIn.setAttribute("data-label", "Input tokens / mo (M)");
      tdIn.innerHTML = `<input type="number" min="0" step="any" value="${w.inputM}" aria-label="Input tokens per month in millions">`;
      tdIn.querySelector("input").addEventListener("input", (e) => {
        w.inputM = parseFloat(e.target.value) || 0;
        renderResults();
        renderChart();
      });

      const tdOut = document.createElement("td");
      tdOut.setAttribute("data-label", "Output tokens / mo (M)");
      tdOut.innerHTML = `<input type="number" min="0" step="any" value="${w.outputM}" aria-label="Output tokens per month in millions">`;
      tdOut.querySelector("input").addEventListener("input", (e) => {
        w.outputM = parseFloat(e.target.value) || 0;
        renderResults();
        renderChart();
      });

      const tdTier = document.createElement("td");
      tdTier.className = "cell-tier";
      tdTier.setAttribute("data-label", "Min. quality tier");
      tdTier.innerHTML = `<select class="tier-select" aria-label="Minimum quality tier" title="Self-assigned 1–5 scale, not a measured benchmark score">${tierOptions(w.tier)}</select>`;
      tdTier.querySelector("select").addEventListener("change", (e) => {
        w.tier = parseInt(e.target.value, 10);
        renderResults();
        renderChart();
      });

      const tdRemove = document.createElement("td");
      tdRemove.setAttribute("data-label", "Remove");
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "row-remove";
      removeBtn.setAttribute("aria-label", `Remove workload ${w.name}`);
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        const idx = workloads.indexOf(w);
        if (idx > -1) workloads.splice(idx, 1);
        renderWorkloadTable();
        renderResults();
        renderChart();
      });
      tdRemove.appendChild(removeBtn);

      tr.append(tdName, tdIn, tdOut, tdTier, tdRemove);
      body.appendChild(tr);
    });
  }

  // ---------- Price table ----------
  function renderPriceTable() {
    const body = $("priceBody");
    body.innerHTML = "";
    models.forEach((m) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.className = "cell-name";
      tdName.setAttribute("data-label", "Model");
      const badge =
        m.badge === "episode"
          ? `<span class="episode-badge">from Moonshots #306, verify current pricing</span>`
          : m.badge === "example"
          ? `<span class="episode-badge" style="background:var(--paper);color:var(--ink-soft);border:1px dashed var(--rule)">example — edit me</span>`
          : "";
      tdName.innerHTML = `<input type="text" value="${escapeAttr(m.name)}" aria-label="Model name"><br>${badge}`;
      tdName.querySelector("input").addEventListener("input", (e) => {
        m.name = e.target.value;
        renderResultsHead();
        renderResults();
        renderChart();
      });

      const tdIn = document.createElement("td");
      tdIn.setAttribute("data-label", "Input $ / M tok");
      tdIn.innerHTML = `<input type="number" min="0" step="any" value="${m.inputPrice}" aria-label="Input price per million tokens">`;
      tdIn.querySelector("input").addEventListener("input", (e) => {
        m.inputPrice = parseFloat(e.target.value) || 0;
        renderResults();
        renderChart();
      });

      const tdOut = document.createElement("td");
      tdOut.setAttribute("data-label", "Output $ / M tok");
      tdOut.innerHTML = `<input type="number" min="0" step="any" value="${m.outputPrice}" aria-label="Output price per million tokens">`;
      tdOut.querySelector("input").addEventListener("input", (e) => {
        m.outputPrice = parseFloat(e.target.value) || 0;
        renderResults();
        renderChart();
      });

      const tdTier = document.createElement("td");
      tdTier.className = "cell-tier";
      tdTier.setAttribute("data-label", "Quality tier");
      tdTier.innerHTML = `<select class="tier-select" aria-label="Model quality tier" title="Self-assigned 1–5 scale, not a measured benchmark score">${tierOptions(m.tier)}</select>`;
      tdTier.querySelector("select").addEventListener("change", (e) => {
        m.tier = parseInt(e.target.value, 10);
        renderResults();
        renderChart();
      });

      const tdCurrent = document.createElement("td");
      tdCurrent.setAttribute("data-label", "Current?");
      tdCurrent.innerHTML = `<label class="radio-tap"><input type="radio" name="currentModel" aria-label="Use as current model baseline" ${m.current ? "checked" : ""}></label>`;
      tdCurrent.querySelector("input").addEventListener("change", () => {
        models.forEach((mm) => (mm.current = mm === m));
        renderResults();
        renderChart();
      });

      const tdRemove = document.createElement("td");
      tdRemove.setAttribute("data-label", "Remove");
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "row-remove";
      removeBtn.setAttribute("aria-label", `Remove model ${m.name}`);
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", () => {
        const idx = models.indexOf(m);
        if (idx > -1) models.splice(idx, 1);
        if (!models.some((mm) => mm.current) && models.length) models[0].current = true;
        renderPriceTable();
        renderResultsHead();
        renderResults();
        renderChart();
      });
      tdRemove.appendChild(removeBtn);

      tr.append(tdName, tdIn, tdOut, tdTier, tdCurrent, tdRemove);
      body.appendChild(tr);
    });
  }

  // ---------- Results ----------
  function renderResultsHead() {
    const head = $("resultsHead");
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<th scope="col">Workload</th>` +
      models.map((m) => `<th scope="col">${escapeHtml(m.name)}</th>`).join("");
    head.innerHTML = "";
    head.appendChild(tr);
  }

  function renderResults() {
    const body = $("resultsBody");
    body.innerHTML = "";

    workloads.forEach((w) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.setAttribute("data-label", "Workload");
      tdName.textContent = w.name || "(untitled)";
      tr.appendChild(tdName);

      const winner = cheapestQualifyingModel(w);

      models.forEach((m) => {
        const td = document.createElement("td");
        td.setAttribute("data-label", m.name);
        const c = cost(w, m);
        const ok = qualifies(w, m);
        if (!ok) {
          td.className = "cell-fail";
          td.innerHTML = `${money(c)}<br><span class="pill">tier ${m.tier} &lt; ${w.tier}</span>`;
          td.title = "This model's quality tier is below the workload's minimum.";
        } else {
          const isWinner = winner && winner.id === m.id;
          td.className = "cell-cost" + (isWinner ? " cell-win" : "");
          td.innerHTML = isWinner
            ? `${money(c)}<br><span class="pill pill-win">cheapest qualifying</span>`
            : money(c);
        }
        tr.appendChild(td);
      });

      body.appendChild(tr);
    });

    renderTotals();
    saveState();
  }

  function renderTotals() {
    const el = $("totals");
    const cm = currentModel();
    let currentTotal = 0;
    let bestTotal = 0;
    let anyUnmet = false;

    workloads.forEach((w) => {
      currentTotal += cm ? cost(w, cm) : 0;
      const winner = cheapestQualifyingModel(w);
      if (winner) {
        bestTotal += cost(w, winner);
      } else {
        bestTotal += cm ? cost(w, cm) : 0;
        anyUnmet = true;
      }
    });

    const savingsMonthly = Math.max(0, currentTotal - bestTotal);
    const savingsYearly = savingsMonthly * 12;

    el.innerHTML = `
      <div class="total-card">
        <div class="label">Monthly cost today${cm ? " (" + escapeHtml(cm.name) + ")" : ""}</div>
        <div class="value">${money2(currentTotal)}</div>
      </div>
      <div class="total-card">
        <div class="label">Monthly cost if you switch</div>
        <div class="value">${money2(bestTotal)}</div>
      </div>
      <div class="total-card savings">
        <div class="label">Monthly savings</div>
        <div class="value">${money2(savingsMonthly)}</div>
      </div>
      <div class="total-card savings">
        <div class="label">Yearly savings</div>
        <div class="value">${money2(savingsYearly)}</div>
      </div>
      ${anyUnmet ? `<div class="total-card" style="grid-column:1/-1;color:var(--danger)">Some workloads have no model in the table that meets their quality tier &mdash; add one to see real savings there.</div>` : ""}
    `;
  }

  // ---------- Chart ----------
  function renderChart() {
    const svg = $("chart");
    const cm = currentModel();
    const months = Array.from({ length: 13 }, (_, i) => i);

    const baselineTotal = () =>
      workloads.reduce((sum, w) => sum + (cm ? cost(w, cm) : 0), 0);

    function projectedTotal(monthIdx) {
      const mult = Math.pow(0.5, (30 * monthIdx) / Math.max(1, halvingDays));
      return workloads.reduce((sum, w) => {
        const winner = cheapestQualifyingModel(w);
        if (!winner) return sum + (cm ? cost(w, cm) : 0);
        const decayed = {
          inputPrice: winner.inputPrice * mult,
          outputPrice: winner.outputPrice * mult,
        };
        return sum + w.inputM * decayed.inputPrice + w.outputM * decayed.outputPrice;
      }, 0);
    }

    const baseline = baselineTotal();
    const projected = months.map(projectedTotal);
    const maxVal = Math.max(baseline, ...projected, 1);

    const W = 640, H = 300, padL = 56, padR = 16, padT = 20, padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const x = (m) => padL + (m / 12) * plotW;
    const yScale = (v) => padT + plotH - (v / maxVal) * plotH;

    const baselinePath = months.map((m) => `${x(m)},${yScale(baseline)}`).join(" ");
    const projectedPath = months.map((m, i) => `${x(m)},${yScale(projected[i])}`).join(" ");

    let gridLines = "";
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4) * i;
      const y = yScale(v);
      gridLines += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--rule)" stroke-width="1" />`;
      gridLines += `<text x="${padL - 8}" y="${y + 4}" font-size="11" text-anchor="end" fill="var(--ink-soft)">${money(v)}</text>`;
    }

    let xLabels = "";
    [0, 3, 6, 9, 12].forEach((m) => {
      xLabels += `<text x="${x(m)}" y="${H - 10}" font-size="11" text-anchor="middle" fill="var(--ink-soft)">${m}mo</text>`;
    });

    const markerMonths = [6, 12];
    let markers = "";
    markerMonths.forEach((m) => {
      const px = x(m);
      const py = yScale(projected[m]);
      markers += `<circle cx="${px}" cy="${py}" r="4" fill="var(--accent)" />`;
      markers += `<text x="${px}" y="${py - 10}" font-size="11" text-anchor="middle" fill="var(--accent)">${money(projected[m])}</text>`;
    });

    svg.innerHTML = `
      <title id="chartTitle">Projected monthly cost over 12 months</title>
      ${gridLines}
      ${xLabels}
      <polyline points="${baselinePath}" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="5,4" />
      <polyline points="${projectedPath}" fill="none" stroke="var(--accent)" stroke-width="2.5" />
      ${markers}
    `;

    $("chartLegend").innerHTML = `
      <span><span class="swatch" style="background:var(--ink-soft)"></span>If you stay on ${cm ? escapeHtml(cm.name) : "current model"} (flat)</span>
      <span><span class="swatch" style="background:var(--accent)"></span>If you keep switching to the cheapest qualifying model (illustrative)</span>
    `;

    saveState();
  }

  // ---------- CSV export ----------
  function csvSafe(cell) {
    const s = String(cell);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  }

  function exportCsv() {
    const rows = [["Workload", "Model", "Input $/M", "Output $/M", "Monthly Cost", "Meets Tier", "Cheapest Qualifying"]];
    workloads.forEach((w) => {
      const winner = cheapestQualifyingModel(w);
      models.forEach((m) => {
        rows.push([
          w.name,
          m.name,
          m.inputPrice,
          m.outputPrice,
          cost(w, m).toFixed(2),
          qualifies(w, m) ? "yes" : "no",
          winner && winner.id === m.id ? "yes" : "no",
        ]);
      });
    });
    const csv = rows
      .map((r) => r.map((cell) => `"${csvSafe(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "model-switch-savings.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function renderAll() {
    renderWorkloadTable();
    renderPriceTable();
    renderResultsHead();
    renderResults();
    renderChart();
  }

  $("addWorkload").addEventListener("click", () => {
    workloads.push({ id: nextWorkloadId++, name: "New workload", inputM: 10, outputM: 2, tier: 2 });
    renderWorkloadTable();
    renderResults();
    renderChart();
  });

  $("addModel").addEventListener("click", () => {
    models.push({
      id: nextModelId++,
      name: "New model",
      inputPrice: 1,
      outputPrice: 5,
      tier: 3,
      current: false,
      badge: null,
    });
    renderPriceTable();
    renderResultsHead();
    renderResults();
    renderChart();
  });

  $("halvingInput").addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    halvingDays = v > 0 ? v : 1;
    renderChart();
  });

  $("exportCsv").addEventListener("click", exportCsv);
  $("printReport").addEventListener("click", () => window.print());

  renderAll();
})();
