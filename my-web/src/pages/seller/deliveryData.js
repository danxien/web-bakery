// ─── Shared Delivery Data ─────────────────────────────────────────────────────
// 4 batches: today, ~2 weeks ago, ~1 month ago, ~2 months ago

const todayDeliveries = [

  // ── Batch 1: Today (03/12/2026) — all Fresh ──
  { id: 1,  cakeType: "Chocolate Cake",    qty: 15, delivered: "03/12/2026", expires: "03/22/2026" },
  { id: 2,  cakeType: "Vanilla Cake",      qty: 15, delivered: "03/12/2026", expires: "03/22/2026" },
  { id: 3,  cakeType: "Red Velvet Cake",   qty: 10, delivered: "03/12/2026", expires: "03/22/2026" },
  { id: 4,  cakeType: "Carrot Cake",       qty: 10, delivered: "03/12/2026", expires: "03/22/2026" },
  { id: 5,  cakeType: "Cheesecake",        qty: 15, delivered: "03/12/2026", expires: "03/22/2026" },

  // ── Batch 2: Feb 28, 2026 — Near Expiry ──
  { id: 6,  cakeType: "Black Forest Cake", qty: 12, delivered: "02/28/2026", expires: "03/14/2026" },
  { id: 7,  cakeType: "Strawberry Cake",   qty: 10, delivered: "02/28/2026", expires: "03/14/2026" },
  { id: 8,  cakeType: "Mango Cake",        qty: 8,  delivered: "02/28/2026", expires: "03/13/2026" },
  { id: 9,  cakeType: "Red Velvet Cake",   qty: 5,  delivered: "02/28/2026", expires: "03/13/2026" },

  // ── Batch 3: Feb 10, 2026 — Expired ──
  { id: 10, cakeType: "Chocolate Cake",    qty: 20, delivered: "02/10/2026", expires: "02/20/2026" },
  { id: 11, cakeType: "Vanilla Cake",      qty: 18, delivered: "02/10/2026", expires: "02/20/2026" },
  { id: 12, cakeType: "Cheesecake",        qty: 10, delivered: "02/10/2026", expires: "02/18/2026" },
  { id: 13, cakeType: "Carrot Cake",       qty: 12, delivered: "02/10/2026", expires: "02/18/2026" },

  // ── Batch 4: Jan 20, 2026 — Expired ──
  { id: 14, cakeType: "Mango Cake",        qty: 15, delivered: "01/20/2026", expires: "01/30/2026" },
  { id: 15, cakeType: "Black Forest Cake", qty: 10, delivered: "01/20/2026", expires: "01/30/2026" },
  { id: 16, cakeType: "Strawberry Cake",   qty: 12, delivered: "01/20/2026", expires: "01/28/2026" },
  { id: 17, cakeType: "Red Velvet Cake",   qty: 8,  delivered: "01/20/2026", expires: "01/28/2026" },

];

export default todayDeliveries;