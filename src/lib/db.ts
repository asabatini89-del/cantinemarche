// Accesso a D1. Query SQL esplicite e parametrizzate: lo schema è in db/migrations.
import { env } from 'cloudflare:workers';
import { type CatalogFilters, PAGE_SIZE, ftsQuery } from './filters';

const db = () => env.DB;
const rows = <T>(r: D1Result) => r.results as unknown as T[];

/** Numero di catalogo stabile: posizione alfabetica tra le cantine pubblicate. */
const CATALOG_NO = `(SELECT COUNT(*) FROM wineries w2 WHERE w2.status = 'published'
                     AND (w2.name COLLATE NOCASE < w.name COLLATE NOCASE
                          OR (w2.name COLLATE NOCASE = w.name COLLATE NOCASE AND w2.id < w.id))) + 1`;

export interface WineryListItem {
  id: string;
  slug: string;
  name: string;
  num: number;
  municipality: string | null;
  province_code: string | null;
  province_name: string | null;
  territory_id: string | null;
  territory_name: string | null;
  claim_status: string;
  rating_avg: number;
  rating_count: number;
  wine_count: number;
  denominations: string | null; // "Nome DOC|Nome DOCG"
  services: string | null; // "Degustazioni|Vendita diretta"
  cover_thumb: string | null; // chiave R2 della foto di copertina (640 px)
}

export interface Facet {
  value: string;
  label: string;
  group?: string;
  count: number;
}

/** WHERE condiviso tra lista, conteggio e punti mappa. */
function where(f: CatalogFilters) {
  const clauses = ["w.status = 'published'"];
  const params: unknown[] = [];
  const inList = (values: string[]) => values.map(() => '?').join(', ');

  const fts = ftsQuery(f.q);
  if (fts) {
    clauses.push('w.rowid IN (SELECT rowid FROM wineries_fts WHERE wineries_fts MATCH ?)');
    params.push(fts);
  } else if (f.q) {
    clauses.push('0'); // testo senza parole ricercabili → nessun risultato
  }
  if (f.provincia.length) {
    clauses.push(`w.province_code IN (${inList(f.provincia)})`);
    params.push(...f.provincia);
  }
  if (f.denominazione.length) {
    clauses.push(`EXISTS (SELECT 1 FROM winery_denominations x WHERE x.winery_id = w.id AND x.denomination_id IN (${inList(f.denominazione)}))`);
    params.push(...f.denominazione);
  }
  if (f.vitigno.length) {
    clauses.push(`EXISTS (SELECT 1 FROM winery_grapes x WHERE x.winery_id = w.id AND x.grape_id IN (${inList(f.vitigno)}))`);
    params.push(...f.vitigno);
  }
  if (f.servizio.length) {
    clauses.push(`EXISTS (SELECT 1 FROM winery_services x WHERE x.winery_id = w.id AND x.service_id IN (${inList(f.servizio)}))`);
    params.push(...f.servizio);
  }
  return { sql: clauses.join(' AND '), params };
}

const LIST_COLUMNS = `w.id, w.slug, w.name, ${CATALOG_NO} AS num, w.municipality, w.province_code, p.name AS province_name,
  w.territory_id, t.name AS territory_name, w.claim_status, w.rating_avg, w.rating_count,
  (SELECT COUNT(*) FROM wines v WHERE v.winery_id = w.id AND v.status = 'published') AS wine_count,
  (SELECT group_concat(d.name, '|') FROM winery_denominations wd
     JOIN denominations d ON d.id = wd.denomination_id WHERE wd.winery_id = w.id) AS denominations,
  (SELECT group_concat(s.name, '|') FROM winery_services ws
     JOIN services s ON s.id = ws.service_id WHERE ws.winery_id = w.id) AS services,
  (SELECT COALESCE(m.thumb_key, m.r2_key) FROM media m WHERE m.id = w.cover_media_id) AS cover_thumb`;

export async function listWineries(f: CatalogFilters, pageSize = PAGE_SIZE) {
  const w = where(f);
  const offset = (f.page - 1) * pageSize;
  const [list, total] = await db().batch([
    db()
      .prepare(
        `SELECT ${LIST_COLUMNS}
         FROM wineries w
         LEFT JOIN provinces p ON p.code = w.province_code
         LEFT JOIN territories t ON t.id = w.territory_id
         WHERE ${w.sql}
         ORDER BY (w.plan = 'premium') DESC, w.name COLLATE NOCASE, w.id
         LIMIT ? OFFSET ?`,
      )
      .bind(...w.params, pageSize, offset),
    db().prepare(`SELECT COUNT(*) AS n FROM wineries w WHERE ${w.sql}`).bind(...w.params),
  ]);
  return { items: rows<WineryListItem>(list), total: rows<{ n: number }>(total)[0].n };
}

export interface MapPoint {
  slug: string;
  name: string;
  municipality: string | null;
  province_code: string | null;
  lat: number;
  lng: number;
}

/** Punti per la mappa (solo cantine con coordinate), con gli stessi filtri del catalogo. */
export async function mapPoints(f?: CatalogFilters) {
  const w = f ? where(f) : { sql: "w.status = 'published'", params: [] as unknown[] };
  const r = await db()
    .prepare(
      `SELECT w.slug, w.name, w.municipality, w.province_code, w.lat, w.lng
       FROM wineries w WHERE ${w.sql} AND w.lat IS NOT NULL ORDER BY w.lat DESC`,
    )
    .bind(...w.params)
    .all();
  return rows<MapPoint>(r);
}

export async function getStats() {
  const r = await db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM wineries WHERE status = 'published') AS wineries,
              (SELECT COUNT(*) FROM wines WHERE status = 'published') AS wines,
              (SELECT COUNT(*) FROM denominations) AS denominations,
              (SELECT COUNT(*) FROM territories) AS territories,
              (SELECT COUNT(DISTINCT municipality) FROM wineries WHERE status = 'published') AS municipalities`,
    )
    .first<{ wineries: number; wines: number; denominations: number; territories: number; municipalities: number }>();
  return r!;
}

/** Opzioni dei filtri con il numero di cantine pubblicate (solo valori presenti nei dati). */
export async function getFacets() {
  const [prov, den, grapes, services] = await db().batch([
    db().prepare(
      `SELECT p.code AS value, p.name AS label, COUNT(w.id) AS count
       FROM provinces p JOIN wineries w ON w.province_code = p.code AND w.status = 'published'
       GROUP BY p.code ORDER BY p.rowid`,
    ),
    db().prepare(
      `SELECT d.id AS value, d.name AS label, d.level AS "group", COUNT(*) AS count
       FROM denominations d JOIN winery_denominations wd ON wd.denomination_id = d.id
       JOIN wineries w ON w.id = wd.winery_id AND w.status = 'published'
       GROUP BY d.id ORDER BY CASE d.level WHEN 'DOCG' THEN 0 WHEN 'DOC' THEN 1 ELSE 2 END, d.name`,
    ),
    db().prepare(
      `SELECT g.id AS value, g.name AS label, COUNT(*) AS count
       FROM grape_varieties g JOIN winery_grapes wg ON wg.grape_id = g.id
       JOIN wineries w ON w.id = wg.winery_id AND w.status = 'published'
       GROUP BY g.id ORDER BY count DESC, g.name`,
    ),
    db().prepare(
      `SELECT s.id AS value, s.name AS label, COUNT(*) AS count
       FROM services s JOIN winery_services ws ON ws.service_id = s.id
       JOIN wineries w ON w.id = ws.winery_id AND w.status = 'published'
       GROUP BY s.id ORDER BY count DESC`,
    ),
  ]);
  return {
    provincia: rows<Facet>(prov),
    denominazione: rows<Facet>(den),
    vitigno: rows<Facet>(grapes),
    servizio: rows<Facet>(services),
  };
}

// ---------------------------------------------------------------------------
// Territori e denominazioni
// ---------------------------------------------------------------------------

export interface Territory {
  id: string;
  slug: string;
  name: string;
  intro: string | null;
  winery_count: number;
  denominations: string | null; // "id:Nome|id:Nome"
}

const TERRITORY_COLUMNS = `t.id, t.slug, t.name, t.intro,
  (SELECT COUNT(DISTINCT wd.winery_id) FROM denominations d
     JOIN winery_denominations wd ON wd.denomination_id = d.id
     JOIN wineries w ON w.id = wd.winery_id AND w.status = 'published'
   WHERE d.territory_id = t.id) AS winery_count,
  (SELECT group_concat(d.id || ':' || d.name, '|') FROM denominations d WHERE d.territory_id = t.id) AS denominations`;

export async function listTerritories() {
  const r = await db().prepare(`SELECT ${TERRITORY_COLUMNS} FROM territories t ORDER BY t.sort`).all();
  return rows<Territory>(r);
}

export async function getTerritory(slug: string) {
  return db().prepare(`SELECT ${TERRITORY_COLUMNS} FROM territories t WHERE t.slug = ?`).bind(slug).first<Territory>();
}

export interface Denomination {
  id: string;
  slug: string;
  name: string;
  level: 'DOCG' | 'DOC' | 'IGT';
  territory_id: string | null;
  territory_name: string | null;
  territory_slug: string | null;
  winery_count: number;
}

const DENOMINATION_COLUMNS = `d.id, d.slug, d.name, d.level, d.territory_id, t.name AS territory_name, t.slug AS territory_slug,
  (SELECT COUNT(*) FROM winery_denominations wd JOIN wineries w ON w.id = wd.winery_id AND w.status = 'published'
   WHERE wd.denomination_id = d.id) AS winery_count`;

export async function listDenominations() {
  const r = await db()
    .prepare(
      `SELECT ${DENOMINATION_COLUMNS} FROM denominations d LEFT JOIN territories t ON t.id = d.territory_id
       ORDER BY CASE d.level WHEN 'DOCG' THEN 0 WHEN 'DOC' THEN 1 ELSE 2 END, d.name`,
    )
    .all();
  return rows<Denomination>(r);
}

export async function getDenomination(slug: string) {
  return db()
    .prepare(`SELECT ${DENOMINATION_COLUMNS} FROM denominations d LEFT JOIN territories t ON t.id = d.territory_id WHERE d.slug = ?`)
    .bind(slug)
    .first<Denomination>();
}

// ---------------------------------------------------------------------------
// Scheda cantina
// ---------------------------------------------------------------------------

export interface WineryDetail {
  id: string;
  slug: string;
  name: string;
  num: number;
  address_line: string | null;
  municipality: string | null;
  postal_code: string | null;
  province_code: string | null;
  province_name: string | null;
  territory_id: string | null;
  territory_name: string | null;
  territory_slug: string | null;
  lat: number | null;
  lng: number | null;
  coordinate_status: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description_md: string | null;
  claim_status: string;
  sources_json: string | null;
  data_note: string | null;
  checked_at: string | null;
}

export async function getWinery(slug: string) {
  const winery = await db()
    .prepare(
      `SELECT w.*, ${CATALOG_NO} AS num, p.name AS province_name, t.name AS territory_name, t.slug AS territory_slug
       FROM wineries w
       LEFT JOIN provinces p ON p.code = w.province_code
       LEFT JOIN territories t ON t.id = w.territory_id
       WHERE w.slug = ? AND w.status = 'published'`,
    )
    .bind(slug)
    .first<WineryDetail>();
  if (!winery) return null;

  const [den, grapes, services, wines, photos, experiences] = await db().batch([
    db().prepare(
      `SELECT d.id, d.name, d.level FROM winery_denominations wd JOIN denominations d ON d.id = wd.denomination_id
       WHERE wd.winery_id = ? ORDER BY CASE d.level WHEN 'DOCG' THEN 0 WHEN 'DOC' THEN 1 ELSE 2 END, d.name`,
    ).bind(winery.id),
    db().prepare(
      `SELECT g.id, g.name FROM winery_grapes wg JOIN grape_varieties g ON g.id = wg.grape_id WHERE wg.winery_id = ? ORDER BY g.name`,
    ).bind(winery.id),
    db().prepare(
      `SELECT s.id, s.name FROM winery_services ws JOIN services s ON s.id = ws.service_id WHERE ws.winery_id = ? ORDER BY s.name`,
    ).bind(winery.id),
    db().prepare(
      `SELECT v.id, v.name, v.external_url,
              (SELECT m.r2_key FROM media m WHERE m.owner_type = 'wine' AND m.owner_id = v.id ORDER BY m.sort LIMIT 1) AS bottle_key
       FROM wines v WHERE v.winery_id = ? AND v.status = 'published' ORDER BY v.sort`,
    ).bind(winery.id),
    db().prepare(
      `SELECT id, r2_key, thumb_key, width, height, credit, source_page FROM media
       WHERE owner_type = 'winery' AND owner_id = ? ORDER BY sort LIMIT 4`,
    ).bind(winery.id),
    db().prepare(
      `SELECT id, slug, title, kind, description_md, duration_min, price_cents, external_url FROM experiences
       WHERE winery_id = ? AND status = 'published'
       ORDER BY CASE kind WHEN 'tasting' THEN 0 WHEN 'tour' THEN 1 WHEN 'meal' THEN 2 WHEN 'event' THEN 3 ELSE 4 END, sort`,
    ).bind(winery.id),
  ]);
  type Named = { id: string; name: string };
  return {
    winery,
    denominations: rows<Named & { level: string }>(den),
    grapes: rows<Named>(grapes),
    services: rows<Named>(services),
    wines: rows<Named & { external_url: string | null; bottle_key: string | null }>(wines),
    photos: rows<Photo>(photos),
    experiences: rows<Experience>(experiences),
    sources: winery.sources_json ? (JSON.parse(winery.sources_json) as string[]) : [],
  };
}

export interface Experience {
  id: string;
  slug: string;
  title: string;
  kind: 'tasting' | 'tour' | 'meal' | 'event' | 'stay';
  description_md: string | null;
  duration_min: number | null;
  price_cents: number | null;
  external_url: string | null;
}

export interface Photo {
  id: string;
  r2_key: string;
  thumb_key: string | null;
  width: number | null;
  height: number | null;
  credit: string | null;
  source_page: string | null;
}

/** Altre cantine nello stesso comune o, in mancanza, nella stessa provincia. */
export async function nearbyWineries(w: WineryDetail, limit = 3) {
  const r = await db()
    .prepare(
      `SELECT ${LIST_COLUMNS}
       FROM wineries w
       LEFT JOIN provinces p ON p.code = w.province_code
       LEFT JOIN territories t ON t.id = w.territory_id
       WHERE w.status = 'published' AND w.id != ? AND w.province_code = ?
       ORDER BY (w.municipality = ?) DESC, (w.territory_id IS ? ) DESC, w.name COLLATE NOCASE
       LIMIT ?`,
    )
    .bind(w.id, w.province_code, w.municipality, w.territory_id, limit)
    .all();
  return rows<WineryListItem>(r);
}

export async function allSlugs() {
  const [w, t, d] = await db().batch([
    db().prepare(`SELECT slug, updated_at FROM wineries WHERE status = 'published' ORDER BY slug`),
    db().prepare(`SELECT slug FROM territories ORDER BY sort`),
    db().prepare(`SELECT slug FROM denominations ORDER BY slug`),
  ]);
  return {
    wineries: rows<{ slug: string; updated_at: string }>(w),
    territories: rows<{ slug: string }>(t),
    denominations: rows<{ slug: string }>(d),
  };
}

export async function wineryIdBySlug(slug: string) {
  const r = await db().prepare(`SELECT id, name FROM wineries WHERE slug = ? AND status = 'published'`).bind(slug).first<{ id: string; name: string }>();
  return r ?? null;
}

export async function wineryOptions() {
  const r = await db().prepare(`SELECT slug, name FROM wineries WHERE status = 'published' ORDER BY name COLLATE NOCASE`).all();
  return rows<{ slug: string; name: string }>(r);
}

// ---------------------------------------------------------------------------
// Richieste dai form pubblici
// ---------------------------------------------------------------------------

export async function recentRequestsFrom(ipHash: string) {
  const r = await db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM contact_requests WHERE ip_hash = ?1 AND created_at > datetime('now', '-1 hour')) +
              (SELECT COUNT(*) FROM visit_requests WHERE ip_hash = ?1 AND created_at > datetime('now', '-1 hour')) AS n`,
    )
    .bind(ipHash)
    .first<{ n: number }>();
  return r?.n ?? 0;
}

export async function insertVisitRequest(v: {
  id: string; winery_id: string; experience_id: string | null; name: string; email: string; phone: string | null;
  preferred_date: string | null; guests: number; message: string | null; ip_hash: string;
}) {
  await db()
    .prepare(
      `INSERT INTO visit_requests (id, winery_id, experience_id, name, email, phone, preferred_date, guests, message, consent_at, ip_hash)
       VALUES (?, ?, (SELECT id FROM experiences WHERE id = ? AND winery_id = ? AND status = 'published'), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
    )
    .bind(v.id, v.winery_id, v.experience_id, v.winery_id, v.name, v.email, v.phone, v.preferred_date, v.guests, v.message, v.ip_hash)
    .run();
}

export async function insertContactRequest(c: {
  id: string; kind: 'claim' | 'info' | 'correction'; winery_id: string | null; winery_text: string | null;
  name: string; email: string; phone: string | null; role: string | null; message: string | null; ip_hash: string;
}) {
  await db()
    .prepare(
      `INSERT INTO contact_requests (id, kind, winery_id, winery_text, name, email, phone, role, message, consent_at, ip_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
    )
    .bind(c.id, c.kind, c.winery_id, c.winery_text, c.name, c.email, c.phone, c.role, c.message, c.ip_hash)
    .run();
}
