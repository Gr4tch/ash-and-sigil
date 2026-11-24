import { LOCATION_MAP } from '../data';
import type { GameState, NpcRelationshipState, SaveSlotMeta } from '../types/game';
import { createInitialGameState, GAME_STATE_VERSION } from './initialState';

export const SAVE_KEY = 'ash_and_sigil_save_v1';
export const SAVE_SLOT_PREFIX = 'ash_and_sigil_slot_';
export const IOS_BANNER_DISMISSED_KEY = 'ash_and_sigil_ios_banner_dismissed';

export function loadGameState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialGameState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return normalizeGameState(parsed);
  } catch {
    return createInitialGameState();
  }
}

export function saveGameState(state: GameState): string {
  const savedAt = new Date().toISOString();
  try {
    const payload: GameState = { ...state, lastSavedAt: savedAt };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors cleanly
  }
  return savedAt;
}

export function getSaveSlots(): (SaveSlotMeta | null)[] {
  return ([1, 2, 3] as const).map((slotId) => {
    try {
      const raw = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { meta?: SaveSlotMeta };
      return parsed.meta ?? null;
    } catch {
      return null;
    }
  });
}

export function saveToSlot(slotId: 1 | 2 | 3, state: GameState): SaveSlotMeta {
  const savedAt = new Date().toISOString();
  const locName = LOCATION_MAP.get(state.locationId)?.name ?? state.locationId;
  const meta: SaveSlotMeta = {
    slotId,
    savedAt,
    characterName: state.character?.name || 'Drifter',
    locationName: locName,
    completedCount: state.completedStorylets.length,
  };
  try {
    const payload = {
      meta,
      state: { ...state, lastSavedAt: savedAt },
    };
    localStorage.setItem(`${SAVE_SLOT_PREFIX}${slotId}`, JSON.stringify(payload));
  } catch {
    // Ignore quota errors cleanly
  }
  return meta;
}

export function loadFromSlot(slotId: 1 | 2 | 3): { state?: GameState; error?: string } {
  try {
    const raw = localStorage.getItem(`${SAVE_SLOT_PREFIX}${slotId}`);
    if (!raw) return { error: `Slot ${slotId} is empty.` };
    const parsed = JSON.parse(raw) as { state?: Partial<GameState> };
    if (!parsed?.state) return { error: `Slot ${slotId} data is corrupted.` };
    return { state: normalizeGameState(parsed.state) };
  } catch {
    return { error: `Could not load Slot ${slotId}.` };
  }
}

export function deleteSlot(slotId: 1 | 2 | 3): void {
  try {
    localStorage.removeItem(`${SAVE_SLOT_PREFIX}${slotId}`);
  } catch {
    // Ignore
  }
}

export function exportSaveJson(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importSaveJson(rawText: string): { state?: GameState; error?: string } {
  try {
    const parsed = JSON.parse(rawText) as Partial<GameState>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.locationId !== 'string' ||
      !parsed.stats ||
      !parsed.resources ||
      !parsed.ship ||
      !parsed.base
    ) {
      return { error: 'Invalid save file format. Missing required game state fields.' };
    }
    return { state: normalizeGameState(parsed) };
  } catch {
    return { error: 'Could not parse JSON. Check that the full save text was pasted.' };
  }
}

function normalizeRelationships(
  parsed: Partial<GameState>,
  npcs: string[],
  flags: Record<string, boolean>,
  completedStorylets: string[]
): Record<string, NpcRelationshipState> {
  const result: Record<string, NpcRelationshipState> = {
    npc_sable: { met: true, trust: 1, bondTier: 0 },
  };

  if (parsed.relationships && typeof parsed.relationships === 'object') {
    for (const [id, raw] of Object.entries(parsed.relationships)) {
      if (raw && typeof raw === 'object') {
        result[id] = {
          met: Boolean(raw.met),
          trust: typeof raw.trust === 'number' ? raw.trust : 0,
          bondTier: typeof raw.bondTier === 'number' ? raw.bondTier : 0,
          ...(typeof raw.romance === 'boolean' ? { romance: raw.romance } : {}),
          ...(typeof raw.rival === 'boolean' ? { rival: raw.rival } : {}),
        };
      }
    }
  }

  result.npc_sable = {
    ...result.npc_sable,
    met: true,
    trust: result.npc_sable?.trust ?? 1,
    bondTier: result.npc_sable?.bondTier ?? 0,
  };

  for (const npcId of npcs) {
    const cur = result[npcId] ?? { met: false, trust: 0, bondTier: 0 };
    result[npcId] = {
      ...cur,
      met: true,
      trust: Math.max(1, cur.trust),
    };
  }

  const markMet = (id: string) => {
    const cur = result[id] ?? { met: false, trust: 0, bondTier: 0 };
    if (!cur.met) {
      result[id] = { ...cur, met: true };
    }
  };

  if (completedStorylets.includes('sl_siltport_intake')) markMet('npc_renn');
  if (completedStorylets.includes('sl_cantina_whisper')) {
    markMet('npc_mirek');
    markMet('npc_bramwell');
  }
  if (completedStorylets.includes('sl_kestrel_breach')) markMet('npc_vexra');
  if (completedStorylets.includes('sl_kestrel_scavenge')) markMet('npc_rook');
  if (completedStorylets.includes('sl_siltport_smuggler')) markMet('npc_lyra');
  if (completedStorylets.includes('sl_siltport_revival')) markMet('npc_vanekael');

  if (flags.vexra_spurned) {
    const cur = result.npc_vexra ?? { met: true, trust: -2, bondTier: 0 };
    result.npc_vexra = {
      ...cur,
      met: true,
      trust: Math.min(cur.trust, -2),
      rival: true,
    };
  }

  return result;
}

function normalizeGameState(parsed: Partial<GameState>): GameState {
  const base = createInitialGameState();
  const isLegacySave =
    !parsed.character &&
    ((Array.isArray(parsed.completedStorylets) && parsed.completedStorylets.length > 0) ||
      (Array.isArray(parsed.skills) && parsed.skills.length > 0));

  const npcs = Array.isArray(parsed.npcs) ? parsed.npcs : base.npcs;
  const flags = parsed.flags && typeof parsed.flags === 'object' ? parsed.flags : base.flags;
  const completedStorylets = Array.isArray(parsed.completedStorylets)
    ? parsed.completedStorylets
    : base.completedStorylets;

  return {
    ...base,
    ...parsed,
    version: GAME_STATE_VERSION,
    character: parsed.character
      ? { ...base.character, ...parsed.character }
      : { ...base.character, introCompleted: isLegacySave },
    stats: { ...base.stats, ...(parsed.stats ?? {}) },
    resources: { ...base.resources, ...(parsed.resources ?? {}) },
    ship: {
      ...base.ship,
      ...(parsed.ship ?? {}),
      upgrades: { ...base.ship.upgrades, ...(parsed.ship?.upgrades ?? {}) },
    },
    base: {
      ...base.base,
      ...(parsed.base ?? {}),
      upgrades: { ...base.base.upgrades, ...(parsed.base?.upgrades ?? {}) },
    },
    skills: Array.isArray(parsed.skills) ? parsed.skills : base.skills,
    items: Array.isArray(parsed.items) ? parsed.items : base.items,
    npcs,
    relationships: normalizeRelationships(parsed, npcs, flags, completedStorylets),
    flags,
    hiddenCounters:
      parsed.hiddenCounters && typeof parsed.hiddenCounters === 'object'
        ? parsed.hiddenCounters
        : base.hiddenCounters,
    unlockedHiddenStats: Array.isArray(parsed.unlockedHiddenStats)
      ? parsed.unlockedHiddenStats
      : base.unlockedHiddenStats,
    lockedHiddenStats: Array.isArray(parsed.lockedHiddenStats)
      ? parsed.lockedHiddenStats
      : base.lockedHiddenStats,
    unlockedCodex: Array.isArray(parsed.unlockedCodex)
      ? parsed.unlockedCodex
      : base.unlockedCodex,
    completedStorylets,
    activeStorylet: parsed.activeStorylet ?? null,
    lastSavedAt: typeof parsed.lastSavedAt === 'string' ? parsed.lastSavedAt : null,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
  };
}
