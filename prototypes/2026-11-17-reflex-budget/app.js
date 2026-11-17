(function () {
  "use strict";

  // Simplified inverted-pendulum balance model. Not real robot data —
  // see the on-page banner. Constants below were tuned so the onboard
  // loop (near-zero delay) stays upright while the cloud loop destabilizes
  // as the round-trip delay grows, matching the episode's "reflex budget" point.
  const DT = 1 / 60; // physics step (s)
  const ALPHA = 5; // destabilizing "gravity" term (toy units)
  const DAMPING = 0.2; // passive mechanical damping
  const KP = 105; // controller stiffness
  const KD = 6.0; // controller damping
  const FALL_THRESHOLD = 0.6; // rad (~34°), illustrative
  const SHOVE_MAG = 1.5; // rad/s angular kick, illustrative
  const SHOVE_EVERY_BASE = 7; // s, average spacing (randomized 0.5x-1.5x)
  const MIN_CONTROL_PERIOD_S = DT; // fastest the sim can ever sample/actuate
  const FALL_FLASH_S = 0.45;
  const SHOVE_FLASH_S = 0.25;
  const HISTORY_MAX = 4000;
  const FALLS_WINDOW_S = 60;

  function createRobot() {
    return {
      theta: 0,
      omega: 0,
      torque: 0,
      history: [{ t: 0, theta: 0, omega: 0 }],
      nextUpdate: 0,
      fallFlashUntil: -1,
      fallTimestamps: [],
    };
  }

  const onboard = createRobot();
  const cloud = createRobot();

  const canvasOnboard = document.getElementById("canvas-onboard");
  const canvasCloud = document.getElementById("canvas-cloud");
  const ctxOnboard = canvasOnboard.getContext("2d");
  const ctxCloud = canvasCloud.getContext("2d");

  const latencySlider = document.getElementById("latency");
  const latencyValueEl = document.getElementById("latency-value");
  const roundtripValueEl = document.getElementById("roundtrip-value");
  const hzValueEl = document.getElementById("hz-value");
  const hzOnboardEl = document.getElementById("hz-onboard");
  const hzCloudEl = document.getElementById("hz-cloud");
  const fallsOnboardEl = document.getElementById("falls-onboard");
  const fallsCloudEl = document.getElementById("falls-cloud");
  const elapsedLineEl = document.getElementById("elapsed-line");
  const presetBtn = document.getElementById("preset-5g");
  const resetBtn = document.getElementById("reset-btn");
  const panelOnboard = document.getElementById("panel-onboard");
  const panelCloud = document.getElementById("panel-cloud");

  let perLegMs = Number(latencySlider.value);
  let simTime = 0;
  let nextShoveTime = SHOVE_EVERY_BASE * (0.5 + Math.random());
  let shoveFlashUntil = -1;

  function roundTripMs() {
    return perLegMs * 2;
  }

  function clampedControlPeriodS(roundTripMsValue) {
    return Math.max(roundTripMsValue / 1000, MIN_CONTROL_PERIOD_S);
  }

  function controlHz(periodS) {
    return 1 / periodS;
  }

  function formatHz(hz) {
    return `${hz >= 100 ? hz.toFixed(0) : hz.toFixed(1)} Hz`;
  }

  function sampleHistory(history, targetT) {
    let sample = history[0];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].t <= targetT) {
        sample = history[i];
        break;
      }
    }
    return sample;
  }

  function stepRobot(robot, delayS) {
    if (simTime >= robot.nextUpdate) {
      const sample = sampleHistory(robot.history, simTime - delayS);
      robot.torque = KP * sample.theta + KD * sample.omega;
      robot.nextUpdate += Math.max(delayS, DT);
    }

    const angAcc = ALPHA * Math.sin(robot.theta) - robot.torque - DAMPING * robot.omega;
    robot.omega += angAcc * DT;
    robot.theta += robot.omega * DT;

    robot.history.push({ t: simTime, theta: robot.theta, omega: robot.omega });
    if (robot.history.length > HISTORY_MAX) robot.history.shift();

    if (Math.abs(robot.theta) > FALL_THRESHOLD) {
      robot.theta = 0;
      robot.omega = 0;
      robot.torque = 0;
      robot.history = [{ t: simTime, theta: 0, omega: 0 }];
      robot.fallTimestamps.push(simTime);
      robot.fallFlashUntil = simTime + FALL_FLASH_S;
    }

    while (robot.fallTimestamps.length && simTime - robot.fallTimestamps[0] > FALLS_WINDOW_S) {
      robot.fallTimestamps.shift();
    }
  }

  function physicsTick() {
    simTime += DT;

    if (simTime >= nextShoveTime) {
      const kick = (Math.random() < 0.5 ? -1 : 1) * SHOVE_MAG;
      onboard.omega += kick;
      cloud.omega += kick;
      shoveFlashUntil = simTime + SHOVE_FLASH_S;
      nextShoveTime += SHOVE_EVERY_BASE * (0.5 + Math.random());
    }

    stepRobot(onboard, MIN_CONTROL_PERIOD_S);
    stepRobot(cloud, clampedControlPeriodS(roundTripMs()));
  }

  function drawRobot(ctx, canvas, robot, bodyColor, isFallen) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const groundY = h - 30;
    ctx.strokeStyle = "#2a3a4f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, groundY);
    ctx.lineTo(w - 20, groundY);
    ctx.stroke();

    const ankleX = w / 2;
    const ankleY = groundY;
    const displayTheta = isFallen ? Math.sign(robot.theta || 1) * 1.45 : robot.theta;

    ctx.save();
    ctx.translate(ankleX, ankleY);
    ctx.rotate(displayTheta);

    ctx.strokeStyle = bodyColor;
    ctx.fillStyle = bodyColor;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    // standing leg (ankle to hip)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -85);
    ctx.stroke();

    // lifted leg, bent, hanging to one side
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -85);
    ctx.lineTo(18, -55);
    ctx.lineTo(14, -20);
    ctx.stroke();

    // torso
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -85);
    ctx.lineTo(0, -150);
    ctx.stroke();

    // arms to tray
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-28, -146);
    ctx.lineTo(0, -134);
    ctx.lineTo(28, -146);
    ctx.stroke();

    // tray
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-40, -144);
    ctx.lineTo(40, -144);
    ctx.stroke();

    // cup on tray, with a highlight so it reads at a glance
    ctx.fillStyle = "#ffd79a";
    ctx.beginPath();
    ctx.fillRect(-11, -156, 22, 12);
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -156, 22, 12);
    ctx.fillStyle = bodyColor;

    // head
    ctx.beginPath();
    ctx.arc(0, -168, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (simTime < shoveFlashUntil) {
      ctx.fillStyle = "rgba(255, 209, 102, 0.85)";
      ctx.beginPath();
      ctx.moveTo(w - 55, 40);
      ctx.lineTo(w - 25, 50);
      ctx.lineTo(w - 55, 60);
      ctx.fill();
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("shove", w - 95, 54);
    }

    if (isFallen) {
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.fillStyle = "#ff6b6b";
      ctx.textAlign = "center";
      ctx.fillText("FELL", ankleX, 30);
      ctx.textAlign = "left";
    }
  }

  function flashPanel(panel) {
    panel.classList.remove("fallen-flash");
    // eslint-disable-next-line no-unused-expressions
    panel.offsetWidth; // restart animation
    panel.classList.add("fallen-flash");
  }

  let lastOnboardFallCount = 0;
  let lastCloudFallCount = 0;

  function render() {
    const onboardFallen = simTime < onboard.fallFlashUntil;
    const cloudFallen = simTime < cloud.fallFlashUntil;
    drawRobot(ctxOnboard, canvasOnboard, onboard, "#4fd1c5", onboardFallen);
    drawRobot(ctxCloud, canvasCloud, cloud, "#f2994a", cloudFallen);

    if (onboard.fallTimestamps.length !== lastOnboardFallCount) {
      lastOnboardFallCount = onboard.fallTimestamps.length;
      flashPanel(panelOnboard);
    }
    if (cloud.fallTimestamps.length !== lastCloudFallCount) {
      lastCloudFallCount = cloud.fallTimestamps.length;
      flashPanel(panelCloud);
    }
  }

  function updateReadouts() {
    const rt = roundTripMs();
    const periodS = clampedControlPeriodS(rt);
    const hz = controlHz(periodS);

    latencyValueEl.textContent = perLegMs;
    roundtripValueEl.textContent = rt;
    hzValueEl.textContent = formatHz(hz);
    hzCloudEl.textContent = formatHz(hz);
    hzOnboardEl.textContent = `${formatHz(controlHz(MIN_CONTROL_PERIOD_S))} (no network hop)`;

    fallsOnboardEl.textContent = onboard.fallTimestamps.length;
    fallsCloudEl.textContent = cloud.fallTimestamps.length;

    elapsedLineEl.textContent = `Running for ${Math.floor(simTime)}s`;
  }

  let lastFrameTime = null;
  let accumulator = 0;

  function loop(now) {
    if (lastFrameTime === null) lastFrameTime = now;
    let frameDt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    frameDt = Math.min(frameDt, 0.1);
    accumulator += frameDt;

    while (accumulator >= DT) {
      physicsTick();
      accumulator -= DT;
    }

    render();
    updateReadouts();
    requestAnimationFrame(loop);
  }

  latencySlider.addEventListener("input", () => {
    perLegMs = Number(latencySlider.value);
    updateReadouts();
  });

  presetBtn.addEventListener("click", () => {
    latencySlider.value = "25";
    perLegMs = 25;
    updateReadouts();
  });

  resetBtn.addEventListener("click", () => {
    Object.assign(onboard, createRobot());
    Object.assign(cloud, createRobot());
    lastOnboardFallCount = 0;
    lastCloudFallCount = 0;
    simTime = 0;
    nextShoveTime = SHOVE_EVERY_BASE * (0.5 + Math.random());
    shoveFlashUntil = -1;
    panelOnboard.classList.remove("fallen-flash");
    panelCloud.classList.remove("fallen-flash");
  });

  updateReadouts();
  requestAnimationFrame(loop);
})();
