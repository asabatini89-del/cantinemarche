// La mappa viva della home: le Marche vere (Sentinel-2 + rilievo) in 3D, con una regia.
//
// - Ingresso: il contorno della regione si disegna, il resto d'Italia si vela, la camera
//   scende inclinandosi sulle colline; le cantine spuntano a cascata.
// - A riposo la regione ruota piano su se stessa (si ferma appena la tocchi).
// - Provincia: la camera ci vola sopra, le altre si spengono.
// - Cantina: il segnaposto pulsa, la camera fa un volo radente fino al punto e si apre il
//   pannello con vini ed esperienze; "vicina successiva" porta di cantina in cantina.
// Senza WebGL resta la mappa SVG; con prefers-reduced-motion niente voli né rotazione.
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import Supercluster from 'supercluster';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { CREAM, PROVINCE_COLOR, SKY, TERRAIN, terraAvailable, terraSources } from './terra';

type Card = {
  slug: string; num: number; name: string; municipality: string | null; province_code: string | null;
  territory: string | null; lat: number; lng: number; wines: number; top_wines: string[]; exps: number;
  exp: { t: string; k: string; p: number | null; d: number | null } | null; cover: string | null;
};

const PROVINCE_NAME: Record<string, string> = { PU: 'Pesaro e Urbino', AN: 'Ancona', MC: 'Macerata', FM: 'Fermo', AP: 'Ascoli Piceno' };
const KIND_LABEL: Record<string, string> = { tasting: 'Degustazione', tour: 'Visita', meal: 'A tavola', event: 'Evento', stay: 'Ospitalità' };
const MARCHE: [[number, number], [number, number]] = [[12.18, 42.68], [13.92, 43.97]];

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
const fmtPrice = (c: number) => `${(c / 100).toLocaleString('it-IT', { maximumFractionDigits: 2 })} €`;
const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}′` : ''}` : `${m}′`);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const catalogNo = (n: number) => `N° ${String(n).padStart(3, '0')}`;
const distKm = (a: Card, b: Card) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.hypot(x, y) * 6371;
};

function outlineGradient(p: number): maplibregl.ExpressionSpecification {
  const on = `rgba(${CREAM},1)`;
  const off = `rgba(${CREAM},0)`;
  if (p <= 0) return ['interpolate', ['linear'], ['line-progress'], 0, off, 1, off];
  if (p >= 0.995) return ['interpolate', ['linear'], ['line-progress'], 0, on, 1, on];
  return ['interpolate', ['linear'], ['line-progress'], 0, on, p, on, p + 0.002, off, 1, off];
}

function bboxOf(geom: Polygon | MultiPolygon): [[number, number], [number, number]] {
  let w = 180, s = 90, e = -180, n = -90;
  const rings = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const poly of rings) for (const ring of poly) for (const [x, y] of ring) {
    w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
  }
  return [[w, s], [e, n]];
}

export async function initMappaViva(root: HTMLElement) {
  const canvasHost = root.querySelector<HTMLElement>('[data-mv-canvas]')!;
  const fallback = root.querySelector<HTMLElement>('[data-mv-fallback]');
  const base = document.documentElement.dataset.base ?? '';
  // Senza WebGL, o senza tile (si generano con scripts/build-tiles.py), resta la mappa illustrata.
  if (!(await terraAvailable(base))) {
    root.dataset.mvState = 'fallback';
    fallback?.removeAttribute('hidden');
    return;
  }
  // l'URL del worker arriva già completo dal build (l'anteprima statica lo riscrive con la sua base)
  maplibregl.setWorkerUrl(workerUrl);

  const cards: Card[] = JSON.parse(root.querySelector('[data-mv-cards]')!.textContent!).map((c: Card & { top_wines: string; exp: string | null }) => ({
    ...c,
    top_wines: JSON.parse(c.top_wines || '[]'),
    exp: c.exp ? JSON.parse(c.exp) : null,
  }));
  const bySlug = new Map(cards.map((c) => [c.slug, c]));
  const panel = root.querySelector<HTMLElement>('[data-mv-panel]')!;
  const countEl = root.querySelector<HTMLElement>('[data-mv-count]');
  const listLink = root.querySelector<HTMLAnchorElement>('[data-mv-list]');
  const hint = root.querySelector<HTMLElement>('[data-mv-hint]');

  // --- Mappa ------------------------------------------------------------------------
  const homePitch = isMobile() ? 42 : 52;
  const homeBearing = -16;
  const map = new maplibregl.Map({
    container: canvasHost,
    style: {
      version: 8,
      sources: {
        ...terraSources(base),
        province: { type: 'geojson', data: `${base}/geo/marche-province.json`, promoteId: 'sigla' },
        mask: { type: 'geojson', data: `${base}/geo/marche-mask.json` },
        outline: { type: 'geojson', data: `${base}/geo/marche-outline.json`, lineMetrics: true },
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#d9c29a' } },
        { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-fade-duration': 250 } },
        { id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': '#1d1712', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 1400 } } },
        {
          id: 'prov-tint', type: 'fill', source: 'province',
          paint: {
            'fill-color': ['match', ['get', 'sigla'], ...Object.entries(PROVINCE_COLOR).flat(), '#ffffff'] as unknown as maplibregl.ExpressionSpecification,
            'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.2, 0],
          },
        },
        { id: 'prov-dim', type: 'fill', source: 'province', filter: ['==', ['get', 'sigla'], ''], paint: { 'fill-color': '#1d1712', 'fill-opacity': 0, 'fill-opacity-transition': { duration: 900 } } },
        {
          id: 'prov-line', type: 'line', source: 'province', layout: { 'line-join': 'round' },
          paint: { 'line-color': `rgb(${CREAM})`, 'line-width': 1.1, 'line-opacity': 0, 'line-opacity-transition': { duration: 1200 }, 'line-dasharray': [2, 2] },
        },
        { id: 'outline-glow', type: 'line', source: 'outline', paint: { 'line-color': `rgb(${CREAM})`, 'line-width': 9, 'line-blur': 8, 'line-opacity': 0, 'line-opacity-transition': { duration: 1600 } } },
        { id: 'outline', type: 'line', source: 'outline', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-width': 2.6, 'line-gradient': outlineGradient(0) } },
        {
          id: 'prov-focus', type: 'line', source: 'province', filter: ['==', ['get', 'sigla'], ''], layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': `rgb(${CREAM})`, 'line-width': 3.4, 'line-opacity': 0, 'line-opacity-transition': { duration: 900 } },
        },
      ],
      sky: SKY,
      terrain: TERRAIN,
    },
    bounds: MARCHE,
    fitBoundsOptions: { padding: 40 },
    maxBounds: [[10.9, 41.6], [15.2, 45.0]],
    minZoom: 6.3,
    maxZoom: 14.6,
    maxPitch: 72,
    attributionControl: { compact: true },
    cooperativeGestures: true,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rotellina per avvicinarti',
      'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rotellina per avvicinarti',
      'CooperativeGesturesHandler.MobileHelpText': 'Usa due dita per muovere la mappa',
      'NavigationControl.ZoomIn': 'Avvicina', 'NavigationControl.ZoomOut': 'Allontana', 'NavigationControl.ResetBearing': 'Orienta a nord',
      'AttributionControl.ToggleAttribution': 'Crediti della mappa',
    },
    fadeDuration: 0,
  });
  root.dataset.mvState = 'loading';
  (root as HTMLElement & { _map?: maplibregl.Map })._map = map; // per i test e il debug

  const homeCamera = () => {
    const pad = isMobile()
      ? { top: 150, bottom: 150, left: 24, right: 24 }
      : { top: 90, bottom: 70, left: Math.min(520, root.clientWidth * 0.4), right: 80 };
    const cam = map.cameraForBounds(MARCHE, { padding: pad, pitch: homePitch, bearing: homeBearing });
    return { center: cam?.center ?? [13.1, 43.35], zoom: (cam?.zoom ?? 7.8) + 0.15, pitch: homePitch, bearing: homeBearing };
  };

  // --- Interazione: orbita a riposo ------------------------------------------------
  let orbiting = false;
  let lastInteraction = performance.now();
  let raf = 0;
  const ORBIT_DEG_S = 1.6;
  const touch = () => {
    lastInteraction = performance.now();
    if (orbiting) stopOrbit();
  };
  function orbitLoop(t0: number) {
    let prev = t0;
    const step = (t: number) => {
      if (!orbiting) return;
      map.setBearing(map.getBearing() + ((t - prev) / 1000) * ORBIT_DEG_S);
      prev = t;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function startOrbit() {
    if (orbiting || reduced() || selected || document.hidden) return;
    orbiting = true;
    root.dataset.mvOrbit = '1';
    orbitLoop(performance.now());
  }
  function stopOrbit() {
    orbiting = false;
    delete root.dataset.mvOrbit;
    cancelAnimationFrame(raf);
  }
  setInterval(() => {
    if (!orbiting && !selected && introDone && performance.now() - lastInteraction > 9000 && map.getZoom() < 10) startOrbit();
  }, 1000);
  for (const ev of ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const) root.addEventListener(ev, touch, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden && stopOrbit());

  // --- Segnaposto (DOM + supercluster) --------------------------------------------
  const index = new Supercluster<{ slug: string }>({ radius: isMobile() ? 48 : 42, maxZoom: 12, minPoints: 3 });
  index.load(cards.map((c) => ({ type: 'Feature', properties: { slug: c.slug }, geometry: { type: 'Point', coordinates: [c.lng, c.lat] } })));
  const markers = new Map<string, { marker: maplibregl.Marker; el: HTMLElement }>();
  let pinsVisible = false;
  let focusProv: string | null = null;

  function pinEl(c: Card) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'mv-pin';
    el.dataset.slug = c.slug;
    if (c.province_code) el.style.setProperty('--pc', PROVINCE_COLOR[c.province_code] ?? '#fff');
    if (c.exps > 0) el.dataset.exp = '1';
    el.setAttribute('aria-label', `${c.name}${c.municipality ? `, ${c.municipality}` : ''}`);
    // MapLibre posiziona il bottone con transform: le animazioni stanno sul figlio .mv-in.
    el.innerHTML = `<span class="mv-in"><span class="mv-pin-ring" aria-hidden="true"></span><span class="mv-pin-ring" aria-hidden="true"></span><span class="mv-pin-dot" aria-hidden="true"></span>`
      + `<span class="mv-pin-label" aria-hidden="true"><b>${esc(c.name)}</b><small>${esc(c.municipality ?? '')}</small></span></span>`;
    el.addEventListener('click', (e) => { e.stopPropagation(); select(c.slug); });
    return el;
  }
  function clusterEl(id: number, count: number, lngLat: [number, number]) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'mv-cluster';
    el.style.setProperty('--s', String(Math.round(Math.min(52, 22 + Math.sqrt(count) * 4.2))));
    el.setAttribute('aria-label', `${count} cantine qui: avvicinati`);
    el.innerHTML = `<span class="mv-in"><span>${count}</span></span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      touch();
      const z = Math.min(index.getClusterExpansionZoom(id) + 0.4, 13.5);
      map.flyTo({ center: lngLat, zoom: z, pitch: Math.max(map.getPitch(), 50), duration: reduced() ? 0 : 1300, essential: true });
    });
    return el;
  }

  function updateMarkers(animate = true) {
    if (!pinsVisible) return;
    const b = map.getBounds();
    const pad = 0.15;
    const z = Math.floor(map.getZoom());
    const feats = index.getClusters([b.getWest() - pad, b.getSouth() - pad, b.getEast() + pad, b.getNorth() + pad], z);
    const keep = new Set<string>();
    let i = 0;
    for (const f of feats) {
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const props = f.properties as { cluster?: boolean; cluster_id?: number; point_count?: number; slug?: string };
      const key = props.cluster ? `c${props.cluster_id}` : props.slug!;
      keep.add(key);
      let m = markers.get(key);
      if (!m) {
        const el = props.cluster ? clusterEl(props.cluster_id!, props.point_count!, [lng, lat]) : pinEl(bySlug.get(props.slug!)!);
        el.style.setProperty('--d', animate ? `${Math.min(i++, 40) * 18}ms` : '0ms');
        const marker = new maplibregl.Marker({ element: el, anchor: 'center', opacityWhenCovered: '0.25' }).setLngLat([lng, lat]).addTo(map);
        m = { marker, el };
        markers.set(key, m);
      }
      const c = props.slug ? bySlug.get(props.slug) : null;
      m.el.classList.toggle('is-dim', !!focusProv && !!c && c.province_code !== focusProv);
      m.el.classList.toggle('is-active', !!c && c.slug === selected);
    }
    for (const [key, m] of markers) {
      if (keep.has(key)) continue;
      markers.delete(key);
      m.el.classList.add('is-leaving');
      setTimeout(() => m.marker.remove(), reduced() ? 0 : 220);
    }
  }
  let pending = false;
  map.on('move', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; updateMarkers(); });
  });

  // --- Province ---------------------------------------------------------------------
  let provinces: FeatureCollection<Polygon | MultiPolygon, { sigla: string; name: string }> | null = null;
  let hovered: string | null = null;
  const chips = [...document.querySelectorAll<HTMLElement>('[data-mv-goto]')];

  function setCount() {
    const n = focusProv ? cards.filter((c) => c.province_code === focusProv).length : cards.length;
    if (countEl) countEl.textContent = `${n} cantine${focusProv ? ` in provincia di ${PROVINCE_NAME[focusProv]}` : ' sulla mappa'}`;
    if (listLink) {
      listLink.href = focusProv ? `${base}/cantine?provincia=${focusProv}` : `${base}/cantine`;
      listLink.textContent = focusProv ? `Le cantine di ${PROVINCE_NAME[focusProv]} in elenco →` : 'Tutte le cantine in elenco →';
    }
    for (const c of chips) c.setAttribute('aria-current', String((c.dataset.mvGoto === 'all' && !focusProv) || c.dataset.mvGoto === focusProv));
  }

  function focusProvince(sigla: string | null, fly = true) {
    focusProv = sigla && PROVINCE_COLOR[sigla] ? sigla : null;
    // Le altre province si spengono con una dissolvenza; la scelta prende un bordo pieno.
    if (focusProv) {
      map.setFilter('prov-dim', ['!=', ['get', 'sigla'], focusProv]);
      map.setFilter('prov-focus', ['==', ['get', 'sigla'], focusProv]);
    }
    map.setPaintProperty('prov-dim', 'fill-opacity', focusProv ? 0.5 : 0);
    map.setPaintProperty('prov-focus', 'line-opacity', focusProv ? 1 : 0);
    setCount();
    updateMarkers(false);
    history.replaceState(null, '', focusProv ? `#provincia-${focusProv}` : location.pathname + location.search);
    if (!fly) return;
    touch();
    if (!focusProv) { map.flyTo({ ...homeCamera(), duration: reduced() ? 0 : 2200, essential: true }); return; }
    const f = provinces?.features.find((x) => x.properties.sigla === focusProv);
    if (!f) return;
    const pad = isMobile() ? { top: 140, bottom: 160, left: 20, right: 20 } : { top: 100, bottom: 80, left: Math.min(500, root.clientWidth * 0.38), right: 80 };
    const cam = map.cameraForBounds(bboxOf(f.geometry), { padding: pad, pitch: 56, bearing: homeBearing - 12 });
    if (cam) map.flyTo({ ...cam, zoom: (cam.zoom ?? 9) + 0.35, pitch: 56, bearing: homeBearing - 12, duration: reduced() ? 0 : 2300, curve: 1.5, essential: true });
  }
  for (const c of chips) {
    c.addEventListener('click', (e) => {
      e.preventDefault();
      closePanel(false);
      focusProvince(c.dataset.mvGoto === 'all' ? null : c.dataset.mvGoto!);
    });
  }

  map.on('mousemove', 'prov-tint', (e) => {
    const id = e.features?.[0]?.id as string | undefined;
    if (id === hovered) return;
    if (hovered) map.setFeatureState({ source: 'province', id: hovered }, { hover: false });
    hovered = id ?? null;
    if (hovered) map.setFeatureState({ source: 'province', id: hovered }, { hover: true });
    map.getCanvas().style.cursor = hovered && !focusProv ? 'pointer' : '';
  });
  map.on('mouseleave', 'prov-tint', () => {
    if (hovered) map.setFeatureState({ source: 'province', id: hovered }, { hover: false });
    hovered = null;
    map.getCanvas().style.cursor = '';
  });
  map.on('click', 'prov-tint', (e) => {
    const id = e.features?.[0]?.id as string | undefined;
    if (selected) { closePanel(); return; }
    if (id && id !== focusProv) focusProvince(id);
  });

  // --- Pannello della cantina -----------------------------------------------------
  let selected: string | null = null;
  let cameraBefore: { center: maplibregl.LngLat; zoom: number; pitch: number; bearing: number } | null = null;
  const trail: string[] = [];
  const visited = new Set<string>();

  function nearestUnvisited(from: Card) {
    let best: Card | null = null;
    let bd = Infinity;
    for (const c of cards) {
      if (c.slug === from.slug || visited.has(c.slug)) continue;
      if (focusProv && c.province_code !== focusProv) continue;
      const d = distKm(from, c);
      if (d < bd) { bd = d; best = c; }
    }
    return best ? { card: best, km: bd } : null;
  }

  function renderPanel(c: Card) {
    const next = nearestUnvisited(c);
    const cover = c.cover ? `<figure class="mv-panel-cover"><img src="${base}/media/${esc(c.cover)}" alt="" loading="lazy" decoding="async" /></figure>` : '';
    const wines = c.top_wines.length
      ? `<ul class="mv-panel-wines" role="list">${c.top_wines.map((w) => `<li>${esc(w)}</li>`).join('')}${c.wines > c.top_wines.length ? `<li class="meta">e altri ${c.wines - c.top_wines.length}</li>` : ''}</ul>`
      : '<p class="text-grafite">Le etichette non sono ancora in catalogo.</p>';
    const exp = c.exp
      ? `<a class="mv-ticket" href="${base}/cantine/${c.slug}#esperienze"><span class="meta">${KIND_LABEL[c.exp.k] ?? 'Esperienza'}${c.exp.p ? ` · ${fmtPrice(c.exp.p)}` : ''}${c.exp.d ? ` · ${fmtDur(c.exp.d)}` : ''}</span><span class="display">${esc(c.exp.t)}</span>${c.exps > 1 ? `<span class="meta">+ altre ${c.exps - 1}</span>` : ''}</a>`
      : '';
    panel.querySelector('[data-mv-panel-body]')!.innerHTML = `
      ${cover}
      <p class="meta mv-stagger"><span class="text-rosso">${catalogNo(c.num)}</span>${c.province_code ? ` · ${esc(PROVINCE_NAME[c.province_code] ?? c.province_code)}` : ''}</p>
      <h2 id="mv-panel-title" class="display mv-stagger" tabindex="-1"><span style="view-transition-name:c-${c.slug}">${esc(c.name)}</span></h2>
      <p class="mv-stagger text-grafite">${esc(c.municipality ?? '')}${c.territory ? `, <em class="font-serif">${esc(c.territory)}</em>` : ''}</p>
      <dl class="mv-stats mv-stagger"><div><dt class="meta">Vini</dt><dd class="manifesto">${c.wines}</dd></div><div><dt class="meta">Esperienze</dt><dd class="manifesto">${c.exps}</dd></div></dl>
      <div class="mv-stagger">${wines}</div>
      ${exp ? `<div class="mv-stagger">${exp}</div>` : ''}
      <div class="mv-actions mv-stagger">
        <a class="btn-primary" href="${base}/cantine/${c.slug}">Apri la scheda →</a>
        <a class="btn bg-carta" href="${base}/cantine/${c.slug}#visita">Richiedi una visita</a>
      </div>
      <div class="mv-hop mv-stagger">
        <button type="button" class="pillola" data-mv-back ${trail.length > 1 ? '' : 'disabled'}>← Indietro</button>
        ${next ? `<button type="button" class="pillola" data-mv-next="${next.card.slug}">Vicina: ${esc(next.card.name)}&nbsp;<span class="opacity-60">${next.km < 1 ? '<1' : Math.round(next.km)} km</span>&nbsp;→</button>` : ''}
      </div>`;
    panel.querySelector('[data-mv-back]')?.addEventListener('click', () => {
      trail.pop();
      const prev = trail.pop();
      if (prev) select(prev);
    });
    panel.querySelector<HTMLElement>('[data-mv-next]')?.addEventListener('click', (e) => select((e.currentTarget as HTMLElement).dataset.mvNext!));
  }

  function select(slug: string) {
    const c = bySlug.get(slug);
    if (!c) return;
    touch();
    stopOrbit();
    if (!selected) {
      const ctr = map.getCenter();
      cameraBefore = { center: ctr, zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() };
    }
    selected = slug;
    visited.add(slug);
    if (trail[trail.length - 1] !== slug) trail.push(slug);
    root.dataset.mvSelected = '1';
    renderPanel(c);
    panel.classList.remove('is-open');
    void panel.offsetWidth; // riavvia l'animazione d'ingresso
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    updateMarkers(false);
    const offset: [number, number] = isMobile() ? [0, -Math.round(window.innerHeight * 0.2)] : [-Math.round(Math.min(440, root.clientWidth * 0.34) / 2), 0];
    const bearing = map.getBearing() + (Math.random() > 0.5 ? 28 : -28);
    map.flyTo({
      center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 12.4), pitch: 64, bearing, offset,
      duration: reduced() ? 0 : 2600, curve: 1.7, essential: true,
      easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    });
    history.replaceState(null, '', `#cantina-${slug}`);
    setTimeout(() => panel.querySelector<HTMLElement>('#mv-panel-title')?.focus({ preventScroll: true }), reduced() ? 0 : 350);
  }

  function closePanel(flyBack = true) {
    if (!selected) return;
    selected = null;
    trail.length = 0;
    delete root.dataset.mvSelected;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    updateMarkers(false);
    history.replaceState(null, '', focusProv ? `#provincia-${focusProv}` : location.pathname + location.search);
    if (flyBack && cameraBefore) map.flyTo({ ...cameraBefore, duration: reduced() ? 0 : 2000, essential: true });
    cameraBefore = null;
  }
  panel.querySelector('[data-mv-close]')?.addEventListener('click', () => closePanel());
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (selected) closePanel(); else if (focusProv) focusProvince(null); }
  });

  // --- Comandi ---------------------------------------------------------------------
  root.querySelector('[data-mv-zoom-in]')?.addEventListener('click', () => { touch(); map.zoomIn({ duration: 500 }); });
  root.querySelector('[data-mv-zoom-out]')?.addEventListener('click', () => { touch(); map.zoomOut({ duration: 500 }); });
  root.querySelector('[data-mv-home]')?.addEventListener('click', () => { closePanel(false); focusProvince(null); });
  const tilt = root.querySelector<HTMLButtonElement>('[data-mv-tilt]');
  tilt?.addEventListener('click', () => {
    touch();
    const flat = map.getPitch() > 10;
    map.easeTo({ pitch: flat ? 0 : homePitch, bearing: flat ? 0 : map.getBearing(), duration: reduced() ? 0 : 1200 });
    tilt.setAttribute('aria-pressed', String(!flat));
  });
  const orbitBtn = root.querySelector<HTMLButtonElement>('[data-mv-orbit]');
  orbitBtn?.addEventListener('click', () => {
    if (orbiting) { stopOrbit(); lastInteraction = performance.now() + 60_000; }
    else { lastInteraction = 0; startOrbit(); }
  });

  // --- Regia d'ingresso -------------------------------------------------------------
  let introDone = false;
  function drawOutline(ms: number) {
    return new Promise<void>((done) => {
      if (reduced()) { map.setPaintProperty('outline', 'line-gradient', outlineGradient(1)); done(); return; }
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        const e = 1 - Math.pow(1 - p, 3);
        map.setPaintProperty('outline', 'line-gradient', outlineGradient(e));
        if (p < 1) requestAnimationFrame(step); else done();
      };
      requestAnimationFrame(step);
    });
  }

  map.on('load', async () => {
    // su schermi stretti i crediti partono chiusi (si aprono con la "i")
    if (isMobile()) root.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
    provinces = await (await fetch(`${base}/geo/marche-province.json`)).json();
    root.dataset.mvState = 'ready';
    const fromHash = location.hash.match(/^#(cantina|provincia)-(.+)$/);
    const target = homeCamera();
    if (reduced() || fromHash) {
      map.jumpTo(target);
    } else {
      // Dall'alto, piatta, un po' più lontano: poi scende e si inclina.
      map.jumpTo({ center: [13.05, 43.25], zoom: target.zoom - 1.1, pitch: 0, bearing: 0 });
    }
    map.setPaintProperty('mask', 'fill-opacity', 0.38);
    map.setPaintProperty('outline-glow', 'line-opacity', 0.55);
    map.setPaintProperty('prov-line', 'line-opacity', 0.7);
    const outline = drawOutline(2200);
    if (!reduced() && !fromHash) {
      await new Promise((r) => setTimeout(r, 500));
      map.flyTo({ ...target, duration: 4200, curve: 1.2, essential: true, easing: (t) => 1 - Math.pow(1 - t, 4) });
      await new Promise((r) => setTimeout(r, 1700));
    }
    pinsVisible = true;
    updateMarkers(true);
    await outline;
    introDone = true;
    lastInteraction = performance.now();
    setCount();
    if (fromHash?.[1] === 'cantina' && bySlug.has(fromHash[2])) select(fromHash[2]);
    else if (fromHash?.[1] === 'provincia') focusProvince(fromHash[2].toUpperCase());
    // Suggerimento sui gesti, una volta sola.
    if (hint) { hint.hidden = false; setTimeout(() => (hint.hidden = true), 5200); }
  });

  map.on('click', (e) => {
    if (!selected) return;
    const hit = map.queryRenderedFeatures(e.point, { layers: ['prov-tint'] });
    if (!hit.length) closePanel();
  });

  new ResizeObserver(() => map.resize()).observe(root);
  return map;
}
