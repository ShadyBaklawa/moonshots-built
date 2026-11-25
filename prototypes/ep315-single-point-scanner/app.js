(() => {
  "use strict";

  const STORAGE_KEY = "spscanner.rows.v1";
  const EXAMPLE_FLAG_KEY = "spscanner.isExample.v1";

  const tableBody = document.getElementById("riskTableBody");
  const emptyState = document.getElementById("emptyState");
  const rowTemplate = document.getElementById("rowTemplate");
  const exampleNote = document.getElementById("exampleNote");

  let rows = [];
  let isExample = false;
  let nextId = 1;

  const EXAMPLE_ROWS = [
    { name: "Northwind Supply Agreement (40% of revenue)", holder: "Founder (Dana)", documented: false, backup: false, revenue: 420000 },
    { name: "Primary bank line of credit", holder: "Founder (Dana)", documented: true, backup: false, revenue: 0 },
    { name: "AWS / hosting account root login", holder: "Ops lead (Marcus)", documented: false, backup: false, revenue: 0 },
    { name: "Biggest customer renewal (Kestrel Co.)", holder: "Founder (Dana)", documented: false, backup: true, revenue: 180000 },
    { name: "Payroll + benefits admin access", holder: "Office manager (Priya)", documented: true, backup: true, revenue: 0 },
    { name: "Pricing & discount decisions", holder: "Founder (Dana)", documented: false, backup: false, revenue: 95000 },
    { name: "Key supplier contact (parts sourcing)", holder: "Founder (Dana)", documented: true, backup: false, revenue: 60000 },
  ];

  function uid() {
    return "r" + (nextId++);
  }

  function makeRow(data) {
    return {
      id: uid(),
      name: data.name || "",
      holder: data.holder || "",
      documented: !!data.documented,
      backup: !!data.backup,
      revenue: Number.isFinite(data.revenue) ? data.revenue : 0,
    };
  }

  function scoreRow(row) {
    let s = 0;
    if (!row.documented) s += 5;
    if (!row.backup) s += 4;
    if (row.revenue >= 100000) s += 1;
    return Math.min(s, 10);
  }

  function riskLevel(row) {
    if (!row.documented && !row.backup) return "critical";
    if (!row.documented || !row.backup) return "warning";
    return "ok";
  }

  function formatMoney(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      localStorage.setItem(EXAMPLE_FLAG_KEY, isExample ? "1" : "0");
    } catch (e) {
      /* storage unavailable, ignore */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          rows = parsed.map(makeRow);
        }
      }
      isExample = localStorage.getItem(EXAMPLE_FLAG_KEY) === "1";
    } catch (e) {
      rows = [];
    }
  }

  function addRow(data) {
    rows.push(makeRow(data || {}));
    render();
  }

  function removeRow(id) {
    rows = rows.filter((r) => r.id !== id);
    render();
  }

  function updateRow(id, patch) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    Object.assign(row, patch);
    render();
  }

  function sortedRows() {
    return [...rows].sort((a, b) => {
      const sb = scoreRow(b) - scoreRow(a);
      if (sb !== 0) return sb;
      return b.revenue - a.revenue;
    });
  }

  function render() {
    const ranked = sortedRows();

    tableBody.innerHTML = "";
    ranked.forEach((row) => {
      const frag = rowTemplate.content.cloneNode(true);
      const tr = frag.querySelector("tr");
      const level = riskLevel(row);
      tr.classList.add("risk-row", "risk-" + level);
      tr.dataset.id = row.id;

      const flag = tr.querySelector(".col-flag .flag");
      flag.classList.add("flag-" + (level === "critical" ? "red" : level === "warning" ? "amber" : "green"));

      const nameInput = tr.querySelector(".f-name");
      nameInput.value = row.name;
      nameInput.addEventListener("input", (e) => updateRowFieldLive(row.id, "name", e.target.value));

      const holderInput = tr.querySelector(".f-holder");
      holderInput.value = row.holder;
      holderInput.addEventListener("input", (e) => updateRowFieldLive(row.id, "holder", e.target.value));

      const documentedInput = tr.querySelector(".f-documented");
      documentedInput.checked = row.documented;
      documentedInput.addEventListener("change", (e) => updateRow(row.id, { documented: e.target.checked }));

      const backupInput = tr.querySelector(".f-backup");
      backupInput.checked = row.backup;
      backupInput.addEventListener("change", (e) => updateRow(row.id, { backup: e.target.checked }));

      const revenueInput = tr.querySelector(".f-revenue");
      revenueInput.value = row.revenue || "";
      const scoreSpan = tr.querySelector(".score-value");
      revenueInput.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        row.revenue = Number.isFinite(v) ? v : 0;
        scoreSpan.textContent = scoreRow(row);
        updateSummary();
        save();
      });
      revenueInput.addEventListener("blur", () => render());

      scoreSpan.textContent = scoreRow(row);

      const delBtn = tr.querySelector(".btn-del");
      delBtn.addEventListener("click", () => removeRow(row.id));

      tableBody.appendChild(tr);
    });

    emptyState.hidden = rows.length > 0;
    exampleNote.hidden = !isExample;

    updateSummary();
    save();
  }

  function updateRowFieldLive(id, field, value, needsFullRerender) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    row[field] = value;
    if (needsFullRerender) {
      render();
    } else {
      updateSummary();
      save();
    }
  }

  function updateSummary() {
    const totalRows = rows.length;
    const twoWeekExposure = rows
      .filter((r) => !r.backup)
      .reduce((sum, r) => sum + (r.revenue || 0), 0);
    const spofCount = rows.filter((r) => riskLevel(r) === "critical").length;
    const avgScore = totalRows
      ? rows.reduce((sum, r) => sum + scoreRow(r), 0) / totalRows
      : 0;

    document.getElementById("rowCount").textContent = String(totalRows);
    document.getElementById("twoWeekExposure").textContent = formatMoney(twoWeekExposure);
    document.getElementById("spofCount").textContent = String(spofCount);

    const dialScore = Math.round(avgScore * 10) / 10;
    document.getElementById("dialScore").textContent = String(dialScore);

    const circumference = 2 * Math.PI * 52;
    const pct = Math.min(avgScore / 10, 1);
    const dialFill = document.getElementById("dialFill");
    dialFill.style.strokeDasharray = String(circumference);
    dialFill.style.strokeDashoffset = String(circumference * (1 - pct));
    dialFill.style.stroke = avgScore >= 7 ? "var(--red)" : avgScore >= 4 ? "var(--amber)" : "var(--green)";

    buildPrintSheet(twoWeekExposure);
  }

  function buildPrintSheet(twoWeekExposure) {
    const body = document.getElementById("printTableBody");
    body.innerHTML = "";
    sortedRows().forEach((row) => {
      const level = riskLevel(row);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${level === "critical" ? "Critical" : level === "warning" ? "At risk" : "Covered"}</td>
        <td>${escapeHtml(row.name || "(untitled)")}</td>
        <td>${escapeHtml(row.holder || "—")}</td>
        <td>${row.documented ? "Yes" : "No"}</td>
        <td>${row.backup ? "Yes" : "No"}</td>
        <td>${formatMoney(row.revenue || 0)}</td>
        <td>${scoreRow(row)}</td>
      `;
      body.appendChild(tr);
    });
    document.getElementById("printMeta").textContent =
      (isExample ? "Example company — " : "") + new Date().toLocaleDateString();
    document.getElementById("printTotal").textContent =
      "Two-week exposure if one key person is unreachable: " + formatMoney(twoWeekExposure);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  document.getElementById("addRowBtn").addEventListener("click", () => {
    isExample = false;
    addRow({});
  });

  document.getElementById("loadExampleBtn").addEventListener("click", () => {
    rows = EXAMPLE_ROWS.map(makeRow);
    isExample = true;
    render();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (rows.length === 0) return;
    const ok = window.confirm("Clear all rows? This cannot be undone.");
    if (!ok) return;
    rows = [];
    isExample = false;
    render();
  });

  document.getElementById("printBtn").addEventListener("click", () => {
    window.print();
  });

  load();
  render();
})();
