// Mappa delle Marche in SVG: confini provinciali ISTAT 2026 (CC BY 4.0, vedi
// data/export-2026-10-09/LICENSE-map.md), già proiettati nel viewBox 0 0 1000 800.
// Lon/lat → x/y: trasformazione lineare stimata adattando le 307 cantine con
// coordinate ai poligoni della loro provincia (306/307 cadono nella provincia giusta).
import provinces from '../../data/export-2026-10-09/marche-map.json';

const P = { a: 381.800, b: -4449.419, c: 503.125, e: 22197.159 };

export const VIEWBOX = { x: 180, y: 50, w: 720, h: 690 };

export function project(lng: number, lat: number) {
  return { x: +(P.a * lng + P.b).toFixed(1), y: +(-P.c * lat + P.e).toFixed(1) };
}

export interface ProvinceShape {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
}

export const PROVINCE_SHAPES: ProvinceShape[] = (provinces as { id: string; name: string; path: string; x: number; y: number }[]).map(
  (p) => ({ id: p.id, name: p.name, path: p.path, labelX: p.x, labelY: p.y }),
);

/** Riquadro (viewBox) attorno a un insieme di punti, con margine e proporzioni minime. */
export function fitViewBox(points: { x: number; y: number }[], pad = 60) {
  if (points.length === 0) return VIEWBOX;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let x = Math.min(...xs) - pad;
  let y = Math.min(...ys) - pad;
  let w = Math.max(...xs) - x + pad;
  let h = Math.max(...ys) - y + pad;
  const min = 260;
  if (w < min) { x -= (min - w) / 2; w = min; }
  if (h < min) { y -= (min - h) / 2; h = min; }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}
