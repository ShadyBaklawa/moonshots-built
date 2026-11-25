(function () {
  "use strict";

  var MIN = 0.3;
  var MAX = 3.3;

  var THRESHOLDS = [
    { value: 0.99, cardId: "th-099", stepId: "step3" },
    { value: 0.91, cardId: "th-091", stepId: "step2" },
    { value: 0.76, cardId: "th-076", stepId: "step1" }
  ];

  var FALLBACK_WORDS = {
    sentence_prefix: "The researcher just discovered a new",
    sentence_suffix: "entirely.",
    candidates: [
      "law", "planet", "species", "material", "theorem",
      "particle", "element", "algorithm", "vaccine", "star",
      "enzyme", "isotope", "pattern", "galaxy", "compound",
      "molecule", "mineral", "virus", "protein", "signal"
    ]
  };

  var slider = document.getElementById("plexSlider");
  var valDisplay = document.getElementById("valDisplay");
  var countDisplay = document.getElementById("countDisplay");
  var ticksWrap = document.getElementById("ticks");
  var trackWrap = slider.closest(".slider-track-wrap");
  var sentenceEl = document.getElementById("sentence");
  var wordChipsEl = document.getElementById("wordChips");
  var focalPoint = document.getElementById("focalPoint");
  var fanSvg = document.getElementById("fanSvg");
  var fanStage = document.getElementById("fanStage");
  var toggleChartBtn = document.getElementById("toggleChart");
  var chartWrap = document.getElementById("chartWrap");

  var wordData = FALLBACK_WORDS;

  function percentFromBottom(value) {
    return ((value - MIN) / (MAX - MIN)) * 100;
  }

  function buildTicks() {
    ticksWrap.innerHTML = "";
    THRESHOLDS.forEach(function (t) {
      var pct = percentFromBottom(t.value);
      var tick = document.createElement("div");
      tick.className = "tick";
      tick.style.bottom = pct + "%";
      ticksWrap.appendChild(tick);
    });
  }

  function layoutStaircase() {
    var trackHeight = trackWrap.clientHeight;
    THRESHOLDS.forEach(function (t) {
      var step = document.getElementById(t.stepId);
      var pct = percentFromBottom(t.value) / 100;
      step.style.height = Math.max(4, pct * trackHeight) + "px";
    });
  }

  function updateThresholds(value) {
    THRESHOLDS.forEach(function (t) {
      var crossed = value <= t.value + 0.001;
      var card = document.getElementById(t.cardId);
      var step = document.getElementById(t.stepId);
      card.classList.toggle("active", crossed);
      step.classList.toggle("lit", crossed);
    });
  }

  function candidateCount(value) {
    var n = Math.round(Math.pow(2, value));
    n = Math.max(1, Math.min(n, wordData.candidates.length));
    return n;
  }

  function renderSentence() {
    sentenceEl.innerHTML =
      wordData.sentence_prefix +
      ' <span class="blank">_____</span> ' +
      wordData.sentence_suffix;
  }

  function renderWords(n) {
    wordChipsEl.innerHTML = "";
    wordData.candidates.slice(0, n).forEach(function (word) {
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = word;
      wordChipsEl.appendChild(chip);
    });
  }

  function drawFan() {
    fanSvg.innerHTML = "";
    var stageRect = fanStage.getBoundingClientRect();
    var focalRect = focalPoint.getBoundingClientRect();
    var fx = focalRect.left + focalRect.width / 2 - stageRect.left;
    var fy = focalRect.top + focalRect.height / 2 - stageRect.top;

    var chips = wordChipsEl.querySelectorAll(".chip");
    chips.forEach(function (chip) {
      var r = chip.getBoundingClientRect();
      var cx = r.left + r.width / 2 - stageRect.left;
      var cy = r.top - stageRect.top;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fx);
      line.setAttribute("y1", fy);
      line.setAttribute("x2", cx);
      line.setAttribute("y2", cy);
      fanSvg.appendChild(line);
    });
  }

  function update() {
    var value = parseFloat(slider.value);
    valDisplay.textContent = value.toFixed(2);
    updateThresholds(value);

    var n = candidateCount(value);
    countDisplay.textContent = n;
    renderWords(n);

    requestAnimationFrame(drawFan);
  }

  function init() {
    buildTicks();
    layoutStaircase();
    renderSentence();
    update();

    slider.addEventListener("input", update);
    window.addEventListener("resize", function () {
      layoutStaircase();
      requestAnimationFrame(drawFan);
    });

    toggleChartBtn.addEventListener("click", function () {
      chartWrap.classList.toggle("hidden");
      var expanded = !chartWrap.classList.contains("hidden");
      toggleChartBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      toggleChartBtn.textContent = expanded
        ? "Hide pretraining trend overlay (illustrative)"
        : "Show pretraining trend overlay (illustrative)";
    });
  }

  fetch("data/words.json")
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(function (json) {
      wordData = json;
    })
    .catch(function () {
      wordData = FALLBACK_WORDS;
    })
    .finally(function () {
      init();
    });
})();
