# 05 · Identità: “Catalogo ragionato”

Il sito si presenta come il catalogo di una casa editrice colta più che come un portale turistico: carta non patinata, inchiostro, un solo rosso da frontespizio, copertine pastello da collana tascabile, metadati battuti a macchina. Il tono è asciutto e un po' ironico. Niente superlativi, niente stelline finte, nessuna foto da stock.

![Home](img/home-desktop.jpg)

## Principi

1. **È un catalogo.** Ogni cantina ha un numero (`N° 042`, ordine alfabetico), i territori sono “volumi di una collana”, le denominazioni un indice. La struttura editoriale fa da gerarchia: non servono badge né colori in più.
2. **Tipografia al posto delle decorazioni.** Titoli grandi in serif, corsivo per l'accento emotivo, macchina da scrivere per i dati. Filetti d'inchiostro da 1 px al posto di ombre e riquadri.
3. **Un solo rosso.** Il rosso (`#b8321c`) è riservato alle azioni principali e a una parola per titolo. Se tutto è rosso, niente lo è.
4. **I pastelli sono copertine, non decorazioni.** Ogni provincia e ogni territorio ha il suo colore (eredità della mappa del portale precedente). Si usa solo come fondo pieno con testo in inchiostro.
5. **Onestà dei dati.** Fonti in nota, date di verifica, “posizione approssimativa”, “scheda in attesa della cantina”: l'incompletezza si dichiara, non si nasconde.

## Colori

| Token | Valore | Uso | Contrasto su carta |
|---|---|---|---|
| `carta` | `#f3eee3` | fondo | — |
| `carta-2` | `#e9e2d3` | hover, superfici | — |
| `inchiostro` | `#16130f` | testo, filetti, pulsanti secondari | 16:1 |
| `grafite` | `#5a554c` | testo secondario (mai sulle copertine) | 6,4:1 |
| `rosso` | `#b8321c` | azione primaria, accento | 5,2:1 (anche carta su rosso) |
| `salvia` `ocra` `celeste` `cipria` `glicine` | | province PU, AN, MC, FM, AP | inchiostro ≥ 9,7:1 |
| `pistacchio` `albicocca` (+ i precedenti) | | copertine dei territori | inchiostro ≥ 10:1 |

## Caratteri

Tutti self-hosted con `@fontsource` (nessuna richiesta a Google: più veloci e senza problemi GDPR).

| Ruolo | Carattere | Classe |
|---|---|---|
| Titoli, nomi delle cantine, citazioni | Instrument Serif (tondo e corsivo) | `display`, `font-serif` |
| Testo e interfaccia | Instrument Sans (variabile) | `font-sans` (default) |
| Metadati, numeri di catalogo, etichette | IBM Plex Mono, maiuscolo, spaziato | `meta` |

## Componenti

- **Pulsanti:** rettangoli senza raggio. `btn` (contorno inchiostro, si inverte all'hover) e `btn-primary` (rosso pieno). Un solo `btn-primary` per vista.
- **Voce di catalogo** (`WineryCard`): filetto superiore, `N° · provincia`, nome in serif, comune e territorio in corsivo, denominazioni a macchina, riga di fatti in fondo. Nessuna foto finché la cantina non la carica.
- **Copertina** (territori): fondo pastello, numero di collana, titolo centrato in una cornice di filetto.
- **Mappa** (`MarcheMap`): SVG delle province (ISTAT) in pastello, cantine come punti rossi. Senza JS ogni punto porta alla scheda, con JS apre un cartiglio. Si inquadra da sola sui punti (territori, denominazioni) o mostra un punto singolo con anello (scheda).
- **Filtri** (`FilterBar`): chip rettangolari, pannelli a bottom sheet su mobile, tutto in un `<form method="get">`.
- **Note:** filetto verticale rosso + etichetta `NOTA` per gli avvisi sui dati. Il box verde pistacchio indica l'esito positivo di un modulo.

## Voce

| Sì | No |
|---|---|
| “Il vino delle Marche, *in ordine sparso.*” | “Scopri le migliori cantine!” |
| “Scheda in attesa della cantina” | “Nessuna informazione disponibile” |
| “Con questi filtri il catalogo resta in silenzio.” | “0 risultati trovati” |
| “Non è una prenotazione: ti risponderanno.” | “Prenota ora!” |

![Scheda cantina](img/scheda-desktop.jpg)

| Catalogo | Territori | Mobile |
|---|---|---|
| ![Catalogo](img/catalogo-desktop.jpg) | ![Territori](img/territori-desktop.jpg) | ![Home mobile](img/home-mobile.jpg) |
