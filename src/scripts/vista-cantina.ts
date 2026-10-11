// Vista dal satellite nella scheda della cantina: le sue colline in 3D che girano piano,
// con il segnaposto che pulsa. Si monta solo quando la figura entra nello schermo
// (src/components/VistaCantina.astro) e gira solo finché resta visibile.
// Niente CSS di MapLibre (mappa senza controlli né marcatori DOM): il necessario sta nel componente.
import { Map as MlMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { CREAM, ROSSO, SKY, TERRAIN, terraSources } from './terra';

const ORBIT_DEG_PER_MS = 0.0035; // ~3,5° al secondo: un giro in poco meno di due minuti
const PULSE_MS = 2400;

export function mountVista(fig: HTMLElement, base: string) {
  const stage = fig.querySelector<HTMLElement>('[data-vista-stage]');
  const lng = Number(fig.dataset.lng);
  const lat = Number(fig.dataset.lat);
  if (!stage || !Number.isFinite(lng) || !Number.isFinite(lat)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setWorkerUrl(workerUrl);

  // angolo di partenza diverso per ogni cantina, ma stabile tra una visita e l'altra
  const bearing = ((Math.round(lng * 1e4) + Math.round(lat * 1e4)) % 120) - 60;
  const target = { zoom: 12.7, pitch: 64 };
  const map = new MlMap({
    container: stage,
    style: {
      version: 8,
      sources: {
        ...terraSources(base, false),
        pin: { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} } },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#d9c29a' } },
        { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-fade-duration': 0 } },
        {
          id: 'pulse', type: 'circle', source: 'pin',
          paint: { 'circle-radius': 8, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': `rgb(${CREAM})`, 'circle-stroke-width': 2, 'circle-stroke-opacity': 0 },
        },
        {
          id: 'pin', type: 'circle', source: 'pin',
          paint: { 'circle-radius': 7, 'circle-color': ROSSO, 'circle-stroke-color': `rgb(${CREAM})`, 'circle-stroke-width': 3 },
        },
      ],
      sky: SKY,
      terrain: { ...TERRAIN, exaggeration: 1.3 }, // da vicino basta meno esagerazione
    },
    center: [lng, lat],
    zoom: reduced ? target.zoom : target.zoom - 1.4,
    pitch: reduced ? target.pitch : 35,
    bearing: reduced ? bearing : bearing - 40,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  });

  let visible = true;
  let raf = 0;
  let last = 0;
  const tick = (t: number) => {
    const dt = last ? Math.min(64, t - last) : 16;
    last = t;
    if (!map.isMoving()) map.setBearing(map.getBearing() + dt * ORBIT_DEG_PER_MS);
    const ph = (t % PULSE_MS) / PULSE_MS;
    map.setPaintProperty('pulse', 'circle-radius', 8 + ph * 24);
    map.setPaintProperty('pulse', 'circle-stroke-opacity', 0.9 * (1 - ph) ** 1.5);
    raf = requestAnimationFrame(tick);
  };
  const play = () => {
    cancelAnimationFrame(raf);
    last = 0;
    if (visible && !reduced && fig.dataset.vista === 'ready') raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; play(); }).observe(fig);

  map.once('idle', () => {
    fig.dataset.vista = 'ready';
    if (reduced) return;
    // ingresso: la camera scende inclinandosi sulla cantina, poi comincia il giro
    map.easeTo({ ...target, bearing, duration: 3200, easing: (x) => 1 - Math.pow(1 - x, 3) });
    play();
  });
  map.on('error', () => { /* tile mancanti ai margini: restano quelle a zoom più basso */ });
}
