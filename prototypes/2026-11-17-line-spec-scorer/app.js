(function () {
  "use strict";

  var SPEED_FIGURE = { value: "sub-three seconds", timestamp: "00:21:21" };
  var WEIGHT_FIGURE = { value: "50 lb", timestamp: "01:05:37" };

  var taskRowsEl = document.getElementById("taskRows");
  var exampleBanner = document.getElementById("exampleBanner");
  var resultsPanel = document.getElementById("resultsPanel");
  var resultsBody = document.getElementById("resultsBody");

  var nextId = 1;
  var tasks = [];

  function blankTask() {
    return { id: nextId++, name: "", cycleTime: "", variation: "", weight: "", handoff: false };
  }

  function addTask(data) {
    var t = data ? Object.assign(blankTask(), data) : blankTask();
    tasks.push(t);
    renderTasks();
  }

  function removeTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    if (tasks.length === 0) tasks.push(blankTask());
    renderTasks();
  }

  function renderTasks() {
    taskRowsEl.innerHTML = "";
    tasks.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "task-row";
      row.dataset.id = t.id;
      row.innerHTML =
        '<div class="field">' +
          '<label>Task name</label>' +
          '<input type="text" class="f-name" placeholder="e.g. Tote de-palletizing" value="' + escapeAttr(t.name) + '">' +
        '</div>' +
        '<div class="field">' +
          '<label>Cycle time (sec)</label>' +
          '<input type="number" class="f-cycle" min="0" step="0.1" value="' + t.cycleTime + '">' +
        '</div>' +
        '<div class="field">' +
          '<label>Variation (%)</label>' +
          '<input type="number" class="f-variation" min="0" step="1" value="' + t.variation + '">' +
        '</div>' +
        '<div class="field">' +
          '<label>Heaviest item (lb)</label>' +
          '<input type="number" class="f-weight" min="0" step="1" value="' + t.weight + '">' +
        '</div>' +
        '<div class="checkbox-field">' +
          '<input type="checkbox" class="f-handoff" id="handoff-' + t.id + '"' + (t.handoff ? " checked" : "") + '>' +
          '<label for="handoff-' + t.id + '">A human hands<br>work in</label>' +
        '</div>' +
        '<button type="button" class="ghost small remove-btn" aria-label="Remove task">✕</button>';

      row.querySelector(".f-name").addEventListener("input", function (e) { t.name = e.target.value; });
      row.querySelector(".f-cycle").addEventListener("input", function (e) { t.cycleTime = e.target.value; });
      row.querySelector(".f-variation").addEventListener("input", function (e) { t.variation = e.target.value; });
      row.querySelector(".f-weight").addEventListener("input", function (e) { t.weight = e.target.value; });
      row.querySelector(".f-handoff").addEventListener("change", function (e) { t.handoff = e.target.checked; });
      row.querySelector(".remove-btn").addEventListener("click", function () { removeTask(t.id); });

      taskRowsEl.appendChild(row);
    });
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  // ---------- scoring ----------

  function getWeights() {
    return {
      speed: Number(document.getElementById("wSpeed").value),
      weight: Number(document.getElementById("wWeight").value),
      variation: Number(document.getElementById("wVariation").value),
      handoff: Number(document.getElementById("wHandoff").value)
    };
  }

  function scoreTask(t, weights) {
    var cycle = parseFloat(t.cycleTime);
    var variation = parseFloat(t.variation);
    var weight = parseFloat(t.weight);
    if (isNaN(cycle)) cycle = 0;
    if (isNaN(variation)) variation = 0;
    if (isNaN(weight)) weight = 0;

    var flagSpeed = cycle > 0 && cycle < 3;
    var flagWeight = weight > 50;

    var speedScore = cycle <= 0 ? 0 : (cycle >= 3 ? 100 : Math.round((cycle / 3) * 70));
    var weightScore = weight <= 0 ? 100 :
      (weight <= 50 ? Math.round(100 - (weight / 50) * 15) : Math.round(Math.max(0, 70 - (weight - 50) * 3)));
    var variationScore = Math.round(Math.max(0, 100 - Math.max(0, variation) * 2));
    var handoffScore = t.handoff ? 50 : 100;

    var wSum = weights.speed + weights.weight + weights.variation + weights.handoff;
    var raw = wSum === 0 ? 0 :
      (speedScore * weights.speed + weightScore * weights.weight + variationScore * weights.variation + handoffScore * weights.handoff) / wSum;
    var score = Math.max(0, Math.min(100, Math.round(raw)));

    var flags = [];
    if (flagWeight) {
      flags.push("Heaviest item " + weight + " lb exceeds Figure's demonstrated " + WEIGHT_FIGURE.value + " carry capacity (episode, " + WEIGHT_FIGURE.timestamp + ")");
    }
    if (flagSpeed) {
      flags.push("Cycle time " + cycle + "s is faster than the " + SPEED_FIGURE.value + " package-move target (episode, " + SPEED_FIGURE.timestamp + ")");
    }

    var reason;
    if (flagWeight && flagSpeed) {
      reason = "Too heavy and too fast for today's demonstrated robot pace — not pilot-ready yet.";
    } else if (flagWeight) {
      reason = "Item is heavier than any robot has shown carrying — scope a lighter sub-task first.";
    } else if (flagSpeed) {
      reason = "Line already runs faster than the robot's demonstrated pace — would need to slow down or split the task.";
    } else if (t.handoff && variation > 20) {
      reason = "Workable, but a human hand-off plus high variation add real wait risk.";
    } else if (t.handoff) {
      reason = "Specified and within range, but still needs a human to hand off work.";
    } else if (score >= 80) {
      reason = "Tightly specified, within weight and speed range, no human hand-off — strong pilot candidate.";
    } else if (score >= 60) {
      reason = "Workable candidate; variation or margin leaves some risk.";
    } else {
      reason = "Underspecified or too variable to commit to a robot yet.";
    }

    return { score: score, reason: reason, flags: flags };
  }

  function scorePillClass(score) {
    if (score >= 75) return "score-high";
    if (score >= 50) return "score-mid";
    return "score-low";
  }

  function hasAnyTaskData() {
    return tasks.some(function (t) {
      return t.name.trim() !== "" || t.cycleTime !== "" || t.weight !== "" || t.variation !== "";
    });
  }

  function runScoring() {
    var weights = getWeights();
    var named = tasks.filter(function (t) { return t.name.trim() !== ""; });
    if (named.length === 0) {
      resultsPanel.style.display = "none";
      return;
    }
    var scored = named.map(function (t) {
      var r = scoreTask(t, weights);
      return { name: t.name, score: r.score, reason: r.reason, flags: r.flags };
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    resultsBody.innerHTML = "";
    scored.forEach(function (s, i) {
      var tr = document.createElement("tr");
      var flagsHtml = s.flags.map(function (f) { return '<span class="flag-chip">⚠ ' + f + '</span>'; }).join("");
      tr.innerHTML =
        '<td data-label="Rank">' + (i + 1) + '</td>' +
        '<td data-label="Task">' + escapeAttr(s.name) + '</td>' +
        '<td data-label="Score"><span class="score-pill ' + scorePillClass(s.score) + '">' + s.score + '</span></td>' +
        '<td data-label="Reason">' + escapeAttr(s.reason) + '</td>' +
        '<td data-label="Flags">' + (flagsHtml || "—") + '</td>';
      resultsBody.appendChild(tr);
    });
    resultsPanel.style.display = "";
  }

  // ---------- timeline ----------

  function parseTime(str) {
    var parts = String(str || "0:0").split(":");
    var h = parseInt(parts[0], 10) || 0;
    var m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  function renderTimeline() {
    var truckStart = parseTime(document.getElementById("truckStart").value);
    var truckEnd = parseTime(document.getElementById("truckEnd").value);
    var staffStart = parseTime(document.getElementById("staffStart").value);
    var staffEnd = parseTime(document.getElementById("staffEnd").value);

    var owStart = Math.max(truckStart, staffStart);
    var owEnd = Math.min(truckEnd, staffEnd);
    if (owEnd < owStart) owEnd = owStart;

    var bar = document.getElementById("timelineBar");
    var labels = document.getElementById("timelineLabels");
    bar.innerHTML = "";
    labels.innerHTML = "";
    var activeMinutesTotal = 0;

    for (var h = 0; h < 24; h++) {
      var hourStart = h * 60;
      var hourEnd = hourStart + 60;
      var overlapStart = Math.max(hourStart, owStart);
      var overlapEnd = Math.min(hourEnd, owEnd);
      var activeMinutes = Math.max(0, overlapEnd - overlapStart);
      activeMinutesTotal += activeMinutes;
      var pct = (activeMinutes / 60) * 100;

      var cell = document.createElement("div");
      cell.className = "cell";
      cell.title = h + ":00–" + (h + 1) + ":00";
      var fill = document.createElement("div");
      fill.className = "active-fill";
      fill.style.width = pct + "%";
      cell.appendChild(fill);
      bar.appendChild(cell);

      var label = document.createElement("span");
      label.textContent = (h % 3 === 0) ? (h < 10 ? "0" + h : h) : "";
      labels.appendChild(label);
    }

    var idleHours = Math.max(0, 24 - activeMinutesTotal / 60);
    document.getElementById("idleTotal").textContent = idleHours.toFixed(1);
  }

  // ---------- example / reset ----------

  function loadExample(data) {
    tasks = data.tasks.map(function (t) {
      return {
        id: nextId++,
        name: t.name,
        cycleTime: t.cycleTime,
        variation: t.variation,
        weight: t.weight,
        handoff: t.handoff
      };
    });
    document.getElementById("truckStart").value = data.truckStart;
    document.getElementById("truckEnd").value = data.truckEnd;
    document.getElementById("staffStart").value = data.staffStart;
    document.getElementById("staffEnd").value = data.staffEnd;
    renderTasks();
    renderTimeline();
    exampleBanner.classList.add("visible");
    runScoring();
  }

  function resetForm() {
    tasks = [];
    for (var i = 0; i < 5; i++) tasks.push(blankTask());
    document.getElementById("truckStart").value = "06:00";
    document.getElementById("truckEnd").value = "18:00";
    document.getElementById("staffStart").value = "00:00";
    document.getElementById("staffEnd").value = "23:59";
    exampleBanner.classList.remove("visible");
    resultsPanel.style.display = "none";
    renderTasks();
    renderTimeline();
  }

  // ---------- wire up ----------

  document.getElementById("addTaskBtn").addEventListener("click", function () { addTask(); });
  document.getElementById("scoreBtn").addEventListener("click", runScoring);
  document.getElementById("resetBtn").addEventListener("click", resetForm);
  document.getElementById("printBtn").addEventListener("click", function () {
    if (!hasAnyTaskData()) { /* allow printing empty form too */ }
    runScoring();
    window.print();
  });

  document.getElementById("exampleBtn").addEventListener("click", function () {
    fetch("data/example.json")
      .then(function (r) { return r.json(); })
      .then(loadExample)
      .catch(function () {
        exampleBanner.textContent = "⚠ Could not load example data.";
        exampleBanner.classList.add("visible");
      });
  });

  ["truckStart", "truckEnd", "staffStart", "staffEnd"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", renderTimeline);
  });

  ["wSpeed", "wWeight", "wVariation", "wHandoff"].forEach(function (id) {
    var el = document.getElementById(id);
    var out = document.getElementById(id + "Out");
    el.addEventListener("input", function () { out.textContent = el.value; });
  });

  for (var i = 0; i < 5; i++) tasks.push(blankTask());
  renderTasks();
  renderTimeline();
})();
