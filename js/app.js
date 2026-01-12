(() => {
  const STORAGE_KEY = "dh_print_state_v1";

  const $ = (id) => document.getElementById(id);

  const elCharList = $("charList");
  const editorEmpty = $("editorEmpty");
  const editorForm = $("editor");

  const btnNewChar = $("btnNewChar");
  const btnDeleteChar = $("btnDeleteChar");
  const btnPrint = $("btnPrint");

  const chName = $("chName");
  const chLevel = $("chLevel");
  const chClass = $("chClass");
  const chSubclass = $("chSubclass");
  const chCommunity = $("chCommunity");
  const chAncestry = $("chAncestry");

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



  let catalog = null; // cards.json
  let rules = null;   // rules.json

  let state = loadState();
  if (!state.ui) state.ui = { domainView: "grid" };
  if (state.ui.domainView !== "grid" && state.ui.domainView !== "list") state.ui.domainView = "grid";

  let activeChar = null;

  let visibleDomainCards = []; // currently filtered list in UI


    // ===== Zoom Modal =====
  let zoomModalEl = null;
  let zoomModalImgEl = null;
  let zoomModalPrevBtn = null;
  let zoomModalNextBtn = null;
  let zoomModalPanelEl = null;

  

  let zoomList = [];       // lista carte visibili (oggetti card)
  let zoomIndex = -1;      // indice corrente dentro zoomList


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

      if (!activeChar || zoomIndex < 0) return;
      const card = zoomList[zoomIndex];
      if (!card) return;

      if (!Array.isArray(activeChar.selectedCardIds)) activeChar.selectedCardIds = [];
      const set = new Set(activeChar.selectedCardIds);

      if (set.has(card.id)) set.delete(card.id);
      else set.add(card.id);

      activeChar.selectedCardIds = Array.from(set).sort();
      saveState();

      renderDomainCards();
      updateCountsAndPrintLink();
      setModalSelectedUI();
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
});
  }

  function openZoomModalByCardId(cardId, list) {
  ensureZoomModal();

  zoomList = Array.isArray(list) ? list : [];
  zoomIndex = zoomList.findIndex(c => c.id === cardId);

  // fallback: se non trovato, apri la prima
  if (zoomIndex < 0) zoomIndex = 0;

  zoomModalEl.classList.add("open");
  zoomShowCurrent();
}

  function closeZoomModal() {
  if (!zoomModalEl) return;
  zoomModalEl.classList.remove("open");
  if (zoomModalImgEl) zoomModalImgEl.src = "";
  zoomList = [];
  zoomIndex = -1;
}

function isCardSelected(ch, cardId) {
  if (!ch || !Array.isArray(ch.selectedCardIds)) return false;
  return ch.selectedCardIds.includes(cardId);
}

function setModalSelectedUI() {
  if (!zoomModalPanelEl) return;

  const card = zoomList[zoomIndex];
  const selected = !!(card && isCardSelected(activeChar, card.id));

  zoomModalPanelEl.classList.toggle("is-selected", selected);
}

function setZoomNavDisabled() {
  if (!zoomModalPrevBtn || !zoomModalNextBtn) return;
  zoomModalPrevBtn.disabled = zoomIndex <= 0;
  zoomModalNextBtn.disabled = zoomIndex >= zoomList.length - 1;
}


function zoomShowCurrent() {
  if (!zoomModalImgEl) return;
  const card = zoomList[zoomIndex];
  if (!card) return;

  zoomModalImgEl.src = card.front || card.thumb || card.back || "";
  setZoomNavDisabled();
  setModalSelectedUI();
}


function zoomStep(delta) {
  const next = zoomIndex + delta;
  if (next < 0 || next >= zoomList.length) return;
  zoomIndex = next;
  zoomShowCurrent();
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
  if (!imported.subclassPicks) imported.subclassPicks = { specialization: false, mastery: false };
  if (!Array.isArray(imported.selectedCardIds)) imported.selectedCardIds = [];

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
    return "ch_" + Date.now();
  }

  function findChar(id) {
    return state.characters.find(c => c.id === id) || null;
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

  function getClassDef(classKey) {
    return rules.classes[classKey] || null;
  }

  function getSubclassDef(classKey, subclassKey) {
    const c = getClassDef(classKey);
    if (!c) return null;
    return c.subclasses[subclassKey] || null;
  }

  function requiredFieldsOk(ch) {
    return !!(ch && ch.name && ch.level && ch.classKey && ch.subclassKey && ch.communityId && ch.ancestryId);
  }

  function ensureSubclassPicks(ch) {
    if (!ch.subclassPicks) ch.subclassPicks = { specialization: false, mastery: false };
    if (typeof ch.subclassPicks.specialization !== "boolean") ch.subclassPicks.specialization = false;
    if (typeof ch.subclassPicks.mastery !== "boolean") ch.subclassPicks.mastery = false;
  }

  function clampSubclassPicksByLevel(ch) {
    const specMin = rules.meta.subclassUnlocks.specializationMinLevel;
    const mastMin = rules.meta.subclassUnlocks.masteryMinLevel;
    ensureSubclassPicks(ch);
    if (Number(ch.level) < specMin) ch.subclassPicks.specialization = false;
    if (Number(ch.level) < mastMin) ch.subclassPicks.mastery = false;
  }

  function currentEligibleDomainCards(ch) {
    if (!ch || !requiredFieldsOk(ch)) return [];
    const classDef = getClassDef(ch.classKey);
    if (!classDef) return [];

    const allowedDomains = new Set(classDef.domains);
    const lvl = Number(ch.level);

    return catalog.cards
      .filter(c => c.kind === "domain")
      .filter(c => allowedDomains.has(c.domain))
      .filter(c => Number(c.level) <= lvl)
      .sort((a,b) => a.id.localeCompare(b.id));
  }

  function renderCharList() {
    elCharList.innerHTML = "";

    if (state.characters.length === 0) {
      const div = document.createElement("div");
      div.className = "empty";
      div.textContent = "Nessun personaggio. Clicca “Nuovo personaggio”.";
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
      sub.textContent = `Lvl ${ch.level || "?"} • ${ch.classKey || "classe?"}/${ch.subclassKey || "sottoclasse?"}`;

      main.appendChild(title);
      main.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "listItem__actions";

      const btnOpen = document.createElement("button");
      btnOpen.className = "btn";
      btnOpen.type = "button";
      btnOpen.textContent = "Apri";
      btnOpen.onclick = () => setActiveChar(ch.id);

      const btnDup = document.createElement("button");
      btnDup.className = "btn";
      btnDup.type = "button";
      btnDup.textContent = "Duplica";
      btnDup.onclick = () => {
        const copy = structuredClone(ch);
        copy.id = uid();
        copy.name = (copy.name || "PG") + " (copia)";
        state.characters.push(copy);
        setActiveChar(copy.id);
      };

      actions.appendChild(btnOpen);
      actions.appendChild(btnDup);

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
    optBleed.checked = !!state.print.bleedOn;
    optCrop.checked = !!state.print.cropMarks;
    optBack.checked = !!state.print.addBackSheets;

    // Fill class select
    const classItems = Object.entries(rules.classes).map(([key, def]) => ({
      value: key, label: def.label
    }));
    fillSelectOptions(chClass, classItems, {placeholder:"Seleziona classe…"});

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


    // Assign values
    chName.value = activeChar.name || "";
    chLevel.value = activeChar.level || 1;
    chClass.value = activeChar.classKey || "";
    chCommunity.value = activeChar.communityId || "";
    chAncestry.value = activeChar.ancestryId || "";

    // Subclass depends on class
    renderSubclassSelect();
    chSubclass.value = activeChar.subclassKey || "";

    // Ensure picks
    ensureSubclassPicks(activeChar);
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

    const mkLine = ({title, card, mode, enabled, checked, onChange}) => {
      const line = document.createElement("div");
      line.className = "subline" + (!enabled ? " disabled" : "");

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "10px";

      const img = document.createElement("img");
      img.className = "subThumb";
      img.alt = "";
      img.src = card?.thumb || "";
      left.appendChild(img);

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
        const label = document.createElement("label");
        label.className = "check";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!checked;
        cb.disabled = !enabled;
        cb.onchange = () => onChange(cb.checked);
        const span = document.createElement("span");
        span.textContent = "Includi";
        label.appendChild(cb);
        label.appendChild(span);
        right.appendChild(label);

        if (!enabled) {
          const note = document.createElement("span");
          note.className = "muted small";
          note.textContent = `Richiede lvl ${mode === "spec" ? specMin : mastMin}`;
          right.appendChild(note);
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
    domainHint.textContent = `Domini classe: ${classDef.domains.join(" + ")} — Carte disponibili (≤ lvl ${ch.level}): ${eligible.length}`;

    const q = (search.value || "").trim().toLowerCase();
    const domFilter = filterDomain.value || "";

    visibleDomainCards = eligible.filter(c => {
      if (domFilter && c.domain !== domFilter) return false;
      if (!q) return true;
      return (c.name || "").toLowerCase().includes(q) || c.id.includes(q);
    });

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
      img.src = card.thumb || card.front;
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "cardTile__body";
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
      tile.classList.toggle("active", cb.checked);

      const set = new Set(ch.selectedCardIds);
      if (cb.checked) set.add(card.id);
      else set.delete(card.id);

      ch.selectedCardIds = Array.from(set).sort();
      saveState();
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

  const domainOrder = new Map();
  (classDef?.domains || []).forEach((d, i) => domainOrder.set(d, i));

  eligibleSelected.sort((a, b) => {
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
        subclassPicks: { specialization: false, mastery: false },
        selectedCardIds: []
      };
      state.characters.push(ch);
      setActiveChar(id);
    };
    btnExportChar.onclick = exportActiveCharacter;
    btnImportChar.onclick = importCharacterFromString;

    btnDeleteChar.onclick = () => {
      if (!activeChar) return;
      const idx = state.characters.findIndex(c => c.id === activeChar.id);
      if (idx >= 0) state.characters.splice(idx, 1);

      // pick new active
      const next = state.characters[0]?.id || null;
      state.activeCharacterId = next;
      saveState();
      activeChar = next ? findChar(next) : null;
      renderAll();
    };

    editorForm.onsubmit = (e) => {
      e.preventDefault();
      if (!activeChar) return;

      activeChar.name = chName.value.trim() || "PG";
      activeChar.level = Number(chLevel.value) || 1;
      activeChar.classKey = chClass.value;
      activeChar.subclassKey = chSubclass.value;
      activeChar.communityId = chCommunity.value;
      activeChar.ancestryId = chAncestry.value;

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
      saveState();
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
      saveState();
      renderSubclassCardsBox();
      renderDomainCards();
      renderCharList();
      updateCountsAndPrintLink();
    };

    chLevel.onchange = () => {
      if (!activeChar) return;
      activeChar.level = Number(chLevel.value) || 1;
      clampSubclassPicksByLevel(activeChar);
      saveState();
      renderSubclassCardsBox();
      renderDomainCards();
      renderCharList();
      updateCountsAndPrintLink();
    };

    chCommunity.onchange = () => {
      if (!activeChar) return;
      activeChar.communityId = chCommunity.value;
      saveState();
      updateCountsAndPrintLink();
      renderCharList();
    };

    chAncestry.onchange = () => {
      if (!activeChar) return;
      activeChar.ancestryId = chAncestry.value;
      saveState();
      updateCountsAndPrintLink();
      renderCharList();
    };

    optBleed.onchange = () => {
      state.print.bleedOn = !!optBleed.checked;
      saveState();
    };
    optCrop.onchange = () => {
      state.print.cropMarks = !!optCrop.checked;
      saveState();
    };
    optBack.onchange = () => {
      state.print.addBackSheets = !!optBack.checked;
      saveState();
    };

    search.oninput = () => renderDomainCards();
    filterDomain.onchange = () => renderDomainCards();
    btnViewGrid.onclick = () => setDomainView("grid");
    btnViewList.onclick = () => setDomainView("list");


    btnSelectAllVisible.onclick = () => {
      if (!activeChar || !requiredFieldsOk(activeChar)) return;
      const set = new Set(activeChar.selectedCardIds || []);
      for (const c of visibleDomainCards) set.add(c.id);
      activeChar.selectedCardIds = Array.from(set).sort();
      saveState();
      renderDomainCards();
    };

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

  async function init() {
    // Load data
    const [cardsRes, rulesRes] = await Promise.all([
      fetch("data/cards.json", { cache: "no-store" }),
      fetch("data/rules.json", { cache: "no-store" })
    ]);
    catalog = await cardsRes.json();
    rules = await rulesRes.json();

    // pick active char if exists
    activeChar = state.activeCharacterId ? findChar(state.activeCharacterId) : null;
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
