(() => {
  'use strict';

  const LOCAL_HOST = '__pasted-page__.invalid';
  const BASE_URL = 'https://' + LOCAL_HOST + '/';

  // Substrings matched against a hostname to recognise tag-manager / dynamic
  // loader style vendors (experimentation, analytics, tag containers, etc.)
  const DYNAMIC_LOADER_KEYWORDS = [
    'tagmanager', 'analytics', 'segment', 'optimizely', 'experiment',
    'hotjar', 'clarity', 'mixpanel', 'fullstory', 'adobedtm', 'tealium'
  ];

  const htmlInput = document.getElementById('html-input');
  const loadSampleBtn = document.getElementById('load-sample');
  const analyzeBtn = document.getElementById('analyze');
  const inputStatus = document.getElementById('input-status');
  const results = document.getElementById('results');
  const summaryStats = document.getElementById('summary-stats');
  const domainsTbody = document.getElementById('domains-tbody');
  const noExternalNote = document.getElementById('no-external-note');
  const inlineCountEl = document.getElementById('inline-count');
  const inlineListEl = document.getElementById('inline-list');
  const tagmanagerCountEl = document.getElementById('tagmanager-count');
  const tagmanagerListEl = document.getElementById('tagmanager-list');
  const cspOutput = document.getElementById('csp-output');
  const copyCspBtn = document.getElementById('copy-csp');
  const fixListEl = document.getElementById('fix-list');
  const copyFixlistBtn = document.getElementById('copy-fixlist');
  const copyStatus = document.getElementById('copy-status');

  /** @type {Map<string, {domain:string, types:Set<string>, entries:Array}>} */
  let domainMap = new Map();
  let checkedDomains = new Set();
  let inlineScripts = [];
  let tagManagerEntries = [];

  function resolveUrl(raw) {
    try {
      return new URL(raw, BASE_URL);
    } catch (e) {
      return null;
    }
  }

  function isDynamicLoaderHost(hostname) {
    const h = hostname.toLowerCase();
    return DYNAMIC_LOADER_KEYWORDS.some((kw) => h.includes(kw));
  }

  function addToDomainMap(domain, type, url, hasIntegrity, insecure) {
    if (!domainMap.has(domain)) {
      domainMap.set(domain, { domain, types: new Set(), entries: [] });
    }
    const entry = domainMap.get(domain);
    entry.types.add(type);
    entry.entries.push({ type, url, hasIntegrity, insecure });
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function statEl(num, label) {
    const div = document.createElement('div');
    div.className = 'stat';
    const n = document.createElement('span');
    n.className = 'num';
    n.textContent = String(num);
    const l = document.createElement('span');
    l.className = 'label';
    l.textContent = label;
    div.appendChild(n);
    div.appendChild(l);
    return div;
  }

  function analyze() {
    const raw = htmlInput.value;
    if (!raw.trim()) {
      inputStatus.textContent = 'Paste some HTML first.';
      return;
    }

    domainMap = new Map();
    inlineScripts = [];
    tagManagerEntries = [];

    const doc = new DOMParser().parseFromString(raw, 'text/html');

    doc.querySelectorAll('script').forEach((el) => {
      const src = el.getAttribute('src');
      if (!src) {
        inlineScripts.push((el.textContent || '').trim().slice(0, 90) || '(empty inline script)');
        return;
      }
      const resolved = resolveUrl(src);
      if (!resolved || resolved.hostname === LOCAL_HOST) return;
      const hasIntegrity = el.hasAttribute('integrity') && el.getAttribute('integrity').trim().length > 0;
      const insecure = resolved.protocol === 'http:';
      addToDomainMap(resolved.hostname, 'script', src, hasIntegrity, insecure);
      if (isDynamicLoaderHost(resolved.hostname)) {
        tagManagerEntries.push({ domain: resolved.hostname, url: src });
      }
    });

    doc.querySelectorAll('iframe').forEach((el) => {
      const src = el.getAttribute('src');
      if (!src) return;
      const resolved = resolveUrl(src);
      if (!resolved || resolved.hostname === LOCAL_HOST) return;
      const insecure = resolved.protocol === 'http:';
      addToDomainMap(resolved.hostname, 'iframe', src, null, insecure);
    });

    checkedDomains = new Set(domainMap.keys());

    inputStatus.textContent = `Analyzed ${doc.querySelectorAll('script').length + doc.querySelectorAll('iframe').length} tag(s).`;
    results.hidden = false;
    renderSummary();
    renderDomainsTable();
    renderHarderToControl();
    renderCSP();
    renderFixList();
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderSummary() {
    clearChildren(summaryStats);
    let scriptTagCount = 0;
    let missingSriCount = 0;
    let iframeCount = 0;
    domainMap.forEach((entry) => {
      entry.entries.forEach((e) => {
        if (e.type === 'script') {
          scriptTagCount += 1;
          if (!e.hasIntegrity) missingSriCount += 1;
        } else if (e.type === 'iframe') {
          iframeCount += 1;
        }
      });
    });
    summaryStats.appendChild(statEl(domainMap.size, 'external domains'));
    summaryStats.appendChild(statEl(scriptTagCount, 'external scripts'));
    summaryStats.appendChild(statEl(iframeCount, 'iframes'));
    summaryStats.appendChild(statEl(missingSriCount, 'missing SRI'));
    summaryStats.appendChild(statEl(inlineScripts.length, 'inline scripts'));
  }

  function makeScriptLine(entry) {
    const line = document.createElement('span');
    line.className = 'script-line';
    const path = document.createElement('span');
    path.textContent = entry.url;
    line.appendChild(path);
    line.appendChild(document.createElement('br'));
    const flag = document.createElement('span');
    if (entry.type === 'iframe') {
      flag.className = 'flag-warn';
      flag.textContent = '⚠ iframe content (not covered by SRI)';
    } else if (entry.hasIntegrity) {
      flag.className = 'flag-ok';
      flag.textContent = '✅ SRI present';
    } else {
      flag.className = 'flag-warn';
      flag.textContent = '⚠ SRI missing';
    }
    line.appendChild(flag);
    return line;
  }

  function renderDomainsTable() {
    clearChildren(domainsTbody);
    const domains = Array.from(domainMap.values()).sort((a, b) => a.domain.localeCompare(b.domain));
    noExternalNote.hidden = domains.length > 0;

    domains.forEach((entry) => {
      const tr = document.createElement('tr');

      const tdCheck = document.createElement('td');
      tdCheck.setAttribute('data-label', 'Include in CSP');
      const checkWrap = document.createElement('div');
      checkWrap.className = 'checkbox-wrap';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = checkedDomains.has(entry.domain);
      checkbox.setAttribute('aria-label', 'Include ' + entry.domain + ' in CSP header');
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) checkedDomains.add(entry.domain);
        else checkedDomains.delete(entry.domain);
        renderCSP();
      });
      checkWrap.appendChild(checkbox);
      tdCheck.appendChild(checkWrap);

      const tdDomain = document.createElement('td');
      tdDomain.setAttribute('data-label', 'Domain');
      tdDomain.className = 'domain-cell';
      tdDomain.textContent = entry.domain;

      const tdType = document.createElement('td');
      tdType.setAttribute('data-label', 'Type');
      Array.from(entry.types).forEach((t) => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = t;
        tdType.appendChild(badge);
      });

      const tdCount = document.createElement('td');
      tdCount.setAttribute('data-label', 'Count');
      tdCount.textContent = String(entry.entries.length);

      const tdScripts = document.createElement('td');
      tdScripts.setAttribute('data-label', 'Script tags & SRI status');
      entry.entries.forEach((e) => tdScripts.appendChild(makeScriptLine(e)));

      const tdNotes = document.createElement('td');
      tdNotes.setAttribute('data-label', 'Notes');
      const notes = [];
      if (entry.entries.some((e) => e.insecure)) notes.push('⚠ Loaded over plain HTTP, not HTTPS');
      if (isDynamicLoaderHost(entry.domain)) notes.push('See "Harder to control" — this vendor can load further code dynamically');
      if (notes.length === 0) notes.push('—');
      notes.forEach((n) => {
        const p = document.createElement('div');
        p.textContent = n;
        tdNotes.appendChild(p);
      });

      tr.appendChild(tdCheck);
      tr.appendChild(tdDomain);
      tr.appendChild(tdType);
      tr.appendChild(tdCount);
      tr.appendChild(tdScripts);
      tr.appendChild(tdNotes);
      domainsTbody.appendChild(tr);
    });
  }

  function renderHarderToControl() {
    clearChildren(inlineListEl);
    clearChildren(tagmanagerListEl);

    if (inlineScripts.length === 0) {
      inlineCountEl.textContent = 'No inline <script> blocks found on this page.';
    } else {
      inlineCountEl.textContent = `${inlineScripts.length} inline <script> block(s) found.`;
      inlineScripts.forEach((snippet) => {
        const li = document.createElement('li');
        li.textContent = snippet;
        inlineListEl.appendChild(li);
      });
    }

    const uniqueTmDomains = Array.from(new Set(tagManagerEntries.map((t) => t.domain)));
    if (uniqueTmDomains.length === 0) {
      tagmanagerCountEl.textContent = 'No known tag-manager or dynamic-loader patterns detected.';
    } else {
      tagmanagerCountEl.textContent = `${uniqueTmDomains.length} tag-manager / dynamic-loader domain(s) detected.`;
      tagManagerEntries.forEach((t) => {
        const li = document.createElement('li');
        li.textContent = `${t.domain} — ${t.url}`;
        tagmanagerListEl.appendChild(li);
      });
    }
  }

  function renderCSP() {
    const scriptDomains = [];
    const frameDomains = [];
    domainMap.forEach((entry, domain) => {
      if (!checkedDomains.has(domain)) return;
      if (entry.types.has('script')) scriptDomains.push(domain);
      if (entry.types.has('iframe')) frameDomains.push(domain);
    });
    scriptDomains.sort();
    frameDomains.sort();

    const scriptSrc = ["'self'"].concat(scriptDomains.map((d) => 'https://' + d));
    const frameSrc = ["'self'"].concat(frameDomains.map((d) => 'https://' + d));

    const lines = [
      'Content-Security-Policy:',
      '  default-src \'self\';',
      '  script-src ' + scriptSrc.join(' ') + ';',
      '  frame-src ' + frameSrc.join(' ') + ';',
      '  object-src \'none\';',
      '  base-uri \'self\';',
    ];
    cspOutput.textContent = lines.join('\n');
  }

  function renderFixList() {
    clearChildren(fixListEl);
    const items = [];

    const missingSriDomains = new Set();
    const insecureDomains = new Set();
    domainMap.forEach((entry, domain) => {
      entry.entries.forEach((e) => {
        if (e.type === 'script' && !e.hasIntegrity) missingSriDomains.add(domain);
        if (e.insecure) insecureDomains.add(domain);
      });
    });

    if (missingSriDomains.size > 0) {
      items.push(
        `Add Subresource Integrity (SRI) hashes to scripts from: ${Array.from(missingSriDomains).join(', ')}. ` +
        'If a vendor can\'t provide a hash, self-host a pinned copy of their script instead.'
      );
    }
    if (inlineScripts.length > 0) {
      items.push(
        `Move the ${inlineScripts.length} inline <script> block(s) into files you control, or add a per-deploy ` +
        'nonce/hash to each so a strict CSP can still allow them.'
      );
    }
    if (insecureDomains.size > 0) {
      items.push(`Switch these script(s)/iframe(s) from plain HTTP to HTTPS: ${Array.from(insecureDomains).join(', ')}.`);
    }
    const uniqueTmDomains = Array.from(new Set(tagManagerEntries.map((t) => t.domain)));
    if (uniqueTmDomains.length > 0) {
      items.push(
        `Ask these tag-manager / dynamic-loader vendors for a reviewed or sandboxed loading mode, since their ` +
        `containers can inject new code after your review: ${uniqueTmDomains.join(', ')}.`
      );
    }
    items.push(
      'Deploy the CSP header above starting in Content-Security-Policy-Report-Only mode for a few days, ' +
      'check your browser console for violations, then switch it to enforcing.'
    );
    items.push(
      'Re-run this scan after every vendor script update — a script you already trust can turn hostile the ' +
      'moment its vendor is compromised, as happened to 178 organisations in the incident described on the podcast.'
    );

    items.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      fixListEl.appendChild(li);
    });
  }

  async function copyToClipboard(text, statusEl, label) {
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = `${label} copied to clipboard.`;
    } catch (e) {
      statusEl.textContent = `Could not copy automatically — select and copy the text manually.`;
    }
  }

  loadSampleBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('data/sample-checkout.html');
      const text = await res.text();
      htmlInput.value = text;
      inputStatus.textContent = 'Sample checkout page loaded. Click Analyze.';
    } catch (e) {
      inputStatus.textContent = 'Could not load the sample file.';
    }
  });

  analyzeBtn.addEventListener('click', analyze);

  copyCspBtn.addEventListener('click', () => copyToClipboard(cspOutput.textContent, inputStatus, 'CSP header'));

  copyFixlistBtn.addEventListener('click', () => {
    const text = Array.from(fixListEl.children)
      .map((li, i) => `${i + 1}. ${li.textContent}`)
      .join('\n');
    copyToClipboard(text, copyStatus, 'Fix list');
  });
})();
