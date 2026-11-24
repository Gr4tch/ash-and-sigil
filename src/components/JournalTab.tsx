import { BookOpen, CheckCircle2, ChevronDown, ChevronRight, Compass, Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { CODEX_ENTRIES, QUESTS } from '../data';
import { evaluateRequirement } from '../engine/requirements';
import type { CodexEntryDef, GameState } from '../types/game';

interface JournalTabProps {
  state: GameState;
}

const CATEGORY_LABELS: { id: 'all' | CodexEntryDef['category']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'factions', label: 'Factions' },
  { id: 'history', label: 'History' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'drift', label: 'The Drift' },
];

export function JournalTab({ state }: JournalTabProps) {
  const [filter, setFilter] = useState<'all' | CodexEntryDef['category']>('all');
  const [expandedCodexId, setExpandedCodexId] = useState<string | null>(
    state.unlockedCodex[0] ?? null
  );

  const filteredCodex = CODEX_ENTRIES.filter(
    (entry) => filter === 'all' || entry.category === filter
  );

  return (
    <div className="space-y-6 pb-6 select-none">
      {/* Main Storylines */}
      <section className="space-y-3">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Compass className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Main Storylines
        </h2>

        {QUESTS.map((quest) => {
          const completedStages = quest.stages.filter((s) =>
            evaluateRequirement(state, s.completedWhen)
          );
          const currentStage = quest.stages.find(
            (s) => !evaluateRequirement(state, s.completedWhen)
          );
          const isComplete = !currentStage;
          const accent =
            quest.track === 'cosmic' ? 'var(--accent-cyan)' : 'var(--accent-amber)';
          const softAccent =
            quest.track === 'cosmic' ? 'var(--accent-cyan-soft)' : 'var(--accent-amber-soft)';

          return (
            <div
              key={quest.id}
              className="rounded-xl border p-4 space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: softAccent, color: accent }}
                  >
                    {quest.track === 'cosmic' ? 'Cosmic Mystery' : 'Frontier Arc'}
                  </span>
                  <h3 className="text-base font-bold mt-1">{quest.title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {quest.subtitle}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold shrink-0" style={{ color: accent }}>
                  {completedStages.length}/{quest.stages.length}
                </span>
              </div>

              {/* Active stage */}
              {currentStage ? (
                <div
                  className="rounded-lg border p-3 space-y-1"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: accent }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
                    Active: {currentStage.title}
                  </div>
                  <p className="text-xs leading-snug">{currentStage.objective}</p>
                  {currentStage.locationHint && (
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Location: {currentStage.locationHint}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-lg border p-3 text-xs font-semibold flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--accent-success-soft)',
                    borderColor: 'var(--accent-success)',
                    color: 'var(--accent-success)',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Storyline Chapter Complete — your choices echo across the Drift.
                </div>
              )}

              {/* Stage checklist */}
              <div className="space-y-1.5 pt-1">
                {quest.stages.map((stage) => {
                  const done = evaluateRequirement(state, stage.completedWhen);
                  const active = !isComplete && currentStage?.id === stage.id;
                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-2 text-xs"
                      style={{
                        color: done
                          ? 'var(--accent-success)'
                          : active
                            ? 'var(--text-primary)'
                            : 'var(--text-muted)',
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className={done ? 'line-through opacity-80' : 'font-medium'}>
                        {stage.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Lore Codex */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            Lore Codex
          </h2>
          <span className="text-[11px] font-mono" style={{ color: 'var(--accent-cyan)' }}>
            {state.unlockedCodex.length} / {CODEX_ENTRIES.length} Discovered
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5 px-1">
          {CATEGORY_LABELS.map((cat) => {
            const active = filter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                className="min-h-[34px] px-3 rounded-full border text-[11px] font-semibold"
                style={{
                  borderColor: active ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  backgroundColor: active ? 'var(--accent-cyan-soft)' : 'var(--bg-card)',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {filteredCodex.map((entry) => {
            const unlocked = state.unlockedCodex.includes(entry.id);
            const expanded = expandedCodexId === entry.id;

            if (!unlocked) {
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border p-3.5 flex items-center justify-between gap-3 opacity-75"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Lock className="w-3.5 h-3.5" /> Undiscovered Record
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Hint: {entry.unlockHint}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedCodexId(expanded ? null : entry.id)}
                  className="w-full text-left p-3.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                      <span className="text-sm font-bold truncate">{entry.title}</span>
                    </div>
                    <p className="text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {entry.summary}
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-cyan)' }} />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  )}
                </button>

                {expanded && (
                  <div
                    className="px-3.5 pb-3.5 pt-2 border-t space-y-2 prose-story select-text"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    {entry.body.map((p, idx) => (
                      <p key={idx} className="text-xs leading-relaxed">
                        {p}
                      </p>
                    ))}
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
