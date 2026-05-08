/* ============================================================
   nuke.js — dual-layer map renderer (Upper / Lower)
   ============================================================ */

import Store from "./store.js";

(async function () {
  const mapWrapper  = document.getElementById('map-wrapper');
  const countPill   = document.getElementById('util-count-pill');
  const layerLabel  = document.getElementById('layer-label');
  const btnUpper    = document.getElementById('btn-upper');
  const btnLower    = document.getElementById('btn-lower');

  const imgUpper    = document.getElementById('map-img');
  const imgLower    = document.getElementById('map-img-lower');

  let activeLayer   = 'upper';   // 'upper' | 'lower'
  let openSubmenu   = null;
  let cache         = { upper: [], lower: [] };

  /* ── Position helper ────────────────────────────────────────── */
  function activeImg() {
    return activeLayer === 'upper' ? imgUpper : imgLower;
  }

  function applyPosition(el, top, left) {
    const img   = activeImg();
    const imgR  = img.getBoundingClientRect();
    const wrapR = mapWrapper.getBoundingClientRect();
    el.style.left = (parseFloat(left) / 100 * imgR.width  + (imgR.left - wrapR.left)) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgR.height + (imgR.top  - wrapR.top))  + 'px';
  }

  /* ── Build hotspot DOM for one layer ────────────────────────── */
  function buildHotspots(hotspots, layerId) {
    // Remove existing pins for this layer
    document.querySelectorAll(`.hotspot[data-layer="${layerId}"]`).forEach(el => el.remove());

    const isActive = layerId === activeLayer;

    hotspots.forEach(spot => {
      const anchor = document.createElement('div');
      anchor.className = 'hotspot' + (isActive ? '' : ' layer-hidden');
      anchor.dataset.layer    = layerId;
      anchor.dataset.spotTop  = spot.top;
      anchor.dataset.spotLeft = spot.left;
      applyPositionForLayer(anchor, spot.top, spot.left, layerId);

      const btn = document.createElement('button');
      btn.className = 'hotspot-btn';
      btn.setAttribute('aria-label', spot.label);

      const lbl = document.createElement('span');
      lbl.className = 'hotspot-label';
      lbl.textContent = spot.label;

      const sub = document.createElement('div');
      sub.className = 'submenu';

      const hdr = document.createElement('div');
      hdr.className = 'submenu-header';
      hdr.textContent = spot.label;
      sub.appendChild(hdr);

      (spot.utilities || []).forEach(util => {
        const item = document.createElement('a');
        item.className = 'submenu-item';
        item.href = `utility.html?map=nuke-${layerId}&spot=${spot.id}&id=${util.id}`;

        const dot = document.createElement('span');
        dot.className = `type-dot ${util.type}`;

        const name = document.createElement('span');
        name.textContent = util.name;

        const side = document.createElement('span');
        side.className = 'item-side';
        side.textContent = util.side || 'T';

        item.appendChild(dot);
        item.appendChild(name);
        item.appendChild(side);
        sub.appendChild(item);
      });

      if ((spot.utilities || []).length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'padding:.5rem .6rem;font-size:.72rem;color:var(--text-dim);' +
          'font-family:"Barlow Condensed",sans-serif;letter-spacing:.1em;text-transform:uppercase;';
        empty.textContent = 'No utilities yet';
        sub.appendChild(empty);
      }

      anchor.appendChild(btn);
      anchor.appendChild(lbl);
      anchor.appendChild(sub);
      mapWrapper.appendChild(anchor);

      let hideTimer = null;
      function showMenu() {
        clearTimeout(hideTimer);
        if (openSubmenu && openSubmenu !== sub) {
          openSubmenu.classList.remove('visible');
          openSubmenu.__btn?.classList.remove('open');
        }
        const aRect = anchor.getBoundingClientRect();
        const wRect = mapWrapper.getBoundingClientRect();
        sub.style.left  = (wRect.right - aRect.right) < 230 ? 'auto' : '32px';
        sub.style.right = (wRect.right - aRect.right) < 230 ? '32px' : 'auto';
        sub.style.top   = '0';
        sub.classList.add('visible');
        btn.classList.add('open');
        sub.__btn   = btn;
        openSubmenu = sub;
      }
      function scheduleHide() {
        hideTimer = setTimeout(() => {
          sub.classList.remove('visible');
          btn.classList.remove('open');
          if (openSubmenu === sub) openSubmenu = null;
        }, 120);
      }
      btn.addEventListener('mouseenter', showMenu);
      btn.addEventListener('mouseleave', scheduleHide);
      sub.addEventListener('mouseenter', () => clearTimeout(hideTimer));
      sub.addEventListener('mouseleave', scheduleHide);
    });
  }

  /* Position helper that uses a specific layer's image */
  function applyPositionForLayer(el, top, left, layerId) {
    const img   = layerId === 'upper' ? imgUpper : imgLower;
    const imgR  = img.getBoundingClientRect();
    const wrapR = mapWrapper.getBoundingClientRect();
    el.style.left = (parseFloat(left) / 100 * imgR.width  + (imgR.left - wrapR.left)) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgR.height + (imgR.top  - wrapR.top))  + 'px';
  }

  /* ── Update count pill ──────────────────────────────────────── */
  function updateCount() {
    const spots = cache[activeLayer] || [];
    const total = spots.reduce((n, s) => n + (s.utilities || []).length, 0);
    if (countPill) countPill.textContent =
      total + ' utilit' + (total === 1 ? 'y' : 'ies') + ' loaded';
  }

  /* ── Switch layers ──────────────────────────────────────────── */
  function switchLayer(layer) {
    if (layer === activeLayer) return;

    // Close any open submenu
    if (openSubmenu) {
      openSubmenu.classList.remove('visible');
      openSubmenu.__btn?.classList.remove('open');
      openSubmenu = null;
    }

    activeLayer = layer;

    // Swap image opacity
    imgUpper.classList.toggle('active-layer', layer === 'upper');
    imgLower.classList.toggle('active-layer', layer === 'lower');

    // Swap button active state
    btnUpper.classList.toggle('active', layer === 'upper');
    btnLower.classList.toggle('active', layer === 'lower');

    // Update status label
    if (layerLabel) layerLabel.textContent = layer === 'upper' ? 'Upper' : 'Lower';

    // Show/hide hotspot pins
    document.querySelectorAll('.hotspot[data-layer="upper"]').forEach(el =>
      el.classList.toggle('layer-hidden', layer !== 'upper'));
    document.querySelectorAll('.hotspot[data-layer="lower"]').forEach(el =>
      el.classList.toggle('layer-hidden', layer !== 'lower'));

    updateCount();
  }

  btnUpper.addEventListener('click', () => switchLayer('upper'));
  btnLower.addEventListener('click', () => switchLayer('lower'));

  /* ── Click outside closes submenu ──────────────────────────── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.hotspot') && openSubmenu) {
      openSubmenu.classList.remove('visible');
      openSubmenu.__btn?.classList.remove('open');
      openSubmenu = null;
    }
  });

  /* ── Reposition on resize — reads from data attrs, no Firestore ─ */
  window.addEventListener('resize', () => {
    mapWrapper.querySelectorAll('.hotspot[data-spot-top]').forEach(el => {
      applyPositionForLayer(el, el.dataset.spotTop, el.dataset.spotLeft, el.dataset.layer);
    });
  });

  /* ── Init ───────────────────────────────────────────────────── */
  async function init() {
    if (countPill) countPill.textContent = 'Loading…';

    // Fetch both layers in parallel
    const [upper, lower] = await Promise.all([
      Store.getHotspots('nuke-upper'),
      Store.getHotspots('nuke-lower'),
    ]);
    cache.upper = upper;
    cache.lower = lower;

    // Wait for both images to have dimensions
    await Promise.all([imgUpper, imgLower].map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => img.addEventListener('load', res, { once: true }))
    ));

    buildHotspots(upper, 'upper');
    buildHotspots(lower, 'lower');
    updateCount();
  }

  init();

})();
