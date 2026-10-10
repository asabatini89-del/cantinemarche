-- Esperienze raccolte da fonti pubbliche (sito della cantina, piattaforme di enoturismo):
-- come per i vini importati, ognuna conserva la pagina che la documenta.
ALTER TABLE experiences ADD COLUMN external_url TEXT;  -- pagina della fonte
ALTER TABLE experiences ADD COLUMN source TEXT NOT NULL DEFAULT 'owner' CHECK (source IN ('import', 'owner'));
ALTER TABLE experiences ADD COLUMN checked_at TEXT;
ALTER TABLE experiences ADD COLUMN sort INTEGER NOT NULL DEFAULT 0;
