(function () {
  "use strict";

  var TRIMS = {
    performance: { zeroSixty: 3.1, topSpeed: 155, thrusters: false, upsideDown: false },
    thrust:      { zeroSixty: 1.6, topSpeed: 230, thrusters: true,  upsideDown: false },
    rocket:      { zeroSixty: 0.6, topSpeed: 236, thrusters: true,  upsideDown: true },
    custom:      { zeroSixty: 1.6, topSpeed: 230, thrusters: true,  upsideDown: true }
  };

  var BASE_PREMIUM = 6500;
  var GAUGE_MAX = 7; // calibrates where "100% risk" sits
  var ARC_LENGTH = 298; // approx length of the semicircular track path

  var state = { trim: "rocket" };

  var els = {
    trimBtns: Array.prototype.slice.call(document.querySelectorAll(".trim-btn")),
    customFields: document.getElementById("customFields"),
    zeroSixty: document.getElementById("zeroSixty"),
    zeroSixtyVal: document.getElementById("zeroSixtyVal"),
    topSpeed: document.getElementById("topSpeed"),
    topSpeedVal: document.getElementById("topSpeedVal"),
    thrusters: document.getElementById("thrusters"),
    upsideDown: document.getElementById("upsideDown"),
    commute: document.getElementById("commute"),
    gaugeWrap: document.querySelector(".gauge-wrap"),
    gaugeFill: document.getElementById("gaugeFill"),
    gaugeNeedle: document.getElementById("gaugeNeedle"),
    gaugeLabel: document.getElementById("gaugeLabel"),
    quoteNumber: document.getElementById("quoteNumber"),
    quoteNote: document.getElementById("quoteNote"),
    exclusions: document.getElementById("exclusions")
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function currentSpecs() {
    if (state.trim === "custom") {
      return {
        zeroSixty: parseFloat(els.zeroSixty.value),
        topSpeed: parseFloat(els.topSpeed.value),
        thrusters: els.thrusters.checked,
        upsideDown: els.upsideDown.checked,
        commute: els.commute.checked
      };
    }
    var preset = TRIMS[state.trim];
    return {
      zeroSixty: preset.zeroSixty,
      topSpeed: preset.topSpeed,
      thrusters: els.thrusters.checked,
      upsideDown: els.upsideDown.checked,
      commute: els.commute.checked
    };
  }

  function computeQuote(specs) {
    var speedFactor = specs.topSpeed / 50;
    var zeroSixtyFactor = 10 / Math.max(specs.zeroSixty, 0.1);
    var score = speedFactor * 0.15 + zeroSixtyFactor * 0.25;
    var toggleMult = 1;
    if (specs.thrusters) toggleMult *= 1.8;
    if (specs.upsideDown) toggleMult *= 2.2;
    var finalScore = score * toggleMult;
    var commuteMult = specs.commute ? 1.3 : 1;
    var premium = BASE_PREMIUM * (1 + finalScore) * commuteMult;
    var riskPercent = (finalScore / GAUGE_MAX) * 100;
    return { premium: premium, riskPercent: riskPercent, finalScore: finalScore };
  }

  function buildExclusions(specs, result) {
    var items = [
      "Voids coverage entirely if the vehicle is sold, resold, or re-entered after orbital insertion.",
      "Claims must be filed before re-entry; our adjusters do not do spacewalks."
    ];
    if (specs.thrusters) {
      items.unshift("Voids coverage if thrusters are engaged above 2G lateral or vertical acceleration.");
    }
    if (specs.upsideDown) {
      items.unshift("Upside-down flight is excluded unless pre-approved in writing by Underwriting and a licensed priest.");
    }
    if (specs.zeroSixty <= 1) {
      items.push("0&ndash;60 times under one second require a signed waiver from your next of kin.");
    }
    if (specs.topSpeed >= 200) {
      items.push("High-velocity ground contact (“landing”) is not covered under any circumstances.");
    }
    if (specs.commute) {
      items.push("Daily commuting via levitation voids any homeowners' association coverage.");
    }
    if (result.riskPercent >= 100) {
      items.unshift("This configuration has been declared uninsurable by seventeen separate actuaries, one of whom quit.");
    }
    return items;
  }

  var tickHandle = null;
  function animateNumber(el, from, to, duration) {
    if (tickHandle) cancelAnimationFrame(tickHandle);
    var start = performance.now();
    function frame(now) {
      var t = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var value = from + (to - from) * eased;
      el.textContent = "$" + Math.round(value).toLocaleString("en-US") + " / yr";
      if (t < 1) {
        tickHandle = requestAnimationFrame(frame);
      }
    }
    tickHandle = requestAnimationFrame(frame);
  }

  var lastPremium = 0;

  function render() {
    var specs = currentSpecs();
    var result = computeQuote(specs);

    var fillPercent = clamp(result.riskPercent, 0, 100);
    var offset = ARC_LENGTH * (1 - fillPercent / 100);
    els.gaugeFill.style.strokeDashoffset = String(offset);

    var fillColor = "#3ddc84";
    if (result.riskPercent >= 100) fillColor = "#ff2d4e";
    else if (result.riskPercent >= 60) fillColor = "#ff6a2b";
    else if (result.riskPercent >= 30) fillColor = "#ffcc33";
    els.gaugeFill.style.stroke = fillColor;

    var needlePercent = clamp(result.riskPercent, 0, 140);
    var rotation = (needlePercent / 100) * 180 - 90;
    els.gaugeNeedle.style.transform = "rotate(" + rotation + "deg)";

    var broken = result.riskPercent >= 100;
    els.gaugeWrap.classList.toggle("broken", broken);
    els.gaugeLabel.textContent = broken ? "RISK: OFF THE CHARTS" : "UNDERWRITING RISK";

    animateNumber(els.quoteNumber, lastPremium, result.premium, 600);
    lastPremium = result.premium;

    els.quoteNote.textContent = broken
      ? "Our gauge cannot display this quote. Neither can our actuaries."
      : "Recalculated live. Entirely fictional. Please do not call your real insurer.";

    var exclusions = buildExclusions(specs, result);
    els.exclusions.innerHTML = exclusions.map(function (text) {
      return "<li>" + text + "</li>";
    }).join("");
  }

  function selectTrim(trim) {
    state.trim = trim;
    els.trimBtns.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.trim === trim);
    });
    els.customFields.hidden = trim !== "custom";

    if (trim !== "custom") {
      var preset = TRIMS[trim];
      els.zeroSixty.value = preset.zeroSixty;
      els.topSpeed.value = preset.topSpeed;
      els.thrusters.checked = preset.thrusters;
      els.upsideDown.checked = preset.upsideDown;
      els.zeroSixtyVal.textContent = preset.zeroSixty + "s";
      els.topSpeedVal.textContent = preset.topSpeed + " mph";
    }
    render();
  }

  els.trimBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectTrim(btn.dataset.trim);
    });
  });

  els.zeroSixty.addEventListener("input", function () {
    els.zeroSixtyVal.textContent = parseFloat(els.zeroSixty.value).toFixed(1) + "s";
    render();
  });

  els.topSpeed.addEventListener("input", function () {
    els.topSpeedVal.textContent = els.topSpeed.value + " mph";
    render();
  });

  [els.thrusters, els.upsideDown, els.commute].forEach(function (input) {
    input.addEventListener("change", render);
  });

  selectTrim("rocket");
})();
