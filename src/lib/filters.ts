// Filtri del catalogo: l'URL è l'unica fonte di verità (/cantine?provincia=AN&vitigno=verdicchio).
// Stessi nomi dei campi del <form method="get"> della FilterBar.

export interface CatalogFilters {
  q: string;
  provincia: string[];
  denominazione: string[];
  vitigno: string[];
  servizio: string[];
  page: number;
}

export const PAGE_SIZE = 24;
const SLUG = /^[a-z0-9-]{1,64}$/;
const PROVINCE = /^(AN|AP|FM|MC|PU)$/;

const list = (params: URLSearchParams, key: string, re: RegExp) =>
  [...new Set(params.getAll(key).flatMap((v) => v.split(',')).map((v) => v.trim()).filter((v) => re.test(v)))].slice(0, 20);

export function parseFilters(url: URL): CatalogFilters {
  const p = url.searchParams;
  const page = Number.parseInt(p.get('pagina') ?? '1', 10);
  return {
    q: (p.get('q') ?? '').trim().slice(0, 80),
    provincia: list(p, 'provincia', PROVINCE),
    denominazione: list(p, 'denominazione', SLUG),
    vitigno: list(p, 'vitigno', SLUG),
    servizio: list(p, 'servizio', SLUG),
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 100) : 1,
  };
}

export const activeFilterCount = (f: CatalogFilters) =>
  f.provincia.length + f.denominazione.length + f.vitigno.length + f.servizio.length + (f.q ? 1 : 0);

/** URL del catalogo con i filtri correnti e alcune modifiche (es. cambio pagina). */
export function catalogUrl(f: CatalogFilters, patch: Partial<CatalogFilters> = {}): string {
  const next = { ...f, ...patch };
  const p = new URLSearchParams();
  if (next.q) p.set('q', next.q);
  for (const key of ['provincia', 'denominazione', 'vitigno', 'servizio'] as const) {
    for (const v of next[key]) p.append(key, v);
  }
  if (next.page > 1) p.set('pagina', String(next.page));
  const qs = p.toString();
  return qs ? `/cantine?${qs}` : '/cantine';
}

/** Query FTS5 sicura: ogni parola diventa un prefisso tra virgolette ("verdicc"*). */
export function ftsQuery(q: string): string | null {
  const tokens = q
    .normalize('NFKC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2)
    .slice(0, 6);
  return tokens.length ? tokens.map((t) => `"${t}"*`).join(' ') : null;
}
