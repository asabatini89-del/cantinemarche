-- Richieste dai form pubblici (senza account): contatti, rivendicazioni preliminari.
-- Le richieste di visita usano già visit_requests (0001): aggiungiamo l'hash IP
-- per il rate limit, come qui.

CREATE TABLE contact_requests (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('claim','info','correction')),
  winery_id   TEXT REFERENCES wineries(id) ON DELETE SET NULL,
  winery_text TEXT,                          -- nome scritto a mano se la cantina non è nel catalogo
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  role        TEXT,                          -- titolare, enologo, marketing...
  message     TEXT,
  consent_at  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','done','spam')),
  ip_hash     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_contact_requests_status ON contact_requests(status, created_at);
CREATE INDEX idx_contact_requests_ip ON contact_requests(ip_hash, created_at);

ALTER TABLE visit_requests ADD COLUMN ip_hash TEXT;
CREATE INDEX idx_visit_requests_ip ON visit_requests(ip_hash, created_at);
