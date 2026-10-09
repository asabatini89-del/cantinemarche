# 01 · User journey

I tre flussi chiave, uno per fase. Ognuno è ottimizzato per smartphone ed è pensato per arrivare al risultato con il minor numero di passaggi.

---

## A. Ricerca utente (Fase 1 · Discovery B2C)

**Persona:** viaggiatore o appassionato, spesso già nelle Marche, con lo smartphone in mano e connessione variabile.
**Job:** "Trovami una cantina vicina, aperta e adatta a quello che cerco, e dimmi come arrivarci."

| # | Momento | Schermata / componente | Decisioni UX |
|---|---------|------------------------|--------------|
| 1 | Ingresso | Google o link condiviso → `/cantine/[slug]`, `/territori/[slug]`, `/denominazioni/[slug]` oppure home `/` | Le pagine sono SSR e cacheate all'edge: la prima visita da ricerca organica è "istantanea". |
| 2 | Orientamento | Home: mappa + chip per provincia e vino, campo "Cantina, borgo o vino…" | Il ruolo della mappa resta quello del sito attuale. Il CTA "Vicino a me" usa la geolocalizzazione solo su richiesta. |
| 3 | Filtro | `FilterBar` sticky: Provincia · Denominazione · Vitigno · Servizi + toggle rapidi (Aperto oggi, Degustazioni, Shop) | I filtri sono un `<form method="get">`: lo stato vive nell'URL, quindi è condivisibile e il tasto indietro funziona. Su mobile si aprono a bottom sheet. |
| 4 | Esplorazione | Lista ↔ mappa (FAB "Mappa" su mobile), cluster, callout del marker | I risultati sono sincronizzati con il riquadro visibile della mappa ("Cerca in quest'area"). Il callout mostra nome, comune e CTA "Apri la scheda". |
| 5 | Valutazione | Scheda cantina: hero, denominazioni, orari, servizi, vini, esperienze, recensioni | Le informazioni critiche (orari oggi, prenotazione sì/no, distanza) stanno sopra la piega. Senza coordinate la mappa si nasconde, ma la scheda resta. |
| 6 | Azione | "Indicazioni" (deep link a Maps), "Chiama", "Richiedi una visita", "Salva" | La richiesta di visita funziona anche senza account. "Salva" chiede il login con magic link e poi completa l'azione. |
| 7 | Ritorno | Preferiti → Itinerario (ordine tappe → Google Maps multi-stop) | Il viaggio si costruisce nei preferiti. Il login arriva solo quando l'utente ha qualcosa da perdere. |

**Metriche:** tempo al primo risultato utile, CTR scheda → azione (indicazioni, telefono, richiesta), tasso di "Salva", ricerche senza risultati.

**Stati da progettare:** nessun risultato (con suggerimento "rimuovi un filtro"), D1 non disponibile (stale cache + messaggio), posizione negata, offline (shell PWA con le ultime schede viste).

---

## B. Riscatto cantina (Fase 2 · "Claim your business")

**Persona:** titolare o familiare di una cantina, poco tempo, spesso poco digitale, usa soprattutto WhatsApp ed email.
**Job:** "Voglio che la mia scheda sia giusta e mi porti visite, senza perderci un pomeriggio."

Obiettivo: **meno di 3 minuti** dal click al pannello, quando la verifica è automatica.

```
Scheda pubblica ─► "Sei il titolare? Rivendica questa pagina"
   │                         (anche da /per-le-cantine e da email/QR di invito)
   ▼
1. Chi sei ─ email + nome (magic link, nessuna password)
   ▼
2. Conferma la cantina ─ dati precompilati (nome, indirizzo, P.IVA se nota) + ruolo
   ▼
3. Verifica ─ l'app propone il metodo più veloce disponibile:
   ├─ a) Email sul dominio del sito ufficiale (info@cantina.it)  → link     ⇒ verifica immediata
   ├─ b) Codice OTP via SMS/chiamata al numero pubblico in scheda → 6 cifre ⇒ verifica immediata
   └─ c) Fallback: carica visura/documento (foto da smartphone)  → revisione admin entro 48 h
   ▼
4. Benvenuto ─ checklist "Completa la scheda al 100%":
   foto di copertina · orari · descrizione · 3 vini · 1 esperienza
   ▼
5. Dashboard (/gestione/[wineryId]) ─ modifica inline, anteprima live della scheda pubblica
```

**Scelte chiave per un target poco tecnico:**
- **Nessuna password.** Magic link più OTP. La sessione resta lunga sul dispositivo del titolare.
- **Invito pre-autenticato:** l'admin o il team commerciale invia un link firmato (email, WhatsApp o QR su materiale cartaceo) che apre il flusso già sulla cantina giusta.
- **La verifica automatica arriva prima, quella manuale dopo.** P.IVA controllata via VIES in background, senza chiedere altro all'utente.
- **Dashboard a schede grandi, una cosa per schermata.** Pulsanti "Salva" sticky, salvataggio con feedback, upload foto dalla fotocamera con compressione lato client.
- **Antifrode:** massimo 5 tentativi OTP, scadenza di 10 minuti, una sola richiesta aperta per cantina/utente, audit log, notifica all'eventuale titolare già presente.

**Stati:** in verifica / approvata / respinta (con motivazione e un'azione possibile), cantina già rivendicata ("Chiedi accesso al titolare").

**Metriche:** % di schede rivendicate, tempo medio di claim, % verifiche automatiche, completezza media delle schede.

---

## C. Acquisto e-commerce (Fase 3 · Marketplace B2B2C)

**Persona:** utente registrato o ospite che vuole comprare bottiglie da una o più cantine, oppure prenotare una degustazione.

```
Scheda cantina / pagina vino
   │  "Aggiungi al carrello" (bottiglia, cassa)  ·  "Prenota" (esperienza → slot)
   ▼
Carrello (drawer) ─ raggruppato PER CANTINA
   │  ogni gruppo mostra: subtotale, spedizione della cantina, soglia "spedizione gratuita da X €"
   ▼
Checkout (1 pagina, mobile)
   1. Email (o login) + dichiarazione maggiore età (obbligatoria per alcolici)
   2. Indirizzo di spedizione (solo Italia in v1) — salta se ci sono solo esperienze
   3. Pagamento: Stripe Payment Element (carte, Apple Pay, Google Pay; altri metodi attivabili da dashboard Stripe)
   ▼
Conferma ─ 1 ordine con numero unico, N sotto-ordini (uno per cantina)
   ▼
Post-acquisto ─ email per sotto-ordine ("La cantina X ha spedito", tracking)
             ─ dopo la consegna o la visita: invito a recensire (recensione "verificata")
```

**Lato cantina:** notifica nuovo ordine → "Accetta" → inserisce corriere e tracking → "Spedito". Il bonifico arriva tramite Stripe Connect, al netto della commissione.

**Regole di business da definire subito:**
- Spedizione **a carico e a tariffa di ciascuna cantina** (tabella `shipping_rates` per numero di bottiglie e zona). Il carrello multi-cantina mostra spedizioni separate, in modo trasparente.
- **Split dei pagamenti:** un solo addebito al cliente, poi un Transfer per cantina (Stripe Connect *separate charges & transfers*, `transfer_group` = ordine). Commissione piattaforma per cantina (`commission_bps`).
- **Rimborso parziale** per singolo sotto-ordine: storno del transfer della cantina più refund al cliente.
- **Compliance:** vendita di alcolici solo a maggiorenni. Spedizioni UE fuori dall'Italia escluse in v1 (accise e regimi diversi). Dati fiscali della cantina venditrice in fattura/ricevuta. Termini di recesso per la vendita a distanza.

**Metriche:** conversione carrello → ordine, AOV, % ordini multi-cantina, tempo medio di evasione, tasso di recensioni verificate.
