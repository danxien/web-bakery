// =============================================================
// salesOverview.jsx
// PURPOSE: Manager financial view — completed sales only.
//          Aggregates confirmed revenue from:
//            Walk-In Orders, Reservations, and Custom Orders.
//
// SALES CONNECTION LOGIC:
//   Walk-In Order  → Status = 'Completed'  → Completion Date = orderDate
//   Reservation    → Status = 'Picked Up'  → Completion Date = pickupDate
//   Custom Order   → Status = 'Delivered'  → Completion Date = deliveryDate
//
//   NOT included:
//     - Stock Deliveries (internal stock tracking, not customer sales)
//     - Pending, Ready, Overdue, Cancelled orders from any module
//
// LIVE CONNECTION:
//   salesData is derived via useMemo from the three source module arrays
//   (INIT_WALKIN_ORDERS, INIT_RESERVATIONS, INIT_ORDERS). Each of those
//   modules exports a module-level ref that is synced after every fetch.
//   Any completed transaction recorded in those modules is automatically
//   reflected here — no manual refresh or event bus needed.
//
// FILTERING: Date Filter (header calendar icon) + Order Type Cards (clickable)
//
// EXPORT:
//   Export Report button (top-right, beside Date Filter).
//   Downloads a CSV file containing:
//     - Report metadata  (title, period)
//     - Summary          (total revenue, transactions, cakes sold)
//     - Revenue Breakdown (per order type)
//     - Sales Records    (one row per completed transaction)
//   All rows in dateScoped are exported — not just the current page.
//   All currency values use the format: PHP X,XXX
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CircleDollarSign, ShoppingCart, PackageCheck,
  CalendarCheck, ClipboardList, ShoppingBag,
  Calendar, ChevronDown, Download,
} from 'lucide-react';
import '../../styles/manager/salesOverview.css';

// TODO: Backend — Replace these three imports with a unified API call
//   to GET /api/sales?status=completed once the backend is ready.
//   Until then, each source module syncs its INIT_* export on fetch.
import { INIT_WALKIN_ORDERS } from './walkInOrders';
import { INIT_RESERVATIONS }  from './reservationOverview';
import { INIT_ORDERS }        from './customOrders';

/* ──────────────────────────────────────────────────────────────
   ORDER TYPE CONFIG
   3 sources only — Stock Deliveries are excluded from Sales
────────────────────────────────────────────────────────────── */
const ORDER_TYPES = {
  'Walk-In':      { label: 'Walk-In Orders', css: 'walk-in',      Icon: ShoppingBag },
  'Reservation':  { label: 'Reservations',   css: 'reservation',  Icon: CalendarCheck },
  'Custom Order': { label: 'Custom Orders',  css: 'custom-order', Icon: ClipboardList },
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
  return ORDER_TYPES[type]?.css || 'walk-in';
}

/* ──────────────────────────────────────────────────────────────
   CSV EXPORT
   Builds a structured CSV in-memory and triggers a file download.
   No external libraries required.

   Structure:
     Section 1 — Report Metadata   (title, period)
     Section 2 — Summary           (revenue, transactions, cakes sold)
     Section 3 — Revenue Breakdown (per order type)
     Section 4 — Sales Records     (one row per completed transaction)

   All currency values are formatted as "PHP X,XXX".

   TODO: Backend — dateScoped will be populated from
     GET /api/sales?status=completed&from=YYYY-MM-DD&to=YYYY-MM-DD
     No changes to this function are needed once the data source changes.
────────────────────────────────────────────────────────────── */

/**
 * Formats a numeric amount as a PHP currency string.
 * Example: 1250 → "PHP 1,250"
 */
function phpCurrency(amount) {
  return `PHP ${Number(amount).toLocaleString()}`;
}

/**
 * Escapes a single CSV cell per RFC 4180:
 * wraps in double-quotes if the value contains a comma, double-quote, or newline.
 * Internal double-quotes are escaped by doubling them.
 */
function escapeCSVCell(value) {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

/** Converts a 2-D array of rows into a RFC 4180-compliant CSV string. */
function buildCSV(rows) {
  return rows
    .map(row => row.map(escapeCSVCell).join(','))
    .join('\n');
}

/**
 * Composes the full report CSV and downloads it as a .csv file.
 *
 * @param {object} params
 * @param {string}   params.rangeStart        - ISO date string for period start
 * @param {string}   params.rangeEnd          - ISO date string for period end
 * @param {Array}    params.dateScoped        - All sales records in the date range
 * @param {number}   params.totalRevenue      - Sum of all amounts in dateScoped
 * @param {number}   params.totalTransactions - Count of rows in dateScoped
 * @param {number}   params.totalCakesSold    - Sum of qty in dateScoped
 * @param {object}   params.breakdown         - Per-type { amount, count } keyed by ORDER_TYPES key
 */
function exportSalesCSV({
  rangeStart, rangeEnd,
  dateScoped, totalRevenue, totalTransactions, totalCakesSold, breakdown,
}) {
  const period = rangeStart === rangeEnd
    ? formatDate(rangeStart)
    : `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;

  const rows = [
    // ── Section 1: Report Metadata ──────────────────────────
    ['SALES REPORT'],
    ['Period', period],
    [],

    // ── Section 2: Summary ──────────────────────────────────
    ['SUMMARY'],
    ['Metric',               'Value'],
    ['Total Sales Revenue',  phpCurrency(totalRevenue)],
    ['Total Transactions',   totalTransactions],
    ['Total Cakes Sold',     totalCakesSold],
    [],

    // ── Section 3: Revenue Breakdown ────────────────────────
    ['REVENUE BREAKDOWN'],
    ['Order Type',     'Sales Revenue',                                    'Transactions'],
    ['Walk-In Orders', phpCurrency(breakdown['Walk-In']?.amount      || 0), breakdown['Walk-In']?.count      ?? 0],
    ['Reservations',   phpCurrency(breakdown['Reservation']?.amount  || 0), breakdown['Reservation']?.count  ?? 0],
    ['Custom Orders',  phpCurrency(breakdown['Custom Order']?.amount || 0), breakdown['Custom Order']?.count ?? 0],
    [],

    // ── Section 4: Sales Records ─────────────────────────────
    ['SALES RECORDS'],
    ['Order Type', 'Cake Type', 'Qty', 'Amount (PHP)', 'Customer', 'Completion Date'],
    ...(
      dateScoped.length > 0
        ? dateScoped.map(s => [
            s.orderType,
            s.cakeType,
            s.qty,
            phpCurrency(s.amount),
            s.customer,
            formatDate(s.completionDate),
          ])
        : [['No sales records for the selected period.', '', '', '', '', '']]
    ),
  ];

  const csv  = buildCSV(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `SalesReport_${rangeStart}_to_${rangeEnd}`.replace(/-/g, '') + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const PER_PAGE = 7;

const SalesOverview = () => {

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
  // LIVE SALES DATA
  // Derived directly from the three source module arrays on every render.
  //
  // Completion rules per channel:
  //   Walk-In     → status === 'Completed'  → completionDate = orderDate
  //   Reservation → status === 'Picked Up'  → completionDate = pickupDate
  //   Custom      → status === 'Delivered'  → completionDate = deliveryDate
  //
  // TODO: Backend — Remove this useMemo and replace with a fetch/websocket:
  //   const [salesData, setSalesData] = useState([]);
  //   useEffect(() => { fetch('/api/sales?status=completed')
  //     .then(r => r.json()).then(d => setSalesData(d.records)); }, []);
  // -----------------------------------------------------------
  const salesData = useMemo(() => {

    // TODO: Backend will provide completed transactions here
    return [

      // Walk-In Orders — Completed → completionDate = orderDate
      ...INIT_WALKIN_ORDERS
        .filter(w => w.status === 'Completed')
        .map(w => ({
          orderType:      'Walk-In',
          cakeType:       w.cakeType,
          qty:            w.quantity,
          amount:         w.price,
          customer:       w.customer,
          completionDate: w.orderDate,
        })),

      // Reservations — Picked Up → completionDate = pickupDate
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

      // Custom Orders — Delivered → completionDate = deliveryDate
      ...INIT_ORDERS
        .filter(o => o.status === 'Delivered')
        .map(o => ({
          orderType:      'Custom Order',
          cakeType:       o.cakeType,
          qty:            o.quantity,
          amount:         o.price,
          customer:       o.customer,
          completionDate: o.deliveryDate,
        })),

    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // -----------------------------------------------------------
  // DATE-SCOPED SALES (filter by completionDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => salesData.filter(s => inRange(s.completionDate, rangeStart, rangeEnd)),
    [salesData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // -----------------------------------------------------------
  const totalRevenue      = dateScoped.reduce((sum, s) => sum + s.amount, 0);
  const totalTransactions = dateScoped.length;
  const totalCakesSold    = dateScoped.reduce((sum, s) => sum + s.qty, 0);

  const breakdown = useMemo(() => {
    const result = {};
    Object.keys(ORDER_TYPES).forEach(type => {
      const rows = dateScoped.filter(s => s.orderType === type);
      result[type] = {
        amount: rows.reduce((sum, s) => sum + s.amount, 0),
        count:  rows.length,
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

  function handleExport() {
    exportSalesCSV({
      rangeStart, rangeEnd,
      dateScoped,
      totalRevenue, totalTransactions, totalCakesSold,
      breakdown,
    });
  }


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // salesData is derived live via useMemo from the INIT_* bridges.
    // TODO: Backend — Replace with fetch('/api/sales?status=completed')
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
          1. HEADER — title left · [ Date Filter ] [ Export Report ] right
          ===================================================== */}
      <div className="so-header">
        <div>
          <h1 className="so-title">Sales Overview</h1>
          <p className="so-subtitle">Completed transactions only — Walk-In, Reservations, and Custom Orders</p>
        </div>

        <div className="so-header-actions">

          {/* Date Filter dropdown */}
          <div className="so-filter-dropdown-wrapper" ref={dateDropRef}>
            <button
              className={`so-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
              onClick={() => setDateDropOpen(p => !p)}
              title="Filter by date range"
            >
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

          {/* Export Report button */}
          <button
            className="so-export-btn"
            onClick={handleExport}
            title="Download current view as CSV"
          >
            <Download size={15} strokeWidth={2} />
            <span>Export Report</span>
          </button>

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
          3. REVENUE BREAKDOWN — 3 clickable filter cards
          (Walk-In · Reservations · Custom Orders)
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
          Columns: Order Type · Cake Type · Qty · Total Amount ·
                   Customer · Completion Date
          ===================================================== */}
      <div className="so-table-container">

        <div className="so-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="so-table-section-title">Sales Records</span>
            <span className="so-table-count-pill">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
              {typeFilter && ` · ${ORDER_TYPES[typeFilter]?.label || typeFilter}`}
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
                <th>Customer</th>
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