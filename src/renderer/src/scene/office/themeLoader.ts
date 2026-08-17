// Theme loader - resolves a ThemeConfig into a ready-to-render map.
//
// The async signature leaves room for future bundle validation while normal app
// operation stays single-theme: Planet Express is the primary fallback.

import type { TiledMap } from './TiledMapRenderer';
import {
  getTheme,
  PLANET_EXPRESS_THEME,
  type ThemeConfig,
  type ThemeId,
} from './themeRegistry';

export function resolveThemeMap(theme: ThemeConfig): TiledMap {
  const m = JSON.parse(theme.mapRaw) as TiledMap;
  return {
    ...m,
    tilesets: theme.tilesets.map((t, i) => {
      if (t.embedded) return m.tilesets[i];
      const { url: _url, embedded: _embedded, ...meta } = t;
      return meta as TiledMap['tilesets'][number];
    }),
  };
}

export function themeTilesetUrls(theme: ThemeConfig): string[] {
  return theme.tilesets.map((t) => t.url);
}

function isThemeRenderable(theme: ThemeConfig): boolean {
  try {
    const m = JSON.parse(theme.mapRaw) as TiledMap;
    return (
      typeof m.width === 'number' && m.width > 0 &&
      typeof m.height === 'number' && m.height > 0 &&
      Array.isArray(m.layers) && Array.isArray(m.tilesets)
    );
  } catch {
    return false;
  }
}

export async function loadTheme(id: ThemeId): Promise<ThemeConfig> {
  const theme = getTheme(id);
  if (!isThemeRenderable(theme)) {
    console.warn(`[themeLoader] theme '${id}' is not renderable; falling back to '${PLANET_EXPRESS_THEME.id}'`);
    return PLANET_EXPRESS_THEME;
  }
  return theme;
}
