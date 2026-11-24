export type CoreStatKey =
  | 'grit'
  | 'guile'
  | 'tech'
  | 'presence'
  | 'lore'
  | 'resonance';

export type ResourceKey = 'credits' | 'salvage' | 'aetherShards';

export type ShipModuleId = 'hull' | 'drive' | 'sensors' | 'cargo' | 'workbench';

export type BaseBuildingId = 'dock' | 'cantina' | 'forge' | 'archive';

export interface CharacterProfile {
  name: string;
  callsign?: string;
  raceId: string;
  backgroundId: string;
  introCompleted: boolean;
}

export interface RaceDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  statBonus: CoreStatKey;
  hiddenStatBonus: string;
  hiddenHint: string;
}

export interface BackgroundDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  statBonus: CoreStatKey;
  flavorHook: string;
}

export interface OriginsDataFile {
  races: RaceDef[];
  backgrounds: BackgroundDef[];
}

export interface CodexEntryDef {
  id: string;
  title: string;
  category: 'history' | 'factions' | 'anomalies' | 'drift';
  summary: string;
  body: string[];
  unlockHint: string;
}

export interface QuestStageDef {
  id: string;
  title: string;
  objective: string;
  locationHint?: string;
  completedWhen: Requirement;
}

export interface QuestLineDef {
  id: string;
  title: string;
  track: 'frontier' | 'cosmic';
  subtitle: string;
  stages: QuestStageDef[];
}

export interface SpeakerMeta {
  name: string;
  title?: string;
  tone?: 'npc' | 'ai' | 'syndicate' | 'anomaly';
}

export interface Requirement {
  minStat?: Partial<Record<CoreStatKey, number>>;
  hasSkill?: string[];
  missingSkill?: string[];
  minShipUpgrade?: Partial<Record<ShipModuleId, number>>;
  minBaseUpgrade?: Partial<Record<BaseBuildingId, number>>;
  hasFlag?: string[];
  missingFlag?: string[];
  hasHiddenStat?: string[];
  hasNpc?: string[];
  missingNpc?: string[];
  hasItem?: string[];
  hasRace?: string[];
  hasBackground?: string[];
  minResource?: Partial<Record<ResourceKey, number>>;
  maxHullPercent?: number;
  minTrust?: Record<string, number>;
  maxTrust?: Record<string, number>;
  minBondTier?: Record<string, number>;
  hasMetNpc?: string[];
  hasRomance?: string[];
  isRival?: string[];
  anyOf?: Requirement[];
  allOf?: Requirement[];
}

export interface StatCheck {
  stat: CoreStatKey;
  difficulty: number;
  skillBonuses?: { skillId: string; bonus: number }[];
  shipBonuses?: { upgradeId: ShipModuleId; minLevel: number; bonus: number }[];
  baseBonuses?: { upgradeId: BaseBuildingId; minLevel: number; bonus: number }[];
  itemBonuses?: { itemId: string; bonus: number }[];
  npcTrustBonuses?: { npcId: string; minTrust: number; bonus: number }[];
}

export interface EffectPayload {
  nextNodeId: string | null;
  resultText: string;
  resources?: Partial<Record<ResourceKey, number>>;
  hullDelta?: number;
  fuelDelta?: number;
  statDelta?: Partial<Record<CoreStatKey, number>>;
  hiddenCounters?: Record<string, number>;
  grantSkills?: string[];
  grantItems?: string[];
  removeItems?: string[];
  setFlags?: Record<string, boolean>;
  recruitNpcs?: string[];
  meetNpcs?: string[];
  trustDelta?: Record<string, number>;
  setBondTier?: Record<string, number>;
  setRomance?: Record<string, boolean>;
  setRival?: Record<string, boolean>;
  unlockCodex?: string[];
  travelTo?: string;
}

export interface StoryletChoice {
  id: string;
  label: string;
  hint?: string;
  badge?: 'Skill' | 'Ship' | 'Synergy' | 'Hidden' | 'Base' | 'Stat' | 'Origin' | 'Bond';
  requirements?: Requirement;
  check?: StatCheck;
  onSuccess: EffectPayload;
  onFailure?: EffectPayload;
}

export interface StoryletNode {
  id: string;
  title?: string;
  speaker?: SpeakerMeta;
  paragraphs: string[];
  choices: StoryletChoice[];
}

export type StoryletTag =
  | 'main'
  | 'contract'
  | 'encounter'
  | 'mentor'
  | 'bond'
  | 'anomaly'
  | 'salvage'
  | 'settlement';

export interface Storylet {
  id: string;
  title: string;
  subtitle: string;
  locationId: string;
  npcId?: string;
  tag: StoryletTag;
  repeatable: boolean;
  requirements?: Requirement;
  entryNodeId: string;
  nodes: Record<string, StoryletNode>;
}

export interface DescriptionVariant {
  priority: number;
  requirements: Requirement;
  text: string;
}

export interface LocationDef {
  id: string;
  name: string;
  region: string;
  category: 'ship' | 'base' | 'frontier';
  fuelCost: number;
  travelRequirements?: Requirement;
  travelLockedHint?: string;
  baseDescription: string;
  descriptionVariants: DescriptionVariant[];
}

export interface SkillDef {
  id: string;
  name: string;
  category: 'combat' | 'arcana' | 'tech' | 'field';
  description: string;
  synergyResult?: boolean;
}

export interface SynergyDef {
  id: string;
  resultSkillId: string;
  name: string;
  ingredients: [string, string];
  minWorkbenchLevel: number;
  costs: Partial<Record<ResourceKey, number>>;
  grantItemId?: string;
  hiddenCounters?: Record<string, number>;
  description: string;
}

export interface SkillsDataFile {
  skills: SkillDef[];
  synergies: SynergyDef[];
}

export interface UpgradeLevelDef {
  level: number;
  title: string;
  summary: string;
  costs: Partial<Record<ResourceKey, number>>;
  requiredNpcId?: string;
}

export interface UpgradeDef<TId extends string = string> {
  id: TId;
  name: string;
  shortName: string;
  maxLevel: number;
  description: string;
  levels: UpgradeLevelDef[];
}

export interface UpgradesDataFile {
  ship: UpgradeDef<ShipModuleId>[];
  base: UpgradeDef<BaseBuildingId>[];
}

export interface HiddenStatDef {
  id: string;
  name: string;
  kind: 'identity' | 'scar';
  axis?: string;
  oppositeId?: string;
  threshold: number;
  description: string;
  effectSummary: string;
}

export interface NpcNoteDef {
  id: string;
  text: string;
  requiresFlag?: string;
  minTrust?: number;
}

export interface NpcRelationshipState {
  met: boolean;
  trust: number;
  bondTier: number;
  romance?: boolean;
  rival?: boolean;
}

export interface NpcDef {
  id: string;
  name: string;
  shortName: string;
  title: string;
  role: string;
  faction: 'crew' | 'siltport' | 'syndicate' | 'drift';
  homeLocationId?: string;
  recruitable: boolean;
  romanceable?: boolean;
  mentorshipStats?: CoreStatKey[];
  description: string;
  perkSummary?: string;
  notes?: NpcNoteDef[];
}

export interface ItemDef {
  id: string;
  name: string;
  category: 'relic' | 'gear' | 'intel';
  description: string;
}

export interface StoryletLogEntry {
  choiceLabel?: string;
  rollSummary?: string;
  outcomeKind?: 'success' | 'fail_forward' | 'narrative';
  speaker?: SpeakerMeta;
  text: string;
}

export interface ActiveStoryletState {
  storyletId: string;
  currentNodeId: string;
  log: StoryletLogEntry[];
  finished: boolean;
}

export type ToastKind =
  | 'stat'
  | 'hidden'
  | 'scar'
  | 'skill'
  | 'upgrade'
  | 'npc'
  | 'bond'
  | 'lore'
  | 'warning'
  | 'info';

export interface GameToast {
  id: string;
  kind: ToastKind;
  title: string;
  detail: string;
}

export interface GameSettings {
  theme: 'dark' | 'light';
  textSize: 'sm' | 'md' | 'lg';
}

export interface SaveSlotMeta {
  slotId: 1 | 2 | 3;
  savedAt: string;
  characterName: string;
  locationName: string;
  completedCount: number;
}

export interface GameState {
  version: number;
  character: CharacterProfile;
  locationId: string;
  stats: Record<CoreStatKey, number>;
  resources: Record<ResourceKey, number>;
  ship: {
    name: string;
    hull: number;
    fuel: number;
    upgrades: Record<ShipModuleId, number>;
  };
  base: {
    name: string;
    upgrades: Record<BaseBuildingId, number>;
  };
  skills: string[];
  items: string[];
  npcs: string[];
  relationships: Record<string, NpcRelationshipState>;
  flags: Record<string, boolean>;
  hiddenCounters: Record<string, number>;
  unlockedHiddenStats: string[];
  lockedHiddenStats: string[];
  unlockedCodex: string[];
  completedStorylets: string[];
  activeStorylet: ActiveStoryletState | null;
  lastSavedAt: string | null;
  settings: GameSettings;
}
