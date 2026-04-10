const RESOURCE_META = {
  wood: { label: "wood", short: "WD", color: "#9e7c58" },
  stone: { label: "stone", short: "ST", color: "#8aa1ab" },
  berries: { label: "berries", short: "BR", color: "#ce7b7f" },
  relics: { label: "relics", short: "RL", color: "#f1c56f" },
};

const NODE_META = {
  Resource: { icon: "RS", tone: "Supplies" },
  Event: { icon: "EV", tone: "Story" },
  Battle: { icon: "BT", tone: "Combat" },
  Rest: { icon: "RT", tone: "Recovery" },
  Treasure: { icon: "TR", tone: "Reward" },
};

const ANIMAL_LIBRARY = {
  bunny: {
    id: "bunny",
    name: "Bunny Scout",
    role: "Trailblazer",
    hp: 38,
    power: 14,
    skill: "Hop Dash",
    trait: "Reveals safer route reads and speeds up the team.",
    battleText: "Darts in with a quick paw strike.",
    tag: "Scout",
  },
  bear: {
    id: "bear",
    name: "Bear Cub Forager",
    role: "Gatherer",
    hp: 52,
    power: 18,
    skill: "Berry Guard",
    trait: "Finds extra wood and berries while keeping morale high.",
    battleText: "Shields the party and lands a sturdy swipe.",
    tag: "Forager",
  },
  fox: {
    id: "fox",
    name: "Fox Tinkerer",
    role: "Crafter",
    hp: 42,
    power: 20,
    skill: "Spark Gadget",
    trait: "Builds improvised tools for relic hunts and burst damage.",
    battleText: "Triggers a bright gadget burst.",
    tag: "Tinkerer",
  },
};

const BUILDING_BLUEPRINTS = {
  camp: {
    id: "camp",
    name: "Camp",
    effectBase: "Raises team max HP for expeditions.",
    bonus: "Each level adds +6 team HP to new runs.",
    level: 2,
    cost: { wood: 12, stone: 6, berries: 5 },
  },
  garden: {
    id: "garden",
    name: "Garden",
    effectBase: "Grows berries and keeps the village cheerful.",
    bonus: "Each level adds +3 berries on return.",
    level: 1,
    cost: { wood: 8, stone: 4, berries: 7 },
  },
  workshop: {
    id: "workshop",
    name: "Workshop",
    effectBase: "Improves relic handling and gadget power.",
    bonus: "Each level boosts battle reward quality.",
    level: 1,
    cost: { wood: 10, stone: 10, berries: 4 },
  },
};

const RELIC_LIBRARY = [
  {
    id: "moss-compass",
    name: "Moss Compass",
    rarity: "Rare",
    unlocked: true,
    description: "A soft-glowing compass that points toward kinder paths.",
  },
  {
    id: "sunseed-brooch",
    name: "Sunseed Brooch",
    rarity: "Epic",
    unlocked: false,
    description: "A bright charm said to help gardens bloom overnight.",
  },
  {
    id: "hollow-bell",
    name: "Hollow Bell",
    rarity: "Uncommon",
    unlocked: true,
    description: "Rings with a tiny hum whenever treasure is nearby.",
  },
];

const ROUTE_TEMPLATE = [
  {
    type: "Resource",
    title: "Fernwood Grove",
    description: "A quiet grove hides fresh branches and sweet berry bushes.",
    choices: [
      {
        label: "Gather wood bundles",
        sublabel: "+10 wood for the pack",
        effect: { loot: { wood: 10 }, morale: 3 },
        note: "The team bundled smooth branches for the Camp stores.",
      },
      {
        label: "Pick ripe berries",
        sublabel: "+8 berries and a cheerful snack break",
        effect: { loot: { berries: 8 }, heal: 4, morale: 5 },
        note: "Bear Cub found a berry patch and shared the haul.",
      },
    ],
  },
  {
    type: "Event",
    title: "Lantern Burrow",
    description: "A mole trader waves from a lantern cart full of odds and ends.",
    choices: [
      {
        label: "Trade trail stories",
        sublabel: "+6 stone and morale boost",
        effect: { loot: { stone: 6 }, morale: 6 },
        note: "The trader swapped stones for a charming village tale.",
      },
      {
        label: "Inspect tiny curios",
        sublabel: "Find one relic fragment",
        effect: { loot: { relics: 1 }, relic: "sunseed-brooch", morale: 2 },
        note: "Fox Tinkerer recognized a hidden relic tucked in the cart.",
      },
    ],
  },
  {
    type: "Battle",
    title: "Thistle Thief",
    description: "A bramble boar blocks the path and guards a pile of scavenged goods.",
    enemy: {
      name: "Thistle Thief",
      hp: 74,
    },
    reward: { wood: 6, stone: 8, berries: 4, relics: 0 },
    rewardNote: "The boar dropped gathered supplies after a short scuffle.",
  },
  {
    type: "Rest",
    title: "Mossy Campfire",
    description: "A small fire pit still glows under a bed of moss.",
    choices: [
      {
        label: "Brew soup together",
        sublabel: "+12 team HP and +8 morale",
        effect: { heal: 12, morale: 8 },
        note: "A shared soup break warmed the team back up.",
      },
      {
        label: "Press onward with tea",
        sublabel: "+4 berries and a smaller recovery",
        effect: { loot: { berries: 4 }, heal: 6, morale: 4 },
        note: "The party packed a quick tea and kept the run brisk.",
      },
    ],
  },
  {
    type: "Treasure",
    title: "Starlit Cache",
    description: "A moonlit chest rests beside a root shrine at the ridge summit.",
    choices: [
      {
        label: "Open the carved chest",
        sublabel: "+1 relic, +12 wood, +10 stone",
        effect: { loot: { relics: 1, wood: 12, stone: 10 }, relic: "moss-compass", morale: 6 },
        note: "The shrine rewarded the team with supplies and a glowing relic.",
      },
      {
        label: "Leave an offering first",
        sublabel: "+1 relic, +8 berries, extra village warmth",
        effect: { loot: { relics: 1, berries: 8, stone: 4 }, relic: "hollow-bell", morale: 10 },
        note: "A respectful offering earned a gentler but rarer blessing.",
      },
    ],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const state = {
  currentScreen: "launch",
  activeCodexTab: "animals",
  selectedBuilding: "camp",
  resources: {
    wood: 38,
    stone: 24,
    berries: 29,
    relics: 4,
  },
  buildings: clone(BUILDING_BLUEPRINTS),
  selectedTeam: ["bunny", "bear", "fox"],
  records: {
    completedRuns: 12,
    bestDepth: 5,
    villageRank: 4,
    cataloguedEntries: 9,
    favoriteSeason: "Bloom Season",
  },
  relics: clone(RELIC_LIBRARY),
  expedition: null,
};

const screenEls = [...document.querySelectorAll(".screen")];
const bottomNav = document.getElementById("bottom-nav");
const overlayLayer = document.getElementById("overlay-layer");
const eventModal = document.getElementById("event-modal");
const battleModal = document.getElementById("battle-modal");
const toastStack = document.getElementById("toast-stack");

function getAnimals() {
  return Object.values(ANIMAL_LIBRARY);
}

function getSelectedAnimals() {
  return state.selectedTeam.map((id) => ANIMAL_LIBRARY[id]);
}

function campBonusHp() {
  return state.buildings.camp.level * 6;
}

function gardenReturnBonus() {
  return state.buildings.garden.level * 3;
}

function workshopPowerBonus() {
  return state.buildings.workshop.level * 2;
}

function computeTeamPower() {
  return getSelectedAnimals().reduce((total, animal) => total + animal.power, 0) + workshopPowerBonus();
}

function computeTeamMaxHp() {
  return getSelectedAnimals().reduce((total, animal) => total + animal.hp, 0) + campBonusHp();
}

function resourceDeltaToText(delta) {
  return Object.entries(delta)
    .filter(([, amount]) => amount)
    .map(([key, amount]) => `+${amount} ${RESOURCE_META[key].label}`)
    .join(" / ");
}

function renderResources(targetId, resources, delta = null) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.innerHTML = Object.keys(RESOURCE_META)
    .map((key) => {
      const meta = RESOURCE_META[key];
      const deltaValue = delta?.[key] || 0;
      return `
        <div class="resource-chip">
          <div class="resource-icon" style="background:${meta.color}">${meta.short}</div>
          <div class="resource-copy">
            <span>${meta.label}</span>
            <strong>${resources[key] || 0}</strong>
          </div>
          <div class="resource-delta">${deltaValue > 0 ? `+${deltaValue}` : ""}</div>
        </div>
      `;
    })
    .join("");
}

function animalAvatarMarkup(id) {
  return `
    <div class="animal-avatar ${id}">
      <div class="avatar-art ${id}"></div>
    </div>
  `;
}

function renderVillage() {
  renderResources("village-resource-bar", state.resources);

  document.getElementById("team-count-chip").textContent = `${state.selectedTeam.length} selected`;

  document.getElementById("village-building-scene").innerHTML = Object.values(state.buildings)
    .map(
      (building) => `
        <button
          class="building-card ${state.selectedBuilding === building.id ? "active" : ""}"
          data-action="open-building"
          data-building="${building.id}"
        >
          <div class="building-crest ${building.id}"></div>
          <div class="building-copy">
            <strong>${building.name}</strong>
            <span class="role-pill">Lv ${building.level}</span>
            <p>${building.effectBase}</p>
          </div>
        </button>
      `
    )
    .join("");

  document.getElementById("village-animal-grid").innerHTML = getAnimals()
    .map((animal) => {
      const selected = state.selectedTeam.includes(animal.id);
      return `
        <button
          class="animal-card ${selected ? "selected" : ""}"
          data-action="toggle-animal"
          data-animal="${animal.id}"
        >
          ${animalAvatarMarkup(animal.id)}
          <div class="animal-copy">
            <div class="animal-name-row">
              <strong>${animal.name}</strong>
              <span class="role-pill">${animal.tag}</span>
            </div>
            <p>${animal.trait}</p>
          </div>
          <div class="selection-pill">${selected ? "Ready" : "Resting"}</div>
        </button>
      `;
    })
    .join("");
}

function renderSquad() {
  document.getElementById("route-preview-strip").innerHTML = ROUTE_TEMPLATE.map(
    (node) => `<div class="route-preview-node">${NODE_META[node.type].icon}<br>${node.type}</div>`
  ).join("");

  document.getElementById("animal-selection-grid").innerHTML = getAnimals()
    .map((animal) => {
      const selected = state.selectedTeam.includes(animal.id);
      const dimmed = !selected && state.selectedTeam.length >= 3;
      return `
        <button
          class="animal-card ${selected ? "selected" : ""} ${dimmed ? "dimmed" : ""}"
          data-action="toggle-animal"
          data-animal="${animal.id}"
        >
          ${animalAvatarMarkup(animal.id)}
          <div class="animal-copy">
            <div class="animal-name-row">
              <strong>${animal.name}</strong>
              <span class="role-pill">${animal.role}</span>
            </div>
            <p>${animal.trait}</p>
          </div>
          <div class="selection-pill">${selected ? "In Team" : "Tap to add"}</div>
        </button>
      `;
    })
    .join("");

  const teamPower = computeTeamPower();
  const teamHp = computeTeamMaxHp();

  document.getElementById("team-power-chip").textContent = `${teamPower} power`;
  document.getElementById("team-summary").innerHTML = `
    <div class="team-summary-copy">
      <div class="team-stat-row">
        <span>Selected</span>
        <strong>${state.selectedTeam.length} animals</strong>
      </div>
      <div class="team-stat-row">
        <span>Team HP</span>
        <strong>${teamHp}</strong>
      </div>
      <div class="team-stat-row">
        <span>Village bonus</span>
        <strong>Camp +${campBonusHp()} HP / Workshop +${workshopPowerBonus()} power</strong>
      </div>
      <p>${getSelectedAnimals()
        .map((animal) => animal.skill)
        .join(" / ")}</p>
    </div>
  `;

  document.getElementById("start-expedition-button").disabled = state.selectedTeam.length < 2;
}

function createExpedition() {
  return {
    route: clone(ROUTE_TEMPLATE),
    currentNodeIndex: 0,
    loot: { wood: 0, stone: 0, berries: 0, relics: 0 },
    notes: [],
    teamHp: computeTeamMaxHp(),
    maxHp: computeTeamMaxHp(),
    morale: 74 + state.buildings.garden.level * 4,
    discoveredRelics: [],
    battle: null,
  };
}

function renderRoute() {
  if (!state.expedition) {
    return;
  }

  renderResources("expedition-loot-bar", state.expedition.loot);

  document.getElementById("route-progress-chip").textContent = `${state.expedition.currentNodeIndex} / ${state.expedition.route.length}`;
  document.getElementById("route-team-hp").textContent = `${state.expedition.teamHp} / ${state.expedition.maxHp}`;
  document.getElementById("route-team-morale").textContent = `${state.expedition.morale}%`;

  document.getElementById("route-list").innerHTML = state.expedition.route
    .map((node, index) => {
      const done = index < state.expedition.currentNodeIndex;
      const active = index === state.expedition.currentNodeIndex;
      return `
        <button class="route-node ${done ? "done" : ""} ${active ? "active" : ""}" data-action="resolve-specific-node" data-index="${index}">
          <div class="route-node-icon">${NODE_META[node.type].icon}</div>
          <div class="route-node-copy">
            <div class="route-node-head">
              <strong>${node.title}</strong>
              <span class="tag-pill">${node.type}</span>
            </div>
            <p>${node.description}</p>
          </div>
          <div class="route-node-index">${index + 1}</div>
        </button>
      `;
    })
    .join("");
}

function renderResult() {
  if (!state.expedition) {
    return;
  }

  const loot = { ...state.expedition.loot };
  loot.berries += gardenReturnBonus();

  document.getElementById("result-hero").innerHTML = `
    <span class="eyebrow">Tiny expedition complete</span>
    <h3>${state.selectedTeam.length} animals returned with ${resourceDeltaToText(loot) || "a calm trail story"}.</h3>
    <p>${state.expedition.discoveredRelics.length ? `New codex unlocks: ${state.expedition.discoveredRelics.join(", ")}.` : "No new relics this time, but the village still grew stronger."}</p>
  `;

  renderResources("result-loot-bar", loot);

  document.getElementById("result-log").innerHTML = state.expedition.notes
    .map(
      (note, index) => `
        <div class="result-log-item">
          <strong>Node ${index + 1}</strong>
          <p>${note}</p>
        </div>
      `
    )
    .join("");
}

function canAfford(cost, wallet) {
  return Object.entries(cost).every(([key, value]) => (wallet[key] || 0) >= value);
}

function renderBuildings() {
  renderResources("upgrade-resource-bar", state.resources);

  document.getElementById("building-upgrade-list").innerHTML = Object.values(state.buildings)
    .map((building) => {
      const affordable = canAfford(building.cost, state.resources);
      return `
        <button
          class="building-card ${state.selectedBuilding === building.id ? "active" : ""}"
          data-action="select-building"
          data-building="${building.id}"
        >
          <div class="building-crest ${building.id}"></div>
          <div class="building-copy">
            <div class="animal-name-row">
              <strong>${building.name}</strong>
              <span class="role-pill">Lv ${building.level}</span>
            </div>
            <p>${building.effectBase}</p>
            <div class="building-cost">
              ${Object.entries(building.cost)
                .map(([key, value]) => `<span class="cost-pill">${RESOURCE_META[key].label} ${value}</span>`)
                .join("")}
            </div>
            <span class="tag-pill">${affordable ? "Ready to upgrade" : "Need more supplies"}</span>
          </div>
        </button>
      `;
    })
    .join("");

  renderBuildingDetail();
}

function renderBuildingDetail() {
  const building = state.buildings[state.selectedBuilding];
  const affordable = canAfford(building.cost, state.resources);
  const detail = document.getElementById("building-detail");
  detail.innerHTML = `
    <span class="eyebrow">Focused upgrade</span>
    <h3>${building.name} Lv ${building.level}</h3>
    <p>${building.effectBase} ${building.bonus}</p>
    <div class="building-meta">
      <span class="record-pill">Current bonus: ${building.id === "camp" ? `+${campBonusHp()} HP` : building.id === "garden" ? `+${gardenReturnBonus()} berries` : `+${workshopPowerBonus()} power`}</span>
      <span class="record-pill">Next level: ${building.level + 1}</span>
    </div>
    <div class="building-cost">
      ${Object.entries(building.cost)
        .map(([key, value]) => `<span class="cost-pill">${RESOURCE_META[key].label} ${value}</span>`)
        .join("")}
    </div>
    <div class="detail-actions">
      <button class="primary-button" data-action="upgrade-building" data-building="${building.id}" ${affordable ? "" : "disabled"}>
        ${affordable ? "Upgrade Building" : "Insufficient Resources"}
      </button>
      <button class="secondary-button choice-button" data-action="switch-screen" data-screen="village">
        <strong>Back to village</strong>
        <span>Check the upgraded scene</span>
      </button>
    </div>
  `;
}

function renderCodex() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeCodexTab);
  });

  const content = document.getElementById("codex-content");

  if (state.activeCodexTab === "animals") {
    content.innerHTML = `
      <span class="eyebrow">Animals</span>
      <h3>Trusted expedition companions</h3>
      <div class="codex-grid">
        ${getAnimals()
          .map(
            (animal) => `
              <div class="codex-card">
                <div class="animal-name-row">
                  <h4>${animal.name}</h4>
                  <span class="role-pill">${animal.role}</span>
                </div>
                <p class="codex-note">${animal.trait}</p>
                <p class="codex-note">Skill: ${animal.skill}. Base HP ${animal.hp}, base power ${animal.power}.</p>
              </div>
            `
          )
          .join("")}
      </div>
    `;
    return;
  }

  if (state.activeCodexTab === "relics") {
    content.innerHTML = `
      <span class="eyebrow">Relics</span>
      <h3>Trail treasures and village keepsakes</h3>
      <div class="codex-grid">
        ${state.relics
          .map(
            (relic) => `
              <div class="codex-card ${relic.unlocked ? "" : "locked"}">
                <div class="animal-name-row">
                  <h4>${relic.unlocked ? relic.name : "Unknown Relic"}</h4>
                  <span class="tier-pill">${relic.rarity}</span>
                </div>
                <p class="codex-note">${relic.unlocked ? relic.description : "Its details are still hidden in the fog."}</p>
              </div>
            `
          )
          .join("")}
      </div>
    `;
    return;
  }

  if (state.activeCodexTab === "buildings") {
    content.innerHTML = `
      <span class="eyebrow">Buildings</span>
      <h3>Village foundations</h3>
      <div class="codex-grid">
        ${Object.values(state.buildings)
          .map(
            (building) => `
              <div class="codex-card">
                <div class="animal-name-row">
                  <h4>${building.name}</h4>
                  <span class="role-pill">Lv ${building.level}</span>
                </div>
                <p class="codex-note">${building.effectBase}</p>
                <p class="codex-note">${building.bonus}</p>
              </div>
            `
          )
          .join("")}
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <span class="eyebrow">Records</span>
    <h3>Village milestones</h3>
    <div class="records-grid">
      <div class="record-card">
        <h4>Completed Runs</h4>
        <p>${state.records.completedRuns}</p>
      </div>
      <div class="record-card">
        <h4>Best Depth</h4>
        <p>${state.records.bestDepth} nodes in one run</p>
      </div>
      <div class="record-card">
        <h4>Village Rank</h4>
        <p>Rank ${state.records.villageRank}</p>
      </div>
      <div class="record-card">
        <h4>Catalogued Entries</h4>
        <p>${state.records.cataloguedEntries}</p>
      </div>
      <div class="record-card">
        <h4>Favorite Season</h4>
        <p>${state.records.favoriteSeason}</p>
      </div>
    </div>
  `;
}

function spendResources(cost) {
  Object.entries(cost).forEach(([key, value]) => {
    state.resources[key] -= value;
  });
}

function addResources(target, change) {
  Object.entries(change).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + value;
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function showScreen(screenId) {
  state.currentScreen = screenId;
  screenEls.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === screenId);
  });

  const navScreens = new Set(["village", "buildings", "codex"]);
  bottomNav.classList.toggle("hidden", !navScreens.has(screenId));

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screenId);
  });

  render();
}

function toggleAnimal(animalId) {
  const alreadySelected = state.selectedTeam.includes(animalId);

  if (alreadySelected && state.selectedTeam.length <= 2) {
    showToast("Keep at least two animals for a safe run.");
    return;
  }

  if (!alreadySelected && state.selectedTeam.length >= 3) {
    showToast("The trail only fits a team of three.");
    return;
  }

  if (alreadySelected) {
    state.selectedTeam = state.selectedTeam.filter((id) => id !== animalId);
  } else {
    state.selectedTeam = [...state.selectedTeam, animalId];
  }

  render();
}

function openBuilding(buildingId) {
  state.selectedBuilding = buildingId;
  showScreen("buildings");
}

function upgradeBuilding(buildingId) {
  const building = state.buildings[buildingId];
  if (!canAfford(building.cost, state.resources)) {
    showToast("Not enough village resources yet.");
    return;
  }

  spendResources(building.cost);
  building.level += 1;
  Object.keys(building.cost).forEach((key) => {
    building.cost[key] += Math.max(2, Math.ceil(building.level * 1.5));
  });

  showToast(`${building.name} upgraded to Lv ${building.level}.`);
  render();
}

function startExpedition() {
  if (state.selectedTeam.length < 2) {
    showToast("Pick at least two animals to begin.");
    return;
  }

  state.expedition = createExpedition();
  showToast("The tiny expedition has set out.");
  showScreen("route");
}

function getCurrentNode() {
  return state.expedition?.route[state.expedition.currentNodeIndex] || null;
}

function closeOverlay() {
  overlayLayer.classList.add("hidden");
  eventModal.classList.add("hidden");
  battleModal.classList.add("hidden");
}

function openEventModal(node) {
  overlayLayer.classList.remove("hidden");
  eventModal.classList.remove("hidden");
  battleModal.classList.add("hidden");

  document.getElementById("event-node-tag").textContent = `${node.type} Node`;
  document.getElementById("event-title").textContent = node.title;
  document.getElementById("event-copy").textContent = node.description;

  document.getElementById("event-reward-preview").innerHTML = node.choices
    .map(
      (choice) => `
        <div class="resource-chip">
          <div class="resource-icon" style="background:#7fb57b">+</div>
          <div class="resource-copy">
            <span>Choice</span>
            <strong>${choice.label}</strong>
          </div>
          <div class="resource-delta">${choice.sublabel}</div>
        </div>
      `
    )
    .join("");

  document.getElementById("event-choices").innerHTML = node.choices
    .map(
      (choice, index) => `
        <button class="choice-button" data-action="event-choice" data-choice="${index}">
          <strong>${choice.label}</strong>
          <span>${choice.sublabel}</span>
        </button>
      `
    )
    .join("");
}

function applyEffect(effect) {
  if (!state.expedition) {
    return;
  }

  if (effect.loot) {
    addResources(state.expedition.loot, effect.loot);
  }

  if (effect.heal) {
    state.expedition.teamHp = Math.min(state.expedition.maxHp, state.expedition.teamHp + effect.heal);
  }

  if (effect.morale) {
    state.expedition.morale = Math.min(100, state.expedition.morale + effect.morale);
  }

  if (effect.relic) {
    const relic = state.relics.find((item) => item.id === effect.relic);
    if (relic) {
      relic.unlocked = true;
      if (!state.expedition.discoveredRelics.includes(relic.name)) {
        state.expedition.discoveredRelics.push(relic.name);
      }
    }
  }
}

function advanceExpedition(note) {
  state.expedition.notes.push(note);
  state.expedition.currentNodeIndex += 1;

  if (state.expedition.currentNodeIndex >= state.expedition.route.length) {
    showScreen("result");
    closeOverlay();
    return;
  }

  closeOverlay();
  renderRoute();
}

function resolveCurrentNode() {
  if (!state.expedition) {
    return;
  }

  const node = getCurrentNode();
  if (!node) {
    showScreen("result");
    return;
  }

  if (node.type === "Battle") {
    startBattle(node);
    return;
  }

  openEventModal(node);
}

function resolveEventChoice(choiceIndex) {
  const node = getCurrentNode();
  if (!node) {
    return;
  }

  const choice = node.choices[choiceIndex];
  applyEffect(choice.effect);
  showToast(choice.sublabel);
  advanceExpedition(choice.note);
}

function startBattle(node) {
  state.expedition.battle = {
    enemyName: node.enemy.name,
    enemyHp: node.enemy.hp + state.buildings.workshop.level * 3,
    enemyMaxHp: node.enemy.hp + state.buildings.workshop.level * 3,
    resolved: false,
    reward: node.reward,
    rewardNote: node.rewardNote,
    log: ["The enemy rushes out from the shrubs."],
  };

  overlayLayer.classList.remove("hidden");
  eventModal.classList.add("hidden");
  battleModal.classList.remove("hidden");
  renderBattle();
}

function getBattleActions() {
  return getSelectedAnimals().map((animal) => {
    const baseDamage = animal.power + workshopPowerBonus();
    return {
      id: animal.id,
      label: animal.skill,
      sublabel: animal.battleText,
      damage: baseDamage,
    };
  });
}

function renderBattle() {
  const battle = state.expedition?.battle;
  if (!battle) {
    return;
  }

  document.getElementById("battle-enemy-name").textContent = battle.enemyName;
  document.getElementById("battle-status-chip").textContent = battle.resolved ? "Resolved" : "Live";
  document.getElementById("battle-enemy-hp").textContent = `${battle.enemyHp} / ${battle.enemyMaxHp}`;
  document.getElementById("battle-team-hp").textContent = `${state.expedition.teamHp} / ${state.expedition.maxHp}`;
  document.getElementById("battle-enemy-fill").style.width = `${(battle.enemyHp / battle.enemyMaxHp) * 100}%`;
  document.getElementById("battle-team-fill").style.width = `${(state.expedition.teamHp / state.expedition.maxHp) * 100}%`;

  const actionHost = document.getElementById("battle-actions");

  if (battle.resolved) {
    actionHost.innerHTML = `
      <button class="primary-button" data-action="finish-battle">
        Continue Trail
      </button>
    `;
  } else {
    actionHost.innerHTML = getBattleActions()
      .map(
        (action) => `
          <button class="battle-action-button" data-action="battle-action" data-actor="${action.id}">
            <div>
              <strong>${ANIMAL_LIBRARY[action.id].name} - ${action.label}</strong>
              <div class="codex-note">${action.sublabel}</div>
            </div>
            <span class="mini-badge">-${action.damage} hp</span>
          </button>
        `
      )
      .join("");
  }

  document.getElementById("battle-log").innerHTML = battle.log
    .slice()
    .reverse()
    .map(
      (entry) => `
        <div class="battle-log-entry">
          <strong>Trail note</strong>
          <div class="codex-note">${entry}</div>
        </div>
      `
    )
    .join("");
}

function takeBattleTurn(actorId) {
  const battle = state.expedition?.battle;
  if (!battle || battle.resolved) {
    return;
  }

  const animal = ANIMAL_LIBRARY[actorId];
  const action = getBattleActions().find((item) => item.id === actorId);
  const damage = action.damage + (battle.log.length % 3);
  battle.enemyHp = Math.max(0, battle.enemyHp - damage);
  battle.log.push(`${animal.name} used ${action.label} and dealt ${damage} damage.`);

  if (battle.enemyHp <= 0) {
    addResources(state.expedition.loot, battle.reward);
    state.expedition.morale = Math.min(100, state.expedition.morale + 8);
    battle.log.push(`${battle.enemyName} was chased off. ${resourceDeltaToText(battle.reward)} gained.`);
    battle.resolved = true;
    renderBattle();
    showToast("Battle won.");
    return;
  }

  const enemyHit = 8 + state.expedition.currentNodeIndex * 2;
  state.expedition.teamHp = Math.max(0, state.expedition.teamHp - enemyHit);
  state.expedition.morale = Math.max(35, state.expedition.morale - 4);
  battle.log.push(`${battle.enemyName} countered for ${enemyHit} damage.`);

  if (state.expedition.teamHp <= 0) {
    state.expedition.teamHp = Math.ceil(state.expedition.maxHp * 0.32);
    state.expedition.morale = 40;
    battle.log.push("The team regrouped and still squeezed out a narrow win.");
    addResources(state.expedition.loot, { wood: 3, stone: 4, berries: 2, relics: 0 });
    battle.resolved = true;
  }

  renderBattle();
}

function finishBattle() {
  const battle = state.expedition?.battle;
  if (!battle) {
    return;
  }

  const node = getCurrentNode();
  const note = battle.rewardNote || `${node.title} was cleared after a quick battle.`;
  state.expedition.battle = null;
  advanceExpedition(note);
}

function claimRewards() {
  if (!state.expedition) {
    showScreen("village");
    return;
  }

  const finalLoot = { ...state.expedition.loot };
  finalLoot.berries += gardenReturnBonus();
  addResources(state.resources, finalLoot);

  state.records.completedRuns += 1;
  state.records.bestDepth = Math.max(state.records.bestDepth, state.expedition.route.length);
  state.records.cataloguedEntries += state.expedition.discoveredRelics.length ? 1 : 0;

  showToast(`Village stores updated: ${resourceDeltaToText(finalLoot)}.`);
  state.expedition = null;
  showScreen("village");
}

function render() {
  renderVillage();
  renderSquad();
  renderBuildings();
  renderCodex();

  if (state.expedition) {
    renderRoute();
    renderResult();
  }
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    if (event.target === overlayLayer) {
      closeOverlay();
    }
    return;
  }

  const { action } = actionTarget.dataset;

  switch (action) {
    case "enter-village":
      showScreen("village");
      break;
    case "switch-screen":
      showScreen(actionTarget.dataset.screen);
      break;
    case "toggle-animal":
      toggleAnimal(actionTarget.dataset.animal);
      break;
    case "open-building":
      openBuilding(actionTarget.dataset.building);
      break;
    case "select-building":
      state.selectedBuilding = actionTarget.dataset.building;
      renderBuildings();
      break;
    case "upgrade-building":
      upgradeBuilding(actionTarget.dataset.building);
      break;
    case "start-expedition":
      startExpedition();
      break;
    case "resolve-node":
      resolveCurrentNode();
      break;
    case "resolve-specific-node":
      if (Number(actionTarget.dataset.index) === state.expedition?.currentNodeIndex) {
        resolveCurrentNode();
      } else {
        showToast("Resolve nodes in order along the trail.");
      }
      break;
    case "event-choice":
      resolveEventChoice(Number(actionTarget.dataset.choice));
      break;
    case "battle-action":
      takeBattleTurn(actionTarget.dataset.actor);
      break;
    case "finish-battle":
      finishBattle();
      break;
    case "claim-rewards":
      claimRewards();
      break;
    case "codex-tab":
      state.activeCodexTab = actionTarget.dataset.tab;
      renderCodex();
      break;
    default:
      break;
  }
});

showScreen("launch");
