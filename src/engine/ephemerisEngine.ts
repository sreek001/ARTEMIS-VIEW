// ============================================================================
// ARTEMIS-VIEW — Ephemeris Engine
// Computes topocentric Sun & Earth positions from any lunar surface point
// ============================================================================
import { EphemerisResult, CelestialPosition, LUNAR_CONSTANTS } from '../types';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const SYNODIC_PERIOD = LUNAR_CONSTANTS.SYNODIC_PERIOD;   // 29.53 days
const SIDEREAL_PERIOD = LUNAR_CONSTANTS.SIDEREAL_PERIOD;  // 27.3 days
const AXIAL_TILT = LUNAR_CONSTANTS.AXIAL_TILT;            // 1.54°
const LIBRATION_LAT_AMP = LUNAR_CONSTANTS.LIBRATION_LAT;  // 6.7°
const LIBRATION_LON_AMP = LUNAR_CONSTANTS.LIBRATION_LON;  // 7.9°

const SUN_ANGULAR_RADIUS = LUNAR_CONSTANTS.SUN_ANGULAR_RADIUS;    // 0.266°
const EARTH_ANGULAR_RADIUS = LUNAR_CONSTANTS.EARTH_ANGULAR_RADIUS; // 0.95°

const J2000 = new Date('2000-01-01T12:00:00Z').getTime();

/** Days elapsed since J2000.0 epoch */
function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000) / 86400000;
}

/** Wrap angle to [-180, 180] degrees */
function wrapTo180(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

/** Wrap angle to [0, 360) degrees */
function wrapTo360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Compute the topocentric azimuth & elevation of a body given its
 * sub-body selenographic point and the observer's selenographic position.
 */
function topocentricPosition(
  subBodyLat: number,
  subBodyLon: number,
  observerLat: number,
  observerLon: number,
  angularRadius: number
): CelestialPosition {
  const subLatRad = subBodyLat * DEG;
  const obsLatRad = observerLat * DEG;
  const hourAngle = wrapTo180(subBodyLon - observerLon) * DEG;

  // Elevation
  const sinEl =
    Math.sin(subLatRad) * Math.sin(obsLatRad) +
    Math.cos(subLatRad) * Math.cos(obsLatRad) * Math.cos(hourAngle);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl))) * RAD;

  // Azimuth (0° = North, clockwise)
  const x = -Math.cos(subLatRad) * Math.sin(hourAngle);
  const y =
    Math.cos(obsLatRad) * Math.sin(subLatRad) -
    Math.sin(obsLatRad) * Math.cos(subLatRad) * Math.cos(hourAngle);
  let az = Math.atan2(x, y) * RAD;
  az = wrapTo360(az);

  return { az, el, angularRadius };
}

/**
 * Compute the sub-solar selenographic latitude and longitude for a given date.
 */
function subSolarPoint(days: number): { lat: number; lon: number } {
  // Sub-solar longitude sweeps 360° over synodic period
  const mod = ((days % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD;
  const fractionalPhase = mod / SYNODIC_PERIOD;
  const lon = wrapTo180((360 * fractionalPhase) % 360);

  // Sub-solar latitude oscillates ±1.54° (axial tilt wrt ecliptic)
  const lat = AXIAL_TILT * Math.sin((2 * Math.PI * days) / 365.25 * 12.3683);

  return { lat, lon };
}

/**
 * Compute the sub-Earth selenographic latitude and longitude (libration).
 */
function subEarthPoint(days: number): { lat: number; lon: number } {
  const lat =
    LIBRATION_LAT_AMP * Math.sin((2 * Math.PI * days) / SIDEREAL_PERIOD + 0.4);
  const lon =
    LIBRATION_LON_AMP * Math.sin((2 * Math.PI * days) / 27.5546 + 1.2);
  return { lat, lon };
}

/**
 * Compute topocentric azimuth & elevation of the Sun and Earth as seen
 * from a point on the Moon's surface at a given UTC timestamp.
 *
 * @param lat  Observer selenographic latitude in degrees (-90 to +90)
 * @param lon  Observer selenographic longitude in degrees (-180 to +180)
 * @param timestamp  UTC Date
 * @returns EphemerisResult with sun and earth CelestialPositions
 */
export function computeEphemeris(
  lat: number,
  lon: number,
  timestamp: Date
): EphemerisResult {
  const days = daysSinceJ2000(timestamp);

  // Sun
  const sunSub = subSolarPoint(days);
  const sun = topocentricPosition(
    sunSub.lat,
    sunSub.lon,
    lat,
    lon,
    SUN_ANGULAR_RADIUS
  );

  // Earth
  const earthSub = subEarthPoint(days);
  const earth = topocentricPosition(
    earthSub.lat,
    earthSub.lon,
    lat,
    lon,
    EARTH_ANGULAR_RADIUS
  );

  return { sun, earth, timestamp };
}
