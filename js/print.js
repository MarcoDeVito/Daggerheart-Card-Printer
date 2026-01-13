(() => {
  const STORAGE_KEY = "dh_print_state_v1";
  const $ = (id) => document.getElementById(id);

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function qp(name) {
    const u = new URL(location.href);
    return u.searchParams.get(name);
  }

  function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  async function init() {
    const state = loadState();
    const lang = (state.ui && (state.ui.language === "ita" || state.ui.language === "eng"))
  ? state.ui.language
  : "eng";

    if (!state) {
      document.body.innerHTML = "Nessuno stato trovato in localStorage.";
      return;
    }

    const chId = qp("ch");
    const ch = state.characters.find((c) => c.id === chId);
    if (!ch) {
      document.body.innerHTML = "Personaggio non trovato.";
      return;
    }

    const cardsPath = (lang === "ita") ? "data/cardsITA.json" : "data/cards.json";
const rulesPath = (lang === "ita") ? "data/rulesITA.json" : "data/rules.json";

const [cardsRes, rulesRes] = await Promise.all([
  fetch(cardsPath, { cache: "no-store" }),
  fetch(rulesPath, { cache: "no-store" })
]);

if (!cardsRes.ok) throw new Error(`Impossibile caricare ${cardsPath} (HTTP ${cardsRes.status})`);
if (!rulesRes.ok) throw new Error(`Impossibile caricare ${rulesPath} (HTTP ${rulesRes.status})`);

    const catalog = await cardsRes.json();
    const rules = await rulesRes.json();

    const cardsById = new Map(catalog.cards.map((c) => [c.id, c]));

    const classDef = rules.classes[ch.classKey];
    const subDef = classDef?.subclasses?.[ch.subclassKey];

    const specMin = rules.meta.subclassUnlocks.specializationMinLevel;
    const mastMin = rules.meta.subclassUnlocks.masteryMinLevel;

    const printOpt = state.print || { bleedOn: true, cropMarks: true, addBackSheets: true };

    // Set CSS var for bleed
    document.documentElement.style.setProperty("--bleedOn", printOpt.bleedOn ? "1" : "0");

    const orderedIds = [];
    const pushUnique = (id) => {
      if (!id) return;
      if (!orderedIds.includes(id)) orderedIds.push(id);
    };

    // 1) Mandatory in ordine fisso
    pushUnique(ch.communityId);
    pushUnique(ch.ancestryId);

    // Subclass base sempre
    if (subDef?.cards?.base) pushUnique(subDef.cards.base);

    // Optional subclass (con controllo livello)
    const lvl = Number(ch.level);
    if (ch.subclassPicks?.specialization && lvl >= specMin) pushUnique(subDef.cards.specialization);
    if (ch.subclassPicks?.mastery && lvl >= mastMin) pushUnique(subDef.cards.mastery);

    // 2) Domain selected, ordinato per: ordine domini classe -> level -> id
    const selected = new Set(Array.isArray(ch.selectedCardIds) ? ch.selectedCardIds : []);
    const domainOrder = new Map();
    (classDef?.domains || []).forEach((d, i) => domainOrder.set(d, i));

    const eligibleSelected = catalog.cards
      .filter((c) => c.kind === "domain")
      .filter((c) => selected.has(c.id))
      .filter((c) => (classDef?.domains || []).includes(c.domain)|| c.domain === "dragonslayer")
      .filter((c) => Number(c.level) <= lvl)
      .sort((a, b) => {
        const da = domainOrder.has(a.domain) ? domainOrder.get(a.domain) : 999;
        const db = domainOrder.has(b.domain) ? domainOrder.get(b.domain) : 999;
        if (da !== db) return da - db;

        const la = Number(a.level);
        const lb = Number(b.level);
        if (la !== lb) return la - lb;

        return a.id.localeCompare(b.id);
      });

    for (const c of eligibleSelected) pushUnique(c.id);

    const finalCards = orderedIds.map((id) => cardsById.get(id)).filter(Boolean);

    const meta = $("printMeta");
    meta.textContent = `Lingua: ${lang.toUpperCase()} - PG: ${ch.name} • Lvl ${ch.level} • ${
      classDef?.label || ch.classKey
    }/${subDef?.label || ch.subclassKey} • Carte: ${finalCards.length} • Bleed: ${
      printOpt.bleedOn ? "ON" : "OFF"
    } • Crop: ${printOpt.cropMarks ? "ON" : "OFF"} • Retro: ${printOpt.addBackSheets ? "ON" : "OFF"}`;

    const pages = $("pages");
    pages.innerHTML = "";

    // Build front sheets
    const sheets = chunk(finalCards, 9);
    for (const sheetCards of sheets) {
      pages.appendChild(makeSheet(sheetCards, { crop: printOpt.cropMarks, bleedOn: printOpt.bleedOn }));
    }

    // Build back sheets (same number of cards, repeated back image)
    if (printOpt.addBackSheets) {
      const backSrc = catalog.meta.backImage;
      const backCards = finalCards.map(() => ({ isBack: true, backSrc }));
      const backSheets = chunk(backCards, 9);
      for (const sheetCards of backSheets) {
  pages.appendChild(makeSheet(sheetCards, { crop: printOpt.cropMarks, bleedOn: printOpt.bleedOn, isBack: true }));
}

    }
  }

function makeSheet(cards, { crop, bleedOn, isBack = false }) {
  const sheet = document.createElement("div");
  sheet.className = "sheet";

  // Indici slot (0..8) su una griglia 3x3:
  // 0 1 2
  // 3 4 5
  // 6 7 8
  //
  // FRONT: riempie 0,1,2,3,4,5,6,7,8 (sinistra->destra)
  // BACK:  riempie 2,1,0,5,4,3,8,7,6 (destra->sinistra per ogni riga)
  const slotOrder = isBack
    ? [2, 1, 0, 5, 4, 3, 8, 7, 6]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const slots = new Array(9).fill(null);

  for (let i = 0; i < Math.min(cards.length, 9); i++) {
    slots[slotOrder[i]] = cards[i];
  }

  for (let i = 0; i < 9; i++) {
    sheet.appendChild(makePrintCard(slots[i], { bleedOn }));
  }

  if (crop) {
    sheet.appendChild(makeSheetCropMarks(bleedOn));
  }

  return sheet;
}


  function makePrintCard(card, { bleedOn }) {
    const wrap = document.createElement("div");
    wrap.className = "pcard";

    if (card) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = card.isBack ? card.backSrc : card.front;
      wrap.appendChild(img);
    }

    return wrap;
  }

  // Crop marks "da foglio" (allineati alle linee di taglio della griglia 3x3)


function makeSheetCropMarks(bleedOn) {
  const wrap = document.createElement("div");
  wrap.className = "marks";
  wrap.style.position = "absolute";
  wrap.style.inset = "0";
  wrap.style.pointerEvents = "none";

  const pad = 8; // mm (DEVE combaciare con --sheetPad)
  const bleed = bleedOn ? 3 : 0; // mm
  const cutW = 63; // mm
  const cutH = 88; // mm

  const slotW = cutW + bleed * 2;
  const slotH = cutH + bleed * 2;

  const L = 6;       // lunghezza crocino (mm)
  const T = 0.1;    // spessore (mm)
  const gap = 0;   // distanza dal bordo carta (mm)

  const line = ({ left, top, w, h }) => {
    const d = document.createElement("div");
    d.className = "m";
    d.style.position = "absolute";
    d.style.left = `${left}mm`;
    d.style.top = `${top}mm`;
    d.style.width = `${w}mm`;
    d.style.height = `${h}mm`;
    wrap.appendChild(d);
  };

  // Disegna una "L" esterna:
  // dirX: -1 (sinistra) / +1 (destra)
  // dirY: -1 (su) / +1 (giù)
  function cornerL(x, y, dirX, dirY) {
    // orizzontale (parte dalla linea di taglio e va verso fuori)
    const hx1 = dirX < 0 ? (x - gap - L) : (x + gap);
    const hy  = y - T / 2;
    line({ left: hx1, top: hy, w: L, h: T });

    // verticale (parte dalla linea di taglio e va verso fuori)
    const vx  = x - T / 2;
    const vy1 = dirY < 0 ? (y - gap - L) : (y + gap);
    line({ left: vx, top: vy1, w: T, h: L });
  }

  // Per ogni carta (3x3), disegna i 4 angoli sul rettangolo CUT (63x88)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const xLeftCut  = pad + col * slotW + bleed;
      const xRightCut = xLeftCut + cutW;
      const yTopCut   = pad + row * slotH + bleed;
      const yBotCut   = yTopCut + cutH;

      if(row===0 && col===0) {
        // Top-left: fuori = su + sinistra  (forma tipo ┘ sul foglio)
        cornerL(xLeftCut,  yTopCut,  -1, -1);
        continue;
      }
      
      if(row===0 && col===2) {
        // Top-right: fuori = su + destra (forma tipo └)
        cornerL(xRightCut, yTopCut,  +1, -1);
        continue;
      }

      if(row===0 && col===1) {
        line({
          left: xLeftCut - (T/2),
          top:  yTopCut - L,
          w:    T,
          h:    L
        });
        line({
          left: xRightCut - (T/2),
          top:  yTopCut - L,
          w:    T,
          h:    L
        });
        continue;
      }
      
      if(row===2 && col===0) {
        // Bottom-left: fuori = giù + sinistra (forma tipo ┐)
        cornerL(xLeftCut,  yBotCut,  -1, +1);
        continue;
      }
       if(row===2 && col===1) {
        // Bottom-left: fuori = giù + sinistra (forma tipo ┐)
        line({
          left: xLeftCut - (T/2),
          top:  yBotCut,
          w:    T,
          h:    L
        });
        line({
          left: xRightCut - (T/2),
          top:  yBotCut,
          w:    T,
          h:    L
        });
        continue;
      }

      if(row===1 && col===0) {
        // Bottom-left: fuori = giù + sinistra (forma tipo ┐)
        line({
          left: xLeftCut - L,
          top:  yTopCut - T/2,
          w:    L,
          h:    T
        });
        line({
          left: xLeftCut - L,
          top:  yBotCut - T/2,
          w:    L,
          h:    T
        });
        continue;
      }


      if(row===1 && col===2) {
        // Bottom-left: fuori = giù + sinistra (forma tipo ┐)
        line({
          left: xRightCut,
          top:  yTopCut - T/2,
          w:    L,
          h:    T
        });
        line({
          left: xRightCut,
          top:  yBotCut - T/2,
          w:    L,
          h:    T
        });
        continue;
      }


      if(row===2 && col===2) {
        // Bottom-right: fuori = giù + destra (forma tipo ┌)
        cornerL(xRightCut, yBotCut,  +1, +1);
        continue;
      }

    }
  }

  return wrap;
}



  init().catch((err) => {
    console.error(err);
    document.body.innerHTML = "Errore. Apri la console.";
  });
})();
