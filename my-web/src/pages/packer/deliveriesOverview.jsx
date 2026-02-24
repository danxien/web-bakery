import React, { useMemo, useState } from 'react';

export default function DeliveriesOverview({
  deliveryItems,
  getBadgeClass,
  onAdvanceStatus,
  deliveryWarning,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredItems = useMemo(() => {
    return deliveryItems
      .map((row, index) => ({ ...row, sourceIndex: index }))
      .filter((row) => {
        const normalizedSearch = searchTerm.toLowerCase();
        const buyerName = (row.customer || '').toLowerCase();
        const matchesSearch = row.cake.toLowerCase().includes(normalizedSearch) || buyerName.includes(normalizedSearch);
        const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
  }, [deliveryItems, searchTerm, statusFilter]);

  const getActionLabel = (status) => {
    if (status === 'Pending') return 'Mark In Transit';
    if (status === 'In Transit') return 'Confirm Delivered';
    return 'Completed';
  };

  const isActionDisabled = (status) => status === 'Delivered';

  return (
    <section className="packer-panel-card">
      <h3>Main Branch Deliveries (Today)</h3>
      <p>Track delivery progress for Main Branch only.</p>
      {deliveryWarning && <div className="delivery-warning-banner">{deliveryWarning}</div>}

      <div className="deliveries-toolbar">
        <input
          type="text"
          className="deliveries-search"
          placeholder="Search buyer or cake name"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="deliveries-tabs">
          {['All', 'Pending', 'In Transit', 'Delivered'].map((tab) => (
            <button
              type="button"
              key={tab}
              className={`deliveries-tab-btn ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="packer-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cake Type</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Customer Name</th>
              <th>Special Instructions</th>
              <th>Order Date</th>
              <th>Pick-up Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8}>No matching deliveries</td>
              </tr>
            )}
            {filteredItems.map((row) => (
              <tr key={`${row.branch}-${row.cake}-${row.time}`}>
                <td>{row.cake}</td>
                <td>{row.qty}</td>
                <td>PHP {row.price || 0}</td>
                <td>{row.customer || 'Walk-in Customer'}</td>
                <td>{row.specialInstructions || '-'}</td>
                <td>{row.orderDate || '-'}</td>
                <td>{row.pickupDate || '-'}</td>
                <td>
                  <div className="delivery-status-cell">
                    <span className={`status-chip ${getBadgeClass(row.status)}`}>{row.status}</span>
                    <button
                      type="button"
                      className={`delivery-action-btn ${isActionDisabled(row.status) ? 'disabled' : ''}`}
                      onClick={() => onAdvanceStatus(row.sourceIndex)}
                      disabled={isActionDisabled(row.status)}
                    >
                      {getActionLabel(row.status)}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
