(() => {
  "use strict";

  const EOL_API = "https://endoflife.date/api/v1/products/php/";
  const OSV_BATCH_API = "https://api.osv.dev/v1/querybatch";
  const OSV_VULN_API = "https://api.osv.dev/v1/vulns/";
  const FETCH_TIMEOUT_MS = 8000;

  const form = document.getElementById("scan-form");
  const phpInput = document.getElementById("php-version");
  const stackInput = document.getElementById("stack-input");
  const scanBtn = document.getElementById("scan-btn");
  const exampleBtn = document.getElementById("example-btn");
  const statusLine = document.getElementById("status-line");

  const resultsPanel = document.getElementById("results-panel");
  const phpBanner = document.getElementById("php-banner");
  const summaryBar = document.getElementById("summary-bar");
  const findingsBody = document.getElementById("findings-body");
  const tableWrap = document.querySelector(".table-wrap");
  const showMoreBtn = document.getElementById("show-more-btn");
  const cleanNote = document.getElementById("clean-note");
  const summaryText = document.getElementById("summary-text");
  const copyBtn = document.getElementById("copy-btn");
  const eolFallbackDateEl = document.getElementById("eol-fallback-date");
  const exampleModeBar = document.getElementById("example-mode-bar");
  const exampleModeText = document.getElementById("example-mode-text");
  const refreshLiveBtn = document.getElementById("refresh-live-btn");

  const EXAMPLE_PHP_VERSION = "7.2.24";
  const EXAMPLE_STACK_TEXT =
    "symfony/http-kernel 4.4.0\n" +
    "phpmailer/phpmailer 5.2.16\n" +
    "laravel/framework 5.5.0\n" +
    "twig/twig 1.38.0\n" +
    "monolog/monolog 1.23.0";

  let exampleDataPromise = null;
  function loadExampleData() {
    if (!exampleDataPromise) {
      exampleDataPromise = fetch("data/example-stack.json").then((r) => r.json());
    }
    return exampleDataPromise;
  }

  let eolFallbackPromise = null;
  function loadEolFallback() {
    if (!eolFallbackPromise) {
      eolFallbackPromise = fetch("data/php-eol-fallback.json").then((r) => r.json());
    }
    return eolFallbackPromise;
  }
  loadEolFallback()
    .then((d) => {
      if (eolFallbackDateEl) eolFallbackDateEl.textContent = d.generated_at.slice(0, 10);
    })
    .catch(() => {
      if (eolFallbackDateEl) eolFallbackDateEl.textContent = "unavailable";
    });

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  async function fetchJson(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function mapPool(items, limit, fn) {
    const results = new Array(items.length);
    let i = 0;
    async function worker() {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx], idx);
      }
    }
    const workers = [];
    for (let w = 0; w < Math.min(limit, items.length); w++) workers.push(worker());
    await Promise.all(workers);
    return results;
  }

  // ---------- Parsing ----------

  function parsePhpCycle(raw) {
    const text = (raw || "").trim();
    const m = text.match(/^v?(\d+)\.(\d+)/i);
    if (!m) return null;
    return { cycle: `${m[1]}.${m[2]}`, raw: text };
  }

  function parseStackInput(raw) {
    const text = (raw || "").trim();
    if (!text) return [];

    // Try composer.lock JSON first.
    try {
      const parsed = JSON.parse(text);
      if (parsed && (Array.isArray(parsed.packages) || Array.isArray(parsed["packages-dev"]))) {
        const all = [...(parsed.packages || []), ...(parsed["packages-dev"] || [])];
        return all
          .filter((p) => p && p.name && p.version)
          .map((p) => ({ name: String(p.name).toLowerCase(), version: String(p.version) }));
      }
    } catch (e) {
      // not JSON, fall through to line parsing
    }

    const lines = text.split(/\r?\n/);
    const out = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^([a-z0-9][a-z0-9_.\-]*\/[a-z0-9][a-z0-9_.\-]*)\s*[:@\s]\s*v?([0-9][a-zA-Z0-9.\-+]*)/i);
      if (m) out.push({ name: m[1].toLowerCase(), version: m[2] });
    }
    return out;
  }

  // ---------- PHP EOL ----------

  async function lookupPhpSupport(cycle) {
    try {
      const data = await fetchJson(EOL_API, {}, FETCH_TIMEOUT_MS);
      const release = (data.result?.releases || []).find((r) => r.name === cycle);
      if (!release) return { found: false, source: "live" };
      return {
        found: true,
        source: "live",
        cycle: release.name,
        releaseDate: release.releaseDate,
        isEoas: release.isEoas,
        eoasFrom: release.eoasFrom,
        isEol: release.isEol,
        eolFrom: release.eolFrom,
        latest: release.latest?.name || null,
      };
    } catch (e) {
      try {
        const fallback = await loadEolFallback();
        const release = (fallback.releases || []).find((r) => r.cycle === cycle);
        if (!release) return { found: false, source: "fallback", asOf: fallback.generated_at };
        return {
          found: true,
          source: "fallback",
          asOf: fallback.generated_at,
          cycle: release.cycle,
          releaseDate: release.releaseDate,
          isEoas: release.isEoas,
          eoasFrom: release.eoasFrom,
          isEol: release.isEol,
          eolFrom: release.eolFrom,
          latest: release.latest,
        };
      } catch (e2) {
        return { found: false, source: "error" };
      }
    }
  }

  function renderPhpBanner(cycleRaw, support) {
    if (!support) {
      phpBanner.hidden = true;
      return;
    }
    phpBanner.hidden = false;
    if (!support.found) {
      phpBanner.className = "php-banner warn";
      const note =
        support.source === "error"
          ? "Couldn't reach endoflife.date and the bundled snapshot didn't have an answer either."
          : `PHP "${cycleRaw}" isn't a recognized release branch (try e.g. 8.1, 8.2, 8.3).`;
      phpBanner.innerHTML = `<span class="php-title">PHP ${escapeHtml(cycleRaw)}</span><span class="php-meta">${escapeHtml(note)}</span>`;
      return;
    }
    let statusText, cls;
    if (support.isEol) {
      statusText = "End of life — no security fixes, even critical ones.";
      cls = "eol";
    } else if (support.isEoas) {
      statusText = "Security support only — active development has stopped.";
      cls = "warn";
    } else {
      statusText = "Actively supported.";
      cls = "ok";
    }
    phpBanner.className = "php-banner " + cls;
    const sourceTag =
      support.source === "live"
        ? "Live from endoflife.date"
        : `Offline bundled snapshot, as of ${support.asOf ? support.asOf.slice(0, 10) : "unknown date"}`;
    phpBanner.innerHTML = `
      <span class="php-title">PHP ${escapeHtml(support.cycle)} — ${escapeHtml(statusText)}</span>
      <span class="php-meta">Released ${escapeHtml(support.releaseDate || "?")}.
        ${support.eoasFrom ? `Active support ended ${escapeHtml(support.eoasFrom)}.` : ""}
        ${support.eolFrom ? `Security support ${support.isEol ? "ended" : "ends"} ${escapeHtml(support.eolFrom)}.` : ""}
        ${support.latest ? `Latest patch in this branch: ${escapeHtml(support.latest)}.` : ""}
      </span>
      <span class="source-tag">${escapeHtml(sourceTag)}</span>
    `;
  }

  // ---------- OSV vulnerability lookup ----------

  function normalizeSeverity(sev) {
    if (!sev) return "UNKNOWN";
    const s = sev.toUpperCase();
    if (s === "MEDIUM") return "MODERATE";
    if (["CRITICAL", "HIGH", "MODERATE", "LOW"].includes(s)) return s;
    return "UNKNOWN";
  }

  function parseVersionTokens(v) {
    return String(v)
      .replace(/^v/i, "")
      .split(/(\d+)/)
      .filter((t) => t !== "");
  }

  function compareVersions(a, b) {
    const ta = parseVersionTokens(a);
    const tb = parseVersionTokens(b);
    const len = Math.max(ta.length, tb.length);
    for (let i = 0; i < len; i++) {
      const xa = ta[i];
      const xb = tb[i];
      if (xa === undefined) return -1;
      if (xb === undefined) return 1;
      const na = /^\d+$/.test(xa);
      const nb = /^\d+$/.test(xb);
      if (na && nb) {
        const diff = parseInt(xa, 10) - parseInt(xb, 10);
        if (diff !== 0) return diff < 0 ? -1 : 1;
      } else if (xa !== xb) {
        return xa < xb ? -1 : 1;
      }
    }
    return 0;
  }

  // Picks only the fix(es) relevant to the branch the installed version is actually on,
  // since OSV's affected ranges span every major branch a vulnerability was ever patched in.
  function extractFixedVersions(vulnDetail, packageName, installedVersion) {
    const matching = new Set();
    let matchedAnyRange = false;
    const allFixed = new Set();
    for (const aff of vulnDetail.affected || []) {
      if ((aff.package?.name || "").toLowerCase() !== packageName.toLowerCase()) continue;
      for (const range of aff.ranges || []) {
        let introduced = null;
        let fixedVal = null;
        let lastAffected = null;
        for (const event of range.events || []) {
          if (event.introduced !== undefined) introduced = event.introduced;
          if (event.fixed) fixedVal = event.fixed;
          if (event.last_affected) lastAffected = event.last_affected;
        }
        if (fixedVal) allFixed.add(fixedVal);
        const introducedOk = !introduced || introduced === "0" || compareVersions(installedVersion, introduced) >= 0;
        const upperOk = fixedVal
          ? compareVersions(installedVersion, fixedVal) < 0
          : lastAffected
          ? compareVersions(installedVersion, lastAffected) <= 0
          : true;
        if (introducedOk && upperOk) {
          matchedAnyRange = true;
          if (fixedVal) matching.add(fixedVal);
        }
      }
    }
    if (matchedAnyRange) {
      if (matching.size > 0) return Array.from(matching);
      // The matched range only had a last_affected event (no fixed event of its own).
      // Fall back to the lowest fix documented in any other range of this same
      // vulnerability that is actually ahead of the installed version.
      let fallback = null;
      for (const fixedVal of allFixed) {
        if (compareVersions(installedVersion, fixedVal) < 0) {
          if (fallback === null || compareVersions(fixedVal, fallback) < 0) fallback = fixedVal;
        }
      }
      return fallback ? [fallback] : [];
    }
    return Array.from(allFixed);
  }

  function pickReference(vulnDetail) {
    const refs = vulnDetail.references || [];
    const advisory = refs.find((r) => /advisories|security\/advisories/.test(r.url || ""));
    return (advisory || refs[0] || {}).url || null;
  }

  function vulnDetailToFinding(vulnDetail, pkg) {
    const cve = (vulnDetail.aliases || []).find((a) => a.startsWith("CVE-")) || null;
    return {
      package: pkg.name,
      version: pkg.version,
      id: vulnDetail.id,
      cve,
      summary: vulnDetail.summary || vulnDetail.id,
      severity: normalizeSeverity(vulnDetail.database_specific?.severity),
      fixedVersions: extractFixedVersions(vulnDetail, pkg.name, pkg.version),
      reference: pickReference(vulnDetail),
    };
  }

  async function lookupVulnerabilities(packages, onProgress) {
    const queries = packages.map((p) => ({
      package: { name: p.name, ecosystem: "Packagist" },
      version: p.version,
    }));
    const batch = await fetchJson(
      OSV_BATCH_API,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ queries }) },
      FETCH_TIMEOUT_MS
    );

    const results = batch.results || [];
    const idToPackages = new Map();
    results.forEach((r, i) => {
      for (const v of r.vulns || []) {
        if (!idToPackages.has(v.id)) idToPackages.set(v.id, []);
        idToPackages.get(v.id).push(packages[i]);
      }
    });

    const uniqueIds = Array.from(idToPackages.keys());
    let completed = 0;
    const details = await mapPool(uniqueIds, 5, async (id) => {
      try {
        return await fetchJson(OSV_VULN_API + id, {}, FETCH_TIMEOUT_MS);
      } catch (e) {
        return null;
      } finally {
        completed++;
        if (onProgress) onProgress(completed, uniqueIds.length);
      }
    });

    const findings = [];
    uniqueIds.forEach((id, i) => {
      const detail = details[i];
      if (!detail) return;
      for (const pkg of idToPackages.get(id)) {
        findings.push(vulnDetailToFinding(detail, pkg));
      }
    });
    return findings;
  }

  function exampleDataToFindings(exampleData) {
    const findings = [];
    for (const pkg of exampleData.packages) {
      for (const v of pkg.vulns) {
        findings.push(vulnDetailToFinding(v, { name: pkg.name, version: pkg.version }));
      }
    }
    return findings;
  }

  // ---------- Rendering ----------

  const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MODERATE: 2, LOW: 3, UNKNOWN: 4 };

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function renderSummaryBar(findings, packagesScannedCount) {
    const counts = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0, UNKNOWN: 0 };
    findings.forEach((f) => counts[f.severity]++);
    summaryBar.innerHTML = `
      <span class="stat-chip scanned">Packages scanned: <span class="n">${packagesScannedCount}</span></span>
      <span class="stat-chip crit">Critical: <span class="n">${counts.CRITICAL}</span></span>
      <span class="stat-chip high">High: <span class="n">${counts.HIGH}</span></span>
      <span class="stat-chip mod">Moderate: <span class="n">${counts.MODERATE}</span></span>
      <span class="stat-chip low">Low: <span class="n">${counts.LOW}</span></span>
    `;
    return counts;
  }

  function renderFindingsTable(findings) {
    findingsBody.innerHTML = "";
    if (findings.length === 0) {
      tableWrap.hidden = true;
      cleanNote.hidden = false;
      showMoreBtn.hidden = true;
      return;
    }
    tableWrap.hidden = false;
    cleanNote.hidden = true;

    const sorted = [...findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
    let extraCount = 0;
    for (const f of sorted) {
      const tr = document.createElement("tr");
      const isCollapsible = f.severity === "MODERATE" || f.severity === "LOW";
      if (isCollapsible) {
        tr.className = "row-" + f.severity.toLowerCase();
        extraCount++;
      }
      const fixedText = f.fixedVersions.length ? f.fixedVersions.join(" or ") : "no fix published yet";
      const cveText = f.cve ? ` (${f.cve})` : "";
      const refHtml = f.reference
        ? `<a href="${escapeHtml(f.reference)}" target="_blank" rel="noopener">Advisory ↗</a>`
        : "";
      tr.innerHTML = `
        <td data-label="Severity"><span class="sev-badge ${f.severity}">${f.severity}</span></td>
        <td class="pkg-name" data-label="Package">${escapeHtml(f.package)}</td>
        <td class="pkg-version" data-label="Installed">${escapeHtml(f.version)}</td>
        <td class="fixed-in" data-label="Fixed in">${escapeHtml(fixedText)}</td>
        <td class="finding-summary" data-label="Finding">${escapeHtml(f.summary)}${escapeHtml(cveText)}${refHtml}</td>
      `;
      findingsBody.appendChild(tr);
    }

    if (extraCount > 0) {
      showMoreBtn.hidden = false;
      showMoreBtn.textContent = `Show ${extraCount} more moderate/low-severity finding${extraCount === 1 ? "" : "s"}`;
      showMoreBtn.dataset.expanded = "false";
    } else {
      showMoreBtn.hidden = true;
    }
  }

  showMoreBtn.addEventListener("click", () => {
    const expand = showMoreBtn.dataset.expanded !== "true";
    findingsBody.querySelectorAll(".row-moderate, .row-low").forEach((tr) => {
      tr.classList.toggle("show", expand);
    });
    showMoreBtn.dataset.expanded = expand ? "true" : "false";
    showMoreBtn.textContent = expand
      ? "Show fewer findings"
      : showMoreBtn.dataset.collapsedLabel || showMoreBtn.textContent;
    if (!showMoreBtn.dataset.collapsedLabel) {
      showMoreBtn.dataset.collapsedLabel = showMoreBtn.textContent;
    }
  });

  function buildSummaryText({ phpCycleRaw, support, findings, packagesScannedCount, counts, mode }) {
    const lines = [];
    const today = new Date().toISOString().slice(0, 10);
    lines.push(`Stack Exposure Check — ${today}`);
    if (mode === "example") lines.push("(Example scan — sample stack, for demonstration)");
    lines.push("");
    if (support) {
      if (support.found) {
        const statusText = support.isEol
          ? "END OF LIFE — no security fixes"
          : support.isEoas
          ? "security support only"
          : "actively supported";
        lines.push(`PHP ${support.cycle}: ${statusText}`);
        if (support.eolFrom) lines.push(`  Security support ${support.isEol ? "ended" : "ends"} ${support.eolFrom}`);
        lines.push(`  (${support.source === "live" ? "live check" : "offline snapshot as of " + (support.asOf || "").slice(0, 10)})`);
      } else {
        lines.push(`PHP ${phpCycleRaw}: could not determine support status`);
      }
      lines.push("");
    }
    lines.push(`Packages scanned: ${packagesScannedCount}`);
    lines.push(
      `Findings: ${counts.CRITICAL} critical, ${counts.HIGH} high, ${counts.MODERATE} moderate, ${counts.LOW} low`
    );
    lines.push("");
    if (findings.length) {
      lines.push("Priority findings:");
      const sorted = [...findings].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
      sorted.slice(0, 15).forEach((f, i) => {
        const fixedText = f.fixedVersions.length ? f.fixedVersions.join(" or ") : "no fix yet";
        lines.push(
          `${i + 1}. [${f.severity}] ${f.package}@${f.version} — ${f.summary}${f.cve ? " (" + f.cve + ")" : ""} — fix: ${fixedText}`
        );
      });
      if (sorted.length > 15) lines.push(`...and ${sorted.length - 15} more lower-priority finding(s).`);
    } else {
      lines.push("No known vulnerabilities found in the packages listed.");
    }
    lines.push("");
    lines.push("Checked against endoflife.date (PHP support) and OSV.dev (package vulnerabilities).");
    return lines.join("\n");
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(summaryText.textContent);
      const old = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = old), 1800);
    } catch (e) {
      setStatus("Couldn't copy automatically — select the text and copy it manually.", true);
    }
  });

  // ---------- Main flow ----------

  function hideExampleModeBar() {
    exampleModeBar.hidden = true;
  }

  function showExampleModeBar(asOfDate) {
    exampleModeBar.hidden = false;
    exampleModeText.textContent =
      `Cached example — a real result set captured ${asOfDate ? asOfDate.slice(0, 10) : "earlier"}, ` +
      "shown instantly with no live request. Not live right now.";
  }

  // Renders a bundled, previously-captured result set with zero network requests, so the
  // "see it work" path is never at the mercy of OSV.dev's per-vulnerability fetch fan-out.
  async function showCachedExample() {
    scanBtn.disabled = true;
    exampleBtn.disabled = true;
    setStatus("Loading cached example…");
    resultsPanel.hidden = true;

    try {
      const [exampleData, eolFallback] = await Promise.all([loadExampleData(), loadEolFallback()]);
      const phpParsed = parsePhpCycle(exampleData.php_version);
      const release = phpParsed ? (eolFallback.releases || []).find((r) => r.cycle === phpParsed.cycle) : null;
      const support = release
        ? {
            found: true,
            source: "fallback",
            asOf: eolFallback.generated_at,
            cycle: release.cycle,
            releaseDate: release.releaseDate,
            isEoas: release.isEoas,
            eoasFrom: release.eoasFrom,
            isEol: release.isEol,
            eolFrom: release.eolFrom,
            latest: release.latest,
          }
        : { found: false, source: "fallback", asOf: eolFallback.generated_at };

      const findings = exampleDataToFindings(exampleData);
      const packagesScannedCount = exampleData.packages.length;

      renderPhpBanner(phpParsed ? phpParsed.raw : "", support);
      const counts = renderSummaryBar(findings, packagesScannedCount);
      renderFindingsTable(findings);
      summaryText.textContent = buildSummaryText({
        phpCycleRaw: phpParsed ? phpParsed.raw : "",
        support,
        findings,
        packagesScannedCount,
        counts,
        mode: "example",
      });

      showExampleModeBar(exampleData.generated_at);
      resultsPanel.hidden = false;
      resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus(`Showing cached example results, captured ${exampleData.generated_at.slice(0, 10)}.`);
    } catch (e) {
      setStatus("Couldn't load the bundled example data.", true);
    } finally {
      scanBtn.disabled = false;
      exampleBtn.disabled = false;
    }
  }

  async function runScan(isExample) {
    const phpParsed = parsePhpCycle(phpInput.value);
    const packages = parseStackInput(stackInput.value);

    if (!phpParsed && packages.length === 0) {
      setStatus("Enter a PHP version, or paste a composer.lock / package list, to scan.", true);
      return;
    }

    scanBtn.disabled = true;
    exampleBtn.disabled = true;
    refreshLiveBtn.disabled = true;
    setStatus(isExample ? "Refreshing — checking PHP support and querying OSV.dev…" : "Scanning — checking PHP support and querying OSV.dev…");
    resultsPanel.hidden = true;

    try {
      let support = null;
      if (phpParsed) {
        support = await lookupPhpSupport(phpParsed.cycle);
      }

      let findings = [];
      let vulnError = null;
      let usedCachedExample = false;
      let cachedExampleDate = null;

      if (packages.length > 0) {
        try {
          findings = await lookupVulnerabilities(packages, (done, total) => {
            setStatus(`Scanning — checked ${done} of ${total} vulnerability record${total === 1 ? "" : "s"}…`);
          });
        } catch (e) {
          if (isExample) {
            const exampleData = await loadExampleData();
            findings = exampleDataToFindings(exampleData);
            usedCachedExample = true;
            cachedExampleDate = exampleData.generated_at;
          } else {
            vulnError = e;
          }
        }
      }

      renderPhpBanner(phpParsed ? phpParsed.raw : "", support);

      if (vulnError) {
        tableWrap.hidden = true;
        cleanNote.hidden = false;
        cleanNote.textContent =
          "Couldn't reach OSV.dev to check your packages — check your connection and try again. No results are shown because none could be verified.";
        showMoreBtn.hidden = true;
        summaryBar.innerHTML = `<span class="stat-chip scanned">Packages scanned: <span class="n">0</span> (lookup failed)</span>`;
        summaryText.textContent = "Vulnerability lookup failed — couldn't reach OSV.dev. Try again when you have a connection.";
      } else {
        const counts = renderSummaryBar(findings, packages.length);
        renderFindingsTable(findings);
        summaryText.textContent = buildSummaryText({
          phpCycleRaw: phpParsed ? phpParsed.raw : "",
          support,
          findings,
          packagesScannedCount: packages.length,
          counts,
          mode: isExample ? "example" : "live",
        });
      }

      resultsPanel.hidden = false;
      resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });

      if (isExample) {
        if (usedCachedExample) {
          showExampleModeBar(cachedExampleDate);
          setStatus("Live lookup was unavailable just now — showing the cached example again.");
        } else {
          hideExampleModeBar();
          setStatus("Live refresh complete — this just ran against the live databases.");
        }
      } else {
        setStatus("Scan complete.");
      }
    } catch (e) {
      setStatus("Something went wrong running the scan. Please try again.", true);
    } finally {
      scanBtn.disabled = false;
      exampleBtn.disabled = false;
      refreshLiveBtn.disabled = false;
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    hideExampleModeBar();
    runScan(false);
  });

  exampleBtn.addEventListener("click", () => {
    phpInput.value = EXAMPLE_PHP_VERSION;
    stackInput.value = EXAMPLE_STACK_TEXT;
    showCachedExample();
  });

  refreshLiveBtn.addEventListener("click", () => {
    runScan(true);
  });
})();
