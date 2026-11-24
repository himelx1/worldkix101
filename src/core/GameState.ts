import type { ResourceId } from '../data/resources.data';
import type { BuildingCategory, WorkerClass } from '../data/buildings.data';
import type { PolicyId } from '../data/policies.data';
import type { RoadType } from '../data/roads.data';

export const SCHEMA_VERSION = 2;

export type WorldEventId =
  | 'merchant_caravan'
  | 'bountiful_harvest'
  | 'gold_rush'
  | 'scholar_symposium';

export interface ActiveWorldEvent {
  id: WorldEventId;
  title: string;
  description: string;
  ticksRemaining: number;
}

export const enum BiomeId {
  DeepWater = 0,
  River = 1,
  Beach = 2,
  Grassland = 3,
  Fertile = 4,
  Jungle = 5,
  Forest = 6,
  Swamp = 7,
  Desert = 8,
  Mountain = 9,
}

export const enum TileFlag {
  Unlocked = 1 << 0,
  Explored = 1 << 1,
  Irrigated = 1 << 2,
  ReforestZone = 1 << 3,
}

export const enum UtilityFlag {
  None = 0,
  PowerLine = 1 << 0,
  PowerSubstation = 1 << 1,
  WaterPipe = 1 << 2,
  WaterPump = 1 << 3,
}

export const enum ZoneId {
  None = 0,
  Residential = 1,
  Industrial = 2,
  Commercial = 3,
  Agricultural = 4,
  SEZ = 5,
  Government = 6,
}

export type ZoneType =
  | 'none'
  | 'residential'
  | 'industrial'
  | 'commercial'
  | 'agricultural'
  | 'sez'
  | 'government';

export const ZONE_ID_TO_TYPE: Record<number, ZoneType> = {
  [ZoneId.None]: 'none',
  [ZoneId.Residential]: 'residential',
  [ZoneId.Industrial]: 'industrial',
  [ZoneId.Commercial]: 'commercial',
  [ZoneId.Agricultural]: 'agricultural',
  [ZoneId.SEZ]: 'sez',
  [ZoneId.Government]: 'government',
};

export const ZONE_TYPE_TO_ID: Record<ZoneType, ZoneId> = {
  none: ZoneId.None,
  residential: ZoneId.Residential,
  industrial: ZoneId.Industrial,
  commercial: ZoneId.Commercial,
  agricultural: ZoneId.Agricultural,
  sez: ZoneId.SEZ,
  government: ZoneId.Government,
};

export interface ChunkData {
  cx: number;
  cy: number;
  key: string;
  isModified: boolean;
  lastTouchedTick: number;
  biomeId: Uint8Array;
  elevation: Uint8Array;
  moisture: Uint8Array;
  flags: Uint8Array;
  featureType: Uint8Array;
  featureHp: Uint16Array;
  depositType: Uint8Array;
  depositQty: Uint16Array;
  roadType: Uint8Array;
  buildingRef: Int32Array;
  pollution: Uint8Array;
  // Schema v2 per-tile layers (saved across 16x16 chunk boundaries)
  utilityNet: Uint8Array;
  cityRef: Uint16Array;
  zoneType: Uint8Array;
}

export type BuildingStatus =
  | 'constructing'
  | 'active'
  | 'no_workers'
  | 'no_inputs'
  | 'storage_full'
  | 'no_road'
  | 'no_power'
  | 'no_water'
  | 'deposit_depleted'
  | 'disabled';

export interface BuildingInstance {
  id: number;
  defId: string;
  gx: number;
  gy: number;
  rotation?: 0 | 1; // 0 = default WxH, 1 = swapped HxW
  cityId?: number;
  level: number;
  status: BuildingStatus;
  buildProgress: number; // 0..1
  prodProgress: number; // 0..1
  assignedWorkers: number;
  lockedWorkers: number | null; // null = auto
  enabled: boolean;
  connectedRoadCluster: number;
  powerConnected?: boolean;
  waterConnected?: boolean;
  powerNetworkId?: number;
  waterNetworkId?: number;
  powerSatisfaction?: number; // 0..1
  waterSatisfaction?: number; // 0..1
  entranceValid?: boolean;
  congestionFactor?: number; // 0.5..1.0
}

export interface CityRecord {
  id: number;
  name: string;
  color: string;
  createdTick: number;
  taxRate: number;
  unlockedTiles: number;
}

export interface DistrictZoneRecord {
  id: number;
  cityId: number;
  name: string;
  zoneType: ZoneType;
  taxModifier: number;
}

export interface CityEconomySnapshot {
  cityId: number;
  taxIncome: number;
  upkeepExpense: number;
  wageExpense: number;
  net: number;
  buildingCount: number;
}

export interface UtilityNetworkSummary {
  powerConnectedCount: number;
  powerDisconnectedCount: number;
  powerBrownoutCount: number;
  waterConnectedCount: number;
  waterDisconnectedCount: number;
  waterShortageCount: number;
  serviceCoveragePct: number;
}

export type AgeGroup = 'child' | 'underage' | 'adult' | 'elderly';
export type EmploymentStatus = 'employed' | 'unemployed' | 'student' | 'homemaker' | 'retired';

/**
 * Authoritative citizen cohort entry:
 * Every resident belongs to exactly one cityId, one homeBuildingId (or null if homeless),
 * one ageGroup, and one employmentStatus + optional workplaceOrSchoolId.
 */
export interface CitizenCohort {
  id: string;
  cityId: number;
  homeBuildingId: number | null;
  ageGroup: AgeGroup;
  employmentStatus: EmploymentStatus;
  workerClass: WorkerClass;
  workplaceOrSchoolId: number | null;
  count: number;
}

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherType = 'clear' | 'rain' | 'storm' | 'drought' | 'snow';
export type GameSpeed = 0 | 1 | 2 | 3;

export interface AutoTradeRule {
  resourceId: ResourceId;
  mode: 'none' | 'sell_excess' | 'buy_below';
  /** Legacy flat threshold (kept optional for backward compatibility/migration) */
  threshold: number;
  /** Target keep percentage of max storage capacity (0..100). For sell_excess, sells anything above floor(cap * keepPct / 100). */
  keepPct?: number;
}

export interface HappinessDriver {
  id: string;
  label: string;
  delta: number; // positive or negative impact points
  detail: string;
  category: 'food' | 'water' | 'tax' | 'service' | 'housing' | 'environment' | 'policy';
  actionLabel?: string;
  actionSheet?: 'build' | 'economy' | 'population' | 'inventory' | 'land' | 'tech';
  recommendedDefId?: string;
}

export interface HappinessReport {
  score: number;
  base: number;
  drivers: HappinessDriver[];
  recommendations: HappinessDriver[];
}

export interface OfflineSummary {
  elapsedSeconds: number;
  effectiveMinutes: number;
  coinsEarned: number;
  resourcesProduced: number;
  topResourceName?: string;
  topResourceAmount?: number;
}

export interface EconomyLedgerEntry {
  tick: number;
  taxIncome: number;
  tradeIncome: number;
  upkeepExpense: number;
  wageExpense: number;
  net: number;
}

export interface NotificationItem {
  id: number;
  tick: number;
  severity: 'critical' | 'warning' | 'milestone' | 'info';
  title: string;
  message: string;
}

export interface GameSettings {
  cityName: string;
  difficulty: 'standard' | 'relaxed';
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  graphicsMode: 'auto' | 'high' | 'low_power';
  crowdDensity: 'auto' | 'low' | 'medium' | 'high';
  reducedAnimations: boolean;
  mildDisasters: boolean;
  haptics: boolean;
  timeMode: 'normal' | 'always_day' | 'always_night';
  weatherMode: 'random' | 'always_clear';
}

export interface CumulativeStats {
  treesCut: number;
  unlockedTiles: number;
  buildingsBuilt: number;
  roadsBuilt: number;
  maxPopulation: number;
  totalCoinsEarned: number;
  tradesCompleted: number;
  playTimeSeconds: number;
  ruinsExplored: number;
  festivalsHeld: number;
  buildingsMoved: number;
}

export interface PopulationState {
  total: number;
  capacity: number;
  happiness: number;
  classes: Record<WorkerClass, number>;
  employed: number;
  unemployed: number;
  homeless: number;
  ageBreakdown: Record<AgeGroup, number>;
  cohorts: CitizenCohort[];
  growthAccumulator: number;
  needs: {
    food: number; // 0..1
    water: number; // 0..1
    healthcare: number; // 0..1
    education: number; // 0..1
    safety: number; // 0..1
    recreation: number; // 0..1
  };
}

export interface EnvironmentState {
  forestCoveragePct: number;
  avgPollution: number;
  waterQuality: number;
  biodiversity: number;
  sustainability: number;
}

export interface WorldEngineState {
  schemaVersion: number;
  worldSeed: number;
  tick: number;
  speed: GameSpeed;
  coins: number;
  xp: number;
  level: number;
  researchPoints: number;
  activeTechId: string | null;
  activeTechProgress: number;
  unlockedTechIds: string[];
  completedQuestIds: string[];
  trackedQuestId?: string | null;
  unlockedAchievements: string[];
  resources: Record<ResourceId, number>;
  capacities: Record<ResourceId, number>;
  netRatesPerMin: Partial<Record<ResourceId, number>>;
  buildings: BuildingInstance[];
  nextBuildingId: number;
  unlockedBuildingLevels: Record<string, number>;
  cities: CityRecord[];
  activeCityId: number;
  nextCityId: number;
  zones: DistrictZoneRecord[];
  workforcePriorities: Record<BuildingCategory, number>;
  workforceAutoAssign: boolean;
  emergencyWorkTicksRemaining: number;
  taxRate: number; // 0.5, 1.0, 1.5, 2.0
  marketPrices: Record<ResourceId, number>;
  marketPrevPrices?: Partial<Record<ResourceId, number>>;
  autoTradeRules: Partial<Record<ResourceId, AutoTradeRule>>;
  ledger: EconomyLedgerEntry[];
  cityEconomy: Record<number, CityEconomySnapshot>;
  season: SeasonType;
  dayInSeason: number;
  year: number;
  timeOfDayHours: number; // 0..24 (1 in-game hour = 60s at 1x; 24 real min = 24h cycle)
  weather: WeatherType;
  nextWeather: WeatherType;
  weatherTicksRemaining: number;
  activePolicies: PolicyId[];
  festivalTicksRemaining: number;
  festivalCooldownTicks: number;
  activeEvent: ActiveWorldEvent | null;
  population: PopulationState;
  environment: EnvironmentState;
  powerGenerated: number;
  powerDemand: number;
  waterGenerated: number;
  waterDemand: number;
  utilitySummary: UtilityNetworkSummary;
  roadConnectedCount: number;
  stats: CumulativeStats;
  camera: { x: number; y: number; zoom: number };
  settings: GameSettings;
  lastSavedAt?: number;
}

export interface TileInspection {
  gx: number;
  gy: number;
  biomeId: BiomeId;
  biomeName: string;
  elevation: number;
  moisture: number;
  unlocked: boolean;
  canUnlock: boolean;
  unlockCost: number;
  featureType: number;
  featureHp: number;
  featureMaxHp: number;
  depositType: number;
  depositQty: number;
  roadType: RoadType;
  building: BuildingInstance | null;
  pollution: number;
  cityId: number;
  cityName: string;
  zoneType: ZoneType;
  utilityNet: number;
}
