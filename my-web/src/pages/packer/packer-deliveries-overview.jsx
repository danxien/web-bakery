import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Filter } from 'lucide-react';

const STATUS_OPTIONS = ['All', 'Pending', 'Out for Delivery', 'Delivered', 'Cancelled', 'Overdue'];
const PER_PAGE = 6;

const toDisplayStatus = (status) => (status === 'In Transit' ? 'Out for Delivery' : status);

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

const isOverdueRow = (row) => {
  const status = toDisplayStatus(row.status);
  if (status === 'Delivered' || status === 'Cancelled') return false;
  const deliveryDate = toDateObject(row.pickupDate);
  if (!deliveryDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deliveryDate < today;
};

const statusPillClass = (status) => {
  const map = {
    Pending: 'pending',
    'Out for Delivery': 'out-for-delivery',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Overdue: 'overdue',
  };
  return map[status] || 'pending';
};

const getActionLabel = (status) => {
  if (status === 'Pending') return 'Mark Out for Delivery';
  if (status === 'Out for Delivery') return 'Mark Delivered';
  if (status === 'Overdue') return 'Mark Delivered';
  return 'Completed';
};

const isActionDisabled = (status) => status === 'Delivered' || status === 'Cancelled';

const canCancel = (status) => status === 'Pending' || status === 'Out for Delivery' || status === 'Overdue';

export default function DeliveriesOverview({ deliveryItems, onAdvanceStatus, onCancelStatus, deliveryWarning }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const mappedRows = useMemo(
    () =>
      deliveryItems.map((row, sourceIndex) => {
        const computedStatus = toDisplayStatus(row.status);
        const isOverdue = isOverdueRow(row);
        return {
          ...row,
          sourceIndex,
          computedStatus: isOverdue ? 'Overdue' : computedStatus,
          totalPrice: Number(row.price || 0) * Number(row.qty || 0),
          deliveryDate: row.pickupDate || row.orderDate || '-',
        };
      }),
    [deliveryItems]
  );

  const filteredData = useMemo(() => {
    if (statusFilter === 'All') return mappedRows;
    return mappedRows.filter((row) => row.computedStatus === statusFilter);
  }, [mappedRows, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  return (
    <section className="pkdo-table-container">
      {deliveryWarning && <div className="pkdo-warning-banner">{deliveryWarning}</div>}

      <div className="pkdo-table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="pkdo-table-section-title">Deliveries List</span>
          <span className="pkdo-table-count-pill">
            {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="pkdo-filter-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`pkdo-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Filter by status"
            type="button"
          >
            <Filter size={14} />
            <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
          </button>

          {dropdownOpen && (
            <div className="pkdo-filter-dropdown">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  className={`pkdo-dropdown-item ${statusFilter === option ? 'selected' : ''}`}
                  onClick={() => {
                    setStatusFilter(option);
                    setDropdownOpen(false);
                  }}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pkdo-table-scroll-wrapper">
        <table className="pkdo-deliveries-table">
          <thead>
            <tr>
              <th>Cake Type</th>
              <th>Qty</th>
              <th>Total Price</th>
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
              paged.map((row, index) => {
                const rowDate = toDateObject(row.deliveryDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = rowDate ? rowDate.getTime() === today.getTime() : false;
                const isOverdue = row.computedStatus === 'Overdue';

                return (
                  <tr key={`${row.branch}-${row.cake}-${row.time}-${index}`}>
                    <td>
                      <span className="pkdo-cake-name-text">{row.cake}</span>
                    </td>
                    <td>{row.qty}</td>
                    <td>
                      <span className="pkdo-price-text">P{row.totalPrice.toLocaleString()}</span>
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
                      <span className={`pkdo-date-text ${isOverdue ? 'is-overdue' : isToday ? 'is-today' : ''}`}>
                        {formatDate(row.deliveryDate)}
                      </span>
                    </td>
                    <td>
                      <span className={`pkdo-status-pill ${statusPillClass(row.computedStatus)}`}>
                        {row.computedStatus}
                      </span>
                      <button
                        type="button"
                        className={`pkdo-status-action-btn ${isActionDisabled(row.computedStatus) ? 'disabled' : ''}`}
                        onClick={() => onAdvanceStatus?.(row.sourceIndex)}
                        disabled={isActionDisabled(row.computedStatus)}
                      >
                        {getActionLabel(row.computedStatus)}
                      </button>
                      {canCancel(row.computedStatus) && (
                        <button
                          type="button"
                          className="pkdo-cancel-btn"
                          onClick={() => onCancelStatus?.(row.sourceIndex)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="pkdo-no-data">
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
  );
}
