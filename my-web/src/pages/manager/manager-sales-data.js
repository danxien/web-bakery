/**
 * Manager Sales Overview Data
 * Contains sample data for sales trends and top-selling cakes
 */

// Sample Sales Trend Data (Last 30 days)
export const salesTrendData = [
  { date: '2026-01-27', sales: 1200, orders: 8 },
  { date: '2026-01-28', sales: 1900, orders: 12 },
  { date: '2026-01-29', sales: 1400, orders: 9 },
  { date: '2026-01-30', sales: 2200, orders: 15 },
  { date: '2026-01-31', sales: 2290, orders: 16 },
  { date: '2026-02-01', sales: 2000, orders: 13 },
  { date: '2026-02-02', sales: 2181, orders: 14 },
  { date: '2026-02-03', sales: 2500, orders: 18 },
  { date: '2026-02-04', sales: 2100, orders: 15 },
  { date: '2026-02-05', sales: 2900, orders: 20 },
  { date: '2026-02-06', sales: 1800, orders: 12 },
  { date: '2026-02-07', sales: 2200, orders: 16 },
  { date: '2026-02-08', sales: 2400, orders: 17 },
  { date: '2026-02-09', sales: 3100, orders: 22 },
  { date: '2026-02-10', sales: 2800, orders: 20 },
  { date: '2026-02-11', sales: 2300, orders: 17 },
  { date: '2026-02-12', sales: 2600, orders: 19 },
  { date: '2026-02-13', sales: 2900, orders: 21 },
  { date: '2026-02-14', sales: 3500, orders: 25 }, // Valentine's Day
  { date: '2026-02-15', sales: 3200, orders: 24 },
  { date: '2026-02-16', sales: 2400, orders: 18 },
  { date: '2026-02-17', sales: 2100, orders: 15 },
  { date: '2026-02-18', sales: 2700, orders: 19 },
  { date: '2026-02-19', sales: 3000, orders: 22 },
  { date: '2026-02-20', sales: 2500, orders: 18 },
  { date: '2026-02-21', sales: 2400, orders: 17 },
  { date: '2026-02-22', sales: 2800, orders: 20 },
  { date: '2026-02-23', sales: 2600, orders: 19 },
  { date: '2026-02-24', sales: 2900, orders: 21 },
  { date: '2026-02-25', sales: 3100, orders: 23 },
  { date: '2026-02-26', sales: 2750, orders: 20 }
];

// Weekly aggregated data (Today, This Week, This Month)
export const getSalesDataByPeriod = (period) => {
  const dataByPeriod = {
    today: [
      { date: '12 AM', sales: 150, orders: 1 },
      { date: '3 AM', sales: 200, orders: 1 },
      { date: '6 AM', sales: 300, orders: 2 },
      { date: '9 AM', sales: 450, orders: 3 },
      { date: '12 PM', sales: 600, orders: 4 },
      { date: '3 PM', sales: 750, orders: 5 },
      { date: '6 PM', sales: 500, orders: 3 },
      { date: '9 PM', sales: 200, orders: 1 }
    ],
    thisWeek: [
      { date: 'Mon', sales: 2200, orders: 15 },
      { date: 'Tue', sales: 2400, orders: 17 },
      { date: 'Wed', sales: 2100, orders: 14 },
      { date: 'Thu', sales: 2800, orders: 20 },
      { date: 'Fri', sales: 3100, orders: 22 },
      { date: 'Sat', sales: 3200, orders: 23 },
      { date: 'Sun', sales: 2750, orders: 20 }
    ],
    thisMonth: [
      { date: 'Week 1', sales: 14000, orders: 98 },
      { date: 'Week 2', sales: 16500, orders: 115 },
      { date: 'Week 3', sales: 17200, orders: 122 },
      { date: 'Week 4', sales: 18100, orders: 128 }
    ]
  };
  
  return dataByPeriod[period] || dataByPeriod.thisMonth;
};

// Top Selling Cakes Data
export const topSellingCakesData = [
  {
    id: 1,
    name: 'Chocolate Truffle',
    sales: 2500,
    volume: 45,
    revenue: 5625.00,
    trend: 'up'
  },
  {
    id: 2,
    name: 'Vanilla Cake',
    sales: 2100,
    volume: 42,
    revenue: 4410.00,
    trend: 'up'
  },
  {
    id: 3,
    name: 'Red Velvet',
    sales: 1800,
    volume: 36,
    revenue: 5400.00,
    trend: 'stable'
  },
  {
    id: 4,
    name: 'Cheesecake',
    sales: 1600,
    volume: 32,
    revenue: 4480.00,
    trend: 'down'
  },
  {
    id: 5,
    name: 'Strawberry Shortcake',
    sales: 1200,
    volume: 24,
    revenue: 2880.00,
    trend: 'up'
  },
  {
    id: 6,
    name: 'Carrot Cake',
    sales: 950,
    volume: 19,
    revenue: 1710.00,
    trend: 'down'
  },
  {
    id: 7,
    name: 'Black Forest',
    sales: 850,
    volume: 17,
    revenue: 2125.00,
    trend: 'stable'
  },
  {
    id: 8,
    name: 'Lemon Drizzle',
    sales: 600,
    volume: 12,
    revenue: 900.00,
    trend: 'down'
  }
];

// Format date for display
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get date range for custom selection
export const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const filteredData = salesTrendData.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
  return filteredData;
};
