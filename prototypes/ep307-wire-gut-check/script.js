(function () {
  "use strict";

  var requestText = document.getElementById("request-text");
  var nameOnFile = document.getElementById("name-on-file");
  var analyzeBtn = document.getElementById("analyze-btn");
  var clearBtn = document.getElementById("clear-btn");
  var exampleButtonsEl = document.getElementById("example-buttons");
  var resultsPanel = document.getElementById("results-panel");
  var exampleBadge = document.getElementById("example-badge");
  var gaugeMarker = document.getElementById("gauge-marker");
  var scoreNumber = document.getElementById("score-number");
  var scoreLevel = document.getElementById("score-level");
  var highlightedText = document.getElementById("highlighted-text");
  var matchedList = document.getElementById("matched-list");
  var noMatches = document.getElementById("no-matches");
  var scriptBox = document.getElementById("script-box");
  var copyScriptBtn = document.getElementById("copy-script-btn");
  var apiKeyInput = document.getElementById("api-key");
  var aiBtn = document.getElementById("ai-btn");
  var aiStatus = document.getElementById("ai-status");
  var aiResult = document.getElementById("ai-result");

  var currentExampleTitle = null;

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildCategoryRegex(phrases) {
    return new RegExp(phrases.map(escapeRegex).join("|"), "gi");
  }

  function findMatches(text) {
    var raw = [];
    window.WGC_RULES.forEach(function (rule) {
      var re = buildCategoryRegex(rule.phrases);
      var m;
      while ((m = re.exec(text))) {
        raw.push({
          start: m.index,
          end: m.index + m[0].length,
          categoryId: rule.id,
          label: rule.label,
          weight: rule.weight
        });
        if (m[0].length === 0) re.lastIndex++;
      }
    });
    raw.sort(function (a, b) {
      return a.start - b.start;
    });
    var filtered = [];
    var lastEnd = -1;
    raw.forEach(function (m) {
      if (m.start >= lastEnd) {
        filtered.push(m);
        lastEnd = m.end;
      }
    });
    return filtered;
  }

  function renderHighlighted(container, text, matches) {
    container.innerHTML = "";
    var idx = 0;
    matches.forEach(function (m) {
      if (m.start > idx) {
        container.appendChild(document.createTextNode(text.slice(idx, m.start)));
      }
      var mark = document.createElement("mark");
      mark.className = "flag flag-" + m.categoryId;
      mark.textContent = text.slice(m.start, m.end);
      mark.title = m.label;
      container.appendChild(mark);
      idx = m.end;
    });
    if (idx < text.length) {
      container.appendChild(document.createTextNode(text.slice(idx)));
    }
  }

  function computeScore(matches) {
    var seen = {};
    var score = 0;
    matches.forEach(function (m) {
      if (!seen[m.categoryId]) {
        seen[m.categoryId] = true;
        score += m.weight;
      }
    });
    score = Math.min(score, 100);
    var level = "Low risk";
    var levelClass = "low";
    if (score >= 60) {
      level = "High risk";
      levelClass = "high";
    } else if (score >= 25) {
      level = "Medium risk";
      levelClass = "medium";
    }
    return { score: score, level: level, levelClass: levelClass };
  }

  function renderMatchedList(matches) {
    matchedList.innerHTML = "";
    if (matches.length === 0) {
      noMatches.hidden = false;
      return;
    }
    noMatches.hidden = true;
    matches.forEach(function (m) {
      var li = document.createElement("li");
      var ruleName = document.createElement("span");
      ruleName.className = "rule-name";
      ruleName.textContent = m.label;
      var phrase = document.createElement("span");
      phrase.className = "matched-phrase";
      phrase.textContent = '— matched "' + m.phraseText + '"';
      li.appendChild(ruleName);
      li.appendChild(phrase);
      matchedList.appendChild(li);
    });
  }

  function buildScript(who) {
    var target = who && who.trim() ? who.trim() : "the person this claims to be from";
    return (
      "Don't reply to this message, and don't call any phone number it gave you.\n\n" +
      "Hang up or set it aside, then call " + target + " using the number you already have on file for them - never a number from this message.\n\n" +
      'Ask them directly: "Did you just ask me to send a payment or change any bank details?"\n\n' +
      "If they say no, or you can't reach them that way, treat this as fraud: send nothing, and tell your manager or security team right now."
    );
  }

  function runAnalysis(text, who, exampleTitle) {
    currentExampleTitle = exampleTitle || null;
    var matches = findMatches(text).map(function (m) {
      return Object.assign({}, m, { phraseText: text.slice(m.start, m.end) });
    });

    resultsPanel.hidden = false;

    if (currentExampleTitle) {
      exampleBadge.hidden = false;
      exampleBadge.textContent = "Example: " + currentExampleTitle;
    } else {
      exampleBadge.hidden = true;
    }

    var result = computeScore(matches);
    scoreNumber.textContent = String(result.score);
    scoreLevel.textContent = result.level;
    scoreLevel.className = "score-level " + result.levelClass;
    gaugeMarker.style.left = result.score + "%";

    renderHighlighted(highlightedText, text, matches);
    renderMatchedList(matches);

    scriptBox.textContent = buildScript(who);

    aiStatus.textContent = "";
    aiResult.hidden = true;
    aiResult.textContent = "";

    resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function populateExampleButtons() {
    window.WGC_SAMPLES.forEach(function (sample) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "example-btn";
      btn.textContent = sample.title;
      btn.addEventListener("click", function () {
        requestText.value = sample.text;
        runAnalysis(sample.text, nameOnFile.value, sample.title);
      });
      exampleButtonsEl.appendChild(btn);
    });
  }

  analyzeBtn.addEventListener("click", function () {
    var text = requestText.value.trim();
    if (!text) {
      requestText.focus();
      return;
    }
    runAnalysis(text, nameOnFile.value, null);
  });

  clearBtn.addEventListener("click", function () {
    requestText.value = "";
    nameOnFile.value = "";
    resultsPanel.hidden = true;
    currentExampleTitle = null;
    requestText.focus();
  });

  requestText.addEventListener("input", function () {
    currentExampleTitle = null;
  });

  copyScriptBtn.addEventListener("click", function () {
    var text = scriptBox.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          copyScriptBtn.textContent = "Copied";
          setTimeout(function () {
            copyScriptBtn.textContent = "Copy script";
          }, 1500);
        },
        function () {
          copyScriptBtn.textContent = "Couldn't copy";
        }
      );
    }
  });

  aiBtn.addEventListener("click", function () {
    var key = apiKeyInput.value.trim();
    var text = requestText.value.trim();
    aiResult.hidden = true;
    aiResult.textContent = "";
    if (!key) {
      aiStatus.textContent = "Paste your own Anthropic API key above to use this, or skip it - the check above already works without one.";
      return;
    }
    if (!text) {
      aiStatus.textContent = "Paste a request and run the check above first.";
      return;
    }
    aiStatus.textContent = "Asking the model...";
    aiBtn.disabled = true;

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content:
              "You are helping a small company's finance clerk sanity-check a payment request for fraud. " +
              "In under 120 words and plain English, point out anything suspicious about urgency, secrecy, " +
              "changed payment details, an unusual contact channel, or pressure from authority. " +
              "If it looks routine, say so plainly.\n\nText:\n\"\"\"\n" + text + "\n\"\"\""
          }
        ]
      })
    })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("request failed (" + res.status + ")");
        }
        return res.json();
      })
      .then(function (data) {
        var out = data && data.content && data.content[0] && data.content[0].text;
        aiStatus.textContent = "AI analysis (optional add-on, not verified):";
        aiResult.hidden = false;
        aiResult.textContent = out || "No response text came back.";
      })
      .catch(function (err) {
        aiStatus.textContent =
          "Couldn't reach the AI (" + err.message + "). Your key wasn't saved anywhere - the check above still stands on its own.";
      })
      .finally(function () {
        aiBtn.disabled = false;
      });
  });

  populateExampleButtons();
})();
