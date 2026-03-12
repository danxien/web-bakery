// =============================================================
// walkInOrders.jsx
// PURPOSE: Manager monitoring view for walk-in cake purchases.
// FILTERING: Date Filter (header calendar icon)
//
// STATUS LOGIC:
//   Completed → Walk-in purchase processed and finalized in-store.
//               All walk-in transactions are immediate, so no
//               Pending / Ready / Overdue states exist.
//
// SYSTEM INTEGRATIONS (TODO: Backend):
//   Inventory      → Deduct qty sold from cake stock on Completed order.
//   Sales Overview → salesOverview.jsx reads INIT_WALKIN_ORDERS and
//                    includes status === 'Completed' records in revenue.
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, CircleDollarSign, ClipboardList, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/walkInOrders.css';

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

/* ── Misc Helpers ──────────────────────────────────────────── */

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ──────────────────────────────────────────────────────────────
   SHARED DATA BRIDGE — consumed by salesOverview.jsx
   salesOverview reads this array and filters by status === 'Completed'
   to compute Walk-In Sales Revenue.

   TODO: Backend — Remove this export once salesOverview.jsx
   fetches sales data independently via GET /api/sales.
   On mount (see useEffect below), populate via GET /api/walkin-orders
   and sync: INIT_WALKIN_ORDERS = data.orders

   Expected shape per record:
   {
     cakeType:     string  — cake product name
     quantity:     number
     price:        number  — total order price (₱)
     customer:     string  — use 'Walk-In Customer' if unknown
     orderDate:    string  — YYYY-MM-DD
     status:       'Completed'
     instructions: string  — special notes (optional)
   }
────────────────────────────────────────────────────────────── */

// TODO: Backend will provide completed transactions here
export let INIT_WALKIN_ORDERS = [];

/* ──────────────────────────────────────────────────────────────
   WALK-IN ORDER DETAIL MODAL
────────────────────────────────────────────────────────────── */
function WalkInDetailModal({ order, onClose }) {
  return (
    <div className="wi-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wi-modal">

        <div className="wi-modal-header">
          <div>
            <p className="wi-modal-eyebrow">Walk-In Order Details</p>
            <h2 className="wi-modal-cake-name">{order.cakeType}</h2>
          </div>
          <button className="wi-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="wi-modal-body">

          {/* ── Section 1: Order Information ── */}
          <h3 className="wi-modal-section-title">Order Information</h3>
          <div className="wi-modal-info-grid">

            <div className="wi-info-item">
              <span className="wi-info-label">Cake Type</span>
              <span className="wi-info-value">{order.cakeType}</span>
            </div>

            <div className="wi-info-item">
              <span className="wi-info-label">Quantity</span>
              <span className="wi-info-value">{order.quantity} pc{order.quantity > 1 ? 's' : ''}</span>
            </div>

            <div className="wi-info-item">
              <span className="wi-info-label">Total Price</span>
              <span className="wi-info-value price-val">₱{order.price.toLocaleString()}</span>
            </div>

            <div className="wi-info-item">
              <span className="wi-info-label">Status</span>
              <span className="wi-info-value">
                <span className="wi-status-pill completed">{order.status}</span>
              </span>
            </div>

          </div>

          {/* ── Section 2: Customer Information ── */}
          <h3 className="wi-modal-section-title" style={{ marginTop: 22 }}>Customer Information</h3>
          <div className="wi-modal-info-grid">
            <div className="wi-info-item full-width">
              <span className="wi-info-label">Customer Name</span>
              <span className="wi-info-value">{order.customer}</span>
            </div>
          </div>

          {/* ── Section 3: Order Date ── */}
          <h3 className="wi-modal-section-title" style={{ marginTop: 22 }}>Schedule</h3>
          <div className="wi-modal-info-grid">
            <div className="wi-info-item full-width">
              <span className="wi-info-label">Order Date</span>
              <span className="wi-info-value">{formatDate(order.orderDate)}</span>
            </div>
          </div>

          {/* ── Section 4: Special Instructions ── */}
          <h3 className="wi-modal-section-title" style={{ marginTop: 22 }}>Special Instructions</h3>
          <div className="wi-modal-info-grid">
            <div className="wi-info-item full-width">
              <span className="wi-info-value instructions-val">
                {order.instructions || 'No special instructions provided.'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const PER_PAGE = 6;

const WalkInOrders = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend — Replace initial [] with data populated in
  //   useEffect below via GET /api/walkin-orders.
  // -----------------------------------------------------------
  const [ordersData, setOrdersData] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [page,       setPage]       = useState(1);
  const [modalOrder, setModalOrder] = useState(null);


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
  // DATE-SCOPED ORDERS (filter by orderDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => ordersData.filter(o => inRange(o.orderDate, rangeStart, rangeEnd)),
    [ordersData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // All walk-in orders are Completed — every scoped record counts.
  // -----------------------------------------------------------
  const totalOrders  = dateScoped.length;
  const revenueTotal = dateScoped.reduce((sum, o) => sum + o.price, 0);
  const totalQtySold = dateScoped.reduce((sum, o) => sum + o.quantity, 0);


  // -----------------------------------------------------------
  // PAGINATION
  // -----------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(dateScoped.length / PER_PAGE));
  const paged      = dateScoped.slice((page - 1) * PER_PAGE, page * PER_PAGE);


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
  function handleDateSelect(key) {
    setDateFilter(key);
    setPage(1);
    if (key !== 'custom') setDateDropOpen(false);
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
    // TODO: Backend — Fetch walk-in orders on mount:
    //
    // const load = async () => {
    //   try {
    //     setLoading(true);
    //     const res  = await fetch('/api/walkin-orders');
    //     const data = await res.json();
    //     setOrdersData(data.orders);
    //     INIT_WALKIN_ORDERS = data.orders; // sync bridge for salesOverview
    //   } catch (err) {
    //     setError('Failed to load walk-in orders.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // load();

    setLoading(false);

    const handler = e => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setPage(1); }, [dateFilter, customStart, customEnd]);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="wi-page-container"><p>Loading walk-in orders...</p></div>;
  if (error)   return <div className="wi-page-container"><p>{error}</p></div>;

  return (
    <div className="wi-page-container">

      {modalOrder && (
        <WalkInDetailModal order={modalOrder} onClose={() => setModalOrder(null)} />
      )}

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="wi-header">
        <div>
          <h1 className="wi-title">Walk-In Orders</h1>
          <p className="wi-subtitle">Monitor all in-store cake purchases and daily walk-in sales</p>
        </div>

        <div className="wi-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`wi-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by date range"
          >
            <Calendar size={16} strokeWidth={2} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="wi-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`wi-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}

              <div className="wi-custom-range-section">
                <span className="wi-custom-range-title">Custom Range</span>
                <label className="wi-custom-label">From</label>
                <input
                  type="date"
                  className="wi-date-input"
                  value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                />
                <label className="wi-custom-label">To</label>
                <input
                  type="date"
                  className="wi-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                />
                <button
                  className="wi-apply-btn"
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
          2. SUMMARY METRIC CARDS
          ===================================================== */}
      <div className="wi-metrics-row">

        <div className="wi-metric-card">
          <div className="wi-card-top">
            <span className="wi-metric-label">Total Walk-In Orders</span>
            <ShoppingBag className="wi-blue-icon" size={20} />
          </div>
          <div className="wi-card-bottom">
            <span className="wi-metric-value">{totalOrders}</span>
            <span className="wi-metric-subtext">In-store purchases recorded</span>
          </div>
        </div>

        <div className="wi-metric-card">
          <div className="wi-card-top">
            <span className="wi-metric-label">Walk-In Revenue</span>
            <CircleDollarSign className="wi-green-icon" size={20} />
          </div>
          <div className="wi-card-bottom">
            <span className="wi-metric-value">₱{revenueTotal.toLocaleString()}</span>
            <span className="wi-metric-subtext">All completed transactions</span>
          </div>
        </div>

        <div className="wi-metric-card">
          <div className="wi-card-top">
            <span className="wi-metric-label">Total Cakes Sold</span>
            <ClipboardList className="wi-yellow-icon" size={20} />
          </div>
          <div className="wi-card-bottom">
            <span className="wi-metric-value">{totalQtySold}</span>
            <span className="wi-metric-subtext">
              {totalQtySold === 1 ? 'Cake sold in-store' : 'Cakes sold in-store'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ORDERS TABLE
          Visible columns: Cake Type · Qty · Price · Order Date · Status · Action
          Hidden from table (shown only in modal):
            Customer Name, Special Instructions
          ===================================================== */}
      <div className="wi-table-container">

        <div className="wi-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="wi-table-section-title">Orders List</span>
            <span className="wi-table-count-pill">
              {dateScoped.length} order{dateScoped.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="wi-table-scroll-wrapper">
          <table className="wi-orders-table">
            <colgroup>
              <col className="col-cake" />
              <col className="col-qty" />
              <col className="col-price" />
              <col className="col-date" />
              <col className="col-status" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Order Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((order, idx) => (
                <tr key={idx}>
                  <td><span className="wi-cake-name-text">{order.cakeType}</span></td>
                  <td>{order.quantity}</td>
                  <td><span className="wi-price-text">₱{order.price.toLocaleString()}</span></td>
                  <td><span className="wi-date-text">{formatDate(order.orderDate)}</span></td>
                  <td>
                    <span className="wi-status-pill completed">{order.status}</span>
                  </td>
                  <td>
                    <button
                      className="wi-view-btn"
                      onClick={e => { e.stopPropagation(); setModalOrder(order); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="wi-no-data">
                    No walk-in orders found for this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="wi-pagination">
          <span className="wi-pagination-info">
            {dateScoped.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, dateScoped.length)} of ${dateScoped.length}`}
          </span>
          <div className="wi-pagination-btns">
            <button className="wi-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`wi-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="wi-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WalkInOrders;