const DIE_FACE = {
  1: { label: "ONE", icon: "◆" },
  2: { label: "TWO", icon: "✿" },
  3: { label: "THREE", icon: "✦" },
  4: { label: "FOUR", icon: "⬢" },
  5: { label: "FIVE", icon: "◉" },
  6: { label: "SIX", icon: "✺" }
};

const ENEMIES = [
  { name: "鼠巷混混", hp: 28, damage: 4, avatar: "🐀", intentText: "直接压血", flavor: "开局先试你一手底子。", archetype: "attack" },
  { name: "巷口守卫", hp: 38, damage: 5, avatar: "🛡️", intentText: "重掷会蓄力", flavor: "你每多重掷一次，它的下轮伤害就更高。", archetype: "punish_greed" },
  { name: "诈牌老千", hp: 52, damage: 7, avatar: "🃏", intentText: "低伤会成长", flavor: "这一手打太轻，它会顺势抬高压制。", archetype: "punish_low" },
  { name: "铁面发牌员", hp: 70, damage: 10, avatar: "🎲", intentText: "低伤 / 高能都吃", flavor: "你打得轻，或者能量滚太快，它都要反制。", archetype: "mixed" },
  { name: "赌桌本身", hp: 96, damage: 13, avatar: "🎰", intentText: "终局高压", flavor: "伤害不够，或者护甲太厚，它都会继续上压。", archetype: "boss", boss: true }
];

const OFFERS = [
  {
    id: "double2",
    name: "连击强化",
    text: "每个 2 额外造成 +2 伤害",
    summary: "把 2 堆起来，整轮输出会开始连跳。",
    apply(state) {
      state.player.upgrades.double2 = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.combo += 2;
    }
  },
  {
    id: "energyBoost",
    name: "能量翻倍",
    text: "3 提供的能量翻倍",
    summary: "把能量滚起来，后面每手都更宽裕。",
    apply(state) {
      state.player.upgrades.energyBoost = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.energy += 2;
    }
  },
  {
    id: "critBoost",
    name: "暴击强化",
    text: "每个 6 额外 +3 伤害",
    summary: "把 6 养起来，高爆发回合会突然抬头。",
    apply(state) {
      state.player.upgrades.critBoost = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.crit += 2;
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
      armor: 0,
      energy: 0,
      relics: [],
      relicIds: new Set(),
      totalDamage: 0,
      highestDamage: 0,
      upgrades: {
        double2: false,
        energyBoost: false,
        critBoost: false
      }
    },
    run: {
      battleIndex: 0,
      enemiesDefeated: 0,
      buildScores: { combo: 0, energy: 0, crit: 0 },
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

function resolveDice(dice) {
  const result = {
    damage: 0,
    energy: 0,
    armor: 0,
    triggers: []
  };

  dice.filter(die => !die.inactive).forEach(die => {
    switch (die.value) {
      case 1:
        result.damage += 1;
        result.triggers.push("light_hit");
        break;
      case 2:
        result.damage += 2;
        result.triggers.push("multi_hit");
        break;
      case 3:
        result.energy += 1;
        result.triggers.push("energy_gain");
        break;
      case 4:
        result.armor += 3;
        result.triggers.push("armor_gain");
        break;
      case 5:
        result.damage += 5;
        result.triggers.push("heavy_hit");
        break;
      case 6:
        result.damage += 6;
        result.triggers.push("crit");
        break;
      default:
        break;
    }
  });

  return result;
}

function applyBuildEffects(result) {
  const upgrades = state.player.upgrades;

  if (upgrades.double2) {
    const count2 = result.triggers.filter(trigger => trigger === "multi_hit").length;
    result.damage += count2 * 2;
  }

  if (upgrades.energyBoost) {
    result.energy *= 2;
  }

  if (upgrades.critBoost) {
    const critCount = result.triggers.filter(trigger => trigger === "crit").length;
    result.damage += critCount * 3;
  }

  return result;
}

function calculateRoundResult() {
  const base = resolveDice(state.battle.dice, state);
  const final = applyBuildEffects({
    damage: base.damage,
    energy: base.energy,
    armor: base.armor,
    triggers: [...base.triggers]
  }, state);

  return {
    base,
    final
  };
}

function getTargetTip(dice) {
  const counts = { 2: 0, 3: 0, 6: 0 };
  dice.filter(die => !die.inactive).forEach(die => {
    if (counts[die.value] !== undefined) counts[die.value] += 1;
  });

  if (counts[6] >= 2) return "补 6 做暴击链";
  if (counts[2] >= 2) return "补 2 做连击链";
  if (counts[3] >= 2) return "补 3 做能量链";
  return "补 5 / 6 抬伤害";
}

function syncBuildType() {
  const ranking = Object.entries(state.run.buildScores).sort((a, b) => b[1] - a[1])[0];
  if (!ranking || ranking[1] <= 0) {
    state.run.buildType = "未成型";
    return;
  }
  const map = {
    combo: "连击链",
    energy: "能量链",
    crit: "暴击链"
  };
  state.run.buildType = map[ranking[0]];
}

function getBuildBonusCopy(result) {
  const notes = [];
  if (state.player.upgrades.double2) {
    const count2 = result.triggers.filter(trigger => trigger === "multi_hit").length;
    if (count2 > 0) notes.push(`连击链 +${count2 * 2}`);
  }
  if (state.player.upgrades.energyBoost && result.energy > 0) {
    notes.push("能量链 x2");
  }
  if (state.player.upgrades.critBoost) {
    const critCount = result.triggers.filter(trigger => trigger === "crit").length;
    if (critCount > 0) notes.push(`暴击链 +${critCount * 3}`);
  }
  return notes.length ? notes.join(" / ") : "当前还没有链式加成";
}

function applyEnemyPressure(round) {
  const enemy = state.battle.enemy;
  if (enemy.archetype === "punish_low" && round.final.damage <= 6) {
    state.battle.enemyCharge += 1;
    addLog("敌方成长", "这一手伤害太轻，它顺势涨了 1 层压制。");
  }
  if (enemy.archetype === "mixed") {
    if (round.final.damage <= 6) {
      state.battle.enemyCharge += 1;
      addLog("双向压制", "你这轮输出偏轻，它开始抬压制。");
    }
    if (round.final.energy >= 2) {
      state.battle.enemyCharge += 1;
      addLog("双向压制", "你这一手攒了太多能量，它也跟着提速。");
    }
  }
  if (enemy.archetype === "boss") {
    if (round.final.damage <= 8) {
      state.battle.enemyCharge += 1;
      addLog("终局高压", "Boss 觉得你这手不够狠，继续往上压。");
    }
    if (round.final.armor >= 6) {
      state.battle.enemyCharge += 1;
      addLog("终局高压", "你想靠护甲拖回合，它也会把压力抬高。");
    }
  }
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
          <strong>敌方压制</strong>
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
            <p class="drawer-title">强化</p>
            <div class="relic-list" id="relic-list"></div>
          </div>
        </details>
        <details class="drawer right">
          <summary>LOGS</summary>
          <div class="drawer-sheet">
            <p class="drawer-title">流派</p>
            <div class="log-list" id="build-list"></div>
            <p class="drawer-title" style="margin-top:12px">本手结算</p>
            <div class="calc-list" id="calc-list"></div>
            <p class="drawer-title" style="margin-top:12px">战斗日志</p>
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
        <div class="hud-item"><div class="hud-label">Damage</div><div class="hud-value damage" id="hud-damage"></div></div>
        <div class="hud-item"><div class="hud-label">Energy</div><div class="hud-value" id="hud-energy"></div></div>
        <div class="hud-item"><div class="hud-label">Armor</div><div class="hud-value" id="hud-armor"></div></div>
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

  const preview = calculateRoundResult();
  const enemy = state.battle.enemy;
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

  document.getElementById("hud-damage").textContent = String(preview.final.damage);
  document.getElementById("hud-energy").textContent = String(preview.final.energy);
  document.getElementById("hud-armor").textContent = String(preview.final.armor);
  document.getElementById("hud-rerolls").textContent = String(state.battle.rerollsRemaining);

  document.getElementById("settle-title").textContent = `结算触发 ${preview.final.damage}`;
  document.getElementById("settle-copy").textContent = preview.final.armor > 0
    ? `顺手拿 ${preview.final.armor} 护甲`
    : preview.final.energy > 0
      ? `顺手拿 ${preview.final.energy} 能量`
      : "先把这手兑现";

  const canEmergencyReroll = state.battle.rerollsRemaining <= 0 && state.player.pityTokens > 0;
  document.getElementById("reroll-title").textContent = canEmergencyReroll
    ? "拆筹码强续"
    : (state.battle.rerollsRemaining > 0 ? "继续扩链" : "本回合到头");
  document.getElementById("reroll-copy").textContent = canEmergencyReroll
    ? `强续一手 · ${getTargetTip(state.battle.dice)}`
    : state.battle.rerollsRemaining > 0
      ? `${getTargetTip(state.battle.dice)} · 重掷 ${rerollCount || 5} 枚`
      : "没有可用重掷";
  document.getElementById("reroll-btn").disabled = state.battle.rerollsRemaining <= 0 && !canEmergencyReroll;

  document.getElementById("dice-grid").innerHTML = state.battle.dice.map((die, index) => {
    const face = DIE_FACE[die.value];
    const className = [
      "die",
      `pos-${index}`,
      die.locked ? "locked" : "",
      die.locked ? "" : (die.value >= 5 ? "recommended" : ""),
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
    : `<div class="relic-card"><strong>空槽位</strong><span>战后拿强化，慢慢把连锁做出来。</span></div>`;

  document.getElementById("build-list").innerHTML = `
    <div class="log-card"><strong>当前流派</strong><span>${state.run.buildType}</span></div>
    <div class="log-card"><strong>怜悯筹码</strong><span>${state.player.pityTokens} 枚</span></div>
    <div class="log-card"><strong>当前护甲</strong><span>${state.player.armor}</span></div>
    <div class="log-card"><strong>本流派加成</strong><span>${getBuildBonusCopy(preview.final)}</span></div>
  `;

  document.getElementById("calc-list").innerHTML = [
    ["伤害", String(preview.final.damage)],
    ["能量", String(preview.final.energy)],
    ["护甲", String(preview.final.armor)],
    ["触发", preview.final.triggers.length ? preview.final.triggers.join(" / ") : "无"]
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
  addLog("新战斗", `${enemy.name} 上桌了。先看这轮是抢伤害、做能量链，还是立护甲。`);
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
  ui.shopCopy.textContent = `第 ${state.run.battleIndex + 1} 战结束，选 1 个强化，把这一局往一个触发方向推。`;
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
    : `这把停在第 ${state.run.battleIndex + 1} 战，但触发方向已经出来了。`;

  ui.summaryGrid.innerHTML = [
    ["已击败", `${state.run.enemiesDefeated}`],
    ["最高单手伤害", `${state.player.highestDamage}`],
    ["总伤害", `${state.player.totalDamage}`],
    ["流派", state.run.buildType]
  ].map(([label, value]) => `<div class="summary-box"><small>${label}</small><strong>${value}</strong></div>`).join("");

  ui.summaryList.innerHTML = [
    `怜悯筹码：${state.player.pityTokens} 枚`,
    `金币：${state.player.coins}`,
    `强化：${state.player.relics.map(relic => relic.name).join("、") || "无"}`
  ].map(text => `<div class="summary-item">${text}</div>`).join("");

  setScreen("summary");
}

function enemyAttack() {
  const incoming = getEnemyDamage();
  const blocked = Math.min(state.player.armor, incoming);
  const damage = incoming - blocked;

  state.player.armor = Math.max(0, state.player.armor - incoming);

  if (damage > 0) {
    state.player.hp = Math.max(0, state.player.hp - damage);
    state.player.pityTokens += 1;
    addLog("敌方反击", `${state.battle.enemy.name} 打了你 ${damage} 点。你拿到 1 枚怜悯筹码，下一轮还能续。`);
    showFloat(`-${damage}`, "#ff9aa3");
  } else {
    addLog("敌方反击", `这次伤害被护甲吃掉了，节奏还在你手里。`);
    showFloat("格挡", "#9ee7ff");
  }

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

function settleHand() {
  if (!state.battle) return;

  const round = calculateRoundResult();
  const totalDamage = round.final.damage;

  state.player.totalDamage += totalDamage;
  state.player.energy += round.final.energy;
  state.player.armor += round.final.armor;
  state.player.highestDamage = Math.max(state.player.highestDamage, totalDamage);

  state.battle.enemy.hp = Math.max(0, state.battle.enemy.hp - totalDamage);

  addLog("结算触发", `造成 ${totalDamage} 点伤害，同时拿到 ${round.final.energy} 能量、${round.final.armor} 护甲。`);
  addLog("链式反馈", getBuildBonusCopy(round.final));
  showFloat(`-${totalDamage}`, "#ffe49e");

  state.run.metrics.avg_damage += totalDamage;
  applyEnemyPressure(round);

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
      addLog("拆筹码", "拆 1 枚怜悯筹码，强行把这一轮连锁续下去。");
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

  addLog("继续扩链", `重掷了 ${actualTargets.length} 枚骰子，继续追更大的触发。`);
  renderBattle();

  setTimeout(() => {
    if (!state?.battle) return;
    state.battle.dice.forEach(die => {
      die.rolling = false;
    });
    renderBattle();
  }, 520);
}

function toggleDie(index) {
  if (!state?.battle) return;
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
    if (!button || !state) return;
    const offer = state.pendingOffers.find(item => item.id === button.dataset.offerId);
    if (!offer) return;
    offer.apply(state);
    state.run.metrics.reward_pick_rate[offer.id] = (state.run.metrics.reward_pick_rate[offer.id] || 0) + 1;
    syncBuildType();
    startBattle(state.run.battleIndex + 1);
  });
}

bindEvents();
