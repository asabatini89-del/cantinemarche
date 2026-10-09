// Anteprima statica del sito (per GitHub Pages o qualunque hosting statico).
//
//   npm run build && npx wrangler dev --port 8788 &     # il sito vero, su D1 locale
//   node scripts/build-static-preview.mjs --origin http://localhost:8788 --base /cantinemarche --out preview-dist
//
// Visita tutte le pagine del sito in esecuzione e le salva come HTML statico:
// home, catalogo (tutte le pagine), filtri singoli (una provincia, una denominazione,
// un vitigno o un servizio), schede, territori, denominazioni, pagine di servizio.
// Ricerca libera, filtri combinati e moduli richiedono il server: nell'anteprima
// lo spiega un avviso.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : def);
const ORIGIN = opt('origin', 'http://localhost:8788');
const BASE = (opt('base', '') ?? '').replace(/\/$/, '');
const OUT = opt('out', 'preview-dist');
const FACETS = ['provincia', 'denominazione', 'vitigno', 'servizio'];

// --- URL del sito → file statico -------------------------------------------
/** Ritorna il percorso pubblico statico (senza base) o null se non è pubblicabile. */
function staticPath(url) {
  const u = new URL(url, ORIGIN);
  if (u.origin !== new URL(ORIGIN).origin) return null;
  const params = [...u.searchParams].filter(([k, v]) => v !== '');
  if (params.length === 0) return u.pathname;
  if (u.pathname !== '/cantine') return null;
  const page = u.searchParams.get('pagina');
  const filters = params.filter(([k]) => k !== 'pagina');
  if (filters.length === 0) return page ? `/cantine/filtro/tutte-p${page}` : '/cantine';
  if (filters.length !== 1 || !FACETS.includes(filters[0][0])) return null; // ricerca o filtri combinati
  const [k, v] = filters[0];
  return `/cantine/filtro/${k}-${v}${page && page !== '1' ? `-p${page}` : ''}`;
}
const fileFor = (path) =>
  path === '/' ? 'index.html' : /\.[a-z0-9]+$/i.test(path) ? path.slice(1) : `${path.slice(1)}.html`;

// --- Visita --------------------------------------------------------------------
const pages = new Map(); // path statico → URL sorgente
const assets = new Set();
const queue = [];
const enqueue = (url) => {
  const path = staticPath(url);
  if (path && !pages.has(path)) { pages.set(path, url); queue.push(path); }
};

async function get(url) {
  const res = await fetch(new URL(url, ORIGIN), { redirect: 'manual' });
  return res;
}

// Punti di partenza: sitemap + catalogo + filtri singoli presenti nella barra filtri.
const sitemap = await (await get('/sitemap.xml')).text();
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) enqueue(new URL(m[1]).pathname);
const catalog = await (await get('/cantine')).text();
for (const m of catalog.matchAll(/name="(provincia|denominazione|vitigno|servizio)"\s+value="([^"]+)"/g)) enqueue(`/cantine?${m[1]}=${m[2]}`);
enqueue('/cantine');
enqueue('/404');

const html = new Map();
while (queue.length) {
  const batch = queue.splice(0, 8);
  await Promise.all(batch.map(async (path) => {
    const res = await get(pages.get(path));
    if (path !== '/404' && res.status !== 200) { console.warn(`! ${res.status} ${pages.get(path)}`); pages.delete(path); return; }
    const body = await res.text();
    html.set(path, body);
    for (const m of body.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      const v = m[1].replace(/&amp;/g, '&');
      if (!v.startsWith('/') || v.startsWith('//')) continue;
      if (/^\/(_astro|media)\/|\.(svg|webp|png|jpg|woff2?|css|js)$/.test(v.split('?')[0])) assets.add(v.split('?')[0]);
      else enqueue(v);
    }
    for (const m of body.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) assets.add(part.trim().split(/\s+/)[0]);
  }));
  process.stdout.write(`\rPagine: ${html.size}   `);
}
console.log();

// --- Riscrittura dei link -------------------------------------------------------
const linkTo = (raw) => {
  const v = raw.replace(/&amp;/g, '&');
  const [pathAndQuery, hash = ''] = v.split('#');
  if (/^\/(_astro|media)\/|\.(svg|webp|png|jpg|woff2?|css|js|xml|txt)$/.test(pathAndQuery.split('?')[0])) return `${BASE}${pathAndQuery}${hash ? `#${hash}` : ''}`;
  const path = staticPath(pathAndQuery);
  const target = path && pages.has(path) ? path : pathAndQuery.split('?')[0];
  return `${BASE}${target}${hash ? `#${hash}` : ''}`;
};
const rewriteHtml = (s) =>
  s
    .replace(/\b(href|src|action)="(\/(?!\/)[^"]*)"/g, (_, a, v) => `${a}="${linkTo(v)}"`)
    .replace(/\bsrcset="([^"]+)"/g, (_, v) => `srcset="${v.split(',').map((p) => p.trim().replace(/^\/(?!\/)\S+/, (u) => `${BASE}${u}`)).join(', ')}"`)
    .replace(/(["'(])\/_astro\//g, `$1${BASE}/_astro/`)
    .replace('<body', `<body data-anteprima`)
    .replace('</body>', `${PREVIEW_UI}</body>`);

// Avviso + gestione dei moduli: i filtri singoli portano alle pagine pregenerate,
// il resto mostra un messaggio.
const PREVIEW_UI = `
<div role="note" style="position:fixed;inset:auto 0 0 0;z-index:60;background:#16130f;color:#f3eee3;font:12px/1.4 'IBM Plex Mono',monospace;padding:10px 16px;text-transform:uppercase;letter-spacing:.06em;display:flex;gap:12px;justify-content:space-between;align-items:center">
  <span>Anteprima statica · ricerca libera, filtri combinati e moduli sono attivi solo nella versione online</span>
  <button type="button" onclick="this.parentElement.remove()" style="border:1px solid #f3eee3;padding:2px 8px">Chiudi</button>
</div>
<script>
(() => {
  const BASE = ${JSON.stringify(BASE)};
  const FACETS = ${JSON.stringify(FACETS)};
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    e.preventDefault();
    if (form.method.toLowerCase() === 'get') {
      const data = [...new FormData(form)].filter(([, v]) => String(v).trim() !== '');
      if (data.length === 0) { location.href = BASE + '/cantine'; return; }
      if (data.length === 1 && FACETS.includes(data[0][0])) { location.href = BASE + '/cantine/filtro/' + data[0][0] + '-' + data[0][1]; return; }
    }
    alert('Anteprima statica: questa funzione (ricerca, filtri combinati, invio dei moduli) è attiva solo nella versione online del sito.');
  }, true);
})();
</script>`;

// --- Scrittura ---------------------------------------------------------------
const write = (file, data) => {
  const p = join(OUT, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
};
for (const [path, body] of html) write(path === '/404' ? '404.html' : fileFor(path), rewriteHtml(body));

// Asset: CSS e JS possono a loro volta riferirsi a /_astro/ (font, moduli).
const assetQueue = [...assets];
const seen = new Set();
while (assetQueue.length) {
  const a = assetQueue.shift();
  if (seen.has(a)) continue;
  seen.add(a);
  const res = await get(a);
  if (!res.ok) { console.warn(`! ${res.status} ${a}`); continue; }
  if (/\.(css|js)$/.test(a)) {
    let text = await res.text();
    for (const m of text.matchAll(/["'(]\/(_astro\/[^"')\s]+)/g)) assetQueue.push(`/${m[1]}`);
    text = text.replace(/(["'(])\/_astro\//g, `$1${BASE}/_astro/`);
    write(a.slice(1), text);
  } else {
    write(a.slice(1), Buffer.from(await res.arrayBuffer()));
  }
}
write('.nojekyll', '');
console.log(`Anteprima: ${html.size} pagine, ${seen.size} file statici → ${OUT}/ (base "${BASE || '/'}")`);
