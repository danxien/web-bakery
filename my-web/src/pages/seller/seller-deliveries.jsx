import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Layers, Package } from 'lucide-react';
import todayDeliveries from './deliveryData';
import '../../styles/seller/seller-sales.css';
import '../../styles/seller/seller-deliveries.css';

// ── Date helpers ──
const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
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

// ─── Component ────────────────────────────────────────────────────────────────
const SellerDeliveries = () => {
  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const [page,         setPage]         = useState(1);
  const dateDropRef = useRef(null);

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd)
      return `${formatDate(customStart)} – ${formatDate(customEnd)}`;
    return DATE_OPTIONS.find(o => o.key === dateFilter)?.label || 'Today';
  }, [dateFilter, customStart, customEnd]);

  const filtered = useMemo(
    () => todayDeliveries.filter(d => inRange(d.delivered, rangeStart, rangeEnd)),
    [rangeStart, rangeEnd]
  );

  // ── Stat calculations ──
  const typesOfCakes = useMemo(
    () => new Set(filtered.map(d => d.cakeType)).size,
    [filtered]
  );

  const totalCakes = useMemo(
    () => filtered.reduce((sum, d) => sum + (d.qty || 0), 0),
    [filtered]
  );

  // ── Reset to page 1 whenever filter changes ──
  useEffect(() => { setPage(1); }, [dateFilter, customStart, customEnd]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    const handler = e => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="seller-sales-container">

      {/* ── Header + Date Filter ── */}
      <div className="seller-sales-header">
        <div>
          <h1 className="seller-sales-title">Deliveries</h1>
          <p className="seller-sales-subtitle">All delivery details</p>
        </div>

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

      {/* ── Stat Tiles ── */}
      <div className="sd-metrics-row">
        <div className="sd-metric-card">
          <div className="sd-card-top">
            <span className="sd-metric-label">Types of Cakes Delivered</span>
            <Layers size={20} className="sd-blue-icon" />
          </div>
          <div className="sd-card-bottom">
            <span className="sd-metric-value">{typesOfCakes}</span>
            <span className="sd-metric-subtext">Unique cake types</span>
          </div>
        </div>

        <div className="sd-metric-card">
          <div className="sd-card-top">
            <span className="sd-metric-label">Total Cakes Delivered</span>
            <Package size={20} className="sd-green-icon" />
          </div>
          <div className="sd-card-bottom">
            <span className="sd-metric-value">{totalCakes}</span>
            <span className="sd-metric-subtext">Cakes received into stock</span>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="seller-table-container">
        <table className="seller-sales-table">
          <thead>
            <tr>
              <th>Delivery Date</th>
              <th>Cake Type</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {paged.length > 0 ? (
              paged.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.delivered}</td>
                  <td>{delivery.cakeType}</td>
                  <td style={{ fontWeight: 'bold' }}>{delivery.qty}</td>
                  <td>{delivery.expires}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="seller-empty-row">No deliveries found for this period.</td>
              </tr>
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

    </div>
  );
};

export default SellerDeliveries;