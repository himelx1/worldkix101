import type { ResourceId } from './resources.data';

export const enum RoadType {
  None = 0,
  Dirt = 1,
  Gravel = 2,
  Stone = 3,
  Paved = 4,
  Highway = 5,
  Bridge = 6,
  Rail = 7,
}

export interface RoadDef {
  id: RoadType;
  key: string;
  name: string;
  unlockLevel: number;
  requiredTech?: string;
  coinCost: number;
  materialCost: Partial<Record<ResourceId, number>>;
  speedMultiplier: number;
  allowedOnWater: boolean;
  color: string;
  trimColor: string;
  xpYield: number;
}

export const ROADS: Record<RoadType, RoadDef> = {
  [RoadType.None]: {
    id: RoadType.None,
    key: 'none',
    name: 'None',
    unlockLevel: 1,
    coinCost: 0,
    materialCost: {},
    speedMultiplier: 1.0,
    allowedOnWater: false,
    color: '#000000',
    trimColor: '#000000',
    xpYield: 0,
  },
  [RoadType.Dirt]: {
    id: RoadType.Dirt,
    key: 'dirt',
    name: 'Dirt Road',
    unlockLevel: 1,
    coinCost: 4,
    materialCost: {},
    speedMultiplier: 1.0,
    allowedOnWater: false,
    color: '#9c7349',
    trimColor: '#785633',
    xpYield: 2,
  },
  [RoadType.Gravel]: {
    id: RoadType.Gravel,
    key: 'gravel',
    name: 'Gravel Road',
    unlockLevel: 3,
    requiredTech: 'wheel_axle',
    coinCost: 10,
    materialCost: { stone: 1 },
    speedMultiplier: 1.2,
    allowedOnWater: false,
    color: '#8f9396',
    trimColor: '#696e72',
    xpYield: 4,
  },
  [RoadType.Stone]: {
    id: RoadType.Stone,
    key: 'stone',
    name: 'Stone Road',
    unlockLevel: 6,
    requiredTech: 'masonry_1',
    coinCost: 22,
    materialCost: { stone: 2 },
    speedMultiplier: 1.45,
    allowedOnWater: false,
    color: '#a8a29e',
    trimColor: '#57534e',
    xpYield: 6,
  },
  [RoadType.Paved]: {
    id: RoadType.Paved,
    key: 'paved',
    name: 'Paved Road',
    unlockLevel: 14,
    requiredTech: 'paved_highways',
    coinCost: 45,
    materialCost: { cement: 1 },
    speedMultiplier: 1.85,
    allowedOnWater: false,
    color: '#3f3f46',
    trimColor: '#d4d4d8',
    xpYield: 10,
  },
  [RoadType.Highway]: {
    id: RoadType.Highway,
    key: 'highway',
    name: 'Highway',
    unlockLevel: 18,
    requiredTech: 'paved_highways',
    coinCost: 90,
    materialCost: { cement: 2, steel: 1 },
    speedMultiplier: 2.35,
    allowedOnWater: false,
    color: '#27272a',
    trimColor: '#facc15',
    xpYield: 16,
  },
  [RoadType.Bridge]: {
    id: RoadType.Bridge,
    key: 'bridge',
    name: 'Bridge',
    unlockLevel: 4,
    requiredTech: 'arch_engineering',
    coinCost: 35,
    materialCost: { wood: 4, stone: 2 },
    speedMultiplier: 1.35,
    allowedOnWater: true,
    color: '#854d0e',
    trimColor: '#b45309',
    xpYield: 12,
  },
  [RoadType.Rail]: {
    id: RoadType.Rail,
    key: 'rail',
    name: 'Railway Track',
    unlockLevel: 16,
    requiredTech: 'steam_locomotion',
    coinCost: 65,
    materialCost: { steel: 2, wood: 2 },
    speedMultiplier: 2.5,
    allowedOnWater: false,
    color: '#52525b',
    trimColor: '#a16207',
    xpYield: 18,
  },
};

export const BUILDABLE_ROADS: RoadDef[] = [
  ROADS[RoadType.Dirt],
  ROADS[RoadType.Gravel],
  ROADS[RoadType.Stone],
  ROADS[RoadType.Paved],
  ROADS[RoadType.Highway],
  ROADS[RoadType.Bridge],
  ROADS[RoadType.Rail],
];
