// =============================================================
// customOrders.jsx
// PURPOSE: Manager monitoring view for custom cake orders.
// FILTERING: Date Filter (header calendar icon) + Status Cards (clickable)
//
// STATUS LOGIC (Delivery-Based):
//   Pending          → Order placed, not yet prepared
//   Out for Delivery → Cake prepared and currently being delivered
//   Delivered        → Successfully delivered to customer ✓ SALES
//   Overdue          → Auto: Today > DeliveryDate AND status !== 'Delivered' | 'Cancelled'
//   Cancelled        → Final state
//
// WORKFLOW:
//   Pending → Out for Delivery → Delivered
//   Pending → Cancelled
//   Out for Delivery → Overdue → Delivered | Cancelled
//
// SALES CONNECTION:
//   IF status === 'Delivered' → transaction is included in salesOverview.jsx
//   salesOverview reads INIT_ORDERS and filters by status === 'Delivered'
//   (completionDate = deliveryDate)
//
// EXPORT:
//   Export Report button (top-right, beside Date Filter).
//   Downloads a CSV file containing:
//     - Report metadata  (title, period)
//     - Summary          (total orders, revenue, cakes delivered)
//     - Orders Records   (one row per order in the date range)
//   All rows in dateScoped are exported — not just the current page.
//   All currency values use the format: PHP X,XXX
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShieldCheck, CircleDollarSign, PackageCheck, Calendar, ChevronDown, Download } from 'lucide-react';
import '../../styles/manager/customOrders.css';

// TODO: Backend - Replace with: const TODAY = new Date(); const TODAY_STR = TODAY.toISOString().split('T')[0];
//
// NOTE: TODAY is pinned to 2026-03-10 to stay consistent with all other
//       overview pages, which share the same "This Week" window
//       (Mar 8–14, 2026). The Overdue mock entry requires deliveryDate < TODAY,
//       so Mar 9 is used for that record. Restore `new Date()` once live
//       data is connected.
const TODAY     = new Date('2026-03-13T00:00:00');
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

const STATUS_CARDS = [
  { key: 'Pending',          label: 'Pending' },
  { key: 'Out for Delivery', label: 'Out for Delivery' },
  { key: 'Delivered',        label: 'Delivered' },
  { key: 'Overdue',          label: 'Overdue' },
  { key: 'Cancelled',        label: 'Cancelled' },
];

/* ── Misc Helpers ──────────────────────────────────────────── */

function isOverdue(o) {
  return (
    new Date(o.deliveryDate + 'T00:00:00') < TODAY &&
    o.status !== 'Delivered' &&
    o.status !== 'Cancelled'
  );
}

function isDueToday(o) {
  return (
    o.deliveryDate === TODAY_STR &&
    o.status !== 'Delivered' &&
    o.status !== 'Cancelled'
  );
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusPillClass(ds) {
  const map = {
    Pending:            'pending',
    'Out for Delivery': 'out-for-delivery',
    Delivered:          'delivered',
    Cancelled:          'cancelled',
    Overdue:            'overdue',
  };
  return map[ds] || 'pending';
}

function StatusPill({ order }) {
  const ds = isOverdue(order) ? 'Overdue' : order.status;
  return <span className={`co-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   CSV EXPORT
   Builds a structured CSV in-memory and triggers a file download.
   No external libraries required.

   Structure:
     Section 1 — Report Metadata   (title, period)
     Section 2 — Summary           (total orders, revenue, cakes delivered)
     Section 3 — Orders Records    (one row per order in the date range)

   All currency values are formatted as "PHP X,XXX".
   Status column uses the resolved display value (Overdue shown where applicable).

   TODO: Backend — dateScoped will be populated from
     GET /api/custom-orders&from=YYYY-MM-DD&to=YYYY-MM-DD
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
 * Composes the full Custom Orders report CSV and downloads it as a .csv file.
 *
 * @param {object} params
 * @param {string}   params.rangeStart          - ISO date string for period start
 * @param {string}   params.rangeEnd            - ISO date string for period end
 * @param {Array}    params.dateScoped          - All orders in the date range
 * @param {number}   params.totalOrders         - Count of rows in dateScoped
 * @param {number}   params.revenueTotal        - Sum of delivered order prices
 * @param {number}   params.totalCakesDelivered - Sum of qty for delivered orders
 */
function exportCustomOrdersCSV({
  rangeStart, rangeEnd,
  dateScoped, totalOrders, revenueTotal, totalCakesDelivered,
}) {
  const period = rangeStart === rangeEnd
    ? formatDate(rangeStart)
    : `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`;

  const rows = [
    // ── Section 1: Report Metadata ──────────────────────────
    ['CUSTOM ORDERS REPORT'],
    ['Period', period],
    [],

    // ── Section 2: Summary ──────────────────────────────────
    ['SUMMARY'],
    ['Metric',                'Value'],
    ['Total Custom Orders',   totalOrders],
    ['Custom Order Revenue',  phpCurrency(revenueTotal)],
    ['Total Cakes Delivered', totalCakesDelivered],
    [],

    // ── Section 3: Orders Records ────────────────────────────
    // Status uses the resolved display value so Overdue is shown where applicable.
    // Includes all order fields: product, fulfillment, customer, and delivery details.
    ['ORDERS RECORDS'],
    [
      'Cake Type', 'Quantity', 'Price (PHP)', 'Status',
      'Customer Name', 'Contact Number',
      'Order Date', 'Delivery Date', 'Delivery Address', 'Special Instructions',
    ],
    ...(
      dateScoped.length > 0
        ? dateScoped.map(o => [
            o.cakeType,
            o.quantity,
            phpCurrency(o.price),
            isOverdue(o) ? 'Overdue' : o.status,
            o.customer,
            o.contact      || '',
            formatDate(o.orderDate),
            formatDate(o.deliveryDate),
            o.address      || '',
            o.instructions || '',
          ])
        : [['No orders for the selected period.', '', '', '', '', '', '', '', '', '']]
    ),
  ];

  const csv  = buildCSV(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `CustomOrdersReport_${rangeStart}_to_${rangeEnd}`.replace(/-/g, '') + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


/* ──────────────────────────────────────────────────────────────
   SHARED DATA BRIDGE — consumed by salesOverview.jsx
   salesOverview reads this array and filters by status === 'Delivered'
   to compute Custom Order Sales Revenue (completionDate = deliveryDate).

   TODO: Backend — Remove this export once salesOverview.jsx
   fetches sales data independently via GET /api/sales.
   On mount (see useEffect below), populate via GET /api/custom-orders
   and sync: INIT_ORDERS = data.orders

   Expected shape per record:
   {
     cakeType:     string  — cake product name
     instructions: string  — special design/delivery notes
     quantity:     number
     price:        number  — total order price (₱)
     customer:     string
     contact:      string  — customer contact number
     address:      string  — delivery address
     orderDate:    string  — YYYY-MM-DD
     deliveryDate: string  — YYYY-MM-DD (Sales completionDate)
     status:       'Pending' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
     createdBy:    string  — seller who created the order
     lastUpdated:  string  — timestamp string
   }
────────────────────────────────────────────────────────────── */

// TODO: Backend — Remove MOCK_ORDERS and the spread below once
//   GET /api/custom-orders is live. On mount, populate via:
//   INIT_ORDERS = data.orders
//
// One entry per status, all delivery dates within Mar 8–14, 2026
// (relative to pinned TODAY = Mar 10). Address set to San Pablo City
// for all entries.
//
// Delivery date strategy vs TODAY (Mar 10):
//   Pending          → Mar 13  (future, status Pending)
//   Out for Delivery → Mar 12  (future, status Out for Delivery → not overdue)
//   Delivered        → Mar 11  (status Delivered, exempt from overdue check)
//   Overdue          → Mar 09  (past, status Out for Delivery → isOverdue() = true)
//   Cancelled        → Mar 14  (status Cancelled, exempt from overdue check)
const MOCK_ORDERS = [
  {
    cakeType:     'Mocha Crunch Cake',
    instructions: 'Write "Congratulations" on top. Dark chocolate drizzle.',
    quantity:     1,
    price:        580,
    customer:     'Dan Exconde',
    contact:      '09171234567',
    address:      'San Pablo City',
    orderDate:    '2026-03-08',
    deliveryDate: '2026-03-13',
    status:       'Pending',
    createdBy:    'Store',
    lastUpdated:  '2026-03-08T09:00:00',
  },
  {
    cakeType:     'Lemon Blueberry Cake',
    instructions: 'Extra blueberry glaze. Handle with care.',
    quantity:     1,
    price:        620,
    customer:     'Kimberly Luceñada',
    contact:      '09182345678',
    address:      'San Pablo City',
    orderDate:    '2026-03-08',
    deliveryDate: '2026-03-12',
    status:       'Out for Delivery',
    createdBy:    'Store',
    lastUpdated:  '2026-03-12T08:30:00',
  },
  {
    cakeType:     'Cookies and Cream Cake',
    instructions: 'No special instructions.',
    quantity:     2,
    price:        1100,
    customer:     'Ice Garcia',
    contact:      '09193456789',
    address:      'San Pablo City',
    orderDate:    '2026-03-07',
    deliveryDate: '2026-03-11',
    status:       'Delivered',
    createdBy:    'Store',
    lastUpdated:  '2026-03-11T14:00:00',
  },
  {
    // Overdue: status is 'Out for Delivery' but deliveryDate is before TODAY (Mar 10)
    // isOverdue() will return true and render the 'Overdue' pill.
    cakeType:     'Choco Fudge Cake',
    instructions: 'Deliver between 10AM–12PM. Call customer upon arrival.',
    quantity:     1,
    price:        540,
    customer:     'Justin Arron Soriano',
    contact:      '09204567890',
    address:      'San Pablo City',
    orderDate:    '2026-03-07',
    deliveryDate: '2026-03-09',
    status:       'Out for Delivery',
    createdBy:    'Store',
    lastUpdated:  '2026-03-09T07:45:00',
  },
  {
    cakeType:     'Vanilla Bean Cake',
    instructions: '',
    quantity:     1,
    price:        460,
    customer:     'Charlot Raza',
    contact:      '09215678901',
    address:      'San Pablo City',
    orderDate:    '2026-03-08',
    deliveryDate: '2026-03-14',
    status:       'Cancelled',
    createdBy:    'Store',
    lastUpdated:  '2026-03-09T10:00:00',
  },
];

export let INIT_ORDERS = [...MOCK_ORDERS];

/* ──────────────────────────────────────────────────────────────
   ORDER DETAIL MODAL
────────────────────────────────────────────────────────────── */
function OrderDetailModal({ order, onClose }) {
  return (
    <div className="co-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="co-modal">

        <div className="co-modal-header">
          <div>
            <p className="co-modal-eyebrow">Custom Order Details</p>
            <h2 className="co-modal-cake-name">{order.cakeType}</h2>
          </div>
          <button className="co-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="co-modal-body">

          {/* ── Section 1: Order Information ── */}
          <h3 className="co-modal-section-title">Order Information</h3>
          <div className="co-modal-info-grid">

            <div className="co-info-item">
              <span className="co-info-label">Cake Type</span>
              <span className="co-info-value">{order.cakeType}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Quantity</span>
              <span className="co-info-value">{order.quantity} pc{order.quantity > 1 ? 's' : ''}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Total Price</span>
              <span className="co-info-value price-val">₱{order.price.toLocaleString()}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Status</span>
              <span className="co-info-value"><StatusPill order={order} /></span>
            </div>

          </div>

          {/* ── Section 2: Customer Information ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Customer Information</h3>
          <div className="co-modal-info-grid">

            <div className="co-info-item">
              <span className="co-info-label">Customer Name</span>
              <span className="co-info-value">{order.customer}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Contact Number</span>
              <span className="co-info-value">{order.contact || '—'}</span>
            </div>

          </div>

          {/* ── Section 3: Delivery Information ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Delivery Information</h3>
          <div className="co-modal-info-grid">

            <div className="co-info-item">
              <span className="co-info-label">Order Date</span>
              <span className="co-info-value">{formatDate(order.orderDate)}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Delivery Date</span>
              <span className="co-info-value">{formatDate(order.deliveryDate)}</span>
            </div>

            <div className="co-info-item full-width">
              <span className="co-info-label">Delivery Address</span>
              <span className="co-info-value instructions-val">{order.address || 'No address provided.'}</span>
            </div>

          </div>

          {/* ── Section 4: Special Instructions ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Special Instructions / Design Notes</h3>
          <div className="co-modal-info-grid">
            <div className="co-info-item full-width">
              <span className="co-info-value instructions-val">
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

const CustomOrders = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend — Replace initial MOCK_ORDERS spread with []
  //   and populate from GET /api/custom-orders in useEffect below.
  // -----------------------------------------------------------
  const [ordersData, setOrdersData] = useState([...MOCK_ORDERS]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Default to 'week' so the This Week range (Mar 8–14, 2026) is
  // active on first render and all five mock entries are visible.
  // TODO: Backend — Restore to 'today' or user-preference once live data is wired.
  const [dateFilter,   setDateFilter]   = useState('week');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [page,         setPage]         = useState(1);
  const [modalOrder,   setModalOrder]   = useState(null);


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
  // DATE-SCOPED ORDERS (filter by deliveryDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => ordersData.filter(o => inRange(o.deliveryDate, rangeStart, rangeEnd)),
    [ordersData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // Revenue: Delivered orders only (feeds salesOverview).
  // -----------------------------------------------------------
  const totalOrders = dateScoped.length;

  const revenueTotal = dateScoped
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.price, 0);

  const totalCakesDelivered = dateScoped
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.quantity, 0);


  // -----------------------------------------------------------
  // STATUS CARD COUNTS
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, 'Out for Delivery': 0, Delivered: 0, Overdue: 0, Cancelled: 0 };
    dateScoped.forEach(o => {
      if (isOverdue(o))            counts.Overdue++;
      else if (o.status in counts) counts[o.status]++;
    });
    return counts;
  }, [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!statusFilter)                       return dateScoped;
    if (statusFilter === 'Overdue')          return dateScoped.filter(isOverdue);
    if (statusFilter === 'Out for Delivery') return dateScoped.filter(o => o.status === 'Out for Delivery' && !isOverdue(o));
    return dateScoped.filter(o => o.status === statusFilter && !isOverdue(o));
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

  function handleExport() {
    exportCustomOrdersCSV({
      rangeStart, rangeEnd,
      dateScoped,
      totalOrders, revenueTotal, totalCakesDelivered,
    });
  }


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend — Fetch custom orders on mount:
    //
    // const load = async () => {
    //   try {
    //     setLoading(true);
    //     const res  = await fetch('/api/custom-orders');
    //     const data = await res.json();
    //     setOrdersData(data.orders);
    //     INIT_ORDERS = data.orders; // sync bridge for salesOverview
    //   } catch (err) {
    //     setError('Failed to load custom orders.');
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

  useEffect(() => { setPage(1); }, [statusFilter, dateFilter, customStart, customEnd]);


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
          1. HEADER — title left · [ Date Filter ] [ Export Report ] right
          ===================================================== */}
      <div className="co-header">
        <div>
          <h1 className="co-title">Custom Orders</h1>
          <p className="co-subtitle">Monitor all custom cake orders and delivery status</p>
        </div>

        <div className="co-header-actions">

          {/* Date Filter dropdown */}
          <div className="co-filter-dropdown-wrapper" ref={dateDropRef}>
            <button
              className={`co-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
              onClick={() => setDateDropOpen(p => !p)}
              title="Filter by date range"
            >
              <Calendar size={16} strokeWidth={2} color="currentColor" />
              <span>{dateLabel}</span>
              <ChevronDown size={12} />
            </button>

            {dateDropOpen && (
              <div className="co-date-dropdown">
                {DATE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    className={`co-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}

                <div className="co-custom-range-section">
                  <span className="co-custom-range-title">Custom Range</span>
                  <label className="co-custom-label">From</label>
                  <input
                    type="date"
                    className="co-date-input"
                    value={customStart}
                    onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                  />
                  <label className="co-custom-label">To</label>
                  <input
                    type="date"
                    className="co-date-input"
                    value={customEnd}
                    min={customStart}
                    onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                  />
                  <button
                    className="co-apply-btn"
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
            className="co-export-btn"
            onClick={handleExport}
            title="Download current view as CSV"
          >
            <Download size={15} strokeWidth={2} />
            <span>Export Report</span>
          </button>

        </div>
      </div>


      {/* =====================================================
          2. SUMMARY METRIC CARDS
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
            <span className="co-metric-label">Custom Order Revenue</span>
            <CircleDollarSign className="co-green-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">₱{revenueTotal.toLocaleString()}</span>
            <span className="co-metric-subtext">Delivered orders only</span>
          </div>
        </div>

        <div className="co-metric-card">
          <div className="co-card-top">
            <span className="co-metric-label">Total Cakes Delivered</span>
            <PackageCheck className="co-yellow-icon" size={20} />
          </div>
          <div className="co-card-bottom">
            <span className="co-metric-value">{totalCakesDelivered}</span>
            <span className="co-metric-subtext">
              {totalCakesDelivered === 1 ? 'Cake successfully delivered' : 'Cakes successfully delivered'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. STATUS CARDS (Clickable Filters)
          ===================================================== */}
      <div className="co-status-cards-row">
        {STATUS_CARDS.map(card => (
          <button
            key={card.key}
            className={`co-status-card co-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
          >
            <span className="co-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="co-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. ORDERS TABLE
          Visible columns: Cake Type · Qty · Price · Delivery Date · Status · Action
          Hidden from table (shown only in modal):
            Customer Name, Contact Number, Order Date,
            Delivery Address, Special Instructions
          ===================================================== */}
      <div className="co-table-container">

        <div className="co-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="co-table-section-title">Orders List</span>
            <span className="co-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>
        </div>

        <div className="co-table-scroll-wrapper">
          <table className="co-orders-table">
            <colgroup>
              <col className="col-cake" />
              <col className="col-qty" />
              <col className="col-price" />
              <col className="col-delivery" />
              <col className="col-status" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Delivery Date</th>
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
                    <td>
                      <span className={`co-delivery-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : ''}`}>
                        {formatDate(order.deliveryDate)}
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
                  <td colSpan={6} className="co-no-data">
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