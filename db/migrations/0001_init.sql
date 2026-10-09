-- =============================================================================
-- Cantine delle Marche — schema iniziale (Cloudflare D1 / SQLite)
-- Copre Fase 1 (discovery), Fase 2 (claim + dashboard), Fase 3 (marketplace).
-- Convenzioni:
--   * id TEXT (UUID v7 / nanoid generati dall'app) per evitare ID enumerabili
--   * importi in centesimi (INTEGER), valuta EUR
--   * date ISO-8601 TEXT in UTC (default CURRENT_TIMESTAMP)
--   * enum come TEXT + CHECK
-- =============================================================================

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. TASSONOMIE (dati di riferimento, cambiano raramente → cache in KV)
-- -----------------------------------------------------------------------------

CREATE TABLE provinces (
  code        TEXT PRIMARY KEY,              -- 'PU','AN','MC','FM','AP'
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE
);

CREATE TABLE territories (                   -- 'Castelli di Jesi', 'Riviera del Conero', ...
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  intro       TEXT,
  body_md     TEXT,
  sort        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE denominations (                 -- DOCG / DOC / IGT
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  level        TEXT NOT NULL CHECK (level IN ('DOCG','DOC','IGT')),
  territory_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
  description  TEXT
);

CREATE TABLE grape_varieties (               -- Verdicchio, Montepulciano, Lacrima, Pecorino...
  id    TEXT PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('white','red','rose'))
);

CREATE TABLE services (                      -- degustazione, visita vigneto, ristorazione, alloggio, vendita diretta, pet friendly...
  id    TEXT PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  icon  TEXT
);

-- -----------------------------------------------------------------------------
-- 2. UTENTI & AUTH
-- Le tabelle session/account/verification sono gestite dalla libreria di auth
-- (Better Auth) e generate dalla sua CLI: qui c'è solo il profilo applicativo.
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  name            TEXT,
  avatar_key      TEXT,                      -- chiave R2
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  birthdate       TEXT,                      -- vendita alcolici: verifica maggiore età al checkout
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      TEXT                       -- soft delete (GDPR: anonimizzazione differita)
);

CREATE TABLE addresses (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  province     TEXT NOT NULL,
  postal_code  TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'IT',
  phone        TEXT,
  is_default   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- -----------------------------------------------------------------------------
-- 3. CANTINE (cuore della Fase 1) — una cantina è anche il "tenant" B2B
-- -----------------------------------------------------------------------------

CREATE TABLE wineries (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  legal_name      TEXT,
  vat_number      TEXT,                      -- P.IVA, verificata via VIES durante il claim
  tagline         TEXT,
  description_md  TEXT,
  -- indirizzo / geo
  address_line    TEXT,
  locality        TEXT,                      -- frazione
  municipality    TEXT,                      -- comune
  postal_code     TEXT,
  province_code   TEXT REFERENCES provinces(code),
  territory_id    TEXT REFERENCES territories(id) ON DELETE SET NULL,
  lat             REAL,                      -- NULL ammesso: la scheda resta visibile, la mappa no
  lng             REAL,
  coordinate_status TEXT NOT NULL DEFAULT 'missing'
                    CHECK (coordinate_status IN ('verified','approximate','osm','missing')),
  coordinate_source TEXT,                    -- 'official' | 'directory' | 'osm' | NULL
  alternate_addresses_json TEXT,             -- altre sedi/indirizzi citati dalle fonti
  -- contatti pubblici
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  instagram       TEXT,
  booking_mode    TEXT NOT NULL DEFAULT 'request' CHECK (booking_mode IN ('none','request','instant')),
  -- stato editoriale e B2B
  status          TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','hidden','archived')),
  claim_status    TEXT NOT NULL DEFAULT 'unclaimed' CHECK (claim_status IN ('unclaimed','pending','claimed')),
  data_source     TEXT NOT NULL DEFAULT 'import' CHECK (data_source IN ('import','admin','owner')),
  sources_json    TEXT,                      -- URL delle fonti pubbliche dei dati (provenienza)
  data_note       TEXT,                      -- avviso redazionale ("contatti da confermare"...)
  checked_at      TEXT,                      -- data dell'ultima verifica delle fonti
  shop_enabled    INTEGER NOT NULL DEFAULT 0,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','premium')),
  -- denormalizzati per la lista (aggiornati da trigger/job)
  cover_media_id  TEXT,
  rating_avg      REAL NOT NULL DEFAULT 0,
  rating_count    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((lat IS NULL AND lng IS NULL) OR (lat BETWEEN 42.5 AND 44.1 AND lng BETWEEN 12.1 AND 14.0))
);
CREATE INDEX idx_wineries_geo       ON wineries(lat, lng) WHERE status = 'published';
CREATE INDEX idx_wineries_province  ON wineries(province_code, status);
CREATE INDEX idx_wineries_territory ON wineries(territory_id, status);
CREATE INDEX idx_wineries_claim     ON wineries(claim_status);

-- Relazioni N:N usate dai filtri
CREATE TABLE winery_denominations (
  winery_id        TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  denomination_id  TEXT NOT NULL REFERENCES denominations(id) ON DELETE CASCADE,
  PRIMARY KEY (winery_id, denomination_id)
) WITHOUT ROWID;
CREATE INDEX idx_wd_denomination ON winery_denominations(denomination_id);

CREATE TABLE winery_grapes (
  winery_id  TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  grape_id   TEXT NOT NULL REFERENCES grape_varieties(id) ON DELETE CASCADE,
  PRIMARY KEY (winery_id, grape_id)
) WITHOUT ROWID;
CREATE INDEX idx_wg_grape ON winery_grapes(grape_id);

CREATE TABLE winery_services (
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  service_id  TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (winery_id, service_id)
) WITHOUT ROWID;
CREATE INDEX idx_ws_service ON winery_services(service_id);

CREATE TABLE winery_hours (
  winery_id     TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  weekday       INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = lunedì
  opens_at      TEXT,                                              -- 'HH:MM', NULL = chiuso
  closes_at     TEXT,
  by_appointment INTEGER NOT NULL DEFAULT 0,
  note          TEXT,
  PRIMARY KEY (winery_id, weekday, opens_at)
);

CREATE TABLE media (                         -- file su R2, varianti via Cloudflare Images
  id          TEXT PRIMARY KEY,
  winery_id   TEXT REFERENCES wineries(id) ON DELETE CASCADE,
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('winery','wine','experience','review','user')),
  owner_id    TEXT NOT NULL,
  r2_key      TEXT NOT NULL UNIQUE,
  alt         TEXT,
  width       INTEGER,
  height      INTEGER,
  sort        INTEGER NOT NULL DEFAULT 0,
  credit      TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_media_owner ON media(owner_type, owner_id, sort);

-- Ricerca full-text (nome, comune, descrizione, vini) — FTS5 è supportato da D1
CREATE VIRTUAL TABLE wineries_fts USING fts5(
  name, municipality, tagline, keywords,
  content = '', tokenize = "unicode61 remove_diacritics 2"
);
-- popolata dall'app: INSERT INTO wineries_fts(rowid, ...) con rowid = wineries.rowid

-- -----------------------------------------------------------------------------
-- 4. FASE 2 — CLAIM & TEAM DELLA CANTINA
-- -----------------------------------------------------------------------------

CREATE TABLE winery_members (               -- chi può gestire la cantina (tenant)
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','editor')),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (winery_id, user_id)
) WITHOUT ROWID;
CREATE INDEX idx_members_user ON winery_members(user_id);

CREATE TABLE winery_claims (
  id              TEXT PRIMARY KEY,
  winery_id       TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method          TEXT NOT NULL CHECK (method IN ('domain_email','phone_otp','document','manual')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','approved','rejected','expired')),
  claimant_role   TEXT,                      -- titolare, enologo, marketing...
  vat_number      TEXT,
  vies_valid      INTEGER,                   -- esito controllo VIES
  evidence_key    TEXT,                      -- R2: visura / documento (privato)
  otp_hash        TEXT,                      -- hash del codice OTP (mai in chiaro)
  otp_expires_at  TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  reviewed_by     TEXT REFERENCES users(id),
  reviewed_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_claims_status ON winery_claims(status, created_at);
-- una sola richiesta aperta per coppia cantina/utente
CREATE UNIQUE INDEX uq_claims_open ON winery_claims(winery_id, user_id)
  WHERE status IN ('pending','verified');

CREATE TABLE corrections (                  -- "Segnala un'informazione da aggiornare"
  id          TEXT PRIMARY KEY,
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  email       TEXT,
  field       TEXT,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','applied','dismissed')),
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. CATALOGO — vini (editoriale) ≠ prodotti (vendibili) ≠ esperienze
-- -----------------------------------------------------------------------------

CREATE TABLE wines (                         -- scheda vino: esiste anche senza shop
  id               TEXT PRIMARY KEY,
  winery_id        TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  slug             TEXT NOT NULL,
  name             TEXT NOT NULL,
  denomination_id  TEXT REFERENCES denominations(id) ON DELETE SET NULL,
  color            TEXT CHECK (color IN ('white','red','rose','sparkling','sweet','orange')),
  description_md   TEXT,
  abv              REAL,
  external_url     TEXT,                     -- anteprime importate: rimandano al sito cantina
  external_id      TEXT,                     -- id dell'anteprima nel portale attuale (wine-xxxxxxxx)
  external_category TEXT,                    -- categoria così come appare sul sito della cantina
  external_image_url TEXT,                   -- immagine sul sito della cantina: NON ripubblicare senza consenso
  evidence_type    TEXT,                     -- come è stata rilevata (wine-detail, schema-product, ...)
  checked_at       TEXT,
  source           TEXT NOT NULL DEFAULT 'owner' CHECK (source IN ('import','owner')),
  status           TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  sort             INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (winery_id, slug)
);
CREATE INDEX idx_wines_denomination ON wines(denomination_id);

CREATE TABLE wine_grapes (
  wine_id   TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  grape_id  TEXT NOT NULL REFERENCES grape_varieties(id) ON DELETE CASCADE,
  percent   INTEGER CHECK (percent BETWEEN 1 AND 100),
  PRIMARY KEY (wine_id, grape_id)
) WITHOUT ROWID;

CREATE TABLE products (                      -- SKU vendibile (bottiglia, magnum, cassa)
  id              TEXT PRIMARY KEY,
  winery_id       TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  wine_id         TEXT REFERENCES wines(id) ON DELETE SET NULL,
  sku             TEXT NOT NULL,
  title           TEXT NOT NULL,
  vintage         INTEGER,
  format_ml       INTEGER NOT NULL DEFAULT 750,
  units_per_pack  INTEGER NOT NULL DEFAULT 1,
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),   -- IVA inclusa
  vat_rate        REAL NOT NULL DEFAULT 22,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  weight_g        INTEGER,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (winery_id, sku)
);
CREATE INDEX idx_products_shop ON products(winery_id, status);

CREATE TABLE experiences (                   -- degustazioni, tour in vigna, pranzi
  id              TEXT PRIMARY KEY,
  winery_id       TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'tasting' CHECK (kind IN ('tasting','tour','meal','event','stay')),
  description_md  TEXT,
  duration_min    INTEGER,
  price_cents     INTEGER,                   -- NULL = "prezzo su richiesta" (offerta senza checkout)
  min_guests      INTEGER NOT NULL DEFAULT 1,
  max_guests      INTEGER,
  languages       TEXT,                      -- JSON array: ["it","en","de"]
  valid_from      TEXT,
  valid_to        TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (winery_id, slug)
);
CREATE INDEX idx_experiences_winery ON experiences(winery_id, status);

CREATE TABLE experience_slots (              -- disponibilità prenotabili (Fase 3)
  id             TEXT PRIMARY KEY,
  experience_id  TEXT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  starts_at      TEXT NOT NULL,
  capacity       INTEGER NOT NULL CHECK (capacity > 0),
  booked         INTEGER NOT NULL DEFAULT 0 CHECK (booked >= 0),
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  CHECK (booked <= capacity),
  UNIQUE (experience_id, starts_at)
);
CREATE INDEX idx_slots_time ON experience_slots(starts_at);

-- -----------------------------------------------------------------------------
-- 6. COMMUNITY — preferiti, itinerari, recensioni, richieste visita
-- -----------------------------------------------------------------------------

CREATE TABLE favorites (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, winery_id)
) WITHOUT ROWID;

CREATE TABLE itineraries (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  travel_date TEXT,
  notes       TEXT,
  visibility  TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','link')),
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_itineraries_user ON itineraries(user_id);

CREATE TABLE itinerary_stops (
  itinerary_id  TEXT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  winery_id     TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  note          TEXT,
  PRIMARY KEY (itinerary_id, position)
);

CREATE TABLE reviews (
  id            TEXT PRIMARY KEY,
  winery_id     TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         TEXT,
  body          TEXT,
  visited_on    TEXT,
  verified      INTEGER NOT NULL DEFAULT 0,  -- 1 se collegata a ordine/prenotazione completati
  order_id      TEXT REFERENCES orders(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','hidden')),
  owner_reply   TEXT,
  owner_reply_at TEXT,
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (winery_id, user_id)                -- una recensione per utente per cantina (modificabile)
);
CREATE INDEX idx_reviews_winery ON reviews(winery_id, status, created_at);

CREATE TABLE visit_requests (                -- Fase 1-2: richiesta senza pagamento
  id            TEXT PRIMARY KEY,
  winery_id     TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  experience_id TEXT REFERENCES experiences(id) ON DELETE SET NULL,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  preferred_date TEXT,
  guests        INTEGER NOT NULL DEFAULT 2 CHECK (guests > 0),
  message       TEXT,
  consent_at    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','confirmed','declined','closed')),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_visit_requests_winery ON visit_requests(winery_id, status, created_at);

-- -----------------------------------------------------------------------------
-- 7. FASE 3 — MARKETPLACE MULTI-VENDOR
-- Modello: 1 checkout (orders) → N sotto-ordini per cantina (vendor_orders).
-- Pagamenti con Stripe Connect "separate charges & transfers":
--   la piattaforma incassa una volta, poi crea un Transfer per vendor_order.
-- -----------------------------------------------------------------------------

CREATE TABLE payout_accounts (
  winery_id          TEXT PRIMARY KEY REFERENCES wineries(id) ON DELETE CASCADE,
  stripe_account_id  TEXT NOT NULL UNIQUE,
  charges_enabled    INTEGER NOT NULL DEFAULT 0,
  payouts_enabled    INTEGER NOT NULL DEFAULT 0,
  details_submitted  INTEGER NOT NULL DEFAULT 0,
  commission_bps     INTEGER NOT NULL DEFAULT 1000,   -- 10,00% default, negoziabile per cantina
  updated_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipping_rates (                -- spedizione gestita (e pagata) dalla cantina
  id                  TEXT PRIMARY KEY,
  winery_id           TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  zone                TEXT NOT NULL DEFAULT 'IT' CHECK (zone IN ('IT','IT_ISLANDS')),
  min_bottles         INTEGER NOT NULL DEFAULT 1,
  max_bottles         INTEGER,
  price_cents         INTEGER NOT NULL,
  free_over_cents     INTEGER,
  eta_days            INTEGER
);
CREATE INDEX idx_shipping_winery ON shipping_rates(winery_id, zone);

CREATE TABLE carts (
  id          TEXT PRIMARY KEY,                -- id anche in cookie per utenti anonimi
  user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
  id          TEXT PRIMARY KEY,
  cart_id     TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE CASCADE,
  slot_id     TEXT REFERENCES experience_slots(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  added_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((product_id IS NOT NULL) <> (slot_id IS NOT NULL))
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

CREATE TABLE orders (                        -- ordine "padre" (un pagamento)
  id                     TEXT PRIMARY KEY,
  number                 TEXT NOT NULL UNIQUE,   -- es. CDM-2026-000123
  user_id                TEXT REFERENCES users(id) ON DELETE SET NULL,
  email                  TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','paid','partially_refunded','refunded','cancelled')),
  currency               TEXT NOT NULL DEFAULT 'EUR',
  subtotal_cents         INTEGER NOT NULL,
  shipping_cents         INTEGER NOT NULL DEFAULT 0,
  total_cents            INTEGER NOT NULL,
  shipping_address_json  TEXT,                   -- snapshot, non FK
  billing_address_json   TEXT,
  age_confirmed_at       TEXT,                   -- dichiarazione 18+ obbligatoria per alcolici
  stripe_payment_intent  TEXT UNIQUE,
  stripe_transfer_group  TEXT,
  paid_at                TEXT,
  created_at             TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_user ON orders(user_id, created_at);

CREATE TABLE vendor_orders (                 -- sotto-ordine per cantina: evasione + split
  id                  TEXT PRIMARY KEY,
  order_id            TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  winery_id           TEXT NOT NULL REFERENCES wineries(id),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','shipped','delivered','completed','cancelled','refunded')),
  subtotal_cents      INTEGER NOT NULL,
  shipping_cents      INTEGER NOT NULL DEFAULT 0,
  commission_cents    INTEGER NOT NULL,          -- trattenuta piattaforma
  payout_cents        INTEGER NOT NULL,          -- subtotal + shipping - commission
  stripe_transfer_id  TEXT,
  carrier             TEXT,
  tracking_number     TEXT,
  shipped_at          TEXT,
  delivered_at        TEXT,
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, winery_id)
);
CREATE INDEX idx_vendor_orders_winery ON vendor_orders(winery_id, status, created_at);

CREATE TABLE order_items (
  id                TEXT PRIMARY KEY,
  vendor_order_id   TEXT NOT NULL REFERENCES vendor_orders(id) ON DELETE CASCADE,
  item_type         TEXT NOT NULL CHECK (item_type IN ('product','experience')),
  product_id        TEXT REFERENCES products(id) ON DELETE SET NULL,
  slot_id           TEXT REFERENCES experience_slots(id) ON DELETE SET NULL,
  title_snapshot    TEXT NOT NULL,              -- il catalogo può cambiare: congeliamo i dati
  unit_price_cents  INTEGER NOT NULL,
  vat_rate          REAL NOT NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_order_id);

CREATE TABLE bookings (                      -- prenotazione esperienza pagata
  id             TEXT PRIMARY KEY,
  order_item_id  TEXT NOT NULL UNIQUE REFERENCES order_items(id) ON DELETE CASCADE,
  slot_id        TEXT NOT NULL REFERENCES experience_slots(id),
  guests         INTEGER NOT NULL CHECK (guests > 0),
  lead_name      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','attended','no_show','cancelled')),
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_bookings_slot ON bookings(slot_id);

CREATE TABLE payment_events (                -- idempotenza webhook Stripe
  id           TEXT PRIMARY KEY,             -- evt_... di Stripe
  type         TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  processed_at TEXT
);

-- -----------------------------------------------------------------------------
-- 8. PIATTAFORMA — inserzioni sponsorizzate, audit
-- -----------------------------------------------------------------------------

CREATE TABLE campaigns (
  id          TEXT PRIMARY KEY,
  winery_id   TEXT NOT NULL REFERENCES wineries(id) ON DELETE CASCADE,
  placement   TEXT NOT NULL CHECK (placement IN ('map_highlight','list_top','territory_feature')),
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','ended','cancelled')),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_campaigns_active ON campaigns(status, starts_at, ends_at);

CREATE TABLE audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  winery_id   TEXT REFERENCES wineries(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,                 -- 'claim.approved', 'product.updated', ...
  entity      TEXT,
  entity_id   TEXT,
  diff_json   TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_winery ON audit_log(winery_id, created_at);

-- -----------------------------------------------------------------------------
-- 9. TRIGGER — rating denormalizzato sulla cantina
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_reviews_rating_ins AFTER INSERT ON reviews
BEGIN
  UPDATE wineries SET
    rating_avg   = COALESCE((SELECT AVG(rating) FROM reviews WHERE winery_id = NEW.winery_id AND status = 'published'), 0),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE winery_id = NEW.winery_id AND status = 'published')
  WHERE id = NEW.winery_id;
END;

CREATE TRIGGER trg_reviews_rating_upd AFTER UPDATE OF rating, status ON reviews
BEGIN
  UPDATE wineries SET
    rating_avg   = COALESCE((SELECT AVG(rating) FROM reviews WHERE winery_id = NEW.winery_id AND status = 'published'), 0),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE winery_id = NEW.winery_id AND status = 'published')
  WHERE id = NEW.winery_id;
END;

CREATE TRIGGER trg_reviews_rating_del AFTER DELETE ON reviews
BEGIN
  UPDATE wineries SET
    rating_avg   = COALESCE((SELECT AVG(rating) FROM reviews WHERE winery_id = OLD.winery_id AND status = 'published'), 0),
    rating_count = (SELECT COUNT(*) FROM reviews WHERE winery_id = OLD.winery_id AND status = 'published')
  WHERE id = OLD.winery_id;
END;
