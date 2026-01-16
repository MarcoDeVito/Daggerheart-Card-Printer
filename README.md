# Daggerheart Card Printer

Web tool avanzato per **selezionare, gestire e stampare** le carte di **Daggerheart** in formato **A4**, con **dimensioni reali**, **bleed opzionale**, **crocini di taglio professionali** e **gestione completa dei personaggi**.

Il progetto è pensato per funzionare come **sito statico** (GitHub Pages friendly), **senza backend** e **senza framework**, utilizzando esclusivamente **HTML, CSS e JavaScript vanilla**.

---

## ✨ Funzionalità principali

### 🃏 Carte & Stampa

* 🃏 **Carte in scala reale** (63 × 88 mm)
* 📄 **Layout A4 3×3** (9 carte per foglio)
* ✂️ **Crocini di taglio professionali**

  * Allineati ai bordi reali delle carte
  * A forma di **L**, orientati verso l’esterno
  * Sempre all’interno dell’area stampabile (no clipping)
* 🩸 **Bleed opzionale** (3 mm)
* 🔁 **Gestione fronte / retro**

  * Retro unico per tutte le carte
  * Fogli retro generati automaticamente
* 🖨️ **Stampa diretta da browser** (nessun PDF intermedio)

---

### 👤 Gestione personaggi

* Creazione, duplicazione ed eliminazione personaggi
* Campi gestiti:

  * Nome
  * Livello
  * Classe
  * Sottoclasse
  * Community
  * Ancestry
* Salvataggio automatico su **localStorage**
* Cambio personaggio immediato senza perdita di dati

---

### 🧙 Classe, sottoclasse e progressione

* Carte di **classe e sottoclasse** gestite automaticamente
* Regole di sblocco basate sul livello:

  * Privilegio base (sempre incluso)
  * Specializzazione (da livello minimo)
  * Maestria (da livello minimo)
* Le carte bloccate dal livello sono disabilitate e chiaramente indicate

---

### 🟣 Carte Dominio

* Selezione delle carte dominio in base a:

  * Classe
  * Livello del personaggio
* **Limite massimo di carte dominio (Vault)** calcolato automaticamente:

  * Base: `livello + 1`
  * Bonus da sottoclasse (se presenti)
  * Bonus opzionali sbloccabili a livelli 2 / 5 / 8
* **Carte speciali (Dragonslayer)**:

  * Non contano nel limite massimo
  * Sempre selezionabili
  * Gestite a livello dati con `level = -1`

---

### 🔍 Interfaccia & UX

* Vista **Grid** e **List** per le carte dominio
* Ricerca testuale sulle carte
* Filtro per dominio
* Selezione rapida:

  * Click sulla carta
  * Seleziona tutte le carte visibili
  * Deseleziona tutto
* Evidenziazione visiva delle carte selezionate

---

### 🔎 Zoom & Preview carte

* **Zoom modale** per:

  * Carte dominio
  * Community
  * Ancestry
  * Carte di sottoclasse
* Navigazione da tastiera:

  * ← → per scorrere
  * Spazio per selezionare/deselezionare
  * ESC per chiudere
* Indicazione visiva delle carte già selezionate

---

### 🌍 Multilingua

* Supporto **ENG / ITA**
* Cambio lingua runtime
* Caricamento dinamico di:

  * `cards.json / rules.json`
  * `cardsITA.json / rulesITA.json`
* **Rollback automatico** se il caricamento fallisce

---

### 📦 Import / Export personaggi

* Esportazione personaggio in stringa codificata
* Importazione su un altro browser/dispositivo
* Rigenerazione ID per evitare collisioni

---

## 🧱 Struttura del progetto

```
/
├─ index.html        # UI principale (gestione personaggi e selezione carte)
├─ print.html        # Pagina di stampa
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js         # Logica UI, personaggi e selezione carte
│  └─ print.js       # Logica layout e stampa
├─ data/
│  ├─ cards.json     # Catalogo carte (ENG)
│  ├─ cardsITA.json  # Catalogo carte (ITA)
│  ├─ rules.json     # Regole classi / sottoclassi / domini (ENG)
│  └─ rulesITA.json  # Regole (ITA)
└─ README.md
```

---

## 🖨️ Impostazioni di stampa (IMPORTANTISSIMO)

Nel pannello di stampa del browser (Chrome / Edge):

* **Scala:** `100%`
* ❌ Disattiva **“Adatta alla pagina”**
* **Margini:** Nessuno
* **Formato:** A4

⚠️ Qualsiasi ridimensionamento invalida le misure reali delle carte.

---

## 📐 Specifiche tecniche di stampa

* Carta finita: **63 × 88 mm**
* Bleed: **3 mm** (opzionale)
* Crocini:

  * Disegnati sugli spigoli delle carte
  * Orientati verso l’esterno
  * Stampati come elementi di pagina (non per-carta)
* Spazio tecnico interno al foglio per evitare il clipping del browser

---

## 🚀 Utilizzo in locale

È sufficiente un server statico.

Con VS Code:

* tasto destro su `index.html`
* **Open with Live Server**

Oppure:

```bash
python -m http.server
```

Apri poi `http://localhost:8000`

---

## 🌍 GitHub Pages

Il progetto è compatibile con GitHub Pages.

Requisiti:

* Repository pubblico
* Branch `main`
* `index.html` nella root

---

## 📌 Stato del progetto

🟢 **Stabile e utilizzabile per la stampa**
🟡 Dati carte in continuo aggiornamento

### 🔮 Possibili estensioni future

* Preset di stampa (con / senza bleed)
* Esportazione PDF tipografico
* Filtri avanzati per tipologia di carta
* Statistiche personaggio

---

## ⚠️ Disclaimer

Questo progetto è un tool fan-made per uso personale.
Daggerheart e tutti i contenuti correlati sono proprietà dei rispettivi autori/editori.

---

## 👤 Autore

Creato da **Marco De Vito**
