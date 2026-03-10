export const initialBranchStock = [];

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
