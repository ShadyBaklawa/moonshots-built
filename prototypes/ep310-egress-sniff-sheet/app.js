(() => {
  "use strict";

  const csvInput = document.getElementById("csv-input");
  const fileInput = document.getElementById("file-input");
  const loadSampleBtn = document.getElementById("load-sample-btn");
  const analyzeBtn = document.getElementById("analyze-btn");
  const inputError = document.getElementById("input-error");
  const sampleFlag = document.getElementById("sample-flag");

  const resultsPanel = document.getElementById("results-panel");
  const summaryBar = document.getElementById("summary-bar");
  const deviceTbody = document.getElementById("device-tbody");

  const detailPanel = document.getElementById("detail-panel");
  const detailDeviceName = document.getElementById("detail-device-name");
  const detailHint = document.getElementById("detail-hint");
  const detailTbody = document.getElementById("detail-tbody");

  const planPanel = document.getElementById("plan-panel");
  const generatePlanBtn = document.getElementById("generate-plan-btn");
  const planOutput = document.getElementById("plan-output");

  let devices = []; // array of device aggregate objects, most recently rendered order
  let selectedDeviceName = null;
  let sampleText = null;

  const REQUIRED_COLUMNS = ["device", "destination", "bytes", "timestamp"];

  function showError(msg) {
    inputError.textContent = msg;
    inputError.hidden = false;
  }

  function clearError() {
    inputError.hidden = true;
    inputError.textContent = "";
  }

  function parseTimestamp(raw) {
    const s = raw.trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      const [, y, mo, d, h, mi, se] = m;
      return new Date(
        Number(y), Number(mo) - 1, Number(d),
        Number(h), Number(mi), se ? Number(se) : 0
      );
    }
    const fallback = new Date(s);
    if (!isNaN(fallback.getTime())) return fallback;
    return null;
  }

  function parseCSV(text) {
    const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      throw new Error("That log looks empty. Paste some rows or load the example data.");
    }
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const colIndex = {};
    REQUIRED_COLUMNS.forEach((col) => {
      colIndex[col] = header.indexOf(col);
    });
    const missing = REQUIRED_COLUMNS.filter((col) => colIndex[col] === -1);
    if (missing.length > 0) {
      throw new Error(
        `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        `Header must include device, destination, bytes, timestamp.`
      );
    }

    const rows = [];
    let skipped = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length < header.length) { skipped++; continue; }
      const device = parts[colIndex.device].trim();
      const destination = parts[colIndex.destination].trim();
      const bytes = Number(parts[colIndex.bytes].trim());
      const ts = parseTimestamp(parts[colIndex.timestamp]);
      if (!device || !destination || !isFinite(bytes) || bytes < 0 || !ts) {
        skipped++;
        continue;
      }
      rows.push({ device, destination, bytes, timestamp: ts });
    }

    if (rows.length === 0) {
      throw new Error("No usable rows found. Check that bytes is numeric and timestamp looks like YYYY-MM-DD HH:MM:SS.");
    }
    return { rows, skipped };
  }

  function isNightHour(date) {
    const h = date.getHours();
    return h >= 22 || h < 6;
  }

  function guessType(name) {
    const n = name.toLowerCase();
    if (n.includes("cam")) return "camera";
    if (n.includes("robot") || n.includes("arm") || n.includes("welder") || n.includes("bot")) return "robot";
    if (n.includes("nas") || n.includes("server") || n.includes("backup")) return "server";
    if (n.includes("print")) return "printer";
    if (n.includes("scan") || n.includes("sensor")) return "sensor";
    if (n.includes("workstation") || n.includes("laptop") || n.includes("pc") || n.includes("desktop")) return "workstation";
    return "other";
  }

  function aggregate(rows) {
    const byDevice = new Map();
    for (const row of rows) {
      if (!byDevice.has(row.device)) {
        byDevice.set(row.device, {
          name: row.device,
          type: guessType(row.device),
          totalBytes: 0,
          nightBytes: 0,
          destinations: new Map(),
        });
      }
      const d = byDevice.get(row.device);
      d.totalBytes += row.bytes;
      if (isNightHour(row.timestamp)) d.nightBytes += row.bytes;

      if (!d.destinations.has(row.destination)) {
        d.destinations.set(row.destination, {
          name: row.destination,
          bytes: 0,
          count: 0,
          first: row.timestamp,
          last: row.timestamp,
        });
      }
      const dest = d.destinations.get(row.destination);
      dest.bytes += row.bytes;
      dest.count += 1;
      if (row.timestamp < dest.first) dest.first = row.timestamp;
      if (row.timestamp > dest.last) dest.last = row.timestamp;
    }

    const list = Array.from(byDevice.values());
    list.sort((a, b) => b.totalBytes - a.totalBytes);
    return list;
  }

  function formatBytes(bytes) {
    if (bytes <= 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 0.01) return "< 0.01 MB";
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  }

  function formatDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function renderSummary(rows, skipped) {
    const totalBytes = rows.reduce((sum, r) => sum + r.bytes, 0);
    const times = rows.map((r) => r.timestamp.getTime());
    const min = new Date(Math.min(...times));
    const max = new Date(Math.max(...times));
    summaryBar.innerHTML = `
      <span><strong>${devices.length}</strong> devices</span>
      <span><strong>${rows.length}</strong> connections</span>
      <span><strong>${formatBytes(totalBytes)}</strong> total outbound</span>
      <span>${formatDate(min)} &rarr; ${formatDate(max)}</span>
      ${skipped > 0 ? `<span>${skipped} row${skipped > 1 ? "s" : ""} skipped (unreadable)</span>` : ""}
    `;
  }

  const TYPE_OPTIONS = ["robot", "camera", "server", "printer", "sensor", "workstation", "other"];

  function renderDeviceTable() {
    const maxBytes = devices.length > 0 ? devices[0].totalBytes : 0;
    deviceTbody.innerHTML = "";
    devices.forEach((d, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.name = d.name;
      if (idx === 0) tr.classList.add("top-uploader");
      if (d.name === selectedDeviceName) tr.classList.add("selected");

      const pct = maxBytes > 0 ? Math.max(4, Math.round((d.totalBytes / maxBytes) * 100)) : 0;
      const afterHours = d.nightBytes > 0;

      const nameTd = document.createElement("td");
      nameTd.innerHTML = `<span class="device-name">${escapeHtml(d.name)}</span>${idx === 0 ? '<span class="top-badge">TOP UPLOADER</span>' : ""}`;

      const typeTd = document.createElement("td");
      const select = document.createElement("select");
      select.className = "type-select";
      select.setAttribute("aria-label", `Device type for ${d.name}`);
      TYPE_OPTIONS.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (opt === d.type) o.selected = true;
        select.appendChild(o);
      });
      select.addEventListener("click", (e) => e.stopPropagation());
      select.addEventListener("change", (e) => {
        d.type = e.target.value;
      });
      typeTd.appendChild(select);

      const outboundTd = document.createElement("td");
      outboundTd.innerHTML = `
        <div class="bar-cell">
          <span class="bar-value">${formatBytes(d.totalBytes)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
        </div>
      `;

      const afterHoursTd = document.createElement("td");
      afterHoursTd.innerHTML = afterHours
        ? '<span class="flag-yes">⚠ after-hours</span>'
        : '<span class="flag-no">—</span>';

      const nightTd = document.createElement("td");
      nightTd.textContent = formatBytes(d.nightBytes);

      const destTd = document.createElement("td");
      destTd.textContent = `${d.destinations.size}`;

      tr.append(nameTd, typeTd, outboundTd, afterHoursTd, nightTd, destTd);
      tr.addEventListener("click", () => selectDevice(d.name));
      tr.tabIndex = 0;
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectDevice(d.name);
        }
      });
      deviceTbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function selectDevice(name) {
    selectedDeviceName = name;
    const d = devices.find((x) => x.name === name);
    if (!d) return;

    document.querySelectorAll("#device-tbody tr").forEach((tr) => {
      tr.classList.toggle("selected", tr.dataset.name === name);
    });

    detailDeviceName.textContent = name;
    detailHint.textContent = `${d.destinations.size} external destination${d.destinations.size === 1 ? "" : "s"} contacted.`;

    const destList = Array.from(d.destinations.values()).sort((a, b) => b.bytes - a.bytes);
    detailTbody.innerHTML = "";
    destList.forEach((dest) => {
      const tr = document.createElement("tr");
      const nameTd = document.createElement("td");
      nameTd.textContent = dest.name;
      const countTd = document.createElement("td");
      countTd.textContent = dest.count;
      const bytesTd = document.createElement("td");
      bytesTd.textContent = formatBytes(dest.bytes);
      const firstTd = document.createElement("td");
      firstTd.textContent = formatDate(dest.first);
      const lastTd = document.createElement("td");
      lastTd.textContent = formatDate(dest.last);
      tr.append(nameTd, countTd, bytesTd, firstTd, lastTd);
      detailTbody.appendChild(tr);
    });

    detailPanel.hidden = false;
    detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function runAnalysis(text, isSample) {
    clearError();
    let parsed;
    try {
      parsed = parseCSV(text);
    } catch (err) {
      showError(err.message);
      resultsPanel.hidden = true;
      detailPanel.hidden = true;
      planPanel.hidden = true;
      return;
    }

    sampleFlag.hidden = !isSample;

    devices = aggregate(parsed.rows);
    selectedDeviceName = null;
    detailPanel.hidden = true;
    planOutput.innerHTML = "";

    renderSummary(parsed.rows, parsed.skipped);
    renderDeviceTable();

    resultsPanel.hidden = false;
    planPanel.hidden = false;
    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function generatePlan() {
    if (devices.length === 0) return;

    const items = devices.map((d, idx) => {
      const reasons = [];
      if (d.nightBytes > 0) reasons.push("after-hours traffic");
      if (idx === 0) reasons.push("top outbound device");
      else if (idx < 3) reasons.push("high outbound volume");
      if (d.type === "robot" || d.type === "camera") reasons.push(`unmanaged ${d.type}`);
      return { device: d, reasons };
    });

    const flagged = items.filter((it) => it.reasons.length > 0);
    const clear = items.filter((it) => it.reasons.length === 0);

    if (flagged.length === 0) {
      planOutput.innerHTML = '<p class="plan-none">No device triggered after-hours, high-volume or robot/camera flags in this log. Nothing to isolate right now.</p>';
      return;
    }

    let html = `<p class="plan-summary">${flagged.length} of ${devices.length} device${devices.length === 1 ? "" : "s"} flagged for review.</p>`;

    flagged.forEach(({ device, reasons }) => {
      const destList = Array.from(device.destinations.values()).sort((a, b) => b.bytes - a.bytes);
      const topDests = destList.slice(0, 5);
      const action = device.nightBytes > 0 || device.type === "robot" || device.type === "camera"
        ? `Move <strong>${escapeHtml(device.name)}</strong> to an isolated VLAN with no default internet route.`
        : `Keep monitoring <strong>${escapeHtml(device.name)}</strong>; consider isolating if volume keeps climbing.`;

      html += `
        <div class="plan-item">
          <h3>${escapeHtml(device.name)} <span style="color:var(--text-dim); font-weight:400; font-size:0.8rem;">(${escapeHtml(device.type)})</span></h3>
          <p class="reasons">${reasons.map((r) => `<span class="chip">${escapeHtml(r)}</span>`).join(" ")}</p>
          <p class="action">${action}</p>
          <ul>
            <li>Outbound total: ${formatBytes(device.totalBytes)}${device.nightBytes > 0 ? ` (${formatBytes(device.nightBytes)} after-hours)` : ""}</li>
            <li>Destinations to review before allow-listing:
              <ul>
                ${topDests.map((dest) => `<li>${escapeHtml(dest.name)} — ${formatBytes(dest.bytes)} across ${dest.count} connection${dest.count === 1 ? "" : "s"}</li>`).join("")}
              </ul>
            </li>
          </ul>
        </div>
      `;
    });

    if (clear.length > 0) {
      html += `<p class="plan-summary">No action needed: ${clear.map((it) => escapeHtml(it.device.name)).join(", ")}.</p>`;
    }

    planOutput.innerHTML = html;
    planOutput.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  loadSampleBtn.addEventListener("click", async () => {
    clearError();
    try {
      const res = await fetch("data/sample.csv");
      if (!res.ok) throw new Error("Could not load sample data.");
      const text = await res.text();
      sampleText = text.trim();
      csvInput.value = text;
      runAnalysis(text, true);
    } catch (err) {
      showError("Could not load the bundled sample file. Try pasting a log instead.");
    }
  });

  analyzeBtn.addEventListener("click", () => {
    const text = csvInput.value.trim();
    if (!text) {
      showError("Paste a CSV log first, or load the example data.");
      return;
    }
    runAnalysis(text, sampleText !== null && text === sampleText);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      csvInput.value = text;
      runAnalysis(text, false);
    };
    reader.onerror = () => showError("Could not read that file.");
    reader.readAsText(file);
  });

  generatePlanBtn.addEventListener("click", generatePlan);
})();
