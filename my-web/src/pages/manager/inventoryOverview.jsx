// =============================================================
// InventoryOverview.jsx
// PURPOSE: Displays inventory stock levels, expiry status,
//          and a filterable table.
//
// CONNECTION LOGIC (Stock Delivery → Inventory):
//   Inventory is derived live from INIT_DELIVERIES and
//   INVENTORY_STATE exported by deliveriesOverview.jsx.
//
//   On every render the component:
//     1. Starts with any base INVENTORY_STATE records (pre-existing
//        stock seeded from the backend on mount).
//     2. Folds all INIT_DELIVERIES records on top:
//        - Cake Type exists  → add quantity, use delivery expiry date
//        - Cake Type new     → create new record
//     3. Produces a flat array of per-batch inventory rows.
//
//   This means every new Stock Delivery recorded in
//   deliveriesOverview.jsx is instantly reflected here —
//   no separate fetch or event bus needed.
//
// FILTERING: Date Filter (header icon) + Status Cards (clickable)
//            Date filter scopes by expiry date.
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layers, Package, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/inventoryOverview.css';

// Bridge imports — replaced by a unified inventory API once backend is ready.
// TODO: Backend — Remove these imports and replace deriveInventoryFromDeliveries()
//   with a direct call to GET /api/inventory.
import { INIT_DELIVERIES, INVENTORY_STATE } from './deliveriesOverview';

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

// TODO: Backend — Fetch this threshold from config or GET /api/settings
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
   DERIVE INVENTORY FROM DELIVERIES
   Converts the INIT_DELIVERIES list into per-batch inventory rows.

   Each delivery record produces one inventory row:
     name:   d.cakeType
     qty:    d.quantity
     expiry: d.expiryDate
     made:   d.deliveryDate  (used as production date proxy)
     price:  d.pricePerCake

   INVENTORY_STATE seed records with no matching delivery (e.g.
   pre-existing stock loaded from the backend) are also included.

   TODO: Backend — Remove this function entirely once the backend
   supplies pre-aggregated inventory rows via GET /api/inventory.
   The component should then use:
     const [inventoryData, setInventoryData] = useState([]);
   and populate it from the API response in useEffect.
────────────────────────────────────────────────────────────── */
function deriveInventoryFromDeliveries() {
  const rows = [];

  // One row per delivery record (each delivery = one distinct batch)
  INIT_DELIVERIES.forEach(d => {
    rows.push({
      name:   d.cakeType,
      qty:    d.quantity,
      expiry: d.expiryDate,
      made:   d.deliveryDate,
      price:  d.pricePerCake ?? 0,
    });
  });

  // Include INVENTORY_STATE seed records that have no delivery yet
  // (pre-existing stock not yet represented in INIT_DELIVERIES)
  const deliveredTypes = new Set(INIT_DELIVERIES.map(d => d.cakeType));
  Object.entries(INVENTORY_STATE).forEach(([cakeType, info]) => {
    if (!deliveredTypes.has(cakeType)) {
      rows.push({
        name:   cakeType,
        qty:    info.quantity,
        expiry: info.expiryDate,
        made:   TODAY_STR,        // production date unknown for seed stock
        price:  info.pricePerCake ?? 0,
      });
    }
  });

  return rows;
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const InventoryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // loadTrigger is a counter bumped on manual refresh.
  // TODO: Backend — Replace with real-time subscription or polling.
  // -----------------------------------------------------------
  const [loadTrigger, setLoadTrigger] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

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
  // LIVE INVENTORY DATA
  // Re-derived from INIT_DELIVERIES + INVENTORY_STATE on every
  // render. Because handleAddDelivery in deliveriesOverview.jsx
  // mutates both module-level refs in place, the next render of
  // this component automatically sees the updated data.
  //
  // TODO: Backend — Replace this useMemo with a useEffect that
  //   fetches from GET /api/inventory and stores results in state:
  //   const [rawInventory, setRawInventory] = useState([]);
  // -----------------------------------------------------------
  const rawInventory = useMemo(
    () => deriveInventoryFromDeliveries(),
    // loadTrigger in deps forces re-derive on manual refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadTrigger, INIT_DELIVERIES, INVENTORY_STATE]
  );


  // -----------------------------------------------------------
  // FULL INVENTORY — attach computed status to each row
  // -----------------------------------------------------------
  const fullInventory = useMemo(
    () => rawInventory.map(item => ({ ...item, status: computeStatus(item.expiry) })),
    [rawInventory]
  );


  // -----------------------------------------------------------
  // DATE-SCOPED INVENTORY (filter rows by expiry date)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => fullInventory.filter(item => inRange(item.expiry, rangeStart, rangeEnd)),
    [fullInventory, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS (computed from dateScoped)
  // -----------------------------------------------------------
  const totalCakeTypes = useMemo(
    () => new Set(dateScoped.map(i => i.name)).size,
    [dateScoped]
  );

  const totalCakesInStock = useMemo(
    () => dateScoped.reduce((sum, i) => sum + i.qty, 0),
    [dateScoped]
  );


  // -----------------------------------------------------------
  // STATUS CARD COUNTS (total qty per status within dateScoped)
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => ({
    'Fresh':       dateScoped.filter(i => i.status === 'Fresh').reduce((sum, i) => sum + i.qty, 0),
    'Near Expiry': dateScoped.filter(i => i.status === 'Near Expiry').reduce((sum, i) => sum + i.qty, 0),
    'Expired':     dateScoped.filter(i => i.status === 'Expired').reduce((sum, i) => sum + i.qty, 0),
    'Low Stock':   dateScoped.filter(isLowStock).reduce((sum, i) => sum + i.qty, 0),
  }), [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA (dateScoped filtered by active statusFilter)
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
    // TODO: Backend — Fetch inventory on mount:
    //
    // const fetchInventory = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/inventory');
    //     const data = await response.json();
    //     setRawInventory(data.items);     // replaces deriveInventoryFromDeliveries()
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
          <p className="inventory-subtitle">Real-time stock levels derived from Stock Deliveries</p>
        </div>

        <div className="inv-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`inv-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by expiry date range"
          >
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
            <span className="metric-subtext">Unique cake varieties in stock</span>
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
          Counts show total qty (not batch count) per status.
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
          Columns: Cake Name · Quantity · Price · Date Produced
                   Expiry Date · Status
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
                    <td className="price-text">
                      {item.price > 0 ? `₱${item.price.toLocaleString()}` : '—'}
                    </td>
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
                  <td colSpan={6} className="no-data">No inventory items match this filter.</td>
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