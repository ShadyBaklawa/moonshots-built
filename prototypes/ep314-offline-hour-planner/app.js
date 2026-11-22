(function () {
  "use strict";

  var CRIT_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  var CRIT_ORDER = ["Critical", "High", "Medium", "Low"];

  var fallbackLibrary = {};
  var tools = [];
  var nextId = 1;

  var els = {
    categorySelect: document.getElementById("f-category"),
    form: document.getElementById("toolForm"),
    name: document.getElementById("f-name"),
    desc: document.getElementById("f-desc"),
    criticality: document.getElementById("f-criticality"),
    owner: document.getElementById("f-owner"),
    contact: document.getElementById("f-contact"),
    toolList: document.getElementById("toolList"),
    toolCount: document.getElementById("toolCount"),
    emptyState: document.getElementById("emptyState"),
    loadExample: document.getElementById("loadExample"),
    printBtn: document.getElementById("printBtn"),
    submitBtn: document.getElementById("submitBtn"),
    prList: document.getElementById("pr-list"),
    wcList: document.getElementById("wc-list"),
    prDate: document.getElementById("pr-date"),
    wcDate: document.getElementById("wc-date")
  };

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function fallbackFor(category) {
    return fallbackLibrary[category] || fallbackLibrary.other;
  }

  function populateCategorySelect() {
    var order = ["payments", "email", "scheduling", "phone", "website", "inventory", "security", "accounting", "other"];
    els.categorySelect.innerHTML = "";
    order.forEach(function (key) {
      if (!fallbackLibrary[key]) return;
      var opt = document.createElement("option");
      opt.value = key;
      opt.textContent = fallbackLibrary[key].label;
      els.categorySelect.appendChild(opt);
    });
  }

  function sortedTools() {
    return tools
      .map(function (t, idx) { return { t: t, idx: idx }; })
      .sort(function (a, b) {
        var diff = CRIT_RANK[b.t.criticality] - CRIT_RANK[a.t.criticality];
        return diff !== 0 ? diff : a.idx - b.idx;
      })
      .map(function (pair) { return pair.t; });
  }

  function render() {
    var ordered = sortedTools();
    els.toolCount.textContent = tools.length + (tools.length === 1 ? " tool" : " tools");
    els.emptyState.classList.toggle("visible", tools.length === 0);
    els.toolList.innerHTML = "";

    ordered.forEach(function (tool, i) {
      var fb = fallbackFor(tool.category);
      var li = document.createElement("li");
      li.className = "tool-card crit-" + tool.criticality;
      li.innerHTML =
        '<div class="tool-card-top">' +
          '<div class="tool-title">' +
            '<span class="rank">#' + (i + 1) + '</span>' +
            '<h3>' + escapeHtml(tool.name) + '</h3>' +
            '<span class="tag tag-cat">' + escapeHtml(fb.label) + '</span>' +
            '<span class="tag tag-' + tool.criticality + '">' + escapeHtml(tool.criticality) + '</span>' +
          '</div>' +
          '<div class="tool-controls">' +
            '<select class="crit-select" data-id="' + tool.id + '" aria-label="Criticality for ' + escapeHtml(tool.name) + '"></select>' +
            '<button type="button" class="btn-delete" data-id="' + tool.id + '">Remove</button>' +
          '</div>' +
        '</div>' +
        (tool.desc ? '<p class="tool-desc">' + escapeHtml(tool.desc) + '</p>' : '') +
        '<div class="fallback-block">' +
          '<span class="fb-label">If it goes down:</span> ' + escapeHtml(fb.fallback) +
          '<ul class="print-list">' + fb.printItems.map(function (p) { return "<li>" + escapeHtml(p) + "</li>"; }).join("") + '</ul>' +
          '<p class="contact-line"><strong>Contact:</strong> ' + escapeHtml(tool.owner || "—") +
            (tool.contact ? " — " + escapeHtml(tool.contact) : "") + '</p>' +
        '</div>';

      var sel = li.querySelector(".crit-select");
      CRIT_ORDER.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        if (c === tool.criticality) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        tool.criticality = sel.value;
        render();
      });
      li.querySelector(".btn-delete").addEventListener("click", function () {
        tools = tools.filter(function (t) { return t.id !== tool.id; });
        render();
      });

      els.toolList.appendChild(li);
    });

    renderPrint(ordered);
  }

  function renderPrint(ordered) {
    var now = new Date();
    var dateStr = now.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    els.prDate.textContent = dateStr;
    els.wcDate.textContent = dateStr;

    els.prList.innerHTML = ordered.map(function (tool, i) {
      var fb = fallbackFor(tool.category);
      return (
        '<div class="pr-item crit-' + tool.criticality + '">' +
          '<h3>#' + (i + 1) + " " + escapeHtml(tool.name) + '</h3>' +
          '<div class="meta">' + escapeHtml(fb.label) + ' · ' + escapeHtml(tool.criticality) +
            (tool.desc ? ' · ' + escapeHtml(tool.desc) : '') + '</div>' +
          '<div class="fb"><strong>If it goes down:</strong> ' + escapeHtml(fb.fallback) + '</div>' +
          '<div><strong>Print in advance:</strong></div>' +
          '<ul>' + fb.printItems.map(function (p) { return "<li>" + escapeHtml(p) + "</li>"; }).join("") + '</ul>' +
          '<div class="contact">Contact: ' + escapeHtml(tool.owner || "—") +
            (tool.contact ? " — " + escapeHtml(tool.contact) : "") + '</div>' +
        '</div>'
      );
    }).join("");

    var topTier = ordered.filter(function (t) { return t.criticality === "Critical" || t.criticality === "High"; });
    if (topTier.length === 0) topTier = ordered.slice(0, 5);
    els.wcList.innerHTML = topTier.map(function (tool, i) {
      var fb = fallbackFor(tool.category);
      return (
        '<div class="wc-item crit-' + tool.criticality + '">' +
          '<h3>#' + (i + 1) + " " + escapeHtml(tool.name) + ' — ' + escapeHtml(tool.criticality) + '</h3>' +
          '<div class="fb">' + escapeHtml(fb.fallback) + '</div>' +
          '<div class="contact">Call: ' + escapeHtml(tool.owner || "—") +
            (tool.contact ? " — " + escapeHtml(tool.contact) : "") + '</div>' +
        '</div>'
      );
    }).join("");
  }

  function addTool(data) {
    tools.push({
      id: nextId++,
      name: data.name,
      desc: data.desc,
      category: data.category,
      criticality: data.criticality,
      owner: data.owner,
      contact: data.contact
    });
    render();
  }

  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = els.name.value.trim();
    if (!name) return;
    addTool({
      name: name,
      desc: els.desc.value.trim(),
      category: els.categorySelect.value,
      criticality: els.criticality.value,
      owner: els.owner.value.trim(),
      contact: els.contact.value.trim()
    });
    els.form.reset();
    els.criticality.value = "Medium";
    els.name.focus();
  });

  els.printBtn.addEventListener("click", function () {
    window.print();
  });

  els.loadExample.addEventListener("click", function () {
    tools = [];
    nextId = 1;
    var example = [
      { name: "Square", desc: "Takes card payments at the counter", category: "payments", criticality: "Critical", owner: "Dana (manager)", contact: "555-0142" },
      { name: "RingCentral", desc: "Main business phone line", category: "phone", criticality: "Critical", owner: "Front desk", contact: "555-0101" },
      { name: "Gmail Workspace", desc: "Client email and booking confirmations", category: "email", criticality: "High", owner: "Dana (manager)", contact: "dana@example.com" },
      { name: "Calendly", desc: "Customer appointment booking", category: "scheduling", criticality: "High", owner: "Priya (scheduling)", contact: "555-0177" },
      { name: "Squarespace site", desc: "Online ordering and hours", category: "website", criticality: "Medium", owner: "Marcus (marketing)", contact: "marcus@example.com" },
      { name: "Lightspeed POS", desc: "Inventory and point of sale", category: "inventory", criticality: "High", owner: "Dana (manager)", contact: "vendor status page" },
      { name: "Kisi access system", desc: "Door locks and staff badges", category: "security", criticality: "Medium", owner: "Facilities", contact: "555-0199" },
      { name: "QuickBooks", desc: "Payroll and bookkeeping", category: "accounting", criticality: "Low", owner: "Accountant (external)", contact: "555-0188" }
    ];
    example.forEach(function (t) { addTool(t); });
  });

  fetch("data/fallbacks.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      fallbackLibrary = data;
      populateCategorySelect();
      els.submitBtn.disabled = false;
      els.submitBtn.textContent = "Add to runbook";
      els.loadExample.disabled = false;
      render();
    })
    .catch(function () {
      els.submitBtn.textContent = "Couldn't load category data — reload the page";
    });
})();
