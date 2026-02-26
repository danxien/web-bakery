// =============================================================
// deliveriesOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for customer delivery orders.
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Truck, CircleDollarSign, PackageCheck, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/deliveriesOverview.css';

// TODO: Backend - Replace with: const TODAY = new Date(); const TODAY_STR = TODAY.toISOString().split('T')[0];
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

/* ── Helpers ─────────────────────────────────────────────── */

// Statuses included in Estimated Revenue — exclude Cancelled
const REVENUE_STATUSES = ['Pending', 'Out for Delivery', 'Delivered'];

// Overdue: deliveryDate < today AND status is not Delivered or Cancelled
function isOverdue(d) {
  return (
    new Date(d.deliveryDate + 'T00:00:00') < TODAY &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
  );
}

// Deliveries Today: deliveryDate === today AND not yet Delivered or Cancelled
function isDeliveryToday(d) {
  return (
    d.deliveryDate === TODAY_STR &&
    d.status !== 'Delivered' &&
    d.status !== 'Cancelled'
  );
}

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
 * Multiple     → "First Cake + N more"
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

function displayStatus(d) {
  return isOverdue(d) ? 'Overdue' : d.status;
}

function StatusPill({ delivery }) {
  const ds = displayStatus(delivery);
  return <span className={`do-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   TODO: Backend - Export deliveries data for salesOverview.jsx
   Replace this empty array with the fetched API response.
   Expected shape per delivery:
   {
     items:        [{ name: string, qty: number }]
     totalQty:     number
     totalPrice:   number
     customer:     string
     contact:      string
     address:      string
     deliveryDate: string  — YYYY-MM-DD
     status:       'Pending' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
   }
────────────────────────────────────────────────────────────── */
export let INIT_DELIVERIES = [];

/* ──────────────────────────────────────────────────────────────
   DELIVERY DETAIL MODAL
────────────────────────────────────────────────────────────── */
function DeliveryDetailModal({ delivery, onClose }) {
  const overdue  = isOverdue(delivery);
  const dueToday = isDeliveryToday(delivery);

  return (
    <div className="do-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="do-modal">

        <div className="do-modal-header">
          <div>
            <h2 className="do-modal-title">{formatCakeType(delivery.items)}</h2>
          </div>
          <button className="do-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="do-modal-body">
          <div>
            <h3 className="do-modal-section-title">Delivery Information</h3>
            <div className="do-modal-info-grid">

              <div className="do-info-item">
                <span className="do-info-label">Status</span>
                <span className="do-info-value">
                  <StatusPill delivery={delivery} />
                </span>
              </div>

              <div className="do-info-item">
                <span className="do-info-label">Customer</span>
                <span className="do-info-value">{delivery.customer}</span>
              </div>

              <div className="do-info-item">
                <span className="do-info-label">Total Price</span>
                <span className="do-info-value do-price-val">₱{delivery.totalPrice.toLocaleString()}</span>
              </div>

              <div className="do-info-item">
                <span className="do-info-label">Total Quantity</span>
                <span className="do-info-value">{delivery.totalQty} pc{delivery.totalQty > 1 ? 's' : ''}</span>
              </div>

              <div className="do-info-item">
                <span className="do-info-label">Contact Number</span>
                <span className="do-info-value">{delivery.contact}</span>
              </div>

              <div className="do-info-item">
                <span className="do-info-label">Delivery Date</span>
                <span className="do-info-value" style={{
                  color:      overdue  ? '#b91c1c' : dueToday ? '#854d0e' : undefined,
                  fontWeight: (overdue || dueToday) ? 700 : undefined,
                }}>
                  {formatDate(delivery.deliveryDate)}
                  {overdue  && '  ⚠ Overdue'}
                  {dueToday && '  ⚠ Due Today'}
                </span>
              </div>

              <div className="do-info-item full-width">
                <span className="do-info-label">Delivery Address</span>
                <span className="do-info-value do-address-val">{delivery.address}</span>
              </div>

              <div className="do-info-item full-width">
                <span className="do-info-label">Order Items</span>
                <div className="do-items-list">
                  {delivery.items.map((item, idx) => (
                    <div key={idx} className="do-item-row">
                      <span className="do-item-name">{item.name}</span>
                      <span className="do-item-qty">×{item.qty}</span>
                    </div>
                  ))}
                </div>
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

const STATUS_OPTIONS = ['All', 'Pending', 'Out for Delivery', 'Delivered', 'Cancelled', 'Overdue'];

const PER_PAGE = 6;
const NO_QUICK = 'all';

const DeliveryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched deliveries data
  // -----------------------------------------------------------
  const [deliveriesData, setDeliveriesData] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [statusFilter,  setStatusFilter]  = useState('All');
  const [quickFilter,   setQuickFilter]   = useState(NO_QUICK);
  const [page,          setPage]          = useState(1);
  const [modalDelivery, setModalDelivery] = useState(null);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const dropdownRef = useRef(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // TODO: Backend - All values are derived from deliveriesData
  // -----------------------------------------------------------
  const totalDeliveryOrders = deliveriesData.length;

  const estimatedRevenue = deliveriesData
    .filter(d => REVENUE_STATUSES.includes(d.status))
    .reduce((sum, d) => sum + d.totalPrice, 0);

  const totalCakesDelivered = deliveriesData
    .filter(d => d.status === 'Delivered')
    .reduce((sum, d) => sum + d.totalQty, 0);

  const deliveriesTodayCount = deliveriesData.filter(isDeliveryToday).length;
  const pendingCount         = deliveriesData.filter(isPending).length;
  const overdueCount         = deliveriesData.filter(isOverdue).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = deliveriesData;

    if      (quickFilter === 'today')   result = result.filter(isDeliveryToday);
    else if (quickFilter === 'pending') result = result.filter(isPending);
    else if (quickFilter === 'overdue') result = result.filter(isOverdue);
    else {
      if      (statusFilter === 'Overdue') result = result.filter(isOverdue);
      else if (statusFilter !== 'All')     result = result.filter(d => d.status === statusFilter && !isOverdue(d));
    }

    return result;
  }, [quickFilter, statusFilter, deliveriesData]);

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
    // TODO: Backend - Fetch deliveries on mount
    // Example:
    // const fetchDeliveries = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/deliveries');
    //     const data = await response.json();
    //     setDeliveriesData(data.deliveries);
    //     INIT_DELIVERIES = data.deliveries; // Keep export in sync for salesOverview
    //   } catch (err) {
    //     setError('Failed to load delivery data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchDeliveries();
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
  if (loading) return <div className="do-page-container"><p>Loading deliveries...</p></div>;
  if (error)   return <div className="do-page-container"><p>{error}</p></div>;

  return (
    <div className="do-page-container">

      {modalDelivery && (
        <DeliveryDetailModal delivery={modalDelivery} onClose={() => setModalDelivery(null)} />
      )}

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="do-header">
        <h1 className="do-title">Customer Deliveries</h1>
        <p className="do-subtitle">Monitor all delivery orders, status updates, and overdue alerts</p>
      </div>


      {/* =====================================================
          2. METRIC CARDS
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
          3. ALERTS
          ===================================================== */}
      <div className="do-alerts-container">

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((d, idx) => {
                const overdue  = isOverdue(d);
                const dueToday = isDeliveryToday(d);
                return (
                  <tr key={idx}>
                    <td>
                      <span className="do-cake-name-text" title={fullCakeList(d.items)}>
                        {formatCakeType(d.items)}
                      </span>
                    </td>
                    <td>{d.totalQty}</td>
                    <td><span className="do-price-text">₱{d.totalPrice.toLocaleString()}</span></td>
                    <td>{d.customer}</td>
                    <td><span className="do-contact-text">{d.contact}</span></td>
                    <td>
                      <span className="do-address-text" title={d.address}>
                        {d.address}
                      </span>
                    </td>
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
                  <td colSpan={9} className="do-no-data">
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