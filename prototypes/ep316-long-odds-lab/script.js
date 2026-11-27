(function () {
  "use strict";

  var popSlider = document.getElementById("popSlider");
  var ceoSlider = document.getElementById("ceoSlider");
  var nSlider = document.getElementById("nSlider");

  var popSliderVal = document.getElementById("popSliderVal");
  var ceoSliderVal = document.getElementById("ceoSliderVal");
  var nSliderVal = document.getElementById("nSliderVal");

  var popBar = document.getElementById("popBar");
  var ceoBar = document.getElementById("ceoBar");
  var popValueLabel = document.getElementById("popValueLabel");
  var ceoValueLabel = document.getElementById("ceoValueLabel");

  var repRatioValue = document.getElementById("repRatioValue");
  var repRatioRange = document.getElementById("repRatioRange");
  var oddsRatioValue = document.getElementById("oddsRatioValue");
  var oddsRatioRange = document.getElementById("oddsRatioRange");

  var repBand = document.getElementById("repBand");
  var repPoint = document.getElementById("repPoint");
  var repTarget = document.getElementById("repTarget");
  var oddsBand = document.getElementById("oddsBand");
  var oddsPoint = document.getElementById("oddsPoint");
  var oddsTarget = document.getElementById("oddsTarget");

  var nEcho = document.getElementById("nEcho");
  var perCeoPct = document.getElementById("perCeoPct");
  var banner = document.getElementById("noBaseRateBanner");
  var presetButtons = document.querySelectorAll(".preset");

  var REP_SCALE_MAX = 20;
  var ODDS_SCALE_MAX = 30;

  var currentTarget = null; // { value, label }

  function wilsonInterval(phat, n, z) {
    z = z || 1.96;
    var denom = 1 + (z * z) / n;
    var center = phat + (z * z) / (2 * n);
    var adj = z * Math.sqrt((phat * (1 - phat)) / n + (z * z) / (4 * n * n));
    var lo = (center - adj) / denom;
    var hi = (center + adj) / denom;
    if (lo < 0) lo = 0;
    if (hi > 1) hi = 1;
    return [lo, hi];
  }

  function oddsRatioFn(ceo, pop) {
    var ceoOdds = ceo / (1 - ceo);
    var popOdds = pop / (1 - pop);
    return ceoOdds / popOdds;
  }

  function fmtX(v) {
    if (!isFinite(v)) return "—";
    return v.toFixed(v >= 10 ? 1 : 2) + "x";
  }

  function placeOnScale(trackEl, value, max) {
    var pct = Math.max(0, Math.min(100, (value / max) * 100));
    return pct;
  }

  function render() {
    var popPct = parseFloat(popSlider.value);
    var ceoPct = parseFloat(ceoSlider.value);
    var n = parseInt(nSlider.value, 10);

    var pop = popPct / 100;
    var ceo = ceoPct / 100;

    popSliderVal.textContent = popPct + "%";
    ceoSliderVal.textContent = ceoPct + "%";
    nSliderVal.textContent = n;
    nEcho.textContent = n;
    perCeoPct.textContent = (100 / n).toFixed(1);

    popBar.style.width = popPct + "%";
    ceoBar.style.width = ceoPct + "%";
    popValueLabel.textContent = popPct + "%";
    ceoValueLabel.textContent = ceoPct + "%";

    var rep = ceo / pop;
    var odds = oddsRatioFn(ceo, pop);

    var ci = wilsonInterval(ceo, n);
    var ceoLo = ci[0];
    var ceoHi = ci[1];

    var repLo = ceoLo / pop;
    var repHi = ceoHi / pop;

    var oddsLo = oddsRatioFn(Math.max(ceoLo, 0.0001), pop);
    var oddsHi = oddsRatioFn(Math.min(ceoHi, 0.9999), pop);

    repRatioValue.textContent = fmtX(rep);
    repRatioRange.textContent =
      "range at this sample size: " + fmtX(repLo) + " – " + fmtX(repHi);

    oddsRatioValue.textContent = fmtX(odds);
    oddsRatioRange.textContent =
      "range at this sample size: " + fmtX(oddsLo) + " – " + fmtX(oddsHi);

    // representation scale
    var repLoPct = placeOnScale(repBand, repLo, REP_SCALE_MAX);
    var repHiPct = placeOnScale(repBand, repHi, REP_SCALE_MAX);
    repBand.style.left = repLoPct + "%";
    repBand.style.width = Math.max(1, repHiPct - repLoPct) + "%";
    repPoint.style.left = placeOnScale(repPoint, rep, REP_SCALE_MAX) + "%";

    // odds scale
    var oddsLoPct = placeOnScale(oddsBand, oddsLo, ODDS_SCALE_MAX);
    var oddsHiPct = placeOnScale(oddsBand, oddsHi, ODDS_SCALE_MAX);
    oddsBand.style.left = oddsLoPct + "%";
    oddsBand.style.width = Math.max(1, oddsHiPct - oddsLoPct) + "%";
    oddsPoint.style.left = placeOnScale(oddsPoint, odds, ODDS_SCALE_MAX) + "%";

    if (currentTarget) {
      repTarget.classList.remove("hidden");
      oddsTarget.classList.remove("hidden");
      repTarget.style.left = placeOnScale(repTarget, currentTarget.value, REP_SCALE_MAX) + "%";
      oddsTarget.style.left = placeOnScale(oddsTarget, currentTarget.value, ODDS_SCALE_MAX) + "%";
      repTarget.setAttribute("data-label", currentTarget.label);
      oddsTarget.setAttribute("data-label", currentTarget.label);
    } else {
      repTarget.classList.add("hidden");
      oddsTarget.classList.add("hidden");
    }
  }

  function setActivePreset(name) {
    presetButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.preset === name);
    });
  }

  function showBanner(text) {
    if (!text) {
      banner.classList.add("hidden");
      banner.textContent = "";
      return;
    }
    banner.textContent = text;
    banner.classList.remove("hidden");
  }

  function applyPreset(name) {
    setActivePreset(name);
    if (name === "foreign") {
      popSlider.value = 14;
      ceoSlider.value = 60;
      currentTarget = { value: 8, label: "episode claim: 8x" };
      showBanner(null);
    } else if (name === "dropout") {
      currentTarget = { value: 3, label: "claimed: 3x" };
      showBanner(
        "Dropout multiplier — claimed on show, base rates not given: the episode says college dropouts are 3x more likely to be a top CEO, but gave no population share or CEO-group share to compute that from. Drag the sliders below to find a combination that would produce a 3x ratio yourself."
      );
    } else if (name === "adopted") {
      currentTarget = { value: 10, label: "claimed: 10x" };
      showBanner(
        "Adopted multiplier — claimed on show, base rates not given: the episode says adoptees are 10x more likely to be a top CEO, but gave no population share or CEO-group share to compute that from. Drag the sliders below to find a combination that would produce a 10x ratio yourself."
      );
    }
    render();
  }

  presetButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyPreset(btn.dataset.preset);
    });
  });

  [popSlider, ceoSlider, nSlider].forEach(function (el) {
    el.addEventListener("input", render);
  });

  applyPreset("foreign");
})();
