import { BaseTab } from './components/BaseTab';
import { BottomNav } from './components/BottomNav';
import { CharacterTab } from './components/CharacterTab';
import { ExploreTab } from './components/ExploreTab';
import { IntroFlow } from './components/IntroFlow';
import { IosInstallBanner } from './components/IosInstallBanner';
import { JournalTab } from './components/JournalTab';
import { ShipTab } from './components/ShipTab';
import { ToastOverlay } from './components/ToastOverlay';
import { TopStatusStrip } from './components/TopStatusStrip';
import { SKILLS_DATA } from './data';
import {
  canAffordCosts,
  getAdjustedSynergyCosts,
  getAvailableStorylets,
} from './engine/storyletEngine';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const {
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
  } = useGameEngine();

  if (!state.character.introCompleted) {
    return (
      <>
        <IntroFlow shipName={state.ship.name} onComplete={handleCompleteIntro} />
        <ToastOverlay toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const availableStoryletsCount = state.activeStorylet
    ? 0
    : getAvailableStorylets(state, state.locationId).length;

  const craftableSynergyCount = SKILLS_DATA.synergies.filter((syn) => {
    if (state.skills.includes(syn.resultSkillId)) return false;
    if ((state.ship.upgrades.workbench ?? 1) < syn.minWorkbenchLevel) return false;
    if (!syn.ingredients.every((ing) => state.skills.includes(ing))) return false;
    return canAffordCosts(state, getAdjustedSynergyCosts(state, syn.costs));
  }).length;

  return (
    <div className="min-h-dvh flex justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
      <div
        className="w-full max-w-md min-h-dvh flex flex-col border-x"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-app)' }}
      >
        <TopStatusStrip state={state} />
        <IosInstallBanner />

        <main className="flex-1 px-3 pt-3 pb-24">
          {activeTab === 'explore' && (
            <ExploreTab
              state={state}
              onStartStorylet={handleStartStorylet}
              onChooseOption={handleChooseOption}
              onCloseStorylet={handleCloseStorylet}
              onTravel={handleTravel}
              onOpenJournal={() => setActiveTab('journal')}
            />
          )}

          {activeTab === 'journal' && <JournalTab state={state} />}

          {activeTab === 'ship' && (
            <ShipTab
              state={state}
              onRepair={handleRepair}
              onRefuel={handleRefuel}
              onUpgrade={(id) => handlePurchaseUpgrade('ship', id)}
              onCraftSynergy={handleCraftSynergy}
            />
          )}

          {activeTab === 'base' && (
            <BaseTab
              state={state}
              onUpgrade={(id) => handlePurchaseUpgrade('base', id)}
              onSellResource={handleSellResource}
            />
          )}

          {activeTab === 'character' && (
            <CharacterTab
              state={state}
              lastSavedAt={lastSavedAt}
              saveSlots={saveSlots}
              onManualSave={handleManualSave}
              onSaveToSlot={handleSaveToSlot}
              onLoadFromSlot={handleLoadFromSlot}
              onDeleteSlot={handleDeleteSlot}
              onUpdateSettings={handleUpdateSettings}
              onExportSave={handleExportSave}
              onImportSave={handleImportSave}
              onResetGame={handleResetGame}
            />
          )}
        </main>

        <ToastOverlay toasts={toasts} onDismiss={dismissToast} />

        <BottomNav
          activeTab={activeTab}
          onSelect={setActiveTab}
          exploreCount={availableStoryletsCount}
          craftableSynergyCount={craftableSynergyCount}
          codexCount={state.unlockedCodex.length}
        />
      </div>
    </div>
  );
}
