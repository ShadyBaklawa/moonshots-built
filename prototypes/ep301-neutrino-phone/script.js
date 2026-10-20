(function () {
  "use strict";

  var CITIES = [
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Beijing", lat: 39.9042, lon: 116.4074 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "São Paulo", lat: -23.5505, lon: -46.6333 },
    { name: "Moscow", lat: 55.7558, lon: 37.6173 },
    { name: "Cairo", lat: 30.0444, lon: 31.2357 },
    { name: "Lagos", lat: 6.5244, lon: 3.3792 },
    { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Dubai", lat: 25.2048, lon: 55.2708 },
    { name: "Mexico City", lat: 19.4326, lon: -99.1332 },
    { name: "Johannesburg", lat: -26.2041, lon: 28.0473 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "Buenos Aires", lat: -34.6037, lon: -58.3816 },
    { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
    { name: "Nairobi", lat: -1.2921, lon: 36.8219 },
    { name: "Auckland", lat: -36.8485, lon: 174.7633 },
    { name: "Reykjavik", lat: 64.1466, lon: -21.9426 },
    { name: "Honolulu", lat: 21.3069, lon: -157.8583 }
  ];

  var EARTH_RADIUS_KM = 6371;
  var LIGHT_SPEED_KM_S = 299792.458;
  var CX = 200, CY = 190, R_PX = 150;
  var ANIM_MS = 2600;

  var cityASelect = document.getElementById("cityA");
  var cityBSelect = document.getElementById("cityB");
  var fireBtn = document.getElementById("fire");
  var swapBtn = document.getElementById("swap");

  CITIES.forEach(function (city, i) {
    var optA = document.createElement("option");
    optA.value = i;
    optA.textContent = city.name;
    cityASelect.appendChild(optA);

    var optB = document.createElement("option");
    optB.value = i;
    optB.textContent = city.name;
    cityBSelect.appendChild(optB);
  });
  cityASelect.value = 0; // New York
  cityBSelect.value = 1; // London

  function toRad(deg) { return (deg * Math.PI) / 180; }

  function centralAngle(a, b) {
    var phi1 = toRad(a.lat), phi2 = toRad(b.lat);
    var dPhi = toRad(b.lat - a.lat);
    var dLambda = toRad(b.lon - a.lon);
    var s = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  function fmtKm(km) {
    return Math.round(km).toLocaleString() + " km";
  }

  function fmtMs(ms) {
    if (ms < 1) return (ms * 1000).toFixed(1) + " µs";
    return ms.toFixed(2) + " ms";
  }

  function pointOnCircle(angle) {
    return {
      x: CX + R_PX * Math.cos(angle),
      y: CY + R_PX * Math.sin(angle)
    };
  }

  var arcPath = document.getElementById("arcPath");
  var chordPath = document.getElementById("chordPath");
  var pointA = document.getElementById("pointA");
  var pointB = document.getElementById("pointB");
  var beamSurface = document.getElementById("beamSurface");
  var beamCore = document.getElementById("beamCore");

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rafId = null;
  var current = null;

  function labelAt(group, pt, angle, text) {
    group.querySelector("circle").setAttribute("cx", pt.x);
    group.querySelector("circle").setAttribute("cy", pt.y);
    var label = group.querySelector("text");
    var dx = Math.cos(angle) * 16;
    var dy = Math.sin(angle) * 16;
    var anchor = dx > 4 ? "start" : dx < -4 ? "end" : "middle";
    label.setAttribute("x", pt.x + dx);
    label.setAttribute("y", pt.y + dy + 4);
    label.setAttribute("text-anchor", anchor);
    label.textContent = text;
  }

  function render() {
    var a = CITIES[Number(cityASelect.value)];
    var b = CITIES[Number(cityBSelect.value)];

    var theta = centralAngle(a, b);
    var arcDistKm = EARTH_RADIUS_KM * theta;
    var chordDistKm = 2 * EARTH_RADIUS_KM * Math.sin(theta / 2);

    var arcTimeMs = (arcDistKm / LIGHT_SPEED_KM_S) * 1000;
    var chordTimeMs = (chordDistKm / LIGHT_SPEED_KM_S) * 1000;
    var savedMs = arcTimeMs - chordTimeMs;
    var savedPct = arcTimeMs > 0 ? (savedMs / arcTimeMs) * 100 : 0;

    var angleA = -Math.PI / 2;
    var angleB = angleA + theta;
    var ptA = pointOnCircle(angleA);
    var ptB = pointOnCircle(angleB);

    arcPath.setAttribute("d",
      "M " + ptA.x + " " + ptA.y +
      " A " + R_PX + " " + R_PX + " 0 0 1 " + ptB.x + " " + ptB.y);
    chordPath.setAttribute("d",
      "M " + ptA.x + " " + ptA.y + " L " + ptB.x + " " + ptB.y);

    labelAt(pointA, ptA, angleA, a.name);
    labelAt(pointB, ptB, angleB, b.name);

    document.getElementById("surfaceDist").textContent = fmtKm(arcDistKm);
    document.getElementById("surfaceTime").textContent = fmtMs(arcTimeMs);
    document.getElementById("coreDist").textContent = fmtKm(chordDistKm);
    document.getElementById("coreTime").textContent = fmtMs(chordTimeMs);
    document.getElementById("savedTime").textContent = fmtMs(savedMs);
    document.getElementById("savedPct").textContent =
      savedPct.toFixed(1) + "% faster through the core";
    document.getElementById("slowFactor").textContent =
      Math.round(ANIM_MS / Math.max(arcTimeMs, 0.001)).toLocaleString();

    current = {
      angleA: angleA, angleB: angleB, theta: theta,
      ptA: ptA, ptB: ptB,
      arcDurationMs: ANIM_MS,
      chordDurationMs: ANIM_MS * (chordDistKm / arcDistKm)
    };

    beamSurface.setAttribute("cx", ptA.x);
    beamSurface.setAttribute("cy", ptA.y);
    beamCore.setAttribute("cx", ptA.x);
    beamCore.setAttribute("cy", ptA.y);
  }

  function runRace() {
    if (!current) return;
    if (rafId) cancelAnimationFrame(rafId);

    if (reduceMotion) {
      beamSurface.setAttribute("cx", current.ptB.x);
      beamSurface.setAttribute("cy", current.ptB.y);
      beamCore.setAttribute("cx", current.ptB.x);
      beamCore.setAttribute("cy", current.ptB.y);
      return;
    }

    var start = performance.now();
    var c = current;

    function step(now) {
      var t = now - start;

      var ta = Math.min(t / c.arcDurationMs, 1);
      var angleNow = c.angleA + (c.angleB - c.angleA) * easeInOut(ta);
      var ps = pointOnCircle(angleNow);
      beamSurface.setAttribute("cx", ps.x);
      beamSurface.setAttribute("cy", ps.y);

      var tc = Math.min(t / c.chordDurationMs, 1);
      var ec = easeInOut(tc);
      var pcX = c.ptA.x + (c.ptB.x - c.ptA.x) * ec;
      var pcY = c.ptA.y + (c.ptB.y - c.ptA.y) * ec;
      beamCore.setAttribute("cx", pcX);
      beamCore.setAttribute("cy", pcY);

      if (ta < 1 || tc < 1) {
        rafId = requestAnimationFrame(step);
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function resetBeams() {
    if (!current) return;
    beamSurface.setAttribute("cx", current.ptA.x);
    beamSurface.setAttribute("cy", current.ptA.y);
    beamCore.setAttribute("cx", current.ptA.x);
    beamCore.setAttribute("cy", current.ptA.y);
  }

  cityASelect.addEventListener("change", function () { render(); resetBeams(); });
  cityBSelect.addEventListener("change", function () { render(); resetBeams(); });
  swapBtn.addEventListener("click", function () {
    var tmp = cityASelect.value;
    cityASelect.value = cityBSelect.value;
    cityBSelect.value = tmp;
    render();
    resetBeams();
  });
  fireBtn.addEventListener("click", runRace);

  render();
  resetBeams();
})();
