const HAND_RULES = [
  { key: "fiveKind", name: "五条", rank: 8, baseDamage: 35 },
  { key: "fourKind", name: "四条", rank: 7, baseDamage: 24 },
  { key: "fullHouse", name: "葫芦", rank: 6, baseDamage: 18 },
  { key: "straight", name: "顺子", rank: 5, baseDamage: 14 },
  { key: "threeKind", name: "三条", rank: 4, baseDamage: 10 },
  { key: "twoPair", name: "两对", rank: 3, baseDamage: 7 },
  { key: "pair", name: "一对", rank: 2, baseDamage: 4 },
  { key: "high", name: "散点", rank: 1, baseDamage: 1 }
];

const DIE_FACE = {
  1: { label: "ONE", icon: "◆" },
  2: { label: "TWO", icon: "✿" },
  3: { label: "THREE", icon: "✦" },
  4: { label: "FOUR", icon: "⬢" },
  5: { label: "FIVE", icon: "◉" },
  6: { label: "SIX", icon: "✺" }
};

const ENEMIES = [
  { name: "鼠巷混混", hp: 28, damage: 4, avatar: "🐀", intentText: "普通追击", flavor: "笑得很脏，下手更脏。", archetype: "attack" },
  { name: "巷口守卫", hp: 38, damage: 5, avatar: "🛡️", intentText: "你越贪，它越狠", flavor: "专盯重掷的硬骨头。", archetype: "punish_greed" },
  { name: "诈牌老千", hp: 52, damage: 7, avatar: "🃏", intentText: "你太稳，它就起势", flavor: "最爱吃你的小收手。", archetype: "punish_low" },
  { name: "铁面发牌员", hp: 70, damage: 10, avatar: "🎲", intentText: "节奏被它掐得很死", flavor: "又反贪，又反保守。", archetype: "mixed" },
  { name: "赌桌本身", hp: 96, damage: 13, avatar: "🎰", intentText: "Boss 局：这桌不讲理", flavor: "最后一战，逼你把构筑打满。", archetype: "boss", boss: true }
];

const OFFERS = [
  {
    id: "floor-plan",
    name: "保底协议",
    text: "一对和两对伤害提高 50%。",
    summary: "走保底流，小牌也能稳定收钱。",
    apply(state) {
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.stable += 2;
    }
  },
  {
    id: "greedy-multi",
    name: "贪婪倍率",
    text: "每次重掷额外 +0.5x 倍率，但基础伤害 -10%。",
    summary: "走贪刀流，越贪倍率越离谱。",
    apply(state) {
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.greed += 2;
    }
  },
  {
    id: "blood-odds",
    name: "伤痕赔率",
    text: "每有 1 枚怜悯筹码，最终伤害 +3。",
    summary: "走受伤反打流，挨打也在攒爆发。",
    apply(state) {
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.risk += 2;
    }
  },
  {
    id: "safety-net",
    name: "安全网",
    text: "每场战斗第一次 Bust 不受伤，并自动免费重掷一次。",
    summary: "第一次贪过头，不会直接炸穿。",
    apply(state) {
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.stable += 1;
      state.run.buildScores.greed += 1;
    }
  },
  {
    id: "heal-up",
    name: "紧急包扎",
    text: "回复 8 点生命。",
    summary: "把血线抬回来，准备继续赌。",
    apply(state) {
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 8);
    }
  },
  {
    id: "hot-wallet",
    name: "热钱袋",
    text: "获得 6 金币。",
    summary: "纯加速，不解释。",
    apply(state) {
      state.player.coins += 6;
    }
  }
];

const ui = {
  cabinet: document.getElementById("cabinet"),
  screens: {
    title: document.getElementById("screen-title"),
    battle: document.getElementById("screen-battle"),
    shop: document.getElementById("screen-shop"),
    summary: document.getElementById("screen-summary")
  },
  startRunBtn: document.getElementById("start-run-btn"),
  playAgainBtn: document.getElementById("play-again-btn"),
  battle: document.getElementById("screen-battle"),
  shopGrid: document.getElementById("shop-grid"),
  shopCopy: document.getElementById("shop-copy"),
  summaryKicker: document.getElementById("summary-kicker"),
  summaryTitle: document.getElementById("summary-title"),
  summaryCopy: document.getElementById("summary-copy"),
  summaryGrid: document.getElementById("summary-grid"),
  summaryList: document.getElementById("summary-list"),
  damageFloat: document.getElementById("damage-float")
};

let state = null;

function makeInitialState() {
  return {
    screen: "title",
    player: {
      maxHp: 46,
      hp: 46,
      coins: 0,
      pityTokens: 0,
      relics: [],
      relicIds: new Set(),
      totalDamage: 0,
      highestHandName: "散点",
      highestHandRank: 1
    },
    run: {
      battleIndex: 0,
      enemiesDefeated: 0,
      buildScores: { stable: 0, greed: 0, risk: 0 },
      buildType: "未成型",
      logs: [],
      metrics: {
        reroll_count: 0,
        hold_rate: 0,
        bust_rate: 0,
        avg_damage: 0,
        reward_pick_rate: {},
        quit_stage: null,
        restart_rate: 0
      }
    },
    battle: null,
    pendingOffers: []
  };
}

function setScreen(name) {
  state.screen = name;
  Object.entries(ui.screens).forEach(([key, node]) => {
    node.classList.toggle("active", key === name);
  });
}

function addLog(title, text) {
  state.run.logs.unshift({ title, text });
  state.run.logs = state.run.logs.slice(0, 18);
}

function showFloat(text, color) {
  ui.damageFloat.textContent = text;
  ui.damageFloat.style.color = color;
  ui.damageFloat.classList.remove("show");
  void ui.damageFloat.offsetWidth;
  ui.damageFloat.classList.add("show");
  setTimeout(() => ui.damageFloat.classList.remove("show"), 700);
}

function shakeCabinet() {
  ui.cabinet.classList.add("shake");
  setTimeout(() => ui.cabinet.classList.remove("shake"), 220);
}

function hasRelic(id) {
  return state.player.relicIds.has(id);
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function createDice() {
  return Array.from({ length: 5 }, (_, index) => ({
    index,
    value: rollDie(),
    locked: false,
    rolling: false,
    toggled: false,
    inactive: false
  }));
}

function getEnemyDamage() {
  if (!state.battle) return 0;
  let damage = state.battle.enemy.damage + state.battle.enemyCharge * 2;
  if (state.run.battleIndex < 2) damage = Math.round(damage * 0.75);
  return damage;
}

function evaluateHand(dice) {
  const active = dice.filter(die => !die.inactive);
  const values = active.map(die => die.value);
  const counts = {};

  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });

  const amountList = Object.values(counts).sort((a, b) => b - a);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  const isStraight = unique.length === 5 && unique[4] - unique[0] === 4;

  let hand = HAND_RULES[7];
  if (amountList[0] === 5) hand = HAND_RULES[0];
  else if (amountList[0] === 4) hand = HAND_RULES[1];
  else if (amountList[0] === 3 && amountList[1] === 2) hand = HAND_RULES[2];
  else if (isStraight) hand = HAND_RULES[3];
  else if (amountList[0] === 3) hand = HAND_RULES[4];
  else if (amountList[0] === 2 && amountList[1] === 2) hand = HAND_RULES[5];
  else if (amountList[0] === 2) hand = HAND_RULES[6];

  const scoringIndices = [];
  if (["pair", "threeKind", "fourKind", "fiveKind"].includes(hand.key)) {
    const target = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a] || Number(b) - Number(a))[0]);
    active.forEach(die => {
      if (die.value === target) scoringIndices.push(die.index);
    });
  } else {
    active.forEach(die => scoringIndices.push(die.index));
  }

  return { hand, counts, scoringIndices };
}

function getMultiplier() {
  let multiplier = 1 + state.battle.rerollsUsed * 0.25;
  if (hasRelic("greedy-multi")) multiplier += state.battle.rerollsUsed * 0.5;
  return Number(multiplier.toFixed(2));
}

function calculatePreview() {
  const info = evaluateHand(state.battle.dice);
  let baseDamage = info.hand.key === "high" ? 0 : info.hand.baseDamage;

  if (hasRelic("floor-plan") && ["pair", "twoPair"].includes(info.hand.key)) {
    baseDamage = Math.round(baseDamage * 1.5);
  }

  if (hasRelic("greedy-multi") && baseDamage > 0) {
    baseDamage = Math.max(1, Math.round(baseDamage * 0.9));
  }

  let damage = info.hand.key === "high" ? 0 : Math.round(baseDamage * getMultiplier());
  if (hasRelic("blood-odds") && damage > 0) {
    damage += state.player.pityTokens * 3;
  }

  return {
    info,
    baseDamage,
    multiplier: getMultiplier(),
    damage,
    busted: info.hand.key === "high"
  };
}

function getTargetHand(info) {
  const counts = Object.values(info.counts);
  const maxCount = counts.length ? Math.max(...counts) : 1;
  if (maxCount === 4) return "五条";
  if (maxCount === 3) return "四条";
  if (maxCount === 2 && counts.filter(v => v === 2).length === 2) return "葫芦";
  if (maxCount === 2) return "三条";
  return "一对";
}

function getRecommendedIndices(info) {
  return new Set(info.scoringIndices);
}

function syncBuildType() {
  const ranking = Object.entries(state.run.buildScores).sort((a, b) => b[1] - a[1])[0];
  if (!ranking || ranking[1] <= 0) {
    state.run.buildType = "未成型";
    return;
  }
  const map = { stable: "保底流", greed: "贪刀流", risk: "受伤反打流" };
  state.run.buildType = map[ranking[0]];
}

function buildBattleScreen() {
  ui.battle.innerHTML = `
    <div class="battle-shell">
      <section class="battle-topbar">
        <div class="topbar-head">
          <div class="enemy-title">
            <div class="enemy-name" id="enemy-title-name"></div>
            <div class="enemy-stage" id="enemy-stage-copy"></div>
          </div>
          <div class="topbar-pills">
            <div class="pill" id="enemy-level-pill"></div>
            <div class="pill" id="coin-pill"></div>
          </div>
        </div>
        <div class="enemy-row">
          <div class="enemy-avatar" id="enemy-avatar"></div>
          <div class="enemy-main">
            <div class="enemy-meta">
              <div class="enemy-meta-left">
                <strong id="enemy-name-copy"></strong>
                <div class="trait-tag" id="enemy-trait"></div>
              </div>
              <div class="enemy-hp-value" id="enemy-hp-value"></div>
            </div>
            <div class="hp-track"><div class="hp-fill enemy" id="enemy-hp-fill"></div></div>
          </div>
        </div>
        <div class="player-strip">
          <div class="player-chip" id="player-chip"></div>
          <div class="player-hp-group">
            <strong id="player-hp-value"></strong>
            <div class="mini-track"><div class="hp-fill player" id="player-hp-fill"></div></div>
          </div>
        </div>
      </section>

      <section class="enemy-intent">
        <div class="intent-copy">
          <strong>本回合敌方动作</strong>
          <span id="enemy-intent-copy"></span>
        </div>
        <div class="intent-hit">
          <small>ENEMY HIT</small>
          <strong id="enemy-hit-value"></strong>
        </div>
      </section>

      <div class="drawer-rail">
        <details class="drawer left">
          <summary>RELICS</summary>
          <div class="drawer-sheet">
            <p class="drawer-title">Relics</p>
            <div class="relic-list" id="relic-list"></div>
          </div>
        </details>
        <details class="drawer right">
          <summary>LOGS</summary>
          <div class="drawer-sheet">
            <p class="drawer-title">Build</p>
            <div class="log-list" id="build-list"></div>
            <p class="drawer-title" style="margin-top:12px">Breakdown</p>
            <div class="calc-list" id="calc-list"></div>
            <p class="drawer-title" style="margin-top:12px">Battle Log</p>
            <div class="log-list" id="log-list"></div>
          </div>
        </details>
      </div>

      <section class="dice-shell">
        <div class="dice-status">
          <strong id="dice-lock-summary"></strong>
        </div>
        <div class="dice-stage">
          <div class="dice-grid" id="dice-grid"></div>
        </div>
      </section>

      <section class="battle-hud">
        <div class="hud-item"><div class="hud-label">Combo</div><div class="hud-value" id="hud-combo"></div></div>
        <div class="hud-item"><div class="hud-label">Damage</div><div class="hud-value damage" id="hud-damage"></div></div>
        <div class="hud-item"><div class="hud-label">Next Target</div><div class="hud-value" id="hud-target"></div></div>
        <div class="hud-item"><div class="hud-label">Rerolls</div><div class="hud-value" id="hud-rerolls"></div></div>
      </section>

      <section class="battle-actions">
        <button class="action-btn safe" id="settle-btn" type="button">
          <strong id="settle-title"></strong>
          <span id="settle-copy"></span>
        </button>
        <button class="action-btn risk" id="reroll-btn" type="button">
          <strong id="reroll-title"></strong>
          <span id="reroll-copy"></span>
        </button>
      </section>
    </div>
  `;
}

function renderBattle() {
  if (!state.battle) return;

  const preview = calculatePreview();
  const enemy = state.battle.enemy;
  const recommended = getRecommendedIndices(preview.info);
  const lockedCount = state.battle.dice.filter(die => die.locked && !die.inactive).length;
  const rerollCount = state.battle.dice.filter(die => !die.locked && !die.inactive).length;

  document.getElementById("enemy-title-name").textContent = enemy.name;
  document.getElementById("enemy-stage-copy").textContent = `第 ${state.run.battleIndex + 1} / ${ENEMIES.length} 战`;
  document.getElementById("enemy-level-pill").textContent = `Lv ${state.run.battleIndex + 1}`;
  document.getElementById("coin-pill").textContent = `金币 ${state.player.coins}`;
  document.getElementById("enemy-avatar").textContent = enemy.avatar;
  document.getElementById("enemy-name-copy").textContent = enemy.name;
  document.getElementById("enemy-trait").textContent = state.battle.enemyCharge > 0 ? `蓄力 ${state.battle.enemyCharge}` : enemy.intentText;
  document.getElementById("enemy-hp-value").textContent = `${enemy.hp} / ${enemy.maxHp}`;
  document.getElementById("enemy-hp-fill").style.width = `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%`;
  document.getElementById("player-chip").textContent = `生命 ${state.player.hp}`;
  document.getElementById("player-hp-value").textContent = `${state.player.hp} / ${state.player.maxHp}`;
  document.getElementById("player-hp-fill").style.width = `${Math.max(0, state.player.hp / state.player.maxHp * 100)}%`;
  document.getElementById("enemy-intent-copy").textContent = enemy.flavor;
  document.getElementById("enemy-hit-value").textContent = String(getEnemyDamage());
  document.getElementById("dice-lock-summary").textContent = `已锁定 ${lockedCount}/5`;
  document.getElementById("hud-combo").textContent = preview.info.hand.name;
  document.getElementById("hud-damage").textContent = String(preview.damage);
  document.getElementById("hud-target").textContent = getTargetHand(preview.info);
  document.getElementById("hud-rerolls").textContent = String(state.battle.rerollsRemaining);
  document.getElementById("settle-title").textContent = `收手结算 ${preview.damage}`;
  document.getElementById("settle-copy").textContent = preview.busted ? "止损，换补偿" : "锁住这手收益";

  const canEmergencyReroll = state.battle.rerollsRemaining <= 0 && state.player.pityTokens > 0;
  document.getElementById("reroll-title").textContent = canEmergencyReroll ? "拆筹码继续赌" : (state.battle.rerollsRemaining > 0 ? "继续赌" : "本回合到头");
  document.getElementById("reroll-copy").textContent =
    canEmergencyReroll ? `强续一手 · 冲 ${getTargetHand(preview.info)}` :
    state.battle.rerollsRemaining > 0 ? `冲 ${getTargetHand(preview.info)} · 重掷 ${rerollCount || 5} 枚` :
    "没有可用重掷";
  document.getElementById("reroll-btn").disabled = state.battle.rerollsRemaining <= 0 && !canEmergencyReroll;

  document.getElementById("dice-grid").innerHTML = state.battle.dice.map((die, index) => {
    const face = DIE_FACE[die.value];
    const className = [
      "die",
      `pos-${index}`,
      die.locked ? "locked" : "",
      recommended.has(die.index) && !die.locked ? "recommended" : "",
      die.rolling ? "rolling" : "",
      die.toggled ? "toggled" : "",
      die.inactive ? "inactive" : ""
    ].filter(Boolean).join(" ");

    return `<button class="${className}" type="button" data-die-index="${die.index}" ${die.inactive ? "disabled" : ""}>
      <span class="die-label">${die.locked ? "LOCKED" : face.label}</span>
      <span class="die-lock">🔒</span>
      <span class="die-icon">${die.inactive ? "✕" : face.icon}</span>
      <span class="die-note">${die.inactive ? "BROKEN" : `D${die.value}`}</span>
    </button>`;
  }).join("");

  document.getElementById("relic-list").innerHTML = state.player.relics.length
    ? state.player.relics.map(relic => `<div class="relic-card"><strong>${relic.name}</strong><span>${relic.text}</span></div>`).join("")
    : `<div class="relic-card"><strong>空槽位</strong><span>战后拿奖励，构筑会慢慢成型。</span></div>`;

  document.getElementById("build-list").innerHTML = `
    <div class="log-card"><strong>当前流派</strong><span>${state.run.buildType}</span></div>
    <div class="log-card"><strong>怜悯筹码</strong><span>${state.player.pityTokens} 枚</span></div>
  `;

  document.getElementById("calc-list").innerHTML = [
    ["牌型", preview.info.hand.name],
    ["基础", String(preview.baseDamage)],
    ["倍率", `x${preview.multiplier.toFixed(2)}`],
    ["伤害", String(preview.damage)]
  ].map(([label, value]) => `<div class="calc-row"><span>${label}</span><strong>${value}</strong></div>`).join("");

  document.getElementById("log-list").innerHTML = state.run.logs.length
    ? state.run.logs.map(item => `<div class="log-card"><strong>${item.title}</strong><span>${item.text}</span></div>`).join("")
    : `<div class="log-card"><strong>暂无日志</strong><span>这一手还没落桌。</span></div>`;
}

function startBattle(index) {
  state.run.battleIndex = index;
  const enemy = { ...ENEMIES[index], maxHp: ENEMIES[index].hp };
  state.battle = {
    enemy,
    dice: createDice(),
    rerollsRemaining: 2,
    rerollsUsed: 0,
    enemyCharge: 0,
    failChain: 0,
    safetyUsed: false
  };
  addLog("新战斗", `${enemy.name} 上桌了。`);
  setScreen("battle");
  buildBattleScreen();
  renderBattle();
}

function chooseOffers() {
  const pool = [...OFFERS];
  const chosen = [];
  const used = new Set();
  while (chosen.length < 3 && used.size < pool.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    chosen.push(pick);
  }
  state.pendingOffers = chosen;
}

function showShop() {
  chooseOffers();
  ui.shopCopy.textContent = `第 ${state.run.battleIndex + 1} 战结束，选 1 个奖励继续构筑。`;
  ui.shopGrid.innerHTML = state.pendingOffers.map(offer => `
    <div class="offer-card">
      <strong>${offer.name}</strong>
      <p>${offer.text}</p>
      <p>${offer.summary}</p>
      <button type="button" data-offer-id="${offer.id}">拿这个</button>
    </div>
  `).join("");
  setScreen("shop");
}

function showSummary(victory) {
  syncBuildType();
  ui.summaryKicker.textContent = victory ? "通关" : "败局";
  ui.summaryTitle.textContent = victory ? "这一局打穿了" : "这把到此为止";
  ui.summaryCopy.textContent = victory
    ? `你带着 ${state.run.buildType} 走到了最后。`
    : `这把停在第 ${state.run.battleIndex + 1} 战，但构筑方向已经出来了。`;

  ui.summaryGrid.innerHTML = [
    ["已击败", `${state.run.enemiesDefeated}`],
    ["最高牌型", state.player.highestHandName],
    ["总伤害", `${state.player.totalDamage}`],
    ["流派", state.run.buildType]
  ].map(([label, value]) => `<div class="summary-box"><small>${label}</small><strong>${value}</strong></div>`).join("");

  ui.summaryList.innerHTML = [
    `怜悯筹码：${state.player.pityTokens} 枚`,
    `金币：${state.player.coins}`,
    `遗物：${state.player.relics.map(relic => relic.name).join("、") || "无"}`
  ].map(text => `<div class="summary-item">${text}</div>`).join("");

  setScreen("summary");
}

function updateHighestHand(hand) {
  if (hand.rank > state.player.highestHandRank) {
    state.player.highestHandRank = hand.rank;
    state.player.highestHandName = hand.name;
  }
}

function enemyAttack() {
  const damage = getEnemyDamage();
  state.player.hp = Math.max(0, state.player.hp - damage);
  state.player.pityTokens += 1;
  addLog("敌方反击", `${state.battle.enemy.name} 打了你 ${damage} 点。你拿到 1 枚怜悯筹码。`);
  showFloat(`-${damage}`, "#ff9aa3");
  shakeCabinet();

  if (state.player.hp <= 0) {
    showSummary(false);
    return;
  }

  state.battle.dice = createDice();
  state.battle.rerollsRemaining = 2;
  state.battle.rerollsUsed = 0;
  renderBattle();
}

function handleBust() {
  state.run.metrics.bust_rate += 1;

  if (hasRelic("safety-net") && !state.battle.safetyUsed) {
    state.battle.safetyUsed = true;
    addLog("安全网", "第一次爆掉被安全网接住，免费重掷一次。");
    rerollUnlockedDice(true);
    return;
  }

  state.battle.failChain += 1;
  if (state.battle.failChain === 1) {
    addLog("失手", "这一手没成型，先丢收益，不掉血。");
    showFloat("炸了", "#ffb3ba");
  } else if (state.battle.failChain === 2) {
    state.battle.enemyCharge += 1;
    addLog("局势变坏", "敌人开始蓄力，下一手会更疼。");
    showFloat("蓄力+1", "#ffcf9d");
  } else {
    addLog("贪过头", "这次真的挨打了，但换来 1 枚怜悯筹码。");
    enemyAttack();
    return;
  }

  state.battle.dice = createDice();
  state.battle.rerollsRemaining = 2;
  state.battle.rerollsUsed = 0;
  renderBattle();
}

function settleHand() {
  if (!state.battle) return;

  const preview = calculatePreview();
  updateHighestHand(preview.info.hand);
  state.run.metrics.avg_damage += preview.damage;

  if (preview.busted) {
    handleBust();
    return;
  }

  state.battle.failChain = 0;
  state.player.totalDamage += preview.damage;
  state.battle.enemy.hp = Math.max(0, state.battle.enemy.hp - preview.damage);
  addLog("收手结算", `${preview.info.hand.name} 打出 ${preview.damage} 点伤害。`);
  showFloat(`-${preview.damage}`, "#ffe49e");

  if (state.battle.enemy.hp <= 0) {
    state.run.enemiesDefeated += 1;
    state.player.coins += 4 + state.run.battleIndex * 2;
    if (state.run.battleIndex === ENEMIES.length - 1) {
      showSummary(true);
      return;
    }
    showShop();
    return;
  }

  enemyAttack();
}

function rerollUnlockedDice(free = false) {
  if (!state.battle) return;

  if (!free && state.battle.rerollsRemaining <= 0) {
    if (state.player.pityTokens > 0) {
      state.player.pityTokens -= 1;
      state.battle.rerollsRemaining += 1;
      addLog("拆筹码", "拆 1 枚怜悯筹码，强行续一手。");
    } else {
      return;
    }
  }

  const targets = state.battle.dice.filter(die => !die.locked && !die.inactive);
  const actualTargets = targets.length ? targets : state.battle.dice.filter(die => !die.inactive);

  actualTargets.forEach(die => {
    die.value = rollDie();
    die.rolling = true;
  });

  if (!free) {
    state.battle.rerollsRemaining -= 1;
    state.battle.rerollsUsed += 1;
    state.run.metrics.reroll_count += 1;
    if (["punish_greed", "mixed", "boss"].includes(state.battle.enemy.archetype)) {
      state.battle.enemyCharge += 1;
    }
  }

  addLog("继续赌", `重掷了 ${actualTargets.length} 枚骰子。`);
  renderBattle();

  setTimeout(() => {
    state.battle.dice.forEach(die => {
      die.rolling = false;
    });
    renderBattle();
  }, 520);
}

function toggleDie(index) {
  if (!state.battle) return;
  const die = state.battle.dice[index];
  if (!die || die.inactive) return;
  die.locked = !die.locked;
  die.toggled = true;
  addLog(die.locked ? "锁定骰子" : "取消锁定", `第 ${index + 1} 枚骰子${die.locked ? "已锁定" : "已取消锁定"}。`);
  renderBattle();
  setTimeout(() => {
    if (!state?.battle?.dice[index]) return;
    state.battle.dice[index].toggled = false;
    renderBattle();
  }, 220);
}

function startRun() {
  state = makeInitialState();
  startBattle(0);
}

function bindEvents() {
  ui.startRunBtn.addEventListener("click", startRun);
  ui.playAgainBtn.addEventListener("click", startRun);

  ui.battle.addEventListener("click", event => {
    const dieButton = event.target.closest("[data-die-index]");
    if (dieButton) {
      toggleDie(Number(dieButton.dataset.dieIndex));
      return;
    }
    if (event.target.closest("#reroll-btn")) {
      rerollUnlockedDice(false);
      return;
    }
    if (event.target.closest("#settle-btn")) {
      settleHand();
    }
  });

  ui.shopGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-offer-id]");
    if (!button) return;
    const offer = state.pendingOffers.find(item => item.id === button.dataset.offerId);
    if (!offer) return;
    offer.apply(state);
    state.run.metrics.reward_pick_rate[offer.id] = (state.run.metrics.reward_pick_rate[offer.id] || 0) + 1;
    syncBuildType();
    startBattle(state.run.battleIndex + 1);
  });
}

bindEvents();

if (location.hash === "#autostart") {
  startRun();
}
