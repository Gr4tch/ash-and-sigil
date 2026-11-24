import {
  Award,
  Backpack,
  Download,
  Flame,
  FolderOpen,
  Lock,
  Moon,
  RotateCcw,
  Save,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { BACKGROUND_MAP, HIDDEN_STAT_MAP, ITEM_MAP, RACE_MAP, SKILL_MAP } from '../data';
import type { CoreStatKey, GameSettings, GameState, SaveSlotMeta } from '../types/game';

interface CharacterTabProps {
  state: GameState;
  lastSavedAt: string | null;
  saveSlots: (SaveSlotMeta | null)[];
  onManualSave: () => void;
  onSaveToSlot: (slotId: 1 | 2 | 3) => void;
  onLoadFromSlot: (slotId: 1 | 2 | 3) => void;
  onDeleteSlot: (slotId: 1 | 2 | 3) => void;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onExportSave: () => string;
  onImportSave: (rawText: string) => { ok: boolean; error?: string };
  onResetGame: () => void;
}

const STAT_META: { key: CoreStatKey; label: string; blurb: string }[] = [
  { key: 'grit', label: 'Grit', blurb: 'Endurance, plasma recoil, hull-shock survival' },
  { key: 'guile', label: 'Guile', blurb: 'Stealth approaches, bluffs, dead-band slips' },
  { key: 'tech', label: 'Tech', blurb: 'Relays, jury-rigging, salvage extraction' },
  { key: 'presence', label: 'Presence', blurb: 'Command, parley, rallying settlers' },
  { key: 'lore', label: 'Lore', blurb: 'Pre-collapse charts, dead languages, relics' },
  { key: 'resonance', label: 'Resonance', blurb: 'Aether attunement, ley-weaving, anomalies' },
];

export function CharacterTab({
  state,
  lastSavedAt,
  saveSlots,
  onManualSave,
  onSaveToSlot,
  onLoadFromSlot,
  onDeleteSlot,
  onUpdateSettings,
  onExportSave,
  onImportSave,
  onResetGame,
}: CharacterTabProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const raceDef = RACE_MAP.get(state.character.raceId);
  const bgDef = BACKGROUND_MAP.get(state.character.backgroundId);

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Not saved yet';
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const unlockedIdentities = state.unlockedHiddenStats
    .map((id) => HIDDEN_STAT_MAP.get(id))
    .filter((d) => d?.kind === 'identity');

  const unlockedScars = state.unlockedHiddenStats
    .map((id) => HIDDEN_STAT_MAP.get(id))
    .filter((d) => d?.kind === 'scar');

  const handleDownloadExport = () => {
    const json = onExportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ash-and-sigil-save.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const res = onImportSave(text);
      if (!res.ok) {
        setImportMsg(res.error ?? 'Import failed.');
      } else {
        setImportMsg(null);
        setImportOpen(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    const res = onImportSave(importText);
    if (!res.ok) {
      setImportMsg(res.error ?? 'Import failed.');
    } else {
      setImportMsg(null);
      setImportText('');
      setImportOpen(false);
    }
  };

  return (
    <div className="space-y-5 pb-6 select-none">
      {/* Pilot Dossier */}
      <section
        className="rounded-xl border p-4 space-y-2"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <h1 className="text-base font-bold">{state.character.name || 'Drifter'}</h1>
          </div>
          <span
            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-cyan)' }}
          >
            {state.ship.name}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{raceDef?.name ?? 'Unknown Lineage'}</span>
          <span>·</span>
          <span>{bgDef?.name ?? 'Freebooter'}</span>
        </div>
      </section>

      {/* 6 Core Stats */}
      <section
        className="rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Core Attributes</h2>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Hard-won (1–10)
          </span>
        </div>

        <div className="space-y-2.5">
          {STAT_META.map((s) => {
            const val = state.stats[s.key] ?? 1;
            return (
              <div key={s.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">{s.label}</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--accent-amber)' }}>
                    {val} / 10
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 10 }, (_, idx) => {
                    const filled = idx < val;
                    return (
                      <div
                        key={idx}
                        className="h-1.5 rounded-sm"
                        style={{
                          backgroundColor: filled
                            ? 'var(--accent-amber)'
                            : 'var(--border-subtle)',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {s.blurb}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hidden Stats (Only visible once unlocked!) */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Award className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
          Reputation &amp; Scars
        </h2>

        {unlockedIdentities.length === 0 && unlockedScars.length === 0 ? (
          <div
            className="rounded-xl border p-4 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            Unwritten — your choices, creeds, and scars on the rim will surface here once forged.
          </div>
        ) : (
          <div className="space-y-2.5">
            {unlockedIdentities.map((def) => {
              if (!def) return null;
              const oppName = def.oppositeId
                ? HIDDEN_STAT_MAP.get(def.oppositeId)?.name ?? def.oppositeId
                : null;
              return (
                <div
                  key={def.id}
                  className="rounded-xl border p-3.5 space-y-1.5"
                  style={{
                    backgroundColor: 'var(--accent-cyan-soft)',
                    borderColor: 'var(--accent-cyan)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{def.name}</span>
                    {oppName && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border"
                        style={{
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--bg-card)',
                        }}
                      >
                        <Lock className="w-2.5 h-2.5" /> Seals {oppName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-snug">{def.description}</p>
                  <div className="text-[11px]" style={{ color: 'var(--accent-cyan)' }}>
                    {def.effectSummary}
                  </div>
                </div>
              );
            })}

            {unlockedScars.map((def) => {
              if (!def) return null;
              const stacks = state.hiddenCounters[def.id] ?? 1;
              return (
                <div
                  key={def.id}
                  className="rounded-xl border p-3.5 space-y-1.5"
                  style={{
                    backgroundColor: 'var(--accent-danger-soft)',
                    borderColor: 'var(--accent-danger)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />
                      {def.name}
                    </span>
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--bg-card)', color: 'var(--accent-danger)' }}
                    >
                      Rank {stacks}
                    </span>
                  </div>
                  <p className="text-xs leading-snug">{def.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Learned Skills & Synergies */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Learned Techniques ({state.skills.length})
        </h2>

        {state.skills.length === 0 ? (
          <div
            className="rounded-xl border p-3.5 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            No techniques learned yet. Speak with Siltport&apos;s dockmaster or cantina brokers.
          </div>
        ) : (
          <div className="space-y-2">
            {state.skills.map((skillId) => {
              const sk = SKILL_MAP.get(skillId);
              if (!sk) return null;
              return (
                <div
                  key={sk.id}
                  className="rounded-xl border p-3 space-y-1"
                  style={{
                    backgroundColor: sk.synergyResult
                      ? 'var(--accent-cyan-soft)'
                      : 'var(--bg-card)',
                    borderColor: sk.synergyResult
                      ? 'var(--accent-cyan)'
                      : 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{sk.name}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: sk.synergyResult ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      }}
                    >
                      {sk.synergyResult ? 'Synergy' : sk.category}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {sk.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Inventory */}
      <section className="space-y-2.5">
        <h2
          className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-1"
          style={{ color: 'var(--text-muted)' }}
        >
          <Backpack className="w-3.5 h-3.5" style={{ color: 'var(--accent-amber)' }} />
          Gear &amp; Relics ({state.items.length})
        </h2>

        {state.items.length === 0 ? (
          <div
            className="rounded-xl border p-3.5 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            Cargo locker is empty.
          </div>
        ) : (
          <div className="space-y-2">
            {state.items.map((itemId) => {
              const item = ITEM_MAP.get(itemId);
              if (!item) return null;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-3 space-y-1"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{item.name}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Settings & Save Data */}
      <section
        className="rounded-xl border p-4 space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <h2 className="text-sm font-bold">Reading &amp; Save Data</h2>

        {/* Theme toggle */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Theme</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className="min-h-[40px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
              style={{
                borderColor:
                  state.settings.theme === 'dark'
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                backgroundColor:
                  state.settings.theme === 'dark'
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
              }}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className="min-h-[40px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5"
              style={{
                borderColor:
                  state.settings.theme === 'light'
                    ? 'var(--accent-amber)'
                    : 'var(--border-subtle)',
                backgroundColor:
                  state.settings.theme === 'light'
                    ? 'var(--accent-amber-soft)'
                    : 'var(--bg-elevated)',
              }}
            >
              <Sun className="w-3.5 h-3.5" /> High-Contrast
            </button>
          </div>
        </div>

        {/* Text size */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Prose Size</span>
          <div className="flex gap-1.5">
            {(['sm', 'md', 'lg'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdateSettings({ textSize: sz })}
                className="min-h-[40px] min-w-[48px] px-2.5 rounded-lg border text-xs font-semibold uppercase"
                style={{
                  borderColor:
                    state.settings.textSize === sz
                      ? 'var(--accent-amber)'
                      : 'var(--border-subtle)',
                  backgroundColor:
                    state.settings.textSize === sz
                      ? 'var(--accent-amber-soft)'
                      : 'var(--bg-elevated)',
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Save & Auto-save status */}
        <div
          className="rounded-xl border p-3 space-y-2.5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold">Manual &amp; Auto-Save</div>
              <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                Last saved: {formatTimestamp(lastSavedAt)}
              </div>
            </div>
            <button
              type="button"
              onClick={onManualSave}
              className="min-h-[40px] px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
              style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
            >
              <Save className="w-3.5 h-3.5" /> Save Progress
            </button>
          </div>

          {/* 3 Save Slots */}
          <div className="space-y-1.5 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
              Manual Save Slots
            </div>
            {([1, 2, 3] as const).map((slotId, idx) => {
              const meta = saveSlots[idx];
              return (
                <div
                  key={slotId}
                  className="rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      Slot {slotId}: {meta ? meta.characterName : 'Empty'}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {meta
                        ? `${meta.locationName} · ${formatTimestamp(meta.savedAt)}`
                        : 'No expedition archived'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSaveToSlot(slotId)}
                      className="min-h-[32px] px-2.5 rounded-md border text-[11px] font-semibold"
                      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                    >
                      Save
                    </button>
                    {meta && (
                      <>
                        <button
                          type="button"
                          onClick={() => onLoadFromSlot(slotId)}
                          className="min-h-[32px] px-2 rounded-md border text-[11px] font-semibold flex items-center gap-1"
                          style={{
                            backgroundColor: 'var(--accent-cyan-soft)',
                            borderColor: 'var(--accent-cyan)',
                            color: 'var(--accent-cyan)',
                          }}
                        >
                          <FolderOpen className="w-3 h-3" /> Load
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSlot(slotId)}
                          aria-label={`Delete Slot ${slotId}`}
                          className="min-h-[32px] px-2 rounded-md border text-[11px]"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--accent-danger)',
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export / Import */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadExport}
            className="min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setImportOpen((v) => !v);
              setImportMsg(null);
            }}
            className="min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <Upload className="w-3.5 h-3.5" /> Import JSON
          </button>
        </div>

        {importOpen && (
          <div
            className="rounded-xl border p-3 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <label className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Upload a `.json` save file or paste save JSON below:
            </label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="block w-full text-xs"
            />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={4}
              placeholder='{"version":1,"locationId":...}'
              className="w-full rounded-lg border p-2 text-xs font-mono"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {importMsg && (
              <div className="text-xs" style={{ color: 'var(--accent-danger)' }}>
                {importMsg}
              </div>
            )}
            <button
              type="button"
              onClick={handlePasteImport}
              className="w-full min-h-[42px] rounded-lg text-xs font-bold"
              style={{ backgroundColor: 'var(--accent-amber)', color: '#110e0c' }}
            >
              Restore Pasted Save
            </button>
          </div>
        )}

        {/* Reset */}
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-danger)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Expedition
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onResetGame();
                setConfirmReset(false);
              }}
              className="min-h-[44px] rounded-xl text-xs font-bold"
              style={{ backgroundColor: 'var(--accent-danger)', color: '#110e0c' }}
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-[44px] rounded-xl border text-xs font-semibold"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
