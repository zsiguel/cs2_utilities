/* ============================================================
   store.js — Firestore data layer
   Firestore structure:
     maps/{mapId}/hotspots/{hotspotId}
     maps/{mapId}/hotspots/{hotspotId}/utilities/{utilityId}
   ============================================================ */

import {
  db, collection, doc,
  getDocs, setDoc, deleteDoc
} from "./firebase-config.js";

const Store = {

  /* ── uid generator ─────────────────────────────────────────── */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  /* ── READ: all hotspots + utilities for a map ───────────────── */
  async getHotspots(mapId) {
    const spotsSnap = await getDocs(
      collection(db, "maps", mapId, "hotspots")
    );
    const hotspots = [];
    for (const spotDoc of spotsSnap.docs) {
      const utilsSnap = await getDocs(
        collection(db, "maps", mapId, "hotspots", spotDoc.id, "utilities")
      );
      hotspots.push({
        id: spotDoc.id,
        ...spotDoc.data(),
        utilities: utilsSnap.docs.map(u => ({ id: u.id, ...u.data() }))
      });
    }
    return hotspots;
  },

  /* ── CREATE hotspot ─────────────────────────────────────────── */
  async addHotspot(mapId, hotspot) {
    const { id, utilities, ...data } = hotspot;
    await setDoc(doc(db, "maps", mapId, "hotspots", id), data);
  },

  /* ── UPDATE hotspot fields ──────────────────────────────────── */
  async updateHotspot(mapId, hotspotId, patch) {
    await setDoc(
      doc(db, "maps", mapId, "hotspots", hotspotId),
      patch,
      { merge: true }
    );
  },

  /* ── DELETE hotspot + all its utilities ─────────────────────── */
  async deleteHotspot(mapId, hotspotId) {
    const utilsSnap = await getDocs(
      collection(db, "maps", mapId, "hotspots", hotspotId, "utilities")
    );
    for (const u of utilsSnap.docs) await deleteDoc(u.ref);
    await deleteDoc(doc(db, "maps", mapId, "hotspots", hotspotId));
  },

  /* ── CREATE utility ─────────────────────────────────────────── */
  async addUtility(mapId, hotspotId, utility) {
    const { id, ...data } = utility;
    await setDoc(
      doc(db, "maps", mapId, "hotspots", hotspotId, "utilities", id),
      data
    );
  },

  /* ── UPDATE utility fields ──────────────────────────────────── */
  async updateUtility(mapId, hotspotId, utilityId, patch) {
    await setDoc(
      doc(db, "maps", mapId, "hotspots", hotspotId, "utilities", utilityId),
      patch,
      { merge: true }
    );
  },

  /* ── DELETE utility ─────────────────────────────────────────── */
  async deleteUtility(mapId, hotspotId, utilityId) {
    await deleteDoc(
      doc(db, "maps", mapId, "hotspots", hotspotId, "utilities", utilityId)
    );
  },

  /* ── DELETE all hotspots for a map ─────────────────────────── */
  async clearMap(mapId) {
    const spotsSnap = await getDocs(
      collection(db, "maps", mapId, "hotspots")
    );
    for (const spotDoc of spotsSnap.docs) {
      await this.deleteHotspot(mapId, spotDoc.id);
    }
  },

  /* ── Export map data as JSON ────────────────────────────────── */
  async exportJSON(mapId) {
    const hotspots = await this.getHotspots(mapId);
    return JSON.stringify({ [mapId]: hotspots }, null, 2);
  }
};

export default Store;
