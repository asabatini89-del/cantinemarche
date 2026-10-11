#!/usr/bin/env python3
"""Genera le tile della mappa realistica delle Marche, auto-ospitate in public/tiles.

    python scripts/build-tiles.py [--max-zoom 12] [--workers 8] [--only sat|dem]

Fonti (tutte open data, lette via HTTP con richieste a intervalli dai COG su S3):
  - Immagini: Sentinel-2 L2A, composizione a colori naturali (TCI), AWS Open Data
    "sentinel-cogs". Le scene sono fissate in data/sentinel-scenes.json (estate 2024,
    quasi senza nuvole; 2025 per riempire i buchi e i dintorni) così il risultato è
    riproducibile. Crediti: "Contains modified Copernicus Sentinel data 2024-2025".
  - Quota: Terrain Tiles (formato Terrarium), AWS Open Data "elevation-tiles-prod"
    (SRTM, EU-DEM e altre fonti pubbliche; crediti Mapzen e fonti elencate nel README).

Uscita:
  public/tiles/sat/{z}/{x}/{y}.webp  512 px, colori corretti + rilievo ombreggiato + mare
  public/tiles/dem/{z}/{x}/{y}.png   256 px, quota codificata Terrarium per il terreno 3D

Le tile non stanno in git: si rigenerano con questo script (anche in CI, con cache).
"""
import argparse, io, json, math, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

import mercantile
import numpy as np
from PIL import Image
from rio_tiler.io import Reader
from rio_tiler.mosaic import mosaic_reader
from rio_tiler.errors import EmptyMosaicError, TileOutsideBounds
from rio_tiler.models import ImageData
from shapely.geometry import box, shape
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'tiles')
CACHE = os.environ.get('TILES_CACHE', os.path.join(ROOT, '.cache', 'tiles'))
DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

# Area coperta: le Marche con un margine (colline umbre e romagnole, Adriatico).
BBOX = (11.75, 42.35, 14.35, 44.3)
# Ai livelli bassi (fino al 9) un'area più larga: nella vista inclinata l'orizzonte arriva lontano.
WIDE = (11.3, 41.8, 15.0, 44.9)
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')
os.environ.setdefault('GDAL_HTTP_MULTIRANGE', 'YES')
os.environ.setdefault('GDAL_HTTP_MERGE_CONSECUTIVE_RANGES', 'YES')
os.environ.setdefault('VSI_CACHE', 'TRUE')


def region_shape():
    """Contorno delle Marche (+ ~15 km) dai confini ISTAT: oltre lo zoom 10 si generano solo le tile vicine."""
    gj = json.load(open(os.path.join(ROOT, 'public', 'geo', 'marche-province.json')))
    return unary_union([shape(f['geometry']) for f in gj["features"]]).buffer(0.15)


def tiles_for(z, region):
    if z <= 9:
        yield from mercantile.tiles(*WIDE, zooms=z)
        return
    for t in mercantile.tiles(*BBOX, zooms=z):
        b = mercantile.bounds(t)
        if z <= 10 or region.intersects(box(b.west, b.south, b.east, b.north)):
            yield t


# --- Quota (Terrarium) ------------------------------------------------------------
def fetch_dem(z, x, y):
    path = os.path.join(CACHE, 'dem', str(z), str(x), f'{y}.png')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        for attempt in range(4):
            try:
                data = urllib.request.urlopen(DEM_URL.format(z=z, x=x, y=y), timeout=60).read()
                break
            except Exception:
                if attempt == 3: raise
                time.sleep(2 ** attempt)
        with open(path, 'wb') as f: f.write(data)
    return path


def elevation(z, x, y):
    rgb = np.asarray(Image.open(fetch_dem(z, x, y)).convert('RGB')).astype(np.float32)
    return rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768


def elevation_512(z, x, y):
    """Quota a 512 px per la tile z/x/y: le quattro figlie a z+1 (fino al massimo disponibile)."""
    if z + 1 <= 15:
        top = np.hstack([elevation(z + 1, 2 * x, 2 * y), elevation(z + 1, 2 * x + 1, 2 * y)])
        bot = np.hstack([elevation(z + 1, 2 * x, 2 * y + 1), elevation(z + 1, 2 * x + 1, 2 * y + 1)])
        return np.vstack([top, bot])
    return np.kron(elevation(z, x, y), np.ones((2, 2), np.float32))


def hillshade(elev, z, y):
    """Ombreggiatura multidirezionale (stile cartografia svizzera) con esagerazione che cresce allontanandosi."""
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + 0.5) / 2 ** z))))
    cell = 40075016.686 * math.cos(math.radians(lat)) / (2 ** z * 512)
    exag = 1.6 + max(0, 11 - z) * 0.45
    pad = np.pad(elev, 1, mode='edge')
    dzdx = (pad[1:-1, 2:] - pad[1:-1, :-2]) / (2 * cell) * exag
    dzdy = (pad[2:, 1:-1] - pad[:-2, 1:-1]) / (2 * cell) * exag
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(dzdy, -dzdx)
    zen = math.radians(90 - 42)
    out = np.zeros_like(elev)
    for az, w in ((315, 0.45), (270, 0.2), (360, 0.2), (225, 0.15)):
        a = math.radians(360 - az + 90)
        out += w * (math.cos(zen) * np.cos(slope) + math.sin(zen) * np.sin(slope) * np.cos(a - aspect))
    return np.clip(out, 0, 1), slope


# --- Immagini Sentinel-2 ---------------------------------------------------------
SCENES = [s['tci'] for s in json.load(open(os.path.join(ROOT, 'data', 'sentinel-scenes.json')))['scenes']]


# Classificazione della scena (SCL): 3 ombra di nuvola, 8-9 nuvole, 10 cirri, 6 acqua.
CLOUDY = (3, 8, 9, 10)


def read_tile(url, x, y, z, **kw):
    """TCI + SCL della stessa scena: i pixel nuvolosi diventano vuoti e li riempie la scena successiva.
    La quarta banda porta l'acqua riconosciuta dal satellite (più precisa del DEM sulla costa)."""
    with Reader(url) as src:
        tci = src.tile(x, y, z, tilesize=512, resampling_method='bilinear', **kw)
    with Reader(url.replace('/TCI.tif', '/SCL.tif')) as src:
        scl = src.tile(x, y, z, tilesize=512, resampling_method='nearest', **kw).data[0]
    valid = (tci.mask > 0) & ~np.isin(scl, CLOUDY) & (scl > 0)
    # le nuvole lasciano un alone: si allarga un poco la zona scartata
    # (spostamenti senza giro: np.roll riporterebbe il bordo opposto della tile, creando righe vuote)
    bad = ~valid
    for _ in range(2):
        grown = bad.copy()
        grown[1:, :] |= bad[:-1, :]; grown[:-1, :] |= bad[1:, :]
        grown[:, 1:] |= bad[:, :-1]; grown[:, :-1] |= bad[:, 1:]
        bad = grown
    water = np.where(scl == 6, 255, 0).astype(tci.data.dtype)
    data = np.concatenate([tci.data[:3], water[None]], axis=0)
    arr = np.ma.MaskedArray(data, mask=np.broadcast_to(bad, data.shape))
    return ImageData(arr, assets=[url], crs=tci.crs, bounds=tci.bounds)


def satellite_rgb(z, x, y):
    try:
        img, _ = mosaic_reader(SCENES, read_tile, x, y, z, threads=0)
    except (EmptyMosaicError, TileOutsideBounds):
        return None, None, None
    data = img.data[:3].astype(np.float32) / 255.0
    mask = img.mask > 0  # dati validi
    return np.transpose(data, (1, 2, 0)), mask, img.data[3] > 127


def grade(rgb):
    """Correzione colore del TCI: meno foschia, più luce e una saturazione naturale."""
    rgb = np.clip((rgb - 0.035) / 0.78, 0, 1)
    rgb = rgb ** 0.82
    lum = (0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2])[..., None]
    rgb = lum + (rgb - lum) * 1.22
    rgb *= np.array([1.03, 1.0, 0.95], np.float32)  # luce calda di fine giugno
    # curva a S morbida
    return np.clip(rgb + 0.12 * rgb * (1 - rgb) * (rgb - 0.5) * 4, 0, 1)


SEA_SHALLOW = np.array([0.20, 0.42, 0.50], np.float32)
SEA_DEEP = np.array([0.07, 0.20, 0.30], np.float32)
LAND_FALLBACK = np.array([0.55, 0.52, 0.40], np.float32)


def render_sat(t):
    z, x, y = t.z, t.x, t.y
    path = os.path.join(OUT, 'sat', str(z), str(x), f'{y}.webp')
    if os.path.exists(path):
        return 'skip'
    rgb, valid, water = satellite_rgb(z, x, y)
    elev = elevation_512(z, x, y)
    shade, slope = hillshade(elev, z, y)
    if rgb is None:
        rgb = np.broadcast_to(LAND_FALLBACK, elev.shape + (3,)).copy()
        valid = np.zeros(elev.shape, bool)
        water = np.zeros(elev.shape, bool)
    # Mare e laghi: dove il satellite vede acqua; dove non c'è dato, decide il DEM.
    sea = np.where(valid, water, elev <= 0.5)
    rgb = grade(rgb)
    rgb[~valid & ~sea] = LAND_FALLBACK
    # Rilievo: ombre e luci dal DEM, più marcate in montagna, quasi nulle sulle pianure.
    relief = np.clip(0.62 + 0.62 * shade, 0.55, 1.18)[..., None]
    land = rgb * relief
    # Mare: colore della profondità, con un velo della texture reale (onde, foci dei fiumi)
    # che si spegne al largo, dove le scene di giorni diversi lascerebbero giunture.
    depth = np.clip(-elev / 120.0, 0, 1)[..., None]
    sea_col = SEA_SHALLOW * (1 - depth) + SEA_DEEP * depth
    sea_tex = np.where(valid[..., None], rgb, sea_col)
    tex_w = (0.05 + 0.23 * np.clip((elev + 60) / 45, 0, 1))[..., None]
    water = sea_col * (1 - tex_w) + sea_tex * tex_w
    out = np.where(sea[..., None], water, land)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(path, 'WEBP', quality=74, method=5)
    return 'ok'


def render_dem(t):
    z, x, y = t.z, t.x, t.y
    path = os.path.join(OUT, 'dem', str(z), str(x), f'{y}.png')
    if os.path.exists(path):
        return 'skip'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(fetch_dem(z, x, y), 'rb') as src, open(path, 'wb') as dst:
        dst.write(src.read())
    return 'ok'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--min-zoom', type=int, default=6)
    ap.add_argument('--max-zoom', type=int, default=12)
    ap.add_argument('--dem-max-zoom', type=int, default=11)
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--only', choices=['sat', 'dem'])
    a = ap.parse_args()
    region = region_shape()
    jobs = []
    if a.only != 'dem':
        jobs += [(render_sat, t) for z in range(a.min_zoom, a.max_zoom + 1) for t in tiles_for(z, region)]
    if a.only != 'sat':
        jobs += [(render_dem, t) for z in range(a.min_zoom, a.dem_max_zoom + 1) for t in tiles_for(z, region)]
    print(f'{len(jobs)} tile da preparare', flush=True)
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(a.workers) as ex:
        for _ in ex.map(lambda j: j[0](j[1]), jobs):
            done += 1
            if done % 50 == 0 or done == len(jobs):
                print(f'  {done}/{len(jobs)} in {time.time() - t0:.0f}s', flush=True)
    meta = {
        'bounds': WIDE, 'detailBounds': BBOX, 'minzoom': a.min_zoom, 'maxzoom': a.max_zoom, 'demMaxzoom': a.dem_max_zoom,
        'attribution': 'Immagini: Copernicus Sentinel-2 (2024-2025), elaborazione Cantine delle Marche · Rilievo: Terrain Tiles (Mapzen, SRTM, EU-DEM) · Confini: ISTAT CC BY',
    }
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    sys.exit(main())
