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
| Cantine con servizi (degustazioni, visite, vendita) | 98 |
| Vini importati | 2714 (2640 pubblicati, 74 in bozza perché non sono vini) |
| — di cui anteprime dal portale | 1494 |
| — di cui da ricerca web, con URL di prova | 1175 su 214 cantine (sito-cantina: 1020, altro: 55, rivenditore: 87, guida: 14) |
| — di cui dal completamento delle schede | 44 su 16 cantine (2 doppioni scartati) |
| Cantine pubblicate con almeno un vino | 336 su 365 |
| Esperienze (degustazioni, visite, pranzi, ospitalità) | 19 su 14 cantine |
| Servizi aggiunti dal completamento | 47 |
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
29 cantine pubblicate non hanno vini con una fonte verificabile. Esito della ricerca web (2026-10-10): found 214, none 31. Le schede invitano la cantina ad aggiungerli.
- `amadio-vini-s-r-l` AMADIO VINI S.R.L. — none: Secondo giro: provati 'Amadio Verdicchio Maiolati Spontini', allowed_domains facebook/instagram/vivino e 'Amadio vini Moie'; solo Tenuta Amadio (Veneto), Amadio (Australia) e altre attività omonime: scartati.
- `aniballi` Aniballi — none: Secondo giro: ricerca aperta 'Aniballi Novilara vino Colli Pesaresi' (solo evento Vignaioli al Castello, localita Cerreto Pesaro), allowed_domains instagram/facebook/vivino (trovata pagina Facebook 'Azienda agricola Aniballi' Pesaro: produce vini, olio e frutta, ma nessun nome di vino), ricerca aperta con vitigni (nessun risultato pertinente).
- `az-agr-la-collina-di-tomassini-luciana` AZ. AGR. LA COLLINA DI TOMASSINI LUCIANA — none: Secondo giro: ricerca aperta '"La Collina" Cartoceto Bianchello Tomassini' (solo omonimi La Collina in Lombardia/Toscana), ricerca 'Bianchini Cartoceto' per il marchio di sangiovese.it (solo Ciacci Piccolomini/Montalcino), ricerca su facebook/instagram/vivino (solo omonimi in Lombardia, Emilia-Romagna). Nessuna prova.
- `az-agr-vallerosa-di-mannocchi-s-c-s-s` Az. Agr. Vallerosa di Mannocchi S. & C. S.S. — none: Secondo giro: provati 'Mannocchi Carassai vino azienda agricola', allowed_domains facebook/instagram/vivino/vinipiceni con 'Vallerosa Carassai Mannocchi' e 'Mannocchi' + denominazioni picene; usciti solo Dianetti (Carassai), Vallerosa Bonci (Cupramontana) e un'azienda olearia Vallerosa nel Lazio: scartati.
- `azienda-agricola-bartolacci-di-pierini-monica-e-matteo` AZIENDA AGRICOLA BARTOLACCI DI PIERINI MONICA E MATTEO — none: Secondo giro: ricerca aperta su agricampeggio/Bianchello (solo schede campeggio vansite/campcation: vigneto di Bianchello e degustazioni, nessun nome di vino), facebook/instagram/vivino (Instagram ufficiale @azienda_agraria_bartolacci di Matteo Pierini senza vini citati), dominio bartolacci.it con parole 'Bianchello rosso spumante' (solo pagine generiche: lo spaccio vende vino bio). Nessuna etichetta trovata.
- `borioni-gianni-e-beltrani-anna-maria-s-s` BORIONI GIANNI E BELTRANI ANNA MARIA S.S — none: Secondo giro: ricerca aperta 'Borioni Apiro Verdicchio' (solo Andrea Felici e altre cantine), ricerca facebook/instagram/vivino/winedering: esiste la pagina Facebook 'Azienda Vitivinicola Borioni Gianni & Beltrani Anna Maria' (https://www.facebook.com/p/Azienda-Vitivinicola-Borioni-Gianni-Beltrani-Anna-Maria-100054607412611/) ma senza nomi di vini nei risultati; ricerca '"Borioni Gianni" Verdicchio Montepulciano etichetta' senza risultati pertinenti.
- `cantina-buongarzoni` Cantina Buongarzoni — none: Secondo giro: trovata la pagina Facebook ufficiale https://www.facebook.com/CantinaBuongarzoni/ (Macerata, 'Vini naturalmente Bio') ma senza nomi di vini nei risultati; provati anche '"Cantina Buongarzoni" vino naturale' e instagram/facebook 'bottiglia etichetta': nessuna etichetta.
- `cantina-fortezza-marche` Cantina Fortezza Marche — none: Secondo giro: ricerca su facebook/instagram/vivino/winedering (solo la Fortezza medievale/Palio, Cherri d'Acquaviva e omonimo 'La Fortezza' di Torrecuso BN, scartati), frase esatta '"Fortezza Marche" vino' (nessun risultato pertinente), '"Cantina Fortezza" Offida Pecorino Rosso Piceno Acquaviva' (solo Cantina Offida). Nessuna prova.
- `cantina-marzialetti` Cantina Marzialetti — none: Secondo giro: allowed_domains facebook/instagram/vivino 'Marzialetti Torre San Patrizio vino cantina' (solo pagine del Comune e omonimi 'Torre'/'Patrizi'); ricerca aperta '"Marzialetti" azienda agricola vini Fermo' e '"Marzialetti" Falerio Rosso Piceno Passerina': nessun risultato che nomini Marzialetti.
- `cantina-vitula` Cantina Vitula — none: Secondo giro: provati allowed_domains facebook/instagram/vivino/winedering con 'Vitula cantina San Severino Marche', ricerca aperta '"Vitula" vino Marche Macerata' e 'cantinavitula': nessuna pagina della cantina (solo VerSer, altra cantina di San Severino, e omonimie non vinicole).
- `cantina-zamponi` Cantina Zamponi — none: Secondo giro: allowed_domains facebook/instagram/vivino (trovata pagina Facebook 'Azienda Agricola Zamponi Mirco', Serra San Quirico: 'coltivazione e produzione di vino Verdicchio e produzione zootecnica', ma nessun nome di vino); ricerca aperta '"Zamponi Mirco" Verdicchio dei Castelli di Jesi' (nessun risultato pertinente); dominio aziendaagricolazamponi.it con query diversa: ancora solo /contatti/.
- `cantine-paci` Cantine Paci — none: Secondo giro: dominio cantine-paci.com con 'Colli Pesaresi Sangiovese Bianchello Focara' (solo home: Montegaudio, bio dal 1977, certificato Suolo e Salute, nessun vino nominato), vivino/facebook/instagram/winedering con 'Paci Montegaudio' (solo altre cantine pesaresi), frase esatta '"Cantine Paci" Pesaro Sangiovese' (solo omonimi toscani). Nessuna etichetta.
- `casa-pierini` Casa Pierini — none: Secondo giro: provati allowed_domains facebook/instagram/vivino/winedering ('"Casa Pierini" vino Pesaro'), 'Pierini azienda agricola Pesaro' + Sangiovese/Bianchello e '"Casa Pierini" cantina agriturismo': solo omonimi (Casa Perini Brasile, Pierini Wine California, Pierini e Brugi Toscana, Casa Pierina Verona) e altre cantine pesaresi: scartati.
- `casa-vinicola-bruni` Casa Vinicola Bruni — none: Secondo giro: allowed_domains facebook/instagram/vivino 'Bruni vini Monteprandone' (solo Azienda Bruni di Fonteblanda/Toscana, Bruni Prosecco, Cascina Bruni Piemonte: omonimi scartati); ricerca aperta con Centobuchi e denominazioni picene; allowed_domains vinipiceni/winedering/winetourism/tannico/callmewine/gamberorosso: solo Il Conte Villa Prandone e il vitigno Incrocio Bruni. Nessuna fonte su una Casa Vinicola Bruni a Monteprandone.
- `conti-maria` Conti Maria — none: Secondo giro: trovata la pagina Facebook ufficiale https://www.facebook.com/aziendaagricolacontimaria/ (Winery/Vineyard, Fermo) ma senza nomi di vini nei risultati; contimaria.it con query sulle denominazioni (Falerio, Rosso Piceno, Passerina, Pecorino) non restituisce pagine; ricerca aperta '"Azienda Agricola Conti Maria" Fermo' solo omonimi.
- `corinaldesi-vignaioli-artigiani` CORINALDESI - Vignaioli Artigiani — none: Secondo giro: allowed_domains facebook/instagram/vivino: trovata la pagina Facebook ufficiale 'Corinaldesi - Vignaioli Artigiani' (facebook.com/corinaldesiwines, Via di Jesi 334, Casenuove di Osimo) ma senza nomi di vini; ricerche aperte 'Corinaldesi wines Casenuove Osimo Rosso Conero' e '"Corinaldesi" vino Marche ...' senza risultati sulla cantina (solo altre cantine/Corinaldo).
- `crocevia` Crocevia — none: Secondo giro: facebook/instagram/vivino/winedering 'Crocevia Montegiorgio' (solo omonimi: Cascina Galarin Crocevia Monferrato, Centro Internazionale Crocevia), ricerca aperta '"Crocevia" azienda agricola Montegiorgio Fermo vino naturale' (solo Crocizia/Emilia-Romagna, scartata), ricerca del nome di dominio 'agricolacrocevia' (nessun risultato pertinente). Nessuna prova.
- `fattoria-fontegeloni` Fattoria Fontegeloni — none: Secondo giro: allowed_domains vivino/facebook/instagram/winedering/tannico/callmewine ('Fontegeloni Verdicchio') trova solo le pagine FB/IG dell'agriturismo (case vacanza, vigneti e oliveti bio, sapa e olio), nessuna etichetta; ricerca aperta '"Fontegeloni" vino biologico bottiglia' nulla; sul sito la pagina prodotti elenca solo olio, confetture, succhi, frutta sciroppata, lavanda, timo. Vigneti presenti ma nessun vino in vendita documentato.
- `guerri-giorgio` GUERRI GIORGIO — none: Secondo giro: facebook/instagram/vivino/winedering 'Cantina Guerri San Marcello' (solo Tenuta San Marcello, Marconi Vini, Gurrieri/Sicilia), ricerca aperta 'Guerri Lacrima di Morro d'Alba Verdicchio San Marcello' (solo Filodivino, Landi, Marconi, Cesaroni), '"Guerri Giorgio" OR "Giorgio Guerri" vino' (solo omonimo Guerrieri di Piagge/Terre Roveresche, scartato). Nessuna prova.
- `i-sassi-di-san-giuseppe` I SASSI DI SAN GIUSEPPE — none: 2 vini trovati ma scartati alla revisione: attribuzione alla cantina non abbastanza certa.
- `la-meravigna` La Meravigna — none: Secondo giro: allowed_domains facebook/instagram/vivino: trovata la pagina Facebook ufficiale 'Azienda agricola La Meravigna' (facebook.com/LaMeravigna; ~2,5 ettari sulle colline di Varano, Ancona; categoria cantina/vigneto) ma senza nomi di vini; ricerche aperte 'Meravigna Varano Ancona ... Rosso Conero' e '"Meravigna" Conero': nessun risultato sulla cantina (solo Lanari, Marchetti e pagine turistiche).
- `sassodivino` SASSODIVINO — none: Secondo giro: allowed_domains facebook/instagram/vivino (trovata pagina Facebook 'Cantina SassodiVino', facebook.com/cantina.sassodivino, Sasso di Serra San Quirico, senza nomi di vini); dominio sassodivino.it con query di prodotto/carrello: nessun risultato; ricerca aperta '"SassodiVino" OR "Sasso di Vino" ... Verdicchio': solo altre cantine.
- `sauie-srl-az-agr-montecoriolano` SAUIE SRL – AZ. AGR. MONTECORIOLANO — none: Secondo giro: facebook/instagram/vivino/winedering 'Montecoriolano Potenza Picena vino' (solo Andrea Giorgetti, Grappolo d'Oro, Montesanto Magnana: altre realta', scartate), ricerca aperta '"Montecoriolano" azienda agricola vino Ribona Rosso Piceno' (nessun risultato pertinente), '"Sauie" srl Potenza Picena' (solo omonimi Saie/Sau srl fuori regione). Nessuna prova.
- `tenimenti-le-ginestre-srl` Tenimenti Le Ginestre Srl — none: Secondo giro: facebook/instagram/vivino/winedering 'Le Ginestre Ripatransone Offida Pecorino' (solo altre cantine di Ripatransone: Santori, Cocci Grifoni, Gozzana, Le Caniette), frase esatta '"Tenimenti Le Ginestre"' (solo omonimi toscani/B&B). Nessuna prova.
- `tenuta-di-pirano` Tenuta di Pirano — none: Secondo giro: trovato il profilo Instagram https://www.instagram.com/tenuta.di.pirano/ ('Agricoltori dal 1960', degustazioni vini e aperitivi in vigna) ma senza nomi di vini; provati anche ricerca aperta con Sangiovese/Colli Pesaresi e instagram/facebook/vivino con 'vino rosso bianco bollicine etichetta': nessuna etichetta.
- `terre-cerquaferrata` Terre Cerquaferrata — none: Secondo giro: provati allowed_domains vivino/facebook/instagram/winedering/vinipiceni ('Cerquaferrata vino Acquaviva Picena'), variante '"Cerqua Ferrata"' con Offida/Pecorino/Rosso Piceno e '"Terre Cerquaferrata"' secco: nessun risultato sul nome (solo Cherri d'Acquaviva, Capecci, Bonaventura e altre cantine di Acquaviva).
- `torretti-walter` TORRETTI WALTER — none: Secondo giro: allowed_domains facebook/instagram/vivino 'Torretti Arcevia vino cantina' (solo omonimi 'La Torretta' di Lazio/Puglia/Abruzzo e altre aziende di Arcevia: Broccanera, Cantina di Bacco); ricerca aperta '"Torretti Walter" OR "Walter Torretti" Arcevia' e '"Torretti" Verdicchio vino azienda agricola Marche': nessun risultato che citi il titolare.
- `vini-muraro` Vini Muraro — none: Secondo giro: facebook/instagram/vivino/winedering 'Muraro Montecalvo in Foglia Borgo Massano' (solo omonimi veneti: Cantina Muraro '952 Colli Berici, Fratelli Muraro Belluno, Muraro Vicenza; Borgo Massano e' una ASD sportiva), dominio vinimuraro.it con 'rosso bianco Sangiovese IGT' (solo home, nessun vino nominato), frase esatta '"Muraro Gloria" vino' (solo omonimi Trentino/Veneto e Nusserhof 'Gloria'). Nessuna prova.
- `vinicola-carassanese` Vinicola Carassanese — none: Sul dominio indicizzato solo un PDF sugli aiuti di Stato 2020 (Azienda Vinicola Carassanese snc); nessun nome di vino nel sito né in fonti esterne (ricerche aperte senza risultati pertinenti).

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
