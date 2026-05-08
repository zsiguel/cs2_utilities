/* ============================================================
   admin.js — map lobby + hotspot/utility editor
   ============================================================ */

(function () {
  const ADMIN_PASS = 'cs2admin'; // ← change this to your password

  /* ── Map registry — add new maps here ──────────────────────── */
  const MAPS = [
    { id: 'mirage',  label: 'Mirage',  tag: 'Dust Belt',      img: 'map_pics/CS2-Mirage-Callout-Map.jpg', viewHref: 'mirage.html', active: true  },
    { id: 'inferno', label: 'Inferno', tag: 'Mediterranean',   img: 'map_pics/CS2-Inferno-Callout-Map.jpg', viewHref: 'inferno.html', active: true  },
    { id: 'ancient', label: 'Ancient', tag: 'Jungle',          img: 'map_pics/CS2-Mirage-Callout-Map.jpg', viewHref: 'ancient.html', active: false },
    { id: 'nuke',    label: 'Nuke',    tag: 'Industrial',      img: 'map_pics/CS2-Mirage-Callout-Map.jpg', viewHref: 'nuke.html',    active: false },
    { id: 'dust2',   label: 'Dust 2',  tag: 'Dust Belt',       img: 'map_pics/CS2-Mirage-Callout-Map.jpg', viewHref: 'dust2.html',   active: false },
    { id: 'vertigo', label: 'Vertigo', tag: 'Urban',           img: 'map_pics/CS2-Mirage-Callout-Map.jpg', viewHref: 'vertigo.html', active: false },
  ];

  /* ── DOM refs — lock ────────────────────────────────────────── */
  const lockScreen  = document.getElementById('lock-screen');
  const lockInput   = document.getElementById('lock-input');
  const lockError   = document.getElementById('lock-error');
  const lockSubmit  = document.getElementById('lock-submit');

  /* ── DOM refs — lobby ───────────────────────────────────────── */
  const lobbyShell  = document.getElementById('lobby-shell');
  const lobbyGrid   = document.getElementById('lobby-grid');

  /* ── DOM refs — editor ──────────────────────────────────────── */
  const editorShell     = document.getElementById('editor-shell');
  const editorMapTitle  = document.getElementById('editor-map-title');
  const btnBackLobby    = document.getElementById('btn-back-lobby');
  const btnViewMap      = document.getElementById('btn-view-map');

  const mapImg          = document.getElementById('map-img');
  const mapCol          = document.getElementById('map-col');

  const btnAddSpot      = document.getElementById('btn-add-spot');
  const btnClearAll     = document.getElementById('btn-clear-all');
  const btnExport       = document.getElementById('btn-export');

  const spotList        = document.getElementById('spot-list');
  const spotDetail      = document.getElementById('spot-detail');
  const utilSection     = document.getElementById('util-section');
  const utilList        = document.getElementById('util-list');
  const utilForm        = document.getElementById('util-form');

  const fSpotName       = document.getElementById('f-spot-name');
  const btnSaveSpot     = document.getElementById('btn-save-spot');
  const btnDeleteSpot   = document.getElementById('btn-delete-spot');

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

  /* ── Video source type toggle ───────────────────────────────── */
  function updateVideoFields() {
    const type = fUtilVideoType.value;
    fieldLocal.style.display   = type === 'local'   ? '' : 'none';
    fieldYoutube.style.display = type === 'youtube' ? '' : 'none';
  }
  fUtilVideoType.addEventListener('change', updateVideoFields);

  fUtilVideoLocal.addEventListener('input', () => {
    const fname = fUtilVideoLocal.value.trim();
    localPathPreview.textContent = currentMap
      ? currentMap.id + '/' + (fname || 'filename.mp4')
      : 'mapname/' + (fname || 'filename.mp4');
  });

  /* Stored as: "yt:https://..."  or  "local:filename.mp4"  or  "" */
  function encodeVideo() {
    const type = fUtilVideoType.value;
    if (type === 'youtube') return 'yt:' + fUtilVideoYT.value.trim();
    if (type === 'local')   return 'local:' + fUtilVideoLocal.value.trim();
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
      localPathPreview.textContent = (currentMap ? currentMap.id : 'mapname') + '/' + raw.slice(6);
    } else {
      // Legacy plain URL fallback
      fUtilVideoType.value = 'youtube';
      fUtilVideoYT.value   = raw;
    }
    updateVideoFields();
  }

  /* ── Editor state ───────────────────────────────────────────── */
  let currentMap    = null;   // map object from MAPS[]
  let placing       = false;
  let activeSpotId  = null;
  let activeUtilId  = null;

  const TYPE_COLOR = {
    smoke:   'var(--smoke-clr)',
    flash:   'var(--flash-clr)',
    molotov: 'var(--molly-clr)',
    nade:    'var(--nade-clr)',
  };

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
      const spots = Store.getHotspots(map.id);
      const total = spots.reduce((n, s) => n + (s.utilities || []).length, 0);

      const card = document.createElement('div');
      card.className = 'map-card' + (map.active ? '' : ' disabled');

      // corner accent + wip band for inactive
      if (!map.active) {
        const band = document.createElement('div');
        band.className = 'wip-band';
        band.textContent = 'Soon';
        card.appendChild(band);
      }

      // edit badge (active maps only)
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

      const body = document.createElement('div');
      body.className = 'map-card-body';

      const countText = total > 0
        ? `● ${total} utilit${total === 1 ? 'y' : 'ies'}`
        : '○ No utilities yet';

      body.innerHTML = `
        <div class="map-card-tag">${map.tag}</div>
        <div class="map-card-name">${map.label}</div>
        <div class="map-card-count ${total === 0 ? 'zero' : ''}">${countText}</div>
      `;

      card.appendChild(thumb);
      card.appendChild(overlay);
      card.appendChild(body);

      if (map.active) {
        card.addEventListener('click', () => openEditor(map));
      }

      lobbyGrid.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     EDITOR
  ══════════════════════════════════════════════════════════════ */
  function openEditor(map) {
    currentMap = map;
    activeSpotId = null;
    activeUtilId = null;
    placing = false;
    btnAddSpot.textContent = 'Add Hotspot';
    mapCol.classList.remove('placing');

    // Update topbar
    editorMapTitle.textContent = map.label;
    btnViewMap.href = map.viewHref;

    // Swap image
    mapImg.src = map.img;

    // Switch screens
    lobbyShell.style.display  = 'none';
    editorShell.style.display = 'grid';
    document.body.classList.remove('lobby-active');

    if (mapImg.complete && mapImg.naturalWidth > 0) render();
    else mapImg.onload = () => render();
  }

  btnBackLobby.addEventListener('click', () => {
    placing = false;
    mapCol.classList.remove('placing');
    showLobby();
  });

  /* ── Coordinate helpers ─────────────────────────────────────── */
  function clickToPercent(e) {
    const imgRect = mapImg.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (e.clientX - imgRect.left) / imgRect.width  * 100)).toFixed(2) + '%';
    const y = Math.max(0, Math.min(100, (e.clientY - imgRect.top)  / imgRect.height * 100)).toFixed(2) + '%';
    return { left: x, top: y };
  }

  function applyPinPosition(el, top, left) {
    const imgRect = mapImg.getBoundingClientRect();
    const colRect = mapCol.getBoundingClientRect();
    const offsetX = imgRect.left - colRect.left;
    const offsetY = imgRect.top  - colRect.top;
    el.style.left = (parseFloat(left) / 100 * imgRect.width  + offsetX) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgRect.height + offsetY) + 'px';
  }

  /* ── Render ─────────────────────────────────────────────────── */
  function render() {
    renderPins();
    renderSpotList();
    renderSpotDetail();
    renderUtilSection();
  }

  function renderPins() {
    document.querySelectorAll('.admin-pin').forEach(el => el.remove());
    if (!currentMap) return;
    const spots = Store.getHotspots(currentMap.id);

    spots.forEach(spot => {
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
    if (!currentMap) return;
    const spots = Store.getHotspots(currentMap.id);
    if (spots.length === 0) {
      spotList.innerHTML = '<div class="empty-state">No hotspots yet.<br>Click "Add Hotspot" then click the map.</div>';
      return;
    }
    spotList.innerHTML = '';
    spots.forEach(spot => {
      const row = document.createElement('div');
      row.className = 'spot-row' + (spot.id === activeSpotId ? ' active' : '');

      const name = document.createElement('div');
      name.className = 'spot-row-name';
      name.textContent = spot.label || '(unnamed)';

      const badge = document.createElement('div');
      badge.className = 'spot-row-badge';
      badge.textContent = (spot.utilities || []).length + ' util';

      const del = document.createElement('button');
      del.className = 'spot-row-del';
      del.innerHTML = '✕';
      del.title = 'Delete hotspot';
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
    const spot = Store.getHotspots(currentMap.id).find(s => s.id === activeSpotId);
    if (spot) fSpotName.value = spot.label || '';
  }

  function renderUtilSection() {
    if (!activeSpotId) { utilSection.style.display = 'none'; return; }
    utilSection.style.display = '';

    const spot  = Store.getHotspots(currentMap.id).find(s => s.id === activeSpotId);
    const utils = (spot && spot.utilities) || [];

    utilList.innerHTML = '';
    if (utils.length === 0) {
      utilList.innerHTML = '<div class="empty-state">No utilities yet.</div>';
    } else {
      utils.forEach(u => {
        const row = document.createElement('div');
        row.className = 'util-row' + (u.id === activeUtilId ? ' selected' : '');

        const dot = document.createElement('div');
        dot.className = 'util-row-dot';
        dot.style.background = TYPE_COLOR[u.type] || 'var(--gold)';

        const name = document.createElement('div');
        name.className = 'util-row-name';
        name.textContent = u.name || '(unnamed)';

        const del = document.createElement('button');
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
        decodeVideoIntoForm(util.video || '');
        fUtilStart.value = util.startPoint || '';
        fUtilAim.value   = util.aim        || '';
        fUtilThrow.value = util.throwType  || '';
        fUtilNotes.value = util.notes      || '';
        utilForm.style.display      = '';
        btnDeleteUtil.style.display = '';
      }
    } else {
      utilForm.style.display      = 'none';
      btnDeleteUtil.style.display = 'none';
    }
  }

  /* ── Actions ────────────────────────────────────────────────── */
  function selectSpot(id) { activeSpotId = id; activeUtilId = null; render(); }

  function deleteSpot(id) {
    if (!confirm('Delete this hotspot and all its utilities?')) return;
    Store.deleteHotspot(currentMap.id, id);
    if (activeSpotId === id) { activeSpotId = null; activeUtilId = null; }
    render();
  }

  function selectUtil(id) { activeUtilId = id; render(); }

  function deleteUtil(id) {
    if (!confirm('Delete this utility?')) return;
    Store.deleteUtility(currentMap.id, activeSpotId, id);
    if (activeUtilId === id) activeUtilId = null;
    render();
  }

  /* ── Add hotspot ────────────────────────────────────────────── */
  btnAddSpot.addEventListener('click', () => {
    placing = !placing;
    mapCol.classList.toggle('placing', placing);
    btnAddSpot.textContent = placing ? 'Cancel Placement' : 'Add Hotspot';
  });

  mapCol.addEventListener('click', e => {
    if (!placing) return;
    if (e.target.closest('.admin-pin')) return;
    const pos   = clickToPercent(e);
    const label = prompt('Name this hotspot (e.g. "T Spawn"):', '');
    if (label === null) return;
    const spot = { id: Store.uid(), label: label.trim() || 'Hotspot', top: pos.top, left: pos.left, utilities: [] };
    Store.addHotspot(currentMap.id, spot);
    placing = false;
    mapCol.classList.remove('placing');
    btnAddSpot.textContent = 'Add Hotspot';
    selectSpot(spot.id);
  });

  /* ── Spot form ──────────────────────────────────────────────── */
  btnSaveSpot.addEventListener('click', () => {
    Store.updateHotspot(currentMap.id, activeSpotId, { label: fSpotName.value.trim() || 'Hotspot' });
    render();
  });
  btnDeleteSpot.addEventListener('click', () => deleteSpot(activeSpotId));

  /* ── Utility form ───────────────────────────────────────────── */
  btnNewUtil.addEventListener('click', () => {
    const util = { id: Store.uid(), name: '', type: 'smoke', side: 'T', video: '', startPoint: '', aim: '', throwType: '', notes: '' };
    Store.addUtility(currentMap.id, activeSpotId, util);
    selectUtil(util.id);
  });
  btnCancelUtil.addEventListener('click', () => { activeUtilId = null; render(); });
  btnSaveUtil.addEventListener('click', () => {
    if (!activeUtilId) return;
    Store.updateUtility(currentMap.id, activeSpotId, activeUtilId, {
      name: fUtilName.value.trim(), type: fUtilType.value, side: fUtilSide.value,
      video: encodeVideo(), startPoint: fUtilStart.value.trim(),
      aim: fUtilAim.value.trim(), throwType: fUtilThrow.value.trim(), notes: fUtilNotes.value.trim(),
    });
    render();
  });
  btnDeleteUtil.addEventListener('click', () => deleteUtil(activeUtilId));

  /* ── Clear all ──────────────────────────────────────────────── */
  btnClearAll.addEventListener('click', () => {
    if (!confirm(`Delete ALL hotspots and utilities for ${currentMap.label}?`)) return;
    Store.clearMap(currentMap.id);
    activeSpotId = null; activeUtilId = null;
    render();
  });

  /* ── Export ─────────────────────────────────────────────────── */
  btnExport.addEventListener('click', () => {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'cs2_utility_data.json' });
    a.click(); URL.revokeObjectURL(url);
  });

  /* ── Resize: reposition pins ────────────────────────────────── */
  window.addEventListener('resize', () => { if (currentMap) renderPins(); });

})();
