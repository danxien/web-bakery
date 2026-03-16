import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Calendar, ChevronDown, X } from 'lucide-react';
import '../../styles/seller/seller-sales.css';

// ── Date helpers ──
const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const STATUS_OPTIONS = [
  { key: 'all',              label: 'All' },
  { key: 'Pending',          label: 'Pending' },
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered',        label: 'Delivered' },
  { key: 'Overdue',          label: 'Overdue' },
  { key: 'Cancelled',        label: 'Cancelled' },
];

const PER_PAGE = 10;

function getDateRange(filter, customStart, customEnd) {
  const start = new Date(TODAY);
  const end   = new Date(TODAY);
  switch (filter) {
    case 'today': return { start: TODAY_STR, end: TODAY_STR };
    case 'week': {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(end.getDate() + (6 - day));
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    }
    case 'month': return {
      start: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString().split('T')[0],
      end:   new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).toISOString().split('T')[0],
    };
    case 'custom': return { start: customStart || TODAY_STR, end: customEnd || TODAY_STR };
    default: return { start: TODAY_STR, end: TODAY_STR };
  }
}

function toISO(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function inRange(dateStr, start, end) {
  const iso = toISO(dateStr);
  return iso >= start && iso <= end;
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const STATUS_BADGE_CLASS = {
  'Pending':          'custom-status-pending',
  'Out for Delivery': 'custom-status-out-for-delivery',
  'Delivered':        'custom-status-delivered',
  'Overdue':          'custom-status-overdue',
  'Cancelled':        'custom-status-cancelled',
};

// ─────────────────────────────────────────────────

const SellerCustom = ({ customOrders = [], onDelete }) => {
  const [dateFilter,     setDateFilter]     = useState('today');
  const [customStart,    setCustomStart]    = useState('');
  const [customEnd,      setCustomEnd]      = useState('');
  const [dateDropOpen,   setDateDropOpen]   = useState(false);
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [viewingNote,    setViewingNote]    = useState(null);
  const [page,           setPage]           = useState(1);

  const dateDropRef   = useRef(null);
  const statusDropRef = useRef(null);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd)
      return `${formatDate(customStart)} – ${formatDate(customEnd)}`;
    return DATE_OPTIONS.find(o => o.key === dateFilter)?.label || 'Today';
  }, [dateFilter, customStart, customEnd]);

  const statusLabel = useMemo(() =>
    STATUS_OPTIONS.find(o => o.key === statusFilter)?.label || 'All',
    [statusFilter]
  );

  const filtered = useMemo(() =>
    customOrders.filter(o => {
      const inDate   = inRange(o.date, rangeStart, rangeEnd);
      const inStatus = statusFilter === 'all' || (o.status || 'Pending') === statusFilter;
      return inDate && inStatus;
    }),
    [customOrders, rangeStart, rangeEnd, statusFilter]
  );

  // ── Reset to page 1 whenever filters change ──
  useEffect(() => { setPage(1); }, [dateFilter, customStart, customEnd, statusFilter]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    const handler = e => {
      if (dateDropRef.current   && !dateDropRef.current.contains(e.target))   setDateDropOpen(false);
      if (statusDropRef.current && !statusDropRef.current.contains(e.target)) setStatusDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <div>
          <h1 className="seller-sales-title">Custom Orders</h1>
          <p className="seller-sales-subtitle">Special cake orders</p>
        </div>

        {/* ── Date Filter Dropdown ── */}
        <div className="inv-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`inv-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
          >
            <Calendar size={16} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="inv-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`inv-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => { setDateFilter(opt.key); if (opt.key !== 'custom') setDateDropOpen(false); }}
                >
                  {opt.label}
                </button>
              ))}
              <div className="inv-custom-range-section">
                <span className="inv-custom-range-title">Custom Range</span>
                <label className="inv-custom-label">From</label>
                <input type="date" className="inv-date-input" value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }} />
                <label className="inv-custom-label">To</label>
                <input type="date" className="inv-date-input" value={customEnd} min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }} />
                <button
                  className="inv-apply-btn"
                  onClick={() => { if (customStart && customEnd) setDateDropOpen(false); }}
                  disabled={!customStart || !customEnd}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="seller-table-container">
        <table className="seller-sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Delivery Date</th>
              <th>Cake Type</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Customer Details</th>
              <th>Special Instructions</th>
              <th>
                <div className="seller-th-filter-wrapper" ref={statusDropRef}>
                  <button
                    className={`seller-th-filter-btn ${statusDropOpen ? 'open' : ''}`}
                    onClick={() => setStatusDropOpen(p => !p)}
                  >
                    <span>{statusFilter === 'all' ? 'Status' : statusLabel}</span>
                    <ChevronDown size={12} />
                  </button>
                  {statusDropOpen && (
                    <div className="seller-th-dropdown">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.key}
                          className={`seller-th-dropdown-item ${statusFilter === opt.key ? 'selected' : ''}`}
                          onClick={() => { setStatusFilter(opt.key); setStatusDropOpen(false); }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan="9" className="seller-empty-row">No custom orders recorded yet.</td>
              </tr>
            ) : (
              paged.map((order) => (
                <tr key={order.id}>
                  <td>{order.date}</td>
                  <td>{order.deliveryDate || '—'}</td>
                  <td>{order.cakeType}</td>
                  <td>{order.qty}</td>
                  <td>₱{order.amount.toLocaleString()}</td>
                  <td>
                    <div className="custom-customer-details">
                      <span className="custom-customer-name">{order.customer || '—'}</span>
                      <span className="custom-customer-contact">{order.contactNo || '—'}</span>
                      <span className="custom-customer-address">{order.address || '—'}</span>
                    </div>
                  </td>
                  <td>
                    {order.instructions
                      ? <button className="seller-view-note-btn" onClick={() => setViewingNote(order.instructions)}>View</button>
                      : <span className="seller-no-note">—</span>
                    }
                  </td>
                  <td>
                    <span className={`custom-order-status-badge ${STATUS_BADGE_CLASS[order.status || 'Pending']}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button className="seller-delete-btn" onClick={() => onDelete(order.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        <div className="si-pagination">
          <span className="si-pagination-info">
            {filtered.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="si-pagination-btns">
            <button className="si-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`si-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="si-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>

      {/* ── Special Instructions Modal ── */}
      {viewingNote && (
        <div className="seller-note-overlay" onClick={() => setViewingNote(null)}>
          <div className="seller-note-modal" onClick={e => e.stopPropagation()}>
            <div className="seller-note-modal-header">
              <h3>Special Instructions</h3>
              <button className="seller-note-close-btn" onClick={() => setViewingNote(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="seller-note-modal-body">{viewingNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCustom;