(function () {
  "use strict";

  // DEBT_2025 is verified, as stated on the podcast (EP #304, 01:08:24-01:09:37).
  // GDP_2025 is an illustrative starting baseline (not stated on the podcast), chosen so
  // the Anthropic preset's path reaches the verified $44T-by-2030 figure.
  var DEBT_2025 = 40;      // $ trillion
  var GDP_2025 = 30;       // $ trillion, illustrative
  var START_YEAR = 2025;
  var END_YEAR = 2040;
  var SPAN = END_YEAR - START_YEAR; // 15
  var YEARS = [];
  for (var y = START_YEAR; y <= END_YEAR; y++) YEARS.push(y);

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var gdpSlider = document.getElementById("gdpGrowth");
  var debtSlider = document.getElementById("debtGrowth");
  var cutSlider = document.getElementById("healthcareCut");
  var gdpVal = document.getElementById("gdpGrowthVal");
  var debtValLbl = document.getElementById("debtGrowthVal");
  var cutValLbl = document.getElementById("healthcareCutVal");
  var presetBtns = document.querySelectorAll(".preset-btn");
  var replayBtn = document.getElementById("replayBtn");

  var yearLabel = document.getElementById("yearLabel");
  var debtVal = document.getElementById("debtVal");
  var gdpValBig = document.getElementById("gdpVal");
  var ratioVal = document.getElementById("ratioVal");
  var gaugeArc = document.getElementById("gaugeArc");
  var needle = document.getElementById("needle");

  var GAUGE_ARC_LEN = Math.PI * 90; // semicircle, r=90
  gaugeArc.setAttribute("stroke-dasharray", GAUGE_ARC_LEN.toFixed(2));
  var GAUGE_MAX = 250; // % debt-to-GDP shown at full gauge sweep

  var presets = {
    historic: { gdp: 2.5, debt: 2.44, cut: 0 },
    anthropic: { gdp: 8.0, debt: 2.44, cut: 0 },
    elon: { gdp: 10.0, debt: 1.95, cut: 20 }
  };

  function computePath() {
    var gdpGrowth = parseFloat(gdpSlider.value) / 100;
    var debtGrowthRaw = parseFloat(debtSlider.value);
    var cut = parseFloat(cutSlider.value) / 100;
    var debtGrowth = debtGrowthRaw * (1 - cut);

    var debtPath = [];
    var gdpPath = [];
    var ratioPath = [];
    for (var t = 0; t <= SPAN; t++) {
      var debt = DEBT_2025 + debtGrowth * t;
      var gdp = GDP_2025 * Math.pow(1 + gdpGrowth, t);
      debtPath.push(debt);
      gdpPath.push(gdp);
      ratioPath.push((debt / gdp) * 100);
    }
    return { debtPath: debtPath, gdpPath: gdpPath, ratioPath: ratioPath };
  }

  function fmtMoney(v) {
    return "$" + v.toFixed(1) + "T";
  }

  function ratioColor(ratio) {
    if (ratio < 100) return "#3fe0b0";
    if (ratio < 150) return "#ffcf5c";
    if (ratio < 200) return "#ff9a4a";
    return "#ff5c6c";
  }

  var chart;
  function buildChart(path) {
    var ctx = document.getElementById("raceChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: YEARS.map(String),
        datasets: [
          {
            label: "Debt ($T)",
            data: path.debtPath,
            borderColor: "#ff5c6c",
            backgroundColor: "transparent",
            borderWidth: 3,
            pointRadius: 0,
            tension: 0
          },
          {
            label: "GDP ($T)",
            data: path.gdpPath,
            borderColor: "#3fe0b0",
            backgroundColor: "transparent",
            borderWidth: 3,
            pointRadius: 0,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { intersect: false },
        scales: {
          x: {
            ticks: { color: "#9aa5c0", maxTicksLimit: 8 },
            grid: { color: "#1a2032" }
          },
          y: {
            ticks: {
              color: "#9aa5c0",
              callback: function (v) { return "$" + v + "T"; }
            },
            grid: { color: "#1a2032" }
          }
        },
        plugins: {
          legend: {
            labels: { color: "#f5f7fb", font: { size: 11 } }
          },
          tooltip: { enabled: false }
        }
      },
      plugins: [playheadPlugin]
    });
  }

  var playheadPlugin = {
    id: "playheadLine",
    afterDatasetsDraw: function (c) {
      var frac = c.$playheadFrac;
      if (frac === undefined) return;
      var xScale = c.scales.x;
      var yScale = c.scales.y;
      var t = frac * SPAN;
      var i0 = Math.min(Math.floor(t), SPAN - 1 < 0 ? 0 : Math.floor(t));
      i0 = Math.max(0, Math.min(i0, SPAN));
      var i1 = Math.min(i0 + 1, SPAN);
      var local = t - i0;
      var x0 = xScale.getPixelForValue(i0);
      var x1 = xScale.getPixelForValue(i1);
      var x = x0 + (x1 - x0) * local;

      var ctx = c.ctx;
      ctx.save();
      ctx.strokeStyle = "rgba(245,247,251,0.55)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, c.chartArea.top);
      ctx.lineTo(x, c.chartArea.bottom);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.setLineDash([]);

      var debtPath = c.data.datasets[0].data;
      var gdpPath = c.data.datasets[1].data;
      var debtNow = debtPath[i0] + (debtPath[i1] - debtPath[i0]) * local;
      var gdpNow = gdpPath[i0] + (gdpPath[i1] - gdpPath[i0]) * local;

      ctx.fillStyle = "#ff5c6c";
      ctx.beginPath();
      ctx.arc(x, yScale.getPixelForValue(debtNow), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3fe0b0";
      ctx.beginPath();
      ctx.arc(x, yScale.getPixelForValue(gdpNow), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  function updateGauge(ratio) {
    var frac = Math.max(0, Math.min(1, ratio / GAUGE_MAX));
    var offset = GAUGE_ARC_LEN * (1 - frac);
    gaugeArc.setAttribute("stroke-dashoffset", offset.toFixed(2));
    gaugeArc.setAttribute("stroke", ratioColor(ratio));
    var angle = -90 + frac * 180;
    needle.setAttribute("transform", "rotate(" + angle.toFixed(1) + " 100 110)");
    ratioVal.textContent = Math.round(ratio) + "%";
    ratioVal.style.color = ratioColor(ratio);
  }

  function renderFrame(path, t) {
    var i0 = Math.max(0, Math.min(Math.floor(t), SPAN));
    var i1 = Math.min(i0 + 1, SPAN);
    var local = t - i0;
    var debt = path.debtPath[i0] + (path.debtPath[i1] - path.debtPath[i0]) * local;
    var gdp = path.gdpPath[i0] + (path.gdpPath[i1] - path.gdpPath[i0]) * local;
    var ratio = path.ratioPath[i0] + (path.ratioPath[i1] - path.ratioPath[i0]) * local;
    var year = Math.round(START_YEAR + t);

    yearLabel.textContent = String(year);
    debtVal.textContent = fmtMoney(debt);
    gdpValBig.textContent = fmtMoney(gdp);
    updateGauge(ratio);

    chart.$playheadFrac = t / SPAN;
    chart.draw();
  }

  var raceFrame = null;
  function runRace(path) {
    if (raceFrame) cancelAnimationFrame(raceFrame);

    if (reduceMotion) {
      renderFrame(path, SPAN);
      return;
    }

    var duration = 2600;
    var start = null;

    function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

    function step(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      var p = Math.min(1, elapsed / duration);
      var t = ease(p) * SPAN;
      renderFrame(path, t);
      if (p < 1) {
        raceFrame = requestAnimationFrame(step);
      } else {
        raceFrame = null;
      }
    }
    raceFrame = requestAnimationFrame(step);
  }

  function updateChartData(path) {
    chart.data.datasets[0].data = path.debtPath;
    chart.data.datasets[1].data = path.gdpPath;
    chart.update("none");
  }

  function syncLabels() {
    gdpVal.textContent = parseFloat(gdpSlider.value).toFixed(1) + "%";
    debtValLbl.textContent = "$" + parseFloat(debtSlider.value).toFixed(2) + "T";
    cutValLbl.textContent = Math.round(parseFloat(cutSlider.value)) + "%";
  }

  function clearPresetActive() {
    presetBtns.forEach(function (b) { b.classList.remove("active"); });
  }

  function onSliderChange(replay) {
    syncLabels();
    var path = computePath();
    updateChartData(path);
    if (replay) {
      runRace(path);
    } else {
      renderFrame(path, SPAN);
    }
  }

  gdpSlider.addEventListener("input", function () { clearPresetActive(); onSliderChange(false); });
  debtSlider.addEventListener("input", function () { clearPresetActive(); onSliderChange(false); });
  cutSlider.addEventListener("input", function () { clearPresetActive(); onSliderChange(false); });

  presetBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-preset");
      var p = presets[key];
      if (!p) return;
      gdpSlider.value = p.gdp;
      debtSlider.value = p.debt;
      cutSlider.value = p.cut;
      clearPresetActive();
      btn.classList.add("active");
      syncLabels();
      var path = computePath();
      updateChartData(path);
      runRace(path);
    });
  });

  replayBtn.addEventListener("click", function () {
    var path = computePath();
    runRace(path);
  });

  // Init
  syncLabels();
  var initialPath = computePath();
  buildChart(initialPath);
  document.querySelector('.preset-btn[data-preset="historic"]').classList.add("active");
  renderFrame(initialPath, 0);
  if (!reduceMotion) {
    setTimeout(function () { runRace(initialPath); }, 400);
  } else {
    renderFrame(initialPath, SPAN);
  }
})();
