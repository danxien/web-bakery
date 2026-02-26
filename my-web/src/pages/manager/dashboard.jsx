import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Phone } from 'lucide-react';
import '../../styles/manager/dashboard.css';

// Sales data by month
const salesDataByMonth = {
  'This Month': [
    { date: '1', sales: 8000 },
    { date: '5', sales: 12000 },
    { date: '10', sales: 18000 },
    { date: '15', sales: 22000 },
    { date: '20', sales: 26000 },
    { date: '25', sales: 30000 },
    { date: '30', sales: 35000 }
  ],
  'Last Month': [
    { date: '1', sales: 7000 },
    { date: '5', sales: 9000 },
    { date: '10', sales: 15000 },
    { date: '15', sales: 19000 },
    { date: '20', sales: 23000 },
    { date: '25', sales: 27000 },
    { date: '30', sales: 31000 }
  ],
  '2 Months Ago': [
    { date: '1', sales: 6000 },
    { date: '5', sales: 8000 },
    { date: '10', sales: 12000 },
    { date: '15', sales: 16000 },
    { date: '20', sales: 20000 },
    { date: '25', sales: 24000 },
    { date: '30', sales: 28000 }
  ]
};

// Orders data
const ordersList = [
  {
    id: 'order-1',
    bakery: 'Lacara St.',
    item: '2x Muffins, 1 cup cake',
    value: 35,
    eta: '15:00',
    contact: '0917-123-4567',
    status: 'Ongoing'
  },
  {
    id: 'order-2',
    bakery: 'Madrid Av.',
    item: '10x Chocolate biscuit',
    value: 25,
    eta: '1:00',
    contact: '0917-234-5678',
    status: 'Delivery'
  },
  {
    id: 'order-3',
    bakery: 'Paraiso St.',
    item: '2x Donuts, 2x choco cake',
    value: 17,
    eta: '3:00',
    contact: '0917-345-6789',
    status: 'Delivery'
  },
  {
    id: 'order-4',
    bakery: 'Paraiso St.',
    item: '3x Sugar sensation',
    value: 12,
    eta: '7:00',
    contact: '0917-456-7890',
    status: 'Ongoing'
  },
  {
    id: 'order-5',
    bakery: 'Lacara St.',
    item: '2x Frappuccino, 2x muffin',
    value: 23,
    eta: '5:00',
    contact: '0917-567-8901',
    status: 'Delivery'
  }
];

// Riders data
const ridersList = [
  {
    id: 'rider-1',
    name: 'Diana Smith',
    contact: '0917-111-2222',
    deliveries: 3,
    status: 'Delivering'
  },
  {
    id: 'rider-2',
    name: 'Allan Miller',
    contact: '0917-333-4444',
    deliveries: 4,
    status: 'Delivering'
  },
  {
    id: 'rider-3',
    name: 'Tony Brown',
    contact: '0917-555-6666',
    deliveries: 0,
    status: 'On break'
  }
];

export default function Dashboard() {
  const [month, setMonth] = useState('This Month');

  const salesData = useMemo(() => salesDataByMonth[month], [month]);

  const ongoingCount = ordersList.filter(o => o.status === 'Ongoing').length;
  const deliveryCount = ordersList.filter(o => o.status === 'Delivery').length;
  const totalCount = ordersList.length;

  return (
    <div className="manager-dashboard">
      <div className="dashboard-left">
        {/* Sales Section */}
        <div className="card sales-card">
          <div className="card-header">
            <h2>Sales</h2>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="month-select">
              {Object.keys(salesDataByMonth).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={salesData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px'
                  }}
                  formatter={(value) => `₱${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#20a35b"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="metrics-grid">
            <div className="metric">
              <div className="metric-icon">✓</div>
              <div className="metric-value">₱1,150</div>
              <div className="metric-label">Sales Today</div>
            </div>
            <div className="metric">
              <div className="metric-icon">✓</div>
              <div className="metric-value">₱30,350</div>
              <div className="metric-label">Sales This Month</div>
            </div>
            <div className="metric">
              <div className="metric-icon">✓</div>
              <div className="metric-value">₱315,750</div>
              <div className="metric-label">Sales This Year</div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="card orders-card">
          <h3>Orders</h3>
          <div className="order-stats">
            <div className="stat">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{ongoingCount}</div>
              <div className="stat-label">Ongoing</div>
            </div>
            <div className="stat">
              <div className="stat-icon">🚚</div>
              <div className="stat-value">{deliveryCount}</div>
              <div className="stat-label">Delivery</div>
            </div>
            <div className="stat">
              <div className="stat-icon">✓</div>
              <div className="stat-value">{totalCount}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>

          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Bakery</th>
                  <th>Order</th>
                  <th>Order ID</th>
                  <th>Value</th>
                  <th>ETA</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map(order => (
                  <tr key={order.id} className={`order-${order.status.toLowerCase().replace(' ', '-')}`}>
                    <td>{order.bakery}</td>
                    <td className="order-item">{order.item}</td>
                    <td className="order-id">A2389</td>
                    <td>₱{order.value}</td>
                    <td>{order.eta}</td>
                    <td>
                      <a href={`tel:${order.contact}`} className="contact-link">
                        <Phone size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dashboard-right">
        {/* Current Offer Section */}
        <div className="card offer-card">
          <h3>Current offer</h3>
          <div className="offer-content">
            <img
              src="https://via.placeholder.com/120?text=Chocolate+Cake"
              alt="Chocolate Cake"
              className="offer-image"
            />
            <p className="offer-text">
              We have <strong>3x2</strong> in our entire <strong>cookie section</strong> <strong>sweeten you day!</strong>
            </p>
            <button className="btn-manage">
              ✓ Manage offers
            </button>
          </div>
        </div>

        {/* Riders Section */}
        <div className="card riders-card">
          <div className="riders-header">
            <h3>Riders</h3>
            <a href="#" className="see-all">See all →</a>
          </div>
          <ul className="riders-list">
            {ridersList.map(rider => (
              <li key={rider.id} className="rider-item">
                <div className="rider-avatar">👤</div>
                <div className="rider-info">
                  <strong>{rider.name}</strong>
                  <span className="rider-status">{rider.deliveries} orders being delivered</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Expand Map Section */}
        <div className="card map-card">
          <div className="map-content">
            <div className="map-placeholder">📍</div>
            <p>Expand map →</p>
          </div>
        </div>
      </div>
    </div>
  );
}
