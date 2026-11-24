import { BookOpen, Building2, Compass, Rocket, User } from 'lucide-react';
import type { NavTab } from '../hooks/useGameEngine';

interface BottomNavProps {
  activeTab: NavTab;
  onSelect: (tab: NavTab) => void;
  exploreCount: number;
  craftableSynergyCount: number;
  codexCount: number;
}

export function BottomNav({
  activeTab,
  onSelect,
  exploreCount,
  craftableSynergyCount,
  codexCount,
}: BottomNavProps) {
  const items: {
    id: NavTab;
    label: string;
    icon: typeof Compass;
    badge?: number;
  }[] = [
    { id: 'explore', label: 'Explore', icon: Compass, badge: exploreCount },
    { id: 'journal', label: 'Journal', icon: BookOpen, badge: codexCount > 0 ? codexCount : undefined },
    { id: 'ship', label: 'Ship', icon: Rocket, badge: craftableSynergyCount },
    { id: 'base', label: 'Base', icon: Building2 },
    { id: 'character', label: 'Pilot', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t select-none backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 95%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto max-w-md grid grid-cols-5 pb-safe">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="relative min-h-[54px] flex flex-col items-center justify-center gap-0.5 px-1 transition-colors"
              style={{
                color: active ? 'var(--accent-amber)' : 'var(--text-muted)',
              }}
            >
              {active && (
                <span
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--accent-amber)' }}
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{
                      backgroundColor:
                        item.id === 'ship' ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                      color: '#110e0c',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
