import { ArrowRight, CheckCircle2, Dices, Flame, MessageSquare, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { STORYLET_MAP } from '../data';
import { getCheckPreview } from '../engine/checks';
import { evaluateRequirement, getChoiceCues } from '../engine/requirements';
import { interpolateStoryText } from '../engine/storyletEngine';
import type { GameState, SpeakerMeta, StoryletChoice } from '../types/game';

interface StoryletViewProps {
  state: GameState;
  onChoose: (choice: StoryletChoice) => void;
  onClose: () => void;
}

function getSpeakerToneColor(tone?: SpeakerMeta['tone']): string {
  switch (tone) {
    case 'ai':
    case 'anomaly':
      return 'var(--accent-cyan)';
    case 'syndicate':
      return 'var(--accent-danger)';
    default:
      return 'var(--accent-amber)';
  }
}

export function StoryletView({ state, onChoose, onClose }: StoryletViewProps) {
  const active = state.activeStorylet;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [active?.log.length, active?.currentNodeId, active?.finished]);

  if (!active) return null;
  const storylet = STORYLET_MAP.get(active.storyletId);
  if (!storylet) return null;
  const currentNode = storylet.nodes[active.currentNodeId];

  const visibleChoices = currentNode
    ? currentNode.choices.filter((c) => evaluateRequirement(state, c.requirements))
    : [];

  return (
    <div className="space-y-4 pb-6">
      <div
        className="rounded-xl border p-3.5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: 'var(--accent-amber)' }}
        >
          {storylet.tag}
        </div>
        <h2 className="text-lg font-bold mt-0.5 leading-snug">{storylet.title}</h2>
      </div>

      {/* Narrative Log */}
      {active.log.map((entry, idx) => (
        <div
          key={idx}
          className="animate-beat rounded-xl border p-3.5 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {entry.choiceLabel && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                ▸ {entry.choiceLabel}
              </span>
              {entry.rollSummary && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{
                    backgroundColor:
                      entry.outcomeKind === 'fail_forward'
                        ? 'var(--accent-danger-soft)'
                        : 'var(--accent-success-soft)',
                    color:
                      entry.outcomeKind === 'fail_forward'
                        ? 'var(--accent-danger)'
                        : 'var(--accent-success)',
                  }}
                >
                  {entry.outcomeKind === 'fail_forward' ? (
                    <>
                      <Flame className="w-3 h-3" /> Fail-Forward
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Success
                    </>
                  )}
                </span>
              )}
            </div>
          )}
          {entry.rollSummary && (
            <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {entry.rollSummary}
            </div>
          )}
          {entry.speaker && (
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <MessageSquare
                className="w-3 h-3 shrink-0"
                style={{ color: getSpeakerToneColor(entry.speaker.tone) }}
              />
              <span style={{ color: getSpeakerToneColor(entry.speaker.tone) }}>
                {entry.speaker.name}
              </span>
              {entry.speaker.title && (
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
                  · {entry.speaker.title}
                </span>
              )}
            </div>
          )}
          <p className="prose-story select-text whitespace-pre-line">
            {interpolateStoryText(entry.text, state)}
          </p>
        </div>
      ))}

      {/* Current Node or Finish */}
      {!active.finished && currentNode && (
        <div
          className="animate-beat rounded-xl border p-4 space-y-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--accent-amber)',
          }}
        >
          {currentNode.speaker && (
            <div
              className="flex items-center gap-2 pb-2 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <MessageSquare
                className="w-4 h-4 shrink-0"
                style={{ color: getSpeakerToneColor(currentNode.speaker.tone) }}
              />
              <div className="min-w-0">
                <div
                  className="text-xs font-bold leading-tight"
                  style={{ color: getSpeakerToneColor(currentNode.speaker.tone) }}
                >
                  {currentNode.speaker.name}
                </div>
                {currentNode.speaker.title && (
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {currentNode.speaker.title}
                  </div>
                )}
              </div>
            </div>
          )}
          {currentNode.title && (
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--accent-amber)' }}>
              {currentNode.title}
            </h3>
          )}
          <div className="space-y-3 prose-story select-text">
            {currentNode.paragraphs.map((p, i) => (
              <p key={i}>{interpolateStoryText(p, state)}</p>
            ))}
          </div>

          <div className="pt-2 space-y-2.5 select-none">
            {visibleChoices.map((choice) => {
              const cues = getChoiceCues(state, choice);
              const preview = choice.check ? getCheckPreview(state, choice.check) : null;
              const isSynergy = choice.badge === 'Synergy';
              const isBond = choice.badge === 'Bond';
              const isOrigin = choice.badge === 'Origin';

              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onChoose(choice)}
                  className="w-full min-h-[50px] text-left rounded-xl border p-3.5 transition-transform active:scale-[0.99] flex flex-col gap-1.5"
                  style={{
                    backgroundColor:
                      isSynergy || isBond
                        ? 'var(--accent-cyan-soft)'
                        : isOrigin
                          ? 'var(--accent-amber-soft)'
                          : 'var(--bg-elevated)',
                    borderColor:
                      isSynergy || isBond
                        ? 'var(--accent-cyan)'
                        : isOrigin
                          ? 'var(--accent-amber)'
                          : 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug">
                      {interpolateStoryText(choice.label, state)}
                    </span>
                    <ArrowRight
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{
                        color:
                          isSynergy || isBond ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      }}
                    />
                  </div>

                  {(cues.length > 0 || preview || choice.hint) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {cues.map((cue) => (
                        <span
                          key={cue}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              isSynergy || isBond
                                ? 'var(--accent-cyan-soft)'
                                : 'var(--accent-amber-soft)',
                            color:
                              isSynergy || isBond ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {cue}
                        </span>
                      ))}

                      {preview && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color:
                              preview.winChancePercent >= 80
                                ? 'var(--accent-success)'
                                : preview.winChancePercent >= 50
                                  ? 'var(--accent-amber)'
                                  : 'var(--accent-danger)',
                          }}
                        >
                          <Dices className="w-3 h-3" />
                          {preview.statLabel} DC {preview.difficulty} ·{' '}
                          {preview.winChancePercent === 100
                            ? 'GUARANTEED'
                            : `${preview.winChancePercent}%`}
                        </span>
                      )}
                    </div>
                  )}

                  {choice.hint && (
                    <span className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                      {choice.hint}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {active.finished && (
        <button
          type="button"
          onClick={onClose}
          className="select-none w-full min-h-[50px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--accent-amber)',
            color: '#110e0c',
          }}
        >
          Return to Area
        </button>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
