/* ============================================================
   admin.js — map lobby + hotspot/utility editor (Firestore)
   ============================================================ */

import Store from "./store.js";

(function () {
  const ADMIN_PASS = 'cs2admin'; // ← change this to your password

  /* ── Map registry ───────────────────────────────────────────── */
  const MAPS = [
    { id: 'mirage',  label: 'Mirage',  tag: 'Dust Belt',     img: 'map_pics/CS2-Mirage-Callout-Map.jpg',  viewHref: 'mirage.html',  active: true  },
    { id: 'inferno', label: 'Inferno', tag: 'Mediterranean', img: 'map_pics/CS2-Inferno-Callout-Map.jpg', viewHref: 'inferno.html', active: true  },
    { id: 'ancient', label: 'Ancient', tag: 'Jungle',        img: 'map_pics/CS2-Mirage-Callout-Map.jpg',  viewHref: 'ancient.html', active: false },
    { id: 'nuke',    label: 'Nuke',    tag: 'Industrial',    img: 'map_pics/CS2-Mirage-Callout-Map.jpg',  viewHref: 'nuke.html',    active: false },
    { id: 'dust2',   label: 'Dust 2',  tag: 'Dust Belt',     img: 'map_pics/CS2-Mirage-Callout-Map.jpg',  viewHref: 'dust2.html',   active: false },
    { id: 'vertigo', label: 'Vertigo', tag: 'Urban',         img: 'map_pics/CS2-Mirage-Callout-Map.jpg',  viewHref: 'vertigo.html', active: false },
  ];

  /* ── DOM refs — lock ────────────────────────────────────────── */
  const lockScreen = document.getElementById('lock-screen');
  const lockInput  = document.getElementById('lock-input');
  const lockError  = document.getElementById('lock-error');
  const lockSubmit = document.getElementById('lock-submit');

  /* ── DOM refs — lobby ───────────────────────────────────────── */
  const lobbyShell = document.getElementById('lobby-shell');
  const lobbyGrid  = document.getElementById('lobby-grid');

  /* ── DOM refs — editor ──────────────────────────────────────── */
  const editorShell    = document.getElementById('editor-shell');
  const editorMapTitle = document.getElementById('editor-map-title');
  const btnBackLobby   = document.getElementById('btn-back-lobby');
  const btnViewMap     = document.getElementById('btn-view-map');
  const mapImg         = document.getElementById('map-img');
  const mapCol         = document.getElementById('map-col');
  const btnAddSpot     = document.getElementById('btn-add-spot');
  const btnClearAll    = document.getElementById('btn-clear-all');
  const btnExport      = document.getElementById('btn-export');
  const spotList       = document.getElementById('spot-list');
  const spotDetail     = document.getElementById('spot-detail');
  const utilSection    = document.getElementById('util-section');
  const utilList       = document.getElementById('util-list');
  const utilForm       = document.getElementById('util-form');

  const fSpotName      = document.getElementById('f-spot-name');
  const btnSaveSpot    = document.getElementById('btn-save-spot');
  const btnDeleteSpot  = document.getElementById('btn-delete-spot');

  const fUtilName        = document.getElementById('f-util-name');
  const fUtilType        = document.getElementById('f-util-type');
  const fUtilSide        = document.getElementById('f-util-side');
  const fUtilVideoType   = document.getElementById('f-util-video-type');
  const fUtilVideoLocal  = document.getElementById('f-util-video-local');
  const fUtilVideoYT     = document.getElementById('f-util-video-yt');
  const fieldLocal       = document.getElementById('field-local');
  const fieldYoutube     = document.getElementById('field-youtube');
  const localPathPreview = document.getElementById('local-path-preview');
  const fUtilStart       = document.getElementById('f-util-start');
  const fUtilAim         = document.getElementById('f-util-aim');
  const fUtilThrow       = document.getElementById('f-util-throw');
  const fUtilNotes       = document.getElementById('f-util-notes');
  const btnSaveUtil      = document.getElementById('btn-save-util');
  const btnDeleteUtil    = document.getElementById('btn-delete-util');
  const btnNewUtil       = document.getElementById('btn-new-util');
  const btnCancelUtil    = document.getElementById('btn-cancel-util');

  /* ── Video field toggle ─────────────────────────────────────── */
  function updateVideoFields() {
    const t = fUtilVideoType.value;
    fieldLocal.style.display   = t === 'local'   ? '' : 'none';
    fieldYoutube.style.display = t === 'youtube' ? '' : 'none';
  }
  fUtilVideoType.addEventListener('change', updateVideoFields);

  fUtilVideoLocal.addEventListener('input', () => {
    const fname = fUtilVideoLocal.value.trim();
    localPathPreview.textContent = currentMap
      ? currentMap.id + '/' + (fname || 'filename.mp4')
      : 'mapname/' + (fname || 'filename.mp4');
  });

  function encodeVideo() {
    const t = fUtilVideoType.value;
    if (t === 'youtube') return 'yt:'    + fUtilVideoYT.value.trim();
    if (t === 'local')   return 'local:' + fUtilVideoLocal.value.trim();
    return '';
  }

  function decodeVideoIntoForm(raw) {
    if (!raw) {
      fUtilVideoType.value = 'none';
    } else if (raw.startsWith('yt:')) {
      fUtilVideoType.value  = 'youtube';
      fUtilVideoYT.value    = raw.slice(3);
      fUtilVideoLocal.value = '';
    } else if (raw.startsWith('local:')) {
      fUtilVideoType.value  = 'local';
      fUtilVideoLocal.value = raw.slice(6);
      fUtilVideoYT.value    = '';
      localPathPreview.textContent =
        (currentMap ? currentMap.id : 'mapname') + '/' + raw.slice(6);
    } else {
      fUtilVideoType.value = 'youtube';
      fUtilVideoYT.value   = raw;
    }
    updateVideoFields();
  }

  /* ── Editor state ───────────────────────────────────────────── */
  let currentMap   = null;
  let placing      = false;
  let activeSpotId = null;
  let activeUtilId = null;
  let cachedSpots  = [];   // local mirror of Firestore data

  const TYPE_COLOR = {
    smoke: 'var(--smoke-clr)', flash: 'var(--flash-clr)',
    molotov: 'var(--molly-clr)', nade: 'var(--nade-clr)',
  };

  /* ── Loading overlay helpers ────────────────────────────────── */
  function setLoading(on) {
    mapCol.style.opacity        = on ? '.4' : '1';
    mapCol.style.pointerEvents  = on ? 'none' : '';
  }

  /* ══════════════════════════════════════════════════════════════
     LOCK
  ══════════════════════════════════════════════════════════════ */
  function unlock() {
    if (lockInput.value === ADMIN_PASS) {
      lockScreen.style.display = 'none';
      showLobby();
    } else {
      lockError.classList.add('visible');
      lockInput.value = '';
      lockInput.focus();
    }
  }
  lockSubmit.addEventListener('click', unlock);
  lockInput.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });

  /* ══════════════════════════════════════════════════════════════
     LOBBY
  ══════════════════════════════════════════════════════════════ */
  function showLobby() {
    editorShell.style.display = 'none';
    lobbyShell.style.display  = 'flex';
    document.body.classList.add('lobby-active');
    buildLobbyGrid();
  }

  function buildLobbyGrid() {
    lobbyGrid.innerHTML = '';

    MAPS.forEach(map => {
      const card = document.createElement('div');
      card.className = 'map-card' + (map.active ? '' : ' disabled');

      if (!map.active) {
        const band = document.createElement('div');
        band.className = 'wip-band';
        band.textContent = 'Soon';
        card.appendChild(band);
      }

      if (map.active) {
        const badge = document.createElement('div');
        badge.className = 'map-edit-badge';
        badge.textContent = '✎ Edit';
        card.appendChild(badge);
      }

      const thumb = document.createElement('img');
      thumb.className = 'map-thumb';
      thumb.src = map.img;
      thumb.alt = map.label;

      const overlay = document.createElement('div');
      overlay.className = 'map-card-overlay';

      const countEl = document.createElement('div');
      countEl.className = 'map-card-count zero';
      countEl.textContent = map.active ? '○ Loading…' : '○ Coming Soon';

      const body = document.createElement('div');
      body.className = 'map-card-body';
      body.innerHTML = '<div class="map-card-tag">' + map.tag + '</div>' +
                       '<div class="map-card-name">' + map.label + '</div>';
      body.appendChild(countEl);

      card.appendChild(thumb);
      card.appendChild(overlay);
      card.appendChild(body);

      if (map.active) {
        card.addEventListener('click', () => openEditor(map));

        // Fetch count independently so a slow/failed read won't block the cards
        Store.getHotspots(map.id)
          .then(spots => {
            const total = spots.reduce((n, s) => n + (s.utilities || []).length, 0);
            countEl.className   = 'map-card-count' + (total === 0 ? ' zero' : '');
            countEl.textContent = total > 0
              ? '● ' + total + ' utilit' + (total === 1 ? 'y' : 'ies')
              : '○ No utilities yet';
          })
          .catch(() => { countEl.textContent = '○ Could not reach database'; });
      }

      lobbyGrid.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     EDITOR
  ══════════════════════════════════════════════════════════════ */
  async function openEditor(map) {
    currentMap   = map;
    activeSpotId = null;
    activeUtilId = null;
    placing      = false;
    btnAddSpot.textContent = 'Add Hotspot';
    mapCol.classList.remove('placing');

    editorMapTitle.textContent = map.label;
    btnViewMap.href            = map.viewHref;
    mapImg.src                 = map.img;

    lobbyShell.style.display  = 'none';
    editorShell.style.display = 'grid';
    document.body.classList.remove('lobby-active');

    if (mapImg.complete && mapImg.naturalWidth > 0) await loadAndRender();
    else mapImg.onload = loadAndRender;
  }

  btnBackLobby.addEventListener('click', () => {
    placing = false;
    mapCol.classList.remove('placing');
    showLobby();
  });

  /* ── Fetch Firestore → cache → render ───────────────────────── */
  async function loadAndRender() {
    setLoading(true);
    cachedSpots = await Store.getHotspots(currentMap.id);
    setLoading(false);
    render();
  }

  /* ── Coordinate helpers ─────────────────────────────────────── */
  function clickToPercent(e) {
    const r = mapImg.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width  * 100)).toFixed(2) + '%';
    const y = Math.max(0, Math.min(100, (e.clientY - r.top)  / r.height * 100)).toFixed(2) + '%';
    return { left: x, top: y };
  }

  function applyPinPosition(el, top, left) {
    const imgRect = mapImg.getBoundingClientRect();
    const colRect = mapCol.getBoundingClientRect();
    el.style.left = (parseFloat(left) / 100 * imgRect.width  + (imgRect.left - colRect.left)) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgRect.height + (imgRect.top  - colRect.top))  + 'px';
  }

  /* ── Render (from cache — no extra Firestore reads) ─────────── */
  function render() {
    renderPins();
    renderSpotList();
    renderSpotDetail();
    renderUtilSection();
  }

  function renderPins() {
    document.querySelectorAll('.admin-pin').forEach(el => el.remove());
    cachedSpots.forEach(spot => {
      const pin = document.createElement('div');
      pin.className = 'admin-pin' + (spot.id === activeSpotId ? ' active' : '');
      pin.dataset.id = spot.id;
      applyPinPosition(pin, spot.top, spot.left);

      const dot = document.createElement('div');
      dot.className = 'pin-dot';

      const lbl = document.createElement('div');
      lbl.className = 'pin-label';
      lbl.textContent = spot.label || '(unnamed)';

      if ((spot.utilities || []).length > 0) {
        const cnt = document.createElement('div');
        cnt.className = 'pin-count';
        cnt.textContent = spot.utilities.length;
        pin.appendChild(cnt);
      }

      pin.appendChild(dot);
      pin.appendChild(lbl);
      mapCol.appendChild(pin);
      pin.addEventListener('click', () => selectSpot(spot.id));
    });
  }

  function renderSpotList() {
    if (cachedSpots.length === 0) {
      spotList.innerHTML = '<div class="empty-state">No hotspots yet.<br>Click "Add Hotspot" then click the map.</div>';
      return;
    }
    spotList.innerHTML = '';
    cachedSpots.forEach(spot => {
      const row   = document.createElement('div');
      row.className = 'spot-row' + (spot.id === activeSpotId ? ' active' : '');

      const name  = document.createElement('div');
      name.className = 'spot-row-name';
      name.textContent = spot.label || '(unnamed)';

      const badge = document.createElement('div');
      badge.className = 'spot-row-badge';
      badge.textContent = (spot.utilities || []).length + ' util';

      const del   = document.createElement('button');
      del.className = 'spot-row-del';
      del.innerHTML = '✕';
      del.addEventListener('click', e => { e.stopPropagation(); deleteSpot(spot.id); });

      row.appendChild(name);
      row.appendChild(badge);
      row.appendChild(del);
      row.addEventListener('click', () => selectSpot(spot.id));
      spotList.appendChild(row);
    });
  }

  function renderSpotDetail() {
    if (!activeSpotId) { spotDetail.style.display = 'none'; return; }
    spotDetail.style.display = '';
    const spot = cachedSpots.find(s => s.id === activeSpotId);
    if (spot) fSpotName.value = spot.label || '';
  }

  function renderUtilSection() {
    if (!activeSpotId) { utilSection.style.display = 'none'; return; }
    utilSection.style.display = '';

    const spot  = cachedSpots.find(s => s.id === activeSpotId);
    const utils = (spot && spot.utilities) || [];

    utilList.innerHTML = '';
    if (utils.length === 0) {
      utilList.innerHTML = '<div class="empty-state">No utilities yet.</div>';
    } else {
      utils.forEach(u => {
        const row  = document.createElement('div');
        row.className = 'util-row' + (u.id === activeUtilId ? ' selected' : '');

        const dot  = document.createElement('div');
        dot.className = 'util-row-dot';
        dot.style.background = TYPE_COLOR[u.type] || 'var(--gold)';

        const name = document.createElement('div');
        name.className = 'util-row-name';
        name.textContent = u.name || '(unnamed)';

        const del  = document.createElement('button');
        del.className = 'util-row-del';
        del.innerHTML = '✕';
        del.addEventListener('click', e => { e.stopPropagation(); deleteUtil(u.id); });

        row.appendChild(dot);
        row.appendChild(name);
        row.appendChild(del);
        row.addEventListener('click', () => selectUtil(u.id));
        utilList.appendChild(row);
      });
    }

    if (activeUtilId) {
      const util = utils.find(u => u.id === activeUtilId);
      if (util) {
        fUtilName.value  = util.name       || '';
        fUtilType.value  = util.type       || 'smoke';
        fUtilSide.value  = util.side       || 'T';
        fUtilStart.value = util.startPoint || '';
        fUtilAim.value   = util.aim        || '';
        fUtilThrow.value = util.throwType  || '';
        fUtilNotes.value = util.notes      || '';
        decodeVideoIntoForm(util.video || '');
        utilForm.style.display      = '';
        btnDeleteUtil.style.display = '';
      }
    } else {
      utilForm.style.display      = 'none';
      btnDeleteUtil.style.display = 'none';
    }
  }

  /* ── Cache helpers ──────────────────────────────────────────── */
  function cacheAddSpot(spot) {
    cachedSpots.push({ ...spot, utilities: [] });
  }
  function cacheUpdateSpot(id, patch) {
    const s = cachedSpots.find(s => s.id === id);
    if (s) Object.assign(s, patch);
  }
  function cacheDeleteSpot(id) {
    cachedSpots = cachedSpots.filter(s => s.id !== id);
  }
  function cacheAddUtil(spotId, util) {
    const s = cachedSpots.find(s => s.id === spotId);
    if (s) { if (!s.utilities) s.utilities = []; s.utilities.push(util); }
  }
  function cacheUpdateUtil(spotId, utilId, patch) {
    const s = cachedSpots.find(s => s.id === spotId);
    if (!s) return;
    const u = (s.utilities || []).find(u => u.id === utilId);
    if (u) Object.assign(u, patch);
  }
  function cacheDeleteUtil(spotId, utilId) {
    const s = cachedSpots.find(s => s.id === spotId);
    if (s) s.utilities = (s.utilities || []).filter(u => u.id !== utilId);
  }

  /* ── Actions ────────────────────────────────────────────────── */
  function selectSpot(id) { activeSpotId = id; activeUtilId = null; render(); }
  function selectUtil(id) { activeUtilId = id; render(); }

  async function deleteSpot(id) {
    if (!confirm('Delete this hotspot and all its utilities?')) return;
    setLoading(true);
    await Store.deleteHotspot(currentMap.id, id);
    cacheDeleteSpot(id);
    if (activeSpotId === id) { activeSpotId = null; activeUtilId = null; }
    setLoading(false);
    render();
  }

  async function deleteUtil(id) {
    if (!confirm('Delete this utility?')) return;
    setLoading(true);
    await Store.deleteUtility(currentMap.id, activeSpotId, id);
    cacheDeleteUtil(activeSpotId, id);
    if (activeUtilId === id) activeUtilId = null;
    setLoading(false);
    render();
  }

  /* ── Add hotspot ────────────────────────────────────────────── */
  btnAddSpot.addEventListener('click', () => {
    placing = !placing;
    mapCol.classList.toggle('placing', placing);
    btnAddSpot.textContent = placing ? 'Cancel Placement' : 'Add Hotspot';
  });

  mapCol.addEventListener('click', async e => {
    if (!placing) return;
    if (e.target.closest('.admin-pin')) return;
    const pos   = clickToPercent(e);
    const label = prompt('Name this hotspot (e.g. "T Spawn"):', '');
    if (label === null) return;
    const spot = { id: Store.uid(), label: label.trim() || 'Hotspot', top: pos.top, left: pos.left };
    placing = false;
    mapCol.classList.remove('placing');
    btnAddSpot.textContent = 'Add Hotspot';
    setLoading(true);
    await Store.addHotspot(currentMap.id, spot);
    cacheAddSpot(spot);
    setLoading(false);
    selectSpot(spot.id);
  });

  /* ── Spot form ──────────────────────────────────────────────── */
  btnSaveSpot.addEventListener('click', async () => {
    const label = fSpotName.value.trim() || 'Hotspot';
    setLoading(true);
    await Store.updateHotspot(currentMap.id, activeSpotId, { label });
    cacheUpdateSpot(activeSpotId, { label });
    setLoading(false);
    render();
  });

  btnDeleteSpot.addEventListener('click', () => deleteSpot(activeSpotId));

  /* ── Utility form ───────────────────────────────────────────── */
  btnNewUtil.addEventListener('click', async () => {
    const util = {
      id: Store.uid(), name: '', type: 'smoke', side: 'T',
      video: '', startPoint: '', aim: '', throwType: '', notes: ''
    };
    setLoading(true);
    await Store.addUtility(currentMap.id, activeSpotId, util);
    cacheAddUtil(activeSpotId, util);
    setLoading(false);
    selectUtil(util.id);
  });

  btnCancelUtil.addEventListener('click', () => { activeUtilId = null; render(); });

  btnSaveUtil.addEventListener('click', async () => {
    if (!activeUtilId) return;
    const patch = {
      name: fUtilName.value.trim(), type: fUtilType.value, side: fUtilSide.value,
      video: encodeVideo(), startPoint: fUtilStart.value.trim(),
      aim: fUtilAim.value.trim(), throwType: fUtilThrow.value.trim(),
      notes: fUtilNotes.value.trim(),
    };
    setLoading(true);
    await Store.updateUtility(currentMap.id, activeSpotId, activeUtilId, patch);
    cacheUpdateUtil(activeSpotId, activeUtilId, patch);
    setLoading(false);
    render();
  });

  btnDeleteUtil.addEventListener('click', () => deleteUtil(activeUtilId));

  /* ── Clear all ──────────────────────────────────────────────── */
  btnClearAll.addEventListener('click', async () => {
    if (!confirm(`Delete ALL hotspots and utilities for ${currentMap.label}?`)) return;
    setLoading(true);
    await Store.clearMap(currentMap.id);
    cachedSpots  = [];
    activeSpotId = null;
    activeUtilId = null;
    setLoading(false);
    render();
  });

  /* ── Export ─────────────────────────────────────────────────── */
  btnExport.addEventListener('click', async () => {
    const json = await Store.exportJSON(currentMap.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'),
      { href: url, download: `cs2_${currentMap.id}_data.json` });
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ── Resize: reposition pins from cache ─────────────────────── */
  window.addEventListener('resize', () => { if (currentMap) renderPins(); });

})();
