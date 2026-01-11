# Daggerheart Card Printer

Web tool per selezionare e stampare le carte di **Daggerheart** in formato **A4**, con **dimensioni reali**, **bleed opzionale** e **crocini di taglio professionali**, pronto per la stampa domestica o tipografica.

Il progetto è pensato per funzionare come **sito statico** (GitHub Pages friendly), senza backend e senza framework pesanti.

---

## ✨ Funzionalità principali

- 🃏 **Carte in scala reale** (63 × 88 mm)
- 📄 **Layout A4 3×3** (9 carte per foglio)
- ✂️ **Crocini di taglio professionali**
  - Allineati ai bordi reali delle carte
  - A forma di **L**, orientati verso l’esterno
  - Sempre dentro l’area stampabile (non spariscono in stampa)
- 🔁 **Fronte / Retro**
  - Retro unico per tutte le carte
  - Fogli retro generati automaticamente
- 👤 **Gestione personaggi**
  - Community, Ancestry, Classe e Sottoclasse
  - Carte obbligatorie + carte di dominio
  - Regole di sblocco per livello
- 💾 **Salvataggio locale**
  - Tutti i personaggi e le selezioni sono salvati in `localStorage`
- 🖨️ **Stampa via browser**
  - `Ctrl + P`, nessun PDF intermedio necessario

---

## 🧱 Struttura del progetto

```

/
├─ index.html        # UI principale (selezione personaggi e carte)
├─ print.html        # Pagina di stampa
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js         # Logica UI e selezione carte
│  └─ print.js       # Logica layout e stampa
├─ data/
│  ├─ cards.json     # Catalogo carte
│  └─ rules.json     # Regole classi / sottoclassi / domini
└─ README.md

````

---

## 🖨️ Impostazioni di stampa (IMPORTANTISSIMO)

Nel pannello di stampa del browser (Chrome / Edge):

- **Scala:** `100%`
- ❌ Disattiva **“Adatta alla pagina”**
- **Margini:** Nessuno
- **Formato:** A4

⚠️ Qualsiasi ridimensionamento invalida le misure reali delle carte.

---

## 📐 Specifiche tecniche di stampa

- Carta finita: **63 × 88 mm**
- Bleed (opzionale): **3 mm**
- Crocini:
  - Disegnati sugli **spigoli delle carte**
  - Orientati verso l’esterno
  - Stampati come elementi di pagina (non per-carta)
- Spazio tecnico interno al foglio per evitare il clipping del browser

---

## 🚀 Utilizzo in locale

È sufficiente un server statico.

Con VS Code:
- tasto destro su `index.html`
- **Open with Live Server**

Oppure:

```bash
python -m http.server
````

e apri `http://localhost:8000`

---

## 🌍 GitHub Pages

Il progetto è compatibile con GitHub Pages.

Basta:

* repo pubblico
* branch `main`
* `index.html` nella root

---

## 📌 Stato del progetto

🟢 **Stabile per la stampa**
🟡 Dati carte in progress
🔵 Possibili estensioni future:

* Filtri avanzati per tipologia di carta
* Gestione domini multipli
* Esportazione PDF tipografico
* Preset di stampa (con / senza bleed)

---

## ⚠️ Disclaimer

Questo progetto è un tool fan-made per uso personale.
Daggerheart e i relativi contenuti sono proprietà dei rispettivi autori/editori.

---

## 👤 Autore

Creato da **Marco De Vito**

