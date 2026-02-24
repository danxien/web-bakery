import React, { useState } from 'react';
import '../../styles/manager/salesOverview.css';


const SalesOverview = () => {
  // Mock Data - In a real app, this comes from an API
  const [salesData] = useState([
    { id: '101', cake: 'Chocolate Truffle', type: 'Walk-in', qty: 2, price: 50, seller: 'Alice', status: 'Completed', time: '10:30 AM' },
    { id: '102', cake: 'Red Velvet', type: 'Custom', qty: 1, price: 85, seller: 'Bob', status: 'Pending', time: '11:15 AM' },
    { id: '103', cake: 'Vanilla Bean', type: 'Reserved', qty: 3, price: 45, seller: 'Alice', status: 'Cancelled', time: '12:00 PM' },
  ]);

  return (
    <div className="sales-container">
      {/* Header & Export */}
      <header className="sales-header">
        <div>
          <h1>Sales Overview</h1>
          <p>Monitor real-time performance and revenue trends.</p>
        </div>
        <div className="action-buttons">
          <button className="btn-secondary">Export PDF</button>
          <button className="btn-primary">Export Excel</button>
        </div>
      </header>

      {/* 1. Summary Cards */}
      <section className="summary-grid">
        <div className="card border-green">
          <span>Total Revenue</span>
          <h2>$4,250.00</h2>
          <small className="trend-up">↑ 12% from yesterday</small>
        </div>
        <div className="card">
          <span>Cakes Sold</span>
          <h2>142</h2>
          <small>Today's Volume</small>
        </div>
        <div className="card border-yellow">
          <span>Pending Orders</span>
          <h2>8</h2>
          <small>Requires Attention</small>
        </div>
        <div className="card">
          <span>Avg. Sale Value</span>
          <h2>$29.90</h2>
          <small>Per Transaction</small>
        </div>
      </section>

      {/* 2. Filters */}
      <section className="filter-bar">
        <input type="text" placeholder="Search by cake or customer..." className="search-input" />
        <select><option>Today</option><option>This Week</option></select>
        <select><option>All Sellers</option><option>Alice</option><option>Bob</option></select>
        <select><option>All Statuses</option><option>Completed</option><option>Pending</option></select>
      </section>

      {/* 3. Main Sales Table */}
      <div className="table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cake Name</th>
              <th>Order Type</th>
              <th>Qty</th>
              <th>Total Price</th>
              <th>Seller</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {salesData.map((sale) => (
              <tr key={sale.id} className="table-row">
                <td>#{sale.id}</td>
                <td className="font-bold">{sale.cake}</td>
                <td><span className={`type-badge ${sale.type.toLowerCase()}`}>{sale.type}</span></td>
                <td>{sale.qty}</td>
                <td>${sale.price.toFixed(2)}</td>
                <td>{sale.seller}</td>
                <td>
                  <span className={`status-pill ${sale.status.toLowerCase()}`}>
                    {sale.status}
                  </span>
                </td>
                <td>{sale.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesOverview;