(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const LEG_DURATION_MS = prefersReducedMotion ? 500 : 4500;
  const PAUSE_MS = prefersReducedMotion ? 150 : 700;

  const sendBtn = document.getElementById("send-btn");
  const countdownWrap = document.getElementById("countdown-wrap");
  const legLabel = document.getElementById("leg-label");
  const countdownEl = document.getElementById("countdown");
  const statusEl = document.getElementById("status");
  const pulse = document.getElementById("pulse");

  function formatCountdown(hoursRemaining) {
    const totalSeconds = Math.max(0, Math.round(hoursRemaining * 3600));
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  function animateLeg(fromPct, toPct, label, onDone) {
    legLabel.textContent = label;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / LEG_DURATION_MS);
      const currentPct = fromPct + (toPct - fromPct) * progress;
      pulse.style.left = `${currentPct * 100}%`;
      countdownEl.textContent = formatCountdown(24 * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  function runRoundTrip() {
    sendBtn.disabled = true;
    countdownWrap.hidden = false;
    pulse.hidden = false;
    pulse.style.left = "0%";
    statusEl.textContent =
      "Command sent from the Deep Space Network. Traveling at light speed, time‑compressed here.";

    animateLeg(0, 1, "Outbound", () => {
      statusEl.textContent =
        "Command received by Voyager 1 (simulated). Preparing the reply.";
      setTimeout(() => {
        animateLeg(1, 0, "Inbound", () => {
          statusEl.textContent =
            "Reply received on Earth (simulated) — a 48‑hour round trip, just like the real thing.";
          sendBtn.disabled = false;
          setTimeout(() => {
            pulse.hidden = true;
          }, PAUSE_MS);
        });
      }, PAUSE_MS);
    });
  }

  sendBtn.addEventListener("click", runRoundTrip);

  // --- Power budget slider ---
  const yearSlider = document.getElementById("year-slider");
  const yearReadout = document.getElementById("year-readout");
  const powerWatts = document.getElementById("power-watts");
  const powerBarFill = document.getElementById("power-bar-fill");
  const instrument1 = document.getElementById("instrument-1");
  const instrument2 = document.getElementById("instrument-2");

  const START_POWER = 200;
  const LOSS_PER_YEAR = 4;
  const INSTRUMENT_1_THRESHOLD = 120;
  const INSTRUMENT_2_THRESHOLD = 40;

  function updatePower() {
    const year = Number(yearSlider.value);
    const power = Math.max(0, START_POWER - LOSS_PER_YEAR * year);

    yearReadout.textContent = year;
    powerWatts.textContent = power;
    powerBarFill.style.width = `${(power / START_POWER) * 100}%`;

    instrument1.classList.toggle("off", power < INSTRUMENT_1_THRESHOLD);
    instrument2.classList.toggle("off", power < INSTRUMENT_2_THRESHOLD);
  }

  yearSlider.addEventListener("input", updatePower);
  updatePower();
})();
