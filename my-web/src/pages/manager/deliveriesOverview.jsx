// =============================================================
// deliveriesOverview.jsx
// PURPOSE: Manager monitoring view for customer delivery orders.
// FILTERING: Date Filter (header calendar icon) + Status Cards (clickable)
//
// STATUS LOGIC (Operational-Based):
//   Pending          → Order placed, not yet dispatched
//   Out for Delivery → Currently in transit
//   Delivered        → Customer received order, complete
//   Overdue          → Auto: Today > DeliveryDate AND status !== 'Delivered' | 'Cancelled'
//   Cancelled        → Final state
//
// WORKFLOW:
//   Pending → Out for Delivery → Delivered
//   Pending → Cancelled
//   Out for Delivery → Overdue → Delivered | Cancelled
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Truck, CircleDollarSign, PackageCheck, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/deliveriesOverview.css';

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

// Revenue counted for all active statuses (excluding Cancelled)
const REVENUE_STATUSES = ['Pending', 'Out for Delivery', 'Delivered'];

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

function isOverdue(d) {
  return (
    new Date(d.deliveryDate + 'T00:00:00') < TODAY &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
  );
}

function isDueToday(d) {
  return (
    d.deliveryDate === TODAY_STR &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
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
    Overdue:            'overdue',
    Cancelled:          'cancelled',
  };
  return map[ds] || 'pending';
}

function StatusPill({ delivery }) {
  const ds = isOverdue(delivery) ? 'Overdue' : delivery.status;
  return <span className={`do-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   TODO: Backend - Export deliveries data for salesOverview.jsx
   Replace this mock array with the fetched API response.
   Expected shape per delivery:
   {
     cakeType:     string  — cake product name
     quantity:     number
     price:        number  — total order price (₱)
     customer:     string
     contact:      string  — customer contact number
     address:      string  — delivery address
     orderDate:    string  — YYYY-MM-DD
     deliveryDate: string  — YYYY-MM-DD
     status:       'Pending' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
     instructions: string  — special notes (optional)
   }
────────────────────────────────────────────────────────────── */
export let INIT_DELIVERIES = [
  {
    cakeType:     'Chocolate Fudge Cake',
    quantity:     1,
    price:        950,
    customer:     'Maria Santos',
    contact:      '09171234567',
    address:      'Blk 4 Lot 12, Sampaguita St., Calamba, Laguna',
    orderDate:    '2026-03-09',
    deliveryDate: '2026-03-11',
    status:       'Out for Delivery',
    instructions: 'Please call before arriving. Leave at the gate if no answer.',
  },
  {
    cakeType:     'Ube Macapuno Cake',
    quantity:     1,
    price:        1100,
    customer:     'Jose Reyes',
    contact:      '09209876543',
    address:      '23 Marigold Ave., Brgy. Parian, Calamba, Laguna',
    orderDate:    '2026-03-09',
    deliveryDate: '2026-03-11',
    status:       'Pending',
    instructions: '',
  },
  {
    cakeType:     'Bento Cake',
    quantity:     2,
    price:        900,
    customer:     'Ana dela Cruz',
    contact:      '09561122334',
    address:      '8 Rosal St., Brgy. Real, Calamba, Laguna',
    orderDate:    '2026-03-08',
    deliveryDate: '2026-03-11',
    status:       'Delivered',
    instructions: 'Fragile. Handle with care.',
  },
  {
    cakeType:     'Mango Cream Cake',
    quantity:     1,
    price:        850,
    customer:     'Ramon Villanueva',
    contact:      '09321234321',
    address:      '15 Ilang-Ilang St., Brgy. Halang, Calamba, Laguna',
    orderDate:    '2026-03-07',
    deliveryDate: '2026-03-11',
    status:       'Cancelled',
    instructions: '',
  },
  {
    cakeType:     'Red Velvet Cake',
    quantity:     1,
    price:        980,
    customer:     'Liza Corpuz',
    contact:      '09184445556',
    address:      '3 Sampaguita Rd., Brgy. Bucal, Calamba, Laguna',
    orderDate:    '2026-03-07',
    deliveryDate: '2026-03-10',
    status:       'Out for Delivery',
    instructions: 'Extra cream cheese frosting packed separately.',
  },
];

/* ──────────────────────────────────────────────────────────────
   DELIVERY DETAIL MODAL
   Table shows: Cake Type · Qty · Price · Delivery Date · Status · Action
   Modal shows: Order Info + Customer Info + Delivery Info + Instructions
────────────────────────────────────────────────────────────── */
function DeliveryDetailModal({ delivery, onClose }) {
  return (
    <div className="do-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="do-modal">

        <div className="do-modal-header">
          <div>
            <p className="do-modal-eyebrow">Delivery Details</p>
            <h2 className="do-modal-cake-name">{delivery.cakeType}</h2>
          </div>
          <button className="do-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="do-modal-body">

          {/* ── Section 1: Order Information ── */}
          <h3 className="do-modal-section-title">Order Information</h3>
          <div className="do-modal-info-grid">

            <div className="do-info-item">
              <span className="do-info-label">Cake Type</span>
              <span className="do-info-value">{delivery.cakeType}</span>
            </div>

            <div className="do-info-item">
              <span className="do-info-label">Quantity</span>
              <span className="do-info-value">{delivery.quantity} pc{delivery.quantity > 1 ? 's' : ''}</span>
            </div>

            <div className="do-info-item">
              <span className="do-info-label">Total Price</span>
              <span className="do-info-value price-val">₱{delivery.price.toLocaleString()}</span>
            </div>

            <div className="do-info-item">
              <span className="do-info-label">Status</span>
              <span className="do-info-value"><StatusPill delivery={delivery} /></span>
            </div>

          </div>

          {/* ── Section 2: Customer Information ── */}
          <h3 className="do-modal-section-title" style={{ marginTop: 22 }}>Customer Information</h3>
          <div className="do-modal-info-grid">

            <div className="do-info-item">
              <span className="do-info-label">Customer Name</span>
              <span className="do-info-value">{delivery.customer}</span>
            </div>

            <div className="do-info-item">
              <span className="do-info-label">Contact Number</span>
              <span className="do-info-value">{delivery.contact || '—'}</span>
            </div>

          </div>

          {/* ── Section 3: Delivery Information ── */}
          <h3 className="do-modal-section-title" style={{ marginTop: 22 }}>Delivery Information</h3>
          <div className="do-modal-info-grid">

            <div className="do-info-item">
              <span className="do-info-label">Order Date</span>
              <span className="do-info-value">{formatDate(delivery.orderDate)}</span>
            </div>

            <div className="do-info-item">
              <span className="do-info-label">Delivery Date</span>
              <span className="do-info-value">{formatDate(delivery.deliveryDate)}</span>
            </div>

            <div className="do-info-item full-width">
              <span className="do-info-label">Delivery Address</span>
              <span className="do-info-value instructions-val">{delivery.address}</span>
            </div>

          </div>

          {/* ── Section 4: Special Instructions ── */}
          <h3 className="do-modal-section-title" style={{ marginTop: 22 }}>Special Instructions</h3>
          <div className="do-modal-info-grid">
            <div className="do-info-item full-width">
              <span className="do-info-value instructions-val">
                {delivery.instructions || 'No special instructions provided.'}
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

const DeliveryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace INIT_DELIVERIES with fetched data
  // -----------------------------------------------------------
  const [deliveriesData, setDeliveriesData] = useState(INIT_DELIVERIES);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [statusFilter,  setStatusFilter]  = useState(null);
  const [page,          setPage]          = useState(1);
  const [modalDelivery, setModalDelivery] = useState(null);


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
  // DATE-SCOPED DELIVERIES (filter by deliveryDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => deliveriesData.filter(d => inRange(d.deliveryDate, rangeStart, rangeEnd)),
    [deliveriesData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // -----------------------------------------------------------
  const totalDeliveryOrders = dateScoped.length;

  const estimatedRevenue = dateScoped
    .filter(d => REVENUE_STATUSES.includes(d.status))
    .reduce((sum, d) => sum + d.price, 0);

  const totalCakesDelivered = dateScoped
    .filter(d => d.status === 'Delivered')
    .reduce((sum, d) => sum + d.quantity, 0);


  // -----------------------------------------------------------
  // STATUS CARD COUNTS
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, 'Out for Delivery': 0, Delivered: 0, Overdue: 0, Cancelled: 0 };
    dateScoped.forEach(d => {
      if (isOverdue(d))            counts.Overdue++;
      else if (d.status in counts) counts[d.status]++;
    });
    return counts;
  }, [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!statusFilter)              return dateScoped;
    if (statusFilter === 'Overdue') return dateScoped.filter(isOverdue);
    return dateScoped.filter(d => d.status === statusFilter && !isOverdue(d));
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
    // TODO: Backend - Fetch deliveries on mount
    // const fetchDeliveries = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/deliveries');
    //     const data = await response.json();
    //     setDeliveriesData(data.deliveries);
    //     INIT_DELIVERIES = data.deliveries;
    //   } catch (err) {
    //     setError('Failed to load delivery data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchDeliveries();
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
  if (loading) return <div className="do-page-container"><p>Loading deliveries...</p></div>;
  if (error)   return <div className="do-page-container"><p>{error}</p></div>;

  return (
    <div className="do-page-container">

      {modalDelivery && (
        <DeliveryDetailModal delivery={modalDelivery} onClose={() => setModalDelivery(null)} />
      )}

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="do-header">
        <div>
          <h1 className="do-title">Customer Deliveries</h1>
          <p className="do-subtitle">Monitor all delivery orders, status updates, and overdue alerts</p>
        </div>

        <div className="do-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`do-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by date range"
          >
            <Calendar size={16} strokeWidth={2} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="do-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`do-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}

              <div className="do-custom-range-section">
                <span className="do-custom-range-title">Custom Range</span>
                <label className="do-custom-label">From</label>
                <input
                  type="date"
                  className="do-date-input"
                  value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                />
                <label className="do-custom-label">To</label>
                <input
                  type="date"
                  className="do-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                />
                <button
                  className="do-apply-btn"
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
      <div className="do-metrics-row">

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
          3. STATUS CARDS (Clickable Filters)
          ===================================================== */}
      <div className="do-status-cards-row">
        {STATUS_CARDS.map(card => (
          <button
            key={card.key}
            className={`do-status-card do-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
          >
            <span className="do-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="do-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. DELIVERIES TABLE
          Visible columns: Cake Type · Qty · Price · Delivery Date · Status · Action
          Hidden from table (shown only in modal):
            Customer Name, Contact Number, Address, Order Date, Instructions
          ===================================================== */}
      <div className="do-table-container">

        <div className="do-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="do-table-section-title">Deliveries List</span>
            <span className="do-table-count-pill">
              {filteredData.length} order{filteredData.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>
        </div>

        <div className="do-table-scroll-wrapper">
          <table className="do-deliveries-table">
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
              {paged.length > 0 ? paged.map((d, idx) => {
                const overdue  = isOverdue(d);
                const dueToday = isDueToday(d);
                return (
                  <tr key={idx}>
                    <td><span className="do-cake-name-text">{d.cakeType}</span></td>
                    <td>{d.quantity}</td>
                    <td><span className="do-price-text">₱{d.price.toLocaleString()}</span></td>
                    <td>
                      <span className={`do-date-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : ''}`}>
                        {formatDate(d.deliveryDate)}
                      </span>
                    </td>
                    <td><StatusPill delivery={d} /></td>
                    <td>
                      <button
                        className="do-view-btn"
                        onClick={e => { e.stopPropagation(); setModalDelivery(d); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="do-no-data">
                    No delivery orders match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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