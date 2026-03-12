import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

const PER_PAGE = 6;

const toDisplayStatus = (status) => {
  if (status === 'Ready') return 'Ready';
  if (status === 'Out for Delivery' || status === 'In Transit') return 'Out for Delivery';
  if (status === 'Pending') return 'Pending';
  return 'Pending';
};

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

const statusPillClass = (status) => {
  const map = {
    Pending: 'pending',
    Ready: 'ready',
    'Out for Delivery': 'out-for-delivery',
  };
  return map[status] || 'pending';
};

const getActionLabel = (status) => {
  if (status === 'Pending') return 'Mark Ready';
  if (status === 'Ready') return 'Mark Out for Delivery';
  return 'Dispatched';
};

const isActionDisabled = (status) => status === 'Out for Delivery';

export default function DeliveriesOverview({
  deliveryItems,
  onAdvanceStatus,
  deliveryWarning,
  onOpenDeliveryModal,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const mappedRows = useMemo(
    () =>
      deliveryItems.map((row, sourceIndex) => ({
        ...row,
        sourceIndex,
        computedStatus: toDisplayStatus(row.status),
        deliveryDate: row.pickupDate || row.orderDate || '-',
      })),
    [deliveryItems]
  );

  const dateScoped = mappedRows;

  const filteredData = useMemo(() => {
    let rows = dateScoped;
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      rows = rows.filter((row) =>
        row.cake.toLowerCase().includes(needle) ||
        (row.customer || '').toLowerCase().includes(needle) ||
        (row.contact || '').toLowerCase().includes(needle) ||
        (row.address || '').toLowerCase().includes(needle)
      );
    }
    return rows;
  }, [dateScoped, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  return (
    <div className="pkdo-page-container">
      <header className="pkdo-header">
        <div>
          <h1 className="pkdo-title">Customer Deliveries</h1>
          <p className="pkdo-subtitle">Monitor all delivery orders, status updates, and packing progress</p>
        </div>
      </header>

      <section className="pkdo-table-container">
        {deliveryWarning && <div className="pkdo-warning-banner">{deliveryWarning}</div>}

        <div className="pkdo-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="pkdo-table-section-title">Deliveries List</span>
            <span className="pkdo-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="pkdo-toolbar-actions">
            <input
              type="text"
              className="pkdo-search-input"
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="button" className="pkdo-add-btn" onClick={onOpenDeliveryModal}>
              <Plus size={14} /> Add Delivery
            </button>
          </div>
        </div>

        <div className="pkdo-table-scroll-wrapper">
          <table className="pkdo-deliveries-table">
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Delivery Address</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((row, index) => (
                  <tr key={`${row.branch}-${row.cake}-${row.time}-${index}`}>
                    <td>
                      <span className="pkdo-cake-name-text">{row.cake}</span>
                    </td>
                    <td>{row.qty}</td>
                    <td>
                      <span className="pkdo-price-text">₱{Number(row.price || 0).toFixed(2)}</span>
                    </td>
                    <td>{row.customer || 'Walk-in Customer'}</td>
                    <td>
                      <span className="pkdo-contact-text">{row.contact || '-'}</span>
                    </td>
                    <td>
                      <span className="pkdo-address-text" title={row.address || '-'}>
                        {row.address || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="pkdo-date-text">{formatDate(row.deliveryDate)}</span>
                    </td>
                    <td>
                      <span className={`pkdo-status-pill ${statusPillClass(row.computedStatus)}`}>
                        {row.computedStatus}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`pkdo-status-action-btn ${isActionDisabled(row.computedStatus) ? 'disabled' : ''}`}
                        onClick={() => onAdvanceStatus?.(row.sourceIndex)}
                        disabled={isActionDisabled(row.computedStatus)}
                      >
                        {getActionLabel(row.computedStatus)}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="pkdo-no-data">
                    No delivery orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pkdo-pagination">
          <span className="pkdo-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="pkdo-pagination-btns">
            <button className="pkdo-page-btn" disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} type="button">
              {'<'}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pkdo-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
                type="button"
              >
                {p}
              </button>
            ))}
            <button
              className="pkdo-page-btn"
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
