/* ============================================================
   store.js — unified localStorage data layer
   All pages import this to read/write hotspot + utility data.
   ============================================================ */

const STORE_KEY = 'cs2_utility_hub';

const Store = (() => {

  /** Return the full data object (hotspots keyed by map id) */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch {
      return {};
    }
  }

  /** Persist the full data object */
  function save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  /** Get all hotspots for a given map (e.g. "mirage") */
  function getHotspots(mapId) {
    return load()[mapId] || [];
  }

  /** Overwrite all hotspots for a given map */
  function setHotspots(mapId, hotspots) {
    const data = load();
    data[mapId] = hotspots;
    save(data);
  }

  /** Add a new hotspot to a map */
  function addHotspot(mapId, hotspot) {
    const spots = getHotspots(mapId);
    spots.push(hotspot);
    setHotspots(mapId, spots);
    return spots;
  }

  /** Update a hotspot by its id */
  function updateHotspot(mapId, hotspotId, patch) {
    const spots = getHotspots(mapId).map(s =>
      s.id === hotspotId ? { ...s, ...patch } : s
    );
    setHotspots(mapId, spots);
    return spots;
  }

  /** Delete a hotspot by its id */
  function deleteHotspot(mapId, hotspotId) {
    const spots = getHotspots(mapId).filter(s => s.id !== hotspotId);
    setHotspots(mapId, spots);
    return spots;
  }

  /** Add a utility to a specific hotspot */
  function addUtility(mapId, hotspotId, utility) {
    const spots = getHotspots(mapId);
    const spot  = spots.find(s => s.id === hotspotId);
    if (!spot) return spots;
    if (!spot.utilities) spot.utilities = [];
    spot.utilities.push(utility);
    setHotspots(mapId, spots);
    return spots;
  }

  /** Update a utility within a hotspot */
  function updateUtility(mapId, hotspotId, utilityId, patch) {
    const spots = getHotspots(mapId);
    const spot  = spots.find(s => s.id === hotspotId);
    if (!spot) return spots;
    spot.utilities = (spot.utilities || []).map(u =>
      u.id === utilityId ? { ...u, ...patch } : u
    );
    setHotspots(mapId, spots);
    return spots;
  }

  /** Delete a utility from a hotspot */
  function deleteUtility(mapId, hotspotId, utilityId) {
    const spots = getHotspots(mapId);
    const spot  = spots.find(s => s.id === hotspotId);
    if (!spot) return spots;
    spot.utilities = (spot.utilities || []).filter(u => u.id !== utilityId);
    setHotspots(mapId, spots);
    return spots;
  }

  /** Wipe all data for a map */
  function clearMap(mapId) {
    const data = load();
    delete data[mapId];
    save(data);
  }

  /** Export full data as JSON string */
  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  /** Import data from JSON string (merges) */
  function importJSON(jsonStr) {
    const incoming = JSON.parse(jsonStr);
    const existing = load();
    save({ ...existing, ...incoming });
  }

  /** Generate a simple unique id */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  return {
    getHotspots, setHotspots, addHotspot, updateHotspot, deleteHotspot,
    addUtility, updateUtility, deleteUtility,
    clearMap, exportJSON, importJSON, uid
  };
})();
