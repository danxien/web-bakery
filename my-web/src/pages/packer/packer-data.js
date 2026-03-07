export const initialBranchStock = [
  {
    branch: 'Main Branch',
    cake: 'Chocolate Cake',
    price: 500,
    qty: 24,
    madeDate: '2026-02-20',
    expiryDate: '2026-02-24',
    status: 'Fresh',
  },
  {
    branch: 'Main Branch',
    cake: 'Vanilla Cake',
    price: 450,
    qty: 18,
    madeDate: '2026-02-20',
    expiryDate: '2026-02-24',
    status: 'Fresh',
  },
  {
    branch: 'Main Branch',
    cake: 'Red Velvet Cake',
    price: 600,
    qty: 10,
    madeDate: '2026-02-19',
    expiryDate: '2026-02-23',
    status: 'Fresh',
  },
  {
    branch: 'Main Branch',
    cake: 'Carrot Cake',
    price: 550,
    qty: 8,
    madeDate: '2026-02-18',
    expiryDate: '2026-02-22',
    status: 'Near Expiry',
  },
  {
    branch: 'Main Branch',
    cake: 'Cheesecake',
    price: 650,
    qty: 6,
    madeDate: '2026-02-18',
    expiryDate: '2026-02-22',
    status: 'Near Expiry',
  },
  {
    branch: 'Main Branch',
    cake: 'Black Forest Cake',
    price: 700,
    qty: 5,
    madeDate: '2026-02-17',
    expiryDate: '2026-02-21',
    status: 'Near Expiry',
  },
  {
    branch: 'Main Branch',
    cake: 'Strawberry Cake',
    price: 580,
    qty: 9,
    madeDate: '2026-02-20',
    expiryDate: '2026-02-24',
    status: 'Fresh',
  },
  {
    branch: 'Main Branch',
    cake: 'Mango Cake',
    price: 520,
    qty: 12,
    madeDate: '2026-02-20',
    expiryDate: '2026-02-24',
    status: 'Fresh',
  },
];

export const initialDeliveryToday = [];

export const inboxMessages = [];

export const customOrders = [
  {
    customer: 'Anna Cruz',
    cake: 'Chocolate Cake',
    qty: 2,
    price: 500,
    pickup: '2026-02-21 4:00 PM',
    status: 'Pending',
  },
  {
    customer: 'Mark Dela Rosa',
    cake: 'Red Velvet Cake',
    qty: 1,
    price: 600,
    pickup: '2026-02-21 6:30 PM',
    status: 'Ready',
  },
];

export const getBadgeClass = (status) => {
  if (status === 'Fresh' || status === 'Delivered' || status === 'Ready') return 'ok';
  if (status === 'Near Expiry' || status === 'In Transit' || status === 'Pending') return 'warn';
  return 'danger';
};
