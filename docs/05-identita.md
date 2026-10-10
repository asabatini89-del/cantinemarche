# 05 · Identità: “Radical Chic”

Il sito è un manifesto e una copertina di saggio anni Settanta insieme. Dal manifesto prende il fondo albicocca, la parola enorme in Bodoni maiuscolo vermiglio e la figura disegnata a matita blu e mandarino, con una nota scritta a mano. Dalla copertina prende il fondo crema, i titoli serif neri chiusi tra filetti spessi, i riquadri a colore pieno con contorno nero e il marchio dell'editore a pillola. Il tono è colto e ironico: “Domani degustazione?”. Niente superlativi, stelline finte o foto da stock.

![Home](img/home-desktop.jpg)

## Principi

1. **Una parola, una figura, una parola.** Le pagine principali si aprono come un manifesto: la parola-manifesto (`CANTINE`, `I TERRITORI`, `DENOMINAZIONI`), poi la figura (la mappa o la mascotte), poi un'altra parola spaziata (`M A R C H E`, `S A L U T E`).
2. **È ancora un catalogo.** Ogni cantina ha il suo numero (`N° 042`, in rosso), i territori sono i volumi di una collana con le copertine alla Picador, le denominazioni sono un indice. La struttura editoriale resta la gerarchia.
3. **Il rosso è la voce alta.** Il vermiglio `#d42a1a` si usa per le parole-manifesto, i numeri di catalogo e l'azione principale. Il testo corrente resta inchiostro su crema.
4. **I colori pieni sono copertine.** Giallo, azzurro, mandarino, rosa, menta, lavanda e albicocca si usano solo come fondi pieni, con testo in inchiostro e contorno nero da 2 px. Ogni provincia e ogni territorio ha il suo.
5. **Una nota a mano per pagina.** Il Caveat in matita blu è la battuta a margine (“…e domani brunch in vigna?”). Una sola per vista, mai per informazioni essenziali.
6. **Onestà dei dati.** Fonti in nota, date di verifica, “posizione approssimativa”, “scheda in attesa della cantina”: l'incompletezza si dichiara, non si nasconde.

## Colori

| Token | Valore | Uso | Contrasto |
|---|---|---|---|
| `carta` | `#fbf4e8` | fondo di lettura (crema) | — |
| `carta-2` | `#f4e6cf` | hover, superfici | — |
| `pesca` | `#fccb8f` | fondo-manifesto: hero, testate, piè di pagina | — |
| `inchiostro` | `#141210` | testo, filetti, contorni | 17:1 su crema |
| `grafite` | `#5a5048` | testo secondario | 7,2:1 su crema, 5,3:1 su albicocca |
| `rosso` | `#d42a1a` | parole-manifesto, numeri, azione primaria | 4,6:1 su crema (crema su rosso idem) |
| `cobalto` | `#3557a8` | note a mano, focus | 4,6:1 su albicocca |
| `giallo` `azzurro` `mandarino` `rosa` `menta` `lavanda` `albicocca` | | copertine, province, hover | inchiostro ≥ 9:1 |

Province: Pesaro e Urbino azzurro, Ancona giallo, Macerata albicocca, Fermo rosa, Ascoli Piceno menta.

## Caratteri

Tutti self-hosted con `@fontsource` (nessuna richiesta a Google: più veloci e senza problemi GDPR).

| Ruolo | Carattere | Classe |
|---|---|---|
| Parole-manifesto | Bodoni Moda (variabile, ottica automatica), maiuscolo, rosso | `manifesto` (+ `spaziato` per C H I C) |
| Titoli, nomi delle cantine | Bodoni Moda tondo e corsivo | `display` |
| Testo e interfaccia | Instrument Sans (variabile) | `font-sans` (default) |
| Metadati, numeri di catalogo | IBM Plex Mono, maiuscolo, spaziato | `meta` |
| Note a margine | Caveat, matita blu | `mano` |

La testata (`PosterHeader`) adatta il corpo della parola-manifesto alla larghezza: la parola più lunga resta su una riga anche a 360 px. Evitare le maiuscole accentate nelle parole-manifesto: con interlinea 0,85 l'accento tocca la riga sopra.

## Componenti

- **Testata-manifesto** (`PosterHeader`): fondo pieno con grana da stampa (`grana`), parola-manifesto, sottotitolo corsivo, nota a mano, slot laterale per l'illustrazione.
- **Mascotte** (`Mascotte`): una bottiglia blu a matita con dolcevita mandarino a coste, capsula vermiglio e cuffie, con fumetto a mano. Compare nel blocco per i produttori, in “Per le cantine” e nella 404.
- **Copertina** (`TerritoryCover`): la collana alla Picador. Fascia crema con “I territori” e numero, riquadro a colore pieno con il numerale gigante e il vino scritto a mano, titolo tra filetti, piede con il numero di cantine e la pillola “Leggi”.
- **Pulsanti:** pillole. `btn` (contorno inchiostro da 1,5 px, si inverte all'hover) e `btn-primary` (vermiglio pieno). Un solo `btn-primary` per vista. `pillola` per etichette e filtri compatti.
- **Riquadri “in rilievo”:** contorno 2 px e ombra piena sfalsata in inchiostro (`shadow-[6px_6px_0_var(--color-inchiostro)]`), come un ritaglio di carta incollato: box “Sei il titolare?”, moduli, passi.
- **Voce di catalogo** (`WineryCard`): filetto da 2 px, `N°` in rosso, nome in Bodoni, comune e territorio, denominazioni a macchina. Hover crema scuro.
- **Filtri** (`FilterBar`): chip a pillola, pannelli a bottom sheet su mobile con angoli arrotondati, tutto in un `<form method="get">`.
- **Note:** filetto verticale rosso da 4 px + etichetta `NOTA` per gli avvisi sui dati. L'esito positivo di un modulo è un riquadro menta.

## La mappa che si muove

La mappa della home (`MarcheMap explore` + `src/scripts/map-explorer.ts`) è una motion graphic a ritagli di carta:

- **Province come carta tagliata:** ogni provincia ha un'ombra piena in inchiostro. Al passaggio si solleva di qualche pixel; quando è a fuoco si stacca dal foglio e le altre sbiadiscono.
- **Volo di camera:** cliccando una provincia (o una pillola “Vola su una provincia”) la camera vola sull'area con il percorso di van Wijk e Nuij, lo stesso di `d3.interpolateZoom`: si allontana un poco, trasla e si avvicina, con durata proporzionale alla distanza.
- **Zoom fino ai puntini:** secondo clic, pulsanti +/−, rotella (dopo aver toccato la mappa, o con Ctrl/⌘) e pinch su mobile, fino a circa 28×. Punti, testi e filetti restano della stessa dimensione a schermo, così le cantine vicine si separano invece di ingrandirsi. Da 2,2× compaiono i nomi dei comuni della provincia a fuoco.
- **Trascinamento** con mouse e dito, Esc per tornare alle Marche, `#provincia-AN` nell'indirizzo per condividere la vista.
- Con `prefers-reduced-motion` la camera salta senza animazione. Senza JavaScript la mappa resta un SVG con un link per cantina.

## Voce

| Sì | No |
|---|---|
| “Il vino delle Marche, *in ordine sparso.*” | “Scopri le migliori cantine!” |
| “Domani degustazione?” (a margine) | “Prenota subito la tua esperienza!” |
| “Scheda in attesa della cantina” | “Nessuna informazione disponibile” |
| “Con questi filtri il catalogo resta in silenzio.” | “0 risultati trovati” |
| “Non è una prenotazione: ti risponderanno.” | “Prenota ora!” |

![Scheda cantina](img/scheda-desktop.jpg)

| Catalogo | Territori | Mobile |
|---|---|---|
| ![Catalogo](img/catalogo-desktop.jpg) | ![Territori](img/territori-desktop.jpg) | ![Home mobile](img/home-mobile.jpg) |
