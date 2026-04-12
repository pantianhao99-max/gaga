const ENEMIES = [
  { name: "鼠巷混混", hp: 28, damage: 4, avatar: "🐀", intentText: "直接压血", flavor: "开局先试你一手底子。", archetype: "attack" },
  { name: "巷口守卫", hp: 38, damage: 5, avatar: "🛡️", intentText: "重掷会蓄力", flavor: "你每多重掷一次，它的下轮伤害就更高。", archetype: "punish_greed" },
  { name: "诈牌老千", hp: 52, damage: 7, avatar: "🃏", intentText: "低伤会成长", flavor: "这一手打太轻，它会顺势抬高压制。", archetype: "punish_low" },
  { name: "铁面发牌员", hp: 70, damage: 10, avatar: "🎲", intentText: "低伤 / 高能都吃", flavor: "你打得轻，或者能量滚太快，它都要反制。", archetype: "mixed" },
  { name: "赌桌本身", hp: 96, damage: 13, avatar: "🎰", intentText: "终局高压", flavor: "伤害不够，或者护甲太厚，它都会继续上压。", archetype: "boss", boss: true }
];

const OFFERS = [
  {
    id: "pairPlus",
    name: "双数强化",
    text: "双数收益更高",
    summary: "双数额外伤害提升到 +10。",
    apply(state) {
      state.player.upgrades.pairPlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.pair += 2;
    }
  },
  {
    id: "straightPlus",
    name: "连段强化",
    text: "连段更稳更赚",
    summary: "连段提升到 +12 伤害和 +6 护甲。",
    apply(state) {
      state.player.upgrades.straightPlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.straight += 2;
    }
  },
  {
    id: "triplePlus",
    name: "三同强化",
    text: "大招更狠",
    summary: "三同额外伤害提升到 +26。",
    apply(state) {
      state.player.upgrades.triplePlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.triple += 2;
    }
  },
  {
    id: "rerollRefundOnStraight",
    name: "连段回转",
    text: "连段返还重掷",
    summary: "触发连段后，下回合返还 1 次重掷。",
    apply(state) {
      state.player.upgrades.rerollRefundOnStraight = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.straight += 1;
    }
  },
  {
    id: "extraRerollOnce",
    name: "额外机会",
    text: "本场首掷免费",
    summary: "每场战斗第一次重掷不消耗次数。",
    apply(state) {
      state.player.upgrades.extraRerollOnce = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.pair += 1;
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
      relics: [],
      relicIds: new Set(),
      totalDamage: 0,
      highestDamage: 0,
      upgrades: {
        pairPlus: false,
        straightPlus: false,
        triplePlus: false,
        rerollRefundOnStraight: false,
        extraRerollOnce: false
      }
    },
    run: {
      battleIndex: 0,
      enemiesDefeated: 0,
      buildScores: { pair: 0, straight: 0, triple: 0 },
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
  const activeDice = dice.filter(die => !die.inactive);
  const faceGroups = [...getFaceGroups(activeDice).entries()]
    .map(([value, group]) => ({ value, size: group.length }))
    .sort((a, b) => b.size - a.size || b.value - a.value);
  const uniqueValues = [...new Set(activeDice.map(die => die.value))].sort((a, b) => a - b);
  const bestSequence = getLongestSequence(uniqueValues);
  const hasFullHouse = faceGroups.some(group => group.size === 3) && faceGroups.some(group => group.size === 2);

  if (faceGroups[0]?.size === 5) {
    return {
      comboType: "five",
      damage: 50,
      armor: 0,
      description: "五同触发",
      extraBursts: ["五同触发"]
    };
  }

  if (bestSequence.length === 5) {
    return {
      comboType: "straight5",
      damage: 22,
      armor: 10,
      description: "五连触发",
      extraBursts: ["五连触发"]
    };
  }

  if (faceGroups[0]?.size === 4) {
    return {
      comboType: "four",
      damage: 30,
      armor: 0,
      description: "四同触发",
      extraBursts: ["四同触发"]
    };
  }

  if (hasFullHouse) {
    return {
      comboType: "full",
      damage: 26,
      armor: 6,
      description: "满堂彩触发",
      extraBursts: ["满堂彩触发"]
    };
  }

  if (bestSequence.length >= 4) {
    return {
      comboType: "straight4",
      damage: 14,
      armor: 6,
      description: "四连触发",
      extraBursts: ["四连触发"]
    };
  }

  if (faceGroups[0]?.size === 3) {
    return {
      comboType: "triple",
      damage: 18,
      armor: 0,
      description: "三同触发",
      extraBursts: ["三同触发"]
    };
  }

  if (bestSequence.length >= 3) {
    return {
      comboType: "straight",
      damage: 8,
      armor: 4,
      description: "连段触发",
      extraBursts: ["连段触发"]
    };
  }

  if (faceGroups[0]?.size === 2) {
    return {
      comboType: "pair",
      damage: 6,
      armor: 0,
      description: "双数触发",
      extraBursts: ["双数触发"]
    };
  }

  return {
    comboType: null,
    damage: 0,
    armor: 0,
    description: "未触发",
    extraBursts: []
  };
}

function getLongestSequence(values) {
  if (!values.length) return [];

  let bestSequence = [];
  let currentSequence = [values[0]];

  for (let i = 1; i < values.length; i += 1) {
    if (values[i] === values[i - 1] + 1) {
      currentSequence.push(values[i]);
    } else {
      if (
        currentSequence.length > bestSequence.length ||
        (currentSequence.length === bestSequence.length && currentSequence[currentSequence.length - 1] > (bestSequence[bestSequence.length - 1] || 0))
      ) {
        bestSequence = [...currentSequence];
      }
      currentSequence = [values[i]];
    }
  }

  if (
    currentSequence.length > bestSequence.length ||
    (currentSequence.length === bestSequence.length && currentSequence[currentSequence.length - 1] > (bestSequence[bestSequence.length - 1] || 0))
  ) {
    bestSequence = [...currentSequence];
  }

  return bestSequence;
}

function applyBuildEffects(result) {
  const upgrades = state.player.upgrades;
  result.upgradeText = "";

  if (!["pair", "straight", "triple"].includes(result.comboType)) {
    return result;
  }

  if (result.comboType === "pair" && upgrades.pairPlus) {
    result.damage = 10;
    result.upgradeText = "双数强化";
    result.extraBursts = ["双数触发", "双数强化"];
  }

  if (result.comboType === "straight" && upgrades.straightPlus) {
    result.damage = 12;
    result.armor = 6;
    result.upgradeText = "连段强化";
    result.extraBursts = ["连段触发", "连段强化"];
  }

  if (result.comboType === "triple" && upgrades.triplePlus) {
    result.damage = 26;
    result.upgradeText = "三同强化";
    result.extraBursts = ["三同触发", "三同强化"];
  }

  return result;
}

function calculateRoundResult() {
  const base = resolveDice(state.battle.dice);
  const final = applyBuildEffects({
    damage: base.damage,
    armor: base.armor,
    comboType: base.comboType,
    description: base.description,
    extraBursts: [...base.extraBursts]
  });

  return {
    base,
    final
  };
}

function getFaceGroups(dice) {
  const groups = new Map();
  dice.forEach(die => {
    if (!groups.has(die.value)) groups.set(die.value, []);
    groups.get(die.value).push(die);
  });
  return groups;
}

function getSequencePlan(dice) {
  const uniqueValues = [...new Set(dice.map(die => die.value))].sort((a, b) => a - b);
  if (uniqueValues.length < 2) return null;

  const valueSet = new Set(uniqueValues);
  let bestPlan = null;

  for (let length = 5; length >= 3; length -= 1) {
    for (let start = 1; start <= 7 - length; start += 1) {
      const window = Array.from({ length }, (_, index) => start + index);
      const present = window.filter(value => valueSet.has(value));
      const missing = window.filter(value => !valueSet.has(value));

      if (!bestPlan && missing.length === 0) {
        bestPlan = {
          sequence: window,
          length,
          target: null,
          gap: null,
          completed: true
        };
      }

      if (missing.length === 1 && present.length === length - 1) {
        return {
          sequence: present,
          length,
          target: missing[0],
          gap: missing[0],
          completed: false
        };
      }
    }
  }

  return bestPlan;
}

function getRecommendedIndexesFromValues(dice, values, excluded = [], limit = 2) {
  const excludedSet = new Set(excluded);
  const indexes = [];

  values.forEach(value => {
    dice.forEach(die => {
      if (indexes.length >= limit) return;
      if (die.value !== value || die.locked || excludedSet.has(die.index)) return;
      excludedSet.add(die.index);
      indexes.push(die.index);
    });
  });

  return indexes;
}

function getDicePlan(currentState = state, preview = null) {
  const dice = currentState.battle?.dice?.filter(die => !die.inactive) || [];
  const roundPreview = preview || (currentState.battle ? calculateRoundResult() : null);
  const damage = roundPreview?.final?.damage ?? 0;
  const comboType = roundPreview?.final?.comboType ?? null;

  if (!dice.length) {
    return {
      targetText: "这手偏散 · 重掷",
      settleCopy: "先吃收益",
      rerollCopy: "找组合",
      recommendedIndexes: []
    };
  }

  const faceGroups = [...getFaceGroups(dice).entries()]
    .map(([value, group]) => ({ value, group }))
    .sort((a, b) => b.group.length - a.group.length || b.value - a.value);
  const topGroup = faceGroups[0];
  const pairGroups = faceGroups.filter(group => group.group.length >= 2);
  const shouldBank = damage >= 10;
  const sequencePlan = getSequencePlan(dice);

  if (comboType === "five") {
    return {
      targetText: "五同已成 · 直接收",
      settleCopy: "稳稳收下",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "straight5") {
    return {
      targetText: "五连已成 · 先收",
      settleCopy: "稳稳收下",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "four") {
    return {
      targetText: "四同已成 · 先收",
      settleCopy: "稳稳收下",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "full") {
    return {
      targetText: damage >= 20 ? "满堂彩已成 → 直接收" : "高阶组合已成 → 收下爆发",
      settleCopy: "稳稳收下",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "straight4") {
    return {
      targetText: shouldBank ? "四连已成 · 先收" : "四连已成 · 可收",
      settleCopy: shouldBank ? "稳稳收下" : "先吃收益",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "triple") {
    return {
      targetText: "三同已成 · 先收",
      settleCopy: "稳稳收下",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (comboType === "straight") {
    return {
      targetText: shouldBank ? "连段已成 · 先收" : "连段已成 · 可收",
      settleCopy: shouldBank ? "稳稳收下" : "先吃收益",
      rerollCopy: "再赌一手",
      recommendedIndexes: []
    };
  }

  if (topGroup?.group.length === 4) {
    return {
      targetText: `再出1个${topGroup.value} → 五同！`,
      settleCopy: shouldBank ? "稳稳收下" : `打出 ${damage} 伤害`,
      rerollCopy: "再赌一手",
      recommendedIndexes: getRecommendedIndexesFromValues(dice, [topGroup.value], [], 2)
    };
  }

  if (topGroup?.group.length === 3) {
    return {
      targetText: `再出1个${topGroup.value} → 四同`,
      settleCopy: shouldBank ? "稳稳收下" : `打出 ${damage} 伤害`,
      rerollCopy: "冲三同",
      recommendedIndexes: getRecommendedIndexesFromValues(dice, [topGroup.value], [], 2)
    };
  }

  if (comboType === "pair" && pairGroups.length >= 2) {
    return {
      targetText: shouldBank ? "两组收益已成 · 先收" : "双对子已成 · 可稳收",
      settleCopy: shouldBank ? "稳稳收下" : "先吃收益",
      rerollCopy: shouldBank ? "再赌一手" : "可赌更大",
      recommendedIndexes: []
    };
  }

  if (comboType === "pair" && topGroup?.group.length >= 2) {
    const pairValue = topGroup.value;
    const bonusValues = dice
      .filter(die => die.value !== pairValue && !die.locked)
      .sort((a, b) => b.value - a.value)
      .slice(0, 1)
      .map(die => die.value);
    const recommendedIndexes = getRecommendedIndexesFromValues(dice, [pairValue, ...bonusValues], [], 2);

    return {
      targetText: pairValue >= 5 ? `双${pairValue}已成 · 冲三同` : `再出1个${pairValue} → 大爆发`,
      settleCopy: shouldBank ? "稳稳收下" : `打出 ${damage} 伤害`,
      rerollCopy: "冲三同",
      recommendedIndexes
    };
  }

  if (sequencePlan?.target && sequencePlan.length >= 5) {
    const recommendedIndexes = getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], 2);
    return {
      targetText: `再出${sequencePlan.target} → 五连！`,
      settleCopy: damage >= 7 ? "先吃收益" : `打出 ${damage} 伤害`,
      rerollCopy: "补连段",
      recommendedIndexes
    };
  }

  if (sequencePlan?.target && sequencePlan.length >= 4) {
    const recommendedIndexes = getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], 2);
    return {
      targetText: `再出${sequencePlan.target} → 四连`,
      settleCopy: damage >= 7 ? "先吃收益" : `打出 ${damage} 伤害`,
      rerollCopy: "补连段",
      recommendedIndexes
    };
  }

  if (sequencePlan?.target && sequencePlan.length >= 3) {
    const recommendedIndexes = getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], 2);
    return {
      targetText: `再出${sequencePlan.target} → 连段成型`,
      settleCopy: damage >= 7 ? "先吃收益" : `打出 ${damage} 伤害`,
      rerollCopy: "补连段",
      recommendedIndexes
    };
  }

  const sortedDice = [...dice].sort((a, b) => b.value - a.value || a.index - b.index);
  const scatterValues = sortedDice.filter(die => !die.locked && die.value >= 5).slice(0, 1).map(die => die.value);
  const recommendedIndexes = getRecommendedIndexesFromValues(dice, scatterValues, [], 1);

  return {
    targetText: "这手偏散 · 重掷",
    settleCopy: damage >= 7 ? `打出 ${damage} 伤害` : "先吃收益",
    rerollCopy: recommendedIndexes.length ? "找组合" : "再赌一手",
    recommendedIndexes
  };
}

function getCurrentTargetText(currentState) {
  return getDicePlan(currentState).targetText;
}

function getDieStatus(die, currentState, dice) {
  if (die.locked) return "locked";

  const plan = getDicePlan(currentState);
  if (plan.recommendedIndexes.includes(die.index)) return "recommended";

  return "normal";
}

function getDiceLayout(index, total) {
  const maxPerRow = 3;
  const totalColumns = 6;
  const span = 2;
  const row = Math.floor(index / maxPerRow);
  const indexInRow = index % maxPerRow;
  const itemsBeforeRow = row * maxPerRow;
  const itemsInRow = Math.min(maxPerRow, total - itemsBeforeRow);
  const startColumn = Math.floor((totalColumns - itemsInRow * span) / 2) + 1;

  return {
    row: row + 1,
    column: startColumn + indexInRow * span
  };
}

function getDieTag(status) {
  if (status === "locked") return "锁定";
  if (status === "recommended") return "推荐";
  return "";
}

function syncBuildType() {
  const ranking = Object.entries(state.run.buildScores).sort((a, b) => b[1] - a[1])[0];
  if (!ranking || ranking[1] <= 0) {
    state.run.buildType = "未成型";
    return;
  }
  const map = {
    pair: "双数流",
    straight: "连段流",
    triple: "三同流"
  };
  state.run.buildType = map[ranking[0]];
}

function getBuildBonusCopy(result) {
  const notes = [];
  if (result.comboType === "five") {
    notes.push("五同触发");
  }
  if (result.comboType === "straight5") {
    notes.push("五连触发");
  }
  if (result.comboType === "four") {
    notes.push("四同触发");
  }
  if (result.comboType === "full") {
    notes.push("满堂彩触发");
  }
  if (result.comboType === "straight4") {
    notes.push("四连触发");
  }
  if (result.comboType === "pair") {
    notes.push(result.upgradeText || "双数触发");
  }
  if (result.comboType === "straight") {
    notes.push(result.upgradeText || "连段触发");
  }
  if (result.comboType === "triple") {
    notes.push(result.upgradeText || "三同触发");
  }
  if (state.player.upgrades.rerollRefundOnStraight && result.comboType === "straight") {
    notes.push("下回合返还重掷");
  }
  if (state.player.upgrades.extraRerollOnce) {
    notes.push("本场首掷免费");
  }
  return notes.length ? notes.join(" / ") : "当前还没有组合加成";
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
          <strong id="enemy-intent-title"></strong>
          <span id="enemy-intent-copy"></span>
        </div>
      </section>

      <section class="target-bar" id="target-bar"></section>

      <div class="drawer-rail">
        <details class="drawer left">
          <summary>强化</summary>
          <div class="drawer-sheet">
            <p class="drawer-title">强化</p>
            <div class="relic-list" id="relic-list"></div>
          </div>
        </details>
        <details class="drawer right">
          <summary>记录</summary>
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

      <div class="combo-hit combo-hit-main" id="combo-hit" hidden></div>

      <section class="battle-hud">
        <div class="hud-item"><div class="hud-label">伤害</div><div class="hud-value damage" id="hud-damage"></div></div>
        <div class="hud-item"><div class="hud-label">组合</div><div class="hud-value" id="hud-combo"></div></div>
        <div class="hud-item"><div class="hud-label">护甲</div><div class="hud-value" id="hud-armor"></div></div>
        <div class="hud-item"><div class="hud-label">重掷</div><div class="hud-value" id="hud-rerolls"></div></div>
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
  const plan = getDicePlan(state, preview);
  const enemy = state.battle.enemy;
  const lockedCount = state.battle.dice.filter(die => die.locked && !die.inactive).length;

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
  document.getElementById("enemy-intent-title").textContent = `本回合敌人攻击 ${getEnemyDamage()}`;
  document.getElementById("enemy-intent-copy").textContent = enemy.flavor;
  document.getElementById("target-bar").textContent = getCurrentTargetText(state);
  document.getElementById("dice-lock-summary").textContent = `已锁 ${lockedCount} / 5 · 还可继续选择`;

  document.getElementById("hud-damage").textContent = String(preview.final.damage);
  const comboLabelMap = {
    five: "五同",
    straight5: "五连",
    four: "四同",
    full: "满堂彩",
    straight4: "四连",
    triple: "三同",
    straight: "三连",
    pair: "双数",
    none: "未成型"
  };
  document.getElementById("hud-combo").textContent = comboLabelMap[preview.final.comboType] || comboLabelMap.none;
  document.getElementById("hud-armor").textContent = String(preview.final.armor);
  document.getElementById("hud-rerolls").textContent = String(state.battle.rerollsRemaining);

  document.getElementById("settle-title").textContent = "直接结算";
  document.getElementById("settle-copy").textContent = plan.settleCopy;

  const canEmergencyReroll = state.battle.rerollsRemaining <= 0 && state.player.pityTokens > 0;
  document.getElementById("reroll-title").textContent = canEmergencyReroll
    ? "继续重掷"
    : (state.battle.rerollsRemaining > 0 ? "继续重掷" : "本回合到头");
  document.getElementById("reroll-copy").textContent = canEmergencyReroll
    ? "再赌一手"
    : state.battle.rerollsRemaining > 0
      ? plan.rerollCopy
      : "没有可用重掷";
  document.getElementById("reroll-btn").disabled = state.battle.rerollsRemaining <= 0 && !canEmergencyReroll;

  const diceRows = Math.max(1, Math.ceil(state.battle.dice.length / 3));
  const diceStage = document.querySelector(".dice-stage");
  const diceGrid = document.getElementById("dice-grid");
  diceStage?.style.setProperty("--dice-rows", String(diceRows));
  diceGrid.style.setProperty("--dice-rows", String(diceRows));
  diceGrid.innerHTML = state.battle.dice.map((die, index) => {
    const status = getDieStatus(die, state, state.battle.dice);
    const dieTag = getDieTag(status);
    const layout = getDiceLayout(index, state.battle.dice.length);

    const className = [
      "die",
      `die-${status}`,
      die.rolling ? "rolling" : "",
      die.toggled ? "toggled" : "",
      die.inactive ? "inactive" : ""
    ].filter(Boolean).join(" ");

    return `<button class="${className}" type="button" data-die-index="${die.index}" style="grid-column:${layout.column} / span 2;grid-row:${layout.row};" ${die.inactive ? "disabled" : ""}>
      ${dieTag ? `<span class="die-tag">${dieTag}</span>` : ""}
      <span class="die-value">${die.inactive ? "×" : die.value}</span>
    </button>`;
  }).join("");

  document.getElementById("relic-list").innerHTML = state.player.relics.length
    ? state.player.relics.map(relic => `<div class="relic-card"><strong>${relic.name}</strong><span>${relic.text}</span></div>`).join("")
    : `<div class="relic-card"><strong>空槽位</strong><span>战后拿强化，慢慢把组合做出来。</span></div>`;

  document.getElementById("build-list").innerHTML = `
    <div class="log-card"><strong>当前流派</strong><span>${state.run.buildType}</span></div>
    <div class="log-card"><strong>怜悯筹码</strong><span>${state.player.pityTokens} 枚</span></div>
    <div class="log-card"><strong>当前护甲</strong><span>${state.player.armor}</span></div>
    <div class="log-card"><strong>本流派加成</strong><span>${getBuildBonusCopy(preview.final)}</span></div>
  `;

  const comboHitNode = document.getElementById("combo-hit");
  const comboHitTextMap = {
    five: "五同！",
    four: "四同！",
    straight5: "五连！",
    straight4: "四连！",
    full: "满堂彩！",
    straight: "连段已成！",
    pair: "双数触发",
    triple: "三同触发！"
  };
  const comboHitText = comboHitTextMap[preview.final.comboType];
  if (comboHitNode) {
    comboHitNode.hidden = !comboHitText;
    comboHitNode.textContent = comboHitText || "";
  }

  const burstText = preview.final.extraBursts.length
    ? preview.final.extraBursts.join(" / ")
    : "无";
  document.getElementById("calc-list").innerHTML = `
    <div class="calc-row calc-row-block">
      <span>本手伤害 ${preview.final.damage}</span>
      <strong>护甲 +${preview.final.armor}</strong>
    </div>
    <div class="calc-row calc-row-block">
      <span>原因说明</span>
      <strong>${burstText}</strong>
    </div>
  `;

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
    freeRerollUsed: false,
    straightRefundPending: false,
    enemyCharge: 0,
    failChain: 0,
    safetyUsed: false
  };
  addLog("新战斗", `${enemy.name} 上桌了。先看这轮是收收益、补组合，还是先站稳。`);
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
  state.battle.rerollsRemaining = 2 + (state.battle.straightRefundPending ? 1 : 0);
  state.battle.rerollsUsed = 0;
  state.battle.straightRefundPending = false;
  renderBattle();
}

function settleHand() {
  if (!state.battle) return;

  const round = calculateRoundResult();
  const totalDamage = round.final.damage;

  state.player.totalDamage += totalDamage;
  state.player.armor += round.final.armor;
  state.player.highestDamage = Math.max(state.player.highestDamage, totalDamage);

  state.battle.enemy.hp = Math.max(0, state.battle.enemy.hp - totalDamage);

  addLog("结算触发", `造成 ${totalDamage} 点伤害，同时拿到 ${round.final.armor} 护甲。`);
  addLog("组合反馈", round.final.extraBursts.length ? round.final.extraBursts.join(" / ") : getBuildBonusCopy(round.final));

  if (state.player.upgrades.rerollRefundOnStraight && round.final.comboType === "straight") {
    state.battle.straightRefundPending = true;
    addLog("连段回转", "下回合返还 1 次重掷。");
  }

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

  const canUseFreeReroll = !free && state.player.upgrades.extraRerollOnce && !state.battle.freeRerollUsed;

  if (!free && !canUseFreeReroll && state.battle.rerollsRemaining <= 0) {
    if (state.player.pityTokens > 0) {
      state.player.pityTokens -= 1;
      state.battle.rerollsRemaining += 1;
      addLog("拆筹码", "拆 1 枚怜悯筹码，强行把这一轮续下去。");
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
    const useFreeReroll = canUseFreeReroll;
    if (useFreeReroll) {
      state.battle.freeRerollUsed = true;
      addLog("额外机会", "本场首次重掷免费。");
    } else {
      state.battle.rerollsRemaining -= 1;
    }
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
