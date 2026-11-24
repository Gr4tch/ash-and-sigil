import { Share, X } from 'lucide-react';
import { useState } from 'react';
import { IOS_BANNER_DISMISSED_KEY } from '../engine/storage';

function shouldShowIosBanner(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(IOS_BANNER_DISMISSED_KEY) === '1') return false;
  } catch {
    // ignore
  }
  const ua = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const isStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  return isIos && isSafari && !isStandalone;
}

export function IosInstallBanner() {
  const [visible, setVisible] = useState<boolean>(() => shouldShowIosBanner());

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(IOS_BANNER_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="select-none mx-3 mt-2 rounded-xl border px-3 py-2.5 text-xs flex items-center justify-between gap-2"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--accent-amber)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Share className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-amber)' }} />
        <span className="leading-snug">
          Install <strong>Ash &amp; Sigil</strong> offline: tap <strong>Share</strong> →{' '}
          <strong>Add to Home Screen</strong>.
        </span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss iOS install banner"
        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
