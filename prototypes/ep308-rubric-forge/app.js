(() => {
  "use strict";

  const STATE_ORDER = [undefined, "pass", "partial", "fail"];
  const STATE_LABEL = { pass: "P", partial: "~", fail: "F" };
  const STATE_VALUE = { pass: 1, partial: 0.5, fail: 0 };
  const STATE_NAME = { pass: "Pass", partial: "Partial", fail: "Fail" };

  let nextId = 1;
  let spec = []; // { id, task, criteria, weight }
  let models = ["Model A", "Model B"];
  let scores = {}; // scores[taskId][modelIndex] = "pass" | "partial" | "fail" | undefined
  let isExample = false;

  const el = (id) => document.getElementById(id);

  const taskInput = el("task-input");
  const buildBtn = el("build-btn");
  const exampleBtn = el("example-btn");
  const clearBtn = el("clear-btn");
  const apiKeyInput = el("api-key");
  const draftBtn = el("draft-btn");
  const aiStatus = el("ai-status");
  const exampleBadge = el("example-badge");

  const specSection = el("spec-section");
  const specBody = el("spec-body");
  const addTaskBtn = el("add-task-btn");

  const modelsSection = el("models-section");
  const modelInputsRow = el("model-inputs");
  const addModelBtn = el("add-model-btn");
  const removeModelBtn = el("remove-model-btn");

  const scoreSection = el("score-section");
  const scoreBars = el("score-bars");
  const scoreHead = el("score-head");
  const scoreBody = el("score-body");

  const exportSection = el("export-section");
  const exportJsonBtn = el("export-json-btn");
  const exportCsvBtn = el("export-csv-btn");

  function parseLine(line) {
    const idx = line.indexOf("|");
    if (idx === -1) return { task: line.trim(), criteria: "" };
    return { task: line.slice(0, idx).trim(), criteria: line.slice(idx + 1).trim() };
  }

  function buildSpecFromText(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    spec = lines.map((line) => {
      const { task, criteria } = parseLine(line);
      return { id: nextId++, task, criteria, weight: 3 };
    });
    scores = {};
    spec.forEach((row) => (scores[row.id] = {}));
  }

  function revealSections() {
    specSection.classList.remove("hidden");
    modelsSection.classList.remove("hidden");
    scoreSection.classList.remove("hidden");
    exportSection.classList.remove("hidden");
  }

  function renderSpecTable() {
    specBody.innerHTML = "";
    spec.forEach((row) => {
      const tr = document.createElement("tr");

      const tdTask = document.createElement("td");
      const taskArea = document.createElement("textarea");
      taskArea.className = "cell-task";
      taskArea.value = row.task;
      taskArea.setAttribute("aria-label", "Task");
      taskArea.addEventListener("input", () => {
        row.task = taskArea.value;
        renderScoreTable();
      });
      tdTask.appendChild(taskArea);

      const tdCriteria = document.createElement("td");
      const critArea = document.createElement("textarea");
      critArea.className = "cell-task";
      critArea.value = row.criteria;
      critArea.placeholder = "Define what good looks like";
      critArea.setAttribute("aria-label", "Pass criteria");
      critArea.addEventListener("input", () => {
        row.criteria = critArea.value;
      });
      tdCriteria.appendChild(critArea);

      const tdWeight = document.createElement("td");
      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.className = "cell-weight";
      weightInput.min = "1";
      weightInput.max = "5";
      weightInput.step = "1";
      weightInput.value = String(row.weight);
      weightInput.setAttribute("aria-label", "Weight");
      weightInput.addEventListener("input", () => {
        const v = parseInt(weightInput.value, 10);
        row.weight = Number.isFinite(v) ? Math.min(5, Math.max(1, v)) : 1;
        renderScoreBars();
      });
      tdWeight.appendChild(weightInput);

      const tdDel = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.className = "remove-row-btn";
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.setAttribute("aria-label", "Remove task");
      delBtn.addEventListener("click", () => {
        spec = spec.filter((r) => r.id !== row.id);
        delete scores[row.id];
        renderSpecTable();
        renderScoreTable();
      });
      tdDel.appendChild(delBtn);

      tr.appendChild(tdTask);
      tr.appendChild(tdCriteria);
      tr.appendChild(tdWeight);
      tr.appendChild(tdDel);
      specBody.appendChild(tr);
    });
  }

  function renderModelInputs() {
    modelInputsRow.innerHTML = "";
    models.forEach((name, i) => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = name;
      input.setAttribute("aria-label", "Model name " + (i + 1));
      input.addEventListener("input", () => {
        models[i] = input.value;
        renderScoreTable();
      });
      modelInputsRow.appendChild(input);
    });
  }

  function cellState(taskId, modelIndex) {
    return (scores[taskId] || {})[modelIndex];
  }

  function setCellState(taskId, modelIndex, state) {
    if (!scores[taskId]) scores[taskId] = {};
    if (state === undefined) delete scores[taskId][modelIndex];
    else scores[taskId][modelIndex] = state;
  }

  function cycleState(current) {
    const i = STATE_ORDER.indexOf(current);
    return STATE_ORDER[(i + 1) % STATE_ORDER.length];
  }

  function renderScoreTable() {
    scoreHead.innerHTML = "<th class=\"col-task\">Task</th>";
    models.forEach((name, i) => {
      const th = document.createElement("th");
      th.className = "score-col-head";
      const input = document.createElement("input");
      input.type = "text";
      input.value = name;
      input.setAttribute("aria-label", "Model name " + (i + 1));
      input.addEventListener("input", () => {
        models[i] = input.value;
        renderScoreBars();
        syncModelInputs();
      });
      th.appendChild(input);
      scoreHead.appendChild(th);
    });

    scoreBody.innerHTML = "";
    spec.forEach((row) => {
      const tr = document.createElement("tr");
      const tdTask = document.createElement("td");
      tdTask.className = "col-task";
      tdTask.textContent = row.task || "(untitled task)";
      tdTask.title = row.task;
      tr.appendChild(tdTask);

      models.forEach((_, modelIndex) => {
        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "score-cell";
        const state = cellState(row.id, modelIndex);
        applyCellVisual(btn, state, row, modelIndex);
        btn.addEventListener("click", () => {
          const next = cycleState(cellState(row.id, modelIndex));
          setCellState(row.id, modelIndex, next);
          applyCellVisual(btn, next, row, modelIndex);
          renderScoreBars();
        });
        td.appendChild(btn);
        tr.appendChild(td);
      });
      scoreBody.appendChild(tr);
    });

    renderScoreBars();
  }

  function applyCellVisual(btn, state, row, modelIndex) {
    if (state) btn.dataset.state = state;
    else delete btn.dataset.state;
    btn.textContent = state ? STATE_LABEL[state] : "–";
    const modelName = models[modelIndex] || "Model " + (modelIndex + 1);
    btn.setAttribute(
      "aria-label",
      (row.task || "task") + " — " + modelName + ": " + (state ? STATE_NAME[state] : "Unscored") + ". Click to change."
    );
  }

  function syncModelInputs() {
    const inputs = modelInputsRow.querySelectorAll("input");
    inputs.forEach((input, i) => {
      if (models[i] !== undefined && input.value !== models[i]) input.value = models[i];
    });
  }

  function computeWeightedScore(modelIndex) {
    let weightSum = 0;
    let scoredWeightSum = 0;
    let scoredCount = 0;
    spec.forEach((row) => {
      const w = row.weight || 1;
      weightSum += w;
      const state = cellState(row.id, modelIndex);
      if (state) {
        scoredCount++;
        scoredWeightSum += w * STATE_VALUE[state];
      }
    });
    const pct = weightSum > 0 ? Math.round((scoredWeightSum / weightSum) * 100) : 0;
    return { pct, scoredCount, total: spec.length };
  }

  function renderScoreBars() {
    scoreBars.innerHTML = "";
    models.forEach((name, i) => {
      const { pct, scoredCount, total } = computeWeightedScore(i);
      const row = document.createElement("div");
      row.className = "score-bar-row";

      const nameEl = document.createElement("div");
      nameEl.className = "score-bar-name";
      nameEl.textContent = (name || "Model " + (i + 1)) + " (" + scoredCount + "/" + total + ")";

      const track = document.createElement("div");
      track.className = "score-bar-track";
      const fill = document.createElement("div");
      fill.className = "score-bar-fill";
      fill.style.width = pct + "%";
      track.appendChild(fill);

      const pctEl = document.createElement("div");
      pctEl.className = "score-bar-pct";
      pctEl.textContent = pct + "%";

      row.appendChild(nameEl);
      row.appendChild(track);
      row.appendChild(pctEl);
      scoreBars.appendChild(row);
    });
  }

  function loadExample() {
    fetch("data/example.json")
      .then((r) => r.json())
      .then((data) => {
        spec = data.tasks.map((t) => ({ id: nextId++, task: t.task, criteria: t.criteria, weight: t.weight }));
        models = data.models.slice(0, 4);
        scores = {};
        spec.forEach((row, i) => {
          scores[row.id] = {};
          const srcScores = data.tasks[i].scores || [];
          srcScores.forEach((s, modelIndex) => {
            if (s) scores[row.id][modelIndex] = s;
          });
        });
        isExample = true;
        exampleBadge.classList.remove("hidden");
        taskInput.value = spec.map((r) => r.task + " | " + r.criteria).join("\n");
        revealSections();
        renderSpecTable();
        renderModelInputs();
        renderScoreTable();
      })
      .catch(() => {
        aiStatus.textContent = "Could not load the example data file.";
      });
  }

  buildBtn.addEventListener("click", () => {
    const text = taskInput.value;
    if (!text.trim()) return;
    isExample = false;
    exampleBadge.classList.add("hidden");
    buildSpecFromText(text);
    if (models.length === 0) models = ["Model A", "Model B"];
    revealSections();
    renderSpecTable();
    renderModelInputs();
    renderScoreTable();
  });

  exampleBtn.addEventListener("click", loadExample);

  clearBtn.addEventListener("click", () => {
    taskInput.value = "";
    spec = [];
    scores = {};
    models = ["Model A", "Model B"];
    isExample = false;
    exampleBadge.classList.add("hidden");
    aiStatus.textContent = "";
    specSection.classList.add("hidden");
    modelsSection.classList.add("hidden");
    scoreSection.classList.add("hidden");
    exportSection.classList.add("hidden");
  });

  addTaskBtn.addEventListener("click", () => {
    spec.push({ id: nextId++, task: "", criteria: "", weight: 3 });
    scores[spec[spec.length - 1].id] = {};
    renderSpecTable();
    renderScoreTable();
  });

  addModelBtn.addEventListener("click", () => {
    if (models.length >= 4) return;
    models.push("Model " + String.fromCharCode(65 + models.length));
    renderModelInputs();
    renderScoreTable();
  });

  removeModelBtn.addEventListener("click", () => {
    if (models.length <= 1) return;
    models.pop();
    renderModelInputs();
    renderScoreTable();
  });

  function csvEscape(val) {
    const s = String(val === undefined ? "" : val);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildExportData() {
    const weightedScores = {};
    models.forEach((name, i) => {
      weightedScores[name || "Model " + (i + 1)] = computeWeightedScore(i).pct;
    });
    return {
      generatedAt: new Date().toISOString(),
      isExample,
      models,
      tasks: spec.map((row) => ({
        task: row.task,
        criteria: row.criteria,
        weight: row.weight,
        scores: models.map((_, i) => cellState(row.id, i) || null),
      })),
      weightedScores,
    };
  }

  exportJsonBtn.addEventListener("click", () => {
    const data = buildExportData();
    download("rubric-forge-benchmark.json", JSON.stringify(data, null, 2), "application/json");
  });

  exportCsvBtn.addEventListener("click", () => {
    const header = ["Task", "Pass criteria", "Weight", ...models.map((m, i) => m || "Model " + (i + 1))];
    const lines = [header.map(csvEscape).join(",")];
    spec.forEach((row) => {
      const cells = [row.task, row.criteria, row.weight, ...models.map((_, i) => {
        const s = cellState(row.id, i);
        return s ? STATE_NAME[s] : "Unscored";
      })];
      lines.push(cells.map(csvEscape).join(","));
    });
    lines.push("");
    lines.push(["Weighted score %", "", "", ...models.map((_, i) => computeWeightedScore(i).pct)].map(csvEscape).join(","));
    download("rubric-forge-benchmark.csv", lines.join("\n"), "text/csv");
  });

  draftBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      aiStatus.textContent = "Enter an API key first.";
      return;
    }
    const missing = spec.filter((row) => !row.criteria.trim());
    if (missing.length === 0) {
      aiStatus.textContent = "Every task already has pass criteria.";
      return;
    }
    draftBtn.disabled = true;
    aiStatus.textContent = "Drafting pass criteria for " + missing.length + " task(s)...";
    try {
      const prompt =
        "For each task below, write one short sentence describing what a correct, complete result looks like. " +
        "Respond with ONLY a JSON array of strings, one per task, in the same order, no other text.\n\n" +
        missing.map((row, i) => (i + 1) + ". " + row.task).join("\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error("API error " + res.status + ": " + errText.slice(0, 200));
      }

      const data = await res.json();
      const text = (data.content && data.content[0] && data.content[0].text) || "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const drafted = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      missing.forEach((row, i) => {
        if (typeof drafted[i] === "string") row.criteria = drafted[i];
      });
      renderSpecTable();
      aiStatus.textContent = "Drafted " + Math.min(drafted.length, missing.length) + " criteria. Review and edit as needed.";
    } catch (err) {
      aiStatus.textContent = "Could not draft criteria: " + err.message;
    } finally {
      draftBtn.disabled = false;
    }
  });

  renderModelInputs();
})();
