// =============================================================
// salesOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager financial view — completed sales only.
//          Aggregates confirmed revenue from Deliveries,
//          Reservations, and Custom Orders.
//
// STRUCTURE mirrors reservationOverview.jsx exactly:
//   1. .so-page-container   → .ro-page-container
//   2. .so-header           → .ro-header
//   3. .so-metrics-row      → .ro-metrics-row  (3 cards)
//   4. .so-breakdown-row    → new: revenue-by-category cards
//   5. .so-table-container  → .ro-table-container (toolbar + table)
//
// SALES DEFINITION:
//   Delivery     → Status = 'Delivered'
//   Reservation  → Status = 'Picked Up'
//   Custom Order → Status = 'Completed'
//
//   ❌ Never include: Pending, Cancelled, Overdue, Not Picked Up
//
// BACKEND INTEGRATION CHECKLIST:
//   [ ] Replace mock INIT_SALES with aggregated API response
//   [ ] Each confirmed status change in other modules triggers
//       an automatic sales record here (Rule 4 pattern)
//   [ ] Add date range filter connected to backend query params
//   [ ] Add loading and error states after fetching
//   [ ] All metric values are derived — recalculate after fetch
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CircleDollarSign, ShoppingCart, PackageCheck, AlertTriangle, Filter,
  Truck, CalendarCheck, ClipboardList,
} from 'lucide-react';
import '../../styles/manager/salesOverview.css';

/* ──────────────────────────────────────────────────────────────
   ORDER TYPE CONFIG
   Maps each sale source to its display label, CSS key, and icon.
────────────────────────────────────────────────────────────── */
const ORDER_TYPES = {
  Delivery:      { label: 'Delivery',      css: 'delivery',     Icon: Truck },
  Reservation:   { label: 'Reservation',   css: 'reservation',  Icon: CalendarCheck },
  'Custom Order':{ label: 'Custom Order',  css: 'custom-order', Icon: ClipboardList },
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function orderTypePillClass(type) {
  return ORDER_TYPES[type]?.css || 'delivery';
}

/* ──────────────────────────────────────────────────────────────
   MOCK DATA
   🔹 BACKEND: Replace this entire array with an aggregated API
   response. Each record represents ONE completed sale transaction.

   Expected shape per sale record:
   {
     id,
     orderType: 'Delivery' | 'Reservation' | 'Custom Order',
     cakeType:  string,      // cake name (or "X + N more" for multi-item)
     qty:       number,      // total quantity sold in this transaction
     amount:    number,      // total paid amount (₱)
     customer:  string,      // customer full name
     completionDate: string, // YYYY-MM-DD
                             //   Delivery      → delivery date
                             //   Reservation   → pick-up date
                             //   Custom Order  → completion date
   }

   AUTO-POPULATION RULE:
   When status changes to Delivered / Picked Up / Completed in
   the respective module, a record is automatically created here.
────────────────────────────────────────────────────────────── */
const INIT_SALES = [
  // ── Deliveries (status = Delivered) ──────────────────────
  {
    id: 'SAL-001', orderType: 'Delivery',
    cakeType: 'Leche Flan Cake', qty: 1, amount: 1050,
    customer: 'Mr. & Mrs. Santos', completionDate: '2025-01-21',
  },
  {
    id: 'SAL-002', orderType: 'Delivery',
    cakeType: 'Chocolate Mousse Cake', qty: 1, amount: 1200,
    customer: 'Lara Diaz', completionDate: '2025-01-20',
  },
  {
    id: 'SAL-003', orderType: 'Delivery',
    cakeType: 'Ube Macapuno Cake + 2 more', qty: 3, amount: 2770,
    customer: 'Jose Cruz', completionDate: '2025-01-24',
  },

  // ── Reservations (status = Picked Up) ────────────────────
  {
    id: 'SAL-004', orderType: 'Reservation',
    cakeType: 'Red Velvet Cake', qty: 1, amount: 1100,
    customer: 'Maria Gomez', completionDate: '2025-01-21',
  },
  {
    id: 'SAL-005', orderType: 'Reservation',
    cakeType: 'Leche Flan Cake', qty: 1, amount: 1050,
    customer: 'Mr. & Mrs. Santos', completionDate: '2025-01-23',
  },

  // ── Custom Orders (status = Completed / Delivered) ────────
  {
    id: 'SAL-006', orderType: 'Custom Order',
    cakeType: 'Strawberry Anniversary Cake', qty: 1, amount: 1200,
    customer: 'Mr. & Mrs. Santos', completionDate: '2025-01-22',
  },
  {
    id: 'SAL-007', orderType: 'Custom Order',
    cakeType: 'Wedding Vanilla Cake', qty: 1, amount: 8000,
    customer: 'Jose & Maria Cruz', completionDate: '2025-01-24',
  },
  {
    id: 'SAL-008', orderType: 'Custom Order',
    cakeType: 'Red Velvet Baby Shower Cake', qty: 1, amount: 2200,
    customer: 'Lara Diaz', completionDate: '2025-01-20',
  },
  {
    id: 'SAL-012', orderType: 'Custom Order',
    cakeType: 'Ube Dedication Cake', qty: 2, amount: 1800,
    customer: 'Pedro Santos', completionDate: '2025-01-22',
  },
];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

// Filter options — Order Type filter only (no status filter needed;
// Sales only ever contains completed transactions)
const TYPE_OPTIONS = ['All', 'Delivery', 'Reservation', 'Custom Order'];

const PER_PAGE = 7;
const NO_QUICK = 'all';

const SalesOverview = () => {

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 BACKEND: Add state for fetched data, loading, error
  // const [salesData, setSalesData] = useState([]);
  // const [loading,   setLoading]   = useState(true);
  // const [error,     setError]     = useState(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: Replace INIT_SALES with salesData from state
  // -----------------------------------------------------------

  // Card 1: Total Sales Revenue — sum of all completed amounts
  const totalRevenue = useMemo(() =>
    INIT_SALES.reduce((sum, s) => sum + s.amount, 0),
  []);

  // Card 2: Total Transactions — count of completed records
  const totalTransactions = INIT_SALES.length;

  // Card 3: Total Cakes Sold — sum of all completed quantities
  const totalCakesSold = useMemo(() =>
    INIT_SALES.reduce((sum, s) => sum + s.qty, 0),
  []);

  // Revenue Breakdown — per order type
  const breakdown = useMemo(() => {
    const result = {};
    Object.keys(ORDER_TYPES).forEach(type => {
      result[type] = INIT_SALES
        .filter(s => s.orderType === type)
        .reduce((sum, s) => sum + s.amount, 0);
    });
    return result;
  }, []);


  // -----------------------------------------------------------
  // FILTER LOGIC
  // quickFilter (breakdown card click) takes priority over dropdown
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = INIT_SALES; // 🔹 BACKEND: swap to salesData

    // Quick filter from breakdown card click
    if (quickFilter !== NO_QUICK) {
      result = result.filter(s => s.orderType === quickFilter);
    } else if (typeFilter !== 'All') {
      result = result.filter(s => s.orderType === typeFilter);
    }

    return result;
  }, [quickFilter, typeFilter]);

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
    // 🔹 BACKEND: Fetch sales on mount
    // const fetchSales = async () => { ... };
    // fetchSales();

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
    <div className="so-page-container">

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="so-header">
        <h1 className="so-title">Sales Overview</h1>
        <p className="so-subtitle">Completed transactions only — Delivered, Picked Up, and Custom Order completions</p>
      </div>


      {/* =====================================================
          2. SUMMARY CARDS — 3 static display cards
          ===================================================== */}
      <div className="so-metrics-row">

        {/* Card 1: Total Sales Revenue */}
        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Sales Revenue</span>
            <CircleDollarSign className="so-green-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            {/* 🔹 BACKEND: salesData.reduce((sum, s) => sum + s.amount, 0) */}
            <span className="so-metric-value">₱{totalRevenue.toLocaleString()}</span>
            <span className="so-metric-subtext">All confirmed revenue</span>
          </div>
        </div>

        {/* Card 2: Total Transactions */}
        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Transactions</span>
            <ShoppingCart className="so-blue-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            {/* 🔹 BACKEND: salesData.length */}
            <span className="so-metric-value">{totalTransactions}</span>
            <span className="so-metric-subtext">Completed orders</span>
          </div>
        </div>

        {/* Card 3: Total Cakes Sold */}
        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Cakes Sold</span>
            <PackageCheck className="so-yellow-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            {/* 🔹 BACKEND: salesData.reduce((sum, s) => sum + s.qty, 0) */}
            <span className="so-metric-value">{totalCakesSold}</span>
            <span className="so-metric-subtext">
              {totalCakesSold === 1 ? 'Cake sold' : 'Cakes sold across all types'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. REVENUE BREAKDOWN — clickable category cards
          Each card filters the main table when clicked.
          ===================================================== */}
      <div className="so-breakdown-row">
        {Object.entries(ORDER_TYPES).map(([type, { label, css, Icon }]) => (
          <button
            key={type}
            className={`so-breakdown-card ${quickFilter === type ? 'is-active' : ''}`}
            onClick={() => activateQuick(type)}
          >
            <div className="so-breakdown-top">
              <Icon size={16} className={`so-breakdown-icon so-icon-${css}`} />
              <span className="so-breakdown-label">{label}</span>
            </div>
            <span className="so-breakdown-amount">
              ₱{(breakdown[type] || 0).toLocaleString()}
            </span>
            <span className="so-breakdown-subtext">
              {INIT_SALES.filter(s => s.orderType === type).length} transaction{INIT_SALES.filter(s => s.orderType === type).length !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. SALES TABLE — completed records only
          ===================================================== */}
      <div className="so-table-container">

        {/* Toolbar */}
        <div className="so-table-toolbar">

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="so-table-section-title">Sales Records</span>
            <span className="so-table-count-pill">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
              {(quickFilter !== NO_QUICK || typeFilter !== 'All') && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            <div className="so-filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`so-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Filter by order type"
              >
                <Filter size={14} />
                <span>{typeFilter === 'All' ? 'Filter' : typeFilter}</span>
              </button>

              {dropdownOpen && (
                <div className="so-filter-dropdown">
                  {TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`so-dropdown-item ${typeFilter === opt && quickFilter === NO_QUICK ? 'selected' : ''}`}
                      onClick={() => {
                        setTypeFilter(opt);
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

            {/* Clear quick filter */}
            {quickFilter !== NO_QUICK && (
              <button
                className="so-filter-icon-btn"
                onClick={() => { setQuickFilter(NO_QUICK); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

        {/* Scrollable table */}
        <div className="so-table-scroll-wrapper">
          <table className="so-sales-table">
            <thead>
              <tr>
                <th>Order Type</th>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Total Amount</th>
                <th>Customer Name</th>
                <th>Completion Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map(s => (
                <tr key={s.id}>

                  {/* 🔹 BACKEND: s.orderType */}
                  <td>
                    <span className={`so-type-pill ${orderTypePillClass(s.orderType)}`}>
                      {s.orderType}
                    </span>
                  </td>

                  {/* 🔹 BACKEND: s.cakeType */}
                  <td><span className="so-cake-name-text">{s.cakeType}</span></td>

                  {/* 🔹 BACKEND: s.qty */}
                  <td>{s.qty}</td>

                  {/* 🔹 BACKEND: s.amount */}
                  <td><span className="so-amount-text">₱{s.amount.toLocaleString()}</span></td>

                  {/* 🔹 BACKEND: s.customer */}
                  <td>{s.customer}</td>

                  {/* 🔹 BACKEND: s.completionDate
                      Delivery → delivery date
                      Reservation → pick-up date
                      Custom Order → completion date */}
                  <td>{formatDate(s.completionDate)}</td>

                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="so-no-data">
                    No sales records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="so-pagination">
          <span className="so-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="so-pagination-btns">
            <button className="so-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`so-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="so-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesOverview;