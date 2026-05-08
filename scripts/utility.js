/* ============================================================
   utility.js — populates the detail page from Firestore
   URL params: ?map=mirage&spot=spotId&id=utilId
   ============================================================ */

import Store from "./store.js";

(async function () {
  const params   = new URLSearchParams(window.location.search);
  const mapId    = params.get('map')  || 'mirage';
  const spotId   = params.get('spot') || '';
  const utilId   = params.get('id')   || '';
  const content  = document.getElementById('content');

  /* ── Find utility ───────────────────────────────────────────── */
  const hotspots = await Store.getHotspots(mapId);
  let util      = null;
  let spotLabel = '';

  for (const spot of hotspots) {
    const found = (spot.utilities || []).find(u => u.id === utilId);
    if (found) { util = found; spotLabel = spot.label; break; }
  }

  /* ── Not found ──────────────────────────────────────────────── */
  if (!util) {
    content.innerHTML = `
      <div class="not-found">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Utility not found —
        <a href="${mapId}.html" style="color:var(--gold)">go back to map</a>
      </div>`;
    return;
  }

  /* ── Page meta ──────────────────────────────────────────────── */
  document.getElementById('bc-name').textContent = util.name;
  document.title = util.name + ' — CS2 Utility Hub';

  const TYPE_COLOR = {
    smoke:   'var(--smoke-clr)',
    flash:   'var(--flash-clr)',
    molotov: 'var(--molly-clr)',
    nade:    'var(--nade-clr)',
  };
  const typeColor = TYPE_COLOR[util.type] || 'var(--gold)';

  const badge = document.getElementById('type-badge');
  badge.textContent    = util.type;
  badge.style.color       = typeColor;
  badge.style.borderColor = typeColor;

  const mapBackLink = document.getElementById('map-back-link');
  if (mapBackLink) mapBackLink.href = mapId + '.html';

  const bcMap = document.getElementById('bc-map');
  if (bcMap) {
    bcMap.href        = mapId + '.html';
    bcMap.textContent = mapId.charAt(0).toUpperCase() + mapId.slice(1);
  }

  /* ── Video embed helper ─────────────────────────────────────── */
  function buildVideoEmbed(raw, mapId) {
    if (!raw) return `
      <div class="video-placeholder">
        <svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
        <span>No video linked yet</span>
      </div>`;

    if (raw.startsWith('local:')) {
      const filename = raw.slice(6);
      return `
        <video controls playsinline preload="metadata"
          style="position:absolute;inset:0;width:100%;height:100%;background:#000;">
          <source src="videos/${mapId}/${filename}" type="video/mp4" />
          Your browser does not support the video tag.
        </video>`;
    }

    /* YouTube — stored as "yt:URL" or legacy plain URL */
    const ytUrl = raw.startsWith('yt:') ? raw.slice(3) : raw;
    return `
      <iframe src="${ytUrl}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
  }

  /* ── Build video column ─────────────────────────────────────── */
  const videoCol = document.createElement('div');
  videoCol.className = 'video-col';

  const sideLabel = util.side === 'CT' ? 'Counter-Terrorist' : 'Terrorist';
  const sideColor = util.side === 'CT' ? 'var(--smoke-clr)' : 'var(--flash-clr)';
  const mapLabel  = mapId.charAt(0).toUpperCase() + mapId.slice(1);

  videoCol.innerHTML = `
    <div class="video-header">
      <div class="util-title">${util.name}</div>
      <div class="util-meta">
        <span class="meta-pill">Map: <strong>${mapLabel}</strong></span>
        <span class="meta-pill">Side: <strong style="color:${sideColor}">${sideLabel}</strong></span>
        <span class="meta-pill">Location: <strong>${spotLabel}</strong></span>
      </div>
    </div>
    <div class="video-frame">
      ${buildVideoEmbed(util.video, mapId)}
    </div>`;

  /* ── Build info column ──────────────────────────────────────── */
  const infoCol = document.createElement('div');
  infoCol.className = 'info-col';

  const steps = [
    { label: 'Start Position', text: util.startPoint },
    { label: 'Where to Aim',   text: util.aim        },
    { label: 'How to Throw',   text: util.throwType  },
  ].filter(s => s.text && s.text.trim());

  const stepsHtml = steps.length > 0 ? `
    <div class="info-section">
      <div class="info-section-label">Throw Instructions</div>
      ${steps.map((s, i) => `
        <div class="throw-step">
          <div class="step-num">${i + 1}</div>
          <div class="step-body">
            <div class="step-label">${s.label}</div>
            <div class="step-text">${s.text}</div>
          </div>
        </div>`).join('')}
    </div>` : '';

  const notesHtml = (util.notes && util.notes.trim()) ? `
    <div class="info-section">
      <div class="info-section-label">Notes</div>
      <div class="notes-box">${util.notes}</div>
    </div>` : '';

  const noInfo = steps.length === 0 && !util.notes;
  infoCol.innerHTML = stepsHtml + notesHtml + (noInfo ? `
    <div class="info-section">
      <div style="color:var(--text-dim);font-family:'Barlow Condensed',sans-serif;
        font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;padding:.5rem 0;">
        No additional info provided.
      </div>
    </div>` : '');

  content.appendChild(videoCol);
  content.appendChild(infoCol);

})();
