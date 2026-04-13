const ENEMIES = [
  { name: "\u8857\u5934\u6df7\u6df7", hp: 28, damage: 4, avatar: "\ud83d\udde1", intentText: "\u76f4\u63a5\u538b\u8840", flavor: "\u5f00\u5c40\u5148\u8bd5\u4f60\u4e00\u624b\u5e95\u5b50\u3002", archetype: "attack" },
  { name: "\u5df7\u53e3\u5b88\u536b", hp: 38, damage: 5, avatar: "\ud83d\udee1", intentText: "\u91cd\u63b7\u4f1a\u84c4\u529b", flavor: "\u4f60\u6bcf\u591a\u91cd\u63b7\u4e00\u6b21\uff0c\u5b83\u7684\u4e0b\u8f6e\u4f24\u5bb3\u5c31\u66f4\u9ad8\u3002", archetype: "punish_greed" },
  { name: "\u8bc8\u724c\u8001\u5343", hp: 52, damage: 7, avatar: "\ud83c\udfb2", intentText: "\u4f4e\u4f24\u4f1a\u6210\u957f", flavor: "\u8fd9\u4e00\u624b\u6253\u592a\u8f7b\uff0c\u5b83\u4f1a\u987a\u52bf\u62ac\u9ad8\u538b\u5236\u3002", archetype: "punish_low" },
  { name: "\u94c1\u9762\u53d1\u724c\u5458", hp: 70, damage: 10, avatar: "\ud83c\udccf", intentText: "\u4f4e\u4f24 / \u8d2a\u63b7\u90fd\u5403", flavor: "\u4f60\u6253\u5f97\u8f7b\uff0c\u6216\u8005\u91cd\u63b7\u592a\u591a\uff0c\u5b83\u90fd\u4f1a\u53cd\u5236\u3002", archetype: "mixed" },
  { name: "\u8d4c\u684c\u672c\u8eab", hp: 96, damage: 13, avatar: "\ud83d\udc41", intentText: "\u7ec8\u5c40\u9ad8\u538b", flavor: "\u8f93\u51fa\u4e0d\u591f\uff0c\u6216\u8005\u62a4\u7532\u592a\u539a\uff0c\u5b83\u90fd\u4f1a\u7ee7\u7eed\u4e0a\u538b\u3002", archetype: "boss", boss: true }
];

const OFFERS = [
  {
    id: "pairPlus",
    name: "\u53cc\u6570\u5f3a\u5316",
    text: "\u53cc\u6570\u6536\u76ca\u66f4\u9ad8",
    summary: "\u53cc\u6570\u989d\u5916\u4f24\u5bb3\u63d0\u5347\u5230 +10\u3002",
    apply(state) {
      state.player.upgrades.pairPlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.pair += 2;
    }
  },
  {
    id: "straightPlus",
    name: "\u8fde\u6bb5\u5f3a\u5316",
    text: "\u8fde\u6bb5\u66f4\u7a33\u66f4\u8d5a",
    summary: "\u8fde\u6bb5\u63d0\u5347\u5230 +12 \u4f24\u5bb3\u548c +6 \u62a4\u7532\u3002",
    apply(state) {
      state.player.upgrades.straightPlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.straight += 2;
    }
  },
  {
    id: "triplePlus",
    name: "\u4e09\u540c\u5f3a\u5316",
    text: "\u5927\u62db\u66f4\u72e0",
    summary: "\u4e09\u540c\u989d\u5916\u4f24\u5bb3\u63d0\u5347\u5230 +26\u3002",
    apply(state) {
      state.player.upgrades.triplePlus = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.triple += 2;
    }
  },
  {
    id: "rerollRefundOnStraight",
    name: "\u8fde\u6bb5\u56de\u8f6c",
    text: "\u8fde\u6bb5\u8fd4\u8fd8\u91cd\u63b7",
    summary: "\u89e6\u53d1\u8fde\u6bb5\u540e\uff0c\u4e0b\u56de\u5408\u8fd4\u8fd8 1 \u6b21\u91cd\u63b7\u3002",
    apply(state) {
      state.player.upgrades.rerollRefundOnStraight = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.straight += 1;
    }
  },
  {
    id: "extraRerollOnce",
    name: "\u989d\u5916\u673a\u4f1a",
    text: "\u672c\u573a\u9996\u63b7\u514d\u8d39",
    summary: "\u6bcf\u573a\u6218\u6597\u7b2c\u4e00\u6b21\u91cd\u63b7\u4e0d\u6d88\u8017\u6b21\u6570\u3002",
    apply(state) {
      state.player.upgrades.extraRerollOnce = true;
      state.player.relics.push(this);
      state.player.relicIds.add(this.id);
      state.run.buildScores.pair += 1;
    }
  }
];

const FALLBACK_OFFERS = [
  {
    id: "healPulse",
    name: "\u7f13\u53e3\u6c14",
    text: "\u56de\u590d 8 \u70b9\u751f\u547d",
    summary: "\u62ff\u5b8c\u5f3a\u5316\u540e\uff0c\u7528\u5b83\u628a\u72b6\u6001\u62c9\u56de\u6765\u3002",
    apply(state) {
      const healed = Math.min(8, state.player.maxHp - state.player.hp);
      state.player.hp += healed;
      addLog("\u7f13\u53e3\u6c14", healed > 0 ? `\u56de\u590d\u4e86 ${healed} \u70b9\u751f\u547d\u3002` : "\u751f\u547d\u5df2\u6ee1\uff0c\u8fd9\u6b21\u53ea\u662f\u7a33\u4f4f\u8282\u594f\u3002");
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
  summaryKicker: document.getElementById("summary-kicker"),
  summaryTitle: document.getElementById("summary-title"),
  summaryCopy: document.getElementById("summary-copy"),
  summaryGrid: document.getElementById("summary-grid"),
  summaryList: document.getElementById("summary-list"),
  damageFloat: document.getElementById("damage-float"),
  enemyAlertFloat: document.getElementById("enemy-alert-float")
};

let state = null;

function makeInitialState() {
  return {
    screen: "title",
    player: {
      maxHp: 46,
      hp: 46,
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
      buildType: "\u672a\u6210\u578b",
      logs: [],
      metrics: {
        reroll_count: 0,
        avg_damage: 0,
        hands_settled: 0,
        reward_pick_rate: {}
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

function showEnemyAlert(text) {
  if (!ui.enemyAlertFloat) return;
  ui.enemyAlertFloat.textContent = text;
  ui.enemyAlertFloat.classList.remove("show");
  void ui.enemyAlertFloat.offsetWidth;
  ui.enemyAlertFloat.classList.add("show");
  setTimeout(() => ui.enemyAlertFloat.classList.remove("show"), 820);
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
    displayValue: null,
    pendingValue: null,
    locked: false,
    rolling: false,
    toggled: false,
    inactive: false
  })).map(die => ({
    ...die,
    displayValue: die.value
  }));
}

function getEnemyDamage() {
  if (!state.battle) return 0;
  let damage = state.battle.enemy.damage + state.battle.enemyCharge;
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
  const pairGroups = faceGroups.filter(group => group.size === 2);

  if (faceGroups[0]?.size === 5) {
    return { comboType: "five", damage: 50, armor: 0, description: "\u4e94\u540c\u89e6\u53d1", extraBursts: ["\u4e94\u540c\u89e6\u53d1"] };
  }
  if (bestSequence.length === 5) {
    return { comboType: "straight5", damage: 28, armor: 10, description: "\u4e94\u8fde\u89e6\u53d1", extraBursts: ["\u4e94\u8fde\u89e6\u53d1"] };
  }
  if (faceGroups[0]?.size === 4) {
    return { comboType: "four", damage: 34, armor: 0, description: "\u56db\u540c\u89e6\u53d1", extraBursts: ["\u56db\u540c\u89e6\u53d1"] };
  }
  if (hasFullHouse) {
    return { comboType: "full", damage: 26, armor: 6, description: "\u6ee1\u5802\u5f69\u89e6\u53d1", extraBursts: ["\u6ee1\u5802\u5f69\u89e6\u53d1"] };
  }
  if (pairGroups.length >= 2) {
    return { comboType: "twoPair", damage: 12, armor: 2, description: "\u53cc\u5bf9\u5b50\u89e6\u53d1", extraBursts: ["\u53cc\u5bf9\u5b50\u89e6\u53d1"] };
  }
  if (bestSequence.length >= 4) {
    return { comboType: "straight4", damage: 18, armor: 5, description: "\u56db\u8fde\u89e6\u53d1", extraBursts: ["\u56db\u8fde\u89e6\u53d1"] };
  }
  if (faceGroups[0]?.size === 3) {
    return { comboType: "triple", damage: 18, armor: 0, description: "\u4e09\u540c\u89e6\u53d1", extraBursts: ["\u4e09\u540c\u89e6\u53d1"] };
  }
  if (bestSequence.length >= 3) {
    return { comboType: "straight", damage: 8, armor: 3, description: "\u8fde\u6bb5\u89e6\u53d1", extraBursts: ["\u8fde\u6bb5\u89e6\u53d1"] };
  }
  if (faceGroups[0]?.size === 2) {
    return { comboType: "pair", damage: 5, armor: 0, description: "\u53cc\u6570\u89e6\u53d1", extraBursts: ["\u53cc\u6570\u89e6\u53d1"] };
  }
  return { comboType: null, damage: 0, armor: 0, description: "\u672a\u89e6\u53d1", extraBursts: [] };
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
    result.damage = 11;
    result.upgradeText = "双数强化";
    result.extraBursts = ["双数触发", "双数强化"];
  }

  if (result.comboType === "straight" && upgrades.straightPlus) {
    result.damage = 13;
    result.armor = 6;
    result.upgradeText = "连段强化";
    result.extraBursts = ["连段触发", "连段强化"];
  }

  if (result.comboType === "triple" && upgrades.triplePlus) {
    result.damage = 28;
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

function getGroupIndexes(group, limit = group.length) {
  return group
    .filter(die => !die.locked)
    .slice(0, limit)
    .map(die => die.index);
}

function hasUnlockedDice(dice) {
  return dice.some(die => !die.locked && !die.inactive);
}

function isStraightFamily(comboType) {
  return ["straight", "straight4", "straight5"].includes(comboType);
}

function getSettlePreviewText(result) {
  if (!result) return "\u9020\u6210 0 \u4f24\u5bb3";
  if (result.armor > 0) return `\u9020\u6210 ${result.damage} \u4f24\u5bb3 \u00b7 \u83b7\u5f97 ${result.armor} \u62a4\u7532`;
  return `\u9020\u6210 ${result.damage} \u4f24\u5bb3`;
}

function getDicePlan(currentState = state, preview = null) {
  const dice = currentState.battle?.dice?.filter(die => !die.inactive) || [];
  const roundPreview = preview || (currentState.battle ? calculateRoundResult() : null);
  const comboType = roundPreview?.final?.comboType ?? null;

  if (!dice.length) {
    return { targetText: "这手先稳也行", rerollCopy: "可继续搏更大", recommendedIndexes: [] };
  }

  const faceGroups = [...getFaceGroups(dice).entries()]
    .map(([value, group]) => ({ value, group }))
    .sort((a, b) => b.group.length - a.group.length || b.value - a.value);
  const topGroup = faceGroups[0];
  const pairGroups = faceGroups.filter(group => group.group.length === 2);
  const sequencePlan = getSequencePlan(dice);
  const settledCopy = comboType
    ? {
        five: { targetText: "这手已经能收", rerollCopy: "还可再搏" },
        straight5: { targetText: "五连已成", rerollCopy: "还可再搏" },
        four: { targetText: "四同够狠了", rerollCopy: "还可再搏" },
        full: { targetText: "满堂彩能收", rerollCopy: "还可再搏" },
        straight4: { targetText: "四连已经不亏", rerollCopy: "可补五连" },
        triple: { targetText: "三同先稳也行", rerollCopy: "可冲四同" },
        straight: { targetText: "连段已成", rerollCopy: "可补四连" },
        twoPair: { targetText: "双对已经有货", rerollCopy: "可冲更大" }
      }[comboType]
    : null;

  if (settledCopy) {
    return { ...settledCopy, recommendedIndexes: [] };
  }

  if (topGroup?.group.length === 4) return { targetText: `留 ${topGroup.value}，可冲五同`, rerollCopy: "可冲五同", recommendedIndexes: getGroupIndexes(topGroup.group) };
  if (topGroup?.group.length === 3) return { targetText: `留 ${topGroup.value}，可冲四同`, rerollCopy: "可冲四同", recommendedIndexes: getGroupIndexes(topGroup.group) };
  if (pairGroups.length >= 2) return { targetText: "双对先留，可冲更大", rerollCopy: "可冲三同", recommendedIndexes: pairGroups.flatMap(group => group.group.map(die => die.index)) };
  if (comboType === "pair" && topGroup?.group.length >= 2) return { targetText: `优先留 ${topGroup.value}`, rerollCopy: "可冲三同", recommendedIndexes: getGroupIndexes(topGroup.group) };
  if (sequencePlan?.target && sequencePlan.length >= 5) return { targetText: `差 ${sequencePlan.target}，可补五连`, rerollCopy: "可补五连", recommendedIndexes: getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], sequencePlan.sequence.length) };
  if (sequencePlan?.target && sequencePlan.length >= 4) return { targetText: `差 ${sequencePlan.target}，可补四连`, rerollCopy: "可补四连", recommendedIndexes: getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], sequencePlan.sequence.length) };
  if (sequencePlan?.target && sequencePlan.length >= 3) return { targetText: "连段有苗头", rerollCopy: "可补顺子", recommendedIndexes: getRecommendedIndexesFromValues(dice, sequencePlan.sequence, [], sequencePlan.sequence.length) };

  return { targetText: "这手先稳也行", rerollCopy: "可继续搏更大", recommendedIndexes: [] };
}

function getCurrentTargetText(currentState) {
  return getDicePlan(currentState).targetText;
}

function getRiskHint(preview) {
  if (!state?.battle || !preview?.final) return "";
  const enemy = state.battle.enemy;
  const damage = preview.final.damage;
  const armor = preview.final.armor;

  if (!hasUnlockedDice(state.battle.dice)) return "先解锁一枚";
  if (state.battle.rerollsRemaining <= 0 && state.player.pityTokens <= 0) return "这轮没法再掷";

  if (enemy.archetype === "punish_greed") {
    return state.battle.enemyCharge > 0 ? "再贪会更痛" : "重掷会涨压";
  }
  if (enemy.archetype === "punish_low") {
    return damage <= 6 ? "低伤会被反打" : "这手暂时安全";
  }
  if (enemy.archetype === "mixed") {
    if (damage <= 4) return "低伤会被追罚";
    return state.battle.rerollsUsed > 0 ? "再贪会涨压" : "先手还能试探";
  }
  if (enemy.archetype === "boss") {
    if (armor >= 6 && damage <= 8) return "高甲低伤都吃罚";
    if (armor >= 6) return "高甲也会吃罚";
    if (damage <= 8) return "低伤会涨压";
    return "Boss 压力稳住了";
  }
  return preview.final.comboType ? "这手可以收" : "再掷仍有风险";
}

function getDieStatus(die, currentState) {
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
  return { row: row + 1, column: startColumn + indexInRow * span };
}

function getDieTag(status) {
  if (status === "locked") return "\u9501\u5b9a";
  if (status === "recommended") return "\u7559";
  return "";
}

function syncBuildType() {
  const ranking = Object.entries(state.run.buildScores).sort((a, b) => b[1] - a[1])[0];
  if (!ranking || ranking[1] <= 0) {
    state.run.buildType = "\u672a\u6210\u578b";
    return;
  }
  const map = { pair: "\u53cc\u6570\u6d41", straight: "\u8fde\u6bb5\u6d41", triple: "\u4e09\u540c\u6d41" };
  state.run.buildType = map[ranking[0]];
}

function getBuildBonusCopy(result) {
  const notes = [];
  if (result.comboType === "five") notes.push("\u4e94\u540c\u89e6\u53d1");
  if (result.comboType === "straight5") notes.push("\u4e94\u8fde\u89e6\u53d1");
  if (result.comboType === "four") notes.push("\u56db\u540c\u89e6\u53d1");
  if (result.comboType === "full") notes.push("\u6ee1\u5802\u5f69\u89e6\u53d1");
  if (result.comboType === "straight4") notes.push("\u56db\u8fde\u89e6\u53d1");
  if (result.comboType === "twoPair") notes.push("\u53cc\u5bf9\u5b50\u89e6\u53d1");
  if (result.comboType === "pair") notes.push(result.upgradeText || "\u53cc\u6570\u89e6\u53d1");
  if (result.comboType === "straight") notes.push(result.upgradeText || "\u8fde\u6bb5\u89e6\u53d1");
  if (result.comboType === "triple") notes.push(result.upgradeText || "\u4e09\u540c\u89e6\u53d1");
  if (state.player.upgrades.rerollRefundOnStraight && isStraightFamily(result.comboType)) notes.push("\u4e0b\u56de\u5408\u8fd4\u8fd8\u91cd\u63b7");
  if (state.player.upgrades.extraRerollOnce && state.battle && !state.battle.freeRerollUsed) notes.push("\u672c\u573a\u9996\u63b7\u514d\u8d39");
  if (state.player.upgrades.extraRerollOnce && state.battle?.freeRerollUsed) notes.push("\u672c\u573a\u9996\u63b7\u514d\u8d39\uff08\u5df2\u7528\uff09");
  return notes.length ? notes.join(" / ") : "\u5f53\u524d\u8fd8\u6ca1\u6709\u7ec4\u5408\u52a0\u6210";
}

function applyHighTierComboRewards(round) {
  if (!round?.final?.comboType) return;

  if (round.final.comboType === "four") {
    state.player.pityTokens += 1;
    addLog("\u9ad8\u9636\u5956\u52b1", "\u56db\u540c\u6210\u7acb\uff0c\u989d\u5916\u62ff\u5230 1 \u679a\u601c\u609f\u7b79\u7801\u3002");
    return;
  }

  if (round.final.comboType === "full") {
    state.player.armor += 4;
    addLog("\u9ad8\u9636\u5956\u52b1", "\u6ee1\u5802\u5f69\u6210\u7acb\uff0c\u989d\u5916\u83b7\u5f97 4 \u62a4\u7532\u3002");
    return;
  }

  if (["five", "straight5"].includes(round.final.comboType)) {
    state.battle.straightRefundPending = true;
    addLog("\u9ad8\u9636\u5956\u52b1", "\u9ad8\u9636\u7ec4\u5408\u6210\u7acb\uff0c\u4e0b\u56de\u5408\u989d\u5916\u8fd4\u8fd8 1 \u6b21\u91cd\u63b7\u3002");
  }
}

function applyEnemyPressure(round) {
  if (!state?.battle?.enemy || !round?.final) return;

  const enemy = state.battle.enemy;
  const damage = round.final.damage;
  const armor = round.final.armor;

  if (enemy.archetype === "punish_low" && damage <= 6) {
    state.battle.enemyCharge += 1;
    addLog("\u654c\u65b9\u53cd\u5236", "\u4f4e\u4f24\u89e6\u53d1\u654c\u4eba\u6210\u957f\uff0c\u84c4\u529b +1\u3002");
    showEnemyAlert("\u4f4e\u4f24\u89e6\u53d1\u53cd\u5236");
    return;
  }

  if (enemy.archetype === "mixed" && damage <= 4) {
    state.battle.enemyCharge += 1;
    addLog("\u654c\u65b9\u53cd\u5236", "\u4f60\u8fd9\u624b\u6253\u5f97\u592a\u8f7b\uff0c\u6df7\u5408\u654c\u4eba\u84c4\u529b +1\u3002");
    showEnemyAlert("\u4f4e\u4f24\u89e6\u53d1\u53cd\u5236");
    return;
  }

  if (enemy.archetype === "boss" && (damage <= 8 || armor >= 6)) {
    state.battle.enemyCharge += 1;
    addLog("\u654c\u65b9\u53cd\u5236", "\u8f93\u51fa\u504f\u4f4e\u6216\u62a4\u7532\u8fc7\u9ad8\uff0cBoss \u538b\u529b +1\u3002");
    showEnemyAlert("Boss \u538b\u529b\u5347\u7ea7");
  }
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
    rollAnimation: null,
    comboFlashTimeout: null
  };
  addLog("\u65b0\u6218\u6597", `${enemy.name} \u4e0a\u684c\u4e86\u3002\u5148\u770b\u8fd9\u8f6e\u662f\u76f4\u63a5\u6536\u3001\u8865\u7ec4\u5408\uff0c\u8fd8\u662f\u5148\u7ad9\u7a33\u3002`);
  setScreen("battle");
  buildBattleScreen();
  renderBattle();
}

function chooseOffers() {
  const pool = OFFERS.filter(offer => !state.player.relicIds.has(offer.id));
  if (!pool.length) {
    state.pendingOffers = [...FALLBACK_OFFERS];
    return;
  }
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

function getOfferTheme(offer) {
  if (["straightPlus", "rerollRefundOnStraight"].includes(offer.id)) {
    return {
      type: "\u8fde\u6bb5\u6d41",
      className: "reward-card--straight",
      hook: offer.id === "straightPlus" ? "\u8fde\u6bb5\u66f4\u7a33 \u00b7 \u5f53\u524d\u66f4\u5bb9\u6613\u6210\u578b" : "\u8fde\u6bb5\u80fd\u56de\u8f6c \u00b7 \u5f53\u524d\u66f4\u5bb9\u6613\u6210\u578b",
      impactValue: "+12",
      impactMeta: offer.id === "straightPlus" ? "\u4f24\u5bb3 \u00b7 +6 \u62a4\u7532" : "\u8fd4\u8fd8 1 \u6b21\u91cd\u63b7",
      buttonLabel: "\u9009\u8fd9\u4e2a"
    };
  }

  if (["triplePlus"].includes(offer.id)) {
    return {
      type: "\u4e09\u540c\u6d41",
      className: "reward-card--triple",
      hook: "\u5927\u62db\u66f4\u731b \u00b7 \u8d4c\u4e2d\u5c31\u662f\u7206\u53d1",
      impactValue: "+26",
      impactMeta: "\u4f24\u5bb3",
      buttonLabel: "\u9009\u8fd9\u4e2a"
    };
  }

  if (["pairPlus", "extraRerollOnce"].includes(offer.id)) {
    return {
      type: "\u53cc\u6570\u6d41",
      className: "reward-card--pair",
      hook: offer.id === "pairPlus" ? "\u53cc\u6570\u66f4\u80fd\u6536 \u00b7 \u6b62\u635f\u66f4\u7a33" : "\u9996\u63b7\u66f4\u6562\u8d4c \u00b7 \u7ee7\u7eed\u8bd5\u4e00\u6b21",
      impactValue: offer.id === "pairPlus" ? "+10" : "+1",
      impactMeta: offer.id === "pairPlus" ? "\u4f24\u5bb3" : "\u9996\u63b7\u514d\u8d39",
      buttonLabel: "\u9009\u8fd9\u4e2a"
    };
  }

  return {
    type: "\u8c03\u6574",
    className: "reward-card--utility",
    hook: "\u5148\u7a33\u4e00\u624b \u00b7 \u7acb\u5373\u56de\u590d",
    impactValue: "+8",
    impactMeta: "\u751f\u547d",
    buttonLabel: "\u9009\u8fd9\u4e2a"
  };
}

function showShop() {
  chooseOffers();
  ui.shopGrid.innerHTML = state.pendingOffers.map(offer => {
    const theme = getOfferTheme(offer);
    return `
    <article class="reward-card ${theme.className}">
      <div class="reward-main">
        <h3 class="reward-name">${offer.name}</h3>
        <p class="reward-hook">${theme.hook}</p>
      </div>
      <div class="reward-impact">
        <div class="reward-impact-value">${theme.impactValue}</div>
        <div class="reward-impact-meta">${theme.impactMeta}</div>
      </div>
      <button class="reward-btn" type="button" data-offer-id="${offer.id}">${theme.buttonLabel}</button>
    </article>
  `;
  }).join("");
  setScreen("shop");
}

function showSummary(victory) {
  syncBuildType();
  ui.summaryKicker.textContent = victory ? "\u901a\u5173" : "\u8d25\u5c40";
  ui.summaryTitle.textContent = victory ? "\u8fd9\u4e00\u5c40\u6253\u7a7f\u4e86" : "\u8fd9\u628a\u5230\u6b64\u4e3a\u6b62";
  ui.summaryCopy.textContent = victory ? `\u4f60\u5e26\u7740 ${state.run.buildType} \u8d70\u5230\u4e86\u6700\u540e\u3002` : `\u8fd9\u628a\u505c\u5728\u7b2c ${state.run.battleIndex + 1} \u6218\uff0c\u4f46\u89e6\u53d1\u65b9\u5411\u5df2\u7ecf\u51fa\u6765\u4e86\u3002`;
  ui.summaryGrid.innerHTML = [["\u5df2\u51fb\u8d25", `${state.run.enemiesDefeated}`],["\u6700\u9ad8\u5355\u624b\u4f24\u5bb3", `${state.player.highestDamage}`],["\u603b\u4f24\u5bb3", `${state.player.totalDamage}`],["\u6d41\u6d3e", state.run.buildType]].map(([label, value]) => `<div class="summary-box"><small>${label}</small><strong>${value}</strong></div>`).join("");
  ui.summaryList.innerHTML = [`\u601c\u609f\u7b79\u7801\uff1a${state.player.pityTokens} \u679a`,`\u5f3a\u5316\uff1a${state.player.relics.map(relic => relic.name).join("\u3001") || "\u65e0"}`].map(text => `<div class="summary-item">${text}</div>`).join("");
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
    addLog("\u654c\u65b9\u53cd\u51fb", `${state.battle.enemy.name} \u6253\u4e86\u4f60 ${damage} \u70b9\u3002\u4f60\u62ff\u5230 1 \u679a\u601c\u609f\u7b79\u7801\u3002`);
    showFloat(`-${damage}`, "#ff9aa3");
  } else {
    addLog("\u654c\u65b9\u53cd\u51fb", "\u8fd9\u6b21\u4f24\u5bb3\u88ab\u62a4\u7532\u5403\u6389\u4e86\uff0c\u8282\u594f\u8fd8\u5728\u4f60\u624b\u91cc\u3002");
    showFloat("\u683c\u6321", "#9ee7ff");
  }
  shakeCabinet();
  if (state.player.hp <= 0) { showSummary(false); return; }
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
  addLog("\u7ed3\u7b97\u89e6\u53d1", `\u9020\u6210 ${totalDamage} \u70b9\u4f24\u5bb3\uff0c\u83b7\u5f97 ${round.final.armor} \u62a4\u7532\u3002`);
  addLog("\u7ec4\u5408\u53cd\u9988", round.final.extraBursts.length ? round.final.extraBursts.join(" / ") : getBuildBonusCopy(round.final));
  if (state.player.upgrades.rerollRefundOnStraight && isStraightFamily(round.final.comboType)) { state.battle.straightRefundPending = true; addLog("\u8fde\u6bb5\u56de\u8f6c", "\u4e0b\u56de\u5408\u8fd4\u8fd8 1 \u6b21\u91cd\u63b7\u3002"); }
  showFloat(`-${totalDamage}`, "#ffe49e");
  state.run.metrics.hands_settled += 1;
  state.run.metrics.avg_damage = state.player.totalDamage / state.run.metrics.hands_settled;
  applyHighTierComboRewards(round);
  applyEnemyPressure(round);
  if (state.battle.enemy.hp <= 0) {
    state.run.enemiesDefeated += 1;
    if (state.run.battleIndex === ENEMIES.length - 1) { showSummary(true); return; }
    showShop();
    return;
  }
  enemyAttack();
}

function buildBattleScreen() {
  ui.battle.innerHTML = `
    <div class="battle-shell">
      <section class="battle-topbar"><div class="topbar-head"><div class="enemy-title"><div class="enemy-name" id="enemy-title-name"></div><div class="enemy-stage" id="enemy-stage-copy"></div></div><div class="topbar-pills"><div class="pill" id="enemy-level-pill"></div></div></div><div class="enemy-row"><div class="enemy-avatar" id="enemy-avatar"></div><div class="enemy-main"><div class="enemy-meta"><div class="enemy-meta-left"><strong id="enemy-name-copy"></strong><div class="trait-tag" id="enemy-trait"></div></div><div class="enemy-hp-value" id="enemy-hp-value"></div></div><div class="hp-track"><div class="hp-fill enemy" id="enemy-hp-fill"></div></div></div></div><div class="player-strip"><div class="player-chip" id="player-chip"></div><div class="player-hp-group"><strong id="player-hp-value"></strong><div class="mini-track"><div class="hp-fill player" id="player-hp-fill"></div></div></div></div><div class="drawer-rail"><details class="drawer left"><summary>\u5f3a\u5316</summary><div class="drawer-sheet"><p class="drawer-title">\u5f3a\u5316</p><div class="relic-list" id="relic-list"></div></div></details><details class="drawer right"><summary>\u8bb0\u5f55</summary><div class="drawer-sheet"><p class="drawer-title">\u6d41\u6d3e</p><div class="log-list" id="build-list"></div><p class="drawer-title" style="margin-top:12px">\u672c\u624b\u7ed3\u7b97</p><div class="calc-list" id="calc-list"></div><p class="drawer-title" style="margin-top:12px">\u6218\u6597\u65e5\u5fd7</p><div class="log-list" id="log-list"></div></div></details></div></section>
      <section class="enemy-intent"><div class="intent-copy"><strong id="enemy-intent-title"></strong><span id="enemy-intent-copy"></span></div></section>
      <section class="target-bar" id="target-bar"></section>
      <section class="risk-bar" id="risk-bar"></section>
      <section class="dice-shell"><div class="dice-status"><strong id="dice-lock-summary"></strong></div><div class="dice-stage"><div class="combo-hit combo-hit-main" id="combo-hit" hidden></div><div class="dice-grid" id="dice-grid"></div></div></section>
      <section class="battle-hud"><div class="hud-item"><div class="hud-label">\u4f24\u5bb3</div><div class="hud-value damage" id="hud-damage"></div></div><div class="hud-item"><div class="hud-label">\u7ec4\u5408</div><div class="hud-value" id="hud-combo"></div></div><div class="hud-item"><div class="hud-label">\u62a4\u7532</div><div class="hud-value" id="hud-armor"></div></div><div class="hud-item"><div class="hud-label">\u91cd\u63b7</div><div class="hud-value" id="hud-rerolls"></div></div></section>
      <section class="battle-actions"><button class="action-btn safe" id="settle-btn" type="button"><strong id="settle-title"></strong><span id="settle-copy"></span></button><button class="action-btn risk" id="reroll-btn" type="button"><strong id="reroll-title"></strong><span id="reroll-copy"></span></button></section>
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
  document.getElementById("enemy-stage-copy").textContent = `\u7b2c ${state.run.battleIndex + 1} / ${ENEMIES.length} \u6218`;
  document.getElementById("enemy-level-pill").textContent = `Lv ${state.run.battleIndex + 1}`;
  document.getElementById("enemy-avatar").textContent = enemy.avatar;
  document.getElementById("enemy-name-copy").textContent = enemy.name;
  document.getElementById("enemy-trait").textContent = state.battle.enemyCharge > 0 ? `\u84c4\u529b ${state.battle.enemyCharge}` : enemy.intentText;
  document.getElementById("enemy-hp-value").textContent = `${enemy.hp} / ${enemy.maxHp}`;
  document.getElementById("enemy-hp-fill").style.width = `${Math.max(0, enemy.hp / enemy.maxHp * 100)}%`;
  document.getElementById("player-chip").textContent = `\u751f\u547d ${state.player.hp}`;
  document.getElementById("player-hp-value").textContent = `${state.player.hp} / ${state.player.maxHp}`;
  document.getElementById("player-hp-fill").style.width = `${Math.max(0, state.player.hp / state.player.maxHp * 100)}%`;
  document.getElementById("enemy-intent-title").textContent = `\u672c\u56de\u5408\u654c\u4eba\u653b\u51fb ${getEnemyDamage()}`;
  document.getElementById("enemy-intent-copy").textContent = enemy.flavor;
  document.getElementById("target-bar").textContent = getCurrentTargetText(state);
  document.getElementById("risk-bar").textContent = getRiskHint(preview);
  document.getElementById("dice-lock-summary").textContent = `\u5df2\u9501 ${lockedCount} / 5 \u00b7 \u8fd8\u53ef\u7ee7\u7eed\u9009\u62e9`;
  document.getElementById("hud-damage").textContent = String(preview.final.damage);
  const comboLabelMap = { five: "\u4e94\u540c", straight5: "\u4e94\u8fde", four: "\u56db\u540c", full: "\u6ee1\u5802\u5f69", straight4: "\u56db\u8fde", triple: "\u4e09\u540c", straight: "\u4e09\u8fde", twoPair: "\u53cc\u5bf9\u5b50", pair: "\u53cc\u6570", none: "\u6563\u724c" };
  document.getElementById("hud-combo").textContent = comboLabelMap[preview.final.comboType] || comboLabelMap.none;
  document.getElementById("hud-combo").classList.toggle("combo-accent", preview.final.comboType !== null);
  document.getElementById("hud-armor").textContent = String(preview.final.armor);
  document.getElementById("hud-rerolls").textContent = String(state.battle.rerollsRemaining);
  document.getElementById("settle-title").textContent = "\u76f4\u63a5\u7ed3\u7b97";
  document.getElementById("settle-copy").textContent = getSettlePreviewText(preview.final);
  const canEmergencyReroll = state.battle.rerollsRemaining <= 0 && state.player.pityTokens > 0;
  document.getElementById("reroll-title").textContent = canEmergencyReroll ? "\u7ee7\u7eed\u91cd\u63b7" : (state.battle.rerollsRemaining > 0 ? "\u7ee7\u7eed\u91cd\u63b7" : "\u672c\u56de\u5408\u5230\u5934");
  document.getElementById("reroll-copy").textContent = canEmergencyReroll ? "\u518d\u8d4c\u66f4\u5927" : state.battle.rerollsRemaining > 0 ? (!hasUnlockedDice(state.battle.dice) ? "\u5148\u89e3\u9501\u81f3\u5c11 1 \u679a\u9ab0\u5b50" : plan.rerollCopy) : "\u6ca1\u6709\u53ef\u7528\u91cd\u63b7";
  document.getElementById("reroll-btn").disabled = state.battle.rerollsRemaining <= 0 && !canEmergencyReroll;
  const diceRows = Math.max(1, Math.ceil(state.battle.dice.length / 3));
  const diceStage = document.querySelector(".dice-stage");
  const diceGrid = document.getElementById("dice-grid");
  diceStage?.style.setProperty("--dice-rows", String(diceRows));
  diceGrid.style.setProperty("--dice-rows", String(diceRows));
  diceGrid.innerHTML = state.battle.dice.map((die, index) => {
    const status = getDieStatus(die, state);
    const dieTag = getDieTag(status);
    const layout = getDiceLayout(index, state.battle.dice.length);
    const className = ["die", `die-${status}`, die.rolling ? "rolling" : "", die.toggled ? "toggled" : "", die.inactive ? "inactive" : ""].filter(Boolean).join(" ");
    return `<button class="${className}" type="button" data-die-index="${die.index}" style="grid-column:${layout.column} / span 2;grid-row:${layout.row};" ${die.inactive ? "disabled" : ""}>${dieTag ? `<span class="die-tag">${dieTag}</span>` : ""}<span class="die-value">${die.inactive ? "\u00d7" : (die.displayValue ?? die.value)}</span></button>`;
  }).join("");
  document.getElementById("relic-list").innerHTML = state.player.relics.length ? state.player.relics.map(relic => `<div class="relic-card"><strong>${relic.name}</strong><span>${relic.text}</span></div>`).join("") : `<div class="relic-card"><strong>\u6682\u65e0\u5f3a\u5316</strong><span>\u6218\u540e\u62ff\u5f3a\u5316\uff0c\u6162\u6162\u628a\u7ec4\u5408\u505a\u51fa\u6765\u3002</span></div>`;
  document.getElementById("build-list").innerHTML = `<div class="log-card"><strong>\u5f53\u524d\u6d41\u6d3e</strong><span>${state.run.buildType}</span></div><div class="log-card"><strong>\u601c\u609f\u7b79\u7801</strong><span>${state.player.pityTokens} \u679a</span></div><div class="log-card"><strong>\u5f53\u524d\u62a4\u7532</strong><span>${state.player.armor}</span></div><div class="log-card"><strong>\u672c\u6d41\u6d3e\u52a0\u6210</strong><span>${getBuildBonusCopy(preview.final)}</span></div>`;
  const comboHitNode = document.getElementById("combo-hit");
  const comboHitTextMap = { five: "\u4e94\u540c\uff01", four: "\u56db\u540c\uff01", straight5: "\u4e94\u8fde\uff01", straight4: "\u56db\u8fde\uff01", full: "\u6ee1\u5802\u5f69\uff01", triple: "\u4e09\u540c\u89e6\u53d1\uff01", straight: "\u8fde\u6bb5\u5df2\u6210\uff01", twoPair: "\u53cc\u5bf9\u5b50\uff01", pair: "\u53cc\u6570\u89e6\u53d1" };
  const comboHitText = comboHitTextMap[preview.final.comboType];
  if (comboHitNode) {
    comboHitNode.hidden = !comboHitText;
    comboHitNode.textContent = comboHitText || "";
    comboHitNode.classList.toggle("combo-hit-elite", ["four", "five", "straight4", "straight5", "full"].includes(preview.final.comboType));
    comboHitNode.classList.remove("combo-hit-pulse");
    if (comboHitText) { void comboHitNode.offsetWidth; comboHitNode.classList.add("combo-hit-pulse"); }
  }
  if (diceStage) {
    const hitTier = ["five", "straight5", "four"].includes(preview.final.comboType)
      ? "combo-elite-hit"
      : ["straight4", "full"].includes(preview.final.comboType)
        ? "combo-flash"
        : "";
    diceStage.classList.remove("combo-flash", "combo-elite-hit");
    if (state.battle.comboFlashTimeout) clearTimeout(state.battle.comboFlashTimeout);
    if (hitTier && !state.battle.dice.some(die => die.rolling)) {
      void diceStage.offsetWidth;
      diceStage.classList.add(hitTier);
      state.battle.comboFlashTimeout = setTimeout(() => {
        const currentStage = document.querySelector(".dice-stage");
        if (!state?.battle || !currentStage) return;
        currentStage.classList.remove("combo-flash", "combo-elite-hit");
        state.battle.comboFlashTimeout = null;
      }, 420);
    }
  }
  const burstText = preview.final.extraBursts.length ? preview.final.extraBursts.join(" / ") : "\u65e0";
  document.getElementById("calc-list").innerHTML = `<div class="calc-row calc-row-block"><span>\u672c\u624b\u4f24\u5bb3 ${preview.final.damage}</span><strong>\u62a4\u7532 +${preview.final.armor}</strong></div><div class="calc-row"><span>\u7ec4\u5408\u7ed3\u7b97</span><strong>${preview.final.description}</strong></div><div class="calc-row"><span>\u547d\u4e2d\u53cd\u9988</span><strong>${burstText}</strong></div>`;
  document.getElementById("log-list").innerHTML = state.run.logs.length ? state.run.logs.map(item => `<div class="log-card"><strong>${item.title}</strong><span>${item.text}</span></div>`).join("") : `<div class="log-card"><strong>\u6682\u65e0\u65e5\u5fd7</strong><span>\u8fd9\u4e00\u624b\u8fd8\u6ca1\u843d\u684c\u3002</span></div>`;
}

function rerollUnlockedDice(free = false) {
  if (!state.battle) return;
  if (state.battle.dice.some(die => die.rolling)) return;
  const canUseFreeReroll = !free && state.player.upgrades.extraRerollOnce && !state.battle.freeRerollUsed;
  if (!free && !canUseFreeReroll && state.battle.rerollsRemaining <= 0) {
    if (state.player.pityTokens > 0) {
      state.player.pityTokens -= 1;
      state.battle.rerollsRemaining += 1;
      addLog("\u62c6\u7b79\u7801", "\u62c6 1 \u679a\u601c\u609f\u7b79\u7801\uff0c\u5f3a\u884c\u628a\u8fd9\u4e00\u8f6e\u7eed\u4e0b\u53bb\u3002");
    } else { return; }
  }
  if (!hasUnlockedDice(state.battle.dice)) {
    showFloat("\u5148\u89e3\u9501", "#9ee7ff");
    renderBattle();
    return;
  }
  const actualTargets = state.battle.dice.filter(die => !die.locked && !die.inactive);
  actualTargets.forEach(die => {
    die.rolling = true;
    die.pendingValue = rollDie();
  });
  if (!free) {
    const useFreeReroll = canUseFreeReroll;
    if (useFreeReroll) { state.battle.freeRerollUsed = true; addLog("\u989d\u5916\u673a\u4f1a", "\u672c\u573a\u9996\u6b21\u91cd\u63b7\u514d\u8d39\u3002"); }
    else { state.battle.rerollsRemaining -= 1; }
    state.battle.rerollsUsed += 1;
    state.run.metrics.reroll_count += 1;
    const archetype = state.battle.enemy.archetype;
    const shouldChargeOnReroll =
      archetype === "punish_greed" ||
      archetype === "boss" ||
      (archetype === "mixed" && state.battle.rerollsUsed > 1);
    if (shouldChargeOnReroll) {
      state.battle.enemyCharge += 1;
      const alertMap = { punish_greed: "\u654c\u4eba\u84c4\u529b +1", mixed: "\u518d\u8d2a\u4f1a\u6da8\u538b", boss: "Boss \u538b\u529b\u5347\u7ea7" };
      showEnemyAlert(alertMap[archetype]);
    }
  }
  addLog("\u7ee7\u7eed\u91cd\u63b7", `\u91cd\u63b7 ${actualTargets.length} \u679a\u9ab0\u5b50`);
  renderBattle();
  if (state.battle.rollAnimation?.intervalId) clearInterval(state.battle.rollAnimation.intervalId);
  if (state.battle.rollAnimation?.timeoutId) clearTimeout(state.battle.rollAnimation.timeoutId);
  const intervalId = setInterval(() => {
    if (!state?.battle) return;
    actualTargets.forEach(die => {
      if (die.rolling) die.displayValue = rollDie();
    });
    renderBattle();
  }, 80);
  const timeoutId = setTimeout(() => {
    if (!state?.battle) return;
    clearInterval(intervalId);
    actualTargets.forEach(die => {
      die.value = die.pendingValue ?? die.value;
      die.displayValue = die.value;
      die.pendingValue = null;
      die.rolling = false;
    });
    state.battle.rollAnimation = null;
    renderBattle();
  }, 480);
  state.battle.rollAnimation = { intervalId, timeoutId };
}

function toggleDie(index) {
  if (!state?.battle) return;
  const die = state.battle.dice[index];
  if (!die || die.inactive || die.rolling) return;
  die.locked = !die.locked;
  die.toggled = true;
  showFloat(die.locked ? "\u5df2\u9501" : "\u5df2\u89e3", die.locked ? "#baf7d7" : "#b9d8ff");
  renderBattle();
  setTimeout(() => { if (!state?.battle?.dice[index]) return; state.battle.dice[index].toggled = false; renderBattle(); }, 220);
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
    if (dieButton) { toggleDie(Number(dieButton.dataset.dieIndex)); return; }
    if (event.target.closest("#reroll-btn")) { rerollUnlockedDice(false); return; }
    if (event.target.closest("#settle-btn")) { settleHand(); }
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
