import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../src/data');

function readJson(filename) {
  const fullPath = path.join(dataDir, filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const locations = readJson('locations.json');
const storylets = readJson('storylets.json');
const skillsData = readJson('skills.json');
const upgradesData = readJson('upgrades.json');
const hiddenStats = readJson('hiddenStats.json');
const npcs = readJson('npcs.json');
const items = readJson('items.json');
const origins = readJson('origins.json');
const codex = readJson('codex.json');
const quests = readJson('quests.json');

const errors = [];

const VALID_STATS = new Set(['grit', 'guile', 'tech', 'presence', 'lore', 'resonance']);
const VALID_RESOURCES = new Set(['credits', 'salvage', 'aetherShards']);

const locationIds = new Set(locations.map((l) => l.id));
const skillIds = new Set(skillsData.skills.map((s) => s.id));
const shipUpgradeMap = new Map(upgradesData.ship.map((u) => [u.id, u]));
const baseUpgradeMap = new Map(upgradesData.base.map((u) => [u.id, u]));
const hiddenStatMap = new Map(hiddenStats.map((h) => [h.id, h]));
const npcIds = new Set(npcs.map((n) => n.id));
const itemIds = new Set(items.map((i) => i.id));
const raceIds = new Set((origins.races ?? []).map((r) => r.id));
const backgroundIds = new Set((origins.backgrounds ?? []).map((b) => b.id));
const codexIds = new Set(codex.map((c) => c.id));

function validateRequirement(req, context) {
  if (!req) return;
  if (req.minStat) {
    for (const stat of Object.keys(req.minStat)) {
      if (!VALID_STATS.has(stat)) errors.push(`${context}: unknown stat "${stat}" in minStat`);
    }
  }
  for (const id of req.hasSkill ?? []) {
    if (!skillIds.has(id)) errors.push(`${context}: unknown skillId "${id}" in hasSkill`);
  }
  for (const id of req.missingSkill ?? []) {
    if (!skillIds.has(id)) errors.push(`${context}: unknown skillId "${id}" in missingSkill`);
  }
  if (req.minShipUpgrade) {
    for (const [id, lvl] of Object.entries(req.minShipUpgrade)) {
      const def = shipUpgradeMap.get(id);
      if (!def) errors.push(`${context}: unknown ship upgradeId "${id}"`);
      else if (lvl > def.maxLevel || lvl < 0)
        errors.push(`${context}: ship upgrade "${id}" level ${lvl} out of bounds`);
    }
  }
  if (req.minBaseUpgrade) {
    for (const [id, lvl] of Object.entries(req.minBaseUpgrade)) {
      const def = baseUpgradeMap.get(id);
      if (!def) errors.push(`${context}: unknown base upgradeId "${id}"`);
      else if (lvl > def.maxLevel || lvl < 0)
        errors.push(`${context}: base upgrade "${id}" level ${lvl} out of bounds`);
    }
  }
  for (const id of req.hasHiddenStat ?? []) {
    if (!hiddenStatMap.has(id)) errors.push(`${context}: unknown hiddenStatId "${id}"`);
  }
  for (const id of req.hasNpc ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in hasNpc`);
  }
  for (const id of req.missingNpc ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in missingNpc`);
  }
  for (const id of req.hasItem ?? []) {
    if (!itemIds.has(id)) errors.push(`${context}: unknown itemId "${id}" in hasItem`);
  }
  for (const id of req.hasRace ?? []) {
    if (!raceIds.has(id)) errors.push(`${context}: unknown raceId "${id}" in hasRace`);
  }
  for (const id of req.hasBackground ?? []) {
    if (!backgroundIds.has(id)) errors.push(`${context}: unknown backgroundId "${id}" in hasBackground`);
  }
  if (req.minResource) {
    for (const res of Object.keys(req.minResource)) {
      if (!VALID_RESOURCES.has(res)) errors.push(`${context}: unknown resource "${res}"`);
    }
  }
  for (const id of Object.keys(req.minTrust ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in minTrust`);
  }
  for (const id of Object.keys(req.maxTrust ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in maxTrust`);
  }
  for (const id of Object.keys(req.minBondTier ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in minBondTier`);
  }
  for (const id of req.hasMetNpc ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in hasMetNpc`);
  }
  for (const id of req.hasRomance ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in hasRomance`);
  }
  for (const id of req.isRival ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in isRival`);
  }
  for (const sub of req.anyOf ?? []) validateRequirement(sub, `${context}.anyOf`);
  for (const sub of req.allOf ?? []) validateRequirement(sub, `${context}.allOf`);
}

function validateCheck(check, context) {
  if (!check) return;
  if (!VALID_STATS.has(check.stat)) {
    errors.push(`${context}: unknown stat "${check.stat}" in check`);
  }
  for (const sb of check.skillBonuses ?? []) {
    if (!skillIds.has(sb.skillId))
      errors.push(`${context}: unknown skillId "${sb.skillId}" in skillBonuses`);
  }
  for (const shb of check.shipBonuses ?? []) {
    const def = shipUpgradeMap.get(shb.upgradeId);
    if (!def) errors.push(`${context}: unknown ship upgradeId "${shb.upgradeId}" in shipBonuses`);
    else if (shb.minLevel > def.maxLevel)
      errors.push(`${context}: shipBonuses level ${shb.minLevel} exceeds maxLevel`);
  }
  for (const bb of check.baseBonuses ?? []) {
    const def = baseUpgradeMap.get(bb.upgradeId);
    if (!def) errors.push(`${context}: unknown base upgradeId "${bb.upgradeId}" in baseBonuses`);
    else if (bb.minLevel > def.maxLevel)
      errors.push(`${context}: baseBonuses level ${bb.minLevel} exceeds maxLevel`);
  }
  for (const ib of check.itemBonuses ?? []) {
    if (!itemIds.has(ib.itemId))
      errors.push(`${context}: unknown itemId "${ib.itemId}" in itemBonuses`);
  }
  for (const nb of check.npcTrustBonuses ?? []) {
    if (!npcIds.has(nb.npcId))
      errors.push(`${context}: unknown npcId "${nb.npcId}" in npcTrustBonuses`);
  }
}

function validatePayload(payload, nodes, context) {
  if (!payload) return;
  if (payload.nextNodeId !== null && !nodes[payload.nextNodeId]) {
    errors.push(`${context}: nextNodeId "${payload.nextNodeId}" does not exist in storylet nodes`);
  }
  if (payload.travelTo && !locationIds.has(payload.travelTo)) {
    errors.push(`${context}: unknown travelTo locationId "${payload.travelTo}"`);
  }
  if (payload.resources) {
    for (const res of Object.keys(payload.resources)) {
      if (!VALID_RESOURCES.has(res)) errors.push(`${context}: unknown resource "${res}"`);
    }
  }
  if (payload.statDelta) {
    for (const stat of Object.keys(payload.statDelta)) {
      if (!VALID_STATS.has(stat)) errors.push(`${context}: unknown stat "${stat}" in statDelta`);
    }
  }
  if (payload.hiddenCounters) {
    for (const id of Object.keys(payload.hiddenCounters)) {
      if (!hiddenStatMap.has(id))
        errors.push(`${context}: unknown hiddenStatId "${id}" in hiddenCounters`);
    }
  }
  for (const id of payload.grantSkills ?? []) {
    if (!skillIds.has(id)) errors.push(`${context}: unknown skillId "${id}" in grantSkills`);
  }
  for (const id of payload.grantItems ?? []) {
    if (!itemIds.has(id)) errors.push(`${context}: unknown itemId "${id}" in grantItems`);
  }
  for (const id of payload.removeItems ?? []) {
    if (!itemIds.has(id)) errors.push(`${context}: unknown itemId "${id}" in removeItems`);
  }
  for (const id of payload.recruitNpcs ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in recruitNpcs`);
  }
  for (const id of payload.meetNpcs ?? []) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in meetNpcs`);
  }
  for (const id of Object.keys(payload.trustDelta ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in trustDelta`);
  }
  for (const id of Object.keys(payload.setBondTier ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in setBondTier`);
  }
  for (const id of Object.keys(payload.setRomance ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in setRomance`);
  }
  for (const id of Object.keys(payload.setRival ?? {})) {
    if (!npcIds.has(id)) errors.push(`${context}: unknown npcId "${id}" in setRival`);
  }
  for (const id of payload.unlockCodex ?? []) {
    if (!codexIds.has(id)) errors.push(`${context}: unknown codexId "${id}" in unlockCodex`);
  }
}

// 1. Validate Hidden Stats mutual exclusion pairs
for (const hs of hiddenStats) {
  if (hs.kind === 'identity') {
    if (!hs.oppositeId) {
      errors.push(`hiddenStats[${hs.id}]: identity stat missing oppositeId`);
    } else {
      const opp = hiddenStatMap.get(hs.oppositeId);
      if (!opp) {
        errors.push(`hiddenStats[${hs.id}]: oppositeId "${hs.oppositeId}" does not exist`);
      } else {
        if (opp.kind !== 'identity') {
          errors.push(`hiddenStats[${hs.id}]: opposite "${hs.oppositeId}" is not kind "identity"`);
        }
        if (opp.oppositeId !== hs.id) {
          errors.push(`hiddenStats[${hs.id}]: mutual exclusion is not symmetric with "${hs.oppositeId}"`);
        }
        if (hs.axis && opp.axis && hs.axis !== opp.axis) {
          errors.push(`hiddenStats[${hs.id}]: axis "${hs.axis}" != "${opp.axis}"`);
        }
      }
    }
  } else if (hs.kind === 'scar' && hs.oppositeId) {
    errors.push(`hiddenStats[${hs.id}]: scar should not define oppositeId`);
  }
}

// 2. Validate Locations
for (const loc of locations) {
  validateRequirement(loc.travelRequirements, `location[${loc.id}].travelRequirements`);
  for (let i = 0; i < (loc.descriptionVariants ?? []).length; i++) {
    validateRequirement(
      loc.descriptionVariants[i].requirements,
      `location[${loc.id}].descriptionVariants[${i}]`
    );
  }
}

// 2b. Validate NPCs
const VALID_FACTIONS = new Set(['crew', 'siltport', 'syndicate', 'drift']);
for (const npc of npcs) {
  if (!npc.shortName) {
    errors.push(`npc[${npc.id}]: missing shortName`);
  }
  if (!VALID_FACTIONS.has(npc.faction)) {
    errors.push(`npc[${npc.id}]: unknown faction "${npc.faction}"`);
  }
  if (npc.homeLocationId && !locationIds.has(npc.homeLocationId)) {
    errors.push(`npc[${npc.id}]: unknown homeLocationId "${npc.homeLocationId}"`);
  }
  for (const stat of npc.mentorshipStats ?? []) {
    if (!VALID_STATS.has(stat)) {
      errors.push(`npc[${npc.id}]: unknown mentorshipStat "${stat}"`);
    }
  }
}

// 3. Validate Upgrades
for (const upg of [...upgradesData.ship, ...upgradesData.base]) {
  for (const lvl of upg.levels) {
    if (lvl.requiredNpcId && !npcIds.has(lvl.requiredNpcId)) {
      errors.push(`upgrade[${upg.id}].level[${lvl.level}]: unknown requiredNpcId "${lvl.requiredNpcId}"`);
    }
  }
}

// 4. Validate Synergies
for (const syn of skillsData.synergies) {
  if (!skillIds.has(syn.resultSkillId)) {
    errors.push(`synergy[${syn.id}]: unknown resultSkillId "${syn.resultSkillId}"`);
  }
  for (const ing of syn.ingredients) {
    if (!skillIds.has(ing)) {
      errors.push(`synergy[${syn.id}]: unknown ingredient skillId "${ing}"`);
    }
  }
  if (syn.grantItemId && !itemIds.has(syn.grantItemId)) {
    errors.push(`synergy[${syn.id}]: unknown grantItemId "${syn.grantItemId}"`);
  }
  for (const hsId of Object.keys(syn.hiddenCounters ?? {})) {
    if (!hiddenStatMap.has(hsId)) {
      errors.push(`synergy[${syn.id}]: unknown hiddenStatId "${hsId}"`);
    }
  }
}

// 5. Validate Storylets & Graph Reachability
let totalNodes = 0;
let totalChoices = 0;

for (const sl of storylets) {
  if (!locationIds.has(sl.locationId)) {
    errors.push(`storylet[${sl.id}]: unknown locationId "${sl.locationId}"`);
  }
  if (sl.npcId && !npcIds.has(sl.npcId)) {
    errors.push(`storylet[${sl.id}]: unknown npcId "${sl.npcId}"`);
  }
  validateRequirement(sl.requirements, `storylet[${sl.id}].requirements`);

  if (!sl.nodes[sl.entryNodeId]) {
    errors.push(`storylet[${sl.id}]: entryNodeId "${sl.entryNodeId}" not found in nodes`);
    continue;
  }

  // BFS reachability from entryNodeId
  const visited = new Set([sl.entryNodeId]);
  const queue = [sl.entryNodeId];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    const node = sl.nodes[nodeId];
    if (!node) continue;
    for (const ch of node.choices) {
      if (ch.onSuccess?.nextNodeId && sl.nodes[ch.onSuccess.nextNodeId] && !visited.has(ch.onSuccess.nextNodeId)) {
        visited.add(ch.onSuccess.nextNodeId);
        queue.push(ch.onSuccess.nextNodeId);
      }
      if (ch.onFailure?.nextNodeId && sl.nodes[ch.onFailure.nextNodeId] && !visited.has(ch.onFailure.nextNodeId)) {
        visited.add(ch.onFailure.nextNodeId);
        queue.push(ch.onFailure.nextNodeId);
      }
    }
  }

  for (const [nodeId, node] of Object.entries(sl.nodes)) {
    totalNodes++;
    if (!visited.has(nodeId)) {
      errors.push(`storylet[${sl.id}].node[${nodeId}]: unreachable from entryNodeId "${sl.entryNodeId}"`);
    }
    for (const ch of node.choices) {
      totalChoices++;
      const ctx = `storylet[${sl.id}].node[${nodeId}].choice[${ch.id}]`;
      validateRequirement(ch.requirements, `${ctx}.requirements`);
      validateCheck(ch.check, `${ctx}.check`);
      validatePayload(ch.onSuccess, sl.nodes, `${ctx}.onSuccess`);
      if (ch.check && !ch.onFailure) {
        errors.push(`${ctx}: choice has a stat check but is missing fail-forward onFailure payload`);
      }
      if (ch.onFailure) {
        validatePayload(ch.onFailure, sl.nodes, `${ctx}.onFailure`);
      }
    }
  }
}

// 6. Validate Origins, Codex & Quests
for (const r of origins.races ?? []) {
  if (!VALID_STATS.has(r.statBonus)) {
    errors.push(`race[${r.id}]: unknown statBonus "${r.statBonus}"`);
  }
  if (!hiddenStatMap.has(r.hiddenStatBonus)) {
    errors.push(`race[${r.id}]: unknown hiddenStatBonus "${r.hiddenStatBonus}"`);
  }
}
for (const bg of origins.backgrounds ?? []) {
  if (!VALID_STATS.has(bg.statBonus)) {
    errors.push(`background[${bg.id}]: unknown statBonus "${bg.statBonus}"`);
  }
}
for (const q of quests) {
  for (const st of q.stages ?? []) {
    validateRequirement(st.completedWhen, `quest[${q.id}].stage[${st.id}].completedWhen`);
  }
}

if (errors.length > 0) {
  console.error(`Story validation FAILED with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `Story validation PASSED: ${locations.length} locations, ${storylets.length} storylets (${totalNodes} nodes, ${totalChoices} choices), ${npcs.length} NPCs, ${origins.races.length} races, ${origins.backgrounds.length} backgrounds, ${quests.length} questlines, ${codex.length} codex entries, ${skillsData.skills.length} skills, ${skillsData.synergies.length} synergies, ${hiddenStats.length} hidden stats.`
);
