(function () {
  "use strict";

  var VERDICT_ORDER = ["replaceable", "partial", "keep"];
  var VERDICT_LABEL = {
    replaceable: "Likely replaceable",
    partial: "Partially replaceable",
    keep: "Keep"
  };

  var rulesByKey = {};
  window.CATEGORY_RULES.forEach(function (rule) {
    rulesByKey[rule.key] = rule;
  });

  var tools = [];
  var nextId = 1;
  var isExampleData = false;

  var categorySelect = document.getElementById("toolCategory");
  var addForm = document.getElementById("addForm");
  var ledgerTable = document.getElementById("ledgerTable");
  var ledgerEmpty = document.getElementById("ledgerEmpty");
  var ledgerBody = document.getElementById("ledgerBody");
  var exampleBanner = document.getElementById("exampleBanner");
  var exampleBtn = document.getElementById("exampleBtn");
  var clearBtn = document.getElementById("clearBtn");
  var printChecklistBtn = document.getElementById("printChecklistBtn");
  var checklistModal = document.getElementById("checklistModal");
  var checklistBody = document.getElementById("checklistBody");
  var closeModalBtn = document.getElementById("closeModalBtn");
  var closeModalBtn2 = document.getElementById("closeModalBtn2");
  var doPrintBtn = document.getElementById("doPrintBtn");

  function populateCategorySelect() {
    window.CATEGORY_RULES.forEach(function (rule) {
      var opt = document.createElement("option");
      opt.value = rule.key;
      opt.textContent = rule.label;
      categorySelect.appendChild(opt);
    });
  }

  function money(n) {
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    return sign + "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function addTool(entry) {
    var rule = rulesByKey[entry.category] || rulesByKey.other;
    tools.push({
      id: nextId++,
      name: entry.name,
      category: entry.category,
      seats: entry.seats,
      price: entry.price,
      verdict: rule.verdict,
      overridden: false
    });
    isExampleData = false;
    render();
  }

  function cycleVerdict(id) {
    var tool = tools.filter(function (t) { return t.id === id; })[0];
    if (!tool) return;
    var idx = VERDICT_ORDER.indexOf(tool.verdict);
    tool.verdict = VERDICT_ORDER[(idx + 1) % VERDICT_ORDER.length];
    tool.overridden = true;
    render();
  }

  function removeTool(id) {
    tools = tools.filter(function (t) { return t.id !== id; });
    render();
  }

  function reasonFor(tool) {
    var rule = rulesByKey[tool.category] || rulesByKey.other;
    if (tool.overridden) {
      return "Manually set to “" + VERDICT_LABEL[tool.verdict] + "”. Rule default was “" +
        VERDICT_LABEL[rule.verdict] + "”: " + rule.reason;
    }
    return rule.reason;
  }

  function render() {
    ledgerBody.innerHTML = "";
    if (tools.length === 0) {
      ledgerEmpty.hidden = false;
      ledgerTable.hidden = true;
      exampleBanner.hidden = true;
      updateTotals();
      return;
    }
    ledgerEmpty.hidden = true;
    ledgerTable.hidden = false;
    exampleBanner.hidden = !isExampleData;

    tools.forEach(function (tool) {
      var rule = rulesByKey[tool.category] || rulesByKey.other;
      var monthly = tool.seats * tool.price;

      var row = document.createElement("div");
      row.className = "ledger-row ledger-body-row";
      row.setAttribute("role", "row");

      var nameCell = document.createElement("div");
      nameCell.className = "ledger-cell cell-name";
      nameCell.setAttribute("data-label", "Tool");
      var nameEl = document.createElement("span");
      nameEl.className = "tool-name";
      nameEl.textContent = tool.name;
      nameCell.appendChild(nameEl);

      var catCell = document.createElement("div");
      catCell.className = "ledger-cell cell-cat";
      catCell.setAttribute("data-label", "Category");
      var catEl = document.createElement("span");
      catEl.className = "cat-label";
      catEl.textContent = rule.label;
      catCell.appendChild(catEl);

      var seatsCell = document.createElement("div");
      seatsCell.className = "ledger-cell cell-number cell-seats";
      seatsCell.setAttribute("data-label", "Seats");
      seatsCell.textContent = String(tool.seats);

      var priceCell = document.createElement("div");
      priceCell.className = "ledger-cell cell-number cell-price";
      priceCell.setAttribute("data-label", "$ / seat / mo");
      priceCell.textContent = "$" + tool.price.toLocaleString("en-US", { maximumFractionDigits: 2 });

      var monthlyCell = document.createElement("div");
      monthlyCell.className = "ledger-cell cell-number cell-monthly";
      monthlyCell.setAttribute("data-label", "Monthly cost");
      monthlyCell.textContent = money(monthly);

      var verdictCell = document.createElement("div");
      verdictCell.className = "ledger-cell cell-verdict";
      verdictCell.setAttribute("data-label", "Verdict");
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "verdict-chip " + tool.verdict;
      chip.setAttribute("aria-label", tool.name + " verdict: " + VERDICT_LABEL[tool.verdict] + ". Click to change.");
      chip.innerHTML = VERDICT_LABEL[tool.verdict] + '<span class="verdict-reason">' + reasonFor(tool) + "</span>";
      chip.addEventListener("click", function () { cycleVerdict(tool.id); });
      verdictCell.appendChild(chip);

      var removeCell = document.createElement("div");
      removeCell.className = "ledger-cell cell-remove";
      removeCell.setAttribute("data-label", "");
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.setAttribute("aria-label", "Remove " + tool.name);
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", function () { removeTool(tool.id); });
      removeCell.appendChild(removeBtn);

      row.appendChild(nameCell);
      row.appendChild(catCell);
      row.appendChild(seatsCell);
      row.appendChild(priceCell);
      row.appendChild(monthlyCell);
      row.appendChild(verdictCell);
      row.appendChild(removeCell);

      ledgerBody.appendChild(row);
    });

    updateTotals();
  }

  function updateTotals() {
    var monthlySavings = 0;
    var counts = { replaceable: 0, partial: 0, keep: 0 };

    tools.forEach(function (tool) {
      var monthly = tool.seats * tool.price;
      counts[tool.verdict]++;
      if (tool.verdict === "replaceable") {
        monthlySavings += monthly;
      } else if (tool.verdict === "partial") {
        monthlySavings += monthly * 0.5;
      }
    });

    document.getElementById("monthlySavings").textContent = money(monthlySavings);
    document.getElementById("annualSavings").textContent = money(monthlySavings * 12);
    document.getElementById("countReplaceable").textContent = counts.replaceable + " replaceable";
    document.getElementById("countPartial").textContent = counts.partial + " partial";
    document.getElementById("countKeep").textContent = counts.keep + " keep";
  }

  function openChecklist() {
    var replaceableTools = tools.filter(function (t) { return t.verdict === "replaceable"; });
    checklistBody.innerHTML = "";

    if (replaceableTools.length === 0) {
      var empty = document.createElement("p");
      empty.className = "checklist-empty";
      empty.textContent = "No tools are currently marked “Likely replaceable.” Mark some tools above, or try the example stack.";
      checklistBody.appendChild(empty);
    } else {
      var intro = document.createElement("p");
      intro.textContent = "Tools marked “Likely replaceable” in this audit, with suggested migration steps:";
      checklistBody.appendChild(intro);

      var list = document.createElement("ol");
      replaceableTools.forEach(function (tool) {
        var rule = rulesByKey[tool.category] || rulesByKey.other;
        var monthly = tool.seats * tool.price;
        var li = document.createElement("li");
        li.innerHTML =
          "<strong>" + escapeHtml(tool.name) + "</strong> (" + escapeHtml(rule.label) + ", " +
          tool.seats + " seats, " + money(monthly) + "/mo)<br>" +
          "☐ Export existing data and templates from " + escapeHtml(tool.name) + ".<br>" +
          "☐ Rebuild the core workflow in your AI assistant workspace and test with one team.<br>" +
          "☐ Run both tools in parallel for one billing cycle.<br>" +
          "☐ Cancel " + escapeHtml(tool.name) + " once the team confirms the replacement works.";
        list.appendChild(li);
      });
      checklistBody.appendChild(list);

      var totalMonthly = replaceableTools.reduce(function (sum, t) { return sum + t.seats * t.price; }, 0);
      var summary = document.createElement("p");
      summary.innerHTML = "<strong>Total if all above are migrated: " + money(totalMonthly) + "/month (" +
        money(totalMonthly * 12) + "/year).</strong>";
      checklistBody.appendChild(summary);
    }

    checklistModal.hidden = false;
    closeModalBtn.focus();
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function closeChecklist() {
    checklistModal.hidden = true;
    printChecklistBtn.focus();
  }

  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("toolName").value.trim();
    var category = categorySelect.value;
    var seats = parseInt(document.getElementById("toolSeats").value, 10);
    var price = parseFloat(document.getElementById("toolPrice").value);
    if (!name || !category || !seats || seats < 1 || isNaN(price) || price < 0) return;
    addTool({ name: name, category: category, seats: seats, price: price });
    addForm.reset();
    document.getElementById("toolSeats").value = "10";
    document.getElementById("toolPrice").value = "10";
    document.getElementById("toolName").focus();
  });

  exampleBtn.addEventListener("click", function () {
    tools = [];
    nextId = 1;
    window.EXAMPLE_STACK.forEach(function (entry) {
      var rule = rulesByKey[entry.category] || rulesByKey.other;
      tools.push({
        id: nextId++,
        name: entry.name,
        category: entry.category,
        seats: entry.seats,
        price: entry.price,
        verdict: rule.verdict,
        overridden: false
      });
    });
    isExampleData = true;
    render();
  });

  clearBtn.addEventListener("click", function () {
    tools = [];
    isExampleData = false;
    render();
  });

  printChecklistBtn.addEventListener("click", openChecklist);
  closeModalBtn.addEventListener("click", closeChecklist);
  closeModalBtn2.addEventListener("click", closeChecklist);
  doPrintBtn.addEventListener("click", function () { window.print(); });
  checklistModal.addEventListener("click", function (e) {
    if (e.target === checklistModal) closeChecklist();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !checklistModal.hidden) closeChecklist();
  });

  populateCategorySelect();
  render();
})();
