import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Trash2, Calendar, ChevronDown } from 'lucide-react';
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
  { key: 'all',           label: 'All' },
  { key: 'Pending',       label: 'Pending' },
  { key: 'Ready',         label: 'Ready' },
  { key: 'Overdue',       label: 'Overdue' },
  { key: 'Picked Up',     label: 'Picked Up' },
  { key: 'Not Picked Up', label: 'Not Picked Up' },
];

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
// ─────────────────────────────────────────────────

const SellerReservations = ({ reservations = [], onUpdateStatus = () => {}, onDelete = () => {} }) => {
  const [dateFilter,    setDateFilter]    = useState('today');
  const [customStart,   setCustomStart]   = useState('');
  const [customEnd,     setCustomEnd]     = useState('');
  const [dateDropOpen,  setDateDropOpen]  = useState(false);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [statusDropOpen, setStatusDropOpen] = useState(false);

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
    reservations.filter(r => {
      const inDate   = inRange(r.date, rangeStart, rangeEnd);
      const inStatus = statusFilter === 'all' || (r.status || 'Pending') === statusFilter;
      return inDate && inStatus;
    }),
    [reservations, rangeStart, rangeEnd, statusFilter]
  );

  useEffect(() => {
    const handler = e => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
      if (statusDropRef.current && !statusDropRef.current.contains(e.target))
        setStatusDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <div>
          <h1 className="seller-sales-title">Reservations</h1>
          <p className="seller-sales-subtitle">Customer cake reservations</p>
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
              <th>Reserved Date</th>
              <th>Pickup Date</th>
              <th>Cake Type</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>
                {/* ── Status Filter in Header ── */}
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
              <th>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((res) => (
                <tr key={res.id}>
                  <td>{res.date}</td>
                  <td>{res.pickupDate}</td>
                  <td>{res.cakeType}</td>
                  <td>{res.customer}</td>
                  <td>{res.qty}</td>
                  <td>₱{res.amount.toLocaleString()}</td>
                  <td>
                    <span className={`seller-status-badge ${res.status?.toLowerCase().replace(/\s/g, '-') || 'pending'}`}>
                      {res.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {res.isCompleted ? (
                      <span className="seller-completed-text">Completed</span>
                    ) : (
                      <div className="seller-action-buttons-group">
                        <button className="seller-btn-picked-up" onClick={() => onUpdateStatus(res.id, 'Picked Up')}>
                          Picked Up
                        </button>
                        <button className="seller-btn-not-picked-up" onClick={() => onUpdateStatus(res.id, 'Not Picked Up')}>
                          Not Picked Up
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="seller-delete-btn" onClick={() => onDelete(res.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="seller-empty-row">No reservations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerReservations;