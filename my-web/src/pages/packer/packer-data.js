export const initialBranchStock = [];

export const initialDeliveryToday = [];

export const inboxMessages = [];

export const customOrders = [];

export const getBadgeClass = (status) => {
  if (status === 'Fresh' || status === 'Delivered' || status === 'Ready') return 'ok';
  if (status === 'Near Expiry' || status === 'In Transit' || status === 'Pending') return 'warn';
  return 'danger';
};
