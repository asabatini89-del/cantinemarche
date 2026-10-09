-- Provenienza e varianti delle immagini raccolte dai siti delle cantine.
ALTER TABLE media ADD COLUMN kind TEXT NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo', 'bottle', 'upload'));
ALTER TABLE media ADD COLUMN thumb_key TEXT;      -- variante 640 px per le card
ALTER TABLE media ADD COLUMN source_url TEXT;     -- URL originale dell'immagine
ALTER TABLE media ADD COLUMN source_page TEXT;    -- pagina in cui è stata trovata (per il credito)
CREATE INDEX idx_media_winery ON media(winery_id, owner_type, sort);
