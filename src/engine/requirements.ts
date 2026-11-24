import {
  BACKGROUND_MAP,
  BASE_UPGRADE_MAP,
  HIDDEN_STAT_MAP,
  ITEM_MAP,
  NPC_MAP,
  RACE_MAP,
  SHIP_UPGRADE_MAP,
  SKILL_MAP,
} from '../data';
import type {
  BaseBuildingId,
  CoreStatKey,
  GameState,
  Requirement,
  ResourceKey,
  ShipModuleId,
  StoryletChoice,
} from '../types/game';

export function getMaxHullFromState(state: GameState): number {
  const lvl = state.ship.upgrades.hull ?? 1;
  return 100 + (lvl - 1) * 30;
}

export function evaluateRequirement(state: GameState, req?: Requirement): boolean {
  if (!req) return true;

  if (req.minStat) {
    for (const [stat, minVal] of Object.entries(req.minStat) as [CoreStatKey, number][]) {
      if ((state.stats[stat] ?? 0) < minVal) return false;
    }
  }

  if (req.hasSkill) {
    for (const skillId of req.hasSkill) {
      if (!state.skills.includes(skillId)) return false;
    }
  }

  if (req.missingSkill) {
    for (const skillId of req.missingSkill) {
      if (state.skills.includes(skillId)) return false;
    }
  }

  if (req.minShipUpgrade) {
    for (const [id, minLvl] of Object.entries(req.minShipUpgrade) as [ShipModuleId, number][]) {
      if ((state.ship.upgrades[id] ?? 0) < minLvl) return false;
    }
  }

  if (req.minBaseUpgrade) {
    for (const [id, minLvl] of Object.entries(req.minBaseUpgrade) as [BaseBuildingId, number][]) {
      if ((state.base.upgrades[id] ?? 0) < minLvl) return false;
    }
  }

  if (req.hasFlag) {
    for (const flag of req.hasFlag) {
      if (!state.flags[flag]) return false;
    }
  }

  if (req.missingFlag) {
    for (const flag of req.missingFlag) {
      if (state.flags[flag]) return false;
    }
  }

  if (req.hasHiddenStat) {
    for (const hId of req.hasHiddenStat) {
      if (!state.unlockedHiddenStats.includes(hId)) return false;
    }
  }

  if (req.hasNpc) {
    for (const npcId of req.hasNpc) {
      if (!state.npcs.includes(npcId)) return false;
    }
  }

  if (req.missingNpc) {
    for (const npcId of req.missingNpc) {
      if (state.npcs.includes(npcId)) return false;
    }
  }

  if (req.hasItem) {
    for (const itemId of req.hasItem) {
      if (!state.items.includes(itemId)) return false;
    }
  }

  if (req.hasRace && req.hasRace.length > 0) {
    if (!req.hasRace.includes(state.character.raceId)) return false;
  }

  if (req.hasBackground && req.hasBackground.length > 0) {
    if (!req.hasBackground.includes(state.character.backgroundId)) return false;
  }

  if (req.minResource) {
    for (const [res, minVal] of Object.entries(req.minResource) as [ResourceKey, number][]) {
      if ((state.resources[res] ?? 0) < minVal) return false;
    }
  }

  if (req.maxHullPercent !== undefined) {
    const pct = (state.ship.hull / getMaxHullFromState(state)) * 100;
    if (pct > req.maxHullPercent) return false;
  }

  if (req.minTrust) {
    for (const [id, minVal] of Object.entries(req.minTrust)) {
      if ((state.relationships[id]?.trust ?? 0) < minVal) return false;
    }
  }

  if (req.maxTrust) {
    for (const [id, maxVal] of Object.entries(req.maxTrust)) {
      if ((state.relationships[id]?.trust ?? 0) > maxVal) return false;
    }
  }

  if (req.minBondTier) {
    for (const [id, minTier] of Object.entries(req.minBondTier)) {
      if ((state.relationships[id]?.bondTier ?? 0) < minTier) return false;
    }
  }

  if (req.hasMetNpc) {
    for (const id of req.hasMetNpc) {
      if (!state.relationships[id]?.met) return false;
    }
  }

  if (req.hasRomance) {
    for (const id of req.hasRomance) {
      if (!state.relationships[id]?.romance) return false;
    }
  }

  if (req.isRival) {
    for (const id of req.isRival) {
      if (!state.relationships[id]?.rival) return false;
    }
  }

  if (req.anyOf && req.anyOf.length > 0) {
    if (!req.anyOf.some((sub) => evaluateRequirement(state, sub))) return false;
  }

  if (req.allOf && req.allOf.length > 0) {
    if (!req.allOf.every((sub) => evaluateRequirement(state, sub))) return false;
  }

  return true;
}

export function describeRequirementShort(req?: Requirement): string[] {
  if (!req) return [];
  const parts: string[] = [];

  if (req.minStat) {
    for (const [stat, val] of Object.entries(req.minStat)) {
      parts.push(`${stat.toUpperCase()} ${val}+`);
    }
  }
  if (req.hasSkill) {
    for (const id of req.hasSkill) {
      parts.push(SKILL_MAP.get(id)?.name ?? id);
    }
  }
  if (req.minShipUpgrade) {
    for (const [id, lvl] of Object.entries(req.minShipUpgrade)) {
      const def = SHIP_UPGRADE_MAP.get(id as ShipModuleId);
      parts.push(`${def?.shortName ?? id} Lv.${lvl}+`);
    }
  }
  if (req.minBaseUpgrade) {
    for (const [id, lvl] of Object.entries(req.minBaseUpgrade)) {
      const def = BASE_UPGRADE_MAP.get(id as BaseBuildingId);
      parts.push(`${def?.shortName ?? id} Lv.${lvl}+`);
    }
  }
  if (req.hasHiddenStat) {
    for (const id of req.hasHiddenStat) {
      parts.push(HIDDEN_STAT_MAP.get(id)?.name ?? id);
    }
  }
  if (req.hasNpc) {
    for (const id of req.hasNpc) {
      parts.push(NPC_MAP.get(id)?.name ?? id);
    }
  }
  if (req.hasItem) {
    for (const id of req.hasItem) {
      parts.push(ITEM_MAP.get(id)?.name ?? id);
    }
  }
  if (req.hasRace) {
    for (const id of req.hasRace) {
      parts.push(RACE_MAP.get(id)?.name ?? id);
    }
  }
  if (req.hasBackground) {
    for (const id of req.hasBackground) {
      parts.push(BACKGROUND_MAP.get(id)?.name ?? id);
    }
  }
  if (req.minResource) {
    for (const [res, amt] of Object.entries(req.minResource)) {
      const label = res === 'aetherShards' ? 'Aether' : res;
      parts.push(`${amt} ${label}`);
    }
  }
  if (req.minTrust) {
    for (const [id, val] of Object.entries(req.minTrust)) {
      parts.push(`${NPC_MAP.get(id)?.shortName ?? id} Trust ${val}+`);
    }
  }
  if (req.minBondTier) {
    for (const [id, tier] of Object.entries(req.minBondTier)) {
      parts.push(`${NPC_MAP.get(id)?.shortName ?? id} Bond ${tier}+`);
    }
  }
  if (req.hasMetNpc) {
    for (const id of req.hasMetNpc) {
      parts.push(`Met ${NPC_MAP.get(id)?.shortName ?? id}`);
    }
  }
  if (req.hasRomance) {
    for (const id of req.hasRomance) {
      parts.push(`${NPC_MAP.get(id)?.shortName ?? id} Spark`);
    }
  }
  if (req.isRival) {
    for (const id of req.isRival) {
      parts.push(`${NPC_MAP.get(id)?.shortName ?? id} Rival`);
    }
  }

  return parts;
}

export function getChoiceCues(state: GameState, choice: StoryletChoice): string[] {
  const cues: string[] = [];
  if (choice.badge) {
    if (choice.badge === 'Synergy') cues.push('Magi-Tech Synergy');
    else if (choice.badge === 'Ship') cues.push('Ship Assisted');
    else if (choice.badge === 'Base') cues.push('Outpost Unlocked');
    else if (choice.badge === 'Hidden') cues.push('Trait / Tactical');
    else if (choice.badge === 'Skill') cues.push('Skill Edge');
    else if (choice.badge === 'Stat') cues.push('Stat Trial');
    else if (choice.badge === 'Origin') cues.push('Origin Edge');
    else if (choice.badge === 'Bond') cues.push('Character Bond');
  }

  if (choice.check?.skillBonuses) {
    for (const sb of choice.check.skillBonuses) {
      if (state.skills.includes(sb.skillId)) {
        const name = SKILL_MAP.get(sb.skillId)?.name ?? sb.skillId;
        cues.push(`+${sb.bonus} ${name}`);
      }
    }
  }
  if (choice.check?.shipBonuses) {
    for (const shb of choice.check.shipBonuses) {
      if ((state.ship.upgrades[shb.upgradeId] ?? 0) >= shb.minLevel) {
        const name = SHIP_UPGRADE_MAP.get(shb.upgradeId)?.shortName ?? shb.upgradeId;
        cues.push(`+${shb.bonus} ${name} Lv.${shb.minLevel}`);
      }
    }
  }
  if (choice.check?.baseBonuses) {
    for (const bb of choice.check.baseBonuses) {
      if ((state.base.upgrades[bb.upgradeId] ?? 0) >= bb.minLevel) {
        const name = BASE_UPGRADE_MAP.get(bb.upgradeId)?.shortName ?? bb.upgradeId;
        cues.push(`+${bb.bonus} ${name} Lv.${bb.minLevel}`);
      }
    }
  }
  if (choice.check?.npcTrustBonuses) {
    for (const nb of choice.check.npcTrustBonuses) {
      if ((state.relationships[nb.npcId]?.trust ?? 0) >= nb.minTrust) {
        const name = NPC_MAP.get(nb.npcId)?.shortName ?? nb.npcId;
        cues.push(`+${nb.bonus} ${name} Trust`);
      }
    }
  }

  return Array.from(new Set(cues));
}
