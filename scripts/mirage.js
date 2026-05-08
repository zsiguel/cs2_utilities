/* ============================================================
   mirage.js — renders hotspots + submenus from Firestore
   Shared by ALL map pages via data-map-id on the <img> tag.
   ============================================================ */

import Store from "./store.js";

(async function () {
  const mapImg     = document.getElementById('map-img');
  const mapWrapper = document.getElementById('map-wrapper');
  const countPill  = document.getElementById('util-count-pill');
  const MAP_ID     = mapImg.dataset.mapId || 'mirage';

  let openSubmenu  = null;
  let cachedSpots  = [];

  /* ── Position helper: % → px relative to image inside wrapper ─ */
  function applyPosition(el, top, left) {
    const imgRect = mapImg.getBoundingClientRect();
    const wRect   = mapWrapper.getBoundingClientRect();
    el.style.left = (parseFloat(left) / 100 * imgRect.width  + (imgRect.left - wRect.left)) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgRect.height + (imgRect.top  - wRect.top))  + 'px';
  }

  /* ── Reposition existing pins without rebuilding DOM ────────── */
  function repositionHotspots() {
    mapWrapper.querySelectorAll('.hotspot[data-spot-top]').forEach(el => {
      applyPosition(el, el.dataset.spotTop, el.dataset.spotLeft);
    });
  }

  /* ── Build hotspot DOM (called once on load) ────────────────── */
  function buildHotspots(hotspots) {
    mapWrapper.querySelectorAll('.hotspot').forEach(el => el.remove());
    let totalUtils = 0;

    hotspots.forEach(spot => {
      totalUtils += (spot.utilities || []).length;

      const anchor = document.createElement('div');
      anchor.className = 'hotspot';
      // Store coords as data attrs so repositionHotspots() can reuse them
      anchor.dataset.spotTop  = spot.top;
      anchor.dataset.spotLeft = spot.left;
      applyPosition(anchor, spot.top, spot.left);

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
        item.href = `utility.html?map=${MAP_ID}&spot=${spot.id}&id=${util.id}`;

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

      /* ── Hover logic ─────────────────────────────────────────── */
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

    if (countPill) {
      countPill.textContent =
        totalUtils + ' utilit' + (totalUtils === 1 ? 'y' : 'ies') + ' loaded';
    }
  }

  /* Close submenu on outside click */
  document.addEventListener('click', e => {
    if (!e.target.closest('.hotspot') && openSubmenu) {
      openSubmenu.classList.remove('visible');
      openSubmenu.__btn?.classList.remove('open');
      openSubmenu = null;
    }
  });

  /* Reposition only on resize — no Firestore re-fetch, no DOM rebuild */
  window.addEventListener('resize', repositionHotspots);

  /* ── Init ───────────────────────────────────────────────────── */
  async function init() {
    if (countPill) countPill.textContent = 'Loading…';
    cachedSpots = await Store.getHotspots(MAP_ID);
    buildHotspots(cachedSpots);
  }

  if (mapImg.complete && mapImg.naturalWidth > 0) await init();
  else mapImg.addEventListener('load', init);

})();
