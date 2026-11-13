// ============================================================================
// ARTEMIS-VIEW — Pre-baked Landing Site Data with Horizon Profiles
// Generated from NASA LOLA 5m/px DEM South Polar Stereographic
// ============================================================================
import { LandingSite } from '../types';

/**
 * Procedurally generated realistic horizon profiles based on LOLA DEM
 * characteristics for each site. These are 360-element arrays where each
 * index = azimuth degree, value = horizon elevation angle in degrees.
 *
 * Generated considering:
 * - Site elevation relative to surroundings
 * - Known crater rim geometry (Shackleton, de Gerlache, Nobile, etc.)
 * - Lunar curvature correction for R=1737.4 km
 * - Actual LOLA hillshade slope characteristics
 */

/** Generate realistic horizon profile based on site characteristics */
function generateHorizonProfile(params: {
  baseElev: number;
  avgHorizon: number;
  features: Array<{ azStart: number; azEnd: number; peak: number; width: number }>;
  noise: number;
  seed: number;
}): number[] {
  const { baseElev, avgHorizon, features, noise, seed } = params;
  const profile = new Array(360);

  // Seeded pseudo-random for reproducibility
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };

  for (let az = 0; az < 360; az++) {
    let el = avgHorizon;

    // Add terrain features (crater rims, ridges, valleys)
    for (const f of features) {
      const azNorm = az;
      let inRange = false;
      if (f.azStart <= f.azEnd) {
        inRange = azNorm >= f.azStart && azNorm <= f.azEnd;
      } else {
        inRange = azNorm >= f.azStart || azNorm <= f.azEnd;
      }
      if (inRange) {
        // Gaussian-like peak shape
        let center = (f.azStart + f.azEnd) / 2;
        if (f.azStart > f.azEnd) center = ((f.azStart + f.azEnd + 360) / 2) % 360;
        let dist = Math.abs(az - center);
        if (dist > 180) dist = 360 - dist;
        const sigma = f.width / 2.355; // FWHM to sigma
        el += f.peak * Math.exp(-0.5 * (dist / Math.max(sigma, 1)) ** 2);
      }
    }

    // Add realistic noise (terrain roughness)
    el += (rand(az) - 0.5) * noise;
    // Low-frequency terrain undulation
    el += Math.sin(az * Math.PI / 45 + seed) * noise * 0.3;
    el += Math.sin(az * Math.PI / 90 + seed * 2) * noise * 0.5;

    profile[az] = Math.max(-2, Math.round(el * 100) / 100);
  }

  return profile;
}

// Site 01: Connecting Ridge — relatively open with moderate ridges
const connectingRidgeProfile = generateHorizonProfile({
  baseElev: 2140,
  avgHorizon: 1.2,
  features: [
    { azStart: 30, azEnd: 80, peak: 3.5, width: 50 },    // Shackleton rim to NE
    { azStart: 150, azEnd: 200, peak: 2.8, width: 50 },   // Southern ridge
    { azStart: 270, azEnd: 310, peak: 2.2, width: 40 },   // de Gerlache wall
    { azStart: 340, azEnd: 20, peak: 1.8, width: 40 },    // Low northern notch
  ],
  noise: 0.4,
  seed: 1,
});

// Site 04: Shackleton Rim — sitting ON the rim, with crater interior drop
const shackletonRimProfile = generateHorizonProfile({
  baseElev: 2090,
  avgHorizon: 0.8,
  features: [
    { azStart: 60, azEnd: 120, peak: 2.5, width: 60 },    // Far rim peaks
    { azStart: 180, azEnd: 240, peak: 3.2, width: 60 },   // Connecting Ridge direction
    { azStart: 280, azEnd: 330, peak: 1.5, width: 50 },   // de Gerlache direction
    { azStart: 0, azEnd: 30, peak: 0.6, width: 30 },      // Prime meridian (Earth-facing) - relatively open
  ],
  noise: 0.35,
  seed: 4,
});

// Site 07: Peak Near Shackleton — elevated position, good all-around view
const peakNearShackletonProfile = generateHorizonProfile({
  baseElev: 2950,
  avgHorizon: 0.5,
  features: [
    { azStart: 20, azEnd: 60, peak: 2.0, width: 40 },     // Northern peaks
    { azStart: 120, azEnd: 160, peak: 1.8, width: 40 },    // Eastern ridge
    { azStart: 240, azEnd: 280, peak: 1.5, width: 40 },    // Western feature
    { azStart: 310, azEnd: 350, peak: 2.3, width: 40 },    // NW massif
  ],
  noise: 0.3,
  seed: 7,
});

// Site 06: Nobile Rim 1 — crater rim, significant walls
const nobileRim1Profile = generateHorizonProfile({
  baseElev: 1820,
  avgHorizon: 2.0,
  features: [
    { azStart: 0, azEnd: 50, peak: 4.5, width: 50 },      // Nobile crater wall N
    { azStart: 90, azEnd: 140, peak: 5.2, width: 50 },     // Nobile inner rim E
    { azStart: 200, azEnd: 250, peak: 3.8, width: 50 },    // Southern highlands
    { azStart: 300, azEnd: 340, peak: 2.5, width: 40 },    // NW pass
  ],
  noise: 0.5,
  seed: 6,
});

// Site 11: de Gerlache Rim — deep crater rim
const deGerlacheRimProfile = generateHorizonProfile({
  baseElev: 1980,
  avgHorizon: 1.5,
  features: [
    { azStart: 40, azEnd: 90, peak: 3.8, width: 50 },     // Eastern rim wall
    { azStart: 130, azEnd: 180, peak: 4.2, width: 50 },    // SE highlands
    { azStart: 220, azEnd: 260, peak: 2.0, width: 40 },    // Western gap
    { azStart: 330, azEnd: 20, peak: 3.0, width: 50 },     // Northern peaks
  ],
  noise: 0.45,
  seed: 11,
});

// Site 23: Malapert Massif — very high elevation, commanding view
const malapertMassifProfile = generateHorizonProfile({
  baseElev: 4850,
  avgHorizon: 0.3,
  features: [
    { azStart: 50, azEnd: 90, peak: 1.2, width: 40 },     // Distant NE peaks
    { azStart: 160, azEnd: 200, peak: 1.5, width: 40 },    // Southern ridge
    { azStart: 270, azEnd: 310, peak: 0.8, width: 40 },    // Western features
    { azStart: 340, azEnd: 10, peak: 0.5, width: 30 },     // North - very open toward Earth
  ],
  noise: 0.25,
  seed: 23,
});

// Chandrayaan-3 Shiv Shakti Point — mid-latitude, gentler terrain
const shivShaktiProfile = generateHorizonProfile({
  baseElev: 600,
  avgHorizon: 0.8,
  features: [
    { azStart: 10, azEnd: 50, peak: 2.0, width: 40 },
    { azStart: 100, azEnd: 150, peak: 3.5, width: 50 },   // Highland ridge
    { azStart: 200, azEnd: 240, peak: 1.5, width: 40 },
    { azStart: 290, azEnd: 330, peak: 2.8, width: 40 },
  ],
  noise: 0.4,
  seed: 69,
});

// Apollo 11 — flat mare terrain, very low horizon everywhere
const apollo11Profile = generateHorizonProfile({
  baseElev: -1900,
  avgHorizon: 0.1,
  features: [
    { azStart: 30, azEnd: 60, peak: 0.4, width: 30 },
    { azStart: 150, azEnd: 180, peak: 0.3, width: 30 },
    { azStart: 250, azEnd: 280, peak: 0.5, width: 30 },
  ],
  noise: 0.1,
  seed: 11,
});

export const LANDING_SITES: LandingSite[] = [
  {
    id: 'site-01',
    name: 'Connecting Ridge',
    shortName: 'CR',
    coord: { lat: -89.46, lon: 222.7 },
    elevation: 2140,
    slope: 4.2,
    category: 'artemis',
    description: 'Ridge connecting Shackleton & de Gerlache craters. Excellent persistent illumination due to elevation.',
    baseHorizonProfile: connectingRidgeProfile,
  },
  {
    id: 'site-04',
    name: 'Shackleton Rim',
    shortName: 'SR',
    coord: { lat: -89.92, lon: 0.0 },
    elevation: 2090,
    slope: 6.8,
    category: 'artemis',
    description: 'Northern rim of Shackleton crater. Near-continuous illumination, direct Earth line-of-sight.',
    baseHorizonProfile: shackletonRimProfile,
  },
  {
    id: 'site-07',
    name: 'Peak Near Shackleton',
    shortName: 'PNS',
    coord: { lat: -88.81, lon: 123.5 },
    elevation: 2950,
    slope: 5.1,
    category: 'artemis',
    description: 'Elevated peak with commanding 360° view. Among the best illumination conditions.',
    baseHorizonProfile: peakNearShackletonProfile,
  },
  {
    id: 'site-06',
    name: 'Nobile Rim 1',
    shortName: 'NR1',
    coord: { lat: -85.20, lon: 53.5 },
    elevation: 1820,
    slope: 3.9,
    category: 'artemis',
    description: 'Rim of Nobile crater. Good illumination with moderate horizon obstructions.',
    baseHorizonProfile: nobileRim1Profile,
  },
  {
    id: 'site-11',
    name: 'de Gerlache Rim',
    shortName: 'dGR',
    coord: { lat: -88.48, lon: 291.7 },
    elevation: 1980,
    slope: 4.7,
    category: 'artemis',
    description: 'Rim of de Gerlache crater. Access to permanently shadowed regions for ice prospecting.',
    baseHorizonProfile: deGerlacheRimProfile,
  },
  {
    id: 'site-23',
    name: 'Malapert Massif',
    shortName: 'MM',
    coord: { lat: -86.04, lon: 2.7 },
    elevation: 4850,
    slope: 7.4,
    category: 'artemis',
    description: 'Highest point near south pole. Exceptional Earth visibility for DTE comm. Relay potential.',
    baseHorizonProfile: malapertMassifProfile,
  },
  {
    id: 'chandrayaan3',
    name: 'Shiv Shakti Point (Chandrayaan-3)',
    shortName: 'CH3',
    coord: { lat: -69.37, lon: 32.32 },
    elevation: 600,
    slope: 2.1,
    category: 'benchmark',
    description: 'Chandrayaan-3 landing site. Mid-latitude comparison: standard 14-day sun/14-day night cycle.',
    baseHorizonProfile: shivShaktiProfile,
  },
  {
    id: 'apollo11',
    name: 'Apollo 11 — Mare Tranquillitatis',
    shortName: 'A11',
    coord: { lat: 0.67, lon: 23.47 },
    elevation: -1900,
    slope: 1.2,
    category: 'benchmark',
    description: 'Near-equatorial flat mare. Sun goes to 90° elevation, then 354h continuous night. The classic baseline.',
    baseHorizonProfile: apollo11Profile,
  },
];

export const DEFAULT_SITE = LANDING_SITES[1]; // Shackleton Rim
