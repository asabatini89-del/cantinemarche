// Mappa esplorabile: volo animato sulle province, zoom e trascinamento.
//
// La "camera" è il viewBox dell'SVG. I voli usano la traiettoria di van Wijk e
// Nuij (la stessa di d3.interpolateZoom): si allontana, scorre e si riavvicina
// come una ripresa aerea, invece di traslare in linea retta. Punti, testi e
// contorni restano della stessa dimensione a schermo a ogni livello di zoom,
// così allo zoom le cantine vicine si separano.

type Cam = { x: number; y: number; w: number }; // centro (x, y) e larghezza del riquadro, in unità SVG

const RHO = Math.SQRT2;
const EPS = 1e-12;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Interpolazione "smooth zoom" di van Wijk & Nuij (2003). */
function zoomPath(a: Cam, b: Cam) {
  const [ux0, uy0, w0] = [a.x, a.y, a.w];
  const [ux1, uy1, w1] = [b.x, b.y, b.w];
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  if (d2 < EPS) {
    const S = Math.log(w1 / w0) / RHO;
    return { S, at: (t: number): Cam => ({ x: ux0 + t * dx, y: uy0 + t * dy, w: w0 * Math.exp(RHO * t * S) }) };
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO ** 2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO ** 2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / RHO;
  return {
    S,
    at: (t: number): Cam => {
      const s = t * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (RHO ** 2 * d1)) * (coshr0 * Math.tanh(RHO * s + r0) - Math.sinh(r0));
      return { x: ux0 + u * dx, y: uy0 + u * dy, w: (w0 * coshr0) / Math.cosh(RHO * s + r0) };
    },
  };
}

export function initMapExplorer(fig: HTMLElement) {
  const svg = fig.querySelector<SVGSVGElement>('svg[data-camera]')!;
  const home = JSON.parse(svg.dataset.camera!) as { x: number; y: number; w: number; h: number };
  const dots = [...svg.querySelectorAll<SVGCircleElement>('[data-dot]')];
  const hits = [...svg.querySelectorAll<SVGCircleElement>('[data-hit]')];
  const towns = [...svg.querySelectorAll<SVGTextElement>('[data-town]')];
  const provLabels = svg.querySelector<SVGGElement>('[data-province-labels]');
  const sea = svg.querySelector<SVGTextElement>('.mappa-mare');
  const provinces = [...svg.querySelectorAll<SVGPathElement>('path[data-prov]')];
  const crumb = fig.querySelector<HTMLElement>('[data-crumb]');
  const count = fig.querySelector<HTMLElement>('[data-count]');
  const callout = fig.querySelector<HTMLElement>('[data-callout]');
  const totalDots = dots.length;

  const homeCam: Cam = { x: home.x + home.w / 2, y: home.y + home.h / 2, w: home.w };
  const MIN_W = home.w / 28; // zoom massimo ~28×
  const MAX_W = home.w * 1.15;
  let cam: Cam = { ...homeCam };
  let focus: string | null = null;
  let anim = 0;
  let active = false;

  const aspect = () => {
    const r = svg.getBoundingClientRect();
    return r.width > 0 ? r.height / r.width : home.h / home.w;
  };
  const pxPerUnit = () => svg.getBoundingClientRect().width / cam.w;

  function render() {
    const h = cam.w * aspect();
    svg.setAttribute('viewBox', `${cam.x - cam.w / 2} ${cam.y - h / 2} ${cam.w} ${h}`);
    const px = pxPerUnit();
    if (!(px > 0)) return; // figura nascosta (es. fallback della mappa 3D): niente da scalare
    const k = 1 / px; // unità SVG per pixel
    const zoom = home.w / cam.w;
    const r = (zoom > 3 ? 5.5 : 4.5) * k;
    for (const d of dots) d.setAttribute('r', String(r));
    for (const d of hits) d.setAttribute('r', String(12 * k));
    const showTowns = zoom >= 2.2;
    for (const t of towns) {
      const n = Number(t.dataset.n);
      const visible = showTowns && (zoom >= 4 || n >= 3) && (!focus || t.dataset.prov === focus);
      t.setAttribute('font-size', String(11 * k));
      t.setAttribute('stroke-width', String(4 * k));
      t.setAttribute('dy', String(-9 * k));
      t.style.opacity = visible ? '1' : '0';
    }
    if (provLabels) provLabels.style.opacity = zoom < 1.6 && !focus ? '1' : '0';
    if (sea) sea.style.opacity = zoom < 1.25 ? '1' : '0';
    svg.style.setProperty('--k', String(k));
    if (callout && !callout.hidden) placeCallout();
  }

  function setCam(next: Cam) {
    const w = Math.min(MAX_W, Math.max(MIN_W, next.w));
    cam = { x: next.x, y: next.y, w };
    render();
  }

  function flyTo(target: Cam, onDone?: () => void) {
    cancelAnimationFrame(anim);
    target = { ...target, w: Math.min(MAX_W, Math.max(MIN_W, target.w)) };
    if (reduced()) { setCam(target); onDone?.(); return; }
    const path = zoomPath(cam, target);
    const duration = Math.min(1800, Math.max(650, Math.abs(path.S) * 900));
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCam(path.at(ease(t)));
      if (t < 1) anim = requestAnimationFrame(step);
      else onDone?.();
    };
    anim = requestAnimationFrame(step);
  }

  /** Riquadro che contiene un rettangolo, con margine, rispettando le proporzioni. */
  function camFor(b: { x: number; y: number; width: number; height: number }, pad = 0.12): Cam {
    const a = aspect();
    const w = Math.max(b.width, b.height / a) * (1 + pad * 2);
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, w };
  }

  function setFocus(id: string | null, animate = true) {
    focus = id;
    active = Boolean(id);
    fig.dataset.focus = id ?? '';
    for (const p of provinces) p.classList.toggle('is-focus', p.dataset.prov === id);
    for (const p of provinces) p.classList.toggle('is-dim', Boolean(id) && p.dataset.prov !== id);
    svg.querySelectorAll<SVGPathElement>('[data-shadow]').forEach((s) => s.classList.toggle('is-dim', Boolean(id) && s.dataset.shadow !== id));
    for (const d of dots) d.closest('a')?.classList.toggle('is-dim', Boolean(id) && d.dataset.prov !== id);
    const name = id ? provinces.find((p) => p.dataset.prov === id)?.dataset.name : null;
    if (crumb) crumb.textContent = name ? `Marche › ${name}` : 'Marche';
    const n = id ? dots.filter((d) => d.dataset.prov === id).length : totalDots;
    if (count) count.textContent = `${n} cantine sulla mappa`;
    // Collegamento all'elenco della provincia a fuoco (fuori dalla mappa)
    document.querySelectorAll<HTMLAnchorElement>('[data-list-link]').forEach((a) => {
      a.href = id ? `/cantine?provincia=${id}` : '/cantine';
      a.textContent = id ? `Elenco delle cantine: ${name} →` : 'Tutte le cantine in elenco →';
    });
    document.querySelectorAll<HTMLElement>('[data-map-goto]').forEach((b) => {
      if (b.dataset.mapGoto === (id ?? 'all')) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    fig.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.goto === (id ?? 'all'))));
    hideCallout();
    const target = id ? camFor(provinces.find((p) => p.dataset.prov === id)!.getBBox()) : homeCam;
    if (animate) flyTo(target); else setCam(target);
    history.replaceState(null, '', id ? `#provincia-${id}` : location.pathname + location.search);
  }

  function zoomAt(factor: number, sx: number, sy: number, animate = true) {
    // (sx, sy) = punto in unità SVG che resta fermo
    const w = Math.min(MAX_W, Math.max(MIN_W, cam.w / factor));
    const f = w / cam.w;
    const target = { x: sx + (cam.x - sx) * f, y: sy + (cam.y - sy) * f, w };
    if (animate) flyTo(target); else setCam(target);
  }

  const toSvg = (clientX: number, clientY: number) => {
    const r = svg.getBoundingClientRect();
    const h = cam.w * aspect();
    return { x: cam.x - cam.w / 2 + ((clientX - r.left) / r.width) * cam.w, y: cam.y - h / 2 + ((clientY - r.top) / r.height) * h };
  };

  // --- Cartiglio ------------------------------------------------------------
  let calloutAnchor: { x: number; y: number } | null = null;
  function placeCallout() {
    if (!callout || !calloutAnchor) return;
    const r = svg.getBoundingClientRect();
    const fr = fig.getBoundingClientRect();
    const h = cam.w * aspect();
    const px = r.left - fr.left + ((calloutAnchor.x - (cam.x - cam.w / 2)) / cam.w) * r.width;
    const py = r.top - fr.top + ((calloutAnchor.y - (cam.y - h / 2)) / h) * r.height;
    const left = Math.min(Math.max(px - callout.offsetWidth / 2, 8), fr.width - callout.offsetWidth - 8);
    const below = py + 16;
    const top = below + callout.offsetHeight > fr.height - 8 ? py - callout.offsetHeight - 16 : below;
    callout.style.left = `${left}px`;
    callout.style.top = `${Math.max(top, 8)}px`;
  }
  function hideCallout() {
    if (callout) callout.hidden = true;
    svg.querySelectorAll('.is-selected').forEach((e) => e.classList.remove('is-selected'));
  }

  svg.querySelectorAll<SVGAElement>('a[data-name]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (moved) return;
      if (!callout) { location.href = a.getAttribute('href')!; return; }
      hideCallout();
      a.classList.add('is-selected');
      callout.querySelector('[data-callout-name]')!.textContent = a.dataset.name ?? '';
      callout.querySelector('[data-callout-place]')!.textContent = a.dataset.place ?? '';
      callout.querySelector<HTMLAnchorElement>('[data-callout-link]')!.href = a.getAttribute('href')!;
      calloutAnchor = { x: Number(a.dataset.x), y: Number(a.dataset.y) };
      callout.hidden = false;
      placeCallout();
    });
  });
  callout?.querySelector('[data-callout-close]')?.addEventListener('click', hideCallout);

  // --- Province: primo clic mette a fuoco, i successivi avvicinano ------------
  provinces.forEach((p) => {
    p.addEventListener('click', (e) => {
      if (moved) return;
      const id = p.dataset.prov!;
      if (focus !== id) setFocus(id);
      else { const pt = toSvg(e.clientX, e.clientY); zoomAt(2.4, pt.x, pt.y); }
    });
  });
  svg.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (!t.closest('a') && !t.closest('path[data-prov]')) hideCallout();
  });
  svg.addEventListener('dblclick', (e) => e.preventDefault());

  // --- Rotella, trascinamento, pinch -------------------------------------------
  // La rotella zooma solo se la mappa è "attiva" (cliccata o con una provincia a
  // fuoco) o con Ctrl/⌘: altrimenti la pagina scorre e compare un suggerimento.
  let hintTimer = 0;
  const hint = fig.querySelector<HTMLElement>('[data-hint]');
  fig.addEventListener('pointerdown', () => { active = true; });
  fig.addEventListener('pointerleave', () => { active = false; });
  svg.addEventListener('wheel', (e) => {
    if (!active && !e.ctrlKey && !e.metaKey) {
      if (hint) { hint.hidden = false; clearTimeout(hintTimer); hintTimer = window.setTimeout(() => { hint.hidden = true; }, 1400); }
      return;
    }
    e.preventDefault();
    cancelAnimationFrame(anim);
    const pt = toSvg(e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022));
    zoomAt(factor, pt.x, pt.y, false);
  }, { passive: false });

  const pointers = new Map<number, { x: number; y: number }>();
  let moved = false;
  let last: { x: number; y: number; dist: number } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    last = null;
  });
  svg.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.values()];
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    if (last) {
      const dxPx = cx - last.x;
      const dyPx = cy - last.y;
      if (!moved && Math.hypot(dxPx, dyPx) < 4 && pts.length === 1) return;
      if (!moved) { moved = true; svg.setPointerCapture(e.pointerId); cancelAnimationFrame(anim); fig.dataset.dragging = ''; }
      const k = 1 / pxPerUnit();
      let next = { x: cam.x - dxPx * k, y: cam.y - dyPx * k, w: cam.w };
      if (pts.length > 1 && last.dist > 0) {
        const pt = toSvg(cx, cy);
        const f = last.dist / dist;
        const w = Math.min(MAX_W, Math.max(MIN_W, cam.w * f));
        const g = w / cam.w;
        next = { x: pt.x + (next.x - pt.x) * g, y: pt.y + (next.y - pt.y) * g, w };
      }
      setCam(next);
    }
    last = { x: cx, y: cy, dist };
  });
  const end = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    last = null;
    delete fig.dataset.dragging;
    if (pointers.size === 0) setTimeout(() => { moved = false; }, 0);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  // --- Pulsanti e tastiera ----------------------------------------------------
  fig.querySelector('[data-zoom-in]')?.addEventListener('click', () => zoomAt(2, cam.x, cam.y));
  fig.querySelector('[data-zoom-out]')?.addEventListener('click', () => zoomAt(0.5, cam.x, cam.y));
  fig.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) => {
    b.addEventListener('click', () => setFocus(b.dataset.goto === 'all' ? null : b.dataset.goto!));
  });
  document.querySelectorAll<HTMLElement>('[data-map-goto]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      fig.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      setFocus(b.dataset.mapGoto === 'all' ? null : b.dataset.mapGoto!);
    });
  });
  fig.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideCallout(); if (focus) setFocus(null); }
    if (e.key === '+' || e.key === '=') zoomAt(1.6, cam.x, cam.y);
    if (e.key === '-') zoomAt(1 / 1.6, cam.x, cam.y);
  });

  new ResizeObserver(() => render()).observe(svg);

  // Stato iniziale: dall'hash (#provincia-AN) oppure tutta la regione.
  const fromHash = location.hash.match(/^#provincia-([A-Z]{2})$/)?.[1];
  if (fromHash && provinces.some((p) => p.dataset.prov === fromHash)) setFocus(fromHash, false);
  else render();
  fig.dataset.ready = '';
}
