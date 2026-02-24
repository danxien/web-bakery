import React, { useMemo, useState } from 'react';

export default function InventoryOverview({
  stockItems,
  getBadgeClass,
  stockAddForm,
  onChangeStockAdd,
  onAddStock,
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
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.length === 0 && (
              <tr>
                <td colSpan={5}>No matching inventory rows</td>
              </tr>
            )}
            {filteredStockItems.map((item) => (
              <tr key={`${item.branch}-inv-${item.cake}`}>
                <td>{item.cake}</td>
                <td>PHP {item.price}</td>
                <td>{item.qty}</td>
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
  );
}
