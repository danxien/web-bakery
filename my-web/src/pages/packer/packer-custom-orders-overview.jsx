import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

const PER_PAGE = 6;

const toDateObject = (value) => {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toDateObject(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const parsePickup = (pickup) => {
  if (!pickup) return { pickupDate: '-', pickupTime: '-' };
  const parts = pickup.split(' ');
  if (parts.length <= 1) return { pickupDate: pickup, pickupTime: '-' };
  return {
    pickupDate: parts[0],
    pickupTime: parts.slice(1).join(' '),
  };
};

const isOverdue = (row) => {
  if (row.status !== 'Ready') return false;
  const pickupDate = toDateObject(row.pickupDate);
  if (!pickupDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return pickupDate < today;
};

const statusPillClass = (status) => {
  const map = {
    Pending: 'pending',
    Ready: 'ready',
    'Picked Up': 'picked-up',
    Cancelled: 'cancelled',
    Overdue: 'overdue',
  };
  return map[status] || 'pending';
};

const getActionLabel = (status) => {
  if (status === 'Pending') return 'Mark Ready';
  if (status === 'Ready' || status === 'Overdue') return 'Mark Picked Up';
  return 'Completed';
};

const isActionDisabled = (status) => status === 'Picked Up' || status === 'Cancelled';

const canCancel = (status) => status === 'Pending' || status === 'Ready' || status === 'Overdue';

export default function CustomOrdersOverview({
  customOrderItems,
  onAdvanceStatus,
  onCancelStatus,
  onOpenCustomOrderModal,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const mappedRows = useMemo(
    () =>
      customOrderItems.map((row, sourceIndex) => {
        const { pickupDate, pickupTime } = parsePickup(row.pickup || row.pickupDate || '-');
        const computedStatus = isOverdue({ ...row, pickupDate }) ? 'Overdue' : row.status;
        return {
          ...row,
          sourceIndex,
          pickupDate,
          pickupTime,
          computedStatus,
        };
      }),
    [customOrderItems]
  );

  const filteredData = useMemo(() => {
    let rows = mappedRows;
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        row.cake.toLowerCase().includes(needle) ||
        String(row.qty || '').includes(needle) ||
        String(row.price || '').includes(needle) ||
        String(row.pickupDate || '').includes(needle)
      );
    }
    return rows;
  }, [mappedRows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="pkco-page-container">
      <header className="pkco-header">
        <div>
          <h1 className="pkco-title">Custom Orders</h1>
          <p className="pkco-subtitle">Monitor all custom cake orders and production status</p>
        </div>
      </header>

      <section className="pkco-table-container">
        <div className="pkco-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="pkco-table-section-title">Custom Orders List</span>
            <span className="pkco-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="pkco-toolbar-actions">
            <input
              type="text"
              className="pkco-search-input"
              placeholder="Search custom orders..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="button" className="pkco-add-btn" onClick={() => onOpenCustomOrderModal?.()}>
              <Plus size={14} /> Add Order
            </button>
          </div>
        </div>

        <div className="pkco-table-scroll-wrapper">
          <table className="pkco-orders-table">
            <thead>
              <tr>
                <th>Custom Cake</th>
                <th>Customer Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Pick-Up Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((row, index) => (
                  <tr key={`${row.cake}-${row.pickupDate}-${index}`}>
                    <td>
                      <span className="pkco-cake-name-text">
                        {row.cake}
                        <span className="pkco-order-type custom">Custom</span>
                      </span>
                    </td>
                    <td>{row.customer || 'Walk-in Customer'}</td>
                    <td>{row.qty}</td>
                    <td>
                      <span className="pkco-price-text">P{Number(row.price || 0).toLocaleString()}</span>
                    </td>
                    <td>
                      <span className="pkco-date-text">{formatDate(row.pickupDate)}</span>
                    </td>
                    <td>
                      <span className={`pkco-status-pill ${statusPillClass(row.computedStatus)}`}>
                        {row.computedStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`pkco-status-action-btn ${isActionDisabled(row.computedStatus) ? 'disabled' : ''}`}
                        onClick={() => onAdvanceStatus?.(row.sourceIndex)}
                        disabled={isActionDisabled(row.computedStatus)}
                      >
                        {getActionLabel(row.computedStatus)}
                      </button>
                      {canCancel(row.computedStatus) && (
                        <button
                          type="button"
                          className="pkco-cancel-btn"
                          onClick={() => onCancelStatus?.(row.sourceIndex)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="pkco-no-data">
                    No custom orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pkco-pagination">
          <span className="pkco-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="pkco-pagination-btns">
            <button className="pkco-page-btn" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} type="button">
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pkco-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              className="pkco-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              type="button"
            >
              {'>'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
