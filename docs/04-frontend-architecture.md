# 04 · Architettura frontend

Astro su Cloudflare Workers. Le pagine sono HTML generato sul server; l'interattività sta in isole Preact idratate solo dove serve. Le route riprendono quelle del portale attuale (`/cantine/[slug]`, `/territori/…`, `/denominazioni/…`, `/account`, `/gestione/[id]`, `/shop/[id]`, `/admin`), così i link e la SEO esistenti restano validi.

## Struttura del progetto

```
cantine-marche/
├─ astro.config.mjs              # output: 'server', adapter cloudflare, integrazioni preact/sitemap
├─ wrangler.jsonc                # binding: DB (D1), MEDIA (R2), CACHE (KV), QUEUE, IMAGES
├─ db/
│  ├─ migrations/0001_init.sql   # schema (questo repo)
│  └─ seed/                      # tassonomie + import delle 368 schede
├─ public/                       # favicon, manifest PWA, tiles/marche.pmtiles (o su R2)
└─ src/
   ├─ styles/global.css          # = ui/src/styles.css (token "Editorial Gastronomy")
   ├─ middleware.ts              # sessione, utente, ruolo, tenant → Astro.locals
   ├─ lib/
   │  ├─ db/schema.ts            # Drizzle (specchio di 0001_init.sql)
   │  ├─ db/queries/*.ts         # wineries.ts, filters.ts, orders.ts …
   │  ├─ auth.ts                 # Better Auth (magic link, OTP)
   │  ├─ filters.ts              # URLSearchParams ⇄ filtri tipizzati (zod)
   │  ├─ cache.ts                # chiavi KV, purge per cantina
   │  ├─ images.ts               # helper URL /cdn-cgi/image
   │  ├─ stripe.ts               # Connect, checkout, transfer
   │  └─ claims.ts               # VIES, OTP, verifica dominio email
   ├─ layouts/
   │  ├─ BaseLayout.astro        # <head> SEO, font, header, footer, bottom nav mobile
   │  ├─ DashboardLayout.astro   # area cantina (tab: Scheda · Orari · Vini · Esperienze · Ordini)
   │  └─ AdminLayout.astro
   ├─ components/
   │  ├─ ui/                     # Button, Chip, Badge, Input, Sheet, Tabs, Toast, EmptyState
   │  ├─ layout/                 # Header, MobileNav, Footer, Breadcrumb
   │  ├─ winery/                 # WineryCard ★, WineryHero, HoursTable, ServicesList,
   │  │                          # WineList, ExperienceCard, ReviewList, ClaimBanner
   │  ├─ discovery/              # FilterBar ★, ResultsGrid, Pagination, ViewToggle
   │  ├─ map/                    # MapView.tsx (isola), MarkerCallout.tsx, map-style.json
   │  ├─ account/                # FavoriteButton.tsx, ItineraryEditor.tsx
   │  ├─ dashboard/              # ProfileForm, HoursEditor, PhotoUploader.tsx, ProductForm
   │  └─ commerce/               # AddToCart.tsx, CartDrawer.tsx, SlotPicker.tsx, CheckoutForm.tsx
   └─ pages/
      ├─ index.astro                         # mappa + ricerca (home)
      ├─ cantine/index.astro                 # catalogo ?view=list|map + filtri da URL
      ├─ cantine/[slug].astro                # scheda cantina (SSR + cache edge)
      ├─ cantine/[slug]/rivendica.astro      # flusso claim (step 1-3)
      ├─ territori/index.astro · territori/[slug].astro
      ├─ denominazioni/index.astro · denominazioni/[slug].astro
      ├─ esperienze/[id].astro               # Fase 3
      ├─ carrello.astro · checkout.astro · ordine/[number].astro
      ├─ account/index.astro                 # preferiti, itinerari, ordini, profilo
      ├─ itinerari/[id].astro
      ├─ gestione/[wineryId]/[...tab].astro  # dashboard B2B (protetta per tenant)
      ├─ per-le-cantine.astro                # landing B2B
      ├─ admin/[...section].astro            # claim, cantine, contenuti, inserzioni
      ├─ api/
      │  ├─ markers.geojson.ts               # GeoJSON cacheato per la mappa
      │  ├─ favorites.ts · reviews.ts · visit-requests.ts
      │  ├─ claims/[action].ts               # start, verify-otp, upload
      │  ├─ cart.ts · checkout.ts
      │  └─ webhooks/stripe.ts               # → Queue
      ├─ sitemap.xml.ts · robots.txt.ts
      └─ 404.astro
```

## Strategia di rendering per vista

| Vista | Rendering | Cache | Isole (JS) |
|-------|-----------|-------|------------|
| Scheda cantina, territori, denominazioni | SSR | Edge `s-maxage=3600, stale-while-revalidate=86400`, purge al salvataggio della cantina | `FavoriteButton` (`client:idle`), mappa mini (`client:visible`) |
| Catalogo `/cantine?…` | SSR per URL | Edge 5 min per combinazione di filtri | `FilterBar` (progressive enhancement), `MapView` solo con `view=map` |
| Home (mappa) | SSR shell + isola | Shell cacheata | `MapView` (`client:visible`): MapLibre caricato lazy |
| Account, dashboard, checkout | SSR non cacheato (`private, no-store`) | – | Form con validazione client, `PhotoUploader`, `CartDrawer` |
| Admin | SSR, ruolo `admin` | – | Tabelle e azioni |

**SEO:** JSON-LD `Winery` / `LocalBusiness` (indirizzo, geo, orari, `aggregateRating`), `Product` + `Offer` nella Fase 3, `BreadcrumbList`. URL canonici per le combinazioni di filtri: solo le pagine di territorio e denominazione sono indicizzate, le altre combinazioni hanno `noindex,follow`. Le sitemap sono generate da D1.

## Pattern mobile-first / app-like

- **Bottom nav** su mobile (Mappa · Cantine · Preferiti · Account), con header compatto.
- **Sheet** per filtri, callout della mappa e carrello (Popover API / `<dialog>`). Nessuna libreria di modali.
- **View Transitions** di Astro tra lista e scheda, per una navigazione percepita come un'app.
- **PWA:** manifest e service worker leggero che mette in cache shell, ultime schede viste e tile della mappa già consultate (utile in zone rurali con poca copertura).
- **Azioni ottimistiche** (Preferiti, quantità nel carrello) con rollback e un toast.

## Sicurezza e multi-tenancy

- `middleware.ts` carica l'utente e le sue membership. Ogni route `/gestione/[wineryId]` e ogni API di scrittura chiama `requireMember(wineryId, role)` lato server.
- Tutte le query di scrittura B2B includono `WHERE winery_id = ?` preso dalla membership, mai dal body della richiesta.
- CSRF tramite Origin check (Astro `security.checkOrigin`), Turnstile sui form pubblici, rate limit con la binding Rate Limiting dei Workers.
