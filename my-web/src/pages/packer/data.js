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

export const initialDeliveryToday = [
  {
    branch: 'Main Branch',
    customer: 'Anna Cruz',
    cake: 'Chocolate Cake',
    qty: 10,
    price: 500,
    specialInstructions: 'Birthday candle included',
    orderDate: '2026-02-24',
    pickupDate: '2026-02-24',
    time: '08:30 AM',
    status: 'Delivered',
  },
  {
    branch: 'Main Branch',
    customer: 'Mark Dela Rosa',
    cake: 'Red Velvet Cake',
    qty: 8,
    price: 600,
    specialInstructions: 'No nuts',
    orderDate: '2026-02-24',
    pickupDate: '2026-02-24',
    time: '09:10 AM',
    status: 'Delivered',
  },
  {
    branch: 'Main Branch',
    customer: 'Jenna Santos',
    cake: 'Mango Cake',
    qty: 6,
    price: 520,
    specialInstructions: 'Pack separately',
    orderDate: '2026-02-24',
    pickupDate: '2026-02-24',
    time: '10:00 AM',
    status: 'In Transit',
  },
  {
    branch: 'Main Branch',
    customer: 'Paolo Reyes',
    cake: 'Carrot Cake',
    qty: 5,
    price: 550,
    specialInstructions: 'Pickup after lunch',
    orderDate: '2026-02-24',
    pickupDate: '2026-02-24',
    time: '11:00 AM',
    status: 'Pending',
  },
];

export const inboxMessages = [
  {
    from: 'Seller - Main Branch',
    content: 'Need +3 Red Velvet. Kulang sa display.',
    sentAt: '09:45 AM',
    unread: true,
  },
  {
    from: 'Seller - Main Branch',
    content: 'May reserve order for 2 Chocolate Cake, pickup 4PM.',
    sentAt: '10:12 AM',
    unread: true,
  },
  {
    from: 'Seller - Main Branch',
    content: 'Received all items. Thank you.',
    sentAt: '11:02 AM',
    unread: false,
  },
];

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
