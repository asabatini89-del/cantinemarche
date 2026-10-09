# Report di importazione

Fonte: `data/export-2026-10-09` — https://cantine-delle-marche.andrea-s89.chatgpt.site (versione 14, commit `5bee492`), esportato il 2026-10-09T16:23:09.967Z.
Generato da `scripts/build-seed.mjs`.

## Riepilogo

| | Valore |
|---|---|
| Cantine nell'export | 368 |
| Cantine pubblicate dopo l'import | 365 |
| Righe nascoste (non sono cantine) | 3 |
| Cantine con coordinate | 307 |
| Cantine senza coordinate (scheda visibile, niente mappa) | 58 |
| Cantine con almeno una denominazione | 133 |
| Cantine con territorio univoco | 72 |
| Cantine con servizi (degustazioni, visite, vendita) | 74 |
| Anteprime vini importate | 1494 (1421 pubblicate, 73 in bozza perché non sono vini) |
| Cantine con anteprime | 120 |
| Anteprime con immagine sul sito della cantina | 1346 (URL conservato, **non** mostrato: vedi sotto) |

### Cantine per provincia

| Provincia | Cantine |
|---|---|
| Pesaro e Urbino | 41 |
| Ancona | 139 |
| Macerata | 69 |
| Fermo | 32 |
| Ascoli Piceno | 84 |
| _non determinata_ | 0 |

### Qualità delle coordinate

| Stato | Cantine |
|---|---|
| approximate | 301 |
| osm | 6 |
| verified | 0 |
| missing | 58 |

## Da verificare

### 1. Righe nascoste: non sono cantine
Sono pubblicate nel portale attuale ma sono artefatti della raccolta automatica (testi di pagine web). Importate con `status = 'hidden'`.
- `iscriviti-alla-newsletter` — “Iscriviti alla Newsletter” (fonti: https://www.mtvmarche.it/soci/)
- `loader` — “Loader” (fonti: https://imtdoc.it/associato/albamocco-s-s-di-russotto-filippo-e-matilde-soc-agr/, https://imtdoc.it/associato/societa-agricola-sabbionare-s-s/, https://imtdoc.it/associato/societa-agricola-tenuta-dellugolino-di-petrini-e-foroni-s-s/, https://imtdoc.it/associato/tenuta-colpaola/, https://imtdoc.it/associato/soc-agr-zannotti-claudio-e-ferdinando-s-s/, https://imtdoc.it/associato/piantate-lunghe-soc-agr-giustini-mazzoni/, https://imtdoc.it/associato/azienda-vitivinicola-la-montata-di-dini-luciana/, https://imtdoc.it/associato/azienda-agricola-santori-mara/, https://imtdoc.it/associato/azienda-agraria-dott-guerrieri-luca/, https://imtdoc.it/associato/societa-agricola-la-villa-s-s/)
- `please-wait-while-your-request-is-being-verified` — “Please wait while your request is being verified...” (fonti: https://imtdoc.it/associato/cantina-sociale-di-matelica-e-cerreto-desi-soc-coop-a-r/, https://imtdoc.it/associato/cantine-pro-vi-ma-s-a-c/, https://imtdoc.it/associato/societa-agricola-sartarelli-di-sartarelli-donatella-e-chiacchiarini-patrizio/, https://imtdoc.it/associato/marconi-vini-srl/, https://imtdoc.it/associato/az-agr-marchetti-maurizio/, https://imtdoc.it/associato/cooperativa-agricola-montesanto-a-r-l/, https://imtdoc.it/associato/azienda-f-lli-politi/, https://imtdoc.it/associato/boccafosca-soc-coop-agr/, https://imtdoc.it/associato/societa-agricola-bisci-di-bisci-pierino-giuseppe-mauro-e-immobiliare-castigioni-s-s/, https://imtdoc.it/associato/soc-agr-bruscia-s-s/, https://imtdoc.it/associato/alberto-quacquarini-societa-agricola-semplice/)

### 2. Provincia ricavata dal CAP
Nel dato originale la provincia è vuota.
- `fattoria-gens-camuria-soc-coop-agricola` FATTORIA GENS CAMURIA SOC.COOP AGRICOLA: CAP 60021 → **AN** (indirizzo: “VIA DIRETTISSIMA DEL CONERO, 2- 60021 CAMERANO”, città: “CAMERANO”)
- `terre-cortesi-moncaro-soc-coop` Terre Cortesi Moncaro Soc. Coop.: CAP 63075 → **AP** (indirizzo: “Via Boreale, 37, 63075 Acquaviva Picena AP”, città: “Montecarotto”)

### 3. Provincia in conflitto con il CAP dell'indirizzo
- `le-cime-basse-s-s-soc-agr` LE CIME BASSE S.S. SOC. AGR.: provincia MC, CAP indirizzo → AN (“VOCABOLO BALZANI SNC - 60024 MATELICA (MC)”)

### 4. Anteprime condivise tra due schede (possibili cantine duplicate)
- ama-aquilone-coop-sociale ↔ bio-fattoria-sociale-ama-terra: 8 anteprime con lo stesso URL — importate su entrambe con id distinti
- angelini-wines-estates-societa-agricola-a-r-l ↔ fazi-battaglia: 5 anteprime con lo stesso URL — importate su entrambe con id distinti

### 5. Valori non mappati
- nessuno

### 6. Avvisi
- nessuno

## Regole applicate

- **Identificativi:** `wineries.id` = `slug` = id del portale attuale, quindi gli URL `/cantine/<id>` restano invariati.
- **Denominazioni:** il campo `wines` della cantina è collegato alle denominazioni tramite il campo `match` dell'export. Se il testo è ambiguo (es. “Verdicchio dei Castelli di Jesi”) si sceglie la DOC, non la Riserva DOCG. Le voci che sono vitigni (Passerina, Pecorino, Verdicchio, Lacrima) vanno in `winery_grapes`.
- **Vitigni derivati:** per le denominazioni con vitigno prevalente da disciplinare (Verdicchio, Lacrima, Rosso Conero/Conero, Vernaccia/Serrapetrona, Bianchello) il vitigno viene aggiunto al filtro. Collegamenti derivati: 91.
- **Territori:** una denominazione appartiene a un territorio se il suo `match` coincide con il vino del territorio (stessa logica del portale), più Conero DOCG → Riviera del Conero e Terre di Offida → Offida e il Piceno. `wineries.territory_id` è valorizzato solo quando il territorio è univoco. Le pagine territorio interrogano comunque le denominazioni.
- **Servizi:** le esperienze “Degustazione” e “Visita guidata” e il servizio “Vendita diretta” diventano i servizi `degustazioni`, `visita-guidata`, `vendita-diretta`.
- **Contatti:** prefissi “Tel.”/“Tel. e Fax” rimossi, email in minuscolo, `https://` aggiunto ai siti senza schema. Indirizzi originali conservati in `address_line`.
- **Comune:** ricavato dal campo città (senza sigla provincia, maiuscolo → iniziali maiuscole) oppure dal CAP nell'indirizzo. È un valore *best effort*, da rifinire in dashboard.
- **Provenienza:** fonti (`sources_json`), nota redazionale (`data_note`), data di verifica e stato delle coordinate sono conservati per ogni cantina.
- **Anteprime vini ≠ shop:** le 1.494 anteprime osservate sui siti delle cantine sono schede editoriali (`wines`, `source = 'import'`) con link al sito. Non diventano prodotti vendibili, e prezzi e disponibilità non vengono dedotti. Olio, grappe, confetture, birre e appartamenti restano in bozza.
- **Immagini:** gli URL delle foto dei siti delle cantine sono conservati in `external_image_url` ma non vanno mostrati né copiati su R2 senza il consenso della cantina (coerente con `LICENSE-coordinates.md`: nessuna fotografia proprietaria ripubblicata).
