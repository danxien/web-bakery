import React, { useMemo, useState } from 'react';

export default function InventoryOverview({
  stockItems,
  getBadgeClass,
  stockAddForm,
  onChangeStockAdd,
  onAddStock,
  totals,
  deliveryItems,
  customOrders,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const matchesSearch =
        item.cake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.price).includes(searchTerm) ||
        item.expiryDate.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, stockItems]);

  return (
    <>
      <div className="packer-stats-grid">
        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Delivered Today</span>
          </div>
          <h2>{totals?.deliveredToday || 0}</h2>
          <small>Units delivered today</small>
        </article>

        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Revenue Today</span>
          </div>
          <h2>PHP {(totals?.revenueToday || 0).toLocaleString()}</h2>
          <small>Total collected today</small>
        </article>

        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Custom Orders</span>
          </div>
          <h2>{customOrders?.length || 0}</h2>
          <small>Main Branch requests today</small>
        </article>
      </div>

      <section className="packer-panel-card">
        <h3>Inventory (Main Branch)</h3>
        <p>Update stock and expiry details for Main Branch.</p>

        <div className="inventory-add-stock">
        <select
          value={stockAddForm.cake}
          onChange={(event) => onChangeStockAdd('cake', event.target.value)}
          className="inventory-filter"
        >
          {stockItems.map((item) => (
            <option key={`stock-add-${item.cake}`} value={item.cake}>
              {item.cake}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Qty to add"
          value={stockAddForm.qty}
          onChange={(event) => onChangeStockAdd('qty', event.target.value)}
          className="inventory-search inventory-qty-input"
        />
        <input
          type="date"
          placeholder="Made Date"
          value={stockAddForm.madeDate}
          onChange={(event) => onChangeStockAdd('madeDate', event.target.value)}
          className="inventory-search inventory-date-input"
        />
        <div className="time-input-wrapper">
          <input
            type="time"
            placeholder="Time"
            value={stockAddForm.madeTime || ''}
            onChange={(event) => onChangeStockAdd('madeTime', event.target.value)}
            className="inventory-search inventory-time-input"
          />
          <button
            type="button"
            className="time-now-btn"
            onClick={() => {
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              onChangeStockAdd('madeTime', `${hours}:${minutes}`);
            }}
            title="Set to current time"
          >
            Now
          </button>
        </div>
        <input
          type="date"
          placeholder="Expiry Date"
          value={stockAddForm.expiryDate}
          onChange={(event) => onChangeStockAdd('expiryDate', event.target.value)}
          className="inventory-search inventory-date-input"
        />
        <button type="button" className="inventory-add-btn" onClick={onAddStock}>
          Add Stock
        </button>
      </div>

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search cake / price / expiry"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="inventory-search"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="inventory-filter">
          <option value="All">All Status</option>
          <option value="Fresh">Fresh</option>
          <option value="Near Expiry">Near Expiry</option>
        </select>
      </div>

      <div className="packer-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cake</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Made Date</th>
              <th>Time</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.length === 0 && (
              <tr>
                <td colSpan={7}>No matching inventory rows</td>
              </tr>
            )}
            {filteredStockItems.map((item) => (
              <tr key={`${item.branch}-inv-${item.cake}`}>
                <td>{item.cake}</td>
                <td>PHP {item.price}</td>
                <td>{item.qty}</td>
                <td>{item.madeDate}</td>
                <td>{item.time || '-'}</td>
                <td>{item.expiryDate}</td>
                <td>
                  <span className={`status-chip ${getBadgeClass(item.status)}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </>
  );
}
