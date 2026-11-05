(function () {
  "use strict";

  var FALLBACK_STORES = [
    { name: "Northgate FreshMart", town: "Dunmere" },
    { name: "Harbor Grocer", town: "Dunmere" },
    { name: "Willow Lane Foods", town: "Dunmere" },
    { name: "Ridgefield Pantry", town: "Aldcross" },
    { name: "Clover & Co.", town: "Aldcross" },
    { name: "Birchwood Market", town: "Aldcross" },
    { name: "Maple Row Grocer", town: "Penhallow" },
    { name: "Old Mill Foods", town: "Penhallow" },
    { name: "Stonegate Supermarket", town: "Penhallow" },
    { name: "Ferry Point Foods", town: "Brackwell" },
    { name: "Elmhurst Grocer", town: "Brackwell" },
    { name: "Westfield Pantry", town: "Brackwell" },
    { name: "Thistledown Market", town: "Garrow" },
    { name: "Copper Beech Foods", town: "Garrow" },
    { name: "Lakeside Grocer", town: "Garrow" },
    { name: "Hollow Creek Market", town: "Ashby" },
    { name: "Fieldstone Pantry", town: "Ashby" },
    { name: "Riverside Grocer", town: "Ashby" },
    { name: "Granary Row Foods", town: "Millbrook" },
    { name: "Cinderpath Market", town: "Millbrook" }
  ];

  var START_BUDGET = 2000;
  var TOTAL_TICKS = 150;
  var TICK_MS = 1000;
  var MINUTES_PER_TICK = 480 / TOTAL_TICKS;
  var START_HOUR_MIN = 22 * 60;
  var BASE_TEMP = -18;
  var MAX_TEMP = 55;
  var ALARM_THRESHOLD = -5;
  var SPOIL_THRESHOLD = -5;
  var RISE_TICKS = 40;
  var BASE_RATE = (MAX_TEMP - BASE_TEMP) / RISE_TICKS;
  var LOSS_PER_TICK = 20;
  var ATTACK_FRACTION = 0.7;

  var DEFENSES = {
    password: { cost: 100, label: "Change password" },
    vpn: { cost: 300, label: "Add VPN" },
    alarm: { cost: 150, label: "High-temp alarm" },
    offline: { cost: 250, label: "Take offline" }
  };

  var budget = START_BUDGET;
  var stores = [];
  var tick = 0;
  var timer = null;

  var mapGrid = document.getElementById("mapGrid");
  var budgetEl = document.getElementById("budget");
  var totalLossEl = document.getElementById("totalLoss");
  var safeCountEl = document.getElementById("safeCount");
  var clockEl = document.getElementById("clock");
  var startOverlay = document.getElementById("startOverlay");
  var startBudgetEl = document.getElementById("startBudget");
  var startBtn = document.getElementById("startBtn");
  var endOverlay = document.getElementById("endOverlay");
  var endLossEl = document.getElementById("endLoss");
  var recapYouEl = document.getElementById("recapYou");
  var restartBtn = document.getElementById("restartBtn");

  function formatEuro(n) {
    return "€" + Math.round(n).toLocaleString("en-US");
  }

  function formatClock(t) {
    var totalMin = Math.floor(t * MINUTES_PER_TICK);
    var minOfDay = (START_HOUR_MIN + totalMin) % (24 * 60);
    var h = Math.floor(minOfDay / 60);
    var m = minOfDay % 60;
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }

  function buildStores(list) {
    var attackPool = [];
    for (var i = 0; i < list.length; i++) attackPool.push(i);
    attackPool.sort(function () { return Math.random() - 0.5; });
    var attackedCount = Math.round(list.length * ATTACK_FRACTION);
    var attackedSet = {};
    for (var j = 0; j < attackedCount; j++) attackedSet[attackPool[j]] = true;

    return list.map(function (s, idx) {
      var willAttack = !!attackedSet[idx];
      return {
        id: idx,
        name: s.name,
        town: s.town,
        temp: BASE_TEMP,
        loss: 0,
        willAttack: willAttack,
        attackTick: willAttack ? 10 + Math.floor(Math.random() * 90) : null,
        attacked: false,
        attackActive: false,
        alarmTriggered: false,
        defenses: { password: false, vpn: false, alarm: false, offline: false }
      };
    });
  }

  function renderStores() {
    mapGrid.innerHTML = "";
    stores.forEach(function (store) {
      var card = document.createElement("article");
      card.className = "store";
      card.id = "store-" + store.id;
      card.setAttribute("aria-label", store.name);

      var pct = Math.max(0, Math.min(100, ((store.temp - BASE_TEMP) / (MAX_TEMP - BASE_TEMP)) * 100));

      card.innerHTML =
        '<div class="store-name"><span>' + store.name + '</span>' +
        '<span class="status-pill" id="pill-' + store.id + '">watching</span></div>' +
        '<div class="thermo-wrap">' +
          '<div class="thermo"><div class="thermo-fill" id="fill-' + store.id + '" style="width:' + pct + '%"></div></div>' +
          '<span class="temp-reading" id="temp-' + store.id + '">' + Math.round(store.temp) + '°C</span>' +
        '</div>' +
        '<div class="loss-reading">Stock lost: <strong id="loss-' + store.id + '">€0</strong></div>' +
        '<div class="defenses" id="defenses-' + store.id + '"></div>';

      mapGrid.appendChild(card);
      renderDefenseButtons(store);
    });
  }

  function renderDefenseButtons(store) {
    var wrap = document.getElementById("defenses-" + store.id);
    wrap.innerHTML = "";
    var immune = store.defenses.vpn || store.defenses.offline;
    Object.keys(DEFENSES).forEach(function (key) {
      var def = DEFENSES[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "defense-btn";
      btn.textContent = def.label + " (€" + def.cost + ")";
      var active = store.defenses[key];
      var disableBecauseImmune = immune && key !== "vpn" && key !== "offline";
      var disableBecauseBudget = !active && budget < def.cost;
      var disableAlreadyActive = active;
      if (active) btn.classList.add("active");
      btn.disabled = disableAlreadyActive || disableBecauseImmune || disableBecauseBudget;
      btn.addEventListener("click", function () {
        applyDefense(store, key);
      });
      wrap.appendChild(btn);
    });
  }

  function applyDefense(store, key) {
    var def = DEFENSES[key];
    if (store.defenses[key]) return;
    if (budget < def.cost) return;
    budget -= def.cost;
    store.defenses[key] = true;
    if (key === "vpn" && store.attackActive) {
      store.attackActive = false;
    }
    if (key === "offline" && store.attackActive) {
      store.attackActive = false;
    }
    updateHud();
    renderDefenseButtons(store);
    updateAllButtonsForBudget();
  }

  function updateAllButtonsForBudget() {
    stores.forEach(renderDefenseButtons);
  }

  function updateStoreCard(store) {
    var pct = Math.max(0, Math.min(100, ((store.temp - BASE_TEMP) / (MAX_TEMP - BASE_TEMP)) * 100));
    var fill = document.getElementById("fill-" + store.id);
    var temp = document.getElementById("temp-" + store.id);
    var loss = document.getElementById("loss-" + store.id);
    var pill = document.getElementById("pill-" + store.id);
    var card = document.getElementById("store-" + store.id);
    if (!fill) return;

    fill.style.width = pct + "%";
    temp.textContent = Math.round(store.temp) + "°C";
    temp.classList.toggle("hot", store.temp > SPOIL_THRESHOLD);
    loss.textContent = formatEuro(store.loss);

    card.classList.remove("exposed", "under-attack", "protected-vpn", "melted");
    if (store.defenses.offline) {
      pill.textContent = "offline";
      pill.className = "status-pill offline";
    } else if (store.defenses.vpn) {
      pill.textContent = "protected";
      pill.className = "status-pill safe";
      card.classList.add("protected-vpn");
    } else if (store.attackActive) {
      pill.textContent = store.alarmTriggered ? "alarm tripped" : "under attack";
      pill.className = "status-pill attack";
      card.classList.add("under-attack");
      if (store.temp >= MAX_TEMP - 1) card.classList.add("melted");
    } else if (store.attacked) {
      pill.textContent = store.alarmTriggered ? "alarm tripped" : "hit earlier";
      pill.className = "status-pill attack";
    } else {
      pill.textContent = "watching";
      pill.className = "status-pill";
      card.classList.add("exposed");
    }
  }

  function updateHud() {
    budgetEl.textContent = formatEuro(budget);
    var totalLoss = stores.reduce(function (sum, s) { return sum + s.loss; }, 0);
    totalLossEl.textContent = formatEuro(totalLoss);
    var safe = stores.filter(function (s) { return s.loss === 0; }).length;
    safeCountEl.textContent = safe + " / " + stores.length;
    clockEl.textContent = formatClock(tick);
    return totalLoss;
  }

  function runTick() {
    tick++;
    stores.forEach(function (store) {
      if (store.defenses.offline) return;

      if (!store.attacked && store.willAttack && tick >= store.attackTick && !store.defenses.vpn) {
        store.attacked = true;
        store.attackActive = true;
      }

      if (store.attackActive) {
        if (store.defenses.vpn) {
          store.attackActive = false;
        } else {
          var rate = store.alarmTriggered ? 0 : BASE_RATE * (store.defenses.password ? 0.4 : 1);
          store.temp = Math.min(MAX_TEMP, store.temp + rate);

          if (store.defenses.alarm && !store.alarmTriggered && store.temp >= ALARM_THRESHOLD) {
            store.alarmTriggered = true;
          }

          if (store.temp > SPOIL_THRESHOLD && !store.alarmTriggered) {
            store.loss += LOSS_PER_TICK;
          }
        }
      }

      updateStoreCard(store);
    });

    updateHud();

    if (tick >= TOTAL_TICKS) {
      endNight();
    }
  }

  function endNight() {
    clearInterval(timer);
    timer = null;
    var totalLoss = stores.reduce(function (sum, s) { return sum + s.loss; }, 0);
    endLossEl.textContent = formatEuro(totalLoss);
    recapYouEl.textContent = formatEuro(totalLoss);
    endOverlay.classList.remove("hidden");
  }

  function startNight() {
    startOverlay.classList.add("hidden");
    if (timer) clearInterval(timer);
    timer = setInterval(runTick, TICK_MS);
  }

  function init(list) {
    stores = buildStores(list);
    budget = START_BUDGET;
    tick = 0;
    startBudgetEl.textContent = formatEuro(START_BUDGET);
    renderStores();
    updateHud();
    stores.forEach(updateStoreCard);
  }

  startBtn.addEventListener("click", startNight);
  restartBtn.addEventListener("click", function () {
    window.location.reload();
  });

  fetch("data/stores.json")
    .then(function (res) {
      if (!res.ok) throw new Error("bad response");
      return res.json();
    })
    .then(function (data) {
      init(data.stores && data.stores.length ? data.stores : FALLBACK_STORES);
    })
    .catch(function () {
      init(FALLBACK_STORES);
    });
})();
