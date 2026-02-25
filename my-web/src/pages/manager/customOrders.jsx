// =============================================================
// customOrders.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for custom cake orders.
//
// STRUCTURE mirrors InventoryOverview.jsx exactly:
//   1. .co-page-container   → .inventory-page-container
//   2. .co-header           → .inventory-header
//   3. .co-metrics-row      → .metrics-row  (3 cards)
//   4. .co-alerts-container → .alerts-container  (2 rows)
//   5. .co-table-container  → .table-container   (toolbar + table)
//
// BACKEND INTEGRATION CHECKLIST:
//   [ ] Replace mock INIT_ORDERS with API response
//   [ ] Replace hardcoded alert counts with dynamic values
//   [ ] Add loading and error states after fetching
//   [ ] Connect filter dropdown to backend query params (optional)
//   [ ] All metric values are derived — recalculate after fetch
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShieldCheck, CircleDollarSign, ClipboardList, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/customOrders.css';

/* ──────────────────────────────────────────────────────────────
   MOCK "TODAY" — fixed for demo consistency.
   🔹 BACKEND: Replace with: const TODAY = new Date();
────────────────────────────────────────────────────────────── */
const TODAY_STR = '2025-01-24';
const TODAY     = new Date(TODAY_STR);

/* ── Helpers ─────────────────────────────────────────────── */
const REVENUE_STATUSES = ['Approved', 'In Production', 'Ready', 'Delivered'];

function isOverdue(o) {
  return (
    new Date(o.pickupDate) < TODAY &&
    o.status !== 'Delivered' &&
    o.status !== 'Declined'
  );
}

function isDueToday(o) {
  return (
    o.pickupDate === TODAY_STR &&
    o.status !== 'Delivered' &&
    o.status !== 'Declined'
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
    Pending: 'pending', Approved: 'approved', 'In Production': 'in-production',
    Ready: 'ready', Delivered: 'delivered', Declined: 'declined', Overdue: 'overdue',
  };
  return map[ds] || 'pending';
}

function StatusPill({ order }) {
  const ds = displayStatus(order);
  return <span className={`co-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   MOCK DATA
   🔹 BACKEND: Replace this entire array with an API call result.
   Expected shape per order:
   {
     id, cakeType, instructions, quantity, price, customer,
     orderDate (YYYY-MM-DD), pickupDate (YYYY-MM-DD), status,
     createdBy, lastUpdated, timeline: [{ event, time, state }]
   }
────────────────────────────────────────────────────────────── */
const INIT_ORDERS = [
  {
    id: 'ORD-001', cakeType: 'Birthday Chocolate Cake',
    instructions: '3-tier fondant flowers, blue and gold theme. Photo of couple on top tier.',
    quantity: 1, price: 2500, customer: 'Ana Reyes',
    orderDate: '2025-01-18', pickupDate: TODAY_STR, status: 'Pending',
    createdBy: 'Seller Ana Reyes', lastUpdated: '2025-01-18 09:12 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 18 – 09:12 AM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Awaiting approval',  state: 'current' },
      { event: 'Production Started',    time: 'Not yet started',    state: 'pending' },
      { event: 'Ready for Pick-Up',     time: 'Pending',            state: 'pending' },
      { event: 'Delivered / Picked Up', time: 'Pending',            state: 'pending' },
    ],
  },
  {
    id: 'ORD-002', cakeType: 'Wedding Vanilla Cake',
    instructions: '5-tier white elegance, sugar rose cascade, "J & M 2025" monogram.',
    quantity: 1, price: 8000, customer: 'Jose & Maria Cruz',
    orderDate: '2025-01-17', pickupDate: TODAY_STR, status: 'Approved',
    createdBy: 'Seller Lara Diaz', lastUpdated: '2025-01-19 02:30 PM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 17 – 10:00 AM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 19 – 02:30 PM', state: 'done' },
      { event: 'Production Started',    time: 'Awaiting packer',   state: 'current' },
      { event: 'Ready for Pick-Up',     time: 'Pending',           state: 'pending' },
      { event: 'Delivered / Picked Up', time: 'Pending',           state: 'pending' },
    ],
  },
  {
    id: 'ORD-003', cakeType: 'Ube Dedication Cake',
    instructions: 'Square 2-layer, printed photo on top, purple frosting.',
    quantity: 2, price: 1800, customer: 'Pedro Santos',
    orderDate: '2025-01-19', pickupDate: '2025-01-22', status: 'In Production',
    createdBy: 'Seller Ana Reyes', lastUpdated: '2025-01-21 08:00 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 19 – 03:45 PM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 20 – 09:00 AM', state: 'done' },
      { event: 'Production Started',    time: 'Jan 21 – 08:00 AM', state: 'done' },
      { event: 'Ready for Pick-Up',     time: 'Overdue – Jan 22',  state: 'current' },
      { event: 'Delivered / Picked Up', time: 'Pending',           state: 'pending' },
    ],
  },
  {
    id: 'ORD-004', cakeType: 'Red Velvet Baby Shower Cake',
    instructions: 'Round, pink and white decor, "Baby Girl" topper.',
    quantity: 1, price: 2200, customer: 'Lara Diaz',
    orderDate: '2025-01-16', pickupDate: '2025-01-20', status: 'Ready',
    createdBy: 'Seller Pedro Gomez', lastUpdated: '2025-01-23 11:00 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 16 – 01:00 PM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 17 – 10:30 AM', state: 'done' },
      { event: 'Production Started',    time: 'Jan 18 – 08:00 AM', state: 'done' },
      { event: 'Ready for Pick-Up',     time: 'Jan 23 – 11:00 AM', state: 'done' },
      { event: 'Delivered / Picked Up', time: 'Awaiting pickup',   state: 'current' },
    ],
  },
  {
    id: 'ORD-005', cakeType: 'Mango Float Reunion Cake',
    instructions: 'Sheet cake, tropical design, 30 slices minimum.',
    quantity: 3, price: 3600, customer: 'Reyes Family',
    orderDate: '2025-01-21', pickupDate: '2025-01-28', status: 'Pending',
    createdBy: 'Seller Ana Reyes', lastUpdated: '2025-01-21 04:10 PM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 21 – 04:10 PM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Awaiting approval',  state: 'current' },
      { event: 'Production Started',    time: 'Not yet started',    state: 'pending' },
      { event: 'Ready for Pick-Up',     time: 'Pending',            state: 'pending' },
      { event: 'Delivered / Picked Up', time: 'Pending',            state: 'pending' },
    ],
  },
  {
    id: 'ORD-006', cakeType: 'Chocolate Mousse Celebration',
    instructions: 'Round, 2-layer, dark chocolate ganache, sprinkles on sides.',
    quantity: 1, price: 1950, customer: 'Walk-in Request',
    orderDate: '2025-01-20', pickupDate: '2025-01-30', status: 'Approved',
    createdBy: 'Seller Lara Diaz', lastUpdated: '2025-01-22 09:45 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 20 – 02:00 PM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 22 – 09:45 AM', state: 'done' },
      { event: 'Production Started',    time: 'Scheduled Jan 27',   state: 'current' },
      { event: 'Ready for Pick-Up',     time: 'Pending',            state: 'pending' },
      { event: 'Delivered / Picked Up', time: 'Pending',            state: 'pending' },
    ],
  },
  {
    id: 'ORD-007', cakeType: 'Strawberry Anniversary Cake',
    instructions: 'Heart shape, 2 tiers, fresh strawberries, "10 Years" topping.',
    quantity: 1, price: 1200, customer: 'Mr. & Mrs. Santos',
    orderDate: '2025-01-15', pickupDate: '2025-01-22', status: 'Delivered',
    createdBy: 'Seller Ana Reyes', lastUpdated: '2025-01-22 10:30 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 15 – 11:00 AM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 16 – 08:30 AM', state: 'done' },
      { event: 'Production Started',    time: 'Jan 20 – 07:00 AM', state: 'done' },
      { event: 'Ready for Pick-Up',     time: 'Jan 22 – 08:00 AM', state: 'done' },
      { event: 'Delivered / Picked Up', time: 'Jan 22 – 10:30 AM', state: 'done' },
    ],
  },
  {
    id: 'ORD-008', cakeType: 'Buko Pandan Custom Cake',
    instructions: 'Bundt shape, pandan-infused, macapuno topping.',
    quantity: 2, price: 1400, customer: 'Rosa Villamor',
    orderDate: '2025-01-14', pickupDate: '2025-01-19', status: 'Declined',
    createdBy: 'Seller Pedro Gomez', lastUpdated: '2025-01-15 03:00 PM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 14 – 02:00 PM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Declined Jan 15',    state: 'current' },
      { event: 'Production Started',    time: 'N/A – Declined',     state: 'pending' },
      { event: 'Ready for Pick-Up',     time: 'N/A',                state: 'pending' },
      { event: 'Delivered / Picked Up', time: 'N/A',                state: 'pending' },
    ],
  },
  {
    id: 'ORD-009', cakeType: 'Ube Cheese Pandesal Tower',
    instructions: 'Tiered display, 4 tiers, ube-flavored, cream cheese frosting.',
    quantity: 5, price: 4800, customer: 'Barangay Fiesta Org.',
    orderDate: '2025-01-22', pickupDate: '2025-02-02', status: 'In Production',
    createdBy: 'Seller Lara Diaz', lastUpdated: '2025-01-24 07:30 AM',
    timeline: [
      { event: 'Order Created',         time: 'Jan 22 – 09:00 AM', state: 'done' },
      { event: 'Approved by Manager',   time: 'Jan 23 – 11:00 AM', state: 'done' },
      { event: 'Production Started',    time: 'Jan 24 – 07:30 AM', state: 'done' },
      { event: 'Ready for Pick-Up',     time: 'Expected Feb 1',     state: 'current' },
      { event: 'Delivered / Picked Up', time: 'Pending',            state: 'pending' },
    ],
  },
];

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

              {/* FIX #2: Status now has its own labeled field */}
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

// FIX #4: Updated filter options — Pending, Approved, Completed, Overdue, Declined only
// "Completed" maps to Delivered + Ready statuses (fully fulfilled orders)
const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Completed', 'Overdue', 'Declined'];

// Helper: "Completed" filter includes Ready + Delivered orders that are not overdue
function isCompleted(o) {
  return (o.status === 'Ready' || o.status === 'Delivered') && !isOverdue(o);
}

const PER_PAGE   = 6;
const NO_QUICK   = 'all';

const CustomOrders = () => {

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------
  const [statusFilter, setStatusFilter] = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [modalOrder,   setModalOrder]   = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 BACKEND: Add state for fetched data, loading, error
  // const [ordersData, setOrdersData] = useState([]);
  // const [loading,    setLoading]    = useState(true);
  // const [error,      setError]      = useState(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: Replace INIT_ORDERS with ordersData from state
  // -----------------------------------------------------------
  const totalOrders   = INIT_ORDERS.length;
  const revenueTotal  = INIT_ORDERS
    .filter(o => REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.price, 0);
  const pendingCount  = INIT_ORDERS.filter(o => o.status === 'Pending').length;
  const dueTodayCount = INIT_ORDERS.filter(isDueToday).length;
  const overdueCount  = INIT_ORDERS.filter(isOverdue).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // FIX #4: "Completed" filter covers Ready + Delivered
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = INIT_ORDERS; // 🔹 BACKEND: swap to ordersData

    if      (quickFilter === 'pending')   result = result.filter(o => o.status === 'Pending');
    else if (quickFilter === 'revenue')   result = result.filter(o => REVENUE_STATUSES.includes(o.status));
    else if (quickFilter === 'due-today') result = result.filter(isDueToday);
    else if (quickFilter === 'overdue')   result = result.filter(isOverdue);
    else {
      if      (statusFilter === 'Overdue')   result = result.filter(isOverdue);
      else if (statusFilter === 'Completed') result = result.filter(isCompleted);
      else if (statusFilter !== 'All')       result = result.filter(o => o.status === statusFilter && !isOverdue(o));
    }

    return result;
  }, [quickFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function activateQuick(key) {
    setQuickFilter(prev => (prev === key ? NO_QUICK : key));
    setPage(1);
  }


  // -----------------------------------------------------------
  // useEffect — side effects
  // -----------------------------------------------------------
  useEffect(() => {
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

        {/* Total Custom Orders */}
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

        {/* Revenue */}
        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Custom Orders Revenue</span>
            <CircleDollarSign className="co-green-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">₱{revenueTotal.toLocaleString()}</span>
            <span className="co-metric-subtext">Excl. Pending &amp; Declined</span>
          </div>
        </div>

        {/* FIX #3: Pending Approval — updated subtext */}
        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Pending Approval</span>
            <ClipboardList className="co-yellow-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">{pendingCount}</span>
            <span className="co-metric-subtext">
              {pendingCount === 1 ? 'Pending cake order' : 'Pending cake orders'}
            </span>
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
              {' '}order{dueTodayCount !== 1 ? 's' : ''} due for pick-up today — excludes Delivered &amp; Declined
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
              {' '}overdue order{overdueCount !== 1 ? 's' : ''} — pick-up date passed without delivery
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE
          FIX #1: Table scroll wrapper handles overflow so the
          table is always fully visible regardless of sidebar state.
          ===================================================== */}
      <div className="co-table-container">

        {/* Toolbar */}
        <div className="co-table-toolbar">

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="co-table-section-title">Orders List</span>
            <span className="co-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {quickFilter !== NO_QUICK && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* FIX #4: Updated STATUS_OPTIONS dropdown */}
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

        {/* FIX #1: Scrollable table wrapper — handles sidebar expand/collapse gracefully */}
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
              {paged.length > 0 ? paged.map(order => {
                const overdue  = isOverdue(order);
                const dueToday = isDueToday(order);
                return (
                  <tr key={order.id}>
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

        {/* Pagination */}
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