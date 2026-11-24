import type { GameState } from '../types/game';

export const GAME_STATE_VERSION = 3;

export function createInitialGameState(): GameState {
  return {
    version: GAME_STATE_VERSION,
    character: {
      name: 'Drifter',
      raceId: '',
      backgroundId: '',
      introCompleted: false,
    },
    locationId: 'base_landing_pad',
    stats: {
      grit: 2,
      guile: 2,
      tech: 2,
      presence: 2,
      lore: 2,
      resonance: 2,
    },
    resources: {
      credits: 85,
      salvage: 4,
      aetherShards: 2,
    },
    ship: {
      name: 'The Cinder Lark',
      hull: 80,
      fuel: 5,
      upgrades: {
        hull: 1,
        drive: 1,
        sensors: 1,
        cargo: 1,
        workbench: 1,
      },
    },
    base: {
      name: 'Siltport Outpost',
      upgrades: {
        dock: 1,
        cantina: 0,
        forge: 0,
        archive: 0,
      },
    },
    skills: [],
    items: [],
    npcs: [],
    relationships: {
      npc_sable: { met: true, trust: 1, bondTier: 0 },
    },
    flags: {},
    hiddenCounters: {},
    unlockedHiddenStats: [],
    lockedHiddenStats: [],
    unlockedCodex: [],
    completedStorylets: [],
    activeStorylet: null,
    lastSavedAt: null,
    settings: {
      theme: 'dark',
      textSize: 'md',
    },
  };
}
