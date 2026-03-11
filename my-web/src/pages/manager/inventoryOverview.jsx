// =============================================================
// InventoryOverview.jsx
// PURPOSE: Displays inventory stock levels, expiry status,
//          and a filterable table.
// FILTERING: Date Filter (header icon) + Status Cards (clickable)
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Package, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/inventoryOverview.css';

// TODO: Backend - Replace with: const TODAY = new Date(); const TODAY_STR = TODAY.toISOString().split('T')[0];
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

/* ── Date Range Helpers ────────────────────────────────────── */

function getDateRange(filter, customStart, customEnd) {
  const start = new Date(TODAY);
  const end   = new Date(TODAY);

  switch (filter) {
    case 'today':
      return { start: TODAY_STR, end: TODAY_STR };

    case 'week': {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(end.getDate() + (6 - day));
      return {
        start: start.toISOString().split('T')[0],
        end:   end.toISOString().split('T')[0],
      };
    }

    case 'month':
      return {
        start: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString().split('T')[0],
        end:   new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).toISOString().split('T')[0],
      };

    case 'custom':
      return { start: customStart || TODAY_STR, end: customEnd || TODAY_STR };

    default:
      return { start: TODAY_STR, end: TODAY_STR };
  }
}

function inRange(date, start, end) {
  return date >= start && date <= end;
}

/* ── Constants ─────────────────────────────────────────────── */

const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

// TODO: Backend - Fetch this threshold value from API or config (per-cake-type)
const LOW_STOCK_THRESHOLD = 5;
const PER_PAGE = 6;

const STATUS_CARDS = [
  { key: 'Fresh',       label: 'Fresh' },
  { key: 'Near Expiry', label: 'Near Expiry' },
  { key: 'Expired',     label: 'Expired' },
  { key: 'Low Stock',   label: 'Low Stock' },
];

/* ── Misc Helpers ──────────────────────────────────────────── */

/**
 * System-calculated status — never set manually.
 * Fresh:       more than 2 days before expiry
 * Near Expiry: 1–2 days before expiry
 * Expired:     today > expiry date
 */
function computeStatus(expiryStr) {
  const expiry   = new Date(expiryStr + 'T00:00:00');
  const diffDays = Math.floor((expiry - TODAY) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'Expired';
  if (diffDays <= 2) return 'Near Expiry';
  return 'Fresh';
}

function isLowStock(item) {
  return item.qty <= LOW_STOCK_THRESHOLD && item.status !== 'Expired';
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const InventoryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched inventory data
  // Expected shape per item:
  // {
  //   name:   string  — cake product name
  //   qty:    number  — current quantity in stock for this batch
  //   price:  number  — unit selling price (₱)
  //   made:   string  — production date (YYYY-MM-DD)
  //   expiry: string  — expiry date (YYYY-MM-DD)
  //   // NOTE: status is computed from expiry, not stored on backend
  // }
  // Multiple rows with the same name = multiple batches (FIFO)
  // -----------------------------------------------------------
  const [inventoryData, setInventoryData] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [page,         setPage]         = useState(1);


  // -----------------------------------------------------------
  // DATE RANGE
  // -----------------------------------------------------------
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd)
      return `${formatDate(customStart)} – ${formatDate(customEnd)}`;
    return DATE_OPTIONS.find(o => o.key === dateFilter)?.label || 'Today';
  }, [dateFilter, customStart, customEnd]);


  // -----------------------------------------------------------
  // FULL INVENTORY — attach computed status
  // -----------------------------------------------------------
  const fullInventory = useMemo(() =>
    inventoryData.map(item => ({ ...item, status: computeStatus(item.expiry) })),
  [inventoryData]);


  // -----------------------------------------------------------
  // DATE-SCOPED INVENTORY (filter by expiry date)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => fullInventory.filter(item => inRange(item.expiry, rangeStart, rangeEnd)),
    [fullInventory, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS (from dateScoped)
  // -----------------------------------------------------------
  const totalCakeTypes = useMemo(() =>
    new Set(dateScoped.map(i => i.name)).size,
  [dateScoped]);

  const totalCakesInStock = useMemo(() =>
    dateScoped.reduce((sum, i) => sum + i.qty, 0),
  [dateScoped]);


  // -----------------------------------------------------------
  // STATUS CARD COUNTS (from dateScoped)
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => ({
    'Fresh':       dateScoped.filter(i => i.status === 'Fresh').reduce((sum, i) => sum + i.qty, 0),
    'Near Expiry': dateScoped.filter(i => i.status === 'Near Expiry').reduce((sum, i) => sum + i.qty, 0),
    'Expired':     dateScoped.filter(i => i.status === 'Expired').reduce((sum, i) => sum + i.qty, 0),
    'Low Stock':   dateScoped.filter(isLowStock).reduce((sum, i) => sum + i.qty, 0),
  }), [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA (dateScoped + statusFilter)
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!statusFilter)                return dateScoped;
    if (statusFilter === 'Low Stock') return dateScoped.filter(isLowStock);
    return dateScoped.filter(i => i.status === statusFilter);
  }, [dateScoped, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
  function handleDateSelect(key) {
    setDateFilter(key);
    setStatusFilter(null);
    setPage(1);
    if (key !== 'custom') setDateDropOpen(false);
  }

  function handleStatusCard(key) {
    setStatusFilter(prev => prev === key ? null : key);
    setPage(1);
  }

  function applyCustomRange() {
    if (customStart && customEnd) {
      setDateDropOpen(false);
      setPage(1);
    }
  }


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend - Fetch inventory data on mount
    // const fetchInventory = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/inventory');
    //     const data = await response.json();
    //     setInventoryData(data.items);
    //   } catch (err) {
    //     setError('Failed to load inventory data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchInventory();
    setLoading(false);

    const handler = e => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter, dateFilter, customStart, customEnd]);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="inventory-page-container"><p>Loading inventory...</p></div>;
  if (error)   return <div className="inventory-page-container"><p>{error}</p></div>;

  return (
    <div className="inventory-page-container">

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">Inventory Overview</h1>
          <p className="inventory-subtitle">Monitor stock levels and expiry dates</p>
        </div>

        <div className="inv-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`inv-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by date range"
          >
            {/* ✅ Replaced SlidersHorizontal with Calendar icon — sized up to 16px and
                coloured #555 at rest so it's clearly visible on the white button bg.
                The existing CSS already flips fill/stroke to #000 on hover/open. */}
            <Calendar size={16} strokeWidth={2} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="inv-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`inv-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}

              <div className="inv-custom-range-section">
                <span className="inv-custom-range-title">Custom Range</span>
                <label className="inv-custom-label">From</label>
                <input
                  type="date"
                  className="inv-date-input"
                  value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                />
                <label className="inv-custom-label">To</label>
                <input
                  type="date"
                  className="inv-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                />
                <button
                  className="inv-apply-btn"
                  onClick={applyCustomRange}
                  disabled={!customStart || !customEnd}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* =====================================================
          2. METRIC CARDS
          ===================================================== */}
      <div className="metrics-row">

        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cake Types</span>
            <Layers className="card-icon blue-icon" size={20} />
          </div>
          <div className="card-bottom">
            <span className="metric-value">{totalCakeTypes}</span>
            <span className="metric-subtext">Unique cake varieties</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cakes in Stock</span>
            <Package className="card-icon green-icon" size={20} />
          </div>
          <div className="card-bottom">
            <span className="metric-value">{totalCakesInStock}</span>
            <span className="metric-subtext">Units across all batches</span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. STATUS CARDS (Clickable Filters)
          ===================================================== */}
      <div className="inv-status-cards-row">
        {STATUS_CARDS.map(card => (
          <button
            key={card.key}
            className={`inv-status-card inv-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
          >
            <span className="inv-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="inv-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. TABLE
          ===================================================== */}
      <div className="table-container">

        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="table-section-title">Stock List</span>
            <span className="inventory-count-pill">
              {filteredData.length} batch{filteredData.length !== 1 ? 'es' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>
        </div>

        <div className="inventory-table-scroll">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Cake Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Date Produced</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? (
                paged.map((item, idx) => (
                  <tr key={idx} className={item.status === 'Expired' ? 'row-expired' : ''}>
                    <td className="cake-name-text">{item.name}</td>
                    <td className={isLowStock(item) ? 'qty-low' : ''}>{item.qty}</td>
                    <td className="price-text">₱{item.price.toLocaleString()}</td>
                    <td>{formatDate(item.made)}</td>
                    <td className={
                      item.status === 'Expired'     ? 'expiry-overdue' :
                      item.status === 'Near Expiry' ? 'expiry-soon'    : ''
                    }>
                      {formatDate(item.expiry)}
                    </td>
                    <td>
                      <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">No items match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="inventory-pagination">
          <span className="inventory-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="inventory-pagination-btns">
            <button className="inventory-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`inventory-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="inventory-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InventoryOverview;