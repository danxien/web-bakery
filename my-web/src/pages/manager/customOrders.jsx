// =============================================================
// customOrders.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for custom cake orders.
//
// STATUS LOGIC (Operational-Based):
//   Pending   → Cake not yet prepared (waiting for action)
//   Ready     → Cake finished, awaiting customer pickup
//   Picked Up → Customer received cake, order complete
//   Overdue   → Auto: Today > PickupDate AND status === 'Ready'
//   Cancelled → Final state
//
// WORKFLOW:
//   Pending → Ready → Picked Up
//   Pending → Cancelled
//   Ready   → Overdue → Picked Up | Cancelled
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShieldCheck, CircleDollarSign, ClipboardList, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/customOrders.css';

// TODO: Backend - Replace with: const TODAY = new Date(); const TODAY_STR = TODAY.toISOString().split('T')[0];
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

/* ── Helpers ─────────────────────────────────────────────── */

// Revenue is counted only when order is Picked Up
const REVENUE_STATUSES = ['Picked Up'];

// Overdue: past pickup date AND status is still 'Ready'
function isOverdue(o) {
  return (
    new Date(o.pickupDate + 'T00:00:00') < TODAY &&
    o.status === 'Ready'
  );
}

function isDueToday(o) {
  return (
    o.pickupDate === TODAY_STR &&
    o.status === 'Ready'
  );
}

function displayStatus(o) {
  return isOverdue(o) ? 'Overdue' : o.status;
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusPillClass(ds) {
  const map = {
    Pending:    'pending',
    Ready:      'ready',
    'Picked Up': 'picked-up',
    Cancelled:  'cancelled',
    Overdue:    'overdue',
  };
  return map[ds] || 'pending';
}

function StatusPill({ order }) {
  const ds = displayStatus(order);
  return <span className={`co-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   TODO: Backend - Export orders data for salesOverview.jsx
   Replace this empty array with the fetched API response.
   Expected shape per custom order:
   {
     cakeType:     string  — cake product name
     instructions: string  — special design notes
     quantity:     number
     price:        number  — total order price (₱)
     customer:     string
     orderDate:    string  — YYYY-MM-DD
     pickupDate:   string  — YYYY-MM-DD
     status:       'Pending' | 'Ready' | 'Picked Up' | 'Cancelled'
     createdBy:    string  — seller who created the order
     lastUpdated:  string  — timestamp string
     timeline:     [{ event: string, time: string, state: 'done' | 'current' | 'pending' }]
   }
────────────────────────────────────────────────────────────── */
export let INIT_ORDERS = [];

/* ──────────────────────────────────────────────────────────────
   ORDER DETAIL MODAL
────────────────────────────────────────────────────────────── */
function OrderDetailModal({ order, onClose }) {
  const overdue  = isOverdue(order);
  const dueToday = isDueToday(order);

  return (
    <div className="co-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="co-modal">

        <div className="co-modal-header">
          <div>
            <h2 className="co-modal-cake-name">{order.cakeType}</h2>
          </div>
          <button className="co-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="co-modal-body">
          <div>
            <h3 className="co-modal-section-title">Order Information</h3>
            <div className="co-modal-info-grid">

              <div className="co-info-item">
                <span className="co-info-label">Status</span>
                <span className="co-info-value">
                  <StatusPill order={order} />
                </span>
              </div>

              <div className="co-info-item">
                <span className="co-info-label">Customer</span>
                <span className="co-info-value">{order.customer}</span>
              </div>

              <div className="co-info-item">
                <span className="co-info-label">Total Price</span>
                <span className="co-info-value price-val">₱{order.price.toLocaleString()}</span>
              </div>

              <div className="co-info-item">
                <span className="co-info-label">Quantity</span>
                <span className="co-info-value">{order.quantity} pc{order.quantity > 1 ? 's' : ''}</span>
              </div>

              <div className="co-info-item">
                <span className="co-info-label">Order Date</span>
                <span className="co-info-value">{formatDate(order.orderDate)}</span>
              </div>

              <div className="co-info-item">
                <span className="co-info-label">Pick-Up Date</span>
                <span className="co-info-value" style={{
                  color:      overdue ? '#b91c1c' : dueToday ? '#854d0e' : undefined,
                  fontWeight: (overdue || dueToday) ? 700 : undefined,
                }}>
                  {formatDate(order.pickupDate)}
                  {overdue  && '  ⚠ Overdue'}
                  {dueToday && '  ⚠ Due Today'}
                </span>
              </div>

              <div className="co-info-item full-width">
                <span className="co-info-label">Special Instructions / Design Notes</span>
                <span className="co-info-value instructions-val">{order.instructions}</span>
              </div>

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

const STATUS_OPTIONS = ['All', 'Pending', 'Ready', 'Picked Up', 'Overdue', 'Cancelled'];

const PER_PAGE = 6;
const NO_QUICK = 'all';

const CustomOrders = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched orders data
  // -----------------------------------------------------------
  const [ordersData, setOrdersData] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [modalOrder,   setModalOrder]   = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // TODO: Backend - All values are derived from ordersData
  // -----------------------------------------------------------
  const totalOrders   = ordersData.length;

  const revenueTotal  = ordersData
    .filter(o => REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.price, 0);

  const pendingCount  = ordersData.filter(o => o.status === 'Pending').length;
  const dueTodayCount = ordersData.filter(isDueToday).length;
  const overdueCount  = ordersData.filter(isOverdue).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = ordersData;

    if (quickFilter === 'due-today') {
      result = result.filter(isDueToday);
    } else if (quickFilter === 'overdue') {
      result = result.filter(isOverdue);
    } else {
      if (statusFilter === 'Overdue') {
        result = result.filter(isOverdue);
      } else if (statusFilter === 'Ready') {
        result = result.filter(o => o.status === 'Ready' && !isOverdue(o));
      } else if (statusFilter !== 'All') {
        result = result.filter(o => o.status === statusFilter);
      }
    }

    return result;
  }, [quickFilter, statusFilter, ordersData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function activateQuick(key) {
    setQuickFilter(prev => (prev === key ? NO_QUICK : key));
    setPage(1);
  }


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend - Fetch custom orders on mount
    // Example:
    // const fetchOrders = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/custom-orders');
    //     const data = await response.json();
    //     setOrdersData(data.orders);
    //     INIT_ORDERS = data.orders; // Keep export in sync for salesOverview
    //   } catch (err) {
    //     setError('Failed to load custom orders.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchOrders();
    setLoading(false);

    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="co-page-container"><p>Loading custom orders...</p></div>;
  if (error)   return <div className="co-page-container"><p>{error}</p></div>;

  return (
    <div className="co-page-container">

      {modalOrder && (
        <OrderDetailModal order={modalOrder} onClose={() => setModalOrder(null)} />
      )}

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="co-header">
        <h1 className="co-title">Custom Orders</h1>
        <p className="co-subtitle">Monitor all custom cake orders and production status</p>
      </div>


      {/* =====================================================
          2. METRIC CARDS
          ===================================================== */}
      <div className="co-metrics-row">

        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Total Custom Orders</span>
            <ShieldCheck className="co-blue-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">{totalOrders}</span>
            <span className="co-metric-subtext">All orders on record</span>
          </div>
        </div>

        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Custom Orders Revenue</span>
            <CircleDollarSign className="co-green-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">₱{revenueTotal.toLocaleString()}</span>
            <span className="co-metric-subtext">Picked Up orders only</span>
          </div>
        </div>

        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Pending Orders</span>
            <ClipboardList className="co-yellow-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">{pendingCount}</span>
            <span className="co-metric-subtext">Awaiting preparation</span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS
          ===================================================== */}
      <div className="co-alerts-container">

        <div className="co-alert-wrapper">
          <button
            className={`co-alert-row warning ${quickFilter === 'due-today' ? 'is-active' : ''}`}
            onClick={() => activateQuick('due-today')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{dueTodayCount}</strong>
              {' '}order{dueTodayCount !== 1 ? 's' : ''} due for pick-up today — Ready &amp; awaiting customer
            </span>
          </button>
        </div>

        <div className="co-alert-wrapper">
          <button
            className={`co-alert-row critical ${quickFilter === 'overdue' ? 'is-active' : ''}`}
            onClick={() => activateQuick('overdue')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{overdueCount}</strong>
              {' '}overdue order{overdueCount !== 1 ? 's' : ''} — Ready but pick-up date has passed
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE
          ===================================================== */}
      <div className="co-table-container">

        <div className="co-table-toolbar">

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="co-table-section-title">Orders List</span>
            <span className="co-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {quickFilter !== NO_QUICK && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            <div className="co-filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`co-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Filter by status"
              >
                <Filter size={14} />
                <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
              </button>

              {dropdownOpen && (
                <div className="co-filter-dropdown">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`co-dropdown-item ${statusFilter === opt && quickFilter === NO_QUICK ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(opt);
                        setQuickFilter(NO_QUICK);
                        setDropdownOpen(false);
                        setPage(1);
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {quickFilter !== NO_QUICK && (
              <button
                className="co-filter-icon-btn"
                onClick={() => { setQuickFilter(NO_QUICK); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

        <div className="co-table-scroll-wrapper">
          <table className="co-orders-table">
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Customer</th>
                <th>Special Instructions</th>
                <th>Order Date</th>
                <th>Pick-Up Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((order, idx) => {
                const overdue  = isOverdue(order);
                const dueToday = isDueToday(order);
                return (
                  <tr key={idx}>
                    <td><span className="co-cake-name-text">{order.cakeType}</span></td>
                    <td>{order.quantity}</td>
                    <td><span className="co-price-text">₱{order.price.toLocaleString()}</span></td>
                    <td>{order.customer}</td>
                    <td>
                      <span className="co-instructions-text" title={order.instructions}>
                        {order.instructions}
                      </span>
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <span className={`co-pickup-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : ''}`}>
                        {formatDate(order.pickupDate)}
                      </span>
                    </td>
                    <td><StatusPill order={order} /></td>
                    <td>
                      <button
                        className="co-view-btn"
                        onClick={e => { e.stopPropagation(); setModalOrder(order); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className="co-no-data">
                    No orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="co-pagination">
          <span className="co-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="co-pagination-btns">
            <button className="co-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`co-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="co-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomOrders;