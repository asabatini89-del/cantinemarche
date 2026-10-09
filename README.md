# Cantine delle Marche

Piattaforma per il vino e l'enoturismo marchigiano: scoperta delle cantine (Fase 1), claim e dashboard per i produttori (Fase 2), marketplace multi-vendor e community (Fase 3).
Lo stack previsto è Astro + Cloudflare Workers + D1/R2/KV, con deploy continuo da GitHub.

## Contenuto del repository

| Percorso | Cosa contiene |
|----------|---------------|
| [`docs/01-user-journeys.md`](docs/01-user-journeys.md) | I tre flussi chiave: ricerca utente, riscatto cantina, acquisto multi-vendor |
| [`docs/02-stack.md`](docs/02-stack.md) | Stack consigliato, confronto D1/Supabase, CI/CD, budget di performance |
| [`docs/03-database.md`](docs/03-database.md) | Modello dati (ERD), decisioni, query tipo, logica di split dei pagamenti |
| [`docs/04-frontend-architecture.md`](docs/04-frontend-architecture.md) | Struttura dei file, route, strategia di rendering e cache, pattern mobile |
| [`db/migrations/0001_init.sql`](db/migrations/0001_init.sql) | Schema D1 eseguibile per tutte e tre le fasi |
| [`ui/`](ui/) | UI kit "Editorial Gastronomy": token Tailwind v4, snippet `WineryCard` e `FilterBar`, pagina di anteprima |

## Anteprima del UI kit

```bash
cd ui
npm install
npm run build        # genera dist/index.html + dist/styles.css
open dist/index.html # oppure: npx serve dist
```

Gli snippet in `ui/snippets/` sono la fonte da cui nasceranno i componenti Astro (`WineryCard.astro`, `FilterBar.astro`).

| Desktop | Mobile | Mobile · filtro aperto |
|---|---|---|
| ![Desktop](docs/img/ui-kit-desktop.png) | ![Mobile](docs/img/ui-kit-mobile.png) | ![Filtri](docs/img/ui-kit-mobile-filtri.png) |

*Screenshot generati con i font di fallback: Cormorant e Plus Jakarta Sans vengono caricati da Google Fonts nel browser.*

## Nota sul design

La direzione "Editorial Gastronomy" di questo kit (carta `#FBF9F5`, bordeaux `#5E1914`, Cormorant Garamond + Plus Jakarta Sans, solo hairline e nessuna ombra, angoli al massimo `rounded-md`) **è diversa dall'identità del portale attualmente pubblicato** (`#fef2ea` / `#31060a` con corallo, senape e oliva, DM Sans + Knewave, bottoni a pillola, ombre sfalsate, mappa SVG illustrata). Prima di procedere con i componenti va deciso se:
1. adottare il nuovo sistema ovunque (rebrand),
2. mantenere l'identità attuale e prendere dal kit solo struttura e pattern UX,
3. una via di mezzo, per esempio la mappa illustrata per la vista "territori" e la mappa vettoriale desaturata per la ricerca.
