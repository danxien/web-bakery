// ─── Shared Delivery Data ─────────────────────────────────────────────────────

const today = new Date().toLocaleDateString('en-US', {
  month: '2-digit', day: '2-digit', year: 'numeric'
});

const todayDeliveries = [
  { id: 1, cakeType: "Chocolate Cake",  qty: 15, delivered: today,        expires: "3/10/2026" },
  { id: 2, cakeType: "Vanilla Cake",    qty: 15, delivered: today,        expires: "3/10/2026" },
  { id: 3, cakeType: "Red Velvet Cake", qty: 10, delivered: today,        expires: "3/5/2026" },
  { id: 4, cakeType: "Cheesecake",      qty: 15, delivered: today,        expires: "3/10/2026" },
  { id: 5, cakeType: "Carrot Cake",      qty: 10, delivered: today,       expires: "3/5/2026" },
  { id: 5, cakeType: "Black Forest Cake", qty: 15, delivered: "02/18/2026", expires: "3/1/2026"  },
  { id: 6, cakeType: "Strawberry Cake",   qty: 10, delivered: "02/18/2026", expires: "2/25/2026" },
  { id: 7, cakeType: "Mango Cake",        qty: 10, delivered: "02/18/2026", expires: "3/1/2026"  },
];

export default todayDeliveries;