(() => {
  const OPS_PER_SEC = 5_000_000_000; // simulated: ~one modern CPU core
  const OLD_EXP = 2;
  const NEW_EXP = 1.995;
  const ANIMATION_MS = 4000;
  const SEC_MIN = 60;
  const SEC_HOUR = 3600;
  const SEC_DAY = 86400;
  const SEC_YEAR = 31557600; // julian year

  const slider = document.getElementById('n-slider');
  const nReadout = document.getElementById('n-readout');
  const runBtn = document.getElementById('run-race-btn');
  const maxScaleBtn = document.getElementById('max-scale-btn');
  const barOld = document.getElementById('bar-old');
  const barNew = document.getElementById('bar-new');
  const readoutOld = document.getElementById('readout-old');
  const readoutNew = document.getElementById('readout-new');
  const opsOldEl = document.getElementById('ops-old');
  const opsNewEl = document.getElementById('ops-new');
  const timeSavedEl = document.getElementById('time-saved');
  const speedupEl = document.getElementById('speedup');
  const tallyEl = document.getElementById('tally-value');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rafId = null;

  function formatCount(x) {
    if (!isFinite(x)) return '—';
    if (x < 10000) return Math.round(x).toLocaleString('en-US');
    const exp = Math.floor(Math.log10(x));
    const mantissa = x / Math.pow(10, exp);
    return `${mantissa.toFixed(2)} × 10^${exp}`;
  }

  function formatYears(years) {
    const scales = [
      [1e21, 'sextillion'],
      [1e18, 'quintillion'],
      [1e15, 'quadrillion'],
      [1e12, 'trillion'],
      [1e9, 'billion'],
      [1e6, 'million'],
      [1e3, 'thousand'],
    ];
    for (const [mag, name] of scales) {
      if (years >= mag) return `${(years / mag).toFixed(2)} ${name} years`;
    }
    return `${years.toFixed(years < 10 ? 1 : 0)} years`;
  }

  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '—';
    if (seconds < 1) return '< 1 sec';
    if (seconds < SEC_MIN) return `${seconds.toFixed(1)} sec`;
    if (seconds < SEC_HOUR) return `${(seconds / SEC_MIN).toFixed(1)} min`;
    if (seconds < SEC_DAY) return `${(seconds / SEC_HOUR).toFixed(1)} hr`;
    if (seconds < SEC_YEAR) return `${(seconds / SEC_DAY).toFixed(1)} days`;
    return formatYears(seconds / SEC_YEAR);
  }

  function compute(n) {
    const opsOld = Math.pow(n, OLD_EXP);
    const opsNew = Math.pow(n, NEW_EXP);
    const timeOld = opsOld / OPS_PER_SEC;
    const timeNew = opsNew / OPS_PER_SEC;
    return { opsOld, opsNew, timeOld, timeNew };
  }

  function currentN() {
    const exponent = parseFloat(slider.value);
    return Math.pow(10, exponent);
  }

  function updateStats(n) {
    const { opsOld, opsNew, timeOld, timeNew } = compute(n);
    nReadout.textContent = `n ≈ ${formatCount(n)}`;
    opsOldEl.textContent = formatCount(opsOld);
    opsNewEl.textContent = formatCount(opsNew);
    timeSavedEl.textContent = formatDuration(timeOld - timeNew);
    speedupEl.textContent = `${(timeOld / timeNew).toFixed(2)}×`;
    return { opsOld, opsNew, timeOld, timeNew };
  }

  function stopAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function runRace() {
    stopAnimation();
    const n = currentN();
    const { timeOld, timeNew } = updateStats(n);

    barOld.style.width = '0%';
    barNew.style.width = '0%';
    tallyEl.textContent = '+0 sec';

    if (reduceMotion) {
      barOld.style.width = '100%';
      barNew.style.width = '100%';
      readoutOld.textContent = `Done — ${formatDuration(timeOld)}`;
      readoutNew.textContent = `Done — ${formatDuration(timeNew)}`;
      tallyEl.textContent = `+${formatDuration(timeOld - timeNew)}`;
      return;
    }

    const scaledNewMs = timeOld > 0 ? ANIMATION_MS * (timeNew / timeOld) : ANIMATION_MS;
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const fracOld = Math.min(1, elapsed / ANIMATION_MS);
      const fracNew = Math.min(1, elapsed / scaledNewMs);

      barOld.style.width = `${fracOld * 100}%`;
      barNew.style.width = `${fracNew * 100}%`;

      readoutOld.textContent = fracOld >= 1
        ? `Done — ${formatDuration(timeOld)}`
        : `${formatDuration(timeOld * (1 - fracOld))} remaining`;
      readoutNew.textContent = fracNew >= 1
        ? `Done — ${formatDuration(timeNew)}`
        : `${formatDuration(timeNew * (1 - fracNew))} remaining`;

      // Ticks up smoothly across the full animation so the absolute gap reads as a
      // dramatic live count, since the bars themselves only ever differ by a sliver.
      const tallyFrac = Math.min(1, elapsed / ANIMATION_MS);
      tallyEl.textContent = `+${formatDuration((timeOld - timeNew) * tallyFrac)}`;

      if (fracOld < 1 || fracNew < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = null;
      }
    }

    rafId = requestAnimationFrame(frame);
  }

  function jumpToMaxScale() {
    slider.value = slider.max;
    updateStats(currentN());
    runRace();
  }

  slider.addEventListener('input', () => updateStats(currentN()));
  slider.addEventListener('change', runRace);
  runBtn.addEventListener('click', runRace);
  maxScaleBtn.addEventListener('click', jumpToMaxScale);

  updateStats(currentN());
  runRace();
})();
