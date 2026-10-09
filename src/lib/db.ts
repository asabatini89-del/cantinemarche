// Accesso a D1. Query SQL esplicite e parametrizzate: lo schema è in db/migrations.
import { env } from 'cloudflare:workers';
import { type CatalogFilters, PAGE_SIZE, ftsQuery } from './filters';

const db = () => env.DB;

export interface WineryListItem {
  id: string;
  slug: string;
  name: string;
  municipality: string | null;
  province_code: string | null;
  province_name: string | null;
  territory_name: string | null;
  claim_status: string;
  rating_avg: number;
  rating_count: number;
  wine_count: number;
  denominations: string | null; // "Nome DOC|Nome DOCG"
  services: string | null; // "Degustazioni|Vendita diretta"
}

export interface Facet {
  value: string;
  label: string;
  group?: string;
  count: number;
}

/** WHERE condiviso tra lista e conteggio. */
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

export async function listWineries(f: CatalogFilters) {
  const w = where(f);
  const offset = (f.page - 1) * PAGE_SIZE;
  const [rows, total] = await db().batch([
    db()
      .prepare(
        `SELECT w.id, w.slug, w.name, w.municipality, w.province_code, p.name AS province_name,
                t.name AS territory_name, w.claim_status, w.rating_avg, w.rating_count,
                (SELECT COUNT(*) FROM wines v WHERE v.winery_id = w.id AND v.status = 'published') AS wine_count,
                (SELECT group_concat(d.name, '|') FROM winery_denominations wd
                   JOIN denominations d ON d.id = wd.denomination_id WHERE wd.winery_id = w.id) AS denominations,
                (SELECT group_concat(s.name, '|') FROM winery_services ws
                   JOIN services s ON s.id = ws.service_id WHERE ws.winery_id = w.id) AS services
         FROM wineries w
         LEFT JOIN provinces p ON p.code = w.province_code
         LEFT JOIN territories t ON t.id = w.territory_id
         WHERE ${w.sql}
         ORDER BY (w.plan = 'premium') DESC, wine_count > 0 DESC, w.name COLLATE NOCASE
         LIMIT ? OFFSET ?`,
      )
      .bind(...w.params, PAGE_SIZE, offset),
    db().prepare(`SELECT COUNT(*) AS n FROM wineries w WHERE ${w.sql}`).bind(...w.params),
  ]);
  return {
    items: rows.results as unknown as WineryListItem[],
    total: (total.results[0] as { n: number }).n,
  };
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
  const r = (x: D1Result) => x.results as unknown as Facet[];
  return { provincia: r(prov), denominazione: r(den), vitigno: r(grapes), servizio: r(services) };
}

export interface WineryDetail {
  id: string;
  slug: string;
  name: string;
  address_line: string | null;
  municipality: string | null;
  postal_code: string | null;
  province_code: string | null;
  province_name: string | null;
  territory_id: string | null;
  territory_name: string | null;
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
      `SELECT w.*, p.name AS province_name, t.name AS territory_name
       FROM wineries w
       LEFT JOIN provinces p ON p.code = w.province_code
       LEFT JOIN territories t ON t.id = w.territory_id
       WHERE w.slug = ? AND w.status = 'published'`,
    )
    .bind(slug)
    .first<WineryDetail>();
  if (!winery) return null;

  const [den, grapes, services, wines] = await db().batch([
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
      `SELECT id, name, external_url FROM wines WHERE winery_id = ? AND status = 'published' ORDER BY sort`,
    ).bind(winery.id),
  ]);
  type Named = { id: string; name: string };
  return {
    winery,
    denominations: den.results as unknown as (Named & { level: string })[],
    grapes: grapes.results as unknown as Named[],
    services: services.results as unknown as Named[],
    wines: wines.results as unknown as (Named & { external_url: string | null })[],
    sources: winery.sources_json ? (JSON.parse(winery.sources_json) as string[]) : [],
  };
}
