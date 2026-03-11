// =============================================================
// salesOverview.jsx
// PURPOSE: Manager financial view — completed sales only.
//          Aggregates confirmed revenue from Deliveries,
//          Reservations, and Custom Orders.
// FILTERING: Date Filter (header calendar icon) + Breakdown Cards (clickable)
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
  CircleDollarSign, ShoppingCart, PackageCheck,
  Truck, CalendarCheck, ClipboardList,
  Calendar, ChevronDown,
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

/* ── Date Range Helpers ────────────────────────────────────── */

const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

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

/* ── Misc Helpers ──────────────────────────────────────────── */

const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

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

const PER_PAGE = 7;

const SalesOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace with fetched sales data
  // On mount: fetch from /api/sales, setSalesData(response.data)
  // -----------------------------------------------------------
  const [salesData, setSalesData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState(null);
  const [page,       setPage]       = useState(1);


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
  // DATE-SCOPED SALES
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => salesData.filter(s => inRange(s.completionDate, rangeStart, rangeEnd)),
    [salesData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS (from dateScoped)
  // -----------------------------------------------------------
  const totalRevenue      = dateScoped.reduce((sum, s) => sum + s.amount, 0);
  const totalTransactions = dateScoped.length;
  const totalCakesSold    = dateScoped.reduce((sum, s) => sum + s.qty, 0);

  const breakdown = useMemo(() => {
    const result = {};
    Object.keys(ORDER_TYPES).forEach(type => {
      result[type] = {
        amount: dateScoped.filter(s => s.orderType === type).reduce((sum, s) => sum + s.amount, 0),
        count:  dateScoped.filter(s => s.orderType === type).length,
      };
    });
    return result;
  }, [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA (dateScoped + typeFilter)
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!typeFilter) return dateScoped;
    return dateScoped.filter(s => s.orderType === typeFilter);
  }, [dateScoped, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
  function handleDateSelect(key) {
    setDateFilter(key);
    setTypeFilter(null);
    setPage(1);
    if (key !== 'custom') setDateDropOpen(false);
  }

  function handleBreakdownCard(type) {
    setTypeFilter(prev => prev === type ? null : type);
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
    // TODO: Backend - Fetch sales data on mount
    // Option A: Aggregate from module exports (current approach)
    //   setSalesData(buildSalesData());
    //
    // Option B: Direct API call (recommended for production)
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
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setPage(1); }, [typeFilter, dateFilter, customStart, customEnd]);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="so-page-container"><p>Loading sales data...</p></div>;
  if (error)   return <div className="so-page-container"><p>{error}</p></div>;

  return (
    <div className="so-page-container">

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="so-header">
        <div>
          <h1 className="so-title">Sales Overview</h1>
          <p className="so-subtitle">Completed transactions only — Delivered and Picked Up orders</p>
        </div>

        <div className="so-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`so-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by date range"
          >
            {/* ✅ Calendar icon — matches all other manager pages */}
            <Calendar size={16} strokeWidth={2} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="so-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`so-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}

              <div className="so-custom-range-section">
                <span className="so-custom-range-title">Custom Range</span>
                <label className="so-custom-label">From</label>
                <input
                  type="date"
                  className="so-date-input"
                  value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                />
                <label className="so-custom-label">To</label>
                <input
                  type="date"
                  className="so-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                />
                <button
                  className="so-apply-btn"
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
            className={`so-breakdown-card ${typeFilter === type ? 'is-active' : ''}`}
            onClick={() => handleBreakdownCard(type)}
          >
            <div className="so-breakdown-top">
              <Icon size={16} className={`so-breakdown-icon so-icon-${css}`} />
              <span className="so-breakdown-label">{label}</span>
            </div>
            <span className="so-breakdown-amount">
              ₱{(breakdown[type]?.amount || 0).toLocaleString()}
            </span>
            <span className="so-breakdown-subtext">
              {breakdown[type]?.count ?? 0} transaction{(breakdown[type]?.count ?? 0) !== 1 ? 's' : ''}
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
              {typeFilter && ` · ${typeFilter}`}
            </span>
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