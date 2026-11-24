import { Check, Cpu, Fuel, Hammer, Rocket, Shield, Sparkles, Wrench } from 'lucide-react';
import { SKILLS_DATA, SKILL_MAP, UPGRADES_DATA } from '../data';
import {
  canAffordCosts,
  getAdjustedSynergyCosts,
  getAdjustedUpgradeCosts,
  getMaxFuel,
  getMaxHull,
  getRepairCreditCost,
} from '../engine/storyletEngine';
import type { GameState, ResourceKey } from '../types/game';

interface ShipTabProps {
  state: GameState;
  onRepair: (method: 'salvage' | 'credits') => void;
  onRefuel: () => void;
  onUpgrade: (id: string) => void;
  onCraftSynergy: (synergyId: string) => void;
}

function formatCosts(costs: Partial<Record<ResourceKey, number>>): string {
  const parts: string[] = [];
  if (costs.salvage) parts.push(`${costs.salvage} Salvage`);
  if (costs.credits) parts.push(`${costs.credits} Cr`);
  if (costs.aetherShards) parts.push(`${costs.aetherShards} Aether`);
  return parts.join(' · ');
}

export function ShipTab({
  state,
  onRepair,
  onRefuel,
  onUpgrade,
  onCraftSynergy,
}: ShipTabProps) {
  const maxHull = getMaxHull(state);
  const maxFuel = getMaxFuel(state);
  const hullPct = Math.round((state.ship.hull / maxHull) * 100);
  const repairCredits = getRepairCreditCost(state);
  const needsRepair = state.ship.hull < maxHull;
  const isBattered = state.ship.hull <= maxHull * 0.6;

  return (
    <div className="space-y-5 pb-6 select-none">
      {/* Ship Status & Repairs */}
      <section
        className="rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
            <div>
              <h1 className="text-base font-bold leading-tight">{state.ship.name}</h1>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Rusted Frontier Light Courier
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-amber)' }}>
            {state.ship.hull}/{maxHull} HULL
          </span>
        </div>

        {/* Hull Bar */}
        <div
          className="h-2.5 w-full rounded-full overflow-hidden border"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${hullPct}%`,
              backgroundColor:
                hullPct <= 35
                  ? 'var(--accent-danger)'
                  : hullPct <= 65
                    ? 'var(--accent-amber)'
                    : 'var(--accent-success)',
            }}
          />
        </div>

        {isBattered && (
          <p className="text-[11px]" style={{ color: 'var(--accent-amber)' }}>
            Bulkheads are buckled. Patching it yourself with Salvage builds field mastery.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            disabled={!needsRepair || state.resources.salvage < 1}
            onClick={() => onRepair('salvage')}
            className="min-h-[46px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Wrench className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
            <span>Patch +30 (1 Salvage)</span>
          </button>

          <button
            type="button"
            disabled={!needsRepair || state.resources.credits < repairCredits}
            onClick={() => onRepair('credits')}
            className="min-h-[46px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Shield className="w-3.5 h-3.5" style={{ color: 'var(--accent-success)' }} />
            <span>Dock +30 ({repairCredits} Cr)</span>
          </button>

          <button
            type="button"
            disabled={state.ship.fuel >= maxFuel}
            onClick={onRefuel}
            className="min-h-[46px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-45"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Fuel className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            <span>
              {state.ship.fuel === 0 && state.resources.credits < 15
                ? 'Bleed +2 Fuel (Free)'
                : 'Refuel +2 (15 Cr)'}
            </span>
          </button>
        </div>
      </section>

      {/* Magi-Tech Workbench Synergies */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            Magi-Tech Workbench (Lv.{state.ship.upgrades.workbench})
          </h2>
        </div>

        <div className="space-y-2.5">
          {SKILLS_DATA.synergies.map((syn) => {
            const forged = state.skills.includes(syn.resultSkillId);
            const hasIng1 = state.skills.includes(syn.ingredients[0]);
            const hasIng2 = state.skills.includes(syn.ingredients[1]);
            const hasBench = state.ship.upgrades.workbench >= syn.minWorkbenchLevel;
            const costs = getAdjustedSynergyCosts(state, syn.costs);
            const affordable = canAffordCosts(state, costs);
            const canForge = !forged && hasIng1 && hasIng2 && hasBench && affordable;

            return (
              <div
                key={syn.id}
                className="rounded-xl border p-3.5 space-y-2.5"
                style={{
                  backgroundColor: forged ? 'var(--accent-cyan-soft)' : 'var(--bg-card)',
                  borderColor: forged ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{syn.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {syn.description}
                    </div>
                  </div>
                  {forged && (
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: 'var(--accent-cyan)', color: '#110e0c' }}
                    >
                      Forged
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {syn.ingredients.map((ingId) => {
                    const learned = state.skills.includes(ingId);
                    const name = SKILL_MAP.get(ingId)?.name ?? ingId;
                    return (
                      <span
                        key={ingId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border"
                        style={{
                          borderColor: learned ? 'var(--accent-success)' : 'var(--border-subtle)',
                          color: learned ? 'var(--accent-success)' : 'var(--text-muted)',
                        }}
                      >
                        {learned && <Check className="w-3 h-3" />}
                        {name}
                      </span>
                    );
                  })}
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded border"
                    style={{
                      borderColor: hasBench ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      color: hasBench ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    }}
                  >
                    Workbench Lv.{syn.minWorkbenchLevel}+
                  </span>
                </div>

                {!forged && (
                  <button
                    type="button"
                    disabled={!canForge}
                    onClick={() => onCraftSynergy(syn.id)}
                    className="w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-45"
                    style={{
                      backgroundColor: canForge ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                      color: canForge ? '#110e0c' : 'var(--text-muted)',
                    }}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Forge Synergy ({formatCosts(costs)})</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Ship Modules */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Ship Modules
        </h2>

        <div className="space-y-2.5">
          {UPGRADES_DATA.ship.map((mod) => {
            const lvl = state.ship.upgrades[mod.id] ?? 1;
            const currentDef = mod.levels.find((l) => l.level === lvl);
            const nextDef = mod.levels.find((l) => l.level === lvl + 1);
            const nextCosts = nextDef ? getAdjustedUpgradeCosts(state, nextDef.costs) : null;
            const affordable = nextCosts ? canAffordCosts(state, nextCosts) : false;

            return (
              <div
                key={mod.id}
                className="rounded-xl border p-3.5 space-y-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{mod.name}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--accent-amber)' }}>
                      Lv.{lvl} — {currentDef?.title}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border shrink-0"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    {lvl}/{mod.maxLevel}
                  </span>
                </div>

                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {currentDef?.summary}
                </p>

                {nextDef && nextCosts ? (
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onUpgrade(mod.id)}
                    className="w-full min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 disabled:opacity-45"
                    style={{
                      backgroundColor: affordable ? 'var(--accent-amber-soft)' : 'var(--bg-elevated)',
                      borderColor: affordable ? 'var(--accent-amber)' : 'var(--border-subtle)',
                      color: affordable ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}
                  >
                    <span className="truncate">
                      Upgrade → Lv.{nextDef.level} ({nextDef.title})
                    </span>
                    <span className="shrink-0 font-mono">{formatCosts(nextCosts)}</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-semibold" style={{ color: 'var(--accent-success)' }}>
                    Maximum Tier Installed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
