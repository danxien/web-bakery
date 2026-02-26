# Sales Overview Graph - Manager Dashboard

## Overview
The Sales Overview Graph is a comprehensive visual dashboard component designed for bakery managers to quickly identify top-performing cakes and sales trends. It provides actionable insights to help with inventory management and sales strategy.

## Features

### 1. **Sales Trend Chart**
- **Multiple Visualizations:**
  - Line Chart: Shows revenue trends with a smooth curve
  - Bar Chart: Shows discrete sales data points
  - Toggle between visualizations with the chart type buttons

- **Time Period Selection:**
  - **Today**: Hourly breakdown of sales
  - **This Week**: Daily breakdown (Monday-Sunday)
  - **This Month**: Weekly breakdown
  - **Custom**: Select any custom date range using date pickers

- **Dual-Axis Display:**
  - Red line/bar: Revenue in pesos
  - Green line/bar: Number of orders
  - Real-time hover tooltips showing exact values

### 2. **Top Selling Cakes Chart**
- **Multiple Visualizations:**
  - Bar Chart: Shows units sold and total sales count side-by-side
  - Pie Chart: Shows market share of cake sales by volume
  - Toggle between visualizations with the chart type buttons

- **Detailed Metrics Table:**
  - Cake Name
  - Units Sold
  - Total Revenue
  - Average Price per Unit
  - Sales Trend (Up/Down/Stable) with visual indicators

### 3. **Quick Metrics Dashboard**
Four key performance indicators (KPIs):
- **Total Sales**: Complete revenue for the selected period
- **Average Order**: Revenue per transaction
- **Peak Sale**: Highest single transaction amount
- **Top Cake**: Best-performing cake and its revenue

### 4. **Key Insights Section**
Actionable recommendations including:
- Top performers and recommended stock actions
- Underperformers requiring promotional strategies
- Overall revenue growth summary

## File Structure

```
src/
├── pages/manager/
│   ├── dashboard.jsx                 # Main dashboard container
│   ├── sales-overview.jsx            # Sales Overview component
│   └── manager-sales-data.js         # Sample data and utilities
├── styles/manager/
│   ├── dashboard.css                 # Dashboard layout styles
│   └── sales-overview.css            # Sales Overview component styles
```

## Component Details

### SalesOverview Component (`sales-overview.jsx`)

**Key State Variables:**
- `timePeriod`: Controls which time period is displayed (today, thisWeek, thisMonth, custom)
- `chartType`: Toggles between line and bar charts for sales trends
- `showPieChart`: Toggles between bar and pie charts for cake sales
- `customDateStart` / `customDateEnd`: Date range for custom period selection

**Key Features:**
- Real-time data filtering based on selected time period
- Automatic metric calculations (total sales, orders, averages)
- Interactive chart switching
- Responsive grid layout that adapts to screen size
- Color-coded insights based on performance

**Data Sources:**
- Sample data from `manager-sales-data.js`
- Can be connected to backend API by replacing data fetching logic

### Data Structure

**Sales Trend Data Format:**
```javascript
{
  date: '2026-02-26',
  sales: 2750,      // Revenue in pesos
  orders: 20        // Number of orders
}
```

**Top Selling Cakes Data Format:**
```javascript
{
  id: 1,
  name: 'Chocolate Truffle',
  sales: 2500,      // Marketing count or campaigns
  volume: 45,       // Units sold
  revenue: 5625.00, // Total revenue
  trend: 'up'       // 'up', 'down', or 'stable'
}
```

## Styling

The component uses a consistent design system with bakery-themed colors:
- **Red (#f3071d)**: Primary action color and top metrics
- **Yellow (#f7dd30)**: Accent and highlights
- **Green (#20a35b)**: Success indicators and positive trends
- **Cream (#fcf6c4)**: Light backgrounds
- **Gray (#666666)**: Muted text and secondary elements

**Responsive Breakpoints:**
- Desktop (> 768px): Full grid layout with side-by-side controls
- Tablet (768px - 480px): Adjusted grid with stacked controls
- Mobile (< 480px): Single column layout with smaller fonts

## Integration with Backend

To connect to a real backend:

1. **Replace data fetching in `sales-overview.jsx`:**
```javascript
// Instead of importing static data, use fetch or API calls
useEffect(() => {
  fetchSalesData(timePeriod, customDateStart, customDateEnd)
    .then(data => setSalesData(data))
    .catch(err => console.error(err));
}, [timePeriod, customDateStart, customDateEnd]);
```

2. **Update `manager-sales-data.js`** to include API functions:
```javascript
export const fetchSalesData = async (period, startDate, endDate) => {
  const response = await fetch(`/api/sales?period=${period}&start=${startDate}&end=${endDate}`);
  return response.json();
};
```

## Sample Data

Sample data includes:
- 30 days of sales history (Jan 27 - Feb 26, 2026)
- 8 cake varieties with varying performance
- Realistic sales patterns including a Valentine's Day spike
- Different trend patterns (up, down, stable)

## Customization

### Adding New Cakes to Top Selling Chart
Edit `manager-sales-data.js` and add to `topSellingCakesData`:
```javascript
{
  id: 9,
  name: 'New Cake',
  sales: 1500,
  volume: 30,
  revenue: 4500.00,
  trend: 'up'
}
```

### Changing Chart Colors
Modify the `COLORS` array in `sales-overview.jsx`:
```javascript
const COLORS = ['#f3071d', '#f7dd30', '#20a35b', ...];
```

### Adjusting Time Periods
Edit `getSalesDataByPeriod()` in `manager-sales-data.js` to add new periods.

## Performance Considerations

1. **Data Caching**: For large datasets, implement caching to avoid repeated API calls
2. **Data Pagination**: If showing many cakes, implement pagination in the table
3. **Lazy Loading**: Load charts only when the section comes into view
4. **Memoization**: Uses `useMemo` to prevent unnecessary recalculations

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- **react**: UI framework
- **recharts**: Charting library (40+ packages included as dependencies)
- **lucide-react**: Icon library for trend indicators

## Future Enhancements

- Real-time data updates using WebSockets
- Export data as PDF/CSV
- Advanced filtering by cake category
- Comparison mode (compare two time periods)
- Predictive analytics for demand forecasting
- Email-based report scheduling
- Dark mode support

## Troubleshooting

**Issue: Charts not displaying**
- Ensure Recharts is installed: `npm install recharts`
- Check browser console for errors
- Verify data format matches expected structure

**Issue: Date picker not working**
- Ensure date inputs have correct format (YYYY-MM-DD)
- Check browser date input support

**Issue: Metrics showing incorrect values**
- Clear browser cache
- Verify sample data is loaded correctly
- Check calculation logic in useMemo hooks

## Support

For issues or questions about the Sales Overview implementation, refer to:
- Recharts documentation: https://recharts.org
- React documentation: https://react.dev
- Project README files in the workspace
