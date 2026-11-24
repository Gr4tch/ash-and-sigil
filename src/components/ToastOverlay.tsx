import { AlertTriangle, Award, BookOpen, Flame, Hammer, Heart, Info, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import type { GameToast, ToastKind } from '../types/game';

interface ToastOverlayProps {
  toasts: GameToast[];
  onDismiss: (id: string) => void;
}

function getToastAccent(kind: ToastKind): string {
  switch (kind) {
    case 'stat':
      return 'var(--accent-success)';
    case 'hidden':
    case 'skill':
    case 'lore':
    case 'bond':
      return 'var(--accent-cyan)';
    case 'scar':
    case 'warning':
      return 'var(--accent-danger)';
    case 'upgrade':
    case 'npc':
      return 'var(--accent-amber)';
    default:
      return 'var(--text-muted)';
  }
}

function ToastIcon({ kind }: { kind: ToastKind }) {
  const color = getToastAccent(kind);
  const cls = 'w-4 h-4 shrink-0 mt-0.5';
  switch (kind) {
    case 'stat':
      return <TrendingUp className={cls} style={{ color }} />;
    case 'hidden':
      return <Award className={cls} style={{ color }} />;
    case 'scar':
      return <Flame className={cls} style={{ color }} />;
    case 'skill':
      return <Sparkles className={cls} style={{ color }} />;
    case 'lore':
      return <BookOpen className={cls} style={{ color }} />;
    case 'upgrade':
      return <Hammer className={cls} style={{ color }} />;
    case 'npc':
      return <Users className={cls} style={{ color }} />;
    case 'bond':
      return <Heart className={cls} style={{ color }} />;
    case 'warning':
      return <AlertTriangle className={cls} style={{ color }} />;
    default:
      return <Info className={cls} style={{ color }} />;
  }
}

export function ToastOverlay({ toasts, onDismiss }: ToastOverlayProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none px-3">
      <div className="mx-auto max-w-md flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-beat rounded-xl border px-3 py-2.5 shadow-lg flex items-start gap-2.5 select-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: getToastAccent(toast.kind),
            }}
          >
            <ToastIcon kind={toast.kind} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight">{toast.title}</div>
              {toast.detail && (
                <div
                  className="text-[11px] leading-snug mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {toast.detail}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-md"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
