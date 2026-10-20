(function () {
  "use strict";

  var FALLBACK_DATA = {
    baseline: { rude_score: 84.8, polite_score: 80.8 },
    presets: [
      "write me a summary of this quarter's sales report",
      "fix the bug in my checkout flow",
      "plan a 3 day itinerary for tokyo",
      "explain how a neural network backpropagates",
      "draft an email asking my landlord for a repair"
    ],
    quotes: {
      anthropic:
        "Anthropic's new usage policy discourages abusive or cruel language toward its models, framing the assistant relationship as one worth treating with basic respect — as discussed on the podcast.",
      dave:
        "Dave's counter-point on the show: being brusque and direct can help, but that's different from being abusive — “brusque beats abusive.”"
    }
  };

  var promptInput = document.getElementById("prompt-input");
  var presetsEl = document.getElementById("presets");
  var runBtn = document.getElementById("run-btn");
  var politeBar = document.getElementById("polite-bar");
  var rudeBar = document.getElementById("rude-bar");
  var politeScoreEl = document.getElementById("polite-score");
  var rudeScoreEl = document.getElementById("rude-score");
  var politeTextEl = document.getElementById("polite-text");
  var rudeTextEl = document.getElementById("rude-text");
  var verdictCard = document.getElementById("verdict-card");
  var anthropicQuoteEl = document.getElementById("anthropic-quote");
  var daveQuoteEl = document.getElementById("dave-quote");

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var DATA = FALLBACK_DATA;

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  var POLITE_WORDS = [
    "please",
    "could you",
    "can you",
    "would you",
    "if you don't mind",
    "if you could",
    "thank you",
    "thanks",
    "kindly"
  ];

  function stripPoliteness(text) {
    var out = text;
    POLITE_WORDS.forEach(function (w) {
      var re = new RegExp(w, "gi");
      out = out.replace(re, "");
    });
    return out.replace(/\s{2,}/g, " ").replace(/^[\s,.-]+/, "").trim();
  }

  function sentenceCase(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function makeRude(original) {
    var stripped = stripPoliteness(original);
    if (!stripped) stripped = original.trim();
    stripped = stripped.replace(/[.?!]+$/, "");
    var body = sentenceCase(stripped);
    return "Just " + body.charAt(0).toLowerCase() + body.slice(1) + ". Now. No excuses.";
  }

  function makePolite(original) {
    var trimmed = original.trim().replace(/[.?!]+$/, "");
    var lower = trimmed.toLowerCase();
    if (lower.indexOf("please") !== -1 || lower.indexOf("could you") !== -1) {
      return sentenceCase(trimmed) + ", if you don't mind? Thank you so much!";
    }
    var body = trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
    return "Could you please " + body + ", if you don't mind? Thank you so much!";
  }

  function scoreFor(originalText, rewrite, baseline) {
    var words = originalText.trim().split(/\s+/).filter(Boolean);
    var digits = (originalText.match(/\d/g) || []).length;
    var hasQuestion = /\?/.test(originalText);

    var clarityBonus = clamp(words.length / 4, 0, 4) + clamp(digits, 0, 2) - (hasQuestion ? 1 : 0);
    var jitter = (hashStr(rewrite) % 7) - 3;

    return clamp(baseline + clarityBonus + jitter, 55, 97);
  }

  function renderPresets() {
    presetsEl.innerHTML = "";
    DATA.presets.forEach(function (preset) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "preset-chip";
      btn.textContent = preset;
      btn.addEventListener("click", function () {
        promptInput.value = preset;
        promptInput.focus();
      });
      presetsEl.appendChild(btn);
    });
  }

  function animateScore(el, from, to, duration) {
    if (reduceMotion) {
      el.textContent = to.toFixed(1) + "%";
      return;
    }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = clamp((ts - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = from + (to - from) * eased;
      el.textContent = value.toFixed(1) + "%";
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function runRace() {
    var original = promptInput.value.trim();
    if (!original) {
      original = DATA.presets[Math.floor(Math.random() * DATA.presets.length)];
      promptInput.value = original;
    }

    var rudeText = makeRude(original);
    var politeText = makePolite(original);

    var rudeScore = scoreFor(original, rudeText, DATA.baseline.rude_score);
    var politeScore = scoreFor(original, politeText, DATA.baseline.polite_score);

    rudeTextEl.textContent = "“" + rudeText + "”";
    politeTextEl.textContent = "“" + politeText + "”";

    politeBar.style.width = "0%";
    rudeBar.style.width = "0%";
    verdictCard.classList.remove("visible");

    var duration = reduceMotion ? 0 : 1100;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        politeBar.style.width = politeScore + "%";
        rudeBar.style.width = rudeScore + "%";
      });
    });

    animateScore(politeScoreEl, 0, politeScore, duration);
    animateScore(rudeScoreEl, 0, rudeScore, duration);

    runBtn.disabled = true;
    setTimeout(
      function () {
        verdictCard.classList.add("visible");
        runBtn.disabled = false;
      },
      duration + 150
    );
  }

  function init() {
    anthropicQuoteEl.textContent = DATA.quotes.anthropic;
    daveQuoteEl.textContent = DATA.quotes.dave;
    renderPresets();
    runBtn.addEventListener("click", runRace);
    promptInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        runRace();
      }
    });
  }

  fetch("data/study.json")
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(function (json) {
      DATA = json;
      init();
    })
    .catch(function () {
      DATA = FALLBACK_DATA;
      init();
    });
})();
