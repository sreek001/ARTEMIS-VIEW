import { useMemo } from 'react';
import Header from './components/layout/Header';
import GlassPanel from './components/layout/GlassPanel';
import { PolarMap } from './components/map/PolarMap';
import { HorizonPanorama } from './components/horizon/HorizonPanorama';
import { GanttTimeline } from './components/timeline/GanttTimeline';
import { ScenarioCards } from './components/comparison/ScenarioCards';
import SiteSelector from './components/controls/SiteSelector';
import DatePicker from './components/controls/DatePicker';
import MastSlider from './components/controls/MastSlider';

import { useMissionState } from './hooks/useMissionState';
import { evaluateMission, compareMissions } from './engine';
import {
  Compass,
  Mountain,
  Calendar,
  Sparkles,
  Sliders,
} from 'lucide-react';

export default function App() {
  const {
    state,
    setSite,
    setSiteB,
    setDate,
    setMastHeight,
    setLaunchDelay,
    setPanelOrientation,
    toggleCompare,
    setMode,
    setPlaybackSpeed,
    setPlaying,
    setCurrentTime,
    jumpToStart,
    missionConfigA,
    missionConfigB,
  } = useMissionState();

  // Evaluate Primary Mission Scenario A
  const evalA = useMemo(() => {
    return evaluateMission(missionConfigA);
  }, [missionConfigA]);

  // Evaluate Secondary Mission Scenario B (if compare mode enabled)
  const evalB = useMemo(() => {
    if (!state.compareMode || !missionConfigB) return null;
    return evaluateMission(missionConfigB);
  }, [state.compareMode, missionConfigB]);

  // Compute Delta comparison
  const comparison = useMemo(() => {
    if (!evalA || !evalB) return null;
    return compareMissions(evalA, evalB);
  }, [evalA, evalB]);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-regolith)] flex flex-col font-sans selection:bg-[var(--solar-gold)]/30">
      {/* 1. TOP HEADER CONSOLE */}
      <Header
        mode={state.mode}
        mastHeight={state.mastHeight}
        compareMode={state.compareMode}
        onModeChange={setMode}
        onMastChange={setMastHeight}
        onToggleCompare={toggleCompare}
      />

      {/* 2. MISSION CONTROL BAR: SITES & PARAMETERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-3 mb-2">
        {/* Site Selector A */}
        <div className="md:col-span-2">
          <SiteSelector
            selectedSite={state.selectedSiteA}
            onSelect={setSite}
            label={state.compareMode ? 'SCENARIO A SITE (BASELINE)' : 'PRIMARY CANDIDATE SITE'}
          />
        </div>

        {/* Date and Launch Delay Shock-Test Picker */}
        <div>
          <DatePicker
            missionDate={state.missionDate}
            launchDelay={state.launchDelay}
            onDateChange={setDate}
            onDelayChange={setLaunchDelay}
          />
        </div>

        {/* Mast Height & Panel Config */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border-glass)] text-xs font-mono">
            <span className="text-[var(--text-anorthosite)]">MAST HEIGHT:</span>
            <span className="text-[var(--solar-gold)] font-bold">{state.mastHeight}m</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border-glass)] text-xs font-mono">
            <span className="text-[var(--text-anorthosite)]">SOLAR ARRAY:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPanelOrientation('vertical')}
                className={`px-2 py-0.5 rounded ${
                  state.panelOrientation === 'vertical'
                    ? 'bg-[var(--solar-gold)] text-[var(--bg-void)] font-bold'
                    : 'text-[var(--text-anorthosite)] hover:text-white'
                }`}
                title="Vertical Tracking Mast (Optimized for Grazing Lunar Polar Sunlight)"
              >
                VERT
              </button>
              <button
                onClick={() => setPanelOrientation('horizontal')}
                className={`px-2 py-0.5 rounded ${
                  state.panelOrientation === 'horizontal'
                    ? 'bg-[var(--solar-gold)] text-[var(--bg-void)] font-bold'
                    : 'text-[var(--text-anorthosite)] hover:text-white'
                }`}
                title="Horizontal Deck Panel (Apollo / Vikram Style)"
              >
                HORIZ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Site B Selector (if compareMode active) */}
      {state.compareMode && (
        <div className="px-3 mb-2">
          <SiteSelector
            selectedSite={state.selectedSiteB ?? state.selectedSiteA}
            onSelect={(s) => setSiteB(s)}
            label="SCENARIO B SITE (COMPARISON CANDIDATE)"
          />
        </div>
      )}

      {/* Explorer Mode Educational Callout Banner */}
      {state.mode === 'explorer' && (
        <div className="mx-3 mb-2 p-3 rounded-lg bg-[var(--surface-solid)] border border-[var(--terra-cyan)]/30 flex items-start gap-3 text-xs leading-relaxed">
          <Sparkles className="w-4 h-4 text-[var(--terra-cyan)] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[var(--terra-cyan)] font-display uppercase tracking-wider">
              Lunar South Pole First-Principles:
            </strong>{' '}
            Because the Moon's axial tilt is only <strong>1.54°</strong>, the Sun never rises high—it skims
            horizontally like a lighthouse beam along the 360° horizon. A 4 km mountain ridge 20 km away
            will cast multi-day shadows! Compare Shackleton Rim with <strong>Apollo 11</strong> to see how
            polar illumination contrasts with the equator's 14-day boiling day / 14-day freezing night.
          </div>
        </div>
      )}

      {/* 3. CORE 4-PANEL WORKSPACE */}
      <div className="flex-1 px-3 grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
        {/* PANEL 1: SOUTH POLE POLAR MAP (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <GlassPanel
            title="1. SOUTH POLE TOPOGRAPHIC RADAR // 80°S-90°S"
            icon={<Compass className="w-4 h-4 text-[var(--solar-gold)]" />}
            className="flex-1 flex flex-col min-h-[360px]"
          >
            <PolarMap
              selectedSite={state.selectedSiteA}
              currentTime={state.currentTime}
              onSelectSite={setSite}
            />
          </GlassPanel>
        </div>

        {/* PANEL 2: 360° HORIZON PANORAMA & SKY-DOME (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <GlassPanel
            title={`2. 360° HORIZON OCCLUSION RADAR // ${state.selectedSiteA.name.toUpperCase()}`}
            icon={<Mountain className="w-4 h-4 text-[var(--terra-cyan)]" />}
            className="flex-1 flex flex-col min-h-[360px]"
          >
            <HorizonPanorama
              site={state.selectedSiteA}
              mastHeight={state.mastHeight}
              currentTime={state.currentTime}
            />
          </GlassPanel>
        </div>

        {/* PANEL 3: SCENARIO COMPARISON MATRIX (12 Cols) */}
        <div className="lg:col-span-12">
          <GlassPanel
            title="3. SCENARIO FEASIBILITY MATRIX & MISSION READINESS"
            icon={<Sliders className="w-4 h-4 text-[var(--bio-emerald)]" />}
          >
            <ScenarioCards
              evaluationA={evalA}
              evaluationB={evalB}
              comparison={comparison}
              compareMode={state.compareMode}
            />
          </GlassPanel>
        </div>

        {/* PANEL 4: TEMPORAL MISSION GANTT TIMELINE (12 Cols) */}
        <div className="lg:col-span-12">
          <GlassPanel
            title="4. TEMPORAL MISSION WINDOW GANTT TIMELINE (30-DAY OPERATIONAL PROFILE)"
            icon={<Calendar className="w-4 h-4 text-[var(--solar-gold)]" />}
          >
            <GanttTimeline
              steps={evalA.steps}
              currentTime={state.currentTime}
              isPlaying={state.isPlaying}
              playbackSpeed={state.playbackSpeed}
              onScrub={setCurrentTime}
              onTogglePlay={() => setPlaying(!state.isPlaying)}
              onSetSpeed={setPlaybackSpeed}
              onReset={jumpToStart}
            />
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
