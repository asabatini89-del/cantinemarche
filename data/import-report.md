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
| Vini importati | 1670 (1597 pubblicati, 73 in bozza perché non sono vini) |
| — di cui anteprime dal portale | 1494 |
| — di cui da ricerca web, con URL di prova | 176 su 40 cantine (sito-cantina: 157, rivenditore: 10, altro: 8, guida: 1) |
| Cantine pubblicate con almeno un vino | 160 su 365 |
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
205 cantine pubblicate non hanno vini con una fonte verificabile. Esito della ricerca web (2026-10-10): found 40, none 22. Le schede invitano la cantina ad aggiungerli.
- `agriarcuata-soc-coop-agricola` Agriarcuata Soc. Coop. Agricola — none: Trovata solo scheda italia.it di 'Agriarquata' (cantina vitivinicola e pizzeria, Pescara del Tronto) senza nomi di vini; nessuna fonte esterna con etichette
- `amadio-vini-s-r-l` AMADIO VINI S.R.L. — none: Nessun risultato su amadiovini.it (anche extended); ricerche aperte restituiscono solo Tenuta Amadio (Veneto, omonimia).
- `aniballi` Aniballi — none: Sito aniballivini.com indicizzato solo in home page (indirizzo Novilara), senza nomi di vini; unica menzione esterna: elenco produttori evento Vignaioli al Castello, senza vini.
- `az-agr-la-collina-di-tomassini-luciana` AZ. AGR. LA COLLINA DI TOMASSINI LUCIANA — none: sangiovese.it è 'Sangiovese wine by Cantina Bianchini' (Cartoceto) con footer La Collina, ma nessun nome di vino specifico; nessuna fonte esterna su Tomassini
- `az-agr-vallerosa-di-mannocchi-s-c-s-s` Az. Agr. Vallerosa di Mannocchi S. & C. S.S. — none: Nessuna fonte su Vallerosa di Mannocchi; 'Campo Vallerosa' e' un Pecorino di Emanuele Dianetti (contrada Vallerosa di Carassai), altra cantina: scartato.
- `az-agricola-bastianelli-francesco` Az. Agricola Bastianelli Francesco — none: Cantina Bastianelli (Monte San Pietrangeli, fondata 2011 da Francesco e Pamela) esiste su winetourism.com con vitigni e tipologie, ma nessun nome di vino specifico trovato
- `azienda-agricola-bartolacci-di-pierini-monica-e-matteo` AZIENDA AGRICOLA BARTOLACCI DI PIERINI MONICA E MATTEO — none: il sito bartolacci.it ha una pagina 'Vino' (agricampeggio biologico che vende vino, olio, miele) ma nessun nome di vino indicizzato; nessuna fonte esterna
- `azienda-agricola-federico-castellucci` AZIENDA AGRICOLA FEDERICO CASTELLUCCI — none: nessun risultato su Federico Castellucci a Montecarotto (solo omonimi/altre cantine)
- `azienda-agricola-pagliari-gabriele` AZIENDA AGRICOLA PAGLIARI GABRIELE — none: Dominio pagliariaziendaagricola.it senza risultati (anche extended); nessuna fonte esterna che nomini vini Pagliari.
- `borioni-gianni-e-beltrani-anna-maria-s-s` BORIONI GIANNI E BELTRANI ANNA MARIA S.S — none: nessun risultato sull'azienda ad Apiro; solo altre cantine (Andrea Felici)
- `cantina-buongarzoni` Cantina Buongarzoni — none: Nessun risultato per il nome Buongarzoni, ne' sito ne' fonti esterne
- `cantina-di-esanatoglia` Cantina di Esanatoglia — none: nessuna fonte su una cantina a Esanatoglia; risultati solo su altre cantine di Matelica
- `cantina-fortezza-marche` Cantina Fortezza Marche — none: nessuna fonte su 'Cantina Fortezza' ad Acquaviva Picena (solo altre cantine della zona)
- `cantina-le-colline` Cantina Le Colline — none: Nessuna fonte trovata su una cantina 'Le Colline' a Tolentino; risultati solo su omonimi di altre regioni.
- `cantina-marzialetti` Cantina Marzialetti — none: nessun sito; nessuna fonte online collega il nome Marzialetti a una cantina o a vini (risultati solo su omonimi 'Torre' e info generiche Marche)
- `cantina-rovelli` Cantina Rovelli — none: nessuna fonte su Cantina Rovelli a Pergola (risultati solo Villa Ligi e omonimi)
- `cantina-stefano-maccaroni` Cantina Stefano Maccaroni — none: Nessuna fonte su Stefano Maccaroni o cantina Maccaroni a Recanati.
- `cantina-tavio` Cantina Tavio — ricerca web non ancora eseguita
- `cantina-tiberi` CANTINA TIBERI — none: Solo scheda generica enprimeurclub (Tiberi Loro Piceno) senza nomi di vini; podcast 'Cantina Tiberi' senza localita'; altri risultati su Tiberini/Tiberio (Toscana/Abruzzo), scartati
- `cantina-valdimiro` cantina valdimiro — none: Solo schede winetourism.com (Verdicchio di Matelica, Montepulciano, Cabernet; una 'riserva' citata in recensioni) senza nomi di vini; nessun sito
- `cantina-vitula` Cantina Vitula — none: il dominio cantinavitula.com non restituisce risultati (anche extended); nessuna fonte esterna
- `cantina-zamponi` Cantina Zamponi — ricerca web non ancora eseguita
- `cantine-paci` Cantine Paci — none: Il sito cantine-paci.com (Montegaudio di Pesaro, biologico dal 1977) non mostra nei risultati un elenco vini; nessuna fonte esterna. Ricerca interrotta: limite di ricerche web esaurito, da riprovare.
- `cantine-politi` Cantine Politi — ricerca web non ancora eseguita
- `casa-pierini` Casa Pierini — ricerca web non ancora eseguita
- `casa-vinicola-bruni` Casa Vinicola Bruni — ricerca web non ancora eseguita
- `centanni-giacomo-az-agr` Centanni Giacomo Az. Agr. — ricerca web non ancora eseguita
- `cherubini` Cherubini — ricerca web non ancora eseguita
- `cignano` Cignano — ricerca web non ancora eseguita
- `collemara` COLLEMARA — ricerca web non ancora eseguita
- `collestefano` ColleStefano — ricerca web non ancora eseguita
- `conti-di-buscareto` Conti di Buscareto — ricerca web non ancora eseguita
- `conti-maria` Conti Maria — none: Sito contimaria.it indicizzato solo con home/chi siamo/contatti, sezione 'I nostri vini' senza nomi; nessuna fonte esterna.
- `contrada-contro` Contrada Contro — ricerca web non ancora eseguita
- `corinaldesi-vignaioli-artigiani` CORINALDESI - Vignaioli Artigiani — ricerca web non ancora eseguita
- `cossignani-l-e-tempo` Cossignani L.E. Tempo — ricerca web non ancora eseguita
- `crocevia` Crocevia — ricerca web non ancora eseguita
- `de-angelis-c-srl` De Angelis & C. SRL — ricerca web non ancora eseguita
- `de-leyva-di-leva-davide-az-agr` DE LEYVA DI LEVA DAVIDE AZ. AGR. — ricerca web non ancora eseguita
- `dianetti` Dianetti — ricerca web non ancora eseguita
- `domodimonti` Domodimonti — ricerca web non ancora eseguita
- `eredi-cesaroni-srl-soc-agr` EREDI CESARONI SRL SOC. AGR. — ricerca web non ancora eseguita
- `failoni-rocco` FAILONI ROCCO — ricerca web non ancora eseguita
- `fattoria-colmone-della-marca` Fattoria Colmone della Marca — ricerca web non ancora eseguita
- `fattoria-fontegeloni` Fattoria Fontegeloni — ricerca web non ancora eseguita
- `fattoria-gens-camuria-soc-coop-agricola` FATTORIA GENS CAMURIA SOC.COOP AGRICOLA — ricerca web non ancora eseguita
- `fattoria-nanni` Fattoria Nannì — ricerca web non ancora eseguita
- `fattoria-san-lorenzo-di-crognaletti-natalino` FATTORIA SAN LORENZO DI CROGNALETTI NATALINO — ricerca web non ancora eseguita
- `fattoria-villa-ligi` FATTORIA VILLA LIGI — ricerca web non ancora eseguita
- `filodivino` Filodivino — ricerca web non ancora eseguita
- `finocchi-sandro-azienda-agraria` FINOCCHI SANDRO AZIENDA AGRARIA — ricerca web non ancora eseguita
- `finocchi-viticoltori` Finocchi Viticoltori — ricerca web non ancora eseguita
- `fiorano-az-agr` FIORANO AZ. AGR. — ricerca web non ancora eseguita
- `fioretti-brera` Fioretti Brera — ricerca web non ancora eseguita
- `fratelli-badiali` Fratelli Badiali — ricerca web non ancora eseguita
- `fulvia-tombolini` Fulvia Tombolini — ricerca web non ancora eseguita
- `gatti-marco` GATTI MARCO — ricerca web non ancora eseguita
- `geminiani-wine` Geminiani Wine — ricerca web non ancora eseguita
- `giorgetti-andrea` GIORGETTI ANDREA — ricerca web non ancora eseguita
- `guerri-giorgio` GUERRI GIORGIO — ricerca web non ancora eseguita
- `i-sassi-di-san-giuseppe` I SASSI DI SAN GIUSEPPE — ricerca web non ancora eseguita
- `il-conte-villa-prandone` IL CONTE VILLA PRANDONE — ricerca web non ancora eseguita
- `il-conventino-di-monteciccardo-sas-societa-agricola` IL CONVENTINO DI MONTECICCARDO SAS SOCIETA’ AGRICOLA — ricerca web non ancora eseguita
- `la-fontursia` La Fontursia — ricerca web non ancora eseguita
- `la-lepre-e-la-luna` La Lepre e la Luna — ricerca web non ancora eseguita
- `la-marca-di-san-michele` La Marca di San Michele — ricerca web non ancora eseguita
- `la-meravigna` La Meravigna — ricerca web non ancora eseguita
- `la-montata` La Montata — ricerca web non ancora eseguita
- `la-valle-del-sole` La Valle Del Sole — ricerca web non ancora eseguita
- `la-villa-mergo` La Villa Mergo — ricerca web non ancora eseguita
- `laila-libenzi-azienda-agricola-di-chiara-refe` LAILA LIBENZI AZIENDA AGRICOLA DI CHIARA REFE — ricerca web non ancora eseguita
- `le-senate-az-agr-di-visi-giulio` LE SENATE AZ. AGR. DI VISI GIULIO — ricerca web non ancora eseguita
- `lucchetti` Lucchetti — ricerca web non ancora eseguita
- `lucidimezzo` LucidiMezzo — ricerca web non ancora eseguita
- `luigi-giusti` Luigi Giusti — ricerca web non ancora eseguita
- `lumavite` Lumavite — ricerca web non ancora eseguita
- `macondo` Macondo — ricerca web non ancora eseguita
- `madonnabruna` Madonnabruna — ricerca web non ancora eseguita
- `marchetti` Marchetti — ricerca web non ancora eseguita
- `marconi-vini` Marconi Vini — ricerca web non ancora eseguita
- `mazzola` MAZZOLA — ricerca web non ancora eseguita
- `moncaro` Moncaro — ricerca web non ancora eseguita
- `montecappone` Montecappone — ricerca web non ancora eseguita
- `montecoriolano-casalis-douhet` Montecoriolano Casalis Douhet — ricerca web non ancora eseguita
- `moroder` Moroder — ricerca web non ancora eseguita
- `murola` Muròla — ricerca web non ancora eseguita
- `oasi-degli-angeli` Oasi degli Angeli — ricerca web non ancora eseguita
- `officina-del-sole` Officina del Sole — ricerca web non ancora eseguita
- `oppeddentro` Oppeddentro — ricerca web non ancora eseguita
- `peruzzi-liana` Peruzzi Liana — ricerca web non ancora eseguita
- `piantate-lunghe` Piantate Lunghe — ricerca web non ancora eseguita
- `pieri` Pieri — ricerca web non ancora eseguita
- `piersanti` Piersanti — ricerca web non ancora eseguita
- `pietro17-winery` PIETRO17 WINERY — ricerca web non ancora eseguita
- `pilandro` Pilandro — ricerca web non ancora eseguita
- `podere-linfinito-soc-semplice-agricola` PODERE L’INFINITO SOC. SEMPLICE AGRICOLA — ricerca web non ancora eseguita
- `podere-santa-lucia` Podere Santa Lucia — ricerca web non ancora eseguita
- `poderi-san-lazzaro` PODERI SAN LAZZARO — ricerca web non ancora eseguita
- `ripawine-soc-coop-agricola` Ripawine Soc. Coop. Agricola — ricerca web non ancora eseguita
- `rocca-dei-forti` Rocca dei Forti — ricerca web non ancora eseguita
- `ronconi-ex-badiali-candelaresi` Ronconi (ex Badiali&Candelaresi) — ricerca web non ancora eseguita
- `root-s-r-l-societa-agricola` ROOT S.R.L. SOCIETA’ AGRICOLA — ricerca web non ancora eseguita
- `sabbionare` Sabbionare — ricerca web non ancora eseguita
- `saladini-pilastri-srl-soc-agricola` Saladini Pilastri Srl Soc. Agricola — ricerca web non ancora eseguita
- `san-giovanni-soc-agricola-srl` San Giovanni Soc. Agricola Srl — ricerca web non ancora eseguita
- `santa-barbara` Santa Barbara — ricerca web non ancora eseguita
- `santa-cassella` Santa Cassella — ricerca web non ancora eseguita
- `santa-liberata-di-savini-giorgio-az-agricola` Santa Liberata di Savini Giorgio Az. Agricola — ricerca web non ancora eseguita
- `sassodivino` SASSODIVINO — ricerca web non ancora eseguita
- `sauie-srl-az-agr-montecoriolano` SAUIE SRL – AZ. AGR. MONTECORIOLANO — ricerca web non ancora eseguita
- `sauro-carletti` Sauro Carletti — ricerca web non ancora eseguita
- `sciauerta` Sciauerta — ricerca web non ancora eseguita
- `selvagrossa` Selvagrossa — ricerca web non ancora eseguita
- `serboni-massimo-azienda-agricola` SERBONI MASSIMO AZIENDA AGRICOLA — ricerca web non ancora eseguita
- `sergio-marani` Sergio Marani — ricerca web non ancora eseguita
- `soc-agr-la-pila-di-matteo-toniolo-s-s` Soc. Agr. La Pila di Matteo Toniolo S.S. — ricerca web non ancora eseguita
- `soc-agr-montebianco120-s-s` SOC. AGR. MONTEBIANCO120 S.S. — ricerca web non ancora eseguita
- `soc-agricola-san-filippo-s-s` Soc. Agricola San Filippo S.S. — ricerca web non ancora eseguita
- `soc-agr-vini-gagliardi-gino-di-gagliardi-lara-e-umberto-snc` SOC.AGR.VINI GAGLIARDI GINO DI GAGLIARDI LARA E UMBERTO SNC — ricerca web non ancora eseguita
- `socci` SOCCI — ricerca web non ancora eseguita
- `societa-agricola-bucchini-davide-e-romani-stefania-s-s` SOCIETÀ AGRICOLA BUCCHINI DAVIDE E ROMANI STEFANIA S.S. — ricerca web non ancora eseguita
- `societa-agricola-capriotti` SOCIETÀ AGRICOLA CAPRIOTTI — ricerca web non ancora eseguita
- `societa-agricola-fausti-srl` Società Agricola Fausti Srl — ricerca web non ancora eseguita
- `societa-agricola-ronconi-di-ronconi-samuele-c-s-s` SOCIETA’ AGRICOLA RONCONI DI RONCONI SAMUELE & C. S.S. — ricerca web non ancora eseguita
- `societa-agricola-villa-lazzarini-srl` SOCIETA’ AGRICOLA VILLA LAZZARINI SRL — ricerca web non ancora eseguita
- `spallacci-giordano` SPALLACCI GIORDANO — ricerca web non ancora eseguita
- `sparapani-snc-di-sparapani-giuseppe-c` SPARAPANI SNC DI SPARAPANI GIUSEPPE & C. — ricerca web non ancora eseguita
- `stefano-mancinelli` Stefano Mancinelli — ricerca web non ancora eseguita
- `strologo` Strologo — ricerca web non ancora eseguita
- `tenimenti-le-ginestre-srl` Tenimenti Le Ginestre Srl — ricerca web non ancora eseguita
- `tenimenti-spinsanti-spinsanti-catia` TENIMENTI SPINSANTI - SPINSANTI CATIA — ricerca web non ancora eseguita
- `tenuta-agricola-la-riserva-di-mattioli-dina` Tenuta Agricola La Riserva di Mattioli Dina — ricerca web non ancora eseguita
- `tenuta-barbarossa` Tenuta Barbarossa — ricerca web non ancora eseguita
- `tenuta-ca-sciampagne` Tenuta Ca' Sciampagne — ricerca web non ancora eseguita
- `tenuta-carlini-di-andrea-carlini` TENUTA CARLINI DI ANDREA CARLINI — ricerca web non ancora eseguita
- `tenuta-cocci-grifoni` Tenuta Cocci Grifoni — ricerca web non ancora eseguita
- `tenuta-colpaola` Tenuta Colpaola — ricerca web non ancora eseguita
- `tenuta-conte-lucangeli` Tenuta Conte Lucangeli — ricerca web non ancora eseguita
- `tenuta-dell-ugolino` Tenuta dell'Ugolino — ricerca web non ancora eseguita
- `tenuta-di-fra` Tenuta di Frà — ricerca web non ancora eseguita
- `tenuta-di-pirano` Tenuta di Pirano — ricerca web non ancora eseguita
- `tenuta-grimaldi` Tenuta Grimaldi — ricerca web non ancora eseguita
- `tenuta-manoylo-by-moresco-soc-agr-semplice` Tenuta Manoylo by Moresco Soc. Agr. Semplice — ricerca web non ancora eseguita
- `tenuta-marino` Tenuta Marino — ricerca web non ancora eseguita
- `tenuta-mattei` Tenuta Mattei — ricerca web non ancora eseguita
- `tenuta-musone` Tenuta Musone — ricerca web non ancora eseguita
- `tenuta-piano-di-rustano` Tenuta Piano di Rustano — ricerca web non ancora eseguita
- `tenuta-san-marcello` Tenuta San Marcello — ricerca web non ancora eseguita
- `tenuta-san-martino-di-cerioni-mauro` TENUTA SAN MARTINO DI CERIONI MAURO — ricerca web non ancora eseguita
- `tenuta-santi-giacomo-e-filippo` Tenuta Santi Giacomo e Filippo — ricerca web non ancora eseguita
- `tenuta-seghetti-panichi` Tenuta Seghetti Panichi — ricerca web non ancora eseguita
- `tenuta-siliquini` Tenuta Siliquini — ricerca web non ancora eseguita
- `tenuta-spinelli-di-spinelli-simone` Tenuta Spinelli di Spinelli Simone — ricerca web non ancora eseguita
- `tenute-del-borgo` Tenute del Borgo — ricerca web non ancora eseguita
- `tenute-il-crinale-di-quitadamo-michele` Tenute Il Crinale di Quitadamo Michele — ricerca web non ancora eseguita
- `tenute-malavolta` Tenute Malavolta — ricerca web non ancora eseguita
- `tenute-polini-societa-agricola-semplice` Tenute Polini Società Agricola Semplice — ricerca web non ancora eseguita
- `tenute-priori-galdelli` Tenute Priori & Galdelli — ricerca web non ancora eseguita
- `tenute-recchi-franceschini-eredi-az-agr-la-via-sistina` Tenute Recchi Franceschini Eredi Az. Agr. La Via Sistina — ricerca web non ancora eseguita
- `tenute-urani` Tenute Urani — ricerca web non ancora eseguita
- `terra-argillosa` Terra Argillosa — ricerca web non ancora eseguita
- `terra-divina` Terra Divina — ricerca web non ancora eseguita
- `terra-libera` Terra Libera — ricerca web non ancora eseguita
- `terra-premiata-di-graziano-mazza-figli` Terra Premiata di Graziano Mazza & Figli — ricerca web non ancora eseguita
- `terracruda` Terracruda — ricerca web non ancora eseguita
- `terrafageto` TERRAFAGETO — ricerca web non ancora eseguita
- `terre-cerquaferrata` Terre Cerquaferrata — ricerca web non ancora eseguita
- `terre-cortesi-moncaro-soc-coop` Terre Cortesi Moncaro Soc. Coop. — ricerca web non ancora eseguita
- `terre-d-arengo` Terre d'Arengo — ricerca web non ancora eseguita
- `terre-di-san-ginesio` Terre di San Ginesio — ricerca web non ancora eseguita
- `terre-di-serrapetrona-societa-agricola-semplice` TERRE DI SERRAPETRONA SOCIETA’ AGRICOLA SEMPLICE — ricerca web non ancora eseguita
- `tomassetti` tomassetti. — ricerca web non ancora eseguita
- `torretti-walter` TORRETTI WALTER — ricerca web non ancora eseguita
- `valter-mattoni` Valter Mattoni — ricerca web non ancora eseguita
- `vara-pesaresi-vignaioli` VARÀ PESARESI VIGNAIOLI — ricerca web non ancora eseguita
- `veneranda-vite` Veneranda Vite — ricerca web non ancora eseguita
- `venturi-roberto` Venturi Roberto — ricerca web non ancora eseguita
- `verser-cantina-e-vigneti` VerSer | Cantina e Vigneti — ricerca web non ancora eseguita
- `vicari` Vicari — ricerca web non ancora eseguita
- `viconari` Viconari — ricerca web non ancora eseguita
- `vigna-degli-estensi` Vigna degli Estensi — ricerca web non ancora eseguita
- `vigna-della-cava` Vigna della Cava — ricerca web non ancora eseguita
- `vignamato` Vignamato — ricerca web non ancora eseguita
- `vigne-di-leo-tre-castelli` Vigne di Leo – Tre Castelli — ricerca web non ancora eseguita
- `vigneto-fernando-alberto` Vigneto Fernando Alberto — ricerca web non ancora eseguita
- `villa-forano` Villa Forano — ricerca web non ancora eseguita
- `villa-imperium` Villa Imperium — ricerca web non ancora eseguita
- `villa-manu` Villa Manù — ricerca web non ancora eseguita
- `villa-romita-di-brugiaferri-maurilio-e-giorgi-simonetta-s` VILLA ROMITA DI BRUGIAFERRI MAURILIO E GIORGI SIMONETTA S. — ricerca web non ancora eseguita
- `vini-accattoli` Vini Accattoli — ricerca web non ancora eseguita
- `vini-firmanum` Vini Firmanum — ricerca web non ancora eseguita
- `vini-maraviglia` Vini Maraviglia — ricerca web non ancora eseguita
- `vini-montesanto` Vini Montesanto — ricerca web non ancora eseguita
- `vini-muraro` Vini Muraro — ricerca web non ancora eseguita
- `vini-rocchi` Vini Rocchi — ricerca web non ancora eseguita
- `vini-simonetti` Vini Simonetti — ricerca web non ancora eseguita
- `vini-valmusone` Vini Valmusone — ricerca web non ancora eseguita
- `vinicola-carassanese` Vinicola Carassanese — ricerca web non ancora eseguita
- `vinicola-del-tesino-srl` Vinicola del Tesino Srl — ricerca web non ancora eseguita
- `vinidicagnore` ViniDiCagnore — ricerca web non ancora eseguita
- `vitali-augusto` VITALI AUGUSTO — ricerca web non ancora eseguita
- `vitivinicola-costadoro-soc-agr-srl` Vitivinicola Costadoro Soc. Agr. Srl — ricerca web non ancora eseguita
- `vitivinicola-dangelo-s-s-a` Vitivinicola D’Angelo S.S.A. — ricerca web non ancora eseguita
- `vittorini-di-nico-speranza` Vittorini di Nico Speranza — ricerca web non ancora eseguita
- `zaccagnini` Zaccagnini — ricerca web non ancora eseguita

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
