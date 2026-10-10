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
| Vini importati | 1494 (1421 pubblicati, 73 in bozza perché non sono vini) |
| — di cui anteprime dal portale | 1494 |
| — di cui da ricerca web, con URL di prova | 0 su 0 cantine (—) |
| Cantine pubblicate con almeno un vino | 120 su 365 |
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

### 7. Cantine ancora senza vini
245 cantine pubblicate non hanno vini con una fonte verificabile. Esito della ricerca web (non eseguita): —. Le schede invitano la cantina ad aggiungerli.
- `agostino-romani` Agostino Romani
- `agriarcuata-soc-coop-agricola` Agriarcuata Soc. Coop. Agricola
- `agricola-lanciani` Agricola Lanciani
- `albamocco` Albamocco
- `allevi-maria-letizia-di-corradetti-michele` Allevi Maria Letizia di Corradetti Michele
- `amadio-vini-s-r-l` AMADIO VINI S.R.L.
- `angeli-di-varano-s-s-agricola-dei-f-lli-chiucconi` ANGELI DI VARANO S.S. AGRICOLA DEI F.LLI CHIUCCONI
- `aniballi` Aniballi
- `antica-cantina-sant-amico` Antica Cantina Sant'Amico
- `aurora` Aurora
- `az-agr-colleluce-di-malavolta-franca-c-soc-agricola` AZ. AGR. COLLELUCE DI MALAVOLTA FRANCA & C. SOC. AGRICOLA
- `az-agr-giusti-piergiovanni` AZ. AGR. GIUSTI PIERGIOVANNI
- `az-agr-la-collina-di-tomassini-luciana` AZ. AGR. LA COLLINA DI TOMASSINI LUCIANA
- `az-agr-pandolfi-orsini-di-andrea-orsini` AZ. AGR. PANDOLFI ORSINI DI ANDREA ORSINI
- `az-agr-ripa-marchetti-di-ripa-maria-franca` AZ. AGR. RIPA MARCHETTI DI RIPA MARIA FRANCA
- `az-agr-vallerosa-di-mannocchi-s-c-s-s` Az. Agr. Vallerosa di Mannocchi S. & C. S.S.
- `az-agricola-bastianelli-francesco` Az. Agricola Bastianelli Francesco
- `azienda-agraria-i-tre-filari-di-sabbatini-silvia` AZIENDA AGRARIA I TRE FILARI DI SABBATINI SILVIA
- `azienda-agricola-andrea-felici-di-leopardo-felici` AZIENDA AGRICOLA ANDREA FELICI DI LEOPARDO FELICI
- `azienda-agricola-bartolacci-di-pierini-monica-e-matteo` AZIENDA AGRICOLA BARTOLACCI DI PIERINI MONICA E MATTEO
- `azienda-agricola-federico-castellucci` AZIENDA AGRICOLA FEDERICO CASTELLUCCI
- `azienda-agricola-pagliari-gabriele` AZIENDA AGRICOLA PAGLIARI GABRIELE
- `azienda-agricola-rovegliano` AZIENDA AGRICOLA ROVEGLIANO
- `azienda-agricola-sgaly-di-sgalippa-tommaso` AZIENDA AGRICOLA SGALY DI SGALIPPA TOMMASO
- `azienda-agricola-simone-capecci` Azienda Agricola Simone Capecci
- `azienda-felice` Azienda Felice
- `bonaventura-massimiliano` Bonaventura Massimiliano
- `borioni-gianni-e-beltrani-anna-maria-s-s` BORIONI GIANNI E BELTRANI ANNA MARIA S.S
- `brocani-giuseppe` BROCANI GIUSEPPE
- `broccanera` Broccanera
- `ca-le-suore` Ca' Le Suore
- `caliptra` Ca’Liptra
- `cantina-badialetti` Cantina Badialetti
- `cantina-buongarzoni` Cantina Buongarzoni
- `cantina-dei-monti` Cantina dei Monti
- `cantina-di-esanatoglia` Cantina di Esanatoglia
- `cantina-fortezza-marche` Cantina Fortezza Marche
- `cantina-gozzana` Cantina Gozzana
- `cantina-le-colline` Cantina Le Colline
- `cantina-maroni` Cantina Maroni
- `cantina-marzialetti` Cantina Marzialetti
- `cantina-ortenzi` Cantina Ortenzi
- `cantina-qunti` Cantina Quntì
- `cantina-raponi` Cantina Raponi
- `cantina-rovelli` Cantina Rovelli
- `cantina-santori` Cantina Santori
- `cantina-stefano-maccaroni` Cantina Stefano Maccaroni
- `cantina-suasa` CANTINA SUASA
- `cantina-tavio` Cantina Tavio
- `cantina-tiberi` CANTINA TIBERI
- `cantina-valdimiro` cantina valdimiro
- `cantina-vitula` Cantina Vitula
- `cantina-zamponi` Cantina Zamponi
- `cantine-d-ercoli` Cantine D'Ercoli
- `cantine-paci` Cantine Paci
- `cantine-pisaurum` Cantine Pisaurum
- `cantine-politi` Cantine Politi
- `capinera` Capinera
- `cardocchia` Cardocchia
- `casa-lucciola` Casa Lucciola
- `casa-pierini` Casa Pierini
- `casa-vinicola-bruni` Casa Vinicola Bruni
- `centanni-giacomo-az-agr` Centanni Giacomo Az. Agr.
- `cherubini` Cherubini
- `cignano` Cignano
- `cimarelli-luca` CIMARELLI LUCA
- `collemara` COLLEMARA
- `collestefano` ColleStefano
- `conti-di-buscareto` Conti di Buscareto
- `conti-maria` Conti Maria
- `contrada-contro` Contrada Contro
- `corinaldesi-vignaioli-artigiani` CORINALDESI - Vignaioli Artigiani
- `cossignani-l-e-tempo` Cossignani L.E. Tempo
- `crocevia` Crocevia
- `de-angelis-c-srl` De Angelis & C. SRL
- `de-leyva-di-leva-davide-az-agr` DE LEYVA DI LEVA DAVIDE AZ. AGR.
- `dianetti` Dianetti
- `domodimonti` Domodimonti
- `eredi-cesaroni-srl-soc-agr` EREDI CESARONI SRL SOC. AGR.
- `failoni-rocco` FAILONI ROCCO
- `fattoria-colmone-della-marca` Fattoria Colmone della Marca
- `fattoria-fontegeloni` Fattoria Fontegeloni
- `fattoria-gens-camuria-soc-coop-agricola` FATTORIA GENS CAMURIA SOC.COOP AGRICOLA
- `fattoria-nanni` Fattoria Nannì
- `fattoria-san-lorenzo-di-crognaletti-natalino` FATTORIA SAN LORENZO DI CROGNALETTI NATALINO
- `fattoria-villa-ligi` FATTORIA VILLA LIGI
- `filodivino` Filodivino
- `finocchi-sandro-azienda-agraria` FINOCCHI SANDRO AZIENDA AGRARIA
- `finocchi-viticoltori` Finocchi Viticoltori
- `fiorano-az-agr` FIORANO AZ. AGR.
- `fioretti-brera` Fioretti Brera
- `fratelli-badiali` Fratelli Badiali
- `fulvia-tombolini` Fulvia Tombolini
- `gatti-marco` GATTI MARCO
- `geminiani-wine` Geminiani Wine
- `giorgetti-andrea` GIORGETTI ANDREA
- `guerri-giorgio` GUERRI GIORGIO
- `i-sassi-di-san-giuseppe` I SASSI DI SAN GIUSEPPE
- `il-conte-villa-prandone` IL CONTE VILLA PRANDONE
- `il-conventino-di-monteciccardo-sas-societa-agricola` IL CONVENTINO DI MONTECICCARDO SAS SOCIETA’ AGRICOLA
- `la-fontursia` La Fontursia
- `la-lepre-e-la-luna` La Lepre e la Luna
- `la-marca-di-san-michele` La Marca di San Michele
- `la-meravigna` La Meravigna
- `la-montata` La Montata
- `la-valle-del-sole` La Valle Del Sole
- `la-villa-mergo` La Villa Mergo
- `laila-libenzi-azienda-agricola-di-chiara-refe` LAILA LIBENZI AZIENDA AGRICOLA DI CHIARA REFE
- `le-senate-az-agr-di-visi-giulio` LE SENATE AZ. AGR. DI VISI GIULIO
- `lucchetti` Lucchetti
- `lucidimezzo` LucidiMezzo
- `luigi-giusti` Luigi Giusti
- `lumavite` Lumavite
- `macondo` Macondo
- `madonnabruna` Madonnabruna
- `marchetti` Marchetti
- `marconi-vini` Marconi Vini
- `mazzola` MAZZOLA
- `moncaro` Moncaro
- `montecappone` Montecappone
- `montecoriolano-casalis-douhet` Montecoriolano Casalis Douhet
- `moroder` Moroder
- `murola` Muròla
- `oasi-degli-angeli` Oasi degli Angeli
- `officina-del-sole` Officina del Sole
- `oppeddentro` Oppeddentro
- `peruzzi-liana` Peruzzi Liana
- `piantate-lunghe` Piantate Lunghe
- `pieri` Pieri
- `piersanti` Piersanti
- `pietro17-winery` PIETRO17 WINERY
- `pilandro` Pilandro
- `podere-linfinito-soc-semplice-agricola` PODERE L’INFINITO SOC. SEMPLICE AGRICOLA
- `podere-santa-lucia` Podere Santa Lucia
- `poderi-san-lazzaro` PODERI SAN LAZZARO
- `ripawine-soc-coop-agricola` Ripawine Soc. Coop. Agricola
- `rocca-dei-forti` Rocca dei Forti
- `ronconi-ex-badiali-candelaresi` Ronconi (ex Badiali&Candelaresi)
- `root-s-r-l-societa-agricola` ROOT S.R.L. SOCIETA’ AGRICOLA
- `sabbionare` Sabbionare
- `saladini-pilastri-srl-soc-agricola` Saladini Pilastri Srl Soc. Agricola
- `san-giovanni-soc-agricola-srl` San Giovanni Soc. Agricola Srl
- `santa-barbara` Santa Barbara
- `santa-cassella` Santa Cassella
- `santa-liberata-di-savini-giorgio-az-agricola` Santa Liberata di Savini Giorgio Az. Agricola
- `saputi` Saputi
- `sassodivino` SASSODIVINO
- `sauie-srl-az-agr-montecoriolano` SAUIE SRL – AZ. AGR. MONTECORIOLANO
- `sauro-carletti` Sauro Carletti
- `sciauerta` Sciauerta
- `selvagrossa` Selvagrossa
- `serboni-massimo-azienda-agricola` SERBONI MASSIMO AZIENDA AGRICOLA
- `sergio-marani` Sergio Marani
- `soc-agr-la-pila-di-matteo-toniolo-s-s` Soc. Agr. La Pila di Matteo Toniolo S.S.
- `soc-agr-montebianco120-s-s` SOC. AGR. MONTEBIANCO120 S.S.
- `soc-agricola-san-filippo-s-s` Soc. Agricola San Filippo S.S.
- `soc-agr-vini-gagliardi-gino-di-gagliardi-lara-e-umberto-snc` SOC.AGR.VINI GAGLIARDI GINO DI GAGLIARDI LARA E UMBERTO SNC
- `socci` SOCCI
- `societa-agricola-bucchini-davide-e-romani-stefania-s-s` SOCIETÀ AGRICOLA BUCCHINI DAVIDE E ROMANI STEFANIA S.S.
- `societa-agricola-capriotti` SOCIETÀ AGRICOLA CAPRIOTTI
- `societa-agricola-fausti-srl` Società Agricola Fausti Srl
- `societa-agricola-la-staffa-di-baldi-riccardo-e-c-s-s` SOCIETA AGRICOLA LA STAFFA DI BALDI RICCARDO E C. S.S
- `societa-agricola-ronconi-di-ronconi-samuele-c-s-s` SOCIETA’ AGRICOLA RONCONI DI RONCONI SAMUELE & C. S.S.
- `societa-agricola-villa-lazzarini-srl` SOCIETA’ AGRICOLA VILLA LAZZARINI SRL
- `spallacci-giordano` SPALLACCI GIORDANO
- `sparapani-snc-di-sparapani-giuseppe-c` SPARAPANI SNC DI SPARAPANI GIUSEPPE & C.
- `stefano-mancinelli` Stefano Mancinelli
- `strologo` Strologo
- `tenimenti-le-ginestre-srl` Tenimenti Le Ginestre Srl
- `tenimenti-spinsanti-spinsanti-catia` TENIMENTI SPINSANTI - SPINSANTI CATIA
- `tenuta-agricola-la-riserva-di-mattioli-dina` Tenuta Agricola La Riserva di Mattioli Dina
- `tenuta-barbarossa` Tenuta Barbarossa
- `tenuta-ca-sciampagne` Tenuta Ca' Sciampagne
- `tenuta-carlini-di-andrea-carlini` TENUTA CARLINI DI ANDREA CARLINI
- `tenuta-cocci-grifoni` Tenuta Cocci Grifoni
- `tenuta-colpaola` Tenuta Colpaola
- `tenuta-conte-lucangeli` Tenuta Conte Lucangeli
- `tenuta-dell-ugolino` Tenuta dell'Ugolino
- `tenuta-di-fra` Tenuta di Frà
- `tenuta-di-pirano` Tenuta di Pirano
- `tenuta-grimaldi` Tenuta Grimaldi
- `tenuta-manoylo-by-moresco-soc-agr-semplice` Tenuta Manoylo by Moresco Soc. Agr. Semplice
- `tenuta-marino` Tenuta Marino
- `tenuta-mattei` Tenuta Mattei
- `tenuta-musone` Tenuta Musone
- `tenuta-piano-di-rustano` Tenuta Piano di Rustano
- `tenuta-san-marcello` Tenuta San Marcello
- `tenuta-san-martino-di-cerioni-mauro` TENUTA SAN MARTINO DI CERIONI MAURO
- `tenuta-santi-giacomo-e-filippo` Tenuta Santi Giacomo e Filippo
- `tenuta-seghetti-panichi` Tenuta Seghetti Panichi
- `tenuta-siliquini` Tenuta Siliquini
- `tenuta-spinelli-di-spinelli-simone` Tenuta Spinelli di Spinelli Simone
- `tenute-del-borgo` Tenute del Borgo
- `tenute-il-crinale-di-quitadamo-michele` Tenute Il Crinale di Quitadamo Michele
- `tenute-malavolta` Tenute Malavolta
- `tenute-polini-societa-agricola-semplice` Tenute Polini Società Agricola Semplice
- `tenute-priori-galdelli` Tenute Priori & Galdelli
- `tenute-recchi-franceschini-eredi-az-agr-la-via-sistina` Tenute Recchi Franceschini Eredi Az. Agr. La Via Sistina
- `tenute-urani` Tenute Urani
- `terra-argillosa` Terra Argillosa
- `terra-divina` Terra Divina
- `terra-libera` Terra Libera
- `terra-premiata-di-graziano-mazza-figli` Terra Premiata di Graziano Mazza & Figli
- `terracruda` Terracruda
- `terrafageto` TERRAFAGETO
- `terre-cerquaferrata` Terre Cerquaferrata
- `terre-cortesi-moncaro-soc-coop` Terre Cortesi Moncaro Soc. Coop.
- `terre-d-arengo` Terre d'Arengo
- `terre-di-san-ginesio` Terre di San Ginesio
- `terre-di-serrapetrona-societa-agricola-semplice` TERRE DI SERRAPETRONA SOCIETA’ AGRICOLA SEMPLICE
- `tomassetti` tomassetti.
- `torretti-walter` TORRETTI WALTER
- `valter-mattoni` Valter Mattoni
- `vara-pesaresi-vignaioli` VARÀ PESARESI VIGNAIOLI
- `veneranda-vite` Veneranda Vite
- `venturi-roberto` Venturi Roberto
- `verser-cantina-e-vigneti` VerSer | Cantina e Vigneti
- `vicari` Vicari
- `viconari` Viconari
- `vigna-degli-estensi` Vigna degli Estensi
- `vigna-della-cava` Vigna della Cava
- `vignamato` Vignamato
- `vigne-di-leo-tre-castelli` Vigne di Leo – Tre Castelli
- `vigneti-vallorani` Vigneti Vallorani
- `vigneto-fernando-alberto` Vigneto Fernando Alberto
- `villa-forano` Villa Forano
- `villa-imperium` Villa Imperium
- `villa-manu` Villa Manù
- `villa-romita-di-brugiaferri-maurilio-e-giorgi-simonetta-s` VILLA ROMITA DI BRUGIAFERRI MAURILIO E GIORGI SIMONETTA S.
- `vini-accattoli` Vini Accattoli
- `vini-firmanum` Vini Firmanum
- `vini-maraviglia` Vini Maraviglia
- `vini-montesanto` Vini Montesanto
- `vini-muraro` Vini Muraro
- `vini-rocchi` Vini Rocchi
- `vini-simonetti` Vini Simonetti
- `vini-valmusone` Vini Valmusone
- `vinicola-carassanese` Vinicola Carassanese
- `vinicola-del-tesino-srl` Vinicola del Tesino Srl
- `vinidicagnore` ViniDiCagnore
- `vitali-augusto` VITALI AUGUSTO
- `vitivinicola-costadoro-soc-agr-srl` Vitivinicola Costadoro Soc. Agr. Srl
- `vitivinicola-dangelo-s-s-a` Vitivinicola D’Angelo S.S.A.
- `vittorini-di-nico-speranza` Vittorini di Nico Speranza
- `zaccagnini` Zaccagnini

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
