// =============================================================
// salesOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager financial view — completed sales only.
//          Aggregates confirmed revenue from Deliveries,
//          Reservations, and Custom Orders.
//
// SALES DEFINITION:
//   Delivery     → Status = 'Delivered'
//   Reservation  → Status = 'Picked Up'
//   Custom Order → Status = 'Picked Up'
//
//   Never include: Pending, Cancelled, Overdue, Ready,
//                  Out for Delivery, Not Picked Up
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CircleDollarSign, ShoppingCart, PackageCheck, Filter,
  Truck, CalendarCheck, ClipboardList,
} from 'lucide-react';
import '../../styles/manager/salesOverview.css';

// TODO: Backend - Replace these imports with a unified API call
// These exported arrays are populated after fetching in each module.
// Alternatively, use a single endpoint: GET /api/sales?status=completed
import { INIT_DELIVERIES }   from './deliveriesOverview';
import { INIT_RESERVATIONS } from './reservationOverview';
import { INIT_ORDERS }       from './customOrders';

/* ──────────────────────────────────────────────────────────────
   ORDER TYPE CONFIG
────────────────────────────────────────────────────────────── */
const ORDER_TYPES = {
  Delivery:       { label: 'Delivery',     css: 'delivery',     Icon: Truck },
  Reservation:    { label: 'Reservation',  css: 'reservation',  Icon: CalendarCheck },
  'Custom Order': { label: 'Custom Order', css: 'custom-order', Icon: ClipboardList },
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
   AGGREGATED SALES DATA
   TODO: Backend - Replace this derived array with a direct API call
   Endpoint: GET /api/sales?status=completed
   Each record should already be in the unified shape below.

   Unified shape per record:
   {
     orderType:      'Delivery' | 'Reservation' | 'Custom Order'
     cakeType:       string   — cake name
     qty:            number   — total quantity sold
     amount:         number   — total paid amount (₱)
     customer:       string
     completionDate: string   — YYYY-MM-DD when finalized
   }
────────────────────────────────────────────────────────────── */
const buildSalesData = () => [

  // Deliveries: only status === 'Delivered'
  ...INIT_DELIVERIES
    .filter(d => d.status === 'Delivered')
    .map(d => ({
      orderType:      'Delivery',
      cakeType:       d.items.length === 1
                        ? d.items[0].name
                        : `${d.items[0].name} + ${d.items.length - 1} more`,
      qty:            d.totalQty,
      amount:         d.totalPrice,
      customer:       d.customer,
      completionDate: d.deliveryDate,
    })),

  // Reservations: only status === 'Picked Up'
  ...INIT_RESERVATIONS
    .filter(r => r.status === 'Picked Up')
    .map(r => ({
      orderType:      'Reservation',
      cakeType:       r.cakeType,
      qty:            r.quantity,
      amount:         r.quantity * r.price,
      customer:       r.customer,
      completionDate: r.pickupDate,
    })),

  // Custom Orders: only status === 'Picked Up'
  ...INIT_ORDERS
    .filter(o => o.status === 'Picked Up')
    .map(o => ({
      orderType:      'Custom Order',
      cakeType:       o.cakeType,
      qty:            o.quantity,
      amount:         o.price,
      customer:       o.customer,
      completionDate: o.pickupDate,
    })),
];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const TYPE_OPTIONS = ['All', 'Delivery', 'Reservation', 'Custom Order'];

const PER_PAGE = 7;
const NO_QUICK = 'all';

const SalesOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace with fetched sales data
  // On mount: fetch from /api/sales, setSalesData(response.data)
  // -----------------------------------------------------------
  const [salesData,    setSalesData]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [typeFilter,   setTypeFilter]   = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // TODO: Backend - All values are derived from salesData
  // -----------------------------------------------------------
  const totalRevenue      = salesData.reduce((sum, s) => sum + s.amount, 0);
  const totalTransactions = salesData.length;
  const totalCakesSold    = salesData.reduce((sum, s) => sum + s.qty, 0);

  const breakdown = (() => {
    const result = {};
    Object.keys(ORDER_TYPES).forEach(type => {
      result[type] = salesData
        .filter(s => s.orderType === type)
        .reduce((sum, s) => sum + s.amount, 0);
    });
    return result;
  })();


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = salesData;

    if (quickFilter !== NO_QUICK) {
      result = result.filter(s => s.orderType === quickFilter);
    } else if (typeFilter !== 'All') {
      result = result.filter(s => s.orderType === typeFilter);
    }

    return result;
  }, [quickFilter, typeFilter, salesData]);

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
    // TODO: Backend - Fetch sales data on mount
    // Option A: Aggregate from module exports (current approach)
    //   setSalesData(buildSalesData());
    //
    // Option B: Direct API call (recommended for production)
    // Example:
    // const fetchSales = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/sales?status=completed');
    //     const data = await response.json();
    //     setSalesData(data.sales);
    //   } catch (err) {
    //     setError('Failed to load sales data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchSales();
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
  if (loading) return <div className="so-page-container"><p>Loading sales data...</p></div>;
  if (error)   return <div className="so-page-container"><p>{error}</p></div>;

  return (
    <div className="so-page-container">

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="so-header">
        <h1 className="so-title">Sales Overview</h1>
        <p className="so-subtitle">Completed transactions only — Delivered and Picked Up orders</p>
      </div>


      {/* =====================================================
          2. SUMMARY CARDS
          ===================================================== */}
      <div className="so-metrics-row">

        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Sales Revenue</span>
            <CircleDollarSign className="so-green-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            <span className="so-metric-value">₱{totalRevenue.toLocaleString()}</span>
            <span className="so-metric-subtext">All confirmed revenue</span>
          </div>
        </div>

        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Transactions</span>
            <ShoppingCart className="so-blue-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            <span className="so-metric-value">{totalTransactions}</span>
            <span className="so-metric-subtext">Completed orders</span>
          </div>
        </div>

        <div className="so-metric-card">
          <div className="so-card-top">
            <span className="so-metric-label">Total Cakes Sold</span>
            <PackageCheck className="so-yellow-icon" size={20} />
          </div>
          <div className="so-card-bottom">
            <span className="so-metric-value">{totalCakesSold}</span>
            <span className="so-metric-subtext">
              {totalCakesSold === 1 ? 'Cake sold' : 'Cakes sold across all types'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. REVENUE BREAKDOWN — clickable category cards
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
              {salesData.filter(s => s.orderType === type).length} transaction{salesData.filter(s => s.orderType === type).length !== 1 ? 's' : ''}
            </span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. SALES TABLE
          ===================================================== */}
      <div className="so-table-container">

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
              {paged.length > 0 ? paged.map((s, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`so-type-pill ${orderTypePillClass(s.orderType)}`}>
                      {s.orderType}
                    </span>
                  </td>
                  <td><span className="so-cake-name-text">{s.cakeType}</span></td>
                  <td>{s.qty}</td>
                  <td><span className="so-amount-text">₱{s.amount.toLocaleString()}</span></td>
                  <td>{s.customer}</td>
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