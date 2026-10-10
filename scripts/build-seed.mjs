// Genera i seed SQL per D1 a partire dall'esportazione del portale attuale.
//
//   node scripts/build-seed.mjs [cartella-export]
//
// Input  : data/export-2026-10-09/{cantine,prodotti,territori,denominazioni}.json
//          data/vini-ricerca-2026-10-10.json (vini trovati con ricerca web, ognuno con URL di prova)
//          data/completamento-2026-10-10.json (vini mancanti, esperienze e servizi, ognuno con URL di prova)
// Output : db/seed/0001_taxonomies.sql, db/seed/0002_catalog.sql, data/import-report.md
//
// Lo script è deterministico: stesso input → stesso output (diff leggibili in git).
// Non inventa dati: normalizza formati, collega le tassonomie e segnala le anomalie.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2] ?? 'data/export-2026-10-09';
const read = (f) => JSON.parse(readFileSync(join(SRC, f), 'utf8'));

const wineries = read('cantine.json');
const previews = read('prodotti.json');
const territories = read('territori.json');
const denominations = read('denominazioni.json');
const manifest = read('manifest.json');

const report = { warnings: [], hidden: [], provinceFixes: [], provinceConflicts: [], unmapped: new Map(), sharedPreviews: new Map() };
const warn = (msg) => report.warnings.push(msg);

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------
const q = (v) => {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  return `'${String(v).replaceAll("'", "''")}'`;
};
const insert = (table, row) =>
  `INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(q).join(', ')});`;

const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'vino';

// ---------------------------------------------------------------------------
// Tassonomie
// ---------------------------------------------------------------------------
const PROVINCES = [
  { code: 'PU', name: 'Pesaro e Urbino', slug: 'pesaro-e-urbino' },
  { code: 'AN', name: 'Ancona', slug: 'ancona' },
  { code: 'MC', name: 'Macerata', slug: 'macerata' },
  { code: 'FM', name: 'Fermo', slug: 'fermo' },
  { code: 'AP', name: 'Ascoli Piceno', slug: 'ascoli-piceno' },
];
const provinceByName = new Map(PROVINCES.map((p) => [p.name.toLowerCase(), p.code]));

// Vitigni presenti nei dati del portale + quelli implicati dai disciplinari (≥ 85 %).
const GRAPES = [
  { id: 'verdicchio', name: 'Verdicchio', color: 'white' },
  { id: 'pecorino', name: 'Pecorino', color: 'white' },
  { id: 'passerina', name: 'Passerina', color: 'white' },
  { id: 'biancame', name: 'Biancame (Bianchello)', color: 'white' },
  { id: 'montepulciano', name: 'Montepulciano', color: 'red' },
  { id: 'sangiovese', name: 'Sangiovese', color: 'red' },
  { id: 'lacrima', name: 'Lacrima', color: 'red' },
  { id: 'vernaccia-nera', name: 'Vernaccia nera', color: 'red' },
];
const grapeByName = new Map(GRAPES.map((g) => [g.name.toLowerCase(), g.id]));

// Denominazioni il cui disciplinare impone un vitigno prevalente (min. 85 %):
// usate per alimentare il filtro "Vitigno" senza inventare dati di cantina.
const DENOMINATION_GRAPE = {
  'verdicchio-jesi': 'verdicchio',
  'castelli-di-jesi-verdicchio-riserva': 'verdicchio',
  'verdicchio-matelica': 'verdicchio',
  'verdicchio-matelica-riserva': 'verdicchio',
  lacrima: 'lacrima',
  'rosso-conero': 'montepulciano',
  conero: 'montepulciano',
  'vernaccia-serrapetrona': 'vernaccia-nera',
  serrapetrona: 'vernaccia-nera',
  bianchello: 'biancame',
};

// Servizi: le "esperienze" e i "servizi" del portale diventano un'unica tassonomia filtrabile.
const SERVICES = [
  { id: 'degustazioni', name: 'Degustazioni', from: ['Degustazione'] },
  { id: 'visita-guidata', name: 'Visita guidata', from: ['Visita guidata'] },
  { id: 'vendita-diretta', name: 'Vendita diretta', from: ['Vendita diretta'] },
  { id: 'ristorazione', name: 'Ristorazione', from: [] },
  { id: 'ospitalita', name: 'Ospitalità', from: [] },
];
const serviceByLabel = new Map(SERVICES.flatMap((s) => s.from.map((f) => [f.toLowerCase(), s.id])));

// Territorio di una denominazione: stesso criterio del portale (match sul vino
// del territorio) + due collegamenti geografici univoci.
const territoryByWine = new Map(territories.map((t) => [t.wine.toLowerCase(), t.id]));
const EXTRA_DENOMINATION_TERRITORY = { conero: 'conero', 'terre-offida': 'piceno' };

const denomRows = denominations.map((d) => {
  const level = d.name.match(/\b(DOCG|DOC|IGT)\b/)?.[1];
  if (!level) warn(`Denominazione senza livello riconoscibile: ${d.name}`);
  return {
    id: d.id,
    slug: d.id,
    name: d.name,
    level,
    territory_id: territoryByWine.get(d.match.toLowerCase()) ?? EXTRA_DENOMINATION_TERRITORY[d.id] ?? null,
    match: d.match,
  };
});

// Stringa del campo "wines" della cantina → denominazione (preferendo la DOC alla
// Riserva DOCG quando il testo è ambiguo) oppure vitigno.
const denomByMatch = new Map();
for (const d of denomRows) {
  const key = d.match.toLowerCase();
  const prev = denomByMatch.get(key);
  if (!prev || (/riserva/i.test(prev.name) && !/riserva/i.test(d.name))) denomByMatch.set(key, d);
}
const mapWine = (label) => {
  const key = label.trim().toLowerCase();
  const d = denomByMatch.get(key);
  if (d) return { denomination: d.id };
  const g = grapeByName.get(key);
  if (g) return { grape: g };
  return null;
};

// ---------------------------------------------------------------------------
// Normalizzazione cantine
// ---------------------------------------------------------------------------
const SMALL_WORDS = new Set(['di', 'del', 'della', 'dei', 'delle', 'de', 'e', 'in', 'sul', 'sulla', 'al', 'alla', 'a']);
const titleCaseIfShouting = (s) => {
  if (!s || s !== s.toUpperCase()) return s;
  return s.toLowerCase().split(/(\s+)/).map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
};

const CAP_PROVINCE = (cap) => {
  const n = Number(cap);
  if (n >= 60010 && n <= 60131) return 'AN';
  if (n >= 61010 && n <= 61122) return 'PU';
  if (n >= 62010 && n <= 62100) return 'MC';
  if (n === 63900 || (n >= 63811 && n <= 63858)) return 'FM';
  if (n >= 63031 && n <= 63100) return 'AP';
  return null;
};

const looksLikeAddress = (s) => /\d|^(via|v\.le|viale|loc\.|località|contrada|c\.da|fraz)/i.test(s);

function municipalityOf(w) {
  let city = (w.city ?? '').trim();
  if (city && !looksLikeAddress(city)) {
    city = city.replace(/\s*\(?\b(an|ap|mc|fm|pu)\b\)?\s*$/i, '').trim();
    return titleCaseIfShouting(city);
  }
  // Fallback: "60030 Maiolati Spontini (AN)" dentro l'indirizzo o la città.
  const m = `${w.city} ${w.address}`.match(/\b6[0-3]\d{3}\s+([A-Za-zÀ-ÿ'’ .-]+?)(?:\s*\(?\b(?:AN|AP|MC|FM|PU)\b\)?)?\s*(?:$|[·,|])/i);
  return m ? titleCaseIfShouting(m[1].trim()) : null;
}

const postalCodeOf = (w) => `${w.address} ${w.city}`.match(/\b(6[0-3]\d{3})\b/)?.[1] ?? null;
const cleanPhone = (p) => (p ?? '').replace(/^\s*(tel\.?\s*(e\s*fax)?|telefono|tel:)\s*/i, '').trim() || null;
// Sito web: si tiene solo il primo token (residui di HTML come ` target=`) e si scartano
// i segnaposto ("#") che sulla scheda diventerebbero link rotti.
const cleanWebsite = (u, id) => {
  const s = (u ?? '').trim().split(/\s+/)[0];
  if (!s) return null;
  const url = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    if (new URL(url).hostname.includes('.')) {
      if (s !== (u ?? '').trim()) warn(`\`${id}\`: sito ripulito da “${u.trim()}” a ${url}`);
      return url;
    }
  } catch {}
  warn(`\`${id}\`: sito non valido “${u.trim()}”, scartato`);
  return null;
};

// Righe senza alcun dato della cantina: nessun contatto, nessuna coordinata,
// nessun prodotto e nessun CAP nell'indirizzo (es. "Loader", "Iscriviti alla newsletter").
const isJunk = (w) =>
  !w.phone?.trim() && !w.email?.trim() && !w.website?.trim() &&
  w.lat === null && (w.productCount ?? 0) === 0 && !postalCodeOf(w);

// ---------------------------------------------------------------------------
// Costruzione righe
// ---------------------------------------------------------------------------
const out = { wineries: [], wd: [], wg: [], ws: [], wines: [] };
const denomGrapeLinks = new Set();

for (const w of wineries) {
  const status = isJunk(w) ? 'hidden' : (w.published ? 'published' : 'draft');
  if (status === 'hidden') report.hidden.push(w);

  let province = provinceByName.get((w.province ?? '').toLowerCase()) ?? null;
  const cap = postalCodeOf(w);
  if (!province && cap && status !== 'hidden') {
    province = CAP_PROVINCE(cap);
    report.provinceFixes.push({ id: w.id, name: w.name, cap, province, city: w.city, address: w.address });
  }
  const capProvince = cap ? CAP_PROVINCE(cap) : null;
  if (province && capProvince && capProvince !== province) {
    report.provinceConflicts.push({ id: w.id, name: w.name, province, capProvince, address: w.address });
  }

  const denoms = new Set();
  const grapes = new Set();
  for (const label of w.wines ?? []) {
    const m = mapWine(label);
    if (!m) { report.unmapped.set(label, (report.unmapped.get(label) ?? 0) + 1); continue; }
    if (m.denomination) denoms.add(m.denomination);
    if (m.grape) grapes.add(m.grape);
  }
  for (const d of denoms) {
    const g = DENOMINATION_GRAPE[d];
    if (g && !grapes.has(g)) { grapes.add(g); denomGrapeLinks.add(`${w.id}:${g}`); }
  }
  const services = new Set();
  for (const label of [...(w.experiences ?? []), ...(w.services ?? [])]) {
    const s = serviceByLabel.get(String(label).toLowerCase());
    if (s) services.add(s); else report.unmapped.set(`servizio: ${label}`, (report.unmapped.get(`servizio: ${label}`) ?? 0) + 1);
  }

  const terrs = new Set([...denoms].map((d) => denomRows.find((x) => x.id === d)?.territory_id).filter(Boolean));

  out.wineries.push({
    id: w.id,
    slug: w.id,
    name: w.name.trim(),
    address_line: w.address?.trim() || null,
    municipality: municipalityOf(w),
    postal_code: cap,
    province_code: province,
    territory_id: terrs.size === 1 ? [...terrs][0] : null,
    lat: w.lat,
    lng: w.lng,
    coordinate_status: w.coordinateStatus,
    coordinate_source: w.coordinateSourceType ?? null,
    alternate_addresses_json: w.alternateAddresses?.length ? JSON.stringify(w.alternateAddresses) : null,
    phone: cleanPhone(w.phone),
    email: w.email?.trim().toLowerCase() || null,
    website: cleanWebsite(w.website, w.id),
    description_md: w.description?.trim() || null,
    status,
    claim_status: 'unclaimed',
    data_source: 'import',
    sources_json: JSON.stringify(w.sources ?? []),
    data_note: status === 'hidden'
      ? 'Riga non valida generata dalla raccolta automatica (nessun dato della cantina): nascosta all\'import.'
      : (w.dataNote ?? null),
    checked_at: w.checkedAt ?? null,
    plan: w.premium ? 'premium' : 'free',
  });
  for (const d of [...denoms].sort()) out.wd.push({ winery_id: w.id, denomination_id: d });
  for (const g of [...grapes].sort()) out.wg.push({ winery_id: w.id, grape_id: g });
  for (const s of [...services].sort()) out.ws.push({ winery_id: w.id, service_id: s });
}

// Anteprime prodotto → tabella wines (schede editoriali con link al sito della cantina).
const NON_WINE = /\bolio\b|grapp|appartament|apartment|liquor|\bamaro\b|\bbirra\b|confettur/i;
const seenIds = new Set();
const slugsByWinery = new Map();
const sortByWinery = new Map();
for (const p of previews) {
  let id = p.id;
  if (seenIds.has(id)) {
    const first = previews.find((x) => x.id === p.id);
    const key = `${first.wineryId} ↔ ${p.wineryId}`;
    report.sharedPreviews.set(key, (report.sharedPreviews.get(key) ?? 0) + 1);
    id = `${p.id}-${p.wineryId}`;
  }
  seenIds.add(id);
  const used = slugsByWinery.get(p.wineryId) ?? new Set();
  let slug = slugify(p.name);
  for (let i = 2; used.has(slug); i++) slug = `${slugify(p.name)}-${i}`;
  used.add(slug); slugsByWinery.set(p.wineryId, used);
  const sort = sortByWinery.get(p.wineryId) ?? 0; sortByWinery.set(p.wineryId, sort + 1);
  const isWine = !NON_WINE.test(`${p.category} ${p.name}`);

  out.wines.push({
    id,
    winery_id: p.wineryId,
    slug,
    name: p.name.trim(),
    external_url: p.url || null,
    external_id: p.id,
    external_category: p.category || null,
    external_image_url: p.image || null,
    evidence_type: p.evidenceType || null,
    checked_at: p.checkedAt || null,
    source: 'import',
    status: isWine ? 'published' : 'draft',
    sort,
  });
}

// Vini trovati con la ricerca web per le cantine che l'export lasciava senza anteprime.
// Ogni voce ha un URL di prova (sito della cantina, enoteca, guida o consorzio) e
// viene importata solo se la cantina non ha già anteprime dal portale.
const RESEARCH = 'data/vini-ricerca-2026-10-10.json';
const research = existsSync(RESEARCH) ? JSON.parse(readFileSync(RESEARCH, 'utf8')) : null;
const researchStats = { wineries: 0, wines: 0, skipped: 0, byEvidence: new Map(), byStatus: new Map() };
if (research) {
  const known = new Set(wineries.map((w) => w.id));
  const covered = new Set(previews.map((p) => p.wineryId));
  for (const r of research.wineries) {
    researchStats.byStatus.set(r.status, (researchStats.byStatus.get(r.status) ?? 0) + 1);
    if (!known.has(r.id) || covered.has(r.id) || !r.wines?.length) continue;
    researchStats.wineries++;
    const used = new Set();
    r.wines.forEach((v, sort) => {
      if (!/^https?:\/\//.test(v.url ?? '') || !v.name?.trim()) { researchStats.skipped++; return; }
      let slug = slugify(v.name);
      for (let i = 2; used.has(slug); i++) slug = `${slugify(v.name)}-${i}`;
      used.add(slug);
      const isWine = !NON_WINE.test(v.name);
      researchStats.wines += isWine ? 1 : 0;
      researchStats.byEvidence.set(v.evidence, (researchStats.byEvidence.get(v.evidence) ?? 0) + 1);
      out.wines.push({
        id: `web-${r.id}-${slug}`,
        winery_id: r.id,
        slug,
        name: v.name.trim(),
        external_url: v.url,
        evidence_type: `websearch-${v.evidence ?? 'altro'}`,
        checked_at: research.checkedAt,
        source: 'import',
        status: isWine ? 'published' : 'draft',
        sort,
      });
    });
  }
}

// Completamento delle schede: vini che mancavano, esperienze (degustazioni, visite,
// pranzi, ospitalità) e servizi, ognuno con la pagina che lo documenta.
const COMPLETION = 'data/completamento-2026-10-10.json';
const completion = existsSync(COMPLETION) ? JSON.parse(readFileSync(COMPLETION, 'utf8')) : null;
const completionStats = { wineries: 0, wines: 0, duplicates: 0, experiences: 0, expWineries: new Set(), services: 0 };
out.experiences = [];
if (completion) {
  const known = new Set(wineries.filter((w) => !isJunk(w)).map((w) => w.id));
  const key = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(19|20)\d\d\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const wsKeys = new Set(out.ws.map((r) => `${r.winery_id}|${r.service_id}`));
  const addService = (wineryId, serviceId) => {
    if (!SERVICES.some((s) => s.id === serviceId) || wsKeys.has(`${wineryId}|${serviceId}`)) return;
    wsKeys.add(`${wineryId}|${serviceId}`);
    out.ws.push({ winery_id: wineryId, service_id: serviceId });
    completionStats.services++;
  };
  const SERVICE_BY_KIND = { tasting: 'degustazioni', tour: 'visita-guidata', meal: 'ristorazione', stay: 'ospitalita' };
  for (const r of completion.wineries) {
    if (!known.has(r.id)) continue;
    const mine = out.wines.filter((v) => v.winery_id === r.id);
    const names = mine.map((v) => key(v.name));
    const slugs = new Set(mine.map((v) => v.slug));
    let sort = mine.length;
    let added = 0;
    for (const v of r.wines_added ?? []) {
      if (!/^https?:\/\//.test(v.url ?? '') || !v.name?.trim() || NON_WINE.test(v.name)) continue;
      const k = key(v.name);
      // Stesso vino già in catalogo, anche scritto in modo un po' diverso (con o senza denominazione).
      if (names.some((n) => n === k || (Math.min(n.length, k.length) > 5 && (n.includes(k) || k.includes(n))))) {
        completionStats.duplicates++;
        continue;
      }
      names.push(k);
      let slug = slugify(v.name);
      for (let i = 2; slugs.has(slug); i++) slug = `${slugify(v.name)}-${i}`;
      slugs.add(slug);
      out.wines.push({
        id: `cmp-${r.id}-${slug}`, winery_id: r.id, slug, name: v.name.trim(), external_url: v.url,
        evidence_type: `websearch-${v.evidence ?? 'altro'}`, checked_at: completion.checkedAt,
        source: 'import', status: 'published', sort: sort++,
      });
      added++;
    }
    completionStats.wines += added;
    if (added) completionStats.wineries++;
    const expSlugs = new Set();
    (r.experiences ?? []).forEach((e, i) => {
      if (!/^https?:\/\//.test(e.url ?? '') || !e.title?.trim()) return;
      const kind = ['tasting', 'tour', 'meal', 'event', 'stay'].includes(e.kind) ? e.kind : 'tasting';
      let slug = slugify(e.title);
      for (let j = 2; expSlugs.has(slug); j++) slug = `${slugify(e.title)}-${j}`;
      expSlugs.add(slug);
      const price = Number(e.price_eur);
      const minutes = Number(e.duration_min);
      out.experiences.push({
        id: `exp-${r.id}-${slug}`, winery_id: r.id, slug, title: e.title.trim(), kind,
        description_md: e.description?.trim() || null,
        duration_min: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : null,
        price_cents: Number.isFinite(price) && price > 0 ? Math.round(price * 100) : null,
        external_url: e.url, source: 'import', checked_at: completion.checkedAt, status: 'published', sort: i,
      });
      completionStats.experiences++;
      completionStats.expWineries.add(r.id);
      if (SERVICE_BY_KIND[kind]) addService(r.id, SERVICE_BY_KIND[kind]);
    });
    for (const sv of r.services ?? []) if (/^https?:\/\//.test(sv.url ?? '')) addService(r.id, sv.id);
  }
}

// Correzioni puntuali emerse dai controlli: voci che non sono vini restano in bozza.
const JUNK_WINE = /^punti vendita|:\s*$/i;
const NOT_WINE = new Set(['la-lepre-e-la-luna|Selva']); // infuso di visciole, non un vino
for (const v of out.wines) {
  if (v.status === 'published' && (JUNK_WINE.test(v.name.trim()) || NOT_WINE.has(`${v.winery_id}|${v.name.trim()}`))) {
    v.status = 'draft';
    warn(`\`${v.winery_id}\`: “${v.name}” messo in bozza (non è un vino)`);
  }
}

// ---------------------------------------------------------------------------
// Scrittura SQL
// ---------------------------------------------------------------------------
const header = (title) => [
  `-- ${title}`,
  `-- Generato da scripts/build-seed.mjs — NON modificare a mano.`,
  `-- Fonte: ${manifest.site} · versione ${manifest.siteVersion} · commit ${manifest.sourceCommit} · esportato ${manifest.exportedAt}`,
  '',
];

const tax = [
  ...header('Tassonomie: province, territori, denominazioni, vitigni, servizi'),
  ...PROVINCES.map((p) => insert('provinces', p)),
  '',
  ...territories.map((t, i) => insert('territories', { id: t.id, slug: t.id, name: t.name, intro: t.text, sort: i })),
  '',
  ...denomRows.map(({ match, ...d }) => insert('denominations', d)),
  '',
  ...GRAPES.map((g) => insert('grape_varieties', { id: g.id, slug: g.id, name: g.name, color: g.color })),
  '',
  ...SERVICES.map((s) => insert('services', { id: s.id, slug: s.id, name: s.name })),
  '',
];

const catalog = [
  ...header('Catalogo: cantine, relazioni per i filtri, anteprime vini, indice di ricerca'),
  ...out.wineries.map((r) => insert('wineries', r)),
  '',
  ...out.wd.map((r) => insert('winery_denominations', r)),
  ...out.wg.map((r) => insert('winery_grapes', r)),
  ...out.ws.map((r) => insert('winery_services', r)),
  '',
  ...out.wines.map((r) => insert('wines', r)),
  '',
  ...out.experiences.map((r) => insert('experiences', r)),
  '',
  '-- Indice full-text: nome, comune, territorio e parole chiave (denominazioni + vini).',
  `INSERT INTO wineries_fts (rowid, name, municipality, tagline, keywords)
SELECT w.rowid, w.name, COALESCE(w.municipality, ''), COALESCE(t.name, ''),
       COALESCE((SELECT group_concat(d.name, ' ') FROM winery_denominations wd JOIN denominations d ON d.id = wd.denomination_id WHERE wd.winery_id = w.id), '') || ' ' ||
       COALESCE((SELECT group_concat(g.name, ' ') FROM winery_grapes wg JOIN grape_varieties g ON g.id = wg.grape_id WHERE wg.winery_id = w.id), '') || ' ' ||
       COALESCE((SELECT group_concat(v.name, ' ') FROM wines v WHERE v.winery_id = w.id AND v.status = 'published'), '')
FROM wineries w LEFT JOIN territories t ON t.id = w.territory_id
WHERE w.status = 'published';`,
  '',
];

mkdirSync('db/seed', { recursive: true });
writeFileSync('db/seed/0001_taxonomies.sql', tax.join('\n'));
writeFileSync('db/seed/0002_catalog.sql', catalog.join('\n'));

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pub = out.wineries.filter((w) => w.status === 'published');
const count = (f) => pub.filter(f).length;
const byProvince = PROVINCES.map((p) => `| ${p.name} | ${count((w) => w.province_code === p.code)} |`);
const coordStats = ['approximate', 'osm', 'verified', 'missing'].map((s) => `| ${s} | ${count((w) => w.coordinate_status === s)} |`);
const winesPublished = out.wines.filter((w) => w.status === 'published').length;
const winesByWinery = new Set(out.wines.filter((w) => w.status === 'published').map((w) => w.winery_id));
const researchNote = new Map((research?.wineries ?? []).map((r) => [r.id, `${r.status}${r.note ? `: ${r.note}` : ''}`]));

const md = `# Report di importazione

Fonte: \`${SRC}\` — ${manifest.site} (versione ${manifest.siteVersion}, commit \`${manifest.sourceCommit.slice(0, 7)}\`), esportato il ${manifest.exportedAt}.
Generato da \`scripts/build-seed.mjs\`.

## Riepilogo

| | Valore |
|---|---|
| Cantine nell'export | ${wineries.length} |
| Cantine pubblicate dopo l'import | ${pub.length} |
| Righe nascoste (non sono cantine) | ${report.hidden.length} |
| Cantine con coordinate | ${count((w) => w.lat !== null)} |
| Cantine senza coordinate (scheda visibile, niente mappa) | ${count((w) => w.lat === null)} |
| Cantine con almeno una denominazione | ${new Set(out.wd.map((r) => r.winery_id)).size} |
| Cantine con territorio univoco | ${count((w) => w.territory_id)} |
| Cantine con servizi (degustazioni, visite, vendita) | ${new Set(out.ws.map((r) => r.winery_id)).size} |
| Vini importati | ${out.wines.length} (${winesPublished} pubblicati, ${out.wines.length - winesPublished} in bozza perché non sono vini) |
| — di cui anteprime dal portale | ${out.wines.filter((w) => !/^(web|cmp)-/.test(w.id)).length} |
| — di cui da ricerca web, con URL di prova | ${researchStats.wines} su ${researchStats.wineries} cantine (${[...researchStats.byEvidence].map(([k, n]) => `${k}: ${n}`).join(', ') || '—'}) |
| — di cui dal completamento delle schede | ${completionStats.wines} su ${completionStats.wineries} cantine (${completionStats.duplicates} doppioni scartati) |
| Cantine pubblicate con almeno un vino | ${winesByWinery.size} su ${pub.length} |
| Esperienze (degustazioni, visite, pranzi, ospitalità) | ${completionStats.experiences} su ${completionStats.expWineries.size} cantine |
| Servizi aggiunti dal completamento | ${completionStats.services} |
| Anteprime con immagine sul sito della cantina | ${out.wines.filter((w) => w.external_image_url).length} (URL conservato, **non** mostrato: vedi sotto) |

### Cantine per provincia

| Provincia | Cantine |
|---|---|
${byProvince.join('\n')}
| _non determinata_ | ${count((w) => !w.province_code)} |

### Qualità delle coordinate

| Stato | Cantine |
|---|---|
${coordStats.join('\n')}

## Da verificare

### 1. Righe nascoste: non sono cantine
Sono pubblicate nel portale attuale ma sono artefatti della raccolta automatica (testi di pagine web). Importate con \`status = 'hidden'\`.
${report.hidden.map((w) => `- \`${w.id}\` — “${w.name}” (fonti: ${w.sources.join(', ')})`).join('\n')}

### 2. Provincia ricavata dal CAP
Nel dato originale la provincia è vuota.
${report.provinceFixes.map((f) => `- \`${f.id}\` ${f.name}: CAP ${f.cap} → **${f.province}** (indirizzo: “${f.address}”, città: “${f.city}”)`).join('\n') || '- nessuna'}

### 3. Provincia in conflitto con il CAP dell'indirizzo
${report.provinceConflicts.map((c) => `- \`${c.id}\` ${c.name}: provincia ${c.province}, CAP indirizzo → ${c.capProvince} (“${c.address}”)`).join('\n') || '- nessuno'}

### 4. Anteprime condivise tra due schede (possibili cantine duplicate)
${[...report.sharedPreviews].map(([k, n]) => `- ${k}: ${n} anteprime con lo stesso URL — importate su entrambe con id distinti`).join('\n') || '- nessuna'}

### 5. Valori non mappati
${[...report.unmapped].map(([k, n]) => `- “${k}” (${n})`).join('\n') || '- nessuno'}

### 6. Avvisi
${report.warnings.map((w) => `- ${w}`).join('\n') || '- nessuno'}

### 7. Cantine ancora senza vini
${pub.length - winesByWinery.size} cantine pubblicate non hanno vini con una fonte verificabile. Esito della ricerca web (${research?.checkedAt ?? 'non eseguita'}): ${[...researchStats.byStatus].map(([k, n]) => `${k} ${n}`).join(', ') || '—'}. Le schede invitano la cantina ad aggiungerli.
${pub.filter((w) => !winesByWinery.has(w.id)).map((w) => `- \`${w.id}\` ${w.name} — ${researchNote.get(w.id) ?? 'ricerca web non ancora eseguita'}`).join('\n') || '- nessuna'}

## Regole applicate

- **Identificativi:** \`wineries.id\` = \`slug\` = id del portale attuale, quindi gli URL \`/cantine/<id>\` restano invariati.
- **Denominazioni:** il campo \`wines\` della cantina è collegato alle denominazioni tramite il campo \`match\` dell'export. Se il testo è ambiguo (es. “Verdicchio dei Castelli di Jesi”) si sceglie la DOC, non la Riserva DOCG. Le voci che sono vitigni (Passerina, Pecorino, Verdicchio, Lacrima) vanno in \`winery_grapes\`.
- **Vitigni derivati:** per le denominazioni con vitigno prevalente da disciplinare (Verdicchio, Lacrima, Rosso Conero/Conero, Vernaccia/Serrapetrona, Bianchello) il vitigno viene aggiunto al filtro. Collegamenti derivati: ${denomGrapeLinks.size}.
- **Territori:** una denominazione appartiene a un territorio se il suo \`match\` coincide con il vino del territorio (stessa logica del portale), più Conero DOCG → Riviera del Conero e Terre di Offida → Offida e il Piceno. \`wineries.territory_id\` è valorizzato solo quando il territorio è univoco. Le pagine territorio interrogano comunque le denominazioni.
- **Servizi:** le esperienze “Degustazione” e “Visita guidata” e il servizio “Vendita diretta” diventano i servizi \`degustazioni\`, \`visita-guidata\`, \`vendita-diretta\`.
- **Contatti:** prefissi “Tel.”/“Tel. e Fax” rimossi, email in minuscolo, \`https://\` aggiunto ai siti senza schema. Indirizzi originali conservati in \`address_line\`.
- **Comune:** ricavato dal campo città (senza sigla provincia, maiuscolo → iniziali maiuscole) oppure dal CAP nell'indirizzo. È un valore *best effort*, da rifinire in dashboard.
- **Provenienza:** fonti (\`sources_json\`), nota redazionale (\`data_note\`), data di verifica e stato delle coordinate sono conservati per ogni cantina.
- **Anteprime vini ≠ shop:** le 1.494 anteprime osservate sui siti delle cantine sono schede editoriali (\`wines\`, \`source = 'import'\`) con link al sito. Non diventano prodotti vendibili, e prezzi e disponibilità non vengono dedotti. Olio, grappe, confetture, birre e appartamenti restano in bozza.
- **Vini da ricerca web:** per le cantine senza anteprime nell'export, i vini vengono da \`data/vini-ricerca-2026-10-10.json\` (\`source = 'import'\`, \`evidence_type = websearch-…\`). Ogni vino ha l'URL della pagina che lo collega alla cantina (sito della cantina, enoteca, guida o consorzio); niente URL costruiti, niente tipologie dedotte. Scartati alla revisione: prove che non nominano la cantina, pagine di comparazione prezzi, bevande aromatizzate che per legge non sono vino (Fragolino).
- **Immagini:** gli URL delle foto dei siti delle cantine sono conservati in \`external_image_url\` ma non vanno mostrati né copiati su R2 senza il consenso della cantina (coerente con \`LICENSE-coordinates.md\`: nessuna fotografia proprietaria ripubblicata).
`;
writeFileSync('data/import-report.md', md);

console.log(`wineries ${out.wineries.length} (published ${pub.length}, hidden ${report.hidden.length}) · wines ${out.wines.length} · denominations links ${out.wd.length} · grapes links ${out.wg.length} · services links ${out.ws.length}`);
