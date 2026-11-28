(() => {
  "use strict";

  const STOPWORDS = new Set([
    "a","an","the","and","or","but","of","to","in","on","for","with","is","are","was","were",
    "be","been","being","this","that","these","those","we","our","us","you","your","i","it",
    "its","they","their","them","who","which","what","will","would","can","could","should",
    "do","does","did","have","has","had","not","no","so","as","at","by","from","into","about",
    "up","out","if","than","then","there","here","over","under","after","before","while",
    "also","just","very","more","most","some","any","all","each","other","such","only","own",
    "same","too","very","s","t","re","ve","ll","d","m","am","org","organization"
  ]);

  const SYNONYM_GROUPS = [
    ["space","aerospace","orbit","orbital","suborbital","rocket","rockets","astronaut","spaceflight","launch"],
    ["climate","environment","environmental","sustainability","sustainable","carbon","emissions"],
    ["education","learning","students","student","school","schools","literacy","teaching"],
    ["health","medicine","medical","cure","disease","healthcare","wellness"],
    ["ocean","marine","sea","coral","reef","fisheries"],
    ["poverty","inequality","economic","income","homelessness","homeless"],
    ["ai","artificial","intelligence","technology","tech","innovation","robotics"],
    ["water","clean water","filter","filtration","sanitation","drinking"],
    ["energy","renewable","solar","wind","clean energy","power"],
    ["wildlife","conservation","animals","biodiversity","species","habitat"],
    ["refugee","refugees","displaced","displacement","migrant","migrants","camps","camp"],
    ["youth","young","kids","children","teen","teens","teenagers"],
    ["women","girls","gender"],
    ["food","hunger","nutrition","farming","agriculture"],
    ["mental","psychology","therapy","wellbeing","depression","anxiety"],
    ["prize","challenge","competition","grant","award","incentive"]
  ];

  const SYNONYM_LOOKUP = new Map();
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) SYNONYM_LOOKUP.set(term, group);
  }

  const EXAMPLE_MISSION =
    "We're launching a $250,000 prize for the first student team to build a portable, low-cost " +
    "water filtration kit that refugee camps can assemble without power tools.";

  const EXAMPLE_PROSPECTS_RAW = `Priya Oduya
Runs a family foundation and told a conference crowd, "clean water access for displaced families is the cause I'd drop everything for." Also funds youth robotics teams.

---

Marcus Lindqvist
Shipping-logistics entrepreneur. In a trade magazine profile he said he mainly cares about port automation and has never mentioned refugees, water or filtration.

---

Dana Kowalski
Angel investor who backed three clean-energy startups. In an interview she said, "the next big unlock for refugee camps is a filter kit that doesn't need electricity, I'd fund that tomorrow."

---

Teo Alvarenga
Known for collecting vintage cars. His only public statements about giving are about funding a local football league.

---

Simone Achebe
Former aid worker turned philanthropist. She told a podcast, "I still think about the families in that displacement camp with no clean drinking water, it's the thing I want my money to fix."`;

  const el = (id) => document.getElementById(id);
  const missionInput = el("mission-input");
  const prospectsInput = el("prospects-input");
  const apiKeyInput = el("api-key");
  const rankBtn = el("rank-btn");
  const loadExampleBtn = el("load-example");
  const exportBtn = el("export-csv");
  const statusMsg = el("status-msg");
  const exampleBanner = el("example-banner");
  const resultsPanel = el("results-panel");
  const resultsBody = el("results-body");

  let lastResults = [];
  let usingExample = false;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function tokenize(text) {
    return (text.toLowerCase().match(/[a-z']+/g) || []);
  }

  function missionKeywordGroups(missionText) {
    const words = tokenize(missionText).filter((w) => w.length > 2 && !STOPWORDS.has(w));
    const seenGroups = [];
    const seenKeys = new Set();
    for (const word of words) {
      const group = SYNONYM_LOOKUP.get(word) || [word];
      const key = group.join("|");
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        seenGroups.push(group);
      }
    }
    return seenGroups;
  }

  function splitSentences(text) {
    return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  }

  function termRegex(term) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z'])(${escaped})([^a-z']|$)`, "i");
  }

  function parseProspectBlocks(raw) {
    const normalized = raw.replace(/^[ \t]*-{3,}[ \t]*$/gm, "");
    const blocks = normalized
      .split(/\n\s*\n+/)
      .map((b) => b.trim())
      .filter(Boolean);
    return blocks.map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const name = lines[0] || "Unnamed prospect";
      const bio = lines.slice(1).join(" ");
      return { name, bio };
    });
  }

  function scoreProspect(prospect, keywordGroups) {
    const bio = prospect.bio || "";
    const sentences = splitSentences(bio);
    const matchedGroupKeys = new Set();
    const matchedSentenceInfo = [];

    for (const sentence of sentences) {
      let sentenceMatchedTerms = [];
      for (const group of keywordGroups) {
        for (const term of group) {
          if (termRegex(term).test(sentence)) {
            matchedGroupKeys.add(group.join("|"));
            sentenceMatchedTerms.push(term);
          }
        }
      }
      if (sentenceMatchedTerms.length > 0) {
        matchedSentenceInfo.push({ sentence, terms: [...new Set(sentenceMatchedTerms)] });
      }
    }

    const score = keywordGroups.length
      ? Math.round((matchedGroupKeys.size / keywordGroups.length) * 100)
      : 0;

    return { score, matchedSentenceInfo };
  }

  function highlightSentence(sentence, terms) {
    let html = escapeHtml(sentence);
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    for (const term of sortedTerms) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-zA-Z'])(${escapedTerm})([^a-zA-Z']|$)`, "gi");
      html = html.replace(re, (m, pre, mid, post) => `${pre}<mark>${mid}</mark>${post}`);
    }
    return html;
  }

  function templateDraft(prospect, missionText, topSentence) {
    const missionShort = missionText.trim().replace(/\s+/g, " ").slice(0, 140);
    if (!topSentence) {
      return `Hi ${prospect.name}, we're running a mission: "${missionShort}". We couldn't find a ` +
        `public statement of yours tied to this goal yet, so this is a cold intro rather than a ` +
        `matched pitch — happy to share more if it sounds like a fit.`;
    }
    return `Hi ${prospect.name}, I came across where you said: "${topSentence}". We're running a ` +
      `mission that lines up closely with that: "${missionShort}". Given what you've already said ` +
      `publicly, I'd love 15 minutes to see if there's a fit.`;
  }

  async function aiDraft(prospect, missionText, topSentence, apiKey) {
    const prompt = `You are drafting a short, warm, specific outreach paragraph (3-4 sentences, ` +
      `no greeting line, no signature) from a nonprofit prize organizer to a prospect. Mission: ` +
      `"${missionText.trim()}". Prospect name: ${prospect.name}. Quote matched from their public ` +
      `statements: "${topSentence || "(no direct quote found)"}". Reference the quote naturally if ` +
      `one is given, connect it to the mission, and ask for a short call. Keep it under 80 words.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!resp.ok) {
      throw new Error(`API error ${resp.status}`);
    }
    const data = await resp.json();
    const text = data?.content?.[0]?.text?.trim();
    if (!text) throw new Error("Empty AI response");
    return text;
  }

  function renderResults(results, { aiPending = false } = {}) {
    resultsPanel.hidden = false;
    exampleBanner.hidden = !usingExample;
    resultsBody.innerHTML = "";

    results.forEach((r, idx) => {
      const tr = document.createElement("tr");

      const evidenceHtml = r.matchedSentenceInfo.length
        ? r.matchedSentenceInfo
            .slice(0, 3)
            .map((m) => highlightSentence(m.sentence, m.terms))
            .join(" ")
        : `<span class="no-match">No matching sentence found</span>`;

      const draftLabel = r.draftSource === "ai" ? "AI-drafted" : "Template-generated";
      const draftText = r.draft || "Drafting…";

      tr.innerHTML = `
        <td data-label="Rank" class="rank-cell">#${idx + 1}</td>
        <td data-label="Name" class="name-cell">${escapeHtml(r.name)}</td>
        <td data-label="Score" class="score-cell">
          <span class="score-bar-wrap"><span class="score-bar" style="width:${r.score}%"></span></span>${r.score}%
        </td>
        <td data-label="Matched evidence" class="evidence-cell">${evidenceHtml}</td>
        <td data-label="Draft outreach" class="draft-cell">
          <span class="draft-label" data-draft-label>${draftLabel}</span>
          <div data-draft-text>${escapeHtml(draftText)}</div>
        </td>
      `;
      resultsBody.appendChild(tr);
    });
  }

  function updateDraftCell(index, text, source) {
    const row = resultsBody.children[index];
    if (!row) return;
    row.querySelector("[data-draft-label]").textContent =
      source === "ai" ? "AI-drafted" : "Template-generated";
    row.querySelector("[data-draft-text]").textContent = text;
  }

  async function handleRank() {
    const missionText = missionInput.value.trim();
    const prospects = parseProspectBlocks(prospectsInput.value);

    if (!missionText) {
      statusMsg.textContent = "Add a mission description first.";
      return;
    }
    if (prospects.length < 1) {
      statusMsg.textContent = "Add at least one prospect block.";
      return;
    }

    const keywordGroups = missionKeywordGroups(missionText);
    const apiKey = apiKeyInput.value.trim();

    const scored = prospects.map((p) => {
      const { score, matchedSentenceInfo } = scoreProspect(p, keywordGroups);
      const topSentence = matchedSentenceInfo[0]?.sentence || "";
      return {
        name: p.name,
        bio: p.bio,
        score,
        matchedSentenceInfo,
        draft: templateDraft(p, missionText, topSentence),
        draftSource: "template"
      };
    });

    scored.sort((a, b) => b.score - a.score);
    lastResults = scored;

    statusMsg.textContent = `Ranked ${scored.length} prospect${scored.length === 1 ? "" : "s"}.`;
    renderResults(scored);

    if (apiKey) {
      statusMsg.textContent = `Ranked ${scored.length} prospect(s). Drafting with your API key…`;
      for (let i = 0; i < scored.length; i++) {
        const r = scored[i];
        const topSentence = r.matchedSentenceInfo[0]?.sentence || "";
        try {
          const aiText = await aiDraft({ name: r.name }, missionText, topSentence, apiKey);
          r.draft = aiText;
          r.draftSource = "ai";
          updateDraftCell(i, aiText, "ai");
        } catch (err) {
          console.warn("AI draft failed, keeping template:", err.message);
        }
      }
      statusMsg.textContent = `Ranked ${scored.length} prospect(s).`;
    }
  }

  function loadExample() {
    missionInput.value = EXAMPLE_MISSION;
    prospectsInput.value = EXAMPLE_PROSPECTS_RAW;
    usingExample = true;
    exampleBanner.hidden = false;
    statusMsg.textContent = "Example loaded. Click Rank prospects to see it in action.";
  }

  function csvEscape(value) {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCsv() {
    if (!lastResults.length) {
      statusMsg.textContent = "Rank prospects first, then export.";
      return;
    }
    const rows = [["Name", "Score", "Matched evidence", "Draft"]];
    for (const r of lastResults) {
      const evidence = r.matchedSentenceInfo.length
        ? r.matchedSentenceInfo.slice(0, 3).map((m) => m.sentence).join(" ")
        : "No matching sentence found";
      rows.push([r.name, `${r.score}%`, evidence, r.draft]);
    }
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mission-match-board.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  rankBtn.addEventListener("click", () => {
    usingExample = usingExample && missionInput.value.trim() === EXAMPLE_MISSION;
    handleRank();
  });
  loadExampleBtn.addEventListener("click", loadExample);
  exportBtn.addEventListener("click", exportCsv);

  missionInput.addEventListener("input", () => {
    if (missionInput.value.trim() !== EXAMPLE_MISSION) usingExample = false;
  });
})();
