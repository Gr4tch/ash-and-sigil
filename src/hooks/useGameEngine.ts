import { useCallback, useEffect, useState } from 'react';
import { createInitialGameState } from '../engine/initialState';
import { makeToast } from '../engine/effects';
import {
  deleteSlot,
  exportSaveJson,
  getSaveSlots,
  importSaveJson,
  loadFromSlot,
  loadGameState,
  saveGameState,
  saveToSlot,
} from '../engine/storage';
import {
  chooseStoryletOption,
  closeStorylet,
  completeCharacterIntro,
  craftSynergy,
  purchaseUpgrade,
  refuelShip,
  repairShip,
  sellResource,
  startStorylet,
  travelToLocation,
} from '../engine/storyletEngine';
import type {
  GameSettings,
  GameState,
  GameToast,
  SaveSlotMeta,
  StoryletChoice,
} from '../types/game';

export type NavTab = 'explore' | 'journal' | 'ship' | 'base' | 'character';

export function useGameEngine() {
  const [state, setState] = useState<GameState>(() => loadGameState());
  const [toasts, setToasts] = useState<GameToast[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('explore');
  const [saveSlots, setSaveSlots] = useState<(SaveSlotMeta | null)[]>(() => getSaveSlots());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => state.lastSavedAt);

  useEffect(() => {
    const ts = saveGameState(state);
    setLastSavedAt(ts);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    document.documentElement.setAttribute('data-text-size', state.settings.textSize);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        state.settings.theme === 'dark' ? '#110e0c' : '#f6f1e7'
      );
    }
  }, [state.settings.theme, state.settings.textSize]);

  const pushToasts = useCallback((incoming: GameToast[]) => {
    if (incoming.length === 0) return;
    setToasts((prev) => [...prev, ...incoming].slice(-5));
    for (const t of incoming) {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, 4800);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTravel = useCallback(
    (targetLocationId: string) => {
      const res = travelToLocation(state, targetLocationId);
      if (res.error) {
        pushToasts([makeToast('warning', 'Cannot Travel', res.error)]);
        return;
      }
      setState(res.nextState);
      pushToasts(res.toasts);
      setActiveTab('explore');
    },
    [state, pushToasts]
  );

  const handleStartStorylet = useCallback((storyletId: string) => {
    setState((prev) => startStorylet(prev, storyletId));
  }, []);

  const handleChooseOption = useCallback(
    (choice: StoryletChoice) => {
      const res = chooseStoryletOption(state, choice);
      setState(res.nextState);
      pushToasts(res.toasts);
    },
    [state, pushToasts]
  );

  const handleCloseStorylet = useCallback(() => {
    setState((prev) => closeStorylet(prev));
  }, []);

  const handleRepair = useCallback(
    (method: 'salvage' | 'credits') => {
      const res = repairShip(state, method);
      if (res.error) {
        pushToasts([makeToast('warning', 'Repair Blocked', res.error)]);
        return;
      }
      setState(res.nextState);
      pushToasts(res.toasts);
    },
    [state, pushToasts]
  );

  const handleRefuel = useCallback(() => {
    const res = refuelShip(state);
    if (res.error) {
      pushToasts([makeToast('warning', 'Refuel Blocked', res.error)]);
      return;
    }
    setState(res.nextState);
    pushToasts(res.toasts);
  }, [state, pushToasts]);

  const handlePurchaseUpgrade = useCallback(
    (target: 'ship' | 'base', id: string) => {
      const res = purchaseUpgrade(state, target, id);
      if (res.error) {
        pushToasts([makeToast('warning', 'Upgrade Blocked', res.error)]);
        return;
      }
      setState(res.nextState);
      pushToasts(res.toasts);
    },
    [state, pushToasts]
  );

  const handleCraftSynergy = useCallback(
    (synergyId: string) => {
      const res = craftSynergy(state, synergyId);
      if (res.error) {
        pushToasts([makeToast('warning', 'Workbench Blocked', res.error)]);
        return;
      }
      setState(res.nextState);
      pushToasts(res.toasts);
    },
    [state, pushToasts]
  );

  const handleSellResource = useCallback(
    (resource: 'salvage' | 'aetherShards', quantity: number) => {
      const res = sellResource(state, resource, quantity);
      if (res.error) {
        pushToasts([makeToast('warning', 'Exchange Blocked', res.error)]);
        return;
      }
      setState(res.nextState);
      pushToasts(res.toasts);
    },
    [state, pushToasts]
  );

  const handleUpdateSettings = useCallback((partial: Partial<GameSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...partial,
      },
    }));
  }, []);

  const handleExportSave = useCallback(() => {
    return exportSaveJson(state);
  }, [state]);

  const handleImportSave = useCallback(
    (rawText: string): { ok: boolean; error?: string } => {
      const res = importSaveJson(rawText);
      if (res.error || !res.state) {
        return { ok: false, error: res.error };
      }
      setState(res.state);
      pushToasts([makeToast('info', 'Save Imported', 'Restored expedition state.')]);
      setActiveTab('explore');
      return { ok: true };
    },
    [pushToasts]
  );

  const handleCompleteIntro = useCallback(
    (input: { name: string; raceId: string; backgroundId: string }) => {
      const res = completeCharacterIntro(state, input);
      setState(res.nextState);
      pushToasts(res.toasts);
      setActiveTab('explore');
    },
    [state, pushToasts]
  );

  const handleManualSave = useCallback(() => {
    const ts = saveGameState(state);
    setLastSavedAt(ts);
    pushToasts([makeToast('info', 'Progress Saved', 'Expedition state written to local storage.')]);
  }, [state, pushToasts]);

  const handleSaveToSlot = useCallback(
    (slotId: 1 | 2 | 3) => {
      saveToSlot(slotId, state);
      setSaveSlots(getSaveSlots());
      pushToasts([makeToast('info', `Saved to Slot ${slotId}`, `${state.character.name} archived.`)]);
    },
    [state, pushToasts]
  );

  const handleLoadFromSlot = useCallback(
    (slotId: 1 | 2 | 3) => {
      const res = loadFromSlot(slotId);
      if (res.error || !res.state) {
        pushToasts([makeToast('warning', 'Load Failed', res.error ?? 'Could not load slot.')]);
        return;
      }
      setState(res.state);
      setActiveTab('explore');
      pushToasts([makeToast('info', `Loaded Slot ${slotId}`, `Resumed as ${res.state.character.name}.`)]);
    },
    [pushToasts]
  );

  const handleDeleteSlot = useCallback(
    (slotId: 1 | 2 | 3) => {
      deleteSlot(slotId);
      setSaveSlots(getSaveSlots());
      pushToasts([makeToast('info', `Cleared Slot ${slotId}`, 'Manual save slot removed.')]);
    },
    [pushToasts]
  );

  const handleResetGame = useCallback(() => {
    const fresh = createInitialGameState();
    setState((prev) => ({
      ...fresh,
      settings: prev.settings,
    }));
    setActiveTab('explore');
    pushToasts([
      makeToast('info', 'New Expedition', 'Reinitializing cryo-pod aboard The Cinder Lark.'),
    ]);
  }, [pushToasts]);

  return {
    state,
    toasts,
    activeTab,
    setActiveTab,
    lastSavedAt,
    saveSlots,
    dismissToast,
    handleCompleteIntro,
    handleManualSave,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleDeleteSlot,
    handleTravel,
    handleStartStorylet,
    handleChooseOption,
    handleCloseStorylet,
    handleRepair,
    handleRefuel,
    handlePurchaseUpgrade,
    handleCraftSynergy,
    handleSellResource,
    handleUpdateSettings,
    handleExportSave,
    handleImportSave,
    handleResetGame,
  };
}
