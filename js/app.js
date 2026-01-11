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

  let catalog = null; // cards.json
  let rules = null;   // rules.json

  let state = loadState();
  let activeChar = null;

  let visibleDomainCards = []; // currently filtered list in UI

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      version: 1,
      activeCharacterId: null,
      characters: [],
      print: { bleedOn: false, cropMarks: true, addBackSheets: true }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    const communityItems = getCardsByKind("community").map(c => ({ value: c.id, label: `${c.id} — ${c.name}` }));
    const ancestryItems  = getCardsByKind("ancestry").map(c => ({ value: c.id, label: `${c.id} — ${c.name}` }));
    fillSelectOptions(chCommunity, communityItems, {placeholder:"Seleziona community…"});
    fillSelectOptions(chAncestry, ancestryItems, {placeholder:"Seleziona ancestry…"});

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
      m.textContent = card ? `${card.id} — ${card.name}` : "Carta non trovata nel catalogo";
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

    const eligible = currentEligibleDomainCards(ch);
    renderDomainFilters(ch);

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

      const imgWrap = document.createElement("div");
      imgWrap.className = "cardTile__img";
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.src = card.thumb || card.front;
      imgWrap.appendChild(img);

      const body = document.createElement("div");
      body.className = "cardTile__body";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selectedSet.has(card.id);
      cb.onchange = () => {
        const set = new Set(ch.selectedCardIds);
        if (cb.checked) set.add(card.id);
        else set.delete(card.id);
        ch.selectedCardIds = Array.from(set).sort();
        saveState();
        updateCountsAndPrintLink();
      };

      const txt = document.createElement("div");
      txt.className = "cardTile__text";
      const name = document.createElement("div");
      name.className = "cardTile__name";
      name.textContent = `${card.id} — ${card.name}`;
      const meta = document.createElement("div");
      meta.className = "cardTile__meta";
      meta.textContent = `${card.domain} • Lvl ${card.level}`;
      txt.appendChild(name);
      txt.appendChild(meta);

      body.appendChild(cb);
      body.appendChild(txt);

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
    renderAll();
  }

  init().catch(err => {
    console.error(err);
    alert("Errore nel caricamento dei dati (cards.json / rules.json). Controlla la console.");
  });
})();
