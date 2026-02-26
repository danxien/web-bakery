// =============================================================
// reservationOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Manager monitoring view for cake reservations.
//
// STATUS LOGIC (Operational-Based):
//   Pending   → Cake not yet prepared (waiting for action)
//   Ready     → Cake prepared, awaiting customer pickup
//   Picked Up → Customer collected cake, order complete
//   Overdue   → Auto: Today > PickupDate AND status === 'Ready'
//   Cancelled → Final state
//
// WORKFLOW:
//   Pending → Ready → Picked Up
//   Pending → Cancelled
//   Ready   → Overdue → Picked Up | Cancelled
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PackageCheck, CircleDollarSign, ClipboardList, AlertTriangle, Filter } from 'lucide-react';
import '../../styles/manager/reservationsOverview.css';

// TODO: Backend - Replace with: const TODAY = new Date(); const TODAY_STR = TODAY.toISOString().split('T')[0];
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

/* ── Helpers ─────────────────────────────────────────────── */

// Statuses counted toward Estimated Revenue
const REVENUE_STATUSES = ['Pending', 'Ready', 'Picked Up'];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Overdue: past pickup date AND status is still 'Ready'
function isOverdue(r) {
  return (
    new Date(r.pickupDate + 'T00:00:00') < TODAY &&
    r.status === 'Ready'
  );
}

// Due today: Ready cake with pickup scheduled for today
function isDueToday(r) {
  return r.pickupDate === TODAY_STR && r.status === 'Ready';
}

// Upcoming: Ready cakes with pickup within the next 3 days (not today/overdue)
function isUpcoming(r) {
  const pickup = new Date(r.pickupDate + 'T00:00:00');
  const in3    = addDays(TODAY, 3);
  return pickup > TODAY && pickup <= in3 && r.status === 'Ready';
}

function displayStatus(r) {
  return isOverdue(r) ? 'Overdue' : r.status;
}

function totalValue(r) {
  return r.quantity * r.price;
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
    Overdue:     'overdue',
    Cancelled:   'cancelled',
  };
  return map[ds] || 'pending';
}

function StatusPill({ reservation }) {
  const ds = displayStatus(reservation);
  return <span className={`ro-status-pill ${statusPillClass(ds)}`}>{ds}</span>;
}

/* ──────────────────────────────────────────────────────────────
   TODO: Backend - Export reservations data for salesOverview.jsx
   Replace this empty array with the fetched API response.
   Expected shape per reservation:
   {
     cakeType:        string  — cake product name
     quantity:        number
     price:           number  — unit price (₱)
     customer:        string
     seller:          string
     reservationDate: string  — YYYY-MM-DD
     pickupDate:      string  — YYYY-MM-DD
     status:          'Pending' | 'Ready' | 'Picked Up' | 'Cancelled'
   }
────────────────────────────────────────────────────────────── */
export let INIT_RESERVATIONS = [];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = ['All', 'Pending', 'Ready', 'Picked Up', 'Overdue', 'Cancelled'];

const PER_PAGE = 6;
const NO_QUICK = 'all';

const ReservationsOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched reservations data
  // -----------------------------------------------------------
  const [reservationsData, setReservationsData] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [quickFilter,  setQuickFilter]  = useState(NO_QUICK);
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // TODO: Backend - All values are derived from reservationsData
  // -----------------------------------------------------------
  const reservedQtyTotal = reservationsData
    .filter(r => r.status !== 'Cancelled')
    .reduce((sum, r) => sum + r.quantity, 0);

  const estimatedRevenue = reservationsData
    .filter(r => REVENUE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + totalValue(r), 0);

  const pendingCount  = reservationsData.filter(r => r.status === 'Pending').length;
  const dueTodayCount = reservationsData.filter(isDueToday).length;
  const overdueCount  = reservationsData.filter(isOverdue).length;
  const upcomingCount = reservationsData.filter(isUpcoming).length;


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    let result = reservationsData;

    if (quickFilter === 'due-today') {
      result = result.filter(isDueToday);
    } else if (quickFilter === 'overdue') {
      result = result.filter(isOverdue);
    } else if (quickFilter === 'upcoming') {
      result = result.filter(isUpcoming);
    } else {
      if (statusFilter === 'Overdue') {
        result = result.filter(isOverdue);
      } else if (statusFilter === 'Ready') {
        result = result.filter(r => r.status === 'Ready' && !isOverdue(r));
      } else if (statusFilter !== 'All') {
        result = result.filter(r => r.status === statusFilter);
      }
    }

    return result;
  }, [quickFilter, statusFilter, reservationsData]);

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
    // TODO: Backend - Fetch reservations on mount
    // Example:
    // const fetchReservations = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/reservations');
    //     const data = await response.json();
    //     setReservationsData(data.reservations);
    //     INIT_RESERVATIONS = data.reservations; // Keep export in sync for salesOverview
    //   } catch (err) {
    //     setError('Failed to load reservation data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchReservations();
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
  if (loading) return <div className="ro-page-container"><p>Loading reservations...</p></div>;
  if (error)   return <div className="ro-page-container"><p>{error}</p></div>;

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
          2. METRIC CARDS
          ===================================================== */}
      <div className="ro-metrics-row">

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

        <div className="ro-metric-card">
          <div className="ro-card-top">
            <span className="ro-metric-label">Estimated Revenue</span>
            <CircleDollarSign className="ro-green-icon" size={20} />
          </div>
          <div className="ro-card-bottom">
            <span className="ro-metric-value">₱{estimatedRevenue.toLocaleString()}</span>
            <span className="ro-metric-subtext">Pending, Ready &amp; Picked Up only</span>
          </div>
        </div>

        <div className="ro-metric-card">
          <div className="ro-card-top">
            <span className="ro-metric-label">Total Pending</span>
            <ClipboardList className="ro-yellow-icon" size={20} />
          </div>
          <div className="ro-card-bottom">
            <span className="ro-metric-value">{pendingCount}</span>
            <span className="ro-metric-subtext">
              {pendingCount === 1 ? 'Cake awaiting preparation' : 'Cakes awaiting preparation'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS
          ===================================================== */}
      <div className="ro-alerts-container">

        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row warning ${quickFilter === 'due-today' ? 'is-active' : ''}`}
            onClick={() => activateQuick('due-today')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{dueTodayCount}</strong>
              {' '}reservation{dueTodayCount !== 1 ? 's' : ''} ready for pick-up today — awaiting customer
            </span>
          </button>
        </div>

        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row critical ${quickFilter === 'overdue' ? 'is-active' : ''}`}
            onClick={() => activateQuick('overdue')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{overdueCount}</strong>
              {' '}overdue reservation{overdueCount !== 1 ? 's' : ''} — Ready but pick-up date has passed
            </span>
          </button>
        </div>

        <div className="ro-alert-wrapper">
          <button
            className={`ro-alert-row info ${quickFilter === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => activateQuick('upcoming')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{upcomingCount}</strong>
              {' '}upcoming pickup{upcomingCount !== 1 ? 's' : ''} within the next 3 days — plan preparation
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE
          ===================================================== */}
      <div className="ro-table-container">

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
              {paged.length > 0 ? paged.map((r, idx) => {
                const overdue  = isOverdue(r);
                const dueToday = isDueToday(r);
                const upcoming = isUpcoming(r);
                return (
                  <tr key={idx}>
                    <td><span className="ro-cake-name-text">{r.cakeType}</span></td>
                    <td>{r.quantity}</td>
                    <td>₱{r.price.toLocaleString()}</td>
                    <td><span className="ro-price-text">₱{totalValue(r).toLocaleString()}</span></td>
                    <td>{r.customer}</td>
                    <td>{formatDate(r.reservationDate)}</td>
                    <td>
                      <span className={`ro-pickup-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : upcoming ? 'is-upcoming' : ''}`}>
                        {formatDate(r.pickupDate)}
                      </span>
                    </td>
                    <td><StatusPill reservation={r} /></td>
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