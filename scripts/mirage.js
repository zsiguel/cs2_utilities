/* ============================================================
   mirage.js — renders hotspots + submenus from localStorage
   ============================================================ */

(function () {
  const mapImg     = document.getElementById('map-img');
  const MAP_ID     = mapImg.dataset.mapId || 'mirage';
  const mapWrapper = document.getElementById('map-wrapper');
  const countPill  = document.getElementById('util-count-pill');

  const TYPE_COLOR = {
    smoke:   'var(--smoke-clr)',
    flash:   'var(--flash-clr)',
    molotov: 'var(--molly-clr)',
    nade:    'var(--nade-clr)',
  };

  let openSubmenu = null;

  /* ── Position helper — maps stored % coords onto the image ──── */
  function applyPosition(el, top, left) {
    const imgRect = mapImg.getBoundingClientRect();
    const wRect   = mapWrapper.getBoundingClientRect();
    const offsetX = imgRect.left - wRect.left;
    const offsetY = imgRect.top  - wRect.top;
    el.style.left = (parseFloat(left) / 100 * imgRect.width  + offsetX) + 'px';
    el.style.top  = (parseFloat(top)  / 100 * imgRect.height + offsetY) + 'px';
  }

  /* ── Build DOM from stored hotspots ────────────────────────── */
  function buildHotspots() {
    // Remove existing pins
    document.querySelectorAll('.hotspot').forEach(el => el.remove());

    const hotspots = Store.getHotspots(MAP_ID);
    let totalUtils = 0;

    hotspots.forEach(spot => {
      totalUtils += (spot.utilities || []).length;

      const anchor = document.createElement('div');
      anchor.className = 'hotspot';
      applyPosition(anchor, spot.top, spot.left);

      /* trigger dot */
      const btn = document.createElement('button');
      btn.className = 'hotspot-btn';
      btn.setAttribute('aria-label', spot.label);

      /* label */
      const lbl = document.createElement('span');
      lbl.className = 'hotspot-label';
      lbl.textContent = spot.label;

      /* submenu */
      const sub = document.createElement('div');
      sub.className = 'submenu';

      const hdr = document.createElement('div');
      hdr.className = 'submenu-header';
      hdr.textContent = spot.label;
      sub.appendChild(hdr);

      (spot.utilities || []).forEach(util => {
        const item = document.createElement('a');
        item.className = 'submenu-item';
        item.href = `utility.html?map=${MAP_ID}&id=${util.id}`;

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
        empty.style.cssText = 'padding:.5rem .6rem;font-size:.72rem;color:var(--text-dim);font-family:"Barlow Condensed",sans-serif;letter-spacing:.1em;text-transform:uppercase;';
        empty.textContent = 'No utilities yet';
        sub.appendChild(empty);
      }

      anchor.appendChild(btn);
      anchor.appendChild(lbl);
      anchor.appendChild(sub);
      mapWrapper.appendChild(anchor);

      /* hover logic */
      let hideTimer = null;

      function showMenu() {
        clearTimeout(hideTimer);
        if (openSubmenu && openSubmenu !== sub) {
          openSubmenu.classList.remove('visible');
          openSubmenu.__btn?.classList.remove('open');
        }
        const aRect = anchor.getBoundingClientRect();
        const wRect = mapWrapper.getBoundingClientRect();
        const spaceRight = wRect.right - aRect.right;
        sub.style.left  = spaceRight < 230 ? 'auto' : '32px';
        sub.style.right = spaceRight < 230 ? '32px' : 'auto';
        sub.style.top   = '0';
        sub.classList.add('visible');
        btn.classList.add('open');
        sub.__btn = btn;
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

    /* update pill */
    if (countPill) {
      countPill.textContent = totalUtils + ' utilit' + (totalUtils === 1 ? 'y' : 'ies') + ' loaded';
    }
  }

  /* ── Click outside closes submenu ──────────────────────────── */
  document.addEventListener('click', e => {
    if (!e.target.closest('.hotspot') && openSubmenu) {
      openSubmenu.classList.remove('visible');
      openSubmenu.__btn?.classList.remove('open');
      openSubmenu = null;
    }
  });

  /* ── Init ───────────────────────────────────────────────────── */
  if (mapImg.complete) buildHotspots();
  else mapImg.addEventListener('load', buildHotspots);

  // Reposition pins when window is resized
  window.addEventListener('resize', buildHotspots);

})();
