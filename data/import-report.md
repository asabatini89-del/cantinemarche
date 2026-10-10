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
| Vini importati | 2537 (2463 pubblicati, 74 in bozza perché non sono vini) |
| — di cui anteprime dal portale | 1494 |
| — di cui da ricerca web, con URL di prova | 1042 su 186 cantine (sito-cantina: 956, rivenditore: 46, altro: 27, guida: 14) |
| Cantine pubblicate con almeno un vino | 306 su 365 |
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
- `agriarcuata-soc-coop-agricola`: sito non valido “#”, scartato
- `az-agr-vallerosa-di-mannocchi-s-c-s-s`: sito non valido “#”, scartato
- `az-agricola-bastianelli-francesco`: sito non valido “#”, scartato
- `societa-agricola-capriotti`: sito ripulito da “http://www.societaagricolacapriotti.com target=” a http://www.societaagricolacapriotti.com
- `tenimenti-le-ginestre-srl`: sito non valido “#”, scartato

### 7. Cantine ancora senza vini
59 cantine pubblicate non hanno vini con una fonte verificabile. Esito della ricerca web (2026-10-10): found 186, none 49. Le schede invitano la cantina ad aggiungerli.
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
- `cantina-tiberi` CANTINA TIBERI — none: Solo scheda generica enprimeurclub (Tiberi Loro Piceno) senza nomi di vini; podcast 'Cantina Tiberi' senza localita'; altri risultati su Tiberini/Tiberio (Toscana/Abruzzo), scartati
- `cantina-valdimiro` cantina valdimiro — none: Solo schede winetourism.com (Verdicchio di Matelica, Montepulciano, Cabernet; una 'riserva' citata in recensioni) senza nomi di vini; nessun sito
- `cantina-vitula` Cantina Vitula — none: il dominio cantinavitula.com non restituisce risultati (anche extended); nessuna fonte esterna
- `cantina-zamponi` Cantina Zamponi — none: Sul dominio solo la pagina contatti (Az. Agr. Zamponi Mirco, C.da Forchiusa, Serra San Quirico); nessun nome di vino né fonti esterne.
- `cantine-paci` Cantine Paci — none: Il sito cantine-paci.com (Montegaudio di Pesaro, biologico dal 1977) non mostra nei risultati un elenco vini; nessuna fonte esterna. Ricerca interrotta: limite di ricerche web esaurito, da riprovare.
- `casa-pierini` Casa Pierini — none: Nessun risultato per 'Casa Pierini' a Pesaro/Marche; solo omonimi (Pierini e Brugi in Toscana, Casa Pierina altrove) scartati.
- `casa-vinicola-bruni` Casa Vinicola Bruni — none: Nessuna fonte su 'Casa Vinicola Bruni' a Monteprandone; i risultati riguardano altre cantine (Il Conte Villa Prandone, Saladini Pilastri) e sono stati scartati.
- `cignano` Cignano — none: Dominio cantinacignano.it senza risultati. Articolo Gazzetta del Gusto sui produttori 'Bianchello d'Autore' cita Cantina Cignano con Bianco Assoluto e San Leone Bianchello del Metauro (URL = primo risultato per la ricerca esatta, da verificare). Anche delectable.com/wine/cignano/bianchello-del-metauro/2020 elenca un Bianchello del Metauro Cignano (probabilmente lo stesso San Leone, non aggiunto per evitare doppioni).
- `conti-maria` Conti Maria — none: Sito contimaria.it indicizzato solo con home/chi siamo/contatti, sezione 'I nostri vini' senza nomi; nessuna fonte esterna.
- `corinaldesi-vignaioli-artigiani` CORINALDESI - Vignaioli Artigiani — none: Nessun risultato per Corinaldesi a Osimo né come produttore di vino; risultati solo su altre cantine (Umani Ronchi, Coroncino) scartati.
- `crocevia` Crocevia — none: Dominio agricolacrocevia.it senza risultati; nessuna fonte esterna su Crocevia a Montegiorgio (solo omonimi come Crocizia, Crocedimezzo, scartati).
- `fattoria-fontegeloni` Fattoria Fontegeloni — none: Il sito parla di circa 27 ha di vigneti Verdicchio DOC, olio e ospitalità, ma nessuna etichetta di vino; nessuna fonte esterna.
- `finocchi-sandro-azienda-agraria` FINOCCHI SANDRO AZIENDA AGRARIA — none: Nessuna fonte nomina Finocchi Sandro. Esiste Finocchi Viticoltori (Staffolo, famiglia Finocchi, vino Vivolo) ma il collegamento con questa ragione sociale non è dimostrato.
- `guerri-giorgio` GUERRI GIORGIO — none: Sito cantinaguerri.it non indicizzato; ricerche aperte senza risultati pertinenti (solo altre cantine di San Marcello).
- `i-sassi-di-san-giuseppe` I SASSI DI SAN GIUSEPPE — none: Solo schede di agriturismo (trip.com, kayak) che citano una cantina annessa, nessun nome di vino.
- `la-meravigna` La Meravigna — none: Nessun risultato su 'La Meravigna'; solo altre cantine dell'area di Ancona.
- `peruzzi-liana` Peruzzi Liana — none: nessuna fonte che colleghi Peruzzi Liana/Monte Roberto a vini; esistono citazioni di un 'Peruzzi' Verdicchio Metodo Classico Dosage Zero (jancisrobinson, ilfattoquotidiano) ma senza localita': non attribuito
- `piantate-lunghe` Piantate Lunghe — none: piantatelunghe.it senza risultati; solo il Rosso Conero DOC (vigna 'degli angeli') da listino trovaprezzi
- `sassodivino` SASSODIVINO — none: sito sassodivino.it indicizzato solo in home (vino e olio biologico, e-commerce) senza nomi dei vini; nessuna fonte esterna
- `sauie-srl-az-agr-montecoriolano` SAUIE SRL – AZ. AGR. MONTECORIOLANO — none: nessun sito; nessun risultato per Montecoriolano / Sauie srl a Potenza Picena
- `sauro-carletti` Sauro Carletti — none: nessun sito; nessun risultato su Sauro Carletti a Camerano (solo omonimi Carletti di Poliziano, Toscana: scartati)
- `sciauerta` Sciauerta — none: sciauerta.it indicizzato solo in home senza contenuti su prodotti; nessuna fonte esterna (risultati solo su Cossignani, altra cantina: scartati)
- `tenimenti-le-ginestre-srl` Tenimenti Le Ginestre Srl — none: Nessun sito e nessuna fonte su Tenimenti Le Ginestre a Ripatransone; i risultati 'Le Ginestre' riguardano omonimi in Veneto (Lazise) e Piemonte (Grinzane Cavour), scartati.
- `tenuta-di-pirano` Tenuta di Pirano — none: Nessun sito e nessuna fonte esterna trovata per Tenuta di Pirano a Tavullia (risultati solo su Pirano/Slovenia e altre cantine).
- `tenuta-seghetti-panichi` Tenuta Seghetti Panichi — none: dominio indicato filippopanichi.it (Az. Agrivitivinicola Filippo Panichi, Via Scirola 37, Castel di Lama): trovata solo la scheda del Verdone; nessun altro vino indicizzato. Ricerca aperta 'Seghetti Panichi' restituisce solo il Borgo Storico (villa/hotel).
- `tenute-il-crinale-di-quitadamo-michele` Tenute Il Crinale di Quitadamo Michele — none: il sito ilcrinale.it (agriturismo con cantina, Castorano) non elenca vini. Unica fonte esterna: vinovoss 'Il Crinale Sprigione', rosso delle Marche (Montepulciano/Cabernet/Merlot); fonte aggregatore di qualità incerta, verificare.
- `terre-cerquaferrata` Terre Cerquaferrata — none: nessun sito; nessun risultato che citi Terre Cerquaferrata (solo altre cantine del Piceno)
- `torretti-walter` TORRETTI WALTER — none: nessun sito; nessun risultato che citi Torretti Walter ad Arcevia
- `vara-pesaresi-vignaioli` VARÀ PESARESI VIGNAIOLI — none: vara.it restituisce solo una home 'Vara S.r.l.' senza riferimenti al vino; nessuna fonte esterna su Varà Pesaresi Vignaioli
- `viconari` Viconari — none: nessun sito; nessun risultato che citi Viconari (solo altre cantine di Montefiore dell'Aso)
- `vini-firmanum` Vini Firmanum — none: Nessun risultato che citi 'Firmanum' come cantina/vino a Montottone; nessun sito, nessuna fonte esterna
- `vini-muraro` Vini Muraro — none: Solo la home del sito (Azienda Vitivinicola Muraro Gloria, Borgo Massano; 'produzione IGT Marche e Romagna') senza nomi di vini; nessuna fonte esterna
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
- **Vini da ricerca web:** per le cantine senza anteprime nell'export, i vini vengono da `data/vini-ricerca-2026-10-10.json` (`source = 'import'`, `evidence_type = websearch-…`). Ogni vino ha l'URL della pagina che lo collega alla cantina (sito della cantina, enoteca, guida o consorzio); niente URL costruiti, niente tipologie dedotte. Scartati alla revisione: prove che non nominano la cantina, pagine di comparazione prezzi, bevande aromatizzate che per legge non sono vino (Fragolino).
- **Immagini:** gli URL delle foto dei siti delle cantine sono conservati in `external_image_url` ma non vanno mostrati né copiati su R2 senza il consenso della cantina (coerente con `LICENSE-coordinates.md`: nessuna fotografia proprietaria ripubblicata).
