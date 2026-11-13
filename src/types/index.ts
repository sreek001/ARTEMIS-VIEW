// ============================================================================
// ARTEMIS-VIEW / SELENE-NAV — Core Type Definitions
// Lunar South Pole Mission Feasibility & Horizon Navigator
// ============================================================================

/** Selenographic coordinate (latitude, longitude in degrees) */
export interface SelenographicCoord {
  lat: number;   // -90 to +90 (degrees)
  lon: number;   // -180 to +180 (degrees)
}

/** South Polar Stereographic projection coordinate (meters) */
export interface StereographicCoord {
  x: number;  // meters
  y: number;  // meters
}

/** Topocentric angular position of a celestial body */
export interface CelestialPosition {
  az: number;   // Azimuth 0°–360° (0° = North/Prime Meridian, clockwise)
  el: number;   // Elevation in degrees (negative = below horizon)
  angularRadius: number; // apparent angular radius in degrees
}

/** Combined ephemeris output at a single timestamp */
export interface EphemerisResult {
  sun: CelestialPosition;
  earth: CelestialPosition;
  timestamp: Date;
}

/** Pre-computed 360° horizon elevation mask for a site */
export interface HorizonMask {
  /** Elevation angle (degrees) at each integer azimuth 0..359 */
  elevations: number[];
  /** Site identifier */
  siteId: string;
  /** Mast height used in computation (meters) */
  mastHeight: number;
}

/** Curated landing site definition */
export interface LandingSite {
  id: string;
  name: string;
  shortName: string;
  coord: SelenographicCoord;
  elevation: number;      // meters above lunar reference sphere
  slope: number;          // degrees
  category: 'artemis' | 'benchmark';
  description: string;
  /** Pre-baked 360° horizon profile at 0m mast height */
  baseHorizonProfile: number[];
}

/** Solar panel configuration */
export type PanelOrientation = 'vertical' | 'horizontal';

/** Mission configuration parameters */
export interface MissionConfig {
  site: LandingSite;
  startDate: Date;
  durationDays: number;        // 30, 90, 180, 365
  mastHeight: number;          // meters (0–20)
  panelArea: number;           // m² of solar array
  panelEfficiency: number;     // 0–1 (typical ~0.30)
  panelOrientation: PanelOrientation;
  batteryCapacityHours: number; // max survival without sun (hours)
  multipathMargin: number;     // degrees above horizon for DTE (default 1.0°)
  timeStepHours: number;       // simulation resolution (default 2)
}

/** Single time-step evaluation result */
export interface TimeStepResult {
  timestamp: Date;
  sun: CelestialPosition;
  earth: CelestialPosition;
  /** Solar illumination fraction 0..1 (partial disk occlusion) */
  solarFraction: number;
  /** Is DTE comm link available? */
  dteLink: boolean;
  /** Instantaneous solar power in watts */
  solarPowerW: number;
  /** Is in optimal ops window (sun + DTE)? */
  optimalOps: boolean;
  /** Hours of continuous darkness so far at this step */
  continuousDarknessHours: number;
}

/** Full mission evaluation output */
export interface MissionEvaluation {
  config: MissionConfig;
  steps: TimeStepResult[];
  /** Summary statistics */
  summary: MissionSummary;
}

/** Aggregated mission summary statistics */
export interface MissionSummary {
  /** % of time with any sunlight */
  sunlightPercent: number;
  /** % of time with DTE link */
  dteLinkPercent: number;
  /** % of time in optimal ops (both sun and DTE) */
  optimalOpsPercent: number;
  /** Maximum continuous darkness period (hours) */
  maxContinuousDarknessHours: number;
  /** Maximum continuous DTE blackout (hours) */
  maxContinuousDteBlackoutHours: number;
  /** Average solar power (W) when illuminated */
  avgSolarPowerW: number;
  /** Total energy generated over mission (Wh) */
  totalEnergyWh: number;
  /** Hours until next sunset from start */
  hoursToNextSunset: number;
  /** Hours until next Earthset from start */
  hoursToNextEarthset: number;
  /** Go/No-Go feasibility score 0–100 */
  feasibilityScore: number;
  /** Whether max darkness exceeds battery capacity */
  survivalRisk: boolean;
}

/** Comparison between two mission scenarios */
export interface ScenarioComparison {
  scenarioA: MissionEvaluation;
  scenarioB: MissionEvaluation;
  deltas: {
    sunlightPercentDelta: number;
    dteLinkPercentDelta: number;
    maxDarknessDelta: number;
    feasibilityScoreDelta: number;
  };
  recommendation: string;
}

/** Audience mode for UI */
export type AudienceMode = 'planner' | 'explorer';

/** App-wide state */
export interface AppState {
  mode: AudienceMode;
  selectedSiteA: LandingSite;
  selectedSiteB: LandingSite | null;
  missionDate: Date;
  launchDelay: number;         // days offset
  mastHeight: number;          // meters
  panelOrientation: PanelOrientation;
  durationDays: number;
  isPlaying: boolean;
  playbackSpeed: number;       // hours per second
  currentTime: Date;
  compareMode: boolean;
}

/** Constants */
export const LUNAR_CONSTANTS = {
  R_MOON: 1737400,            // meters — lunar reference radius
  SOLAR_CONSTANT: 1361,       // W/m² at 1 AU
  SUN_ANGULAR_RADIUS: 0.266,  // degrees
  EARTH_ANGULAR_RADIUS: 0.95, // degrees
  AXIAL_TILT: 1.54,           // degrees — Moon's axial tilt to ecliptic
  SYNODIC_PERIOD: 29.53,      // days — solar cycle
  SIDEREAL_PERIOD: 27.3,      // days — Earth libration cycle
  LIBRATION_LAT: 6.7,         // degrees — latitude libration amplitude
  LIBRATION_LON: 7.9,         // degrees — longitude libration amplitude
  MULTIPATH_MARGIN: 1.0,      // degrees — DTE multipath clearance
} as const;

/** Theme color palette */
export const THEME = {
  background: '#07080A',
  surface: 'rgba(18, 21, 26, 0.78)',
  surfaceSolid: '#12151A',
  border: 'rgba(212, 218, 226, 0.12)',
  textPrimary: '#ECEFF4',
  textSecondary: '#8A94A6',
  solarGold: '#F59E0B',
  solarGoldGlow: 'rgba(245, 158, 11, 0.35)',
  terraCyan: '#38BDF8',
  terraCyanGlow: 'rgba(56, 189, 248, 0.35)',
  cryoCrimson: '#EF4444',
  cryoCrimsonGlow: 'rgba(239, 68, 68, 0.35)',
  emerald: '#10B981',
  emeraldGlow: 'rgba(16, 185, 129, 0.35)',
} as const;
