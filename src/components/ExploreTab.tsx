import { BookOpen, ChevronRight, Compass, Fuel, Lock, Navigation, RefreshCw } from 'lucide-react';
import { LOCATIONS, LOCATION_MAP, QUESTS } from '../data';
import { evaluateRequirement } from '../engine/requirements';
import {
  canTravelTo,
  getAvailableStorylets,
  getLocationDescription,
} from '../engine/storyletEngine';
import type { GameState, StoryletChoice } from '../types/game';
import { StoryletView } from './StoryletView';

interface ExploreTabProps {
  state: GameState;
  onStartStorylet: (id: string) => void;
  onChooseOption: (choice: StoryletChoice) => void;
  onCloseStorylet: () => void;
  onTravel: (locationId: string) => void;
  onOpenJournal: () => void;
}

export function ExploreTab({
  state,
  onStartStorylet,
  onChooseOption,
  onCloseStorylet,
  onTravel,
  onOpenJournal,
}: ExploreTabProps) {
  if (state.activeStorylet) {
    return (
      <StoryletView
        state={state}
        onChoose={onChooseOption}
        onClose={onCloseStorylet}
      />
    );
  }

  const currentLoc = LOCATION_MAP.get(state.locationId);
  const description = getLocationDescription(state, state.locationId);
  const storylets = getAvailableStorylets(state, state.locationId);

  const activeLeads = QUESTS.map((q) => ({
    quest: q,
    stage: q.stages.find((s) => !evaluateRequirement(state, s.completedWhen)),
  })).filter((x) => Boolean(x.stage));

  const groups: { label: string; category: 'ship' | 'base' | 'frontier' }[] = [
    { label: 'The Cinder Lark', category: 'ship' },
    { label: 'Siltport Outpost', category: 'base' },
    { label: 'Frontier Sectors', category: 'frontier' },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Active Story Objective Strip */}
      {activeLeads.length > 0 && (
        <button
          type="button"
          onClick={onOpenJournal}
          className="w-full text-left rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2 select-none transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
              <BookOpen className="w-3 h-3" />
              Active Lead · {activeLeads[0].quest.title}
            </div>
            <div className="text-xs font-medium truncate">
              {activeLeads[0].stage!.objective}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
        </button>
      )}

      {/* Location Prose */}
      <section
        className="rounded-xl border p-4 space-y-2.5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-bold tracking-tight">
            {currentLoc?.name ?? state.locationId}
          </h1>
          <span
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}
          >
            {currentLoc?.region}
          </span>
        </div>
        <p className="prose-story select-text whitespace-pre-line">{description}</p>
      </section>

      {/* Available Encounters */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Compass className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
            Available Encounters
          </h2>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {storylets.length} active
          </span>
        </div>

        {storylets.length === 0 ? (
          <div
            className="rounded-xl border p-4 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            Nothing else stirs here right now. Travel to another district, check your Ship
            Workbench, or jump out to the Drift.
          </div>
        ) : (
          <div className="space-y-2.5 select-none">
            {storylets.map((sl) => (
              <button
                key={sl.id}
                type="button"
                onClick={() => onStartStorylet(sl.id)}
                className="w-full min-h-[56px] text-left rounded-xl border p-3.5 flex items-center justify-between gap-3 transition-transform active:scale-[0.99]"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor:
                          sl.tag === 'bond'
                            ? 'var(--accent-cyan-soft)'
                            : 'var(--accent-amber-soft)',
                        color:
                          sl.tag === 'bond' ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      }}
                    >
                      {sl.tag}
                    </span>
                    {sl.repeatable && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Repeatable
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold leading-snug">{sl.title}</div>
                  <div className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {sl.subtitle}
                  </div>
                </div>
                <ChevronRight
                  className="w-5 h-5 shrink-0"
                  style={{ color: 'var(--accent-amber)' }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Transit / Travel */}
      <section className="space-y-3 select-none">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Navigation className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
          Transit &amp; Navigation
        </h2>

        {groups.map((group) => {
          const locs = LOCATIONS.filter((l) => l.category === group.category);
          return (
            <div key={group.category} className="space-y-1.5">
              <div
                className="text-[11px] font-semibold px-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.label}
              </div>
              <div className="space-y-1.5">
                {locs.map((loc) => {
                  const isCurrent = loc.id === state.locationId;
                  const status = canTravelTo(state, loc);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      disabled={isCurrent || !status.allowed}
                      onClick={() => onTravel(loc.id)}
                      className="w-full min-h-[48px] text-left rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2 disabled:opacity-65 transition-transform active:scale-[0.99]"
                      style={{
                        backgroundColor: isCurrent ? 'var(--bg-elevated)' : 'var(--bg-card)',
                        borderColor: isCurrent
                          ? 'var(--accent-amber)'
                          : 'var(--border-subtle)',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{loc.name}</div>
                        {!isCurrent && !status.allowed && status.reason && (
                          <div
                            className="text-[11px] flex items-center gap-1 mt-0.5"
                            style={{ color: 'var(--accent-amber)' }}
                          >
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>{status.reason}</span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold">
                        {isCurrent ? (
                          <span style={{ color: 'var(--accent-amber)' }}>Here</span>
                        ) : loc.fuelCost > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border"
                            style={{
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--accent-cyan)',
                            }}
                          >
                            <Fuel className="w-3 h-3" /> {loc.fuelCost}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Dock</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
