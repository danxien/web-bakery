// =============================================================
// reservationOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for cake reservations.
//
// STRUCTURE mirrors customOrders.jsx exactly:
//   1. .ro-page-container   → .co-page-container
//   2. .ro-header           → .co-header
//   3. .ro-metrics-row      → .co-metrics-row  (3 cards)
//   4. .ro-alerts-container → .co-alerts-container  (3 rows)
//   5. .ro-table-container  → .co-table-container   (toolbar + table)
//
// BACKEND INTEGRATION CHECKLIST:
//   [ ] Replace mock INIT_RESERVATIONS with API response
//   [ ] Replace hardcoded alert counts with dynamic values
//   [ ] Add loading and error states after fetching
//   [ ] Connect filter dropdown to backend query params (optional)
//   [ ] All metric values are derived — recalculate after fetch
//   [ ] On Picked Up: trigger Sales record creation + Dashboard update
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PackageCheck, CircleDollarSign, ClipboardList, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/reservationsOverview.css';

/* ──────────────────────────────────────────────────────────────
   MOCK "TODAY" — fixed for demo consistency.
   🔹 BACKEND: Replace with: const TODAY = new Date();
────────────────────────────────────────────────────────────── */
const TODAY_STR = '2025-01-24';
const TODAY     = new Date(TODAY_STR + 'T00:00:00');

/* ── Helpers ─────────────────────────────────────────────── */

/** Reservations counted toward Reserved Quantity — all except Cancelled */
const ACTIVE_STATUSES = ['Pending', 'Picked Up', 'Not Picked Up'];

/** Reservations counted toward Estimated Revenue */
const REVENUE_STATUSES = ['Pending', 'Picked Up'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isPickupToday(r) {
  return r.pickupDate === TODAY_STR && r.status === 'Pending';
}

function isNotPickedUp(r) {
  return r.status === 'Not Picked Up';
}

function isUpcoming(r) {
  const pickup = new Date(r.pickupDate + 'T00:00:00');
  const in3    = addDays(TODAY, 3);
  return pickup > TODAY && pickup <= in3 && r.status === 'Pending';
}

function totalValue(r) {
  return r.quantity * r.price;
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusPillClass(status) {
  const map = {
    Pending:        'pending',
    'Picked Up':    'picked-up',
    Cancelled:      'cancelled',
    'Not Picked Up':'not-picked-up',
  };
  return map[status] || 'pending';
}

function StatusPill({ status }) {
  return <span className={`ro-status-pill ${statusPillClass(status)}`}>{status}</span>;
}

/* ──────────────────────────────────────────────────────────────
   MOCK DATA
   🔹 BACKEND: Replace this entire array with an API call result.
   Expected shape per reservation:
   {
     id, cakeType, quantity, price, customer, seller,
     reservationDate (YYYY-MM-DD), pickupDate (YYYY-MM-DD),
     status: 'Pending' | 'Picked Up' | 'Cancelled' | 'Not Picked Up'
   }
────────────────────────────────────────────────────────────── */
const INIT_RESERVATIONS = [
  {
    id: 'RES-001', cakeType: 'Chocolate Fudge Cake',
    quantity: 2, price: 850, customer: 'Ana Reyes',
    seller: 'Seller Lara Diaz',
    reservationDate: '2025-01-20', pickupDate: TODAY_STR,
    status: 'Pending',
  },
  {
    id: 'RES-002', cakeType: 'Ube Macapuno Cake',
    quantity: 1, price: 950, customer: 'Jose Cruz',
    seller: 'Seller Ana Reyes',
    reservationDate: '2025-01-21', pickupDate: TODAY_STR,
    status: 'Pending',
  },
  {
    id: 'RES-003', cakeType: 'Mango Float Cake',
    quantity: 3, price: 780, customer: 'Pedro Santos',
    seller: 'Seller Lara Diaz',
    reservationDate: '2025-01-18', pickupDate: '2025-01-22',
    status: 'Not Picked Up',
  },
  {
    id: 'RES-004', cakeType: 'Red Velvet Cake',
    quantity: 1, price: 1100, customer: 'Maria Gomez',
    seller: 'Seller Pedro Gomez',
    reservationDate: '2025-01-17', pickupDate: '2025-01-21',
    status: 'Picked Up',
  },
  {
    id: 'RES-005', cakeType: 'Buko Pandan Cake',
    quantity: 2, price: 720, customer: 'Rosa Villamor',
    seller: 'Seller Ana Reyes',
    reservationDate: '2025-01-22', pickupDate: '2025-01-25',
    status: 'Pending',
  },
  {
    id: 'RES-006', cakeType: 'Strawberry Shortcake',
    quantity: 1, price: 890, customer: 'Lara Diaz',
    seller: 'Seller Lara Diaz',
    reservationDate: '2025-01-22', pickupDate: '2025-01-26',
    status: 'Pending',
  },
  {
    id: 'RES-007', cakeType: 'Caramel Custard Cake',
    quantity: 4, price: 650, customer: 'Reyes Family',
    seller: 'Seller Pedro Gomez',
    reservationDate: '2025-01-19', pickupDate: '2025-01-23',
    status: 'Not Picked Up',
  },
  {
    id: 'RES-008', cakeType: 'Pandan Chiffon Cake',
    quantity: 1, price: 800, customer: 'Walk-in Customer',
    seller: 'Seller Ana Reyes',
    reservationDate: '2025-01-16', pickupDate: '2025-01-20',
    status: 'Cancelled',
  },
  {
    id: 'RES-009', cakeType: 'Mocha Crunch Cake',
    quantity: 2, price: 920, customer: 'Barangay Fiesta Org.',
    seller: 'Seller Lara Diaz',
    reservationDate: '2025-01-23', pickupDate: '2025-01-27',
    status: 'Pending',
  },
  {
    id: 'RES-010', cakeType: 'Leche Flan Cake',
    quantity: 1, price: 1050, customer: 'Mr. & Mrs. Santos',
    seller: 'Seller Pedro Gomez',
    reservationDate: '2025-01-20', pickupDate: '2025-01-23',
    status: 'Picked Up',
  },
];

/* ──────────────────────────────────────────────────────────────
   RESERVATION DETAIL MODAL
────────────────────────────────────────────────────────────── */
function ReservationDetailModal({ reservation: r, onClose }) {
  const pickupToday = isPickupToday(r);
  const notPickedUp = isNotPickedUp(r);
  const upcoming    = isUpcoming(r);

  return (
    <div className="ro-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ro-modal">

        <div className="ro-modal-header">
          <div>
            <h2 className="ro-modal-cake-name">{r.cakeType}</h2>
            <span className="ro-modal-id-tag">{r.id}</span>
          </div>
          <button className="ro-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ro-modal-body">
          <div>
            <h3 className="ro-modal-section-title">Reservation Information</h3>
            <div className="ro-modal-info-grid">

              <div className="ro-info-item">
                <span className="ro-info-label">Status</span>
                <span className="ro-info-value">
                  <StatusPill status={r.status} />
                </span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Customer</span>
                <span className="ro-info-value">{r.customer}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Seller</span>
                <span className="ro-info-value">{r.seller}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Quantity</span>
                <span className="ro-info-value">{r.quantity} pc{r.quantity > 1 ? 's' : ''}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Price per Cake</span>
                <span className="ro-info-value">₱{r.price.toLocaleString()}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Total Value</span>
                <span className="ro-info-value price-val">₱{totalValue(r).toLocaleString()}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Reservation Date</span>
                <span className="ro-info-value">{formatDate(r.reservationDate)}</span>
              </div>

              <div className="ro-info-item">
                <span className="ro-info-label">Pick-Up Date</span>
                <span className="ro-info-value" style={{
                  color:      notPickedUp ? '#b91c1c' : pickupToday ? '#854d0e' : upcoming ? '#1d4ed8' : undefined,
                  fontWeight: (notPickedUp || pickupToday || upcoming) ? 700 : undefined,
                }}>
                  {formatDate(r.pickupDate)}
                  {notPickedUp  && '  ⚠ Not Picked Up'}
                  {pickupToday  && !notPickedUp && '  ⚠ Due Today'}
                  {upcoming     && !pickupToday && !notPickedUp && '  Upcoming'}
                </span>
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

// Filter options — clean set matching the spec
const STATUS_OPTIONS = ['All', 'Pending', 'Picked Up', 'Not Picked Up', 'Cancelled'];

const PER_PAGE = 6;
const NO_QUICK = 'all';

const ReservationsOverview = () => {

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------
  const [statusFilter, setStatusFilter] = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 BACKEND: Add state for fetched data, loading, error
  // const [reservationsData, setReservationsData] = useState([]);
  // const [loading,          setLoading]          = useState(true);
  // const [error,            setError]            = useState(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: Replace INIT_RESERVATIONS with reservationsData
  // -----------------------------------------------------------

  // Reserved Quantity Total — all active (non-Cancelled) reservations
  const reservedQtyTotal = INIT_RESERVATIONS
    .filter(r => ACTIVE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + r.quantity, 0);

  // Estimated Revenue — Pending + Picked Up only
  const estimatedRevenue = INIT_RESERVATIONS
    .filter(r => REVENUE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + totalValue(r), 0);

  // Total Pending Pickups — status === 'Pending'
  const pendingPickupCount = INIT_RESERVATIONS.filter(r => r.status === 'Pending').length;

  // Alert counts
  const pickupTodayCount  = INIT_RESERVATIONS.filter(isPickupToday).length;
  const notPickedUpCount  = INIT_RESERVATIONS.filter(isNotPickedUp).length;
  const upcomingCount     = INIT_RESERVATIONS.filter(isUpcoming).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = INIT_RESERVATIONS; // 🔹 BACKEND: swap to reservationsData

    if      (quickFilter === 'today')        result = result.filter(isPickupToday);
    else if (quickFilter === 'not-picked-up')result = result.filter(isNotPickedUp);
    else if (quickFilter === 'upcoming')     result = result.filter(isUpcoming);
    else if (quickFilter === 'pending')      result = result.filter(r => r.status === 'Pending');
    else {
      if (statusFilter !== 'All') result = result.filter(r => r.status === statusFilter);
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
    // 🔹 BACKEND: Fetch reservations on mount
    // const fetchReservations = async () => { ... };
    // fetchReservations();

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
    <div className="ro-page-container">

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="ro-header">
        <h1 className="ro-title">Reservation Overview</h1>
        <p className="ro-subtitle">Monitor all cake reservations and upcoming pickup schedules</p>
      </div>


      {/* =====================================================
          2. METRIC CARDS — 3 cards
          ===================================================== */}
      <div className="ro-metrics-row">

        {/* Reserved Quantity Total */}
        <div className="ro-metric-card">
          <div className="ro-card-top">
            <span className="ro-metric-label">Reserved Quantity Total</span>
            <PackageCheck className="ro-blue-icon" size={20} />
          </div>
          <div className="ro-card-bottom">
            <span className="ro-metric-value">{reservedQtyTotal}</span>
            <span className="ro-metric-subtext">Cakes reserved (excl. Cancelled)</span>
          </div>
        </div>

        {/* Estimated Revenue */}
        <div className="ro-metric-card">
          <div className="ro-card-top">
            <span className="ro-metric-label">Estimated Revenue</span>
            <CircleDollarSign className="ro-green-icon" size={20} />
          </div>
          <div className="ro-card-bottom">
            <span className="ro-metric-value">₱{estimatedRevenue.toLocaleString()}</span>
            <span className="ro-metric-subtext">Pending &amp; Picked Up only</span>
          </div>
        </div>

        {/* Total Pending Pickups */}
        <div className="ro-metric-card">
          <div className="ro-card-top">
            <span className="ro-metric-label">Total Pending Pickups</span>
            <ClipboardList className="ro-yellow-icon" size={20} />
          </div>
          <div className="ro-card-bottom">
            <span className="ro-metric-value">{pendingPickupCount}</span>
            <span className="ro-metric-subtext">
              {pendingPickupCount === 1 ? 'Reservation awaiting pickup' : 'Reservations awaiting pickup'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS — 3 rows: Today / Not Picked Up / Upcoming
          ===================================================== */}
      <div className="ro-alerts-container">

        {/* Pickups Today — warning (yellow) */}
        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row warning ${quickFilter === 'today' ? 'is-active' : ''}`}
            onClick={() => activateQuick('today')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{pickupTodayCount}</strong>
              {' '}reservation{pickupTodayCount !== 1 ? 's' : ''} scheduled for pickup today
            </span>
          </button>
        </div>

        {/* Not Picked Up — critical (red) */}
        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row critical ${quickFilter === 'not-picked-up' ? 'is-active' : ''}`}
            onClick={() => activateQuick('not-picked-up')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{notPickedUpCount}</strong>
              {' '}cake{notPickedUpCount !== 1 ? 's' : ''} not picked up — risk of waste, follow-up needed
            </span>
          </button>
        </div>

        {/* Upcoming Pickups — info (blue) */}
        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row info ${quickFilter === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => activateQuick('upcoming')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{upcomingCount}</strong>
              {' '}upcoming pickup{upcomingCount !== 1 ? 's' : ''} within the next 3 days — plan production
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE
          ===================================================== */}
      <div className="ro-table-container">

        {/* Toolbar */}
        <div className="ro-table-toolbar">

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="ro-table-section-title">Reservations List</span>
            <span className="ro-table-count-pill">
              {filteredData.length} reservation{filteredData.length !== 1 ? 's' : ''}
              {quickFilter !== NO_QUICK && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            <div className="ro-filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`ro-filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Filter by status"
              >
                <Filter size={14} />
                <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
              </button>

              {dropdownOpen && (
                <div className="ro-filter-dropdown">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`ro-dropdown-item ${statusFilter === opt && quickFilter === NO_QUICK ? 'selected' : ''}`}
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
                className="ro-filter-icon-btn"
                onClick={() => { setQuickFilter(NO_QUICK); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

        {/* Table */}
        <div className="ro-table-scroll-wrapper">
          <table className="ro-reservations-table">
            <thead>
              <tr>
                <th>Cake Type</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Customer Name</th>
                <th>Reservation Date</th>
                <th>Pick-Up Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map(r => {
                const pickupToday = isPickupToday(r);
                const notPU       = isNotPickedUp(r);
                const upcoming    = isUpcoming(r);
                return (
                  <tr key={r.id}>
                    {/* 🔹 BACKEND: r.cakeType */}
                    <td><span className="ro-cake-name-text">{r.cakeType}</span></td>

                    {/* 🔹 BACKEND: r.quantity */}
                    <td>{r.quantity}</td>

                    {/* 🔹 BACKEND: r.price */}
                    <td>₱{r.price.toLocaleString()}</td>

                    {/* 🔹 BACKEND: r.quantity * r.price */}
                    <td><span className="ro-price-text">₱{totalValue(r).toLocaleString()}</span></td>

                    {/* 🔹 BACKEND: r.customer */}
                    <td>{r.customer}</td>

                    {/* 🔹 BACKEND: r.reservationDate (YYYY-MM-DD) */}
                    <td>{formatDate(r.reservationDate)}</td>

                    {/* 🔹 BACKEND: r.pickupDate — highlights by urgency */}
                    <td>
                      <span className={`ro-pickup-text ${notPU ? 'is-not-picked-up' : pickupToday ? 'is-today' : upcoming ? 'is-upcoming' : ''}`}>
                        {formatDate(r.pickupDate)}
                      </span>
                    </td>

                    {/* 🔹 BACKEND: r.status — must match STATUS_OPTIONS values */}
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="ro-no-data">
                    No reservations match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="ro-pagination">
          <span className="ro-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="ro-pagination-btns">
            <button className="ro-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`ro-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="ro-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReservationsOverview;