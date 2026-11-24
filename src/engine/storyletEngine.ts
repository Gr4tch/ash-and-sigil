import {
  BACKGROUND_MAP,
  BASE_UPGRADE_MAP,
  CODEX_MAP,
  LOCATION_MAP,
  RACE_MAP,
  SHIP_UPGRADE_MAP,
  SKILL_MAP,
  STORYLETS,
  STORYLET_MAP,
  SYNERGY_MAP,
} from '../data';
import type {
  BaseBuildingId,
  GameState,
  GameToast,
  LocationDef,
  NpcRelationshipState,
  ResourceKey,
  ShipModuleId,
  Storylet,
  StoryletChoice,
} from '../types/game';
import { resolveCheck } from './checks';
import {
  applyEffectPayload,
  applyHiddenCounterUpdates,
  getMaxFuelFromState,
  makeToast,
} from './effects';
import { evaluateRequirement, getMaxHullFromState } from './requirements';

export { getMaxHullFromState as getMaxHull, getMaxFuelFromState as getMaxFuel };

export function getLocationDescription(state: GameState, locationId: string): string {
  const loc = LOCATION_MAP.get(locationId);
  if (!loc) return '';
  const matching = [...loc.descriptionVariants]
    .filter((v) => evaluateRequirement(state, v.requirements))
    .sort((a, b) => a.priority - b.priority)
    .map((v) => v.text);

  return [loc.baseDescription, ...matching].join('\n\n');
}

export function getAvailableStorylets(state: GameState, locationId: string): Storylet[] {
  return STORYLETS.filter((sl) => {
    if (sl.locationId !== locationId) return false;
    if (!sl.repeatable && state.completedStorylets.includes(sl.id)) return false;
    return evaluateRequirement(state, sl.requirements);
  });
}

export function canTravelTo(
  state: GameState,
  loc: LocationDef
): { allowed: boolean; reason?: string } {
  if (loc.id === state.locationId) {
    return { allowed: false, reason: 'Current location' };
  }
  if (!evaluateRequirement(state, loc.travelRequirements)) {
    return {
      allowed: false,
      reason: loc.travelLockedHint ?? 'Upgrade ship systems to reach this sector.',
    };
  }
  if (state.ship.fuel < loc.fuelCost) {
    return {
      allowed: false,
      reason: `Needs ${loc.fuelCost} Aether Fuel (have ${state.ship.fuel}).`,
    };
  }
  return { allowed: true };
}

export function travelToLocation(
  state: GameState,
  targetLocationId: string
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  const loc = LOCATION_MAP.get(targetLocationId);
  if (!loc) return { nextState: state, toasts: [], error: 'Unknown location.' };
  const check = canTravelTo(state, loc);
  if (!check.allowed) return { nextState: state, toasts: [], error: check.reason };

  return {
    nextState: {
      ...state,
      locationId: loc.id,
      ship: {
        ...state.ship,
        fuel: Math.max(0, state.ship.fuel - loc.fuelCost),
      },
      activeStorylet: null,
    },
    toasts: [],
  };
}

export function interpolateStoryText(text: string, state: GameState): string {
  const raceName = RACE_MAP.get(state.character.raceId)?.name ?? 'Drifter';
  const bgName = BACKGROUND_MAP.get(state.character.backgroundId)?.name ?? 'Freebooter';
  const cleanName = (state.character.name || 'Drifter').trim() || 'Drifter';
  const nameParts = cleanName.split(/\s+/);
  const firstName = nameParts[0] || 'Drifter';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;
  const callsign = state.character.callsign?.trim() || 'captain';

  return text
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{callsign\}\}/g, callsign)
    .replace(/\{\{name\}\}/g, cleanName)
    .replace(/\{\{ship\}\}/g, state.ship.name)
    .replace(/\{\{race\}\}/g, raceName)
    .replace(/\{\{background\}\}/g, bgName);
}

export function completeCharacterIntro(
  state: GameState,
  input: { name: string; raceId: string; backgroundId: string }
): { nextState: GameState; toasts: GameToast[] } {
  const race = RACE_MAP.get(input.raceId);
  const bg = BACKGROUND_MAP.get(input.backgroundId);
  const stats = { ...state.stats };
  const toasts: GameToast[] = [];

  if (race) {
    stats[race.statBonus] = Math.min(10, (stats[race.statBonus] ?? 2) + 1);
  }
  if (bg) {
    stats[bg.statBonus] = Math.min(10, (stats[bg.statBonus] ?? 2) + 1);
  }

  let hiddenCounters = { ...state.hiddenCounters };
  let unlockedHiddenStats = [...state.unlockedHiddenStats];
  let lockedHiddenStats = [...state.lockedHiddenStats];

  if (race?.hiddenStatBonus) {
    // Silent +1 hidden stat bonus from race (threshold is 2, so no spoiler toast)
    const hiddenRes = applyHiddenCounterUpdates(
      state,
      { [race.hiddenStatBonus]: 1 },
      []
    );
    hiddenCounters = hiddenRes.hiddenCounters;
    unlockedHiddenStats = hiddenRes.unlockedHiddenStats;
    lockedHiddenStats = hiddenRes.lockedHiddenStats;
  }

  const unlockedCodex = [...state.unlockedCodex];
  if (!unlockedCodex.includes('codex_cinder_lark')) {
    unlockedCodex.push('codex_cinder_lark');
    const codexDef = CODEX_MAP.get('codex_cinder_lark');
    if (codexDef) {
      toasts.push(makeToast('lore', `Lore Discovered: ${codexDef.title}`, codexDef.summary));
    }
  }

  const cleanName = input.name.trim() || 'Drifter';

  return {
    nextState: {
      ...state,
      character: {
        name: cleanName,
        raceId: input.raceId,
        backgroundId: input.backgroundId,
        introCompleted: true,
      },
      stats,
      hiddenCounters,
      unlockedHiddenStats,
      lockedHiddenStats,
      unlockedCodex,
    },
    toasts,
  };
}

export function startStorylet(state: GameState, storyletId: string): GameState {
  const sl = STORYLET_MAP.get(storyletId);
  if (!sl) return state;
  return {
    ...state,
    activeStorylet: {
      storyletId: sl.id,
      currentNodeId: sl.entryNodeId,
      log: [],
      finished: false,
    },
  };
}

export function chooseStoryletOption(
  state: GameState,
  choice: StoryletChoice
): { nextState: GameState; toasts: GameToast[] } {
  if (!state.activeStorylet) return { nextState: state, toasts: [] };
  const sl = STORYLET_MAP.get(state.activeStorylet.storyletId);
  if (!sl) return { nextState: state, toasts: [] };

  let passed = true;
  let rollSummary: string | undefined;
  let outcomeKind: 'success' | 'fail_forward' | 'narrative' = 'narrative';

  if (choice.check) {
    const res = resolveCheck(state, choice.check);
    passed = res.passed;
    rollSummary = res.summaryText;
    outcomeKind = passed ? 'success' : 'fail_forward';
  }

  const currentNode = sl.nodes[state.activeStorylet.currentNodeId];
  const payload = passed || !choice.onFailure ? choice.onSuccess : choice.onFailure;
  const { nextState: afterEffect, toasts } = applyEffectPayload(state, payload);

  const nextLog = [
    ...afterEffect.activeStorylet!.log,
    {
      choiceLabel: interpolateStoryText(choice.label, state),
      rollSummary,
      outcomeKind,
      speaker: currentNode?.speaker,
      text: interpolateStoryText(payload.resultText, afterEffect),
    },
  ];

  const isFinished = payload.nextNodeId === null;
  const completedStorylets =
    isFinished && !sl.repeatable && !afterEffect.completedStorylets.includes(sl.id)
      ? [...afterEffect.completedStorylets, sl.id]
      : afterEffect.completedStorylets;

  return {
    nextState: {
      ...afterEffect,
      completedStorylets,
      activeStorylet: {
        storyletId: sl.id,
        currentNodeId: payload.nextNodeId ?? afterEffect.activeStorylet!.currentNodeId,
        log: nextLog,
        finished: isFinished,
      },
    },
    toasts,
  };
}

export function closeStorylet(state: GameState): GameState {
  return {
    ...state,
    activeStorylet: null,
  };
}

export function getCreditDiscountMultiplier(state: GameState): number {
  let mult = 1;
  if (state.npcs.includes('npc_vexra')) {
    mult *= 0.9;
  }
  return mult;
}

export function getRepairCreditCost(state: GameState): number {
  const dockLvl = state.base.upgrades.dock ?? 1;
  let baseCost = 30;
  if (dockLvl === 2) baseCost = 22;
  if (dockLvl >= 3) baseCost = 15;
  return Math.max(5, Math.round(baseCost * getCreditDiscountMultiplier(state)));
}

export function repairShip(
  state: GameState,
  method: 'salvage' | 'credits'
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  const maxHull = getMaxHullFromState(state);
  if (state.ship.hull >= maxHull) {
    return { nextState: state, toasts: [], error: 'Hull is already at full integrity.' };
  }

  const toasts: GameToast[] = [];
  const resources = { ...state.resources };
  const wasBattered = state.ship.hull <= maxHull * 0.6;

  if (method === 'salvage') {
    if (resources.salvage < 1) {
      return { nextState: state, toasts: [], error: 'Not enough Salvage (need 1).' };
    }
    resources.salvage -= 1;
  } else {
    const cost = getRepairCreditCost(state);
    if (resources.credits < cost) {
      return { nextState: state, toasts: [], error: `Not enough Credits (need ${cost}).` };
    }
    resources.credits -= cost;
  }

  const newHull = Math.min(maxHull, state.ship.hull + 30);
  let nextState: GameState = {
    ...state,
    resources,
    ship: {
      ...state.ship,
      hull: newHull,
    },
  };

  if (method === 'salvage' && wasBattered) {
    const hidden = applyHiddenCounterUpdates(nextState, { scrap_savvy: 1 }, toasts);
    nextState = {
      ...nextState,
      ...hidden,
    };
  }

  toasts.unshift(
    makeToast('info', 'Hull Patched', `Restored hull to ${newHull} / ${maxHull}.`)
  );

  return { nextState, toasts };
}

export function refuelShip(
  state: GameState
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  const maxFuel = getMaxFuelFromState(state);
  if (state.ship.fuel >= maxFuel) {
    return { nextState: state, toasts: [], error: 'Aether fuel cells are already full.' };
  }

  const cost = 15;
  if (state.resources.credits < cost) {
    if (state.ship.fuel === 0) {
      const nextFuel = Math.min(maxFuel, 2);
      return {
        nextState: {
          ...state,
          ship: { ...state.ship, fuel: nextFuel },
        },
        toasts: [
          makeToast(
            'warning',
            'Emergency Fuel Bleed',
            'Siphoned +2 residual Aether cells from reserve capacitors.'
          ),
        ],
      };
    }
    return { nextState: state, toasts: [], error: `Need ${cost} Credits to refuel.` };
  }

  const nextFuel = Math.min(maxFuel, state.ship.fuel + 2);
  return {
    nextState: {
      ...state,
      resources: {
        ...state.resources,
        credits: state.resources.credits - cost,
      },
      ship: {
        ...state.ship,
        fuel: nextFuel,
      },
    },
    toasts: [makeToast('info', 'Refueled', `Aether cells topped to ${nextFuel} / ${maxFuel}.`)],
  };
}

export function getAdjustedUpgradeCosts(
  state: GameState,
  rawCosts: Partial<Record<ResourceKey, number>>
): Partial<Record<ResourceKey, number>> {
  const result: Partial<Record<ResourceKey, number>> = { ...rawCosts };
  if (result.credits !== undefined) {
    result.credits = Math.max(1, Math.round(result.credits * getCreditDiscountMultiplier(state)));
  }
  return result;
}

export function canAffordCosts(
  state: GameState,
  costs: Partial<Record<ResourceKey, number>>
): boolean {
  for (const [res, amt] of Object.entries(costs) as [ResourceKey, number][]) {
    if ((state.resources[res] ?? 0) < amt) return false;
  }
  return true;
}

export function purchaseUpgrade(
  state: GameState,
  target: 'ship' | 'base',
  id: string
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  const def =
    target === 'ship'
      ? SHIP_UPGRADE_MAP.get(id as ShipModuleId)
      : BASE_UPGRADE_MAP.get(id as BaseBuildingId);
  if (!def) return { nextState: state, toasts: [], error: 'Unknown upgrade.' };

  const currentLevel =
    target === 'ship'
      ? (state.ship.upgrades[id as ShipModuleId] ?? 1)
      : (state.base.upgrades[id as BaseBuildingId] ?? 0);

  if (currentLevel >= def.maxLevel) {
    return { nextState: state, toasts: [], error: 'Already at maximum level.' };
  }

  const nextLevelDef = def.levels.find((l) => l.level === currentLevel + 1);
  if (!nextLevelDef) {
    return { nextState: state, toasts: [], error: 'Upgrade tier missing.' };
  }

  if (nextLevelDef.requiredNpcId && !state.npcs.includes(nextLevelDef.requiredNpcId)) {
    return { nextState: state, toasts: [], error: 'Requires specialist NPC.' };
  }

  const costs = getAdjustedUpgradeCosts(state, nextLevelDef.costs);
  if (!canAffordCosts(state, costs)) {
    return { nextState: state, toasts: [], error: 'Insufficient resources.' };
  }

  const resources = { ...state.resources };
  for (const [res, amt] of Object.entries(costs) as [ResourceKey, number][]) {
    resources[res] = Math.max(0, (resources[res] ?? 0) - amt);
  }

  let nextState: GameState = {
    ...state,
    resources,
  };

  if (target === 'ship') {
    const newUpgrades = {
      ...state.ship.upgrades,
      [id]: currentLevel + 1,
    };
    const nextMaxHull = 100 + ((newUpgrades.hull ?? 1) - 1) * 30;
    const hullBonus = id === 'hull' ? 30 : 0;
    nextState = {
      ...nextState,
      ship: {
        ...nextState.ship,
        upgrades: newUpgrades,
        hull: Math.min(nextMaxHull, nextState.ship.hull + hullBonus),
      },
    };
  } else {
    nextState = {
      ...nextState,
      base: {
        ...nextState.base,
        upgrades: {
          ...state.base.upgrades,
          [id]: currentLevel + 1,
        },
      },
    };
  }

  return {
    nextState,
    toasts: [
      makeToast(
        'upgrade',
        `${def.shortName} Lv.${currentLevel + 1}: ${nextLevelDef.title}`,
        nextLevelDef.summary
      ),
    ],
  };
}

export function getAdjustedSynergyCosts(
  state: GameState,
  rawCosts: Partial<Record<ResourceKey, number>>
): Partial<Record<ResourceKey, number>> {
  const result: Partial<Record<ResourceKey, number>> = { ...rawCosts };
  if ((state.base.upgrades.forge ?? 0) >= 1 && result.salvage && result.salvage > 1) {
    result.salvage -= 1;
  }
  return result;
}

export function craftSynergy(
  state: GameState,
  synergyId: string
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  const syn = SYNERGY_MAP.get(synergyId);
  if (!syn) return { nextState: state, toasts: [], error: 'Unknown synergy.' };

  if (state.skills.includes(syn.resultSkillId)) {
    return { nextState: state, toasts: [], error: 'Synergy already forged.' };
  }
  if ((state.ship.upgrades.workbench ?? 1) < syn.minWorkbenchLevel) {
    return {
      nextState: state,
      toasts: [],
      error: `Requires Workbench Lv.${syn.minWorkbenchLevel}.`,
    };
  }
  if (!syn.ingredients.every((ing) => state.skills.includes(ing))) {
    return { nextState: state, toasts: [], error: 'Missing required base techniques.' };
  }

  const costs = getAdjustedSynergyCosts(state, syn.costs);
  if (!canAffordCosts(state, costs)) {
    return { nextState: state, toasts: [], error: 'Insufficient Salvage or Aether Shards.' };
  }

  const resources = { ...state.resources };
  for (const [res, amt] of Object.entries(costs) as [ResourceKey, number][]) {
    resources[res] = Math.max(0, (resources[res] ?? 0) - amt);
  }

  const toasts: GameToast[] = [];
  const skills = [...state.skills, syn.resultSkillId];
  const items =
    syn.grantItemId && !state.items.includes(syn.grantItemId)
      ? [...state.items, syn.grantItemId]
      : [...state.items];

  const skillDef = SKILL_MAP.get(syn.resultSkillId);
  toasts.push(
    makeToast(
      'skill',
      `Synergy Forged: ${skillDef?.name ?? syn.name}`,
      syn.description
    )
  );

  let nextState: GameState = {
    ...state,
    resources,
    skills,
    items,
  };

  if (syn.hiddenCounters) {
    const hidden = applyHiddenCounterUpdates(nextState, syn.hiddenCounters, toasts);
    nextState = {
      ...nextState,
      ...hidden,
    };
  }

  return { nextState, toasts };
}

export function getExchangeRates(state: GameState): {
  salvagePrice: number;
  aetherPrice: number;
  bonusReasons: string[];
} {
  let salvagePrice = 15;
  let aetherPrice = 35;
  const bonusReasons: string[] = [];

  if ((state.base.upgrades.cantina ?? 0) >= 1) {
    salvagePrice += 2;
    aetherPrice += 5;
    bonusReasons.push('Cantina Traffic (+2/+5)');
  }
  if ((state.base.upgrades.cantina ?? 0) >= 2) {
    salvagePrice += 3;
    aetherPrice += 5;
    bonusReasons.push('Deep-Rim Exchange (+3/+5)');
  }
  if (state.npcs.includes('npc_bramwell')) {
    salvagePrice += 2;
    bonusReasons.push("Bramwell's Buyers (+2 Salvage)");
  }
  if (state.flags.siltport_free_charter || state.flags.siltport_shadow_broker) {
    salvagePrice += 3;
    aetherPrice += 5;
    bonusReasons.push('Untaxed Port (+3/+5)');
  }

  return { salvagePrice, aetherPrice, bonusReasons };
}

export function sellResource(
  state: GameState,
  resource: 'salvage' | 'aetherShards',
  quantity: number
): { nextState: GameState; toasts: GameToast[]; error?: string } {
  if (quantity <= 0) {
    return { nextState: state, toasts: [], error: 'Select at least 1 unit to sell.' };
  }
  const available = state.resources[resource] ?? 0;
  if (available < quantity) {
    return { nextState: state, toasts: [], error: 'Not enough stock to sell.' };
  }

  const rates = getExchangeRates(state);
  const unitPrice = resource === 'salvage' ? rates.salvagePrice : rates.aetherPrice;
  const earned = unitPrice * quantity;
  const label = resource === 'salvage' ? 'Salvage' : 'Aether Shards';

  return {
    nextState: {
      ...state,
      resources: {
        ...state.resources,
        [resource]: available - quantity,
        credits: (state.resources.credits ?? 0) + earned,
      },
    },
    toasts: [
      makeToast('info', 'Exchange Trade', `Sold ${quantity} ${label} for ${earned} Cr.`),
    ],
  };
}

export function getNpcDispositionLabel(rel?: NpcRelationshipState): string {
  if (!rel || !rel.met) return 'Unmet';
  if (rel.rival) return 'Rival';
  if (rel.trust <= -2) return 'Hostile';
  if (rel.trust === -1) return 'Wary';
  if (rel.bondTier >= 3 || rel.trust >= 7) return 'Sworn Ally';
  if (rel.bondTier >= 2 || rel.trust >= 4) return 'Confidant';
  if (rel.bondTier >= 1 || rel.trust >= 2) return 'Trusted';
  return 'Acquaintance';
}
