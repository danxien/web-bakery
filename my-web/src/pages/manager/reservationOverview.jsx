// =============================================================
// reservationOverview.jsx
// PURPOSE: Manager monitoring view for cake reservations.
// FILTERING: Date Filter (header calendar icon) + Status Cards (clickable)
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
import { PackageCheck, CircleDollarSign, ClipboardList, Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/reservationsOverview.css';

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

// Revenue is counted only for active statuses (excluding Cancelled)
const REVENUE_STATUSES = ['Pending', 'Ready', 'Picked Up'];

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

function isOverdue(r) {
  return (
    new Date(r.pickupDate + 'T00:00:00') < TODAY &&
    r.status === 'Ready'
  );
}

function isDueToday(r) {
  return r.pickupDate === TODAY_STR && r.status === 'Ready';
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
  const ds = isOverdue(reservation) ? 'Overdue' : reservation.status;
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
     contact:         string  — customer contact number
     seller:          string
     reservationDate: string  — YYYY-MM-DD
     pickupDate:      string  — YYYY-MM-DD
     status:          'Pending' | 'Ready' | 'Picked Up' | 'Cancelled'
     instructions:    string  — special notes (optional)
   }
────────────────────────────────────────────────────────────── */
export let INIT_RESERVATIONS = [
  {
    cakeType:        'Chocolate Fudge Cake',
    quantity:        2,
    price:           850,
    customer:        'Ana Reyes',
    contact:         '09171234567',
    seller:          'staff',
    reservationDate: '2026-03-09',
    pickupDate:      '2026-03-11',
    status:          'Ready',
    instructions:    'No nuts. Please write "Happy Birthday Ana" on top.',
  },
  {
    cakeType:        'Ube Macapuno Cake',
    quantity:        1,
    price:           950,
    customer:        'Carlo Mendoza',
    contact:         '09209876543',
    seller:          'staff',
    reservationDate: '2026-03-09',
    pickupDate:      '2026-03-11',
    status:          'Pending',
    instructions:    '',
  },
  {
    cakeType:        'Bento Cake',
    quantity:        3,
    price:           450,
    customer:        'Sofia dela Cruz',
    contact:         '09561122334',
    seller:          'staff',
    reservationDate: '2026-03-10',
    pickupDate:      '2026-03-11',
    status:          'Picked Up',
    instructions:    'One with candles, two plain.',
  },
  {
    cakeType:        'Mango Cream Cake',
    quantity:        1,
    price:           780,
    customer:        'Ramon Villanueva',
    contact:         '09321234321',
    seller:          'staff',
    reservationDate: '2026-03-08',
    pickupDate:      '2026-03-11',
    status:          'Cancelled',
    instructions:    '',
  },
  {
    cakeType:        'Red Velvet Cake',
    quantity:        1,
    price:           900,
    customer:        'Liza Corpuz',
    contact:         '09184445556',
    seller:          'staff',
    reservationDate: '2026-03-07',
    pickupDate:      '2026-03-10',
    status:          'Ready',
    instructions:    'Extra cream cheese frosting on the side.',
  },
];

/* ──────────────────────────────────────────────────────────────
   RESERVATION DETAIL MODAL
   Table shows: Cake Type · Qty · Price · Pick-Up Date · Status · Action
   Modal shows: Order Info + Customer Info + Schedule + Instructions
────────────────────────────────────────────────────────────── */
function ReservationDetailModal({ reservation, onClose }) {
  return (
    <div className="ro-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ro-modal">

        <div className="ro-modal-header">
          <div>
            <p className="ro-modal-eyebrow">Reservation Details</p>
            <h2 className="ro-modal-cake-name">{reservation.cakeType}</h2>
          </div>
          <button className="ro-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="ro-modal-body">

          {/* ── Section 1: Order Information ── */}
          <h3 className="ro-modal-section-title">Order Information</h3>
          <div className="ro-modal-info-grid">

            <div className="ro-info-item">
              <span className="ro-info-label">Cake Type</span>
              <span className="ro-info-value">{reservation.cakeType}</span>
            </div>

            <div className="ro-info-item">
              <span className="ro-info-label">Quantity</span>
              <span className="ro-info-value">{reservation.quantity} pc{reservation.quantity > 1 ? 's' : ''}</span>
            </div>

            <div className="ro-info-item">
              <span className="ro-info-label">Total Price</span>
              <span className="ro-info-value price-val">
                ₱{(reservation.quantity * reservation.price).toLocaleString()}
              </span>
            </div>

            <div className="ro-info-item">
              <span className="ro-info-label">Status</span>
              <span className="ro-info-value"><StatusPill reservation={reservation} /></span>
            </div>

          </div>

          {/* ── Section 2: Customer Information ── */}
          <h3 className="ro-modal-section-title" style={{ marginTop: 22 }}>Customer Information</h3>
          <div className="ro-modal-info-grid">

            <div className="ro-info-item">
              <span className="ro-info-label">Customer Name</span>
              <span className="ro-info-value">{reservation.customer}</span>
            </div>

            <div className="ro-info-item">
              <span className="ro-info-label">Contact Number</span>
              <span className="ro-info-value">{reservation.contact || '—'}</span>
            </div>

          </div>

          {/* ── Section 3: Schedule ── */}
          <h3 className="ro-modal-section-title" style={{ marginTop: 22 }}>Schedule</h3>
          <div className="ro-modal-info-grid">

            <div className="ro-info-item">
              <span className="ro-info-label">Reservation Date</span>
              <span className="ro-info-value">{formatDate(reservation.reservationDate)}</span>
            </div>

            <div className="ro-info-item">
              <span className="ro-info-label">Pick-Up Date</span>
              <span className="ro-info-value">{formatDate(reservation.pickupDate)}</span>
            </div>

          </div>

          {/* ── Section 4: Special Instructions ── */}
          <h3 className="ro-modal-section-title" style={{ marginTop: 22 }}>Special Instructions</h3>
          <div className="ro-modal-info-grid">
            <div className="ro-info-item full-width">
              <span className="ro-info-value instructions-val">
                {reservation.instructions || 'No special instructions provided.'}
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

const ReservationsOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched reservations data
  // -----------------------------------------------------------
  const [reservationsData, setReservationsData] = useState(INIT_RESERVATIONS);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [page,         setPage]         = useState(1);
  const [modalReservation, setModalReservation] = useState(null);


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
  // DATE-SCOPED RESERVATIONS (filter by pickupDate)
  // -----------------------------------------------------------
  const dateScoped = useMemo(
    () => reservationsData.filter(r => inRange(r.pickupDate, rangeStart, rangeEnd)),
    [reservationsData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // -----------------------------------------------------------
  const reservedQtyTotal = dateScoped
    .filter(r => r.status !== 'Cancelled')
    .reduce((sum, r) => sum + r.quantity, 0);

  const estimatedRevenue = dateScoped
    .filter(r => REVENUE_STATUSES.includes(r.status))
    .reduce((sum, r) => sum + r.quantity * r.price, 0);

  const pendingCount = dateScoped.filter(r => r.status === 'Pending').length;


  // -----------------------------------------------------------
  // STATUS CARD COUNTS
  // -----------------------------------------------------------
  const statusCounts = useMemo(() => {
    const counts = { Pending: 0, Ready: 0, 'Picked Up': 0, Overdue: 0, Cancelled: 0 };
    dateScoped.forEach(r => {
      if (isOverdue(r))            counts.Overdue++;
      else if (r.status in counts) counts[r.status]++;
    });
    return counts;
  }, [dateScoped]);


  // -----------------------------------------------------------
  // TABLE DATA
  // -----------------------------------------------------------
  const filteredData = useMemo(() => {
    if (!statusFilter)              return dateScoped;
    if (statusFilter === 'Overdue') return dateScoped.filter(isOverdue);
    if (statusFilter === 'Ready')   return dateScoped.filter(r => r.status === 'Ready' && !isOverdue(r));
    return dateScoped.filter(r => r.status === statusFilter);
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
    // TODO: Backend - Fetch reservations on mount
    // const fetchReservations = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/reservations');
    //     const data = await response.json();
    //     setReservationsData(data.reservations);
    //     INIT_RESERVATIONS = data.reservations;
    //   } catch (err) {
    //     setError('Failed to load reservation data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchReservations();
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
  if (loading) return <div className="ro-page-container"><p>Loading reservations...</p></div>;
  if (error)   return <div className="ro-page-container"><p>{error}</p></div>;

  return (
    <div className="ro-page-container">

      {modalReservation && (
        <ReservationDetailModal
          reservation={modalReservation}
          onClose={() => setModalReservation(null)}
        />
      )}

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="ro-header">
        <div>
          <h1 className="ro-title">Reservation Overview</h1>
          <p className="ro-subtitle">Monitor all cake reservations and upcoming pickup schedules</p>
        </div>

        <div className="ro-filter-dropdown-wrapper" ref={dateDropRef}>
          <button
            className={`ro-date-filter-btn ${dateDropOpen ? 'open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
            title="Filter by date range"
          >
            <Calendar size={16} strokeWidth={2} color="currentColor" />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="ro-date-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`ro-dropdown-item ${dateFilter === opt.key ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}

              <div className="ro-custom-range-section">
                <span className="ro-custom-range-title">Custom Range</span>
                <label className="ro-custom-label">From</label>
                <input
                  type="date"
                  className="ro-date-input"
                  value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }}
                />
                <label className="ro-custom-label">To</label>
                <input
                  type="date"
                  className="ro-date-input"
                  value={customEnd}
                  min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }}
                />
                <button
                  className="ro-apply-btn"
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
          3. STATUS CARDS (Clickable Filters)
          ===================================================== */}
      <div className="ro-status-cards-row">
        {STATUS_CARDS.map(card => (
          <button
            key={card.key}
            className={`ro-status-card ro-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
            onClick={() => handleStatusCard(card.key)}
          >
            <span className="ro-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="ro-status-card-label">{card.label}</span>
          </button>
        ))}
      </div>


      {/* =====================================================
          4. RESERVATIONS TABLE
          Visible columns: Cake Type · Qty · Price · Customer Name ·
                           Pick-Up Date · Status · Action
          Hidden from table (shown only in modal):
            Contact Number, Reservation Date, Special Instructions
          ===================================================== */}
      <div className="ro-table-container">

        <div className="ro-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="ro-table-section-title">Reservations List</span>
            <span className="ro-table-count-pill">
              {filteredData.length} reservation{filteredData.length !== 1 ? 's' : ''}
              {statusFilter && ` · ${statusFilter}`}
            </span>
          </div>
        </div>

        <div className="ro-table-scroll-wrapper">
          <table className="ro-reservations-table">
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
              {paged.length > 0 ? paged.map((r, idx) => {
                const overdue  = isOverdue(r);
                const dueToday = isDueToday(r);
                return (
                  <tr key={idx}>
                    <td><span className="ro-cake-name-text">{r.cakeType}</span></td>
                    <td>{r.quantity}</td>
                    <td><span className="ro-price-text">₱{r.price.toLocaleString()}</span></td>
                    <td>
                      <span className={`ro-pickup-text ${overdue ? 'is-overdue' : dueToday ? 'is-today' : ''}`}>
                        {formatDate(r.pickupDate)}
                      </span>
                    </td>
                    <td><StatusPill reservation={r} /></td>
                    <td>
                      <button
                        className="ro-view-btn"
                        onClick={e => { e.stopPropagation(); setModalReservation(r); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="ro-no-data">
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