// La base comune delle mappe 3D (home e scheda cantina): immagini Sentinel-2 e rilievo
// auto-ospitati in /tiles, generati da scripts/build-tiles.py. Qui niente codice MapLibre:
// il modulo serve anche a decidere, senza scaricare la libreria, se la vista 3D si può usare.
import type * as maplibregl from 'maplibre-gl';

export const TILE_BOUNDS: [number, number, number, number] = [11.3, 41.8, 15, 44.9];
export const ATTRIBUTION = 'Copernicus Sentinel-2 2024-25 · Terrain Tiles (Mapzen, SRTM, EU-DEM) · Confini ISTAT CC BY';
export const PROVINCE_COLOR: Record<string, string> = { PU: '#9bb8e8', AN: '#ffd100', MC: '#f7a35c', FM: '#f6b2a4', AP: '#9ed39f' };
export const CREAM = '251,244,232';
export const ROSSO = '#d42a1a';

export function terraSources(base: string, attribution = true): Record<'sat' | 'dem', maplibregl.SourceSpecification> {
  return {
    sat: {
      type: 'raster', tiles: [`${base}/tiles/sat/{z}/{x}/{y}.webp`], tileSize: 512, minzoom: 6, maxzoom: 12, bounds: TILE_BOUNDS,
      ...(attribution && { attribution: ATTRIBUTION }),
    },
    dem: {
      type: 'raster-dem', tiles: [`${base}/tiles/dem/{z}/{x}/{y}.png`], tileSize: 256, encoding: 'terrarium',
      minzoom: 6, maxzoom: 11, bounds: TILE_BOUNDS,
    },
  };
}

/** Cielo albicocca e foschia calda all'orizzonte, come una cartolina di fine giugno. */
export const SKY: maplibregl.SkySpecification = {
  'sky-color': '#f3c99a', 'horizon-color': '#fccb8f', 'fog-color': '#f1dcc0',
  'sky-horizon-blend': 0.55, 'horizon-fog-blend': 0.45, 'fog-ground-blend': 0.35, 'atmosphere-blend': 0,
};
export const TERRAIN: maplibregl.TerrainSpecification = { source: 'dem', exaggeration: 1.6 };

export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Vista 3D possibile: WebGL c'è e le tile sono state generate (altrimenti resta la mappa illustrata). */
export async function terraAvailable(base: string) {
  return webglOk() && (await fetch(`${base}/tiles/meta.json`).then((r) => r.ok, () => false));
}
