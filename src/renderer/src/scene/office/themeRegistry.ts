// Theme registry - the scene identity contract.
//
// Planet Express is now the only user-facing theme. The registry stays in place
// because it cleanly separates cast/boss metadata from the generic floor engine.

import type { Texture } from 'pixi.js';
import { PRIMARY_THEME_ID, normalizeThemeId, type LegacyThemeId, type ThemeId } from '@shared/theme';
import { colors } from '@/design/tokens';
import {
  PLANET_EXPRESS_BOSS_CHARACTER,
  PLANET_EXPRESS_CAST_BY_NAME,
  PLANET_EXPRESS_DEFAULT_CHARACTER,
  getCastFrames,
  type CastMember,
  type CharacterName,
  type PlanetExpressCharacterName,
} from './cast';
import {
  resolveThemeCharacter as resolveThemeCharacterForTheme,
  resolveThemeWorkerCharacter as resolveThemeWorkerCharacterForTheme,
  themeWorkerCastMembers as themeWorkerCastMembersForTheme,
} from './themeCharacterResolver';

import planetExpressTilesetUrl from '@/assets/tilesets/planet-express-tileset.png?url';
// .tmj is Tiled JSON; imported as raw text and parsed by the loader.
import planetExpressMapRaw from '@/assets/maps/planet-express.tmj?raw';

export { PRIMARY_THEME_ID, normalizeThemeId, type LegacyThemeId, type ThemeId };

export interface Tile { x: number; y: number; }
export type Facing = 'up' | 'down' | 'left' | 'right';

export type ErrandKind =
  | 'water' | 'window' | 'dispenser' | 'fridge' | 'shelf' | 'bin' | 'smoke';

export interface ErrandSpot {
  kind: ErrandKind;
  stand: Tile;
  facing: Facing;
  fx: Tile;
  duration: number;
  godOnly?: boolean;
}

export interface TilesetEntry {
  url: string;
  embedded?: boolean;
  firstgid?: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
  tilecount?: number;
}

export interface MonitorConfig {
  offTopLeftGid: number;
  onGids: ReadonlyArray<readonly [number, number, number]>;
}

export interface CoffeeConfig {
  trayTile: Tile;
  trayStand: Tile;
  machineStand: Tile;
  sinkTile: Tile;
  sinkStand: Tile;
  maxCups: number;
}

export interface AnchorConfig {
  calendar: Tile;
  boards: Tile;
  clock: Tile;
}

export interface PaletteConfig {
  background: number;
  noteColors: Record<string, number>;
}

export interface ThemeCast {
  byName: Record<string, CastMember<CharacterName>>;
  getFrames: (name: CharacterName) => Promise<Texture[][]>;
  defaultCharacter: CharacterName;
}

export interface ThemeBoss {
  name: string;
  character: CharacterName;
  description: string;
  bootAction: string;
  remoteControlName: string;
}

export interface ThemeConfig {
  id: ThemeId | LegacyThemeId;
  mapRaw: string;
  tilesets: TilesetEntry[];
  primarySeatNames: string[];
  cafeSeatNames: string[];
  cafeStands: ReadonlyArray<readonly [string, 'coffee' | 'vending']>;
  coffee: CoffeeConfig;
  anchors: AnchorConfig;
  errandSpots: ErrandSpot[];
  monitor: MonitorConfig;
  palette: PaletteConfig;
  cast: ThemeCast;
  boss: ThemeBoss;
}

export const PLANET_EXPRESS_THEME: ThemeConfig = {
  id: 'planetexpress',
  mapRaw: planetExpressMapRaw,
  tilesets: [
    { url: planetExpressTilesetUrl, embedded: true },
  ],
  primarySeatNames: [
    'desk-ceo',
    'pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5', 'pc-6', 'pc-7', 'pc-8',
    'desk-dispatch', 'desk-cargo-coordinator', 'desk-route-planner',
    'desk-maintenance', 'desk-lab-tech',
  ],
  cafeSeatNames: [
    'cafe-seat-1', 'cafe-seat-2', 'cafe-seat-3',
    'cafe-seat-4', 'cafe-seat-5', 'cafe-seat-6',
  ],
  cafeStands: [
    ['cafe-stand-coffee', 'coffee'],
    ['cafe-stand-vending', 'vending'],
  ],
  coffee: {
    trayTile: { x: 37, y: 11 },
    trayStand: { x: 37, y: 12 },
    machineStand: { x: 35, y: 22 },
    sinkTile: { x: 40, y: 11 },
    sinkStand: { x: 40, y: 12 },
    maxCups: 4,
  },
  anchors: {
    calendar: { x: 26, y: 2 },
    boards: { x: 21, y: 2 },
    clock: { x: 22, y: 26 },
  },
  errandSpots: [
    { kind: 'water', stand: { x: 3, y: 12 }, facing: 'up', fx: { x: 3, y: 11 }, duration: 4.5 },
    { kind: 'water', stand: { x: 10, y: 4 }, facing: 'up', fx: { x: 10, y: 3 }, duration: 4.5, godOnly: true },
    { kind: 'window', stand: { x: 6, y: 1 }, facing: 'up', fx: { x: 6, y: 0 }, duration: 5 },
    { kind: 'window', stand: { x: 5, y: 24 }, facing: 'left', fx: { x: 3, y: 24 }, duration: 5 },
    { kind: 'dispenser', stand: { x: 34, y: 13 }, facing: 'up', fx: { x: 34, y: 12 }, duration: 3.5 },
    { kind: 'dispenser', stand: { x: 35, y: 22 }, facing: 'up', fx: { x: 35, y: 21 }, duration: 3.5 },
    { kind: 'fridge', stand: { x: 41, y: 13 }, facing: 'up', fx: { x: 41, y: 12 }, duration: 3.2 },
    { kind: 'shelf', stand: { x: 42, y: 15 }, facing: 'left', fx: { x: 41, y: 15 }, duration: 4 },
    { kind: 'bin', stand: { x: 19, y: 25 }, facing: 'left', fx: { x: 18, y: 25 }, duration: 2.6 },
    { kind: 'bin', stand: { x: 39, y: 22 }, facing: 'right', fx: { x: 40, y: 22 }, duration: 2.6 },
    { kind: 'smoke', stand: { x: 2, y: 5 }, facing: 'left', fx: { x: 1, y: 5 }, duration: 18, godOnly: true },
  ],
  monitor: {
    offTopLeftGid: 37,
    onGids: [
      [39, 0, 0], [40, 1, 0],
      [55, 0, 1], [56, 1, 1],
    ],
  },
  palette: {
    background: colors.ink[900],
    noteColors: { todo: 0xf4df73, doing: 0x75d7d0, blocked: 0xec7c68, done: 0x70d18c },
  },
  cast: {
    byName: PLANET_EXPRESS_CAST_BY_NAME as Record<string, CastMember<CharacterName>>,
    getFrames: (name: CharacterName) => getCastFrames(name as PlanetExpressCharacterName),
    defaultCharacter: PLANET_EXPRESS_DEFAULT_CHARACTER,
  },
  boss: {
    name: 'Professor Farnsworth',
    character: PLANET_EXPRESS_BOSS_CHARACTER,
    description: 'orchestrator - runs Planet Express, dispatches the crew, and keeps the hive moving',
    bootAction: 'running Planet Express',
    remoteControlName: 'Professor Farnsworth',
  },
};

export const THEMES: Record<ThemeId, ThemeConfig> = {
  planetexpress: PLANET_EXPRESS_THEME,
};

export function getTheme(id?: string | null): ThemeConfig {
  return THEMES[normalizeThemeId(id)];
}

export function themeCastMembers(id?: string | null): CastMember<CharacterName>[] {
  return Object.values(getTheme(id).cast.byName) as CastMember<CharacterName>[];
}

export function themeWorkerCastMembers(id?: string | null): CastMember<CharacterName>[] {
  return themeWorkerCastMembersForTheme(getTheme(id)) as CastMember<CharacterName>[];
}

export function resolveThemeCharacter(
  id: string | null | undefined,
  subject: { id: string; character?: CharacterName; isGod?: boolean },
): CharacterName {
  return resolveThemeCharacterForTheme(getTheme(id), subject);
}

export function resolveThemeWorkerCharacter(id?: string | null, character?: CharacterName): CharacterName {
  return resolveThemeWorkerCharacterForTheme(getTheme(id), character);
}
