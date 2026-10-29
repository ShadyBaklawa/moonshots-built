(function () {
  "use strict";

  function pairKey(a, b) {
    return a <= b ? a + "-" + b : b + "-" + a;
  }

  function buildGrid(data) {
    const dims = data.dimensions;
    const threshold = data.dark_sector_threshold;
    const grid = document.getElementById("qgrid");
    const detail = document.getElementById("cellDetail");

    grid.appendChild(cornerCell());
    dims.forEach((d) => grid.appendChild(axisLabel(d)));

    dims.forEach((row) => {
      grid.appendChild(axisLabel(row));
      dims.forEach((col) => {
        grid.appendChild(cellButton(row, col));
      });
    });

    function cornerCell() {
      const el = document.createElement("div");
      el.className = "axis-label corner";
      el.textContent = "d";
      return el;
    }

    function axisLabel(d) {
      const el = document.createElement("div");
      el.className = "axis-label";
      el.textContent = d;
      return el;
    }

    function cellButton(row, col) {
      const btn = document.createElement("button");
      const product = row * col;
      const key = pairKey(row, col);
      const force = data.forces[key];
      const isDark = product >= threshold;

      btn.type = "button";
      btn.setAttribute("role", "gridcell");
      btn.setAttribute(
        "aria-label",
        row + "x" + col + (force ? ", " + force.name : ", not specified in episode")
      );
      btn.dataset.row = row;
      btn.dataset.col = col;

      if (force) btn.classList.add("assigned");
      if (isDark) btn.classList.add("dark-sector");

      const dimLine = document.createElement("span");
      dimLine.textContent = row + "×" + col;

      const nameLine = document.createElement("span");
      nameLine.className = "force-name";
      nameLine.textContent = force ? force.name : "unspecified";

      const productLine = document.createElement("span");
      productLine.className = "product";
      productLine.textContent = "= " + product;

      btn.appendChild(dimLine);
      btn.appendChild(nameLine);
      btn.appendChild(productLine);

      btn.addEventListener("click", () => {
        grid.querySelectorAll("button.selected").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        showDetail(row, col, product, force, isDark);
      });

      return btn;
    }

    function showDetail(row, col, product, force, isDark) {
      detail.innerHTML = "";

      const h3 = document.createElement("h3");
      h3.textContent = row + " × " + col + " link";
      detail.appendChild(h3);

      const pForce = document.createElement("p");
      if (force) {
        pForce.innerHTML = "Force: <strong>" + force.name + "</strong> &mdash; " + force.note + ".";
      } else {
        pForce.innerHTML = "Force: <strong>not specified in episode</strong>.";
      }
      detail.appendChild(pForce);

      const pProduct = document.createElement("p");
      pProduct.textContent = "Dimension product: " + row + " × " + col + " = " + product + ".";
      detail.appendChild(pProduct);

      if (isDark) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "bound entanglement possible (product ≥ " + threshold + ")";
        detail.appendChild(tag);
      }
    }
  }

  function buildFormula(data) {
    const f = data.formula;
    const sqrtTerms = f.terms.map((t) => ({
      label: t.radicand ? t.coefficient + "×√" + t.radicand : String(t.coefficient),
      value: t.radicand ? t.coefficient * Math.sqrt(t.radicand) : t.coefficient
    }));

    const sum = sqrtTerms.reduce((acc, t) => acc + t.value, 0);
    const denominator = f.denominator_factors[0] * Math.pow(f.denominator_factors[1], f.denominator_exponents[1]);
    const result = sum / denominator;
    const inverse = 1 / result;
    const quoted = f.quoted_inverse_alpha;

    const tbody = document.querySelector("#termTable tbody");
    sqrtTerms.forEach((t) => {
      const tr = document.createElement("tr");
      const tdLabel = document.createElement("td");
      tdLabel.textContent = t.label;
      const tdValue = document.createElement("td");
      tdValue.className = "value";
      tdValue.textContent = t.value.toFixed(6);
      tr.appendChild(tdLabel);
      tr.appendChild(tdValue);
      tbody.appendChild(tr);
    });

    const resultList = document.getElementById("resultList");
    const rows = [
      ["Sum of terms", sum.toFixed(6)],
      ["Denominator (24·36²)", String(denominator)],
      ["Result", result.toFixed(10)],
      ["Inverse of result", inverse.toFixed(10)],
      ["Quoted value (as stated on the podcast)", quoted]
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "row";
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      row.appendChild(dt);
      row.appendChild(dd);
      resultList.appendChild(row);
    });

    renderDigitMatch(inverse.toFixed(10), quoted);
  }

  function renderDigitMatch(computedStr, quotedStr) {
    const rowsEl = document.getElementById("digitRows");
    const summaryEl = document.getElementById("matchSummary");

    const maxLen = Math.max(computedStr.length, quotedStr.length);
    let matchCount = 0;
    let streakBroken = false;
    const flags = [];

    for (let i = 0; i < maxLen; i++) {
      const c = computedStr[i];
      const q = quotedStr[i];
      if (c === undefined || q === undefined) {
        flags.push("end");
        continue;
      }
      if (c === ".") {
        flags.push("sep");
        continue;
      }
      if (!streakBroken && c === q) {
        matchCount++;
        flags.push("match");
      } else {
        streakBroken = true;
        flags.push(c === q ? "match-after-break" : "mismatch");
      }
    }

    rowsEl.appendChild(makeRow("Computed 1/result", computedStr, flags));
    rowsEl.appendChild(makeRow("Quoted (podcast)", quotedStr, flags));

    summaryEl.innerHTML =
      "<strong>" + matchCount + "</strong> leading digits of the quoted value (" + quotedStr +
      ") match the formula's computed inverse, digit by digit, before the first difference.";

    function makeRow(label, str, flagList) {
      const row = document.createElement("div");
      row.className = "digit-row";
      const lab = document.createElement("span");
      lab.className = "label";
      lab.textContent = label;
      row.appendChild(lab);

      for (let i = 0; i < str.length; i++) {
        const span = document.createElement("span");
        span.className = "ch";
        const flag = flagList[i];
        if (str[i] === ".") {
          span.classList.add("sep");
        } else if (flag === "match") {
          span.classList.add("match");
        } else if (flag === "mismatch" || flag === "match-after-break") {
          span.classList.add("mismatch");
        }
        span.textContent = str[i];
        row.appendChild(span);
      }
      return row;
    }
  }

  fetch("data/mappings.json")
    .then((r) => r.json())
    .then((data) => {
      buildGrid(data);
      buildFormula(data);
    })
    .catch((err) => {
      document.getElementById("cellDetail").innerHTML =
        '<p class="placeholder">Could not load data/mappings.json.</p>';
      console.error(err);
    });
})();
