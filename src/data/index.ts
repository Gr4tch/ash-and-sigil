import locationsJson from './locations.json';
import storyletsJson from './storylets.json';
import skillsJson from './skills.json';
import upgradesJson from './upgrades.json';
import hiddenStatsJson from './hiddenStats.json';
import npcsJson from './npcs.json';
import itemsJson from './items.json';
import originsJson from './origins.json';
import codexJson from './codex.json';
import questsJson from './quests.json';
import type {
  CodexEntryDef,
  HiddenStatDef,
  ItemDef,
  LocationDef,
  NpcDef,
  OriginsDataFile,
  QuestLineDef,
  SkillsDataFile,
  Storylet,
  UpgradesDataFile,
} from '../types/game';

export const LOCATIONS = locationsJson as unknown as LocationDef[];
export const STORYLETS = storyletsJson as unknown as Storylet[];
export const SKILLS_DATA = skillsJson as unknown as SkillsDataFile;
export const UPGRADES_DATA = upgradesJson as unknown as UpgradesDataFile;
export const HIDDEN_STATS = hiddenStatsJson as unknown as HiddenStatDef[];
export const NPCS = npcsJson as unknown as NpcDef[];
export const ITEMS = itemsJson as unknown as ItemDef[];
export const ORIGINS_DATA = originsJson as unknown as OriginsDataFile;
export const RACES = ORIGINS_DATA.races;
export const BACKGROUNDS = ORIGINS_DATA.backgrounds;
export const CODEX_ENTRIES = codexJson as unknown as CodexEntryDef[];
export const QUESTS = questsJson as unknown as QuestLineDef[];

export const LOCATION_MAP = new Map(LOCATIONS.map((l) => [l.id, l]));
export const SKILL_MAP = new Map(SKILLS_DATA.skills.map((s) => [s.id, s]));
export const SYNERGY_MAP = new Map(SKILLS_DATA.synergies.map((s) => [s.id, s]));
export const HIDDEN_STAT_MAP = new Map(HIDDEN_STATS.map((h) => [h.id, h]));
export const NPC_MAP = new Map(NPCS.map((n) => [n.id, n]));
export const ITEM_MAP = new Map(ITEMS.map((i) => [i.id, i]));
export const SHIP_UPGRADE_MAP = new Map(UPGRADES_DATA.ship.map((u) => [u.id, u]));
export const BASE_UPGRADE_MAP = new Map(UPGRADES_DATA.base.map((u) => [u.id, u]));
export const STORYLET_MAP = new Map(STORYLETS.map((s) => [s.id, s]));
export const RACE_MAP = new Map(RACES.map((r) => [r.id, r]));
export const BACKGROUND_MAP = new Map(BACKGROUNDS.map((b) => [b.id, b]));
export const CODEX_MAP = new Map(CODEX_ENTRIES.map((c) => [c.id, c]));
