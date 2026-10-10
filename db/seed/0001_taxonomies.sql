-- Tassonomie: province, territori, denominazioni, vitigni, servizi
-- Generato da scripts/build-seed.mjs — NON modificare a mano.
-- Fonte: https://cantine-delle-marche.andrea-s89.chatgpt.site · versione 14 · commit 5bee49221973e024ddb5393370ab4f43366a73aa · esportato 2026-10-09T16:23:09.967Z

INSERT INTO provinces (code, name, slug) VALUES ('PU', 'Pesaro e Urbino', 'pesaro-e-urbino');
INSERT INTO provinces (code, name, slug) VALUES ('AN', 'Ancona', 'ancona');
INSERT INTO provinces (code, name, slug) VALUES ('MC', 'Macerata', 'macerata');
INSERT INTO provinces (code, name, slug) VALUES ('FM', 'Fermo', 'fermo');
INSERT INTO provinces (code, name, slug) VALUES ('AP', 'Ascoli Piceno', 'ascoli-piceno');

INSERT INTO territories (id, slug, name, intro, sort) VALUES ('castelli-di-jesi', 'castelli-di-jesi', 'Castelli di Jesi', 'Un viaggio tra borghi e colline della Vallesina. Il Verdicchio accompagna la scoperta dei Castelli di Jesi, da Cupramontana a Staffolo e Montecarotto.', 0);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('conero', 'conero', 'Riviera del Conero', 'Vigneti affacciati sull’Adriatico, il profilo del Monte Conero e i borghi di Camerano e Numana. Un territorio da attraversare con lentezza, tra mare e vino.', 1);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('matelica', 'matelica', 'Matelica e l’Alta Valle', 'Nell’entroterra maceratese, la valle di Matelica racconta un’altra espressione del Verdicchio. Le visite in cantina si possono abbinare alla scoperta dei borghi ai piedi dell’Appennino.', 2);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('piceno', 'piceno', 'Offida e il Piceno', 'Le colline del sud delle Marche uniscono il patrimonio di Offida e Ascoli Piceno alla cultura del vino. Pecorino, Passerina e vini rossi invitano a esplorare le aziende del territorio.', 3);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('metauro', 'metauro', 'Valle del Metauro', 'Dal mare di Fano verso l’interno, la valle del Metauro offre un itinerario tra paesaggi agricoli, borghi e cantine.', 4);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('morro-d-alba', 'morro-d-alba', 'Morro d’Alba', 'Il borgo di Morro d’Alba e le colline circostanti custodiscono la tradizione della Lacrima. Una tappa da abbinare ai Castelli di Jesi e alla costa di Senigallia.', 5);
INSERT INTO territories (id, slug, name, intro, sort) VALUES ('maceratese', 'maceratese', 'Colline maceratesi', 'Dal paesaggio collinare a Serrapetrona, il Maceratese invita a conoscere il vino attraverso i luoghi e le persone che lo producono.', 6);

INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('castelli-di-jesi-verdicchio-riserva', 'castelli-di-jesi-verdicchio-riserva', 'Castelli di Jesi Verdicchio Riserva DOCG', 'DOCG', 'castelli-di-jesi');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('conero', 'conero', 'Conero DOCG', 'DOCG', 'conero');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('verdicchio-matelica-riserva', 'verdicchio-matelica-riserva', 'Verdicchio di Matelica Riserva DOCG', 'DOCG', 'matelica');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('vernaccia-serrapetrona', 'vernaccia-serrapetrona', 'Vernaccia di Serrapetrona DOCG', 'DOCG', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('offida', 'offida', 'Offida DOCG', 'DOCG', 'piceno');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('verdicchio-jesi', 'verdicchio-jesi', 'Verdicchio dei Castelli di Jesi DOC', 'DOC', 'castelli-di-jesi');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('verdicchio-matelica', 'verdicchio-matelica', 'Verdicchio di Matelica DOC', 'DOC', 'matelica');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('rosso-conero', 'rosso-conero', 'Rosso Conero DOC', 'DOC', 'conero');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('lacrima', 'lacrima', 'Lacrima di Morro d’Alba DOC', 'DOC', 'morro-d-alba');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('bianchello', 'bianchello', 'Bianchello del Metauro DOC', 'DOC', 'metauro');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('colli-maceratesi', 'colli-maceratesi', 'Colli Maceratesi DOC', 'DOC', 'maceratese');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('colli-pesaresi', 'colli-pesaresi', 'Colli Pesaresi DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('esino', 'esino', 'Esino DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('pergola', 'pergola', 'Pergola DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('san-ginesio', 'san-ginesio', 'San Ginesio DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('serrapetrona', 'serrapetrona', 'Serrapetrona DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('rosso-piceno', 'rosso-piceno', 'Rosso Piceno DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('falerio', 'falerio', 'Falerio DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('terre-offida', 'terre-offida', 'Terre di Offida DOC', 'DOC', 'piceno');
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('terreni-san-severino', 'terreni-san-severino', 'I Terreni di San Severino DOC', 'DOC', NULL);
INSERT INTO denominations (id, slug, name, level, territory_id) VALUES ('marche', 'marche', 'Marche IGT', 'IGT', NULL);

INSERT INTO grape_varieties (id, slug, name, color) VALUES ('verdicchio', 'verdicchio', 'Verdicchio', 'white');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('pecorino', 'pecorino', 'Pecorino', 'white');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('passerina', 'passerina', 'Passerina', 'white');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('biancame', 'biancame', 'Biancame (Bianchello)', 'white');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('montepulciano', 'montepulciano', 'Montepulciano', 'red');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('sangiovese', 'sangiovese', 'Sangiovese', 'red');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('lacrima', 'lacrima', 'Lacrima', 'red');
INSERT INTO grape_varieties (id, slug, name, color) VALUES ('vernaccia-nera', 'vernaccia-nera', 'Vernaccia nera', 'red');

INSERT INTO services (id, slug, name) VALUES ('degustazioni', 'degustazioni', 'Degustazioni');
INSERT INTO services (id, slug, name) VALUES ('visita-guidata', 'visita-guidata', 'Visita guidata');
INSERT INTO services (id, slug, name) VALUES ('vendita-diretta', 'vendita-diretta', 'Vendita diretta');
INSERT INTO services (id, slug, name) VALUES ('ristorazione', 'ristorazione', 'Ristorazione');
INSERT INTO services (id, slug, name) VALUES ('ospitalita', 'ospitalita', 'Ospitalità');
