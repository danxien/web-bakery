// =============================================================
// deliveriesOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for customer delivery orders.
//
// STRUCTURE mirrors reservationOverview.jsx exactly:
//   1. .do-page-container   → .ro-page-container
//   2. .do-header           → .ro-header
//   3. .do-metrics-row      → .ro-metrics-row  (3 cards)
//   4. .do-alerts-container → .ro-alerts-container  (3 rows)
//   5. .do-table-container  → .ro-table-container   (toolbar + table)
//
// BACKEND INTEGRATION CHECKLIST:
//   [ ] Replace mock INIT_DELIVERIES with API response
//   [ ] Replace hardcoded alert counts with dynamic values
//   [ ] Add loading and error states after fetching
//   [ ] Connect filter dropdown to backend query params (optional)
//   [ ] All metric values are derived — recalculate after fetch
//   [ ] On Delivered: sync Total Cakes Delivered + Sales Overview
//   [ ] Rule 3: Auto-flag overdue if today > deliveryDate && status === 'Pending'
//   [ ] Rule 4: Seller order creation auto-creates delivery record here
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Truck, CircleDollarSign, PackageCheck, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/deliveriesOverview.css';

/* ──────────────────────────────────────────────────────────────
   MOCK "TODAY" — fixed for demo consistency.
   🔹 BACKEND: Replace with: const TODAY = new Date();
────────────────────────────────────────────────────────────── */
const TODAY_STR = '2025-01-24';
const TODAY     = new Date(TODAY_STR + 'T00:00:00');

/* ── Helpers ─────────────────────────────────────────────── */

/** Statuses included in Estimated Revenue — exclude Cancelled (Rule 1) */
const REVENUE_STATUSES = ['Pending', 'Out for Delivery', 'Delivered'];

/**
 * Rule 3: Overdue = deliveryDate < today AND status is not Delivered or Cancelled.
 * Computed automatically — no manual flag needed.
 */
function isOverdue(d) {
  return (
    new Date(d.deliveryDate + 'T00:00:00') < TODAY &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
  );
}

/** Deliveries Today: deliveryDate === today AND not yet Delivered or Cancelled */
function isDeliveryToday(d) {
  return (
    d.deliveryDate === TODAY_STR &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
  );
}

/** Pending: status === 'Pending', any date */
function isPending(d) {
  return d.status === 'Pending';
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/**
 * Cake Type column display:
 * Single item  → show name directly
 * Multiple     → "First Cake + N more"  (full list visible on hover via title attr)
 */
function formatCakeType(items) {
  if (!items || items.length === 0) return '—';
  if (items.length === 1) return items[0].name;
  return `${items[0].name} + ${items.length - 1} more`;
}

function fullCakeList(items) {
  if (!items || items.length === 0) return '—';
  return items.map(i => `${i.name} ×${i.qty}`).join(', ');
}

function statusPillClass(status) {
  const map = {
    Pending:           'pending',
    'Out for Delivery':'out-for-delivery',
    Delivered:         'delivered',
    Cancelled:         'cancelled',
    Overdue:           'overdue',
  };
  return map[status] || 'pending';
}

/** Applies Rule 3: displays "Overdue" when conditions are met */
function displayStatus(d) {
  return isOverdue(d) ? 'Overdue' : d.status;
}

function StatusPill({ delivery }) {
  const ds = displayStatus(delivery);
  return <span className={`do-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   MOCK DATA
   🔹 BACKEND: Replace this entire array with an API call result.
   Expected shape per delivery order:
   {
     id,
     items: [{ name, qty }],     // array of cake line items per order
     totalQty,                    // sum of all item qty
     totalPrice,                  // total order price (not per-cake price)
     customer,                    // full name
     contact,                     // phone number
     address,                     // complete delivery address
     deliveryDate (YYYY-MM-DD),
     status: 'Pending' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
   }
────────────────────────────────────────────────────────────── */
const INIT_DELIVERIES = [
  {
    id: 'DEL-001',
    items: [{ name: 'Chocolate Fudge Cake', qty: 2 }],
    totalQty: 2, totalPrice: 1700,
    customer: 'Ana Reyes', contact: '09171234567',
    address: '123 Rizal St., Brgy. Sta. Cruz, Calamba, Laguna',
    deliveryDate: TODAY_STR, status: 'Pending',
  },
  {
    id: 'DEL-002',
    items: [
      { name: 'Ube Macapuno Cake', qty: 1 },
      { name: 'Red Velvet Cake',   qty: 1 },
      { name: 'Buko Pandan Cake',  qty: 1 },
    ],
    totalQty: 3, totalPrice: 2770,
    customer: 'Jose Cruz', contact: '09189876543',
    address: '45 Mabini Ave., Brgy. Halang, Calamba, Laguna',
    deliveryDate: TODAY_STR, status: 'Out for Delivery',
  },
  {
    id: 'DEL-003',
    items: [{ name: 'Mango Float Cake', qty: 3 }],
    totalQty: 3, totalPrice: 2340,
    customer: 'Pedro Santos', contact: '09205551234',
    address: '78 Luna St., Brgy. Real, Calamba, Laguna',
    deliveryDate: '2025-01-22', status: 'Pending',
  },
  {
    id: 'DEL-004',
    items: [
      { name: 'Caramel Custard Cake', qty: 2 },
      { name: 'Mocha Crunch Cake',    qty: 1 },
    ],
    totalQty: 3, totalPrice: 2210,
    customer: 'Maria Gomez', contact: '09321112233',
    address: '9 Del Pilar Rd., Brgy. Uno, Calamba, Laguna',
    deliveryDate: '2025-01-21', status: 'Pending',
  },
  {
    id: 'DEL-005',
    items: [{ name: 'Strawberry Shortcake', qty: 1 }],
    totalQty: 1, totalPrice: 890,
    customer: 'Rosa Villamor', contact: '09178884455',
    address: '22 Bonifacio Blvd., Brgy. Dos, Calamba, Laguna',
    deliveryDate: '2025-01-25', status: 'Pending',
  },
  {
    id: 'DEL-006',
    items: [{ name: 'Leche Flan Cake', qty: 1 }],
    totalQty: 1, totalPrice: 1050,
    customer: 'Mr. & Mrs. Santos', contact: '09096667788',
    address: '3 Aguinaldo St., Brgy. Tres, Calamba, Laguna',
    deliveryDate: '2025-01-21', status: 'Delivered',
  },
  {
    id: 'DEL-007',
    items: [
      { name: 'Pandan Chiffon Cake', qty: 2 },
      { name: 'Ube Cheese Cake',     qty: 2 },
    ],
    totalQty: 4, totalPrice: 3500,
    customer: 'Reyes Family', contact: '09151239876',
    address: '67 Quezon Ave., Brgy. Parian, Calamba, Laguna',
    deliveryDate: '2025-01-27', status: 'Pending',
  },
  {
    id: 'DEL-008',
    items: [{ name: 'Chocolate Mousse Cake', qty: 1 }],
    totalQty: 1, totalPrice: 1200,
    customer: 'Lara Diaz', contact: '09273334455',
    address: '11 Burgos St., Brgy. Siete, Calamba, Laguna',
    deliveryDate: '2025-01-20', status: 'Delivered',
  },
  {
    id: 'DEL-009',
    items: [{ name: 'Buko Pandan Cake', qty: 2 }],
    totalQty: 2, totalPrice: 1440,
    customer: 'Barangay Fiesta Org.', contact: '09504441122',
    address: '100 Fiesta Rd., Brgy. Sawa, Calamba, Laguna',
    deliveryDate: '2025-01-19', status: 'Cancelled',
  },
  {
    id: 'DEL-010',
    items: [{ name: 'Red Velvet Cake', qty: 1 }],
    totalQty: 1, totalPrice: 1100,
    customer: 'Walk-in Delivery', contact: '09881230000',
    address: '55 Magsaysay Blvd., Brgy. Uno, Calamba, Laguna',
    deliveryDate: '2025-01-28', status: 'Pending',
  },
];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = ['All', 'Pending', 'Out for Delivery', 'Delivered', 'Cancelled', 'Overdue'];

const PER_PAGE = 6;
const NO_QUICK = 'all';

const DeliveryOverview = () => {

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------
  const [statusFilter, setStatusFilter] = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 BACKEND: Add state for fetched data, loading, error
  // const [deliveriesData, setDeliveriesData] = useState([]);
  // const [loading,        setLoading]        = useState(true);
  // const [error,          setError]          = useState(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: Replace INIT_DELIVERIES with deliveriesData
  // -----------------------------------------------------------

  // Card 1: Total Delivery Orders — count of ALL orders (no exclusions)
  const totalDeliveryOrders = INIT_DELIVERIES.length;

  // Card 2: Estimated Revenue — sum of totalPrice, exclude Cancelled (Rule 1)
  const estimatedRevenue = INIT_DELIVERIES
    .filter(d => REVENUE_STATUSES.includes(d.status))
    .reduce((sum, d) => sum + d.totalPrice, 0);

  // Card 3: Total Cakes Delivered — sum of totalQty where status === 'Delivered' ONLY (Rule 1)
  const totalCakesDelivered = INIT_DELIVERIES
    .filter(d => d.status === 'Delivered')
    .reduce((sum, d) => sum + d.totalQty, 0);

  // Alert counts
  const deliveriesTodayCount = INIT_DELIVERIES.filter(isDeliveryToday).length;
  const pendingCount         = INIT_DELIVERIES.filter(isPending).length;
  const overdueCount         = INIT_DELIVERIES.filter(isOverdue).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = INIT_DELIVERIES; // 🔹 BACKEND: swap to deliveriesData

    if      (quickFilter === 'today')   result = result.filter(isDeliveryToday);
    else if (quickFilter === 'pending') result = result.filter(isPending);
    else if (quickFilter === 'overdue') result = result.filter(isOverdue);
    else {
      if      (statusFilter === 'Overdue') result = result.filter(isOverdue);
      else if (statusFilter !== 'All')     result = result.filter(d => d.status === statusFilter && !isOverdue(d));
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
  // useEffect
  // -----------------------------------------------------------
  useEffect(() => {
    // 🔹 BACKEND: Fetch deliveries on mount
    // const fetchDeliveries = async () => { ... };
    // fetchDeliveries();

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
    <div className="do-page-container">

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="do-header">
        <h1 className="do-title">Customer Deliveries</h1>
        <p className="do-subtitle">Monitor all delivery orders, status updates, and overdue alerts</p>
      </div>


      {/* =====================================================
          2. METRIC CARDS — 3 static display cards (not clickable)
          ===================================================== */}
      <div className="do-metrics-row">

        {/* Card 1: Total Delivery Orders */}
        <div className="do-metric-card">
          <div className="do-card-top">
            <span className="do-metric-label">Total Delivery Orders</span>
            <Truck className="do-blue-icon" size={20} />
          </div>
          <div className="do-card-bottom">
            <span className="do-metric-value">{totalDeliveryOrders}</span>
            <span className="do-metric-subtext">All delivery transactions</span>
          </div>
        </div>

        {/* Card 2: Estimated Revenue */}
        <div className="do-metric-card">
          <div className="do-card-top">
            <span className="do-metric-label">Estimated Revenue</span>
            <CircleDollarSign className="do-green-icon" size={20} />
          </div>
          <div className="do-card-bottom">
            <span className="do-metric-value">₱{estimatedRevenue.toLocaleString()}</span>
            <span className="do-metric-subtext">Excl. Cancelled orders</span>
          </div>
        </div>

        {/* Card 3: Total Cakes Delivered */}
        <div className="do-metric-card">
          <div className="do-card-top">
            <span className="do-metric-label">Total Cakes Delivered</span>
            <PackageCheck className="do-yellow-icon" size={20} />
          </div>
          <div className="do-card-bottom">
            <span className="do-metric-value">{totalCakesDelivered}</span>
            <span className="do-metric-subtext">
              {totalCakesDelivered === 1 ? 'Cake successfully delivered' : 'Cakes successfully delivered'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS — Today / Pending / Overdue
          ===================================================== */}
      <div className="do-alerts-container">

        {/* Deliveries Today — warning (yellow) */}
        <div className="do-alert-wrapper">
          <button
            className={`do-alert-row warning ${quickFilter === 'today' ? 'is-active' : ''}`}
            onClick={() => activateQuick('today')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{deliveriesTodayCount}</strong>
              {' '}deliver{deliveriesTodayCount !== 1 ? 'ies' : 'y'} scheduled for today — not yet completed
            </span>
          </button>
        </div>

        {/* Pending Deliveries — info (blue) */}
        <div className="do-alert-wrapper">
          <button
            className={`do-alert-row info ${quickFilter === 'pending' ? 'is-active' : ''}`}
            onClick={() => activateQuick('pending')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{pendingCount}</strong>
              {' '}pending deliver{pendingCount !== 1 ? 'ies' : 'y'} — awaiting dispatch
            </span>
          </button>
        </div>

        {/* Overdue Deliveries — critical (red) */}
        <div className="do-alert-wrapper">
          <button
            className={`do-alert-row critical ${quickFilter === 'overdue' ? 'is-active' : ''}`}
            onClick={() => activateQuick('overdue')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{overdueCount}</strong>
              {' '}overdue deliver{overdueCount !== 1 ? 'ies' : 'y'} — delivery date passed, manager action needed
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE
          ===================================================== */}
      <div className="do-table-container">

        {/* Toolbar */}
        <div className="do-table-toolbar">

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="do-table-section-title">Deliveries List</span>
            <span className="do-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {quickFilter !== NO_QUICK && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            <div className="do-filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`do-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Filter by status"
              >
                <Filter size={14} />
                <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
              </button>

              {dropdownOpen && (
                <div className="do-filter-dropdown">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`do-dropdown-item ${statusFilter === opt && quickFilter === NO_QUICK ? 'selected' : ''}`}
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
                className="do-filter-icon-btn"
                onClick={() => { setQuickFilter(NO_QUICK); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

        {/* Scrollable table */}
        <div className="do-table-scroll-wrapper">
          <table className="do-deliveries-table">
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
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map(d => {
                const overdue  = isOverdue(d);
                const dueToday = isDeliveryToday(d);
                return (
                  <tr key={d.id}>

                    {/* 🔹 BACKEND: d.items — single name or "X + N more" */}
                    <td>
                      <span className="do-cake-name-text" title={fullCakeList(d.items)}>
                        {formatCakeType(d.items)}
                      </span>
                    </td>

                    {/* 🔹 BACKEND: d.totalQty */}
                    <td>{d.totalQty}</td>

                    {/* 🔹 BACKEND: d.totalPrice */}
                    <td><span className="do-price-text">₱{d.totalPrice.toLocaleString()}</span></td>

                    {/* 🔹 BACKEND: d.customer */}
                    <td>{d.customer}</td>

                    {/* 🔹 BACKEND: d.contact */}
                    <td><span className="do-contact-text">{d.contact}</span></td>

                    {/* 🔹 BACKEND: d.address — truncated in table, full on hover */}
                    <td>
                      <span className="do-address-text" title={d.address}>
                        {d.address}
                      </span>
                    </td>

                    {/* 🔹 BACKEND: d.deliveryDate — highlights if overdue or due today */}
                    <td>
                      <span className={`do-date-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : ''}`}>
                        {formatDate(d.deliveryDate)}
                      </span>
                    </td>

                    {/* 🔹 BACKEND: d.status — Rule 3 auto-overdue display */}
                    <td><StatusPill delivery={d} /></td>

                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="do-no-data">
                    No delivery orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="do-pagination">
          <span className="do-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="do-pagination-btns">
            <button className="do-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`do-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="do-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeliveryOverview;