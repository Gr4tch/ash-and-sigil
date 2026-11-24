import { BASE_UPGRADE_MAP, ITEM_MAP, NPC_MAP, SHIP_UPGRADE_MAP, SKILL_MAP } from '../data';
import type { GameState, StatCheck } from '../types/game';

export interface CheckPreview {
  statLabel: string;
  baseStat: number;
  bonusTotal: number;
  bonusSources: string[];
  effectiveScore: number;
  difficulty: number;
  winChancePercent: number;
}

export interface CheckResolution {
  passed: boolean;
  roll: number;
  effectiveScore: number;
  difficulty: number;
  summaryText: string;
}

export function getCheckPreview(state: GameState, check: StatCheck): CheckPreview {
  const baseStat = state.stats[check.stat] ?? 1;
  let bonusTotal = 0;
  const bonusSources: string[] = [];

  if (check.skillBonuses) {
    for (const sb of check.skillBonuses) {
      if (state.skills.includes(sb.skillId)) {
        bonusTotal += sb.bonus;
        bonusSources.push(`${SKILL_MAP.get(sb.skillId)?.name ?? sb.skillId} +${sb.bonus}`);
      }
    }
  }

  if (check.shipBonuses) {
    for (const shb of check.shipBonuses) {
      if ((state.ship.upgrades[shb.upgradeId] ?? 0) >= shb.minLevel) {
        bonusTotal += shb.bonus;
        bonusSources.push(
          `${SHIP_UPGRADE_MAP.get(shb.upgradeId)?.shortName ?? shb.upgradeId} +${shb.bonus}`
        );
      }
    }
  }

  if (check.baseBonuses) {
    for (const bb of check.baseBonuses) {
      if ((state.base.upgrades[bb.upgradeId] ?? 0) >= bb.minLevel) {
        bonusTotal += bb.bonus;
        bonusSources.push(
          `${BASE_UPGRADE_MAP.get(bb.upgradeId)?.shortName ?? bb.upgradeId} +${bb.bonus}`
        );
      }
    }
  }

  if (check.itemBonuses) {
    for (const ib of check.itemBonuses) {
      if (state.items.includes(ib.itemId)) {
        bonusTotal += ib.bonus;
        bonusSources.push(`${ITEM_MAP.get(ib.itemId)?.name ?? ib.itemId} +${ib.bonus}`);
      }
    }
  }

  if (check.npcTrustBonuses) {
    for (const nb of check.npcTrustBonuses) {
      if ((state.relationships[nb.npcId]?.trust ?? 0) >= nb.minTrust) {
        bonusTotal += nb.bonus;
        bonusSources.push(`${NPC_MAP.get(nb.npcId)?.shortName ?? nb.npcId} Trust +${nb.bonus}`);
      }
    }
  }

  const effectiveScore = baseStat + bonusTotal;
  // d6 roll (1..6): need effectiveScore + roll >= difficulty => roll >= difficulty - effectiveScore
  const neededRoll = check.difficulty - effectiveScore;
  let successFaces = 0;
  if (neededRoll <= 1) successFaces = 6;
  else if (neededRoll > 6) successFaces = 0;
  else successFaces = 7 - neededRoll;

  const winChancePercent = Math.round((successFaces / 6) * 100);

  return {
    statLabel: check.stat.toUpperCase(),
    baseStat,
    bonusTotal,
    bonusSources,
    effectiveScore,
    difficulty: check.difficulty,
    winChancePercent,
  };
}

export function resolveCheck(state: GameState, check: StatCheck): CheckResolution {
  const preview = getCheckPreview(state, check);
  const roll = Math.floor(Math.random() * 6) + 1;
  const total = preview.effectiveScore + roll;
  const passed = total >= check.difficulty;

  return {
    passed,
    roll,
    effectiveScore: preview.effectiveScore,
    difficulty: check.difficulty,
    summaryText: `${preview.statLabel} ${preview.effectiveScore} + d6(${roll}) = ${total} vs DC ${check.difficulty}`,
  };
}
