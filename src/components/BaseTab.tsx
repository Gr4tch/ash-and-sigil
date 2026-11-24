import { Building2, Coins, Hammer, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { LOCATIONS, LOCATION_MAP, NPCS, UPGRADES_DATA } from '../data';
import {
  canAffordCosts,
  getAdjustedUpgradeCosts,
  getAvailableStorylets,
  getExchangeRates,
  getNpcDispositionLabel,
} from '../engine/storyletEngine';
import type { GameState, NpcDef, ResourceKey } from '../types/game';

interface BaseTabProps {
  state: GameState;
  onUpgrade: (id: string) => void;
  onSellResource: (resource: 'salvage' | 'aetherShards', quantity: number) => void;
}

function formatCosts(costs: Partial<Record<ResourceKey, number>>): string {
  const parts: string[] = [];
  if (costs.salvage) parts.push(`${costs.salvage} Salvage`);
  if (costs.credits) parts.push(`${costs.credits} Cr`);
  if (costs.aetherShards) parts.push(`${costs.aetherShards} Aether`);
  return parts.join(' · ');
}

function getDispositionStyle(label: string): { bg: string; color: string; border: string } {
  switch (label) {
    case 'Rival':
    case 'Hostile':
      return {
        bg: 'var(--accent-danger-soft)',
        color: 'var(--accent-danger)',
        border: 'var(--accent-danger)',
      };
    case 'Trusted':
    case 'Confidant':
    case 'Sworn Ally':
      return {
        bg: 'var(--accent-cyan-soft)',
        color: 'var(--accent-cyan)',
        border: 'var(--accent-cyan)',
      };
    default:
      return {
        bg: 'var(--accent-amber-soft)',
        color: 'var(--accent-amber)',
        border: 'var(--border-subtle)',
      };
  }
}

export function BaseTab({ state, onUpgrade, onSellResource }: BaseTabProps) {
  const totalLevels = Object.values(state.base.upgrades).reduce((a, b) => a + b, 0);
  const rates = getExchangeRates(state);

  const recruitedNpcs = NPCS.filter((n) => state.npcs.includes(n.id));
  const metContacts = NPCS.filter(
    (n) => !state.npcs.includes(n.id) && Boolean(state.relationships[n.id]?.met)
  );

  const getNpcReadyLocation = (npc: NpcDef): string | null => {
    for (const loc of LOCATIONS) {
      const ready = getAvailableStorylets(state, loc.id).some(
        (sl) => sl.npcId === npc.id && (sl.tag === 'bond' || sl.tag === 'mentor')
      );
      if (ready) return loc.id;
    }
    return null;
  };

  const renderNpcCard = (npc: NpcDef, isRecruited: boolean) => {
    const rel = state.relationships[npc.id];
    const disposition = getDispositionStyle(getNpcDispositionLabel(rel));
    const dispositionLabel = getNpcDispositionLabel(rel);
    const unlockedNotes = (npc.notes ?? []).filter((note) => {
      if (note.requiresFlag && !state.flags[note.requiresFlag]) return false;
      if (note.minTrust !== undefined && (rel?.trust ?? 0) < note.minTrust) return false;
      return true;
    });
    const homeName = npc.homeLocationId
      ? LOCATION_MAP.get(npc.homeLocationId)?.name ?? npc.homeLocationId
      : null;
    const readyLocationId = getNpcReadyLocation(npc);
    const bondReady = Boolean(readyLocationId);
    const readyLocationName =
      readyLocationId && readyLocationId !== npc.homeLocationId
        ? LOCATION_MAP.get(readyLocationId)?.name ?? readyLocationId
        : null;

    return (
      <div
        key={npc.id}
        className="rounded-xl border p-3.5 space-y-2"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: isRecruited ? 'var(--accent-cyan)' : disposition.border,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold">{npc.name}</span>
              {rel?.romance && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--accent-amber-soft)',
                    color: 'var(--accent-amber)',
                  }}
                >
                  <Heart className="w-2.5 h-2.5" /> Spark
                </span>
              )}
              {bondReady && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--accent-cyan-soft)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {readyLocationName ? `Scene Ready (${readyLocationName})` : 'Scene Ready'}
                </span>
              )}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {npc.title} · {npc.role}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: disposition.bg, color: disposition.color }}
            >
              {dispositionLabel}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Trust {rel?.trust ?? 0}
              {rel && rel.bondTier > 0 ? ` · Bond ${rel.bondTier}` : ''}
            </span>
          </div>
        </div>

        <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
          {npc.description}
        </p>

        {npc.perkSummary && isRecruited && (
          <div className="text-[11px] font-semibold" style={{ color: 'var(--accent-success)' }}>
            Perk: {npc.perkSummary}
          </div>
        )}

        {(npc.mentorshipStats?.length || homeName) && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {homeName && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> {homeName}
              </span>
            )}
            {npc.mentorshipStats && npc.mentorshipStats.length > 0 && (
              <span className="uppercase tracking-wider text-[10px] font-semibold">
                Mentors: {npc.mentorshipStats.join(' / ')}
              </span>
            )}
          </div>
        )}

        {unlockedNotes.length > 0 && (
          <div
            className="pt-2 border-t space-y-1"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {unlockedNotes.map((note) => (
              <div
                key={note.id}
                className="text-[11px] leading-snug"
                style={{ color: 'var(--text-primary)' }}
              >
                • {note.text}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-6 select-none">
      {/* Settlement Overview */}
      <section
        className="rounded-xl border p-4 space-y-2"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
            <div>
              <h1 className="text-base font-bold leading-tight">{state.base.name}</h1>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Frontier Anchorage · Development Tier {totalLevels}
              </p>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}
          >
            {state.npcs.length} Crew
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Upgrading Siltport structures permanently alters the outpost&apos;s prose, lowers
          repair and forging costs, and improves Exchange trade rates.
        </p>
      </section>

      {/* Siltport Exchange */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Coins className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Siltport Exchange
        </h2>

        <div
          className="rounded-xl border p-3.5 space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          {/* Salvage Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold">
                Scrap Salvage{' '}
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  ({state.resources.salvage} held)
                </span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--accent-amber)' }}>
                {rates.salvagePrice} Cr per unit
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={state.resources.salvage < 1}
                onClick={() => onSellResource('salvage', 1)}
                className="min-h-[38px] px-3 rounded-lg border text-xs font-bold disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                Sell 1
              </button>
              <button
                type="button"
                disabled={state.resources.salvage < 1}
                onClick={() => onSellResource('salvage', state.resources.salvage)}
                className="min-h-[38px] px-3 rounded-lg border text-xs font-bold disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent-amber-soft)',
                  borderColor: 'var(--accent-amber)',
                  color: 'var(--accent-amber)',
                }}
              >
                Sell All
              </button>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />

          {/* Aether Shards Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-bold">
                Aether Shards{' '}
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  ({state.resources.aetherShards} held)
                </span>
              </div>
              <div className="text-[11px]" style={{ color: 'var(--accent-cyan)' }}>
                {rates.aetherPrice} Cr per unit
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={state.resources.aetherShards < 1}
                onClick={() => onSellResource('aetherShards', 1)}
                className="min-h-[38px] px-3 rounded-lg border text-xs font-bold disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                Sell 1
              </button>
              <button
                type="button"
                disabled={state.resources.aetherShards < 1}
                onClick={() => onSellResource('aetherShards', state.resources.aetherShards)}
                className="min-h-[38px] px-3 rounded-lg border text-xs font-bold disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent-cyan-soft)',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                }}
              >
                Sell All
              </button>
            </div>
          </div>

          {rates.bonusReasons.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {rates.bonusReasons.map((reason) => (
                <span
                  key={reason}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--accent-success)',
                  }}
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Tip: Reopen The Copper Kettle Cantina or recruit Bramwell to raise Exchange prices.
            </p>
          )}
        </div>
      </section>

      {/* Structures */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Hammer className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Settlement Structures
        </h2>

        <div className="space-y-2.5">
          {UPGRADES_DATA.base.map((bldg) => {
            const lvl = state.base.upgrades[bldg.id] ?? 0;
            const currentDef = bldg.levels.find((l) => l.level === lvl);
            const nextDef = bldg.levels.find((l) => l.level === lvl + 1);
            const nextCosts = nextDef ? getAdjustedUpgradeCosts(state, nextDef.costs) : null;
            const affordable = nextCosts ? canAffordCosts(state, nextCosts) : false;

            return (
              <div
                key={bldg.id}
                className="rounded-xl border p-3.5 space-y-2"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold">{bldg.name}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--accent-amber)' }}>
                      Lv.{lvl} — {currentDef?.title}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border shrink-0"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                  >
                    {lvl}/{bldg.maxLevel}
                  </span>
                </div>

                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {currentDef?.summary}
                </p>

                {nextDef && nextCosts ? (
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onUpgrade(bldg.id)}
                    className="w-full min-h-[44px] rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 disabled:opacity-45"
                    style={{
                      backgroundColor: affordable ? 'var(--accent-amber-soft)' : 'var(--bg-elevated)',
                      borderColor: affordable ? 'var(--accent-amber)' : 'var(--border-subtle)',
                      color: affordable ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}
                  >
                    <span className="truncate">
                      Build Lv.{nextDef.level}: {nextDef.title}
                    </span>
                    <span className="shrink-0 font-mono">{formatCosts(nextCosts)}</span>
                  </button>
                ) : (
                  <div className="text-[11px] font-semibold" style={{ color: 'var(--accent-success)' }}>
                    Fully Developed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Crew & Contacts */}
      <section className="space-y-3">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
          Crew &amp; Contacts ({recruitedNpcs.length + metContacts.length})
        </h2>

        {recruitedNpcs.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold px-1" style={{ color: 'var(--accent-cyan)' }}>
              Recruited Crew &amp; Specialists
            </div>
            {recruitedNpcs.map((npc) => renderNpcCard(npc, true))}
          </div>
        )}

        {metContacts.length > 0 && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-semibold px-1" style={{ color: 'var(--text-muted)' }}>
              Outpost &amp; Frontier Contacts
            </div>
            {metContacts.map((npc) => renderNpcCard(npc, false))}
          </div>
        )}

        {recruitedNpcs.length === 0 && metContacts.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            No contacts logged yet. Speak with Dockmaster Renn or check your shipboard diagnostics.
          </div>
        )}
      </section>
    </div>
  );
}
