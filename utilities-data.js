// ============================================================
//  CS2 UTILITY DATABASE
//  Add new utilities here. Each entry maps to a hotspot on
//  the map and generates its own detail page automatically.
// ============================================================

const UTILITIES = [
  {
    id: "side-alley-con",
    location: "T Spawn",           // hotspot group on the map
    name: "Side Alley - Con",
    type: "smoke",                  // smoke | flash | molotov | nade
    side: "T",                      // T | CT
    // YouTube embed URL  (use  /embed/VIDEO_ID  format)
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    startPoint:  "T Spawn – right side of the bus, align your back to the corner",
    aim:         "Look at the top-right edge of the yellow building trim",
    throwType:   "Jump + Left-click (running jump throw)",
    notes:       "Lands perfectly on Con exit. Works from 128-tick and 64-tick servers.",
    tags:        ["con", "t-spawn", "default"]
  },
  {
    id: "side-alley-window",
    location: "T Spawn",
    name: "Side Alley - Window",
    type: "smoke",
    side: "T",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    startPoint:  "T Spawn – left side of the bus, crouch against the wall",
    aim:         "Aim at the top of the antenna on the mid building",
    throwType:   "Jump + Left-click (running jump throw)",
    notes:       "Blocks CT window vision when pushing mid.",
    tags:        ["window", "mid", "t-spawn"]
  },
  {
    id: "ct-spawn-t-spawn",
    location: "T Spawn",
    name: "CT Spawn - T Spawn",
    type: "smoke",
    side: "T",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    startPoint:  "T Spawn – center of the T ramp, hug the right wall",
    aim:         "Top-left corner of the green awning on the CT building",
    throwType:   "Jump + Left-click (running jump throw)",
    notes:       "Essential smoke for A site executes.",
    tags:        ["ct-spawn", "a-site", "execute"]
  },
  {
    id: "jungle-t-spawn",
    location: "T Spawn",
    name: "T Spawn - Jungle",
    type: "smoke",
    side: "T",
    video: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    startPoint:  "T Spawn – far right corner near the T ramp wall",
    aim:         "Left edge of the building silhouette above jungle entrance",
    throwType:   "Jump + Left-click (running jump throw)",
    notes:       "Cuts off jungle angle so you can safely push mid.",
    tags:        ["jungle", "mid", "t-spawn"]
  }
];

// ── Hotspot positions on the map image (percentages) ──────────
// top / left are % of the map container dimensions.
// Each hotspot can have multiple utility IDs attached to it.

const HOTSPOTS = [
  {
    id:    "t-spawn",
    label: "T Spawn",
    top:   "38%",
    left:  "88%",
    utilities: [
      "side-alley-con",
      "side-alley-window",
      "ct-spawn-t-spawn",
      "jungle-t-spawn"
    ]
  },
  // ── Add more hotspots below as you add more utilities ──────
  // {
  //   id:    "ct-spawn",
  //   label: "CT Spawn",
  //   top:   "75%",
  //   left:  "24%",
  //   utilities: ["some-id"]
  // },
];
