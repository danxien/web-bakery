import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getSalesDataByPeriod, topSellingCakesData, getDateRange } from './manager-sales-data';
import '../../styles/manager/sales-overview.css';

const SalesOverview = () => {
  const [timePeriod, setTimePeriod] = useState('thisMonth');
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [showPieChart, setShowPieChart] = useState(false); // Toggle between bar and pie for cakes
  const [customDateStart, setCustomDateStart] = useState('2026-02-19');
  const [customDateEnd, setCustomDateEnd] = useState('2026-02-26');

  // Get sales data based on selected period
  const salesData = useMemo(() => {
    if (timePeriod === 'custom') {
      return getDateRange(customDateStart, customDateEnd);
    }
    return getSalesDataByPeriod(timePeriod);
  }, [timePeriod, customDateStart, customDateEnd]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
    const avgOrder = totalSales / totalOrders;
    const maxSale = Math.max(...salesData.map(item => item.sales));

    return {
      totalSales: totalSales.toFixed(2),
      totalOrders,
      avgOrder: avgOrder.toFixed(2),
      maxSale
    };
  }, [salesData]);

  const topCakesMetrics = useMemo(() => {
    const totalCakeSales = topSellingCakesData.reduce((sum, cake) => sum + cake.sales, 0);
    const totalRevenue = topSellingCakesData.reduce((sum, cake) => sum + cake.revenue, 0);
    
    return {
      totalCakeSales,
      totalRevenue: totalRevenue.toFixed(2),
      topCake: topSellingCakesData[0]
    };
  }, []);

  // Colors for pie chart
  const COLORS = ['#f3071d', '#f7dd30', '#20a35b', '#b88700', '#111111', '#666666', '#d33939', '#666666'];
  const CHART_COLORS = ['#f3071d', '#f7dd30', '#20a35b'];

  const handlePeriodChange = (period) => {
    setTimePeriod(period);
  };

  return (
    <div className="sales-overview-container">
      {/* Header */}
      <div className="sales-overview-header">
        <h1>Sales Overview</h1>
        <p className="subtitle">Track sales trends and identify top-performing products</p>
      </div>

      {/* Quick Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Sales</div>
          <div className="metric-value">₱{metrics.totalSales}</div>
          <div className="metric-info">{metrics.totalOrders} orders</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Average Order</div>
          <div className="metric-value">₱{metrics.avgOrder}</div>
          <div className="metric-info">Per order</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Peak Sale</div>
          <div className="metric-value">₱{metrics.maxSale}</div>
          <div className="metric-info">Highest transaction</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Top Cake</div>
          <div className="metric-value">{topCakesMetrics.topCake.name}</div>
          <div className="metric-info">₱{topCakesMetrics.topCake.revenue.toFixed(2)} revenue</div>
        </div>
      </div>

      {/* Sales Trend Section */}
      <div className="chart-section">
        <div className="chart-header">
          <div>
            <h2>Sales Trend</h2>
            <p>Revenue and order patterns over time</p>
          </div>

          {/* Time Period Selector */}
          <div className="controls-group">
            <div className="period-buttons">
              <button
                className={`period-btn ${timePeriod === 'today' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('today')}
              >
                Today
              </button>
              <button
                className={`period-btn ${timePeriod === 'thisWeek' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('thisWeek')}
              >
                This Week
              </button>
              <button
                className={`period-btn ${timePeriod === 'thisMonth' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('thisMonth')}
              >
                This Month
              </button>
              <button
                className={`period-btn ${timePeriod === 'custom' ? 'active' : ''}`}
                onClick={() => handlePeriodChange('custom')}
              >
                Custom
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="chart-type-toggle">
              <button
                className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                ═══
              </button>
              <button
                className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                ▨▨▨
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range (shown when custom is selected) */}
        {timePeriod === 'custom' && (
          <div className="custom-date-range">
            <label>
              From:
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
              />
            </label>
            <label>
              To:
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
              />
            </label>
          </div>
        )}

        {/* Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'line' ? (
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fcf6c4',
                    border: '1px solid #d2ccaa',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value) => `₱${value}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#f3071d"
                  strokeWidth={3}
                  dot={{ fill: '#f3071d', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue (₱)"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#20a35b"
                  strokeWidth={2}
                  dot={{ fill: '#20a35b', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Orders"
                  yAxisId="right"
                />
              </LineChart>
            ) : (
              <BarChart data={salesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666666" />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fcf6c4',
                    border: '1px solid #d2ccaa',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value) => `₱${value}`}
                />
                <Legend />
                <Bar dataKey="sales" fill="#f3071d" name="Revenue (₱)" />
                <Bar dataKey="orders" fill="#20a35b" name="Orders" yAxisId="right" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Selling Cakes Section */}
      <div className="chart-section">
        <div className="chart-header">
          <div>
            <h2>Top Selling Cakes</h2>
            <p>Products with highest sales volume and revenue</p>
          </div>

          {/* Cake Chart Type Toggle */}
          <div className="chart-type-toggle">
            <button
              className={`toggle-btn ${!showPieChart ? 'active' : ''}`}
              onClick={() => setShowPieChart(false)}
              title="Bar Chart"
            >
              ▨▨▨
            </button>
            <button
              className={`toggle-btn ${showPieChart ? 'active' : ''}`}
              onClick={() => setShowPieChart(true)}
              title="Pie Chart"
            >
              ◐◑
            </button>
          </div>
        </div>

        <div className="chart-container">
          {!showPieChart ? (
            // Bar Chart for Top Cakes
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={topSellingCakesData}
                margin={{ top: 5, right: 30, left: 0, bottom: 150 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={150}
                  stroke="#666666"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#666666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fcf6c4',
                    border: '1px solid #d2ccaa',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value) => `${value} units`}
                />
                <Legend />
                <Bar dataKey="volume" fill="#f3071d" name="Units Sold" />
                <Bar dataKey="sales" fill="#20a35b" name="Sales Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            // Pie Chart for Top Cakes
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={topSellingCakesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, volume }) => `${name}: ${volume}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="volume"
                >
                  {topSellingCakesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} units`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cake Details Table */}
        <div className="cakes-table-wrapper">
          <table className="cakes-table">
            <thead>
              <tr>
                <th>Cake Name</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Avg Price</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {topSellingCakesData.map((cake) => (
                <tr key={cake.id}>
                  <td className="cake-name">{cake.name}</td>
                  <td>{cake.volume}</td>
                  <td>₱{cake.revenue.toFixed(2)}</td>
                  <td>₱{(cake.revenue / cake.volume).toFixed(2)}</td>
                  <td className="trend-cell">
                    <span className={`trend-badge ${cake.trend}`}>
                      {cake.trend === 'up' && <TrendingUp size={16} />}
                      {cake.trend === 'down' && <TrendingDown size={16} />}
                      {cake.trend === 'stable' && <span>—</span>}
                      {cake.trend.charAt(0).toUpperCase() + cake.trend.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card attention">
            <h4>Top Performer</h4>
            <p>
              <strong>{topCakesMetrics.topCake.name}</strong> is leading with{' '}
              <strong>₱{topCakesMetrics.topCake.revenue.toFixed(2)}</strong> in revenue.
            </p>
            <span className="recommendation">Action: Increase stock levels</span>
          </div>
          <div className="insight-card">
            <h4>Underperformers</h4>
            <p>
              <strong>Lemon Drizzle</strong> and <strong>Carrot Cake</strong> show declining trends.
            </p>
            <span className="recommendation">Action: Plan promotional campaigns</span>
          </div>
          <div className="insight-card">
            <h4>Revenue Growth</h4>
            <p>
              Total monthly revenue: <strong>₱{topCakesMetrics.totalRevenue}</strong> across{' '}
              <strong>{topCakesMetrics.totalCakeSales}</strong> sales.
            </p>
            <span className="recommendation">Action: Focus on high-margin items</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesOverview;
