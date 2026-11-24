import { CODEX_MAP, HIDDEN_STAT_MAP, ITEM_MAP, NPC_MAP, SKILL_MAP } from '../data';
import type {
  CoreStatKey,
  EffectPayload,
  GameState,
  GameToast,
  NpcRelationshipState,
  ResourceKey,
} from '../types/game';
import { getMaxHullFromState } from './requirements';

let toastSeq = 0;
export function makeToast(
  kind: GameToast['kind'],
  title: string,
  detail: string
): GameToast {
  toastSeq += 1;
  return {
    id: `toast_${Date.now()}_${toastSeq}`,
    kind,
    title,
    detail,
  };
}

export function getMaxFuelFromState(state: GameState): number {
  const lvl = state.ship.upgrades.drive ?? 1;
  return 6 + (lvl - 1) * 2;
}

export function applyHiddenCounterUpdates(
  state: GameState,
  deltas: Record<string, number>,
  toasts: GameToast[]
): {
  hiddenCounters: Record<string, number>;
  unlockedHiddenStats: string[];
  lockedHiddenStats: string[];
} {
  const hiddenCounters = { ...state.hiddenCounters };
  const unlockedHiddenStats = [...state.unlockedHiddenStats];
  const lockedHiddenStats = [...state.lockedHiddenStats];

  for (const [id, delta] of Object.entries(deltas)) {
    hiddenCounters[id] = (hiddenCounters[id] ?? 0) + delta;
    const def = HIDDEN_STAT_MAP.get(id);
    if (!def) continue;

    if (
      !unlockedHiddenStats.includes(id) &&
      !lockedHiddenStats.includes(id) &&
      hiddenCounters[id] >= def.threshold
    ) {
      unlockedHiddenStats.push(id);
      if (def.kind === 'identity' && def.oppositeId) {
        if (!lockedHiddenStats.includes(def.oppositeId)) {
          lockedHiddenStats.push(def.oppositeId);
        }
        const oppName = HIDDEN_STAT_MAP.get(def.oppositeId)?.name ?? def.oppositeId;
        toasts.push(
          makeToast('hidden', `Identity Forged: ${def.name}`, `Seals ${oppName} permanently.`)
        );
      } else {
        toasts.push(makeToast('scar', `Scar Earned: ${def.name}`, def.description));
      }
    }
  }

  return { hiddenCounters, unlockedHiddenStats, lockedHiddenStats };
}

export function applyEffectPayload(
  prevState: GameState,
  payload: EffectPayload
): { nextState: GameState; toasts: GameToast[] } {
  const toasts: GameToast[] = [];

  const resources = { ...prevState.resources };
  if (payload.resources) {
    for (const [key, delta] of Object.entries(payload.resources) as [ResourceKey, number][]) {
      resources[key] = Math.max(0, (resources[key] ?? 0) + delta);
    }
  }

  const stats = { ...prevState.stats };
  if (payload.statDelta) {
    for (const [stat, delta] of Object.entries(payload.statDelta) as [CoreStatKey, number][]) {
      const before = stats[stat] ?? 1;
      const after = Math.max(1, Math.min(10, before + delta));
      stats[stat] = after;
      if (after > before) {
        toasts.push(
          makeToast(
            'stat',
            `${stat.charAt(0).toUpperCase() + stat.slice(1)} +${after - before}`,
            `Now ${after} / 10 — earned the hard way.`
          )
        );
      }
    }
  }

  const skills = [...prevState.skills];
  if (payload.grantSkills) {
    for (const skillId of payload.grantSkills) {
      if (!skills.includes(skillId)) {
        skills.push(skillId);
        const def = SKILL_MAP.get(skillId);
        toasts.push(
          makeToast('skill', `Technique Learned: ${def?.name ?? skillId}`, def?.description ?? '')
        );
      }
    }
  }

  let items = [...prevState.items];
  if (payload.grantItems) {
    for (const itemId of payload.grantItems) {
      if (!items.includes(itemId)) {
        items.push(itemId);
        const def = ITEM_MAP.get(itemId);
        if (def) {
          toasts.push(makeToast('info', `Acquired: ${def.name}`, def.description));
        }
      }
    }
  }
  if (payload.removeItems) {
    items = items.filter((id) => !payload.removeItems!.includes(id));
  }

  const npcs = [...prevState.npcs];
  const relationships: Record<string, NpcRelationshipState> = Object.fromEntries(
    Object.entries(prevState.relationships ?? {}).map(([k, v]) => [k, { ...v }])
  );
  const ensureRel = (npcId: string): NpcRelationshipState => {
    if (!relationships[npcId]) {
      relationships[npcId] = { met: false, trust: 0, bondTier: 0 };
    }
    return relationships[npcId];
  };

  if (payload.meetNpcs) {
    for (const npcId of payload.meetNpcs) {
      const rel = ensureRel(npcId);
      rel.met = true;
    }
  }

  if (payload.recruitNpcs) {
    for (const npcId of payload.recruitNpcs) {
      const rel = ensureRel(npcId);
      rel.met = true;
      rel.trust = Math.max(1, rel.trust);
      if (!npcs.includes(npcId)) {
        npcs.push(npcId);
        const def = NPC_MAP.get(npcId);
        toasts.push(
          makeToast(
            'npc',
            `Crew Recruited: ${def?.name ?? npcId}`,
            def?.perkSummary ?? 'Joined Siltport Outpost.'
          )
        );
      }
    }
  }

  if (payload.trustDelta) {
    for (const [npcId, delta] of Object.entries(payload.trustDelta)) {
      const rel = ensureRel(npcId);
      rel.met = true;
      const before = rel.trust;
      const after = Math.max(-5, Math.min(10, before + delta));
      rel.trust = after;
      if (after !== before) {
        const shortName = NPC_MAP.get(npcId)?.shortName ?? npcId;
        if (after > before) {
          toasts.push(
            makeToast(
              'bond',
              `Trust +${after - before}: ${shortName}`,
              `${shortName} warms to you (Trust ${after}).`
            )
          );
        } else {
          toasts.push(
            makeToast(
              'bond',
              `Trust ${after - before}: ${shortName}`,
              `${shortName} grows colder toward you (Trust ${after}).`
            )
          );
        }
      }
    }
  }

  if (payload.setBondTier) {
    for (const [npcId, targetTier] of Object.entries(payload.setBondTier)) {
      const rel = ensureRel(npcId);
      rel.met = true;
      if (targetTier > rel.bondTier) {
        rel.bondTier = targetTier;
        const shortName = NPC_MAP.get(npcId)?.shortName ?? npcId;
        toasts.push(
          makeToast('bond', `Bond Deepened: ${shortName}`, `Reached Bond Tier ${targetTier}.`)
        );
      }
    }
  }

  if (payload.setRomance) {
    for (const [npcId, val] of Object.entries(payload.setRomance)) {
      const rel = ensureRel(npcId);
      rel.met = true;
      const wasRomance = Boolean(rel.romance);
      rel.romance = val;
      if (val && !wasRomance) {
        const shortName = NPC_MAP.get(npcId)?.shortName ?? npcId;
        toasts.push(
          makeToast('bond', `Spark Lit: ${shortName}`, `A deeper current runs between you and ${shortName}.`)
        );
      }
    }
  }

  if (payload.setRival) {
    for (const [npcId, val] of Object.entries(payload.setRival)) {
      const rel = ensureRel(npcId);
      rel.met = true;
      const wasRival = Boolean(rel.rival);
      rel.rival = val;
      if (val && !wasRival) {
        const shortName = NPC_MAP.get(npcId)?.shortName ?? npcId;
        toasts.push(
          makeToast('bond', `Rivalry Sparked: ${shortName}`, `${shortName} won't forget how you played this.`)
        );
      }
    }
  }

  const flags = { ...prevState.flags, ...(payload.setFlags ?? {}) };

  const unlockedCodex = [...prevState.unlockedCodex];
  if (payload.unlockCodex) {
    for (const codexId of payload.unlockCodex) {
      if (!unlockedCodex.includes(codexId)) {
        unlockedCodex.push(codexId);
        const def = CODEX_MAP.get(codexId);
        if (def) {
          toasts.push(makeToast('lore', `Lore Discovered: ${def.title}`, def.summary));
        }
      }
    }
  }

  let nextState: GameState = {
    ...prevState,
    stats,
    resources,
    skills,
    items,
    npcs,
    relationships,
    flags,
    unlockedCodex,
    locationId: payload.travelTo ?? prevState.locationId,
  };

  // Apply hidden counters from payload
  let extraHidden = payload.hiddenCounters ? { ...payload.hiddenCounters } : {};

  // Hull & fail-forward emergency tow (never Game Over!)
  const maxHull = getMaxHullFromState(nextState);
  let hull = nextState.ship.hull + (payload.hullDelta ?? 0);
  if (hull <= 0) {
    hull = 10;
    nextState = {
      ...nextState,
      locationId: 'base_landing_pad',
    };
    extraHidden.unbroken = (extraHidden.unbroken ?? 0) + 1;
    toasts.push(
      makeToast(
        'warning',
        'Emergency Tow to Siltport',
        'Hull breached to critical! Drift-tugs dragged The Cinder Lark back to Siltport at 10 Hull.'
      )
    );
  } else {
    hull = Math.min(maxHull, hull);
  }

  const maxFuel = getMaxFuelFromState(nextState);
  const fuel = Math.max(0, Math.min(maxFuel, nextState.ship.fuel + (payload.fuelDelta ?? 0)));

  const hiddenResult = applyHiddenCounterUpdates(nextState, extraHidden, toasts);

  nextState = {
    ...nextState,
    ship: {
      ...nextState.ship,
      hull,
      fuel,
    },
    hiddenCounters: hiddenResult.hiddenCounters,
    unlockedHiddenStats: hiddenResult.unlockedHiddenStats,
    lockedHiddenStats: hiddenResult.lockedHiddenStats,
  };

  return { nextState, toasts };
}
