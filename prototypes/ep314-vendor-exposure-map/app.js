(function () {
  "use strict";

  const DATA_TYPES = [
    { key: "names", label: "Names", weight: 1, color: "#64748b" },
    { key: "emails", label: "Emails", weight: 2, color: "#2563eb" },
    { key: "addresses", label: "Addresses", weight: 2, color: "#0d9488" },
    { key: "payment", label: "Payment details", weight: 5, color: "#dc2626" },
    { key: "health", label: "Health notes", weight: 5, color: "#7c3aed" },
  ];

  const MAX_SCORE = DATA_TYPES.reduce((sum, d) => sum + d.weight, 0);

  const ROTATE_BY_TYPE = {
    names: "Low risk alone — but check whether other fields leaked alongside the names.",
    emails: "Force a password reset for any account that uses this vendor's email list, and turn on MFA where you can.",
    addresses: "Warn customers to watch for phishing mail or fake delivery notices sent to their address.",
    payment: "Rotate API keys and tokens shared with this payment processor immediately, and ask your bank or acquirer to flag the account for fraud monitoring.",
    health: "Pause any automated export of health notes to or from this vendor, and treat this as time-sensitive.",
  };

  const GENERAL_ROTATE = [
    "Rotate the API key or login credentials your business uses to connect to this vendor.",
    "Revoke and reissue any OAuth tokens or SSO connections tied to this vendor.",
    "Check the vendor's status page or security page for an official incident report.",
    "Change any password your team reused on this vendor's login elsewhere.",
  ];

  const QUESTIONS_FOR_VENDOR = [
    "When was the breach discovered, and when did it actually happen?",
    "Exactly which of our records were affected — can you give us the list?",
    "What categories of data were exposed?",
    "What are you doing to contain it, and by when?",
    "Will you cover costs tied to this breach, such as credit monitoring or forensics?",
    "Can you confirm the above to us in writing?",
  ];

  let vendors = [];
  let nextId = 1;
  let selectedVendorId = null;
  let exampleMode = false;

  const el = (id) => document.getElementById(id);

  function riskTier(score) {
    if (score <= 0) return { label: "None", cls: "risk-none" };
    if (score <= 2) return { label: "Low", cls: "risk-low" };
    if (score <= 5) return { label: "Moderate", cls: "risk-moderate" };
    if (score <= 9) return { label: "High", cls: "risk-high" };
    return { label: "Critical", cls: "risk-critical" };
  }

  function scoreOf(vendor) {
    return DATA_TYPES.reduce((sum, d) => sum + (vendor.data[d.key] ? d.weight : 0), 0);
  }

  function dataTypesHeld(vendor) {
    return DATA_TYPES.filter((d) => vendor.data[d.key]);
  }

  function buildWeightLegend() {
    const ul = el("weightLegend");
    ul.innerHTML = "";
    DATA_TYPES.forEach((d) => {
      const li = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = d.color;
      li.appendChild(swatch);
      li.appendChild(document.createTextNode(`${d.label} — weight ${d.weight}`));
      ul.appendChild(li);
    });
  }

  function buildDataCheckboxes() {
    const fieldset = document.querySelector("#vendorForm .data-checks");
    DATA_TYPES.forEach((d) => {
      const wrap = document.createElement("label");
      wrap.className = "data-check-item";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.key = d.key;
      input.id = "newdata-" + d.key;
      wrap.appendChild(input);
      wrap.appendChild(document.createTextNode(d.label));
      fieldset.appendChild(wrap);
    });
  }

  function buildTableHead() {
    const tr = el("vendorTableHead");
    tr.innerHTML = "";
    const thName = document.createElement("th");
    thName.textContent = "Vendor";
    tr.appendChild(thName);
    DATA_TYPES.forEach((d) => {
      const th = document.createElement("th");
      th.textContent = d.label;
      tr.appendChild(th);
    });
    const thScore = document.createElement("th");
    thScore.textContent = "Exposure";
    tr.appendChild(thScore);
    const thRemove = document.createElement("th");
    thRemove.textContent = "";
    tr.appendChild(thRemove);
  }

  function renderTable() {
    const body = el("vendorTableBody");
    body.innerHTML = "";

    if (vendors.length === 0) {
      const tr = document.createElement("tr");
      tr.id = "emptyRow";
      const td = document.createElement("td");
      td.colSpan = DATA_TYPES.length + 3;
      td.className = "empty-state";
      td.textContent = "No vendors yet. Add one above, or load the example shop.";
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    const sorted = vendors.slice().sort((a, b) => scoreOf(b) - scoreOf(a));

    sorted.forEach((vendor) => {
      const score = scoreOf(vendor);
      const tier = riskTier(score);
      const tr = document.createElement("tr");
      tr.className = "vendor-row";
      tr.tabIndex = 0;
      tr.setAttribute("role", "button");
      tr.setAttribute("aria-label", `Open breach-day checklist for ${vendor.name}`);
      if (vendor.id === selectedVendorId) tr.classList.add("selected");
      tr.addEventListener("click", () => openChecklist(vendor.id));
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openChecklist(vendor.id);
        }
      });

      const tdName = document.createElement("td");
      const nameWrap = document.createElement("div");
      nameWrap.className = "vendor-name-cell";
      const nameText = document.createElement("span");
      nameText.textContent = vendor.name;
      const catText = document.createElement("span");
      catText.className = "vendor-category";
      catText.textContent = vendor.category;
      const stack = document.createElement("div");
      stack.appendChild(nameText);
      stack.appendChild(catText);
      nameWrap.appendChild(stack);
      tdName.appendChild(nameWrap);
      tr.appendChild(tdName);

      DATA_TYPES.forEach((d) => {
        const td = document.createElement("td");
        const dot = document.createElement("span");
        dot.className = "cell-dot" + (vendor.data[d.key] ? " filled" : "");
        if (vendor.data[d.key]) {
          dot.style.background = d.color;
          dot.title = d.label + " — held";
        } else {
          dot.title = d.label + " — not held";
        }
        td.appendChild(dot);
        tr.appendChild(td);
      });

      const tdScore = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "score-badge " + tier.cls;
      badge.textContent = `${score}/${MAX_SCORE} · ${tier.label}`;
      tdScore.appendChild(badge);
      tr.appendChild(tdScore);

      const tdRemove = document.createElement("td");
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", `Remove ${vendor.name}`);
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeVendor(vendor.id);
      });
      tdRemove.appendChild(removeBtn);
      tr.appendChild(tdRemove);

      body.appendChild(tr);
    });
  }

  function removeVendor(id) {
    vendors = vendors.filter((v) => v.id !== id);
    if (selectedVendorId === id) {
      selectedVendorId = null;
      el("checklistPanel").hidden = true;
    }
    renderTable();
  }

  function draftNoteFor(vendor) {
    const held = dataTypesHeld(vendor).map((d) => d.label.toLowerCase());
    const heldText = held.length ? held.join(", ") : "limited information";
    return [
      `Subject: An important update about ${vendor.name} and your information`,
      "",
      "Hi [customer name],",
      "",
      `We want you to know that one of the outside tools we use, ${vendor.name} (our ${vendor.category.toLowerCase()}), reported a data security incident. Based on what we know today, this vendor held the following of your information: ${heldText}.`,
      "",
      `We are working directly with ${vendor.name} to understand exactly what happened, and we will update you as soon as we know more. In the meantime, please keep an eye on your accounts and be cautious of any unexpected emails, calls, or mail that reference your details.`,
      "",
      "We take this seriously and are sorry for the worry this may cause. We will keep you posted.",
      "",
      "— [Your business name]",
    ].join("\n");
  }

  function openChecklist(id) {
    const vendor = vendors.find((v) => v.id === id);
    if (!vendor) return;
    selectedVendorId = id;
    renderTable();

    el("checklistPanel").hidden = false;
    el("checklistTitle").textContent = `Breach-day checklist — ${vendor.name}`;

    const held = dataTypesHeld(vendor);
    const dataHeldList = el("checklistDataHeld");
    dataHeldList.innerHTML = "";
    if (held.length === 0) {
      dataHeldList.innerHTML = "<li>No customer data types ticked yet for this vendor.</li>";
    } else {
      held.forEach((d) => {
        const li = document.createElement("li");
        li.textContent = `${d.label} (weight ${d.weight})`;
        dataHeldList.appendChild(li);
      });
    }

    const rotateList = el("checklistRotate");
    rotateList.innerHTML = "";
    GENERAL_ROTATE.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      rotateList.appendChild(li);
    });
    held.forEach((d) => {
      const li = document.createElement("li");
      li.textContent = ROTATE_BY_TYPE[d.key];
      rotateList.appendChild(li);
    });

    const questionsList = el("checklistQuestions");
    questionsList.innerHTML = "";
    QUESTIONS_FOR_VENDOR.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      questionsList.appendChild(li);
    });

    el("draftNote").value = draftNoteFor(vendor);
    el("polishStatus").textContent = "";

    el("checklistPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function fillPrintArea() {
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor) return;
    el("printVendorTitle").textContent = `Breach-day checklist — ${vendor.name}`;
    el("printVendorMeta").textContent = `Type: ${vendor.category} · Exposure score: ${scoreOf(vendor)}/${MAX_SCORE}`;

    const printList = (ulId, items) => {
      const ul = el(ulId);
      ul.innerHTML = "";
      items.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
    };

    const held = dataTypesHeld(vendor).map((d) => `${d.label} (weight ${d.weight})`);
    printList("printDataHeld", held.length ? held : ["No customer data types ticked yet for this vendor."]);

    const rotate = GENERAL_ROTATE.concat(dataTypesHeld(vendor).map((d) => ROTATE_BY_TYPE[d.key]));
    printList("printRotate", rotate);
    printList("printQuestions", QUESTIONS_FOR_VENDOR);

    el("printDraftNote").textContent = el("draftNote").value;
  }

  function addVendor(name, category, dataFlags) {
    vendors.push({ id: nextId++, name, category, data: Object.assign({}, dataFlags) });
    renderTable();
  }

  async function loadExampleShop() {
    try {
      const res = await fetch("data/example-vendors.json");
      const json = await res.json();
      vendors = [];
      nextId = 1;
      json.vendors.forEach((v) => addVendor(v.name, v.category, v.data));
      exampleMode = true;
      el("exampleBadge").hidden = false;
      renderTable();
      const topVendor = vendors.slice().sort((a, b) => scoreOf(b) - scoreOf(a))[0];
      if (topVendor) openChecklist(topVendor.id);
    } catch (err) {
      console.error("Could not load example shop", err);
    }
  }

  function clearVendors() {
    vendors = [];
    selectedVendorId = null;
    exampleMode = false;
    el("exampleBadge").hidden = true;
    el("checklistPanel").hidden = true;
    renderTable();
  }

  function setupForm() {
    el("vendorForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = el("vendorName").value.trim();
      if (!name) return;
      const category = el("vendorCategory").value;
      const flags = {};
      DATA_TYPES.forEach((d) => {
        flags[d.key] = el("newdata-" + d.key).checked;
      });
      addVendor(name, category, flags);
      e.target.reset();
      exampleMode = false;
      el("exampleBadge").hidden = true;
    });
  }

  async function polishWithAI() {
    const key = el("apiKey").value.trim();
    const status = el("polishStatus");
    if (!key) {
      status.textContent = "Add an API key above to use this — the plain draft above still works fine without it.";
      return;
    }
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor) return;

    status.textContent = "Polishing draft…";
    el("polishBtn").disabled = true;
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content:
                "Rewrite this draft customer breach-notice email to sound calm, clear and empathetic, in plain English. " +
                "Keep every fact exactly as given, keep the bracketed placeholders like [customer name], and keep the overall length similar. " +
                "Return only the rewritten email text, no commentary.\n\n" + el("draftNote").value,
            },
          ],
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`API error ${resp.status}: ${text.slice(0, 200)}`);
      }
      const json = await resp.json();
      const text = json.content && json.content[0] && json.content[0].text;
      if (text) {
        el("draftNote").value = text.trim();
        status.textContent = "Draft polished with AI.";
      } else {
        status.textContent = "Got an empty response — kept your original draft.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Could not reach the AI (check your key) — kept your original draft.";
    } finally {
      el("polishBtn").disabled = false;
    }
  }

  function setupButtons() {
    el("loadExampleBtn").addEventListener("click", loadExampleShop);
    el("clearBtn").addEventListener("click", clearVendors);
    el("closeChecklistBtn").addEventListener("click", () => {
      selectedVendorId = null;
      el("checklistPanel").hidden = true;
      renderTable();
    });
    el("polishBtn").addEventListener("click", polishWithAI);
    el("printBtn").addEventListener("click", () => {
      fillPrintArea();
      document.body.classList.add("printing");
      window.print();
    });
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("printing");
    });
  }

  function init() {
    buildWeightLegend();
    buildDataCheckboxes();
    buildTableHead();
    setupForm();
    setupButtons();
    renderTable();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
