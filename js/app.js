(() => {
  const STORAGE_KEY = "dh_print_state_v1";

  const $ = (id) => document.getElementById(id);

  const elCharList = $("charList");
  const editorEmpty = $("editorEmpty");
  const editorForm = $("editor");

  const btnNewChar = $("btnNewChar");
  const btnRandomChar = $("btnRandomChar");
  const btnDeleteChar = $("btnDeleteChar");
  const btnPrint = $("btnPrint");

  const chName = $("chName");
  const chLevel = $("chLevel");
  const chClass = $("chClass");
  const chSubclass = $("chSubclass");
  const chCommunity = $("chCommunity");
  const chAncestry = $("chAncestry");
  const mixedAncestryBox = $("mixedAncestryBox");
const chAncestryMix1 = $("chAncestryMix1");
const chAncestryMix2 = $("chAncestryMix2");

const MIXED_VALUE = "__mixed__";
const btnZoomAncestryMix2 = $("btnZoomAncestryMix2");


const optVaultB2 = $("optVaultB2");
const optVaultB5 = $("optVaultB5");
const optVaultB8 = $("optVaultB8");
const vaultMaxHint = $("vaultMaxHint");

  const btnZoomCommunity = $("btnZoomCommunity");
const btnZoomAncestry = $("btnZoomAncestry");




const multiclassBox = $("multiclassBox");
const chMulticlassClass = $("chMulticlassClass");
const chMulticlassDomain = $("chMulticlassDomain");


  const optBleed = $("optBleed");
  const optCrop = $("optCrop");
  const optBack = $("optBack");

  const subclassCards = $("subclassCards");

  const domainEmpty = $("domainEmpty");
  const domainGrid = $("domainGrid");
  const search = $("search");
  const filterDomain = $("filterDomain");
  const btnSelectAllVisible = $("btnSelectAllVisible");
  const btnClearSelected = $("btnClearSelected");
  const selCount = $("selCount");
  const sheetCount = $("sheetCount");
  const domainHint = $("domainHint");
  const activeHint = $("activeHint");
  const btnViewGrid = $("btnViewGrid");
  const btnViewList = $("btnViewList");
  const btnExportChar = $("btnExportChar");
  const btnImportChar = $("btnImportChar");

  const btnLicense = $("btnLicense");
  const licenseModal = $("licenseModal");

  const btnLangITA = $("btnLangITA");
  const btnLangENG = $("btnLangENG");




new ClipboardJS('.btn');
  let catalog = null; // cards.json
  let rules = null;   // rules.json

  let state = loadState();
  if (!state.print) state.print = { bleedOn: false, cropMarks: true, addBackSheets: true, unique: false };
  if (!state.ui) state.ui = { domainView: "grid", language: "eng" };
  if (state.ui.language !== "eng" && state.ui.language !== "ita") state.ui.language = "eng";

  if (state.ui.domainView !== "grid" && state.ui.domainView !== "list") state.ui.domainView = "grid";

  let activeChar = null;

  let visibleDomainCards = []; // currently filtered list in UI


    // ===== Zoom Modal =====
  let zoomModalEl = null;
  let zoomModalImgEl = null;
  let zoomModalPrevBtn = null;
  let zoomModalNextBtn = null;
  let zoomModalPanelEl = null;
  let zoomAllowToggle = true;   // true: dominio (click immagine seleziona); false: preview sola
  let zoomHideNav = false;      // true: nasconde frecce

  

  let zoomList = [];       // lista carte visibili (oggetti card)
  let zoomIndex = -1;      // indice corrente dentro zoomList
  let zoomOnCardChange = null; // callback opzionale per select Community/Ancestry


  function ensureZoomModal() {
    if (zoomModalEl) return;

    zoomModalEl = document.createElement("div");
    zoomModalEl.className = "zoomModal";
    zoomModalEl.innerHTML = `
      <div class="zoomModal__backdrop" data-zoom-close="1"></div>
      <div class="zoomModal__panel" role="dialog" aria-modal="true">
        <button class="zoomModal__close" type="button" aria-label="Chiudi (Esc)" data-zoom-close="1">✕</button>

        <button class="zoomModal__nav zoomModal__nav--prev" type="button" aria-label="Precedente (←)">←</button>
        <button class="zoomModal__nav zoomModal__nav--next" type="button" aria-label="Successiva (→)">→</button>

        <div class="zoomModal__selected"></div>
        <img class="zoomModal__img" alt="" />
      </div>
    `;
    


    document.body.appendChild(zoomModalEl);

    zoomModalPanelEl = zoomModalEl.querySelector(".zoomModal__panel");
    zoomModalImgEl = zoomModalEl.querySelector(".zoomModal__img");
    zoomModalPrevBtn = zoomModalEl.querySelector(".zoomModal__nav--prev");
    zoomModalNextBtn = zoomModalEl.querySelector(".zoomModal__nav--next");
    zoomModalImgEl.style.cursor = "pointer";
    zoomModalImgEl.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleZoomSelection();
});


    zoomModalPrevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomStep(-1);
    });

    zoomModalNextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      zoomStep(+1);
    });

    // click su backdrop o sul bottone chiude
    zoomModalEl.addEventListener("click", (e) => {
      const close = e.target.closest("[data-zoom-close='1']");
      if (close) closeZoomModal();
    });

    // ESC chiude
    document.addEventListener("keydown", (e) => {
  if (!zoomModalEl || !zoomModalEl.classList.contains("open")) return;

  if (e.key === "Escape") closeZoomModal();
  else if (e.key === "ArrowLeft") zoomStep(-1);
  else if (e.key === "ArrowRight") zoomStep(+1);
  else if (e.code === "Space") {
  e.preventDefault(); // evita scroll pagina
  toggleZoomSelection();
}
});
  }

  function openZoomModalByCardId(cardId, list) {
  ensureZoomModal();

  zoomList = Array.isArray(list) ? list : [];
  zoomIndex = zoomList.findIndex(c => c.id === cardId);

  // fallback: se non trovato, apri la prima
  if (zoomIndex < 0) zoomIndex = 0;

  zoomAllowToggle = true;
zoomHideNav = false;
zoomOnCardChange = null;

if (zoomModalPrevBtn) zoomModalPrevBtn.classList.remove("hidden");
if (zoomModalNextBtn) zoomModalNextBtn.classList.remove("hidden");
  zoomModalEl.classList.add("open");
  zoomShowCurrent();
}

function updateCommunityAncestryZoomButtons() {
  if (btnZoomCommunity) btnZoomCommunity.disabled = !chCommunity.value;

  // lente ancestry “principale” apre sempre ancestryId reale
  if (btnZoomAncestry) btnZoomAncestry.disabled = !(activeChar && activeChar.ancestryId);

  // lente della seconda ancestry (solo se mixed e se ha valore)
  if (btnZoomAncestryMix2) {
    btnZoomAncestryMix2.disabled = !(activeChar && activeChar.mixed && activeChar.mixedAncestryId);
  }
}

function getMulticlassDomain(ch) {
  if (!ch?.multiclass) return "";
  if (!ch.multiclassClassKey) return "";
  if (ch.multiclassDomainIdx !== 0 && ch.multiclassDomainIdx !== 1) return "";
  const def = getClassDef(ch.multiclassClassKey);
  return def?.domains?.[ch.multiclassDomainIdx] || "";
}

function openZoomModalSingleCard(cardId) {
  ensureZoomModal();

  const card = getCardById(cardId);
  if (!card) return;

  zoomList = [card];
  zoomIndex = 0;

  zoomAllowToggle = false;
  zoomHideNav = true;

  if (zoomModalPrevBtn) zoomModalPrevBtn.classList.add("hidden");
  if (zoomModalNextBtn) zoomModalNextBtn.classList.add("hidden");

  zoomModalEl.classList.add("open");
  zoomShowCurrent();
}


function openZoomModalChoice(cardId, kind, onCardChange) {
  ensureZoomModal();

  zoomList = getCardsByKind(kind)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }));

  if (!zoomList.length) return;

  zoomIndex = zoomList.findIndex(card => card.id === cardId);
  if (zoomIndex < 0) zoomIndex = 0;

  zoomAllowToggle = false;
  zoomHideNav = false;
  zoomOnCardChange = typeof onCardChange === "function" ? onCardChange : null;

  if (zoomModalPrevBtn) zoomModalPrevBtn.classList.remove("hidden");
  if (zoomModalNextBtn) zoomModalNextBtn.classList.remove("hidden");

  zoomModalEl.classList.add("open");
  zoomShowCurrent();
}


  function closeZoomModal() {
  if (!zoomModalEl) return;
  zoomModalEl.classList.remove("open");
  if (zoomModalImgEl) zoomModalImgEl.src = "";
  zoomList = [];
  zoomIndex = -1;
  zoomOnCardChange = null;
}

function isCardSelected(ch, cardId) {
  if (!ch || !Array.isArray(ch.selectedCardIds)) return false;
  return ch.selectedCardIds.includes(cardId);
}

function setModalSelectedUI() {
  if (!zoomModalPanelEl) return;

  if (!zoomAllowToggle) {
    zoomModalPanelEl.classList.remove("is-selected");
    return;
  }

  const card = zoomList[zoomIndex];
  const selected = !!(card && isCardSelected(activeChar, card.id));
  zoomModalPanelEl.classList.toggle("is-selected", selected);
}

function setZoomNavDisabled() {
  if (!zoomModalPrevBtn || !zoomModalNextBtn) return;

  // Con almeno due carte le frecce restano sempre attive:
  // dalla prima si torna all'ultima e dall'ultima si riparte dalla prima.
  const disableNav = zoomList.length <= 1;
  zoomModalPrevBtn.disabled = disableNav;
  zoomModalNextBtn.disabled = disableNav;
}


function zoomShowCurrent() {
  if (!zoomModalImgEl) return;
  const card = zoomList[zoomIndex];
  if (!card) return;

  zoomModalImgEl.src = card.front || card.thumb || card.back || "";
  setZoomNavDisabled();
  setModalSelectedUI();

  if (zoomOnCardChange) {
    zoomOnCardChange(card);
  }
}


function toggleZoomSelection() {
  if (!zoomAllowToggle) return;
  if (!activeChar || zoomIndex < 0) return;

  const card = zoomList[zoomIndex];
  if (!card) return;

  const currentlySelected = isCardSelected(activeChar, card.id);
  const wantSelected = !currentlySelected;

  const ok = trySetDomainCardSelected(activeChar, card.id, wantSelected, { source: "modal" });
  if (!ok) return;

  renderDomainCards();
  updateCountsAndPrintLink();
  setModalSelectedUI();
}



function zoomStep(delta) {
  if (!zoomList.length) return;

  // Navigazione circolare:
  // precedente sulla prima carta -> ultima carta
  // successiva sull'ultima carta -> prima carta
  zoomIndex = (zoomIndex + delta + zoomList.length) % zoomList.length;
  zoomShowCurrent();
}


function exportCharacterById(charId) {
  const ch = findChar(charId);
  if (!ch) return;

  const payload = {
    type: "DHCP_CHAR",
    v: 1,
    exportedAt: new Date().toISOString(),
    character: structuredClone(ch) // <-- oggetto, non stringa
  };

  const encoded = b64EncodeUnicode(JSON.stringify(payload));

  const copia = document.querySelector("#copyPG");
  copia.setAttribute("data-clipboard-text", encoded);
  copia.click();

  window.prompt(
    "Copia questa stringa per importare il personaggio su un altro browser:",
    encoded
  );
}


function exportActiveCharacter() {
  if (!activeChar) {
    alert("Seleziona prima un personaggio da esportare.");
    return;
  }

  const payload = {
    type: "DHCP_CHAR",
    v: 1,
    exportedAt: new Date().toISOString(),
    character: activeChar
  };

  const encoded = b64EncodeUnicode(JSON.stringify(payload));

  const  copia = document.querySelector("#copyPG");
 copia.setAttribute("data-clipboard-text", encoded);
 copia.click();
  window.prompt(
    "Copia questa stringa per importare il personaggio su un altro browser:",
    encoded
  );
}

function importCharacterFromString() {
  const raw = window.prompt("Incolla qui la stringa di import:");
  if (!raw) return;

  let payload;
  try {
    const json = b64DecodeUnicode(raw.trim());
    payload = JSON.parse(json);
  } catch {
    alert("Stringa non valida (decodifica/JSON fallita).");
    return;
  }

  if (!payload || payload.type !== "DHCP_CHAR" || !payload.character) {
    alert("Stringa non valida (payload non riconosciuto).");
    return;
  }

  const ch = payload.character;

  // Validazione minima (evitiamo roba rotta)
  if (!ch.name || !ch.level) {
    alert("Personaggio incompleto (manca nome o livello).");
    return;
  }

  // Nuovo ID per evitare collisioni
  const imported = structuredClone(ch);
  imported.id = uid();

  // Normalizza campi mancanti
if (typeof imported.multiclass !== "boolean") imported.multiclass = false;
if (!imported.multiclassClassKey) imported.multiclassClassKey = "";
if (!("multiclassPick" in ch)) ch.multiclassPick = "";
if (ch.multiclassPick !== "spec" && ch.multiclassPick !== "mast") ch.multiclassPick = "";

// compat vecchia: se esiste multiclassDomain string, butta via e riparti
if (imported.multiclassDomain && imported.multiclassDomainIdx == null) {
  imported.multiclassDomainIdx = null;
  delete imported.multiclassDomain;
}

if (imported.multiclassDomainIdx !== 0 && imported.multiclassDomainIdx !== 1) {
  imported.multiclassDomainIdx = null;
}


  if (!imported.subclassPicks) imported.subclassPicks = { specialization: false, mastery: false };
  if (!Array.isArray(imported.selectedCardIds)) imported.selectedCardIds = [];
  ensureDomainVaultBonuses(imported);


  state.characters.push(imported);
  setActiveChar(imported.id); // salva + renderAll
}


  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      version: 1,
      activeCharacterId: null,
      characters: [],
      print: { bleedOn: false, cropMarks: true, addBackSheets: true },
      ui: { domainView: "grid" }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
}

function b64DecodeUnicode(b64) {
  const bin = atob(b64);
  const bytes = Array.from(bin, c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
  return decodeURIComponent(bytes);
}

 function uid() {
  return "ch_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}
  function findChar(id) {
    return state.characters.find(c => c.id === id) || null;
  }

  function randomItem(items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  function createRandomCharacter() {
    const communities = getCardsByKind("community");
    const ancestries = getCardsByKind("ancestry");
    const classEntries = Object.entries(rules?.classes || {}).filter(([, def]) =>
      def && def.subclasses && Object.keys(def.subclasses).length > 0
    );

    const community = randomItem(communities);
    const ancestry = randomItem(ancestries);
    const classEntry = randomItem(classEntries);

    if (!community || !ancestry || !classEntry) {
      alert("Impossibile creare il personaggio casuale: mancano Community, Ancestry, Classi o Sottoclassi nei dati caricati.");
      return;
    }

    const [classKey, classDef] = classEntry;
    const subclassKey = randomItem(Object.keys(classDef.subclasses));
    if (!subclassKey) return;

    const id = uid();
    const ch = {
      id,
      name: "PG Casuale",
      level: 1,
      classKey,
      subclassKey,
      communityId: community.id,
      ancestryId: ancestry.id,
      mixed: false,
      mixedAncestryId: "",
      multiclassPick: "",
      multiclassClassKey: "",
      multiclassDomainIdx: null,
      subclassPicks: { specialization: false, mastery: false },
      domainVaultBonuses: { b2: false, b5: false, b8: false },
      selectedCardIds: []
    };

    state.characters.push(ch);
    setActiveChar(id);
  }


  function deleteCharacterById(charId) {
  const ch = findChar(charId);
  if (!ch) return;

  const ok = confirm(`Vuoi eliminare definitivamente il personaggio "${ch.name || "(senza nome)"}"?`);
  if (!ok) return;

  const idx = state.characters.findIndex(c => c.id === charId);
  if (idx >= 0) state.characters.splice(idx, 1);

  // Se ho eliminato quello attivo, scelgo un nuovo active
  if (state.activeCharacterId === charId) {
    const next = state.characters[0]?.id || null;
    state.activeCharacterId = next;
    activeChar = next ? findChar(next) : null;
  }

  saveState();
  renderAll();
}


  function setActiveChar(id) {
    state.activeCharacterId = id;
    saveState();
    activeChar = findChar(id);
    renderAll();
  }

  function getCardById(id) {
    return catalog.cards.find(c => c.id === id) || null;
  }

  function getCardsByKind(kind) {
    return catalog.cards.filter(c => c.kind === kind);
  }

  function isTransformationCard(card) {
    const domain = String(card?.domain || "").trim().toLowerCase();

    return (
      Number(card?.level) === -1 ||
      domain === "transformation" ||
      domain === "transformations" ||
      domain === "trasformazione" ||
      domain === "trasformazioni"
    );
  }

  function getClassDef(classKey) {
    return rules.classes[classKey] || null;
  }

  function getSubclassDef(classKey, subclassKey) {
    const c = getClassDef(classKey);
    if (!c) return null;
    return c.subclasses[subclassKey] || null;
  }

function requiredFieldsOk(ch) {
  if (!(ch && ch.name && ch.level && ch.classKey && ch.subclassKey && ch.communityId)) return false;
  if (!ch.ancestryId) return false;
  if (ch.mixed) return !!ch.mixedAncestryId;
  return true;
}


  function ensureSubclassPicks(ch) {
    if (!ch.subclassPicks) ch.subclassPicks = { specialization: false, mastery: false };
    if (typeof ch.subclassPicks.specialization !== "boolean") ch.subclassPicks.specialization = false;
    if (typeof ch.subclassPicks.mastery !== "boolean") ch.subclassPicks.mastery = false;
  }

  function ensureDomainVaultBonuses(ch) {
  if (!ch.domainVaultBonuses) ch.domainVaultBonuses = { b2: false, b5: false, b8: false };
  if (typeof ch.domainVaultBonuses.b2 !== "boolean") ch.domainVaultBonuses.b2 = false;
  if (typeof ch.domainVaultBonuses.b5 !== "boolean") ch.domainVaultBonuses.b5 = false;
  if (typeof ch.domainVaultBonuses.b8 !== "boolean") ch.domainVaultBonuses.b8 = false;
}


  function clampSubclassPicksByLevel(ch) {
    const specMin = rules.meta.subclassUnlocks.specializationMinLevel;
    const mastMin = rules.meta.subclassUnlocks.masteryMinLevel;
    ensureSubclassPicks(ch);
    if (Number(ch.level) < specMin) ch.subclassPicks.specialization = false;
    if (Number(ch.level) < mastMin) ch.subclassPicks.mastery = false;
  }

function pruneSelectedDomainToEligible(ch) {
  if (!ch || !Array.isArray(ch.selectedCardIds)) return;

  const eligibleIds = new Set(currentEligibleDomainCards(ch).map(c => c.id));

  const before = ch.selectedCardIds.length;
  ch.selectedCardIds = ch.selectedCardIds.filter(id => eligibleIds.has(id));

  if (ch.selectedCardIds.length !== before) saveState();
}


 function currentEligibleDomainCards(ch) {
  if (!ch || !requiredFieldsOk(ch)) return [];
  const classDef = getClassDef(ch.classKey);
  if (!classDef) return [];

  const lvl = Number(ch.level) || 1;

  // domini base (classe PG)
  const baseDomains = new Set(classDef.domains);

  // dominio multiclasse (se attivo)
  let mcDomain = "";
  if (ch.multiclass) {
    const mcClassDef = getClassDef(ch.multiclassClassKey);
    if (mcClassDef) {
      // supporta sia idx che stringa (nel caso tu abbia ancora vecchi salvataggi)
      if (typeof ch.multiclassDomainIdx === "number" && mcClassDef.domains[ch.multiclassDomainIdx]) {
        mcDomain = mcClassDef.domains[ch.multiclassDomainIdx];
      } else if (typeof ch.multiclassDomain === "string") {
        mcDomain = ch.multiclassDomain;
      }
    }
  }

  const mcMaxLvl = Math.ceil(lvl / 2);

  return catalog.cards
    .filter(c => c.kind === "domain")
    .filter(c => {
      const cardLvl = Number(c.level);

      // Le carte speciali sono sempre disponibili.
      if (isTransformationCard(c)) return true;

      // domini base: limite normale
      if (baseDomains.has(c.domain)) return cardLvl <= lvl;

      // dominio multiclasse: limite ceil(lvl/2)
      if (mcDomain && c.domain === mcDomain) return cardLvl <= mcMaxLvl;

      return false;
    })
    .sort((a,b) => a.id.localeCompare(b.id));
}



function isTransformationCardId(cardId) {
  const card = getCardById(cardId);
  return !!(card && card.kind === "domain" && isTransformationCard(card));
}

function countSelectedDomainNonSpecial(selectedIds) {
  let n = 0;
  for (const id of selectedIds) {
    const card = getCardById(id);
    if (!card) continue;
    if (card.kind !== "domain") continue;
    if (isTransformationCard(card)) continue; // le carte speciali non contano
    n++;
  }
  return n;
}

  function renderCharList() {
    elCharList.innerHTML = "";

    if (state.characters.length === 0) {
      const div = document.createElement("div");
      div.className = "empty";
      div.innerHTML = 'Nessun personaggio. Clicca <i class="fa-solid fa-user-plus"></i> o <i class="fa-solid fa-dice"></i>';
      elCharList.appendChild(div);
      return;
    }

    for (const ch of state.characters) {
      const row = document.createElement("div");
      row.className = "listItem" + (state.activeCharacterId === ch.id ? " active" : "");

      const main = document.createElement("div");
      main.className = "listItem__main";

      const title = document.createElement("div");
      title.className = "listItem__title";
      title.textContent = ch.name || "(senza nome)";

      const sub = document.createElement("div");
      sub.className = "listItem__sub";
      sub.textContent = `Lvl ${ch.level>10?10:ch.level || "?"} • ${ch.classKey || "classe?"}/${ch.subclassKey || "sottoclasse?"}`;

      main.appendChild(title);
      main.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "listItem__actions";

      const btnOpen = document.createElement("button");
      btnOpen.className = "btn";
      btnOpen.type = "button";
      btnOpen.title = "Modifica personaggio";
      btnOpen.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
      btnOpen.onclick = () => setActiveChar(ch.id);

      const btnShare = document.createElement("button");
      btnShare.className = "btn";
      btnShare.type = "button";
      btnShare.title = "Esporta personaggio";
      btnShare.innerHTML = '<i class="fa-solid fa-share-nodes fa-lg"></i>';
      btnShare.onclick = () => exportCharacterById(ch.id);

      
      const btnDup = document.createElement("button");
      btnDup.className = "btn";
      btnDup.type = "button";
      btnDup.title = "Duplica personaggio";
      btnDup.innerHTML = '<i class="fa-solid fa-clone"></i>';
      btnDup.onclick = () => {
        const copy = structuredClone(ch);
        copy.id = uid();
        copy.name = (copy.name || "PG") + " (copia)";
        state.characters.push(copy);
        setActiveChar(copy.id);
      };
      const btnDel = document.createElement("button");
btnDel.className = "btn btn--danger";
btnDel.type = "button";
btnDel.title = "Elimina personaggio";
btnDel.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
btnDel.onclick = () => deleteCharacterById(ch.id);

      actions.appendChild(btnOpen);
      actions.appendChild(btnDup);
      actions.appendChild(btnShare);
      actions.appendChild(btnDel);

      row.appendChild(main);
      row.appendChild(actions);
      elCharList.appendChild(row);
    }
  }

  function fillSelectOptions(select, items, {placeholder} = {}) {
    select.innerHTML = "";
    if (placeholder) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      select.appendChild(opt);
    }
    for (const it of items) {
      const opt = document.createElement("option");
      opt.value = it.value;
      opt.textContent = it.label;
      select.appendChild(opt);
    }
  }
function updateVaultBonusUI() {
  if (!activeChar) return;

  ensureDomainVaultBonuses(activeChar);

  const lvl = Number(activeChar.level) || 1;

  // sblocco: si possono prendere anche più tardi, quindi:
  // - disabilitate solo se non hai ancora raggiunto il livello minimo
  const canB2 = lvl >= 2;
  const canB5 = lvl >= 5;
  const canB8 = lvl >= 8;

  // se il livello scende sotto soglia, spengo e disabilito (evita stati incoerenti)
  if (!canB2) activeChar.domainVaultBonuses.b2 = false;
  if (!canB5) activeChar.domainVaultBonuses.b5 = false;
  if (!canB8) activeChar.domainVaultBonuses.b8 = false;

  optVaultB2.checked = !!activeChar.domainVaultBonuses.b2;
  optVaultB5.checked = !!activeChar.domainVaultBonuses.b5;
  optVaultB8.checked = !!activeChar.domainVaultBonuses.b8;

  optVaultB2.disabled = !canB2;
  optVaultB5.disabled = !canB5;
  optVaultB8.disabled = !canB8;

  // hint max
  vaultMaxHint.textContent = String(getMaxDomainVault(activeChar));
}



  function renderEditor() {
    if (!activeChar) {
      editorEmpty.classList.remove("hidden");
      editorForm.classList.add("hidden");
      activeHint.textContent = "";
      return;
    }

    editorEmpty.classList.add("hidden");
    editorForm.classList.remove("hidden");
    activeHint.textContent = `ID: ${activeChar.id}`;

    // Print options global
if (optBleed) optBleed.checked = !!state.print.bleedOn;
if (optCrop)  optCrop.checked  = !!state.print.cropMarks;
if (optBack)  optBack.checked  = !!state.print.addBackSheets;


    // Fill class select
    const classItems = Object.entries(rules.classes).map(([key, def]) => ({
      value: key, label: def.label
    }));
    fillSelectOptions(chClass, classItems, {placeholder:"Seleziona classe…"});
// Classi per multiclasse (esclude la classe principale)
const mcClasses = classItems.filter(c => c.value !== activeChar.classKey);
fillSelectOptions(chMulticlassClass, mcClasses, { placeholder: "Classe multiclasse…" });

chMulticlassClass.value = activeChar.multiclassClassKey || "";
// === Dominio multiclasse (value = 0/1) ===
chMulticlassDomain.innerHTML = "";

if (activeChar.multiclass && activeChar.multiclassClassKey) {
  const mcDef = getClassDef(activeChar.multiclassClassKey);
  const doms = mcDef?.domains || [];

  // placeholder
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Dominio multiclasse…";
  chMulticlassDomain.appendChild(ph);

  doms.slice(0, 2).forEach((label, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);     // "0" o "1"
    opt.textContent = label;     // label nella lingua corrente
    chMulticlassDomain.appendChild(opt);
  });

  chMulticlassDomain.value =
    (activeChar.multiclassDomainIdx === 0 || activeChar.multiclassDomainIdx === 1)
      ? String(activeChar.multiclassDomainIdx)
      : "";
} else {
  // se non attivo, tienilo vuoto
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Dominio multiclasse…";
  chMulticlassDomain.appendChild(ph);
  chMulticlassDomain.value = "";
}

    // Fill community/ancestry selects from catalog
    // Fill community/ancestry selects from catalog (ordinati alfabeticamente)
    const communityItems = getCardsByKind("community")
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }))
      .map(c => ({ value: c.id, label: c.name }));

    const ancestryItems = getCardsByKind("ancestry")
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "it", { sensitivity: "base" }))
      .map(c => ({ value: c.id, label: c.name }));

    fillSelectOptions(chCommunity, communityItems, { placeholder: "Seleziona community…" });
    fillSelectOptions(chAncestry, ancestryItems, { placeholder: "Seleziona ancestry…" });
const mixedOpt = document.createElement("option");
mixedOpt.value = MIXED_VALUE;
mixedOpt.textContent = "Mixed";
chAncestry.appendChild(mixedOpt);

fillSelectOptions(chAncestryMix1, ancestryItems, { placeholder: "Ancestry 1…" });
fillSelectOptions(chAncestryMix2, ancestryItems, { placeholder: "Ancestry 2…" });


    // Assign values
    chName.value = activeChar.name || "";
    chLevel.value = activeChar.level || 1;
    chClass.value = activeChar.classKey || "";
    chCommunity.value = activeChar.communityId || "";
   chAncestry.value = activeChar.mixed ? MIXED_VALUE : (activeChar.ancestryId || "");

if (activeChar.mixed) {
  mixedAncestryBox.classList.remove("hidden");
  chAncestryMix1.value = activeChar.ancestryId || "";
  chAncestryMix2.value = activeChar.mixedAncestryId || "";
} else {
  mixedAncestryBox.classList.add("hidden");
  chAncestryMix1.value = "";
  chAncestryMix2.value = "";
}

    updateCommunityAncestryZoomButtons();



// === Multiclasse (nuova UI): consentita solo da lvl 5 ===
const lvl = Number(activeChar.level) || 1;
const canMulticlass = lvl >= 5;

if (!canMulticlass) {
  activeChar.multiclass = false;
  activeChar.multiclassPick = ""; // "spec" | "mast" | ""
  activeChar.multiclassClassKey = "";
  activeChar.multiclassDomainIdx = null;
  multiclassBox.classList.add("hidden");
} else {
  multiclassBox.classList.toggle("hidden", !activeChar.multiclass);
}



    // Subclass depends on class
    renderSubclassSelect();
    chSubclass.value = activeChar.subclassKey || "";

    // Ensure picks
ensureSubclassPicks(activeChar);
ensureDomainVaultBonuses(activeChar);
updateVaultBonusUI();

clampSubclassPicksByLevel(activeChar);
renderSubclassCardsBox();
  }

  function renderSubclassSelect() {
    const classKey = chClass.value || activeChar?.classKey;
    if (!classKey) {
      fillSelectOptions(chSubclass, [], {placeholder:"Seleziona classe prima…"});
      return;
    }
    const classDef = getClassDef(classKey);
    const items = Object.entries(classDef.subclasses).map(([k, def]) => ({ value: k, label: def.label }));
    fillSelectOptions(chSubclass, items, {placeholder:"Seleziona sottoclasse…"});
  }

  function renderSubclassCardsBox() {
    subclassCards.innerHTML = "";

    const ch = activeChar;
    if (!ch || !requiredFieldsOk(ch)) {
      const div = document.createElement("div");
      div.className = "muted small";
      div.textContent = "Completa classe/sottoclasse per vedere le carte.";
      subclassCards.appendChild(div);
      return;
    }

    const classDef = getClassDef(ch.classKey);
    const subDef = getSubclassDef(ch.classKey, ch.subclassKey);
    if (!classDef || !subDef) return;

    const specMin = rules.meta.subclassUnlocks.specializationMinLevel;
    const mastMin = rules.meta.subclassUnlocks.masteryMinLevel;

    const baseId = subDef.cards.base;
    const specId = subDef.cards.specialization;
    const mastId = subDef.cards.mastery;

    const baseCard = getCardById(baseId);
    const specCard = getCardById(specId);
    const mastCard = getCardById(mastId);

    const lvl = Number(ch.level);

    const mkLine = ({title, card, mode, enabled, checked, onChange, mcChecked, mcDisabled, onMcChange}) => {

      const line = document.createElement("div");
      line.className = "subline" + (!enabled ? " disabled" : "");

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "10px";

      const thumbWrap = document.createElement("div");
thumbWrap.className = "subThumbWrap";

const img = document.createElement("img");
img.className = "subThumb";
img.alt = "";
img.src = card?.thumb || "";
thumbWrap.appendChild(img);

// lente SOLO se la carta è "usabile" (non bloccata dal livello) e la card esiste
if (enabled && card) {
  const zoom = document.createElement("div");
  zoom.className = "zoom-icon zoom-icon--sub";
  zoom.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;
  zoom.onclick = (e) => {
    e.stopPropagation();
    openZoomModalSingleCard(card.id);
  };
  thumbWrap.appendChild(zoom);
}

left.appendChild(thumbWrap);


      const txt = document.createElement("div");
      const b = document.createElement("b");
      b.textContent = title;
      const m = document.createElement("div");
      m.className = "muted";
      m.textContent = card ? `${card.name}` : "Carta non trovata nel catalogo";
      txt.appendChild(b);
      txt.appendChild(m);
      left.appendChild(txt);

      const right = document.createElement("div");
      right.className = "right";

      if (mode === "fixed") {
        const badge = document.createElement("span");
        badge.className = "muted small";
        badge.textContent = "Sempre";
        right.appendChild(badge);
      } else {
        // === Includi ===
const label = document.createElement("label");
label.className = "check";

const cb = document.createElement("input");
cb.type = "checkbox";
cb.checked = !!checked;

// se la riga non è sbloccata -> disabled
// se multiclasse su questa riga è attiva -> disabled
cb.disabled = !enabled || !!mcChecked;

cb.onchange = () => onChange(cb.checked);

const span = document.createElement("span");
span.textContent = "Prendi";

label.appendChild(cb);
label.appendChild(span);
right.appendChild(label);

// se NON sbloccata, mostra "Richiede..."
if (!enabled) {
  const note = document.createElement("span");
  note.className = "muted small";
  note.textContent = `Richiede lvl ${mode === "spec" ? specMin : mastMin}`;
  right.appendChild(note);
}

// se sbloccata e mode è spec/mast -> mostra checkbox Multiclasse
if (enabled && (mode === "spec" || mode === "mast")) {
  const mcLabel = document.createElement("label");
  mcLabel.className = "check";

  const mcCb = document.createElement("input");
  mcCb.type = "checkbox";
  mcCb.checked = !!mcChecked;
  mcCb.disabled = !!mcDisabled;

  mcCb.onchange = () => onMcChange(mcCb.checked);

  const mcSpan = document.createElement("span");
  mcSpan.textContent = "Multiclasse";

  mcLabel.appendChild(mcCb);
  mcLabel.appendChild(mcSpan);
  right.appendChild(mcLabel);
}

      }

      line.appendChild(left);
      line.appendChild(right);
      return line;
    };

    // Base (always)
    subclassCards.appendChild(mkLine({
      title: "Privilegio Base",
      card: baseCard,
      mode: "fixed",
      enabled: true
    }));

    // Specialization
    const specEnabled = lvl >= specMin;

subclassCards.appendChild(mkLine({
  title: "Specializzazione",
  card: specCard,
  mode: "spec",
  enabled: specEnabled,

  checked: ch.subclassPicks.specialization,
  onChange: (v) => {
    ch.subclassPicks.specialization = v;
    saveState();
  },

  mcChecked: ch.multiclass && ch.multiclassPick === "spec",
  mcDisabled: ch.multiclass && ch.multiclassPick === "mast", // se l’altro è attivo, questo è bloccato

  onMcChange: (v) => {
    // se attivi multiclass su spec: forza Includi spec a false
    if (v) {
      ch.subclassPicks.specialization = false;
      ch.multiclass = true;
      ch.multiclassPick = "spec";
      multiclassBox.classList.remove("hidden");
    } else {
      // spegnimento multiclass solo se era quello attivo
      if (ch.multiclassPick === "spec") {
        ch.multiclass = false;
        ch.multiclassPick = "";
        ch.multiclassClassKey = "";
        ch.multiclassDomainIdx = null;
        multiclassBox.classList.add("hidden");
      }
    }

    pruneSelectedDomainToEligible(ch);
    saveState();
    renderSubclassCardsBox();
    renderDomainCards();
    updateCountsAndPrintLink();
    renderDomainFilters(ch);
  }
}));


    // Mastery
    const mastEnabled = lvl >= mastMin;

subclassCards.appendChild(mkLine({
  title: "Maestria",
  card: mastCard,
  mode: "mast",
  enabled: mastEnabled,

  checked: ch.subclassPicks.mastery,
  onChange: (v) => {
    ch.subclassPicks.mastery = v;
    saveState();
  },

  mcChecked: ch.multiclass && ch.multiclassPick === "mast",
  mcDisabled: ch.multiclass && ch.multiclassPick === "spec",

  onMcChange: (v) => {
    if (v) {
      ch.subclassPicks.mastery = false;
      ch.multiclass = true;
      ch.multiclassPick = "mast";
      multiclassBox.classList.remove("hidden");
    } else {
      if (ch.multiclassPick === "mast") {
        ch.multiclass = false;
        ch.multiclassPick = "";
        ch.multiclassClassKey = "";
        ch.multiclassDomainIdx = null;
        multiclassBox.classList.add("hidden");
      }
    }

    pruneSelectedDomainToEligible(ch);
    saveState();
    renderSubclassCardsBox();
    renderDomainCards();
    updateCountsAndPrintLink();
    renderDomainFilters(ch);
  }
}));

  }

  function renderDomainFilters(ch) {
    filterDomain.innerHTML = `<option value="">Tutti i domini</option>`;
    if (!ch || !requiredFieldsOk(ch)) return;

    const classDef = getClassDef(ch.classKey);
    if (!classDef) return;

    for (const d of classDef.domains) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      filterDomain.appendChild(opt);
    }
    const mcDomain = getMulticlassDomain(ch);
if (ch.multiclass && mcDomain && !classDef.domains.includes(mcDomain)) {
  const opt = document.createElement("option");
  opt.value = mcDomain;
  opt.textContent = mcDomain;
  filterDomain.appendChild(opt);
}
      const special = document.createElement("option");
      special.value = "__transformations__";
      special.textContent = "Trasformazioni";
      filterDomain.appendChild(special);

  }

function hasKnowledgeMageBonus(ch) {
  if (!ch) return false;
  return ch.classKey === "wizard" && ch.subclassKey === "school_of_knowledge";
}


function getMaxDomainVault(ch) {
  const lvl = Number(ch?.level) || 1;

  // regola base confermata
  const base = lvl + 1;

  ensureDomainVaultBonuses(ch);

  const bonusSubclass = hasKnowledgeMageBonus(ch) ? 1 : 0;
  const b = ch.domainVaultBonuses;

  const bonusWindows =
    (b.b2 ? 1 : 0) +
    (b.b5 ? 1 : 0) +
    (b.b8 ? 1 : 0);

  return base + bonusSubclass + bonusWindows;
}


function trySetDomainCardSelected(ch, cardId, wantSelected, { source = "" } = {}) {
  if (!ch) return false;
  if (!Array.isArray(ch.selectedCardIds)) ch.selectedCardIds = [];

  const set = new Set(ch.selectedCardIds);
  const already = set.has(cardId);

  // Deselezionare è sempre permesso
  if (!wantSelected) {
    if (already) {
      set.delete(cardId);
      ch.selectedCardIds = Array.from(set).sort();
      saveState();
    }
    return true;
  }

  // Se è già selezionata, ok
  if (already) return true;

  // Controllo cap
  // Controllo cap (le "Transformation" NON contano e sono illimitate)
if (!isTransformationCardId(cardId)) {
  const cap = getMaxDomainVault(ch);


  // conta solo le dominio NON-speciali tra quelle già selezionate
  const used = countSelectedDomainNonSpecial(set);

  if (used >= cap) {
    alert(
      `Hai raggiunto il numero massimo di Carte Dominio possedute per questo livello.\n` +
      `Massimo (Vault) a lvl ${ch.level}: ${cap}\n` +
      `Le carte Transformation non contano nel limite.`
    );
    return false;
  }
}

  set.add(cardId);
  ch.selectedCardIds = Array.from(set).sort();
  saveState();
  return true;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

  function renderDomainCards() {
    const ch = activeChar;
    const ok = ch && requiredFieldsOk(ch);
    if (!ok) {
      domainEmpty.classList.remove("hidden");
      domainGrid.classList.add("hidden");
      btnPrint.classList.add("disabled");
      domainHint.textContent = "";
      selCount.textContent = "0";
      sheetCount.textContent = "0";
      return;
    }

    clampSubclassPicksByLevel(ch);

    const prevDomFilter = filterDomain.value || "";
    const eligible = currentEligibleDomainCards(ch);
    renderDomainFilters(ch);
    filterDomain.value = prevDomFilter;

    const classDef = getClassDef(ch.classKey);
   const lvl = Number(ch.level) || 1;
const mcPart = (ch.multiclass ? ` — Multiclasse: + dominio (≤ lvl ${Math.ceil(lvl/2)})` : "");
domainHint.textContent = `Domini classe: ${classDef.domains.join(" + ")} — Carte disponibili: ${eligible.length}${mcPart}`;


    const q = (search.value || "").trim().toLowerCase();
    const domFilter = filterDomain.value || "";

    visibleDomainCards = eligible
      .filter(c => {
        if (domFilter === "__transformations__") {
          if (!isTransformationCard(c)) return false;
        } else if (domFilter) {
          if (c.domain !== domFilter) return false;
        } else if (isTransformationCard(c)) {
          return false;
        }

        if (!q) return true;
        return (c.name || "").toLowerCase().includes(q) || c.id.includes(q);
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    domainGrid.innerHTML = "";
    domainEmpty.classList.add("hidden");
    domainGrid.classList.remove("hidden");

    // Ensure selection list exists
    if (!Array.isArray(ch.selectedCardIds)) ch.selectedCardIds = [];

    const selectedSet = new Set(ch.selectedCardIds);

    for (const card of visibleDomainCards) {
      const tile = document.createElement("div");
      tile.className = "cardTile";
      tile.classList.toggle("active", selectedSet.has(card.id));


      const imgWrap = document.createElement("div");
      imgWrap.className = "cardTile__img";
      const isListView = (state.ui?.domainView || "grid") === "list";
      if (isListView) imgWrap.classList.add("hidden");

      imgWrap.style.backgroundImage = `url(${card.front})`;
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.src = card.front || card.thumb;
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "cardTile__body";
      const bodyDescription = document.createElement("div");




const raw = String(card.description || "");
const safe = escapeHtml(raw)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/_(.+?)_/g, "<em>$1</em>")
  .replaceAll("•","<br>•")
  .replaceAll("\n\n","<br>");
bodyDescription.innerHTML = safe;


  
     
      bodyDescription.className = "cardTile__description";
      if (!isListView) bodyDescription.classList.add("hidden");
      const zoom = document.createElement("div");
      zoom.className = "zoom-icon";
      zoom.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `;


      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.classList.add("hidden");
      cb.checked = selectedSet.has(card.id);
      cb.onchange = () => {
  const ok = trySetDomainCardSelected(ch, card.id, cb.checked, { source: "grid" });

  if (!ok) {
    cb.checked = false;                // revert
    tile.classList.remove("active");
    return;
  }

  tile.classList.toggle("active", cb.checked);
  updateCountsAndPrintLink();
};

      tile.style.cursor = "pointer";
      tile.onclick = (e) => {
        if (e.target === cb) return; // se clicchi proprio sul checkbox, lascia fare a lui
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      };
      zoom.onclick = (e) => {
        e.stopPropagation();
        openZoomModalByCardId(card.id, visibleDomainCards);
      };

      const txt = document.createElement("div");
      txt.className = "cardTile__text";
      const name = document.createElement("div");
      name.className = "cardTile__name";
      name.textContent = `${card.name}`;
      const meta = document.createElement("div");
      meta.className = "cardTile__meta";
      meta.textContent = `${card.domain} • Lvl ${card.level}`;
      
      txt.appendChild(name);
      txt.appendChild(meta);
      
      body.appendChild(cb);
      body.appendChild(txt);
      body.appendChild(zoom);
      
      tile.appendChild(imgWrap);
      tile.appendChild(body);
      
      tile.appendChild(bodyDescription);

      domainGrid.appendChild(tile);
    }

    updateCountsAndPrintLink();
  }

  function computePrintCardIds(ch) {
  const out = [];

  const pushUnique = (id) => {
    if (!id) return;
    if (!out.includes(id)) out.push(id);
  };

  // 1) Mandatory in ordine fisso
  pushUnique(ch.communityId);
  pushUnique(ch.ancestryId);
  if (ch.mixed) pushUnique(ch.mixedAncestryId);


  const classDef = getClassDef(ch.classKey);
  const subDef = getSubclassDef(ch.classKey, ch.subclassKey);

  const specMin = rules.meta.subclassUnlocks.specializationMinLevel;
  const mastMin = rules.meta.subclassUnlocks.masteryMinLevel;

  ensureSubclassPicks(ch);

  if (subDef?.cards?.base) pushUnique(subDef.cards.base);

  if (ch.subclassPicks.specialization && Number(ch.level) >= specMin) {
    pushUnique(subDef.cards.specialization);
  }
  if (ch.subclassPicks.mastery && Number(ch.level) >= mastMin) {
    pushUnique(subDef.cards.mastery);
  }

  // 2) Domain cards: order by class domains order, then level, then id
  const selected = new Set(Array.isArray(ch.selectedCardIds) ? ch.selectedCardIds : []);
  const eligible = currentEligibleDomainCards(ch);

  const eligibleSelected = eligible.filter(c => selected.has(c.id));

  const selectedTransformations = catalog.cards.filter(c =>
    c.kind === "domain" &&
    selected.has(c.id) &&
    isTransformationCard(c)
  );

  for (const card of selectedTransformations) {
    if (!eligibleSelected.some(c => c.id === card.id)) {
      eligibleSelected.push(card);
    }
  }

  const domainOrder = new Map();
  (classDef?.domains || []).forEach((d, i) => domainOrder.set(d, i));

  eligibleSelected.sort((a, b) => {
    const aSpecial = isTransformationCard(a);
    const bSpecial = isTransformationCard(b);

    if (aSpecial !== bSpecial) return aSpecial ? 1 : -1;

    const da = domainOrder.has(a.domain) ? domainOrder.get(a.domain) : 999;
    const db = domainOrder.has(b.domain) ? domainOrder.get(b.domain) : 999;
    if (da !== db) return da - db;

    const la = Number(a.level);
    const lb = Number(b.level);
    if (la !== lb) return la - lb;

    return a.id.localeCompare(b.id);
  });

  for (const c of eligibleSelected) pushUnique(c.id);

  return out;
}


  function updateCountsAndPrintLink() {
    const ch = activeChar;
    if (!ch || !requiredFieldsOk(ch)) {
      selCount.textContent = "0";
      sheetCount.textContent = "0";
      btnPrint.classList.add("disabled");
      btnPrint.href = "#";
      return;
    }

    const ids = computePrintCardIds(ch);
    selCount.textContent = String(ids.length);

    const sheets = Math.ceil(ids.length / 9);
    sheetCount.textContent = String(sheets);

    if (ids.length === 0) {
      btnPrint.classList.add("disabled");
      btnPrint.href = "#";
      return;
    }

    btnPrint.classList.remove("disabled");
    btnPrint.href = `print.html?ch=${encodeURIComponent(ch.id)}`;
  }

function updateDomainViewButtons() {
  const v = state.ui?.domainView || "grid";
  if (btnViewGrid) btnViewGrid.setAttribute("aria-pressed", v === "grid" ? "true" : "false");
  if (btnViewList) btnViewList.setAttribute("aria-pressed", v === "list" ? "true" : "false");
}

function setDomainView(view) {
  if (!state.ui) state.ui = { domainView: "grid" };
  state.ui.domainView = view === "list" ? "list" : "grid";
  saveState();
  updateDomainViewButtons();
  renderDomainCards();
}


  function wireEvents() {
    btnNewChar.onclick = () => {
      const id = uid();
      const ch = {
        id,
        name: "Nuovo PG",
        level: 1,
        classKey: "",
        subclassKey: "",
        communityId: "",
        ancestryId: "",
        mixed: false,
mixedAncestryId: "",
multiclassPick: "",
multiclassClassKey: "",
multiclassDomainIdx: null,


        subclassPicks: { specialization: false, mastery: false },
        domainVaultBonuses: { b2: false, b5: false, b8: false },
        selectedCardIds: []
      };
      state.characters.push(ch);
      setActiveChar(id);
    };
    btnRandomChar.onclick = createRandomCharacter;
    btnExportChar.onclick = exportActiveCharacter;
    btnImportChar.onclick = importCharacterFromString;

btnLangITA.onclick = async () => {
  const prev = state.ui?.language || "eng";
  if (!state.ui) state.ui = { domainView: "grid", language: prev };

  // evita lavoro inutile
  if (state.ui.language === "ita") return;

  state.ui.language = "ita";

  try {
    await loadDataByLanguage("ita");
    saveState();
    renderAll();
  } catch (err) {
    console.error(err);
    state.ui.language = prev; // rollback
    saveState();
    alert("Errore: non riesco a caricare i file ITA (cardsITA.json / rulesITA.json). Controlla che esistano e che il path sia corretto.");
  }
};

btnLangENG.onclick = async () => {
  const prev = state.ui?.language || "eng";
  if (!state.ui) state.ui = { domainView: "grid", language: prev };

  // evita lavoro inutile
  if (state.ui.language === "eng") return;

  state.ui.language = "eng";

  try {
    await loadDataByLanguage("eng");
    saveState();
    renderAll();
  } catch (err) {
    console.error(err);
    state.ui.language = prev; // rollback
    saveState();
    alert("Errore: non riesco a caricare i file ENG (cards.json / rules.json). Controlla che esistano e che il path sia corretto.");
  }
};

  if (btnZoomAncestryMix2) {
  btnZoomAncestryMix2.addEventListener("click", (e) => {
    e.preventDefault();
    if (!activeChar || !activeChar.mixed || !activeChar.mixedAncestryId) return;

    openZoomModalChoice(activeChar.mixedAncestryId, "ancestry", (card) => {
      if (!activeChar || !activeChar.mixed) return;

      activeChar.mixedAncestryId = card.id;
      chAncestryMix2.value = card.id;

      saveState();
      updateCountsAndPrintLink();
      renderCharList();
      updateCommunityAncestryZoomButtons();
    });
  });
}


    btnDeleteChar.onclick = () => {
  if (!activeChar) return;
  deleteCharacterById(activeChar.id);
};


chMulticlassClass.onchange = () => {
  if (!activeChar) return;

  activeChar.multiclassClassKey = chMulticlassClass.value;

  // reset dominio (perché i domini cambiano)
  activeChar.multiclassDomainIdx = null;

  // 🔪 elimina carte multiclass vecchie
  pruneSelectedDomainToEligible(activeChar);

  saveState();
  renderEditor();        // ricostruisce anche la select dei domini
  renderDomainCards();
  updateCountsAndPrintLink();
};






chMulticlassDomain.onchange = () => {
  if (!activeChar) return;

  const v = chMulticlassDomain.value;
  activeChar.multiclassDomainIdx =
    (v === "0" || v === "1") ? Number(v) : null;

  // 🔪 se il dominio cambia, rimuovi carte non più valide
  pruneSelectedDomainToEligible(activeChar);

  saveState();
  renderDomainCards();
  updateCountsAndPrintLink();
};




btnZoomCommunity.onclick = (e) => {
  e.preventDefault();
  const id = chCommunity.value;
  if (!id) return;

  openZoomModalChoice(id, "community", (card) => {
    if (!activeChar) return;

    activeChar.communityId = card.id;
    chCommunity.value = card.id;

    saveState();
    updateCountsAndPrintLink();
    renderCharList();
    updateCommunityAncestryZoomButtons();
  });
};
optVaultB2.onchange = () => {
  if (!activeChar) return;
  ensureDomainVaultBonuses(activeChar);
  activeChar.domainVaultBonuses.b2 = !!optVaultB2.checked;
  saveState();
  updateVaultBonusUI();
  updateCountsAndPrintLink();
};

optVaultB5.onchange = () => {
  if (!activeChar) return;
  ensureDomainVaultBonuses(activeChar);
  activeChar.domainVaultBonuses.b5 = !!optVaultB5.checked;
  saveState();
  updateVaultBonusUI();
  updateCountsAndPrintLink();
};

optVaultB8.onchange = () => {
  if (!activeChar) return;
  ensureDomainVaultBonuses(activeChar);
  activeChar.domainVaultBonuses.b8 = !!optVaultB8.checked;
  saveState();
  updateVaultBonusUI();
  updateCountsAndPrintLink();
};

btnZoomAncestry.onclick = (e) => {
  e.preventDefault();
  const id = activeChar?.ancestryId;
  if (!id) return;

  openZoomModalChoice(id, "ancestry", (card) => {
    if (!activeChar) return;

    activeChar.ancestryId = card.id;

    if (activeChar.mixed) {
      chAncestryMix1.value = card.id;
    } else {
      chAncestry.value = card.id;
    }

    saveState();
    updateCountsAndPrintLink();
    renderCharList();
    updateCommunityAncestryZoomButtons();
  });
};



    editorForm.onsubmit = (e) => {
      e.preventDefault();
      if (!activeChar) return;

      activeChar.name = chName.value.trim() || "PG";
      activeChar.level = Number(chLevel.value) || 1;
      activeChar.classKey = chClass.value;
      activeChar.subclassKey = chSubclass.value;
      activeChar.communityId = chCommunity.value;
      if (chAncestry.value === MIXED_VALUE) {
  activeChar.mixed = true;
  activeChar.ancestryId = chAncestryMix1.value;
  activeChar.mixedAncestryId = chAncestryMix2.value;
} else {
  activeChar.mixed = false;
  activeChar.ancestryId = chAncestry.value;
  activeChar.mixedAncestryId = "";
}

updateVaultBonusUI();

      ensureSubclassPicks(activeChar);
      clampSubclassPicksByLevel(activeChar);

      saveState();
      renderAll();
    };

    chClass.onchange = () => {
      if (!activeChar) return;
      activeChar.classKey = chClass.value;
      // reset subclass on class change
      activeChar.subclassKey = "";
      pruneSelectedDomainToEligible(activeChar);   
      saveState();
      updateVaultBonusUI();
      renderSubclassSelect();
      chSubclass.value = "";
      renderSubclassCardsBox();
      renderDomainCards();
      renderCharList();
      updateCountsAndPrintLink();
    };

    chSubclass.onchange = () => {
      if (!activeChar) return;
      activeChar.subclassKey = chSubclass.value;
      pruneSelectedDomainToEligible(activeChar);
      saveState();
      updateVaultBonusUI();
      renderSubclassCardsBox();
      renderDomainCards();
      renderCharList();
      updateCountsAndPrintLink();
    };
const onLevelChanged = () => {
  if (!activeChar) return;
const lvl = Number(activeChar.level) || 1;

// se scendi sotto 5: multiclass OFF
if (lvl < 5) {
  activeChar.multiclass = false;
  activeChar.multiclassPick = "";
  activeChar.multiclassClassKey = "";
  activeChar.multiclassDomainIdx = null;
  multiclassBox.classList.add("hidden");
}

// se scendi sotto 8 e avevi pick "mast", lo spengo (per coerenza col tuo requisito)
if (lvl < 8 && activeChar.multiclassPick === "mast") {
  activeChar.multiclass = false;
  activeChar.multiclassPick = "";
  activeChar.multiclassClassKey = "";
  activeChar.multiclassDomainIdx = null;
  multiclassBox.classList.add("hidden");
}

  activeChar.level = Number(chLevel.value) || 1;

 
  // resto logica livello
  clampSubclassPicksByLevel(activeChar);
  updateVaultBonusUI();
  pruneSelectedDomainToEligible(activeChar);

  saveState();
  renderSubclassCardsBox();
  renderDomainCards();
  renderCharList();
  updateCountsAndPrintLink();
};


chLevel.addEventListener("input", onLevelChanged);
chLevel.addEventListener("change", onLevelChanged);


    chCommunity.onchange = () => {
      if (!activeChar) return;
      activeChar.communityId = chCommunity.value;
      saveState();
      updateCountsAndPrintLink();
      renderCharList();
      updateCommunityAncestryZoomButtons();
    };

    chAncestry.onchange = () => {
  if (!activeChar) return;

  if (chAncestry.value === MIXED_VALUE) {
    activeChar.mixed = true;
    mixedAncestryBox.classList.remove("hidden");

    // prefill comodo: metti la prima ancestry già scelta dentro mix1
    if (activeChar.ancestryId) chAncestryMix1.value = activeChar.ancestryId;

    // se era vuoto ancestryId, prendilo dal mix1
    activeChar.ancestryId = chAncestryMix1.value || "";
    activeChar.mixedAncestryId = chAncestryMix2.value || "";
  } else {
    activeChar.mixed = false;
    activeChar.mixedAncestryId = "";
    activeChar.ancestryId = chAncestry.value;
    mixedAncestryBox.classList.add("hidden");
    chAncestryMix1.value = "";
    chAncestryMix2.value = "";
  }

  saveState();
  updateCountsAndPrintLink();
  renderCharList();
  updateCommunityAncestryZoomButtons();
};
chAncestryMix1.onchange = () => {
  if (!activeChar) return;
  activeChar.mixed = true;
  activeChar.ancestryId = chAncestryMix1.value || "";
  saveState();
  updateCountsAndPrintLink();
  renderCharList();
  updateCommunityAncestryZoomButtons();
};

chAncestryMix2.onchange = () => {
  if (!activeChar) return;
  activeChar.mixed = true;
  activeChar.mixedAncestryId = chAncestryMix2.value || "";
  saveState();
  updateCountsAndPrintLink();
  renderCharList();
  updateCommunityAncestryZoomButtons();
};


if (optBleed) {
  optBleed.onchange = () => {
    state.print.bleedOn = !!optBleed.checked;
    saveState();
  };
}

if (optCrop) {
  optCrop.onchange = () => {
    state.print.cropMarks = !!optCrop.checked;
    saveState();
  };
}

if (optBack) {
  optBack.onchange = () => {
    state.print.addBackSheets = !!optBack.checked;
    saveState();
  };
}


    search.oninput = () => renderDomainCards();
    filterDomain.onchange = () => renderDomainCards();
    btnViewGrid.onclick = () => setDomainView("grid");
    btnViewList.onclick = () => setDomainView("list");


    btnSelectAllVisible.onclick = () => {
  if (!activeChar || !requiredFieldsOk(activeChar)) return;

  let hitCap = false;
  for (const c of visibleDomainCards) {
    const ok = trySetDomainCardSelected(activeChar, c.id, true, { source: "bulk" });
    if (!ok) { hitCap = true; break; }
  }

  renderDomainCards();
  if (hitCap) {
    // alert già mostrato da trySetDomainCardSelected
  }
};


    btnLicense.onclick = () => {
    licenseModal.classList.remove("hidden");
    };

    licenseModal.addEventListener("click", (e) => {
      const close = e.target.closest("[data-license-close='1']");
      if (close) licenseModal.classList.add("hidden");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!licenseModal.classList.contains("hidden")) {
        licenseModal.classList.add("hidden");
      }
    });


    btnClearSelected.onclick = () => {
      if (!activeChar) return;
      activeChar.selectedCardIds = [];
      saveState();
      renderDomainCards();
    };
  }

  function renderAll() {
    renderCharList();
    renderEditor();
    renderDomainCards();

    if (activeChar) {
      activeHint.textContent = `ID: ${activeChar.id} • Carte selezionate dominio: ${(activeChar.selectedCardIds||[]).length}`;
    } else {
      activeHint.textContent = "";
    }
  }

 async function loadDataByLanguage(lang) {
  const isITA = lang === "ita";
  const cardsPath = isITA ? "data/cardsITA.json" : "data/cards.json";
  const rulesPath = isITA ? "data/rulesITA.json" : "data/rules.json";

  const [cardsRes, rulesRes] = await Promise.all([
    fetch(cardsPath, { cache: "no-store" }),
    fetch(rulesPath, { cache: "no-store" })
  ]);

  if (!cardsRes.ok) throw new Error(`Impossibile caricare ${cardsPath} (HTTP ${cardsRes.status})`);
  if (!rulesRes.ok) throw new Error(`Impossibile caricare ${rulesPath} (HTTP ${rulesRes.status})`);

  catalog = await cardsRes.json();
  rules = await rulesRes.json();
}


 async function init() {
  // carica cards.json / rules.json in base alla lingua salvata
  await loadDataByLanguage(state.ui.language);

  // pick active char if exists
  activeChar = state.activeCharacterId
    ? findChar(state.activeCharacterId)
    : null;

  if (!activeChar && state.characters.length > 0) {
    state.activeCharacterId = state.characters[0].id;
    saveState();
    activeChar = findChar(state.activeCharacterId);
  }

    wireEvents();
    updateDomainViewButtons();
    ensureZoomModal();
    renderAll();
  }

  init().catch(err => {
    console.error(err);
    alert("Errore nel caricamento dei dati (cards.json / rules.json). Controlla la console.");
  });
})();
