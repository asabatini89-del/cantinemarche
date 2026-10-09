# 02 · Stack tecnologico consigliato

**In breve:** Astro (SSR + isole) su **Cloudflare Workers**, **D1** come database, **R2** per i media, **KV** per la cache, **Better Auth** per l'autenticazione, **Stripe Connect** per il marketplace, **MapLibre + PMTiles** per la mappa. Tutto è versionato su GitHub con deploy automatico a ogni push.

## Scelte

| Livello | Scelta | Perché |
|---------|--------|--------|
| Framework | **Astro 7** + `@astrojs/cloudflare` | HTML server-rendered di default (SEO, LCP rapido) e JavaScript solo nelle "isole" interattive (mappa, filtri, carrello). Le pagine di contenuto (368 schede, territori, denominazioni) restano leggerissime. Astro è sviluppato sotto Cloudflare, quindi l'integrazione con Workers e i binding è di prima classe. |
| Isole UI | **Preact** (+ `@preact/signals`) | API React a circa 4 KB. Basta per mappa, carrello, dashboard. |
| Stile | **Tailwind CSS v4** con token in `@theme` | Design system "Editorial Gastronomy" in un solo file (`ui/src/styles.css`). |
| Runtime | **Cloudflare Workers** (static assets + SSR) | È il target consigliato da Cloudflare per i nuovi progetti (Pages è in convergenza su Workers). Asset statici serviti gratis dall'edge, SSR vicino all'utente. |
| Database | **Cloudflare D1** (SQLite) + **Drizzle ORM** | Il portale attuale usa già D1 (vedi "Catalogo indisponibile" nella documentazione), quindi nessuna migrazione dati. Latenza bassa dal Worker, read replication globale, FTS5 per la ricerca, costo quasi nullo a questi volumi. Drizzle dà tipi TypeScript e migrazioni SQL versionate. |
| File | **R2** + **Cloudflare Images** (trasformazioni via `/cdn-cgi/image/`) | Foto caricate dalle cantine, ridimensionate e convertite in AVIF/WebP al volo. Documenti di verifica claim in un bucket privato separato. |
| Cache | **KV** + Cache API | Tassonomie, GeoJSON dei marker, pagine SSR (`stale-while-revalidate`). Purge mirato quando una cantina salva modifiche. |
| Auth | **Better Auth** (adapter D1/Drizzle) | Magic link + OTP email, sessioni su D1, ruoli. Nessun servizio esterno da pagare, dati in casa (GDPR). |
| Email | **Resend** (o Cloudflare Email Service) | Magic link, notifiche ordini e claim. |
| Code async | **Cloudflare Queues** | Email, webhook Stripe, ricalcolo indici e purge della cache fuori dal percorso della richiesta. |
| Pagamenti | **Stripe Connect** (account Express, *separate charges & transfers*) | Un addebito al cliente, poi un transfer per cantina con commissione. Stripe gestisce KYC e onboarding delle cantine (le esonera dal farlo noi). |
| Mappa | **MapLibre GL JS** + tile vettoriali **Protomaps (PMTiles) su R2** | Stile desaturato beige/grigio completamente personalizzabile, nessun costo per tile, nessuna API key. Marker `accent-wine` con clustering. In alternativa si può tenere la mappa SVG illustrata attuale come "vista territori". |
| Anti-spam | **Turnstile** | Su richiesta visita, contatti, claim, recensioni. |
| Osservabilità | Workers Logs + Sentry (SDK Cloudflare) | Errori lato server e lato client. |
| Analytics | Cloudflare Web Analytics | Cookieless, nessun banner necessario per questa parte. |

## D1 o Supabase?

| | **D1** (consigliato) | Supabase |
|---|---|---|
| Latenza dal Worker | Stessa rete, binding diretto | Chiamata HTTP verso una region (EU) |
| Geo | `lat`/`lng` indicizzati + bounding box: più che sufficiente per circa 400–2.000 cantine | PostGIS (più potente, qui non necessario) |
| Ricerca | FTS5 | `tsvector` / pg_trgm |
| Auth / RLS | Nell'app (Better Auth + middleware per tenant) | Integrate (RLS) |
| Realtime | Non nativo (Durable Objects se mai servirà) | Integrato |
| Costi / lock-in | Inclusi nel piano Workers, SQLite portabile | Piano a pagamento per la produzione |
| Coerenza con l'esistente | Già in uso | Richiede la migrazione |

Si rivaluta Supabase (o Hyperdrive verso un Postgres) solo se arrivano query geospaziali complesse (isocrone, percorsi) o carichi di scrittura molto alti. Lo schema SQL è scritto in modo portabile.

## Ambienti e CI/CD

```
GitHub ──push──► GitHub Actions
                 ├─ lint · typecheck · test (Vitest + @cloudflare/vitest-pool-workers)
                 ├─ wrangler d1 migrations apply (staging)
                 ├─ deploy preview per ogni PR  (URL *.workers.dev)
                 └─ main ► deploy produzione + migrations apply (produzione)
```

- Tre ambienti in `wrangler.jsonc`: `dev` (locale con Miniflare), `staging`, `production`. Ognuno ha un database D1 e bucket R2 separati.
- Segreti (`STRIPE_SECRET_KEY`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`) con `wrangler secret put` o dal pannello Cloudflare, mai nel repository.
- Migrazioni solo additive in produzione. Backup con D1 Time Travel (ripristino puntuale fino a 30 giorni).

## Budget di performance (mobile, 4G)

- LCP < 1,8 s sulle schede cantina, JS iniziale < 50 KB gzip sulle pagine di contenuto.
- La mappa si carica lazy (`client:visible`). Il GeoJSON dei marker è prerenderizzato e cacheato (circa 30 KB per 368 punti).
- Font self-hosted (`@fontsource-variable`), solo i subset latin, con `font-display: swap`.
