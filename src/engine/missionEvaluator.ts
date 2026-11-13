// ============================================================================
// ARTEMIS-VIEW — Mission Evaluator
// Time-stepped simulation of illumination, DTE, and power for a mission config
// ============================================================================
import {
  MissionConfig,
  MissionEvaluation,
  MissionSummary,
  TimeStepResult,
  ScenarioComparison,
  LUNAR_CONSTANTS,
} from '../types';
import { computeEphemeris } from './ephemerisEngine';
import { getHorizonMask, isBodyVisible, getHorizonAtAzimuth } from './horizonEngine';

const DEG = Math.PI / 180;

/**
 * Run a full mission evaluation over the configured duration.
 *
 * At each time-step (default 2 h) we:
 * 1. Compute sun/earth ephemeris
 * 2. Apply horizon mask (with mast height)
 * 3. Determine solar illumination fraction (partial disk)
 * 4. Compute instantaneous solar power
 * 5. Check DTE link availability
 * 6. Track darkness & DTE-blackout streaks
 */
export function evaluateMission(config: MissionConfig): MissionEvaluation {
  const {
    site,
    startDate,
    durationDays,
    mastHeight,
    panelArea,
    panelEfficiency,
    panelOrientation,
    batteryCapacityHours,
    multipathMargin,
    timeStepHours,
  } = config;

  const horizon = getHorizonMask(site.id, mastHeight);
  const totalSteps = Math.ceil((durationDays * 24) / timeStepHours);
  const stepMs = timeStepHours * 3600000;

  const steps: TimeStepResult[] = [];

  let continuousDarknessHours = 0;
  let maxContinuousDarknessHours = 0;

  let continuousDteBlackoutHours = 0;
  let maxContinuousDteBlackoutHours = 0;

  let sunlightSteps = 0;
  let dteSteps = 0;
  let optimalSteps = 0;

  let totalPowerW = 0;       // sum of power values (for average when lit)
  let illuminatedSteps = 0;  // steps with solarFraction > 0
  let totalEnergyWh = 0;

  let hoursToNextSunset = -1;   // -1 = not yet found
  let hoursToNextEarthset = -1;
  let prevSunVisible = false;
  let prevDteLink = false;

  for (let i = 0; i < totalSteps; i++) {
    const timestamp = new Date(startDate.getTime() + i * stepMs);
    const eph = computeEphemeris(site.coord.lat, site.coord.lon, timestamp);

    // Solar visibility fraction
    const sunVis = isBodyVisible(
      eph.sun.el,
      eph.sun.az,
      LUNAR_CONSTANTS.SUN_ANGULAR_RADIUS,
      horizon
    );
    const solarFraction = sunVis.fraction;

    // DTE link: Earth elevation must exceed horizon + multipath margin
    const earthHorizonEl = getHorizonAtAzimuth(horizon, eph.earth.az);
    const dteLink = eph.earth.el - earthHorizonEl >= multipathMargin;

    // Instantaneous solar power (watts)
    let solarPowerW = 0;
    if (solarFraction > 0) {
      const elRad = Math.max(0, eph.sun.el * DEG);
      if (panelOrientation === 'vertical') {
        // Panel faces zenith — power ∝ cos(zenith angle) = sin(elevation)
        // At low elevation, vertical panel gets cos(el) from the horizontal
        // Brief says: vertical = S × A × η × f × cos(el_rad)
        solarPowerW =
          LUNAR_CONSTANTS.SOLAR_CONSTANT *
          panelArea *
          panelEfficiency *
          solarFraction *
          Math.cos(elRad);
      } else {
        // Horizontal panel — power ∝ sin(elevation)
        // Brief says: horizontal = S × A × η × f × sin(max(0, el_rad))
        solarPowerW =
          LUNAR_CONSTANTS.SOLAR_CONSTANT *
          panelArea *
          panelEfficiency *
          solarFraction *
          Math.sin(Math.max(0, elRad));
      }
    }

    // Darkness tracking
    if (solarFraction <= 0) {
      continuousDarknessHours += timeStepHours;
    } else {
      continuousDarknessHours = 0;
    }
    maxContinuousDarknessHours = Math.max(
      maxContinuousDarknessHours,
      continuousDarknessHours
    );

    // DTE blackout tracking
    if (!dteLink) {
      continuousDteBlackoutHours += timeStepHours;
    } else {
      continuousDteBlackoutHours = 0;
    }
    maxContinuousDteBlackoutHours = Math.max(
      maxContinuousDteBlackoutHours,
      continuousDteBlackoutHours
    );

    const optimalOps = solarFraction > 0 && dteLink;

    // Counters
    if (solarFraction > 0) sunlightSteps++;
    if (dteLink) dteSteps++;
    if (optimalOps) optimalSteps++;
    if (solarFraction > 0) {
      totalPowerW += solarPowerW;
      illuminatedSteps++;
    }
    totalEnergyWh += solarPowerW * timeStepHours;

    // Sunset / Earthset detection (first transition from visible → not visible)
    if (i > 0) {
      if (hoursToNextSunset < 0 && prevSunVisible && solarFraction <= 0) {
        hoursToNextSunset = i * timeStepHours;
      }
      if (hoursToNextEarthset < 0 && prevDteLink && !dteLink) {
        hoursToNextEarthset = i * timeStepHours;
      }
    }
    prevSunVisible = solarFraction > 0;
    prevDteLink = dteLink;

    steps.push({
      timestamp,
      sun: eph.sun,
      earth: eph.earth,
      solarFraction,
      dteLink,
      solarPowerW,
      optimalOps,
      continuousDarknessHours,
    });
  }

  // If no sunset/earthset detected, report duration
  if (hoursToNextSunset < 0) hoursToNextSunset = durationDays * 24;
  if (hoursToNextEarthset < 0) hoursToNextEarthset = durationDays * 24;

  // Feasibility score (0–100)
  const sunlightPercent = (sunlightSteps / totalSteps) * 100;
  const dteLinkPercent = (dteSteps / totalSteps) * 100;
  const optimalOpsPercent = (optimalSteps / totalSteps) * 100;

  const darknessBatteryRatio =
    batteryCapacityHours > 0
      ? Math.min(1, batteryCapacityHours / Math.max(1, maxContinuousDarknessHours))
      : 0;

  const slopeScore = Math.max(0, 100 - site.slope * 5); // penalise steep slopes

  const feasibilityScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        sunlightPercent * 0.35 +
        dteLinkPercent * 0.20 +
        optimalOpsPercent * 0.15 +
        darknessBatteryRatio * 100 * 0.20 +
        slopeScore * 0.10
      )
    )
  );

  const survivalRisk = maxContinuousDarknessHours > batteryCapacityHours;

  const summary: MissionSummary = {
    sunlightPercent: Math.round(sunlightPercent * 100) / 100,
    dteLinkPercent: Math.round(dteLinkPercent * 100) / 100,
    optimalOpsPercent: Math.round(optimalOpsPercent * 100) / 100,
    maxContinuousDarknessHours,
    maxContinuousDteBlackoutHours,
    avgSolarPowerW:
      illuminatedSteps > 0
        ? Math.round((totalPowerW / illuminatedSteps) * 100) / 100
        : 0,
    totalEnergyWh: Math.round(totalEnergyWh * 100) / 100,
    hoursToNextSunset,
    hoursToNextEarthset,
    feasibilityScore,
    survivalRisk,
  };

  return { config, steps, summary };
}

/**
 * Compare two mission evaluations side-by-side.
 */
export function compareMissions(
  a: MissionEvaluation,
  b: MissionEvaluation
): ScenarioComparison {
  const deltas = {
    sunlightPercentDelta:
      Math.round((a.summary.sunlightPercent - b.summary.sunlightPercent) * 100) / 100,
    dteLinkPercentDelta:
      Math.round((a.summary.dteLinkPercent - b.summary.dteLinkPercent) * 100) / 100,
    maxDarknessDelta:
      Math.round(
        (a.summary.maxContinuousDarknessHours - b.summary.maxContinuousDarknessHours) * 100
      ) / 100,
    feasibilityScoreDelta: a.summary.feasibilityScore - b.summary.feasibilityScore,
  };

  // Generate recommendation
  let recommendation: string;
  const aScore = a.summary.feasibilityScore;
  const bScore = b.summary.feasibilityScore;
  const aName = a.config.site.shortName;
  const bName = b.config.site.shortName;

  if (Math.abs(aScore - bScore) <= 3) {
    recommendation = `Both scenarios (${aName} vs ${bName}) are comparable (score difference ≤3). Consider secondary factors such as slope, proximity to science targets, or DTE margin.`;
  } else if (aScore > bScore) {
    recommendation = `${aName} is favoured over ${bName} with a feasibility score of ${aScore} vs ${bScore}. Key advantage: ${
      deltas.sunlightPercentDelta > 0 ? 'better illumination' : 'lower max darkness'
    }.`;
  } else {
    recommendation = `${bName} is favoured over ${aName} with a feasibility score of ${bScore} vs ${aScore}. Key advantage: ${
      deltas.sunlightPercentDelta < 0 ? 'better illumination' : 'lower max darkness'
    }.`;
  }

  return { scenarioA: a, scenarioB: b, deltas, recommendation };
}
