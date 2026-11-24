import { Coins, Fuel, MapPin, Shield, Sparkles, Wrench } from 'lucide-react';
import { LOCATION_MAP } from '../data';
import { getMaxFuel, getMaxHull } from '../engine/storyletEngine';
import type { GameState } from '../types/game';

interface TopStatusStripProps {
  state: GameState;
}

export function TopStatusStrip({ state }: TopStatusStripProps) {
  const loc = LOCATION_MAP.get(state.locationId);
  const maxHull = getMaxHull(state);
  const maxFuel = getMaxFuel(state);
  const hullPct = Math.round((state.ship.hull / maxHull) * 100);

  const hullColor =
    hullPct <= 35
      ? 'var(--accent-danger)'
      : hullPct <= 65
        ? 'var(--accent-amber)'
        : 'var(--accent-success)';

  const categoryColor =
    loc?.category === 'frontier'
      ? 'var(--accent-cyan)'
      : loc?.category === 'ship'
        ? 'var(--accent-amber)'
        : 'var(--text-muted)';

  return (
    <header
      className="sticky top-0 z-30 border-b px-3 pb-2.5 pt-safe select-none backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: categoryColor }} />
          <span className="text-xs font-semibold tracking-wide truncate">
            {loc?.name ?? state.locationId}
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 font-medium"
          style={{
            borderColor: 'var(--border-subtle)',
            color: categoryColor,
            backgroundColor: 'var(--bg-card)',
          }}
        >
          {loc?.region ?? 'Drift'}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 text-[11px] font-medium">
        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-1 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          title="Ship Hull Integrity"
        >
          <Shield className="w-3 h-3 shrink-0" style={{ color: hullColor }} />
          <span style={{ color: hullColor }}>{hullPct}%</span>
        </div>

        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-1 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          title="Aether Fuel Cells"
        >
          <Fuel className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
          <span>
            {state.ship.fuel}/{maxFuel}
          </span>
        </div>

        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-1 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          title="Credits"
        >
          <Coins className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-amber)' }} />
          <span>{state.resources.credits}</span>
        </div>

        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-1 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          title="Salvage"
        >
          <Wrench className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span>{state.resources.salvage}</span>
        </div>

        <div
          className="flex items-center gap-1 rounded-md px-1.5 py-1 border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          title="Aether Shards"
        >
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
          <span>{state.resources.aetherShards}</span>
        </div>
      </div>
    </header>
  );
}
