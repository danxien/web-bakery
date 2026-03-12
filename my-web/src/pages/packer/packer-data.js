export const initialBranchStock = [
  { branch: 'Main Branch', cake: 'Ube Cake', price: 250, qty: 8, madeDate: '2024-10-05', expiryDate: '2024-10-10', status: 'Fresh' },
  { branch: 'Main Branch', cake: 'Chocolate Cake', price: 220, qty: 15, madeDate: '2024-10-06', expiryDate: '2024-10-11', status: 'Fresh' },
  { branch: 'Main Branch', cake: 'Mango Cake', price: 280, qty: 5, madeDate: '2024-10-07', expiryDate: '2024-10-12', status: 'Near Expiry' },
];

export const initialDeliveryToday = [];

export const initialStockDeliveries = [];

export const inboxMessages = [];

export const customOrders = [];

export const getBadgeClass = (status) => {
  if (status === 'Fresh' || status === 'Delivered' || status === 'Ready') return 'ok';
  if (status === 'Near Expiry' || status === 'In Transit' || status === 'Pending') return 'warn';
  return 'danger';
};
