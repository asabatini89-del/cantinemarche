# Geodati della mappa

- `marche-province.json`, `marche-outline.json`, `marche-mask.json`, `marche-comuni.json`:
  confini amministrativi ISTAT (versione generalizzata), CC BY 3.0 — https://www.istat.it/it/archivio/210584 ,
  ricavati dal pacchetto npm `confini-istat` (Apache-2.0) e semplificati (~60 m).
  La maschera è il mondo meno il contorno delle Marche: serve a velare ciò che sta fuori regione.
  I comuni sono punti interni (representative point) usati per le etichette.
