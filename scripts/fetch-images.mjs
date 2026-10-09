// Raccoglie le immagini dai siti ufficiali delle cantine e le prepara per R2.
//
//   node scripts/fetch-images.mjs [opzioni]
//
//   --source <dir>      export del portale (default data/export-2026-10-09)
//   --out <dir>         cartella di output (default media-out, ignorata da git)
//   --only a,b,c        solo queste cantine (slug)
//   --limit N           solo le prime N cantine con sito
//   --per-winery N      foto per cantina (default 4)
//   --no-bottles        salta le immagini delle bottiglie
//   --firecrawl         se l'HTML non contiene immagini usa Firecrawl (serve FIRECRAWL_API_KEY)
//   --concurrency N     siti in parallelo (default 4; una richiesta alla volta per sito)
//
// Output: <out>/wineries/<slug>/*.webp, <out>/wines/*.webp, <out>/manifest.json,
//         <out>/report.md e db/seed/0003_media.sql (generato dal manifest).
// Riprendibile: le cantine già nel manifest vengono saltate (usa --refresh per rifarle).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Opzioni
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);
const SRC = opt('source', 'data/export-2026-10-09');
const OUT = opt('out', 'media-out');
const ONLY = opt('only', '')?.split(',').filter(Boolean) ?? [];
const LIMIT = Number(opt('limit', '0')) || Infinity;
const PER_WINERY = Number(opt('per-winery', '4'));
const CONCURRENCY = Number(opt('concurrency', '4'));
const BOTTLES = !flag('no-bottles');
const FIRECRAWL = flag('firecrawl');
const REFRESH = flag('refresh');
const UA = 'CantineDelleMarcheBot/1.0 (+https://cantinedellemarche.com/per-le-cantine)';
const TIMEOUT_MS = 15000;
const MAX_BYTES = 15 * 1024 * 1024;

const wineries = JSON.parse(readFileSync(join(SRC, 'cantine.json'), 'utf8'));
const previews = JSON.parse(readFileSync(join(SRC, 'prodotti.json'), 'utf8'));
mkdirSync(join(OUT, 'wineries'), { recursive: true });
mkdirSync(join(OUT, 'wines'), { recursive: true });
const manifestPath = join(OUT, 'manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { items: [], log: {} };
const save = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

// ---------------------------------------------------------------------------
// Rete: timeout, una richiesta alla volta per host, pausa di cortesia
// ---------------------------------------------------------------------------
const hostQueues = new Map();
function politeFetch(url, init = {}) {
  const host = new URL(url).host;
  const prev = hostQueues.get(host) ?? Promise.resolve();
  const next = prev.then(async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, { redirect: 'follow', ...init, signal: ctrl.signal, headers: { 'User-Agent': UA, ...(init.headers ?? {}) } });
    } finally {
      clearTimeout(t);
      await new Promise((r) => setTimeout(r, 400));
    }
  });
  hostQueues.set(host, next.catch(() => {}));
  return next;
}

// robots.txt minimale: regole "Disallow" del gruppo "*" o del nostro bot.
const robotsCache = new Map();
async function allowedByRobots(url) {
  const u = new URL(url);
  if (!robotsCache.has(u.origin)) {
    let rules = [];
    try {
      const res = await politeFetch(`${u.origin}/robots.txt`);
      if (res.ok) {
        let applies = false;
        for (const raw of (await res.text()).split(/\r?\n/)) {
          const line = raw.replace(/#.*/, '').trim();
          const [k, ...rest] = line.split(':');
          const v = rest.join(':').trim();
          if (/^user-agent$/i.test(k)) applies = v === '*' || /cantinedellemarche/i.test(v);
          else if (applies && /^disallow$/i.test(k) && v) rules.push(v);
        }
      }
    } catch { /* robots irraggiungibile: nessuna regola */ }
    robotsCache.set(u.origin, rules);
  }
  return !robotsCache.get(u.origin).some((r) => u.pathname.startsWith(r.replace(/\*.*$/, '')));
}

// ---------------------------------------------------------------------------
// Estrazione candidati dall'HTML
// ---------------------------------------------------------------------------
const BAD = /logo|icon|favicon|sprite|placeholder|loader|spinner|flag|bandier|payment|pagament|paypal|visa|mastercard|cookie|whatsapp|facebook|instagram|twitter|youtube|tripadvisor|google|award|medagli|badge|marchio|certific|bollino|banner-ad|pixel|blank|transparent|avatar|gravatar|qr/i;
const GOOD = /vign|vineyard|cantin|winery|cellar|barrique|botti|vendemmi|harvest|uva|grape|hero|slide|header|cover|panoram|landscape|degust|tasting|sala/i;

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : null;
}
function largestFromSrcset(srcset) {
  let best = null;
  let bestW = 0;
  for (const part of srcset.split(',')) {
    const [u, d] = part.trim().split(/\s+/);
    const w = d?.endsWith('w') ? Number.parseInt(d, 10) : d?.endsWith('x') ? Number.parseFloat(d) * 1000 : 1;
    if (u && w >= bestW) { best = u; bestW = w; }
  }
  return best;
}

export function extractCandidates(html, pageUrl) {
  const found = new Map();
  const add = (raw, score) => {
    if (!raw || raw.startsWith('data:')) return;
    let url;
    try { url = new URL(raw.replace(/&amp;/g, '&'), pageUrl).href; } catch { return; }
    if (!/^https?:/.test(url)) return;
    const path = new URL(url).pathname.toLowerCase();
    if (/\.(svg|gif|ico)(\?|$)/.test(path)) return;
    if (BAD.test(path)) return;
    const s = score + (GOOD.test(path) ? 2 : 0) - found.size * 0.01; // a parità, vince chi viene prima
    found.set(url, Math.max(found.get(url) ?? -Infinity, s));
  };
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const p = (attr(tag, 'property') ?? attr(tag, 'name') ?? '').toLowerCase();
    if (p === 'og:image' || p === 'og:image:url' || p === 'twitter:image') add(attr(tag, 'content'), 5);
  }
  for (const tag of html.match(/<link\b[^>]*rel=["']?image_src[^>]*>/gi) ?? []) add(attr(tag, 'href'), 4);
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const alt = attr(tag, 'alt') ?? '';
    const cls = `${attr(tag, 'class') ?? ''} ${attr(tag, 'id') ?? ''}`;
    if (BAD.test(alt) || BAD.test(cls)) continue;
    const w = Number(attr(tag, 'width') ?? 0);
    if (w && w < 400) continue;
    const src = largestFromSrcset(attr(tag, 'srcset') ?? attr(tag, 'data-srcset') ?? '') ?? attr(tag, 'data-src') ?? attr(tag, 'data-lazy-src') ?? attr(tag, 'src');
    add(src, 1 + (w >= 1200 ? 1 : 0) + (GOOD.test(`${alt} ${cls}`) ? 1 : 0));
  }
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(m[1], 2);
  return [...found].sort((a, b) => b[1] - a[1]).map(([url]) => url);
}

async function pageHtml(url) {
  try {
    const res = await politeFetch(url);
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && type.includes('html')) return { html: await res.text(), finalUrl: res.url || url };
  } catch { /* prova Firecrawl */ }
  return null;
}

async function firecrawlHtml(url) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!FIRECRAWL || !key) return null;
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['rawHtml'], waitFor: 2000 }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.rawHtml ? { html: json.data.rawHtml, finalUrl: json.data.metadata?.sourceURL ?? url } : null;
}

// ---------------------------------------------------------------------------
// Download, controllo qualità, conversione
// ---------------------------------------------------------------------------
async function download(url) {
  if (!(await allowedByRobots(url))) throw new Error('robots');
  const res = await politeFetch(url, { headers: { Accept: 'image/avif,image/webp,image/*;q=0.8' } });
  if (!res.ok) throw new Error(`http ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (type && !type.startsWith('image/')) throw new Error(`tipo ${type}`);
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > MAX_BYTES) throw new Error('troppo grande');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('troppo grande');
  return buf;
}

/** Hash percettivo 8x8 (aHash) per scartare quasi-duplicati. */
async function aHash(buf) {
  const px = await sharp(buf).rotate().resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
  const avg = px.reduce((a, b) => a + b, 0) / px.length;
  return [...px].map((v) => (v >= avg ? '1' : '0')).join('');
}
const hamming = (a, b) => [...a].reduce((n, c, i) => n + (c !== b[i] ? 1 : 0), 0);

async function processPhoto(buf) {
  const img = sharp(buf, { failOn: 'error' }).rotate();
  const meta = await img.metadata();
  const w = meta.autoOrient?.width ?? meta.width ?? 0;
  const h = meta.autoOrient?.height ?? meta.height ?? 0;
  if (w < 800 || h < 500) throw new Error(`piccola ${w}x${h}`);
  const ratio = w / h;
  if (ratio < 0.6 || ratio > 2.6) throw new Error(`proporzioni ${ratio.toFixed(2)}`);
  const stats = await sharp(buf).stats();
  if (stats.entropy < 4) throw new Error('povera di dettagli'); // grafiche piatte, sfondi, testo
  const large = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
  const thumb = await sharp(buf).rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
  return { large, thumb, hash: await aHash(buf) };
}

async function processBottle(buf) {
  const meta = await sharp(buf).metadata();
  if ((meta.width ?? 0) < 150 || (meta.height ?? 0) < 200) throw new Error('piccola');
  return sharp(buf).rotate().resize({ width: 480, height: 720, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true });
}

const sha8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

// ---------------------------------------------------------------------------
// Per cantina
// ---------------------------------------------------------------------------
const normalizeSite = (u) => {
  const s = (u ?? '').trim();
  if (!s) return null;
  try { return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).href; } catch { return null; }
};

async function winery(w) {
  const site = normalizeSite(w.website);
  if (!site) return { status: 'senza sito' };
  if (!(await allowedByRobots(site))) return { status: 'vietato da robots.txt' };
  const page = (await pageHtml(site)) ?? (await firecrawlHtml(site));
  if (!page) return { status: 'sito non raggiungibile' };
  let candidates = extractCandidates(page.html, page.finalUrl);
  if (candidates.length === 0) {
    const fc = await firecrawlHtml(site);
    if (fc) candidates = extractCandidates(fc.html, fc.finalUrl);
  }
  if (candidates.length === 0) return { status: 'nessuna immagine nella pagina' };

  mkdirSync(join(OUT, 'wineries', w.id), { recursive: true });
  const kept = [];
  const reasons = [];
  for (const url of candidates.slice(0, 14)) {
    if (kept.length >= PER_WINERY) break;
    try {
      const p = await processPhoto(await download(url));
      if (kept.some((k) => hamming(k.hash, p.hash) <= 6)) { reasons.push('duplicato'); continue; }
      const base = `wineries/${w.id}/${kept.length + 1}-${sha8(p.large.data)}`;
      writeFileSync(join(OUT, `${base}.webp`), p.large.data);
      writeFileSync(join(OUT, `${base}-640.webp`), p.thumb.data);
      kept.push({
        hash: p.hash,
        item: {
          kind: 'photo', owner_type: 'winery', owner_id: w.id, winery_id: w.id, sort: kept.length,
          key: `${base}.webp`, thumb_key: `${base}-640.webp`,
          width: p.large.info.width, height: p.large.info.height,
          source_url: url, source_page: page.finalUrl, fetched_at: new Date().toISOString(),
        },
      });
    } catch (e) {
      reasons.push(e.message);
    }
  }
  manifest.items = manifest.items.filter((i) => !(i.owner_type === 'winery' && i.owner_id === w.id));
  manifest.items.push(...kept.map((k) => k.item));
  return { status: kept.length ? `${kept.length} foto` : 'nessuna foto adatta', discarded: reasons.slice(0, 6) };
}

// Id delle anteprime vini: stessa regola di scripts/build-seed.mjs (duplicati → id-cantina).
function wineIds() {
  const seen = new Set();
  return previews.map((p) => {
    const id = seen.has(p.id) ? `${p.id}-${p.wineryId}` : p.id;
    seen.add(p.id);
    return { ...p, rowId: id };
  });
}
const NON_WINE = /\bolio\b|grapp|appartament|apartment|liquor|\bamaro\b|\bbirra\b|confettur/i;

async function bottle(p) {
  if (!p.image || NON_WINE.test(`${p.category} ${p.name}`)) return 'saltata';
  if (manifest.items.some((i) => i.owner_type === 'wine' && i.owner_id === p.rowId) && !REFRESH) return 'già presente';
  try {
    const out = await processBottle(await download(new URL(p.image, p.url).href));
    const key = `wines/${p.rowId}-${sha8(out.data)}.webp`;
    writeFileSync(join(OUT, key), out.data);
    manifest.items.push({
      kind: 'bottle', owner_type: 'wine', owner_id: p.rowId, winery_id: p.wineryId, sort: 0,
      key, thumb_key: null, width: out.info.width, height: out.info.height,
      source_url: p.image, source_page: p.url, fetched_at: new Date().toISOString(),
    });
    return 'ok';
  } catch (e) {
    return e.message;
  }
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  }));
}

// ---------------------------------------------------------------------------
// Esecuzione
// ---------------------------------------------------------------------------
const todo = wineries
  .filter((w) => w.published && normalizeSite(w.website))
  .filter((w) => !ONLY.length || ONLY.includes(w.id))
  .filter((w) => REFRESH || ONLY.length || !manifest.log[w.id])
  .slice(0, LIMIT);

console.log(`Cantine da elaborare: ${todo.length}`);
let done = 0;
await pool(todo, CONCURRENCY, async (w) => {
  const r = await winery(w).catch((e) => ({ status: `errore: ${e.message}` }));
  manifest.log[w.id] = { ...r, at: new Date().toISOString() };
  done++;
  console.log(`[${done}/${todo.length}] ${w.id}: ${r.status}`);
  if (done % 10 === 0) save();
});
save();

if (BOTTLES) {
  const ids = new Set(todo.map((w) => w.id));
  const list = wineIds().filter((p) => ids.has(p.wineryId));
  const stats = {};
  console.log(`Bottiglie da elaborare: ${list.length}`);
  await pool(list, CONCURRENCY, async (p) => {
    const r = await bottle(p);
    stats[r] = (stats[r] ?? 0) + 1;
  });
  console.log('Bottiglie:', stats);
  save();
}

// ---------------------------------------------------------------------------
// SQL + report
// ---------------------------------------------------------------------------
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const sql = [
  '-- Immagini raccolte dai siti ufficiali delle cantine.',
  '-- Generato da scripts/fetch-images.mjs — NON modificare a mano. Idempotente.',
  '-- Le cantine e i vini assenti dal catalogo vengono ignorati (INSERT ... SELECT).',
  '',
  "DELETE FROM media WHERE source_url IS NOT NULL AND owner_type IN ('winery', 'wine');",
  ...manifest.items.map((i) => {
    const id = createHash('sha256').update(i.key).digest('hex').slice(0, 24);
    const table = i.owner_type === 'winery' ? 'wineries' : 'wines';
    return `INSERT INTO media (id, winery_id, owner_type, owner_id, r2_key, thumb_key, kind, width, height, sort, credit, source_url, source_page)
SELECT ${q(id)}, ${q(i.winery_id)}, ${q(i.owner_type)}, ${q(i.owner_id)}, ${q(i.key)}, ${q(i.thumb_key)}, ${q(i.kind)}, ${i.width}, ${i.height}, ${i.sort}, ${q(`Sito ufficiale · ${host(i.source_page)}`)}, ${q(i.source_url)}, ${q(i.source_page)}
WHERE EXISTS (SELECT 1 FROM ${table} WHERE id = ${q(i.owner_id)});`;
  }),
  '',
  `UPDATE wineries SET cover_media_id = (
  SELECT m.id FROM media m WHERE m.owner_type = 'winery' AND m.owner_id = wineries.id ORDER BY m.sort LIMIT 1);`,
  '',
];
mkdirSync('db/seed', { recursive: true });
writeFileSync('db/seed/0003_media.sql', sql.join('\n'));

const log = Object.entries(manifest.log);
const byStatus = {};
for (const [, r] of log) {
  const k = /^\d+ foto$/.test(r.status) ? 'con foto' : r.status.replace(/^errore:.*/, 'errore');
  byStatus[k] = (byStatus[k] ?? 0) + 1;
}
writeFileSync(join(OUT, 'report.md'), `# Raccolta immagini

Generato il ${new Date().toISOString()} da \`scripts/fetch-images.mjs\`.

| Esito | Cantine |
|---|---|
${Object.entries(byStatus).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

Foto di cantina: ${manifest.items.filter((i) => i.kind === 'photo').length} · bottiglie: ${manifest.items.filter((i) => i.kind === 'bottle').length}

## Dettaglio

| Cantina | Esito | Scarti |
|---|---|---|
${log.sort().map(([id, r]) => `| ${id} | ${r.status} | ${(r.discarded ?? []).join(', ')} |`).join('\n')}
`);
console.log(`Fatto. ${manifest.items.length} immagini nel manifest → db/seed/0003_media.sql, ${OUT}/report.md`);
