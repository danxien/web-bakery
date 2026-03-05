// =============================================================
// customOrders.jsx
// PURPOSE: Manager monitoring view for custom cake orders.
// FILTERING: Date Filter (header calendar icon) + Status Cards (clickable)
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
import { ShieldCheck, CircleDollarSign, ClipboardList, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/customOrders.css';

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

// Revenue is counted only when order is Picked Up
const REVENUE_STATUSES = ['Picked Up'];

const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const STATUS_CARDS = [
  { key: 'Pending',   label: 'Pending' },
  { key: 'Ready',     label: 'Ready' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'Overdue',   label: 'Overdue' },
  { key: 'Cancelled', label: 'Cancelled' },
];

/* ── Misc Helpers ──────────────────────────────────────────── */

function isOverdue(o) {
  return (
    new Date(o.pickupDate + 'T00:00:00') < TODAY &&
    o.status === 'Ready'
  );
}

function isDueToday(o) {
  return o.pickupDate === TODAY_STR && o.status === 'Ready';
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusPillClass(ds) {
  const map = {
    Pending:     'pending',
    Ready:       'ready',
    'Picked Up': 'picked-up',
    Cancelled:   'cancelled',
    Overdue:     'overdue',
  };
  return map[ds] || 'pending';
}

function StatusPill({ order }) {
  const ds = isOverdue(order) ? 'Overdue' : order.status;
  return <span className={`co-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   TODO: Backend - Export orders data for salesOverview.jsx
   Replace this mock array with the fetched API response.
   Expected shape per custom order:
   {
     cakeType:     string  — cake product name
     instructions: string  — special design notes
     quantity:     number
     price:        number  — total order price (₱)
     customer:     string
     contact:      string  — customer contact number
     orderDate:    string  — YYYY-MM-DD
     pickupDate:   string  — YYYY-MM-DD
     status:       'Pending' | 'Ready' | 'Picked Up' | 'Cancelled'
     createdBy:    string  — seller who created the order
     lastUpdated:  string  — timestamp string
     timeline:     [{ event: string, time: string, state: 'done' | 'current' | 'pending' }]
   }
────────────────────────────────────────────────────────────── */
export let INIT_ORDERS = [
  {
    cakeType:     'Custom Birthday Cake',
    instructions: 'Minimalist pink cake with gold lettering.',
    quantity:     1,
    price:        1500,
    customer:     'Kimberly Luceñada',
    contact:      '09123456789',
    orderDate:    '2026-03-06',
    pickupDate:   '2026-03-06',
    status:       'Pending',
    createdBy:    'staff',
    lastUpdated:  '2026-06-01T10:00:00',
    timeline:     [],
  },
];

/* ──────────────────────────────────────────────────────────────
   ORDER DETAIL MODAL
   Table shows: Cake Type · Qty · Price · Pick-Up Date · Status
   Modal shows: all of the above + Customer · Contact ·
                Order Date · Special Instructions
────────────────────────────────────────────────────────────── */
function OrderDetailModal({ order, onClose }) {
  const overdue  = isOverdue(order);
  const dueToday = isDueToday(order);

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

          {/* ── Section 1: Product ── */}
          <h3 className="co-modal-section-title">Product</h3>
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

          {/* ── Section 2: Customer ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Customer</h3>
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

          {/* ── Section 3: Schedule ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Schedule</h3>
          <div className="co-modal-info-grid">

            <div className="co-info-item">
              <span className="co-info-label">Order Date</span>
              <span className="co-info-value">{formatDate(order.orderDate)}</span>
            </div>

            <div className="co-info-item">
              <span className="co-info-label">Pick-Up Date</span>
              <span className="co-info-value" style={{
                color:      overdue ? '#fd7e14' : dueToday ? '#854d0e' : undefined,
                fontWeight: (overdue || dueToday) ? 700 : undefined,
              }}>
                {formatDate(order.pickupDate)}
                {overdue  && '  ⚠ Overdue'}
                {dueToday && '  ⚠ Due Today'}
              </span>
            </div>

          </div>

          {/* ── Section 4: Special Instructions ── */}
          <h3 className="co-modal-section-title" style={{ marginTop: 22 }}>Special Instructions / Design Notes</h3>
          <div className="co-modal-info-grid">
            <div className="co-info-item full-width">
              <span className="co-info-value instructions-val">{order.instructions}</span>
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
  // TODO: Backend - Replace INIT_ORDERS with fetched data
  // -----------------------------------------------------------
  const [ordersData, setOrdersData] = useState(INIT_ORDERS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
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
  // DATE-SCOPED ORDERS (filter by pickupDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => ordersData.filter(o => inRange(o.pickupDate, rangeStart, rangeEnd)),
    [ordersData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // -----------------------------------------------------------
  const totalOrders = dateScoped.length;

  const revenueTotal = dateScoped
    .filter(o => REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.price, 0);

  const pendingCount = dateScoped.filter(o => o.status === 'Pending').length;


  // -----------------------------------------------------------
  // STATUS CARD COUNTS
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, Ready: 0, 'Picked Up': 0, Overdue: 0, Cancelled: 0 };
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
    if (!statusFilter)              return dateScoped;
    if (statusFilter === 'Overdue') return dateScoped.filter(isOverdue);
    if (statusFilter === 'Ready')   return dateScoped.filter(o => o.status === 'Ready' && !isOverdue(o));
    return dateScoped.filter(o => o.status === statusFilter);
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
    // TODO: Backend - Fetch custom orders on mount
    // const fetchOrders = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/custom-orders');
    //     const data = await response.json();
    //     setOrdersData(data.orders);
    //     INIT_ORDERS = data.orders;
    //   } catch (err) {
    //     setError('Failed to load custom orders.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchOrders();
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
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="co-header">
        <div>
          <h1 className="co-title">Custom Orders</h1>
          <p className="co-subtitle">Monitor all custom cake orders and production status</p>
        </div>

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
          Visible columns: Cake Type · Qty · Price · Pick-Up Date · Status · Action
          Hidden from table (shown only in modal):
            Customer Name, Contact Number, Order Date, Special Instructions
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
              <col className="col-pickup" />
              <col className="col-status" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
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