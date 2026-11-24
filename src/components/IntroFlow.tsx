import { ArrowRight, Check, Dices, Sparkles, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { BACKGROUNDS, RACES } from '../data';
import type { CoreStatKey } from '../types/game';

interface IntroFlowProps {
  shipName: string;
  onComplete: (input: { name: string; raceId: string; backgroundId: string }) => void;
}

const STAT_LABELS: Record<CoreStatKey, string> = {
  grit: 'Grit',
  guile: 'Guile',
  tech: 'Tech',
  presence: 'Presence',
  lore: 'Lore',
  resonance: 'Resonance',
};

const FRONTIER_NAMES = [
  'Kaelen Voss',
  'Lyra Thorne',
  'Daxen Crow',
  'Sora Valen',
  'Merek Hale',
  'Vesper Sol',
  'Orin Kestrel',
];

export function IntroFlow({ shipName, onComplete }: IntroFlowProps) {
  const [step, setStep] = useState<'wake' | 'name' | 'race' | 'background' | 'summary'>('wake');
  const [name, setName] = useState('');
  const [raceId, setRaceId] = useState(RACES[0]?.id ?? 'human_driftborn');
  const [backgroundId, setBackgroundId] = useState(BACKGROUNDS[0]?.id ?? 'syndicate_defector');

  const selectedRace = RACES.find((r) => r.id === raceId) ?? RACES[0];
  const selectedBg = BACKGROUNDS.find((b) => b.id === backgroundId) ?? BACKGROUNDS[0];

  const handleRandomName = () => {
    const pick = FRONTIER_NAMES[Math.floor(Math.random() * FRONTIER_NAMES.length)];
    setName(pick);
  };

  return (
    <div
      className="min-h-dvh flex justify-center px-3 py-6"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <div className="w-full max-w-md flex flex-col justify-between gap-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-widest">
            <span className="font-bold" style={{ color: 'var(--accent-cyan)' }}>
              SABLE-7 · CRYO-BAY INTAKE
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {step === 'wake' && '1 / 5'}
              {step === 'name' && '2 / 5'}
              {step === 'race' && '3 / 5'}
              {step === 'background' && '4 / 5'}
              {step === 'summary' && '5 / 5'}
            </span>
          </div>

          {step === 'wake' && (
            <div
              className="animate-beat rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-cyan)' }}
            >
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
                The Cinder Lark · Cryo-Pod 01
              </div>
              <div className="space-y-3 prose-story leading-relaxed">
                <p>
                  Frost hisses off the canopy seals as amber emergency lamps flicker to life. Your
                  lungs burn with stale recycled ozone, and a cracked holographic projector blinks
                  above your chest.
                </p>
                <p className="font-semibold" style={{ color: 'var(--accent-amber)' }}>
                  &ldquo;Hey you. You&apos;re finally awake.&rdquo;
                </p>
                <p>
                  A wry, synthesized voice sighs through the cockpit speakers. &ldquo;You were trying
                  to cross the outer Silt-Line, weren&apos;t you? Walked right into that botched
                  ley-jump—same as half the smugglers who fry their coils out here. I&apos;m SABLE-7,
                  by the way. Your ship&apos;s nav-intelligence, assuming you still remember who you
                  are.&rdquo;
                </p>
                <p>
                  &ldquo;We&apos;re limping into Siltport Outpost on fumes. Before Dockmaster Renn
                  asks for your papers, let&apos;s rebuild your intake manifest.&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('name')}
                className="w-full min-h-[50px] rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
              >
                Sit Up &amp; Check Manifest <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'name' && (
            <div
              className="animate-beat rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
                  SABLE-7 · Pilot Identification
                </div>
                <h1 className="text-lg font-bold">Who’s flying {shipName}?</h1>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  &ldquo;The cryo-surge scrambled your transponder tag. What name do the dockhands
                  call you?&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">Pilot Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Kaelen Voss)"
                    maxLength={28}
                    className="flex-1 min-h-[46px] rounded-xl border px-3 text-sm"
                    style={{
                      backgroundColor: 'var(--bg-app)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRandomName}
                    title="Generate Frontier Name"
                    className="min-h-[46px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <Dices className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('wake')}
                  className="min-h-[48px] px-4 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('race')}
                  className="flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
                >
                  Choose Lineage <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'race' && (
            <div className="animate-beat space-y-3">
              <div className="px-1 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
                  SABLE-7 · Biometric Scan
                </div>
                <h1 className="text-lg font-bold">Select Your Race</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Grants <strong style={{ color: 'var(--accent-amber)' }}>+1 Core Stat</strong> and
                  shapes how the Drift—and your hidden instincts—respond to you.
                </p>
              </div>

              <div className="space-y-2.5">
                {RACES.map((r) => {
                  const selected = r.id === raceId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRaceId(r.id)}
                      className="w-full text-left rounded-xl border p-3.5 space-y-1.5 transition-transform active:scale-[0.99]"
                      style={{
                        backgroundColor: selected ? 'var(--accent-amber-soft)' : 'var(--bg-card)',
                        borderColor: selected ? 'var(--accent-amber)' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {selected && <Check className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />}
                          {r.name}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-amber)' }}
                        >
                          +1 {STAT_LABELS[r.statBonus]}
                        </span>
                      </div>
                      <p className="text-xs leading-snug">{r.description}</p>
                      <p className="text-[11px] italic" style={{ color: 'var(--accent-cyan)' }}>
                        {r.hiddenHint}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('name')}
                  className="min-h-[48px] px-4 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('background')}
                  className="flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
                >
                  Choose Background <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'background' && (
            <div className="animate-beat space-y-3">
              <div className="px-1 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-cyan)' }}>
                  SABLE-7 · Past Record
                </div>
                <h1 className="text-lg font-bold">Select Your Background</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Grants <strong style={{ color: 'var(--accent-amber)' }}>+1 Core Stat</strong> and
                  unlocks unique dialogue options across contracts.
                </p>
              </div>

              <div className="space-y-2.5">
                {BACKGROUNDS.map((bg) => {
                  const selected = bg.id === backgroundId;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setBackgroundId(bg.id)}
                      className="w-full text-left rounded-xl border p-3.5 space-y-1.5 transition-transform active:scale-[0.99]"
                      style={{
                        backgroundColor: selected ? 'var(--accent-amber-soft)' : 'var(--bg-card)',
                        borderColor: selected ? 'var(--accent-amber)' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          {selected && <Check className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />}
                          {bg.name}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-amber)' }}
                        >
                          +1 {STAT_LABELS[bg.statBonus]}
                        </span>
                      </div>
                      <p className="text-xs leading-snug">{bg.description}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {bg.flavorHook}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('race')}
                  className="min-h-[48px] px-4 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('summary')}
                  className="flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
                >
                  Review Manifest <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'summary' && (
            <div
              className="animate-beat rounded-2xl border p-5 space-y-4"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-amber)' }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-amber)' }}>
                <UserCheck className="w-4 h-4" /> Intake Manifest Complete
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pilot</span>
                  <span className="font-bold">{name.trim() || 'Drifter'}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Race</span>
                  <span className="font-bold">
                    {selectedRace.name} (+1 {STAT_LABELS[selectedRace.statBonus]})
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Background</span>
                  <span className="font-bold">
                    {selectedBg.name} (+1 {STAT_LABELS[selectedBg.statBonus]})
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                &ldquo;Mag-locks engaged at Siltport Outpost,&rdquo; SABLE-7 announces. &ldquo;Dockmaster
                Renn is already waving at the gantry—and something strange is still humming in our
                nav-core.&rdquo;
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('background')}
                  className="min-h-[48px] px-4 rounded-xl border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onComplete({
                      name: name.trim() || 'Drifter',
                      raceId: selectedRace.id,
                      backgroundId: selectedBg.id,
                    })
                  }
                  className="flex-1 min-h-[50px] rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
                >
                  <Sparkles className="w-4 h-4" /> Dock at Siltport Outpost
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
