import React from 'react';
import {
  Sun,
  Radio,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Zap,
  BatteryCharging,
  Compass,
} from 'lucide-react';
import type { MissionEvaluation, ScenarioComparison } from '../../types';

interface ScenarioCardsProps {
  evaluationA: MissionEvaluation;
  evaluationB?: MissionEvaluation | null;
  comparison?: ScenarioComparison | null;
  compareMode: boolean;
}

export const ScenarioCards: React.FC<ScenarioCardsProps> = ({
  evaluationA,
  evaluationB,
  comparison,
  compareMode,
}) => {
  const sumA = evaluationA.summary;
  const cfgA = evaluationA.config;

  const renderCard = (
    title: string,
    evalData: MissionEvaluation,
    badgeColor: string,
    isSecondary = false
  ) => {
    const sum = evalData.summary;
    const cfg = evalData.config;
    const isRisk = sum.survivalRisk;

    return (
      <div
        className={`flex-1 p-4 rounded-xl border transition-all ${
          isSecondary
            ? 'bg-[var(--surface-solid)]/60 border-[var(--terra-cyan)]/30'
            : 'bg-[var(--surface-solid)]/80 border-[var(--solar-gold)]/40 shadow-lg shadow-[var(--solar-gold)]/5'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-glass)]">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                style={{ backgroundColor: `${badgeColor}25`, color: badgeColor }}
              >
                {title}
              </span>
              <span className="text-xs text-[var(--text-anorthosite)] font-mono">
                {cfg.site.coord.lat}°S, {cfg.site.coord.lon}°E
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-regolith)] mt-0.5">
              {cfg.site.name}
            </h3>
          </div>

          {/* Feasibility Score Badge */}
          <div className="text-right">
            <div className="text-[10px] font-mono text-[var(--text-anorthosite)]">FEASIBILITY SCORE</div>
            <div
              className={`text-2xl font-bold font-mono ${
                sum.feasibilityScore >= 75
                  ? 'text-[var(--bio-emerald)]'
                  : sum.feasibilityScore >= 50
                  ? 'text-[var(--solar-gold)]'
                  : 'text-[var(--cryo-crimson)]'
              }`}
            >
              {sum.feasibilityScore.toFixed(0)}
              <span className="text-xs text-[var(--text-anorthosite)]">/100</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
          {/* Sunlight */}
          <div className="bg-[var(--bg-void)]/60 p-2.5 rounded-lg border border-[var(--border-glass)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-anorthosite)] mb-1">
              <Sun className="w-3.5 h-3.5 text-[var(--solar-gold)]" />
              <span>SUNLIGHT</span>
            </div>
            <div className="text-lg font-bold font-mono text-[var(--solar-gold)]">
              {sum.sunlightPercent.toFixed(1)}%
            </div>
            <div className="w-full bg-white/10 h-1 rounded mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[var(--solar-gold)] rounded"
                style={{ width: `${Math.min(100, sum.sunlightPercent)}%` }}
              />
            </div>
          </div>

          {/* DTE Link */}
          <div className="bg-[var(--bg-void)]/60 p-2.5 rounded-lg border border-[var(--border-glass)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-anorthosite)] mb-1">
              <Radio className="w-3.5 h-3.5 text-[var(--terra-cyan)]" />
              <span>DTE COMM</span>
            </div>
            <div className="text-lg font-bold font-mono text-[var(--terra-cyan)]">
              {sum.dteLinkPercent.toFixed(1)}%
            </div>
            <div className="w-full bg-white/10 h-1 rounded mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[var(--terra-cyan)] rounded"
                style={{ width: `${Math.min(100, sum.dteLinkPercent)}%` }}
              />
            </div>
          </div>

          {/* Max Continuous Darkness */}
          <div className="bg-[var(--bg-void)]/60 p-2.5 rounded-lg border border-[var(--border-glass)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-anorthosite)] mb-1">
              <BatteryCharging className="w-3.5 h-3.5 text-[var(--cryo-crimson)]" />
              <span>MAX NIGHT</span>
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                isRisk ? 'text-[var(--cryo-crimson)]' : 'text-[var(--text-regolith)]'
              }`}
            >
              {sum.maxContinuousDarknessHours.toFixed(0)}h
            </div>
            <div className="text-[10px] font-mono text-[var(--text-anorthosite)] mt-0.5">
              Limit: {cfg.batteryCapacityHours}h {isRisk && '⚠️ FAIL'}
            </div>
          </div>

          {/* Optimal Window */}
          <div className="bg-[var(--bg-void)]/60 p-2.5 rounded-lg border border-[var(--border-glass)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-anorthosite)] mb-1">
              <Zap className="w-3.5 h-3.5 text-[var(--bio-emerald)]" />
              <span>OPTIMAL OPS</span>
            </div>
            <div className="text-lg font-bold font-mono text-[var(--bio-emerald)]">
              {sum.optimalOpsPercent.toFixed(1)}%
            </div>
            <div className="w-full bg-white/10 h-1 rounded mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[var(--bio-emerald)] rounded"
                style={{ width: `${Math.min(100, sum.optimalOpsPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Countdowns & Telemetry footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono border-t border-[var(--border-glass)]/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[var(--text-anorthosite)]">
              <Clock className="w-3.5 h-3.5 text-[var(--solar-gold)]" />
              <span>
                SUNSET IN:{' '}
                <strong className="text-[var(--text-regolith)]">
                  {sum.hoursToNextSunset >= 0 ? `${sum.hoursToNextSunset}h` : 'IN SHADOW'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-anorthosite)]">
              <Clock className="w-3.5 h-3.5 text-[var(--terra-cyan)]" />
              <span>
                EARTHSET IN:{' '}
                <strong className="text-[var(--text-regolith)]">
                  {sum.hoursToNextEarthset >= 0 ? `${sum.hoursToNextEarthset}h` : 'NO LINK'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRisk ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--cryo-crimson)]/20 text-[var(--cryo-crimson)] font-bold text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                BATTERY NO-GO
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bio-emerald)]/20 text-[var(--bio-emerald)] font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                MISSION GO
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-3 p-3">
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* Scenario A Card */}
        {renderCard(
          compareMode ? 'SCENARIO A (BASELINE)' : 'NOMINAL MISSION SCENARIO',
          evaluationA,
          '#F59E0B'
        )}

        {/* Scenario B Card (If in comparison mode) */}
        {compareMode && evaluationB && (
          renderCard('SCENARIO B (COMPARISON / DELAY)', evaluationB, '#38BDF8', true)
        )}
      </div>

      {/* Delta Badges & Recommendation callout */}
      {compareMode && comparison && (
        <div className="bg-[var(--surface-solid)]/70 p-3 rounded-lg border border-[var(--border-glass)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[var(--text-anorthosite)] uppercase font-bold">DELTAS:</span>
            <span>
              Sunlight:{' '}
              <strong
                className={
                  comparison.deltas.sunlightPercentDelta >= 0
                    ? 'text-[var(--bio-emerald)]'
                    : 'text-[var(--cryo-crimson)]'
                }
              >
                {comparison.deltas.sunlightPercentDelta >= 0 ? '+' : ''}
                {comparison.deltas.sunlightPercentDelta.toFixed(1)}%
              </strong>
            </span>
            <span>
              DTE Link:{' '}
              <strong
                className={
                  comparison.deltas.dteLinkPercentDelta >= 0
                    ? 'text-[var(--bio-emerald)]'
                    : 'text-[var(--cryo-crimson)]'
                }
              >
                {comparison.deltas.dteLinkPercentDelta >= 0 ? '+' : ''}
                {comparison.deltas.dteLinkPercentDelta.toFixed(1)}%
              </strong>
            </span>
            <span>
              Max Night:{' '}
              <strong
                className={
                  comparison.deltas.maxDarknessDelta <= 0
                    ? 'text-[var(--bio-emerald)]'
                    : 'text-[var(--cryo-crimson)]'
                }
              >
                {comparison.deltas.maxDarknessDelta >= 0 ? '+' : ''}
                {comparison.deltas.maxDarknessDelta.toFixed(0)}h
              </strong>
            </span>
            <span>
              Score Delta:{' '}
              <strong
                className={
                  comparison.deltas.feasibilityScoreDelta >= 0
                    ? 'text-[var(--bio-emerald)]'
                    : 'text-[var(--cryo-crimson)]'
                }
              >
                {comparison.deltas.feasibilityScoreDelta >= 0 ? '+' : ''}
                {comparison.deltas.feasibilityScoreDelta.toFixed(0)} pts
              </strong>
            </span>
          </div>

          <div className="text-[11px] text-[var(--solar-gold)] font-sans italic">
            {comparison.recommendation}
          </div>
        </div>
      )}
    </div>
  );
};

