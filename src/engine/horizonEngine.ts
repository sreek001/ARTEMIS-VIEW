// ============================================================================
// ARTEMIS-VIEW — Horizon Engine
// Horizon masking, mast adjustment, visibility & interpolation
// ============================================================================
import { HorizonMask, LUNAR_CONSTANTS } from '../types';
import { LANDING_SITES } from '../data/landingSites';

/** Degrees of horizon drop per meter of mast height (geometric approximation) */
const MAST_DROP_DEG_PER_M = 0.033;

/**
 * Linear interpolation of horizon elevation at a fractional azimuth.
 * The profile wraps: index 360 → index 0.
 */
export function getHorizonAtAzimuth(mask: HorizonMask, azimuth: number): number {
  // Normalise azimuth to [0, 360)
  let az = azimuth % 360;
  if (az < 0) az += 360;

  const lo = Math.floor(az);
  const hi = (lo + 1) % 360;
  const frac = az - lo;

  return mask.elevations[lo] * (1 - frac) + mask.elevations[hi] * frac;
}

/**
 * Lower all horizon elevations to account for an observer raised on a mast.
 *
 * @param baseProfile  360-element profile at ground level (degrees)
 * @param _siteElevation  site elevation in metres (reserved)
 * @param mastHeight  mast height in metres
 * @returns adjusted 360-element profile
 */
export function adjustHorizonForMast(
  baseProfile: number[],
  _siteElevation: number,
  mastHeight: number
): number[] {
  const drop = mastHeight * MAST_DROP_DEG_PER_M;
  return baseProfile.map((el) => el - drop);
}

/**
 * Build a HorizonMask for a known landing site, optionally adjusted for mast.
 *
 * @param siteId  Landing-site identifier from LANDING_SITES
 * @param mastHeight  Observer mast height in metres (0 = ground level)
 * @returns HorizonMask with 360 elevation values
 * @throws if siteId is not found
 */
export function getHorizonMask(
  siteId: string,
  mastHeight: number
): HorizonMask {
  const site = LANDING_SITES.find((s) => s.id === siteId);
  if (!site) {
    throw new Error(`Landing site "${siteId}" not found`);
  }

  const elevations =
    mastHeight > 0
      ? adjustHorizonForMast(site.baseHorizonProfile, site.elevation, mastHeight)
      : [...site.baseHorizonProfile];

  return { elevations, siteId, mastHeight };
}

/**
 * Interpolate a synthetic horizon profile for an arbitrary coordinate.
 *
 * For latitudes above -70° the polar terrain is irrelevant, so we return a
 * flat 0.1° profile. For polar latitudes we distance-weight the two nearest
 * catalogued sites.
 */
export function interpolateHorizonForCoord(
  lat: number,
  lon: number
): number[] {
  if (lat > -70) {
    return new Array(360).fill(0.1);
  }

  // Find two nearest sites by great-circle proxy (simple Euclidean on lat/lon)
  const scored = LANDING_SITES.filter((s) => s.coord.lat <= -70)
    .map((s) => {
      const dLat = s.coord.lat - lat;
      let dLon = s.coord.lon - lon;
      if (dLon > 180) dLon -= 360;
      if (dLon < -180) dLon += 360;
      const dist = Math.sqrt(dLat * dLat + dLon * dLon);
      return { site: s, dist };
    })
    .sort((a, b) => a.dist - b.dist);

  if (scored.length === 0) {
    return new Array(360).fill(0.1);
  }

  const a = scored[0];
  if (scored.length === 1 || a.dist === 0) {
    return [...a.site.baseHorizonProfile];
  }

  const b = scored[1];
  const totalInv = 1 / a.dist + 1 / b.dist;
  const wA = 1 / a.dist / totalInv;
  const wB = 1 / b.dist / totalInv;

  const profile = new Array(360);
  for (let i = 0; i < 360; i++) {
    profile[i] =
      a.site.baseHorizonProfile[i] * wA + b.site.baseHorizonProfile[i] * wB;
  }
  return profile;
}

/**
 * Determine whether a celestial body is visible above the local horizon,
 * accounting for partial disk occultation.
 *
 * @param bodyEl  Body centre elevation in degrees
 * @param bodyAz  Body azimuth in degrees (0–360)
 * @param bodyAngularRadius  Body apparent angular radius in degrees
 * @param horizon  HorizonMask to check against
 * @returns { visible, fraction } — visible is true if any part is above horizon
 */
export function isBodyVisible(
  bodyEl: number,
  bodyAz: number,
  bodyAngularRadius: number,
  horizon: HorizonMask
): { visible: boolean; fraction: number } {
  const horizonEl = getHorizonAtAzimuth(horizon, bodyAz);
  const delta = bodyEl - horizonEl;

  // fraction of disk above horizon
  const angRad = bodyAngularRadius;
  const raw = (delta + angRad) / (2 * angRad);
  const fraction = Math.max(0, Math.min(1, raw));

  return { visible: fraction > 0, fraction };
}
