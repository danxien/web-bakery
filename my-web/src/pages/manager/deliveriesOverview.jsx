// =============================================================
// deliveriesOverview.jsx
// PURPOSE: Manager read-only view of incoming cake stock deliveries.
//          Delivery records are created by the Packer role and
//          fetched here via API. The manager cannot add or edit records.
//
// CONNECTION LOGIC (Deliveries → Inventory):
//   INIT_DELIVERIES and INVENTORY_STATE are exported as module-level
//   refs so InventoryOverview.jsx can derive live inventory from them.
//   When the backend is connected, both refs are populated on mount
//   from the API and InventoryOverview switches to its own API call.
//
// DATE FILTER: Today | This Week | This Month | Custom Range
// SUMMARY CARDS: Total Deliveries · Total Cakes Delivered
// TABLE COLUMNS: Delivery Date · Cake Type · Price · Quantity · Expiry Date
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Truck, PackageCheck, Calendar, ChevronDown } from 'lucide-react';
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

const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const PER_PAGE = 6;

/* ── Misc Helpers ──────────────────────────────────────────── */

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ──────────────────────────────────────────────────────────────
   SHARED EXPORTS — consumed by InventoryOverview.jsx
   These module-level refs act as an in-memory bridge until
   a real backend is wired in.

   TODO: Backend — Remove both exports once InventoryOverview
   calls GET /api/inventory directly. At that point this file
   becomes fully self-contained.
────────────────────────────────────────────────────────────── */

// TODO: Backend — Populated from GET /api/inventory on mount.
// Shape: { [cakeType: string]: { quantity: number, expiryDate: string, pricePerCake: number } }
export let INVENTORY_STATE = {};

// TODO: Backend — Populated from GET /api/stock-deliveries on mount.
// Shape per record: { id, deliveryDate, cakeType, pricePerCake, quantity, expiryDate }
export let INIT_DELIVERIES = [];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const DeliveryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend — Replace initial [] with data fetched in
  //   useEffect below via GET /api/stock-deliveries.
  // -----------------------------------------------------------
  const [deliveriesData, setDeliveriesData] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  const [dateFilter,   setDateFilter]   = useState('today');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);

  const [page, setPage] = useState(1);


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
  // FILTERED DATA (filter by deliveryDate)
  // -----------------------------------------------------------
  const filteredData = useMemo(
    () => deliveriesData.filter(d => inRange(d.deliveryDate, rangeStart, rangeEnd)),
    [deliveriesData, rangeStart, rangeEnd]
  );


  // -----------------------------------------------------------
  // SUMMARY METRICS
  // -----------------------------------------------------------
  const totalDeliveries     = filteredData.length;
  const totalCakesDelivered = filteredData.reduce((sum, d) => sum + d.quantity, 0);


  // -----------------------------------------------------------
  // PAGINATION
  // -----------------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);


  // -----------------------------------------------------------
  // HANDLERS
  // -----------------------------------------------------------
  function handleDateSelect(key) {
    setDateFilter(key);
    setPage(1);
    if (key !== 'custom') setDateDropOpen(false);
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
    // TODO: Backend — Fetch packer-submitted deliveries and current
    // inventory state on mount:
    //
    // const load = async () => {
    //   try {
    //     setLoading(true);
    //     const [delivRes, invRes] = await Promise.all([
    //       fetch('/api/stock-deliveries'),
    //       fetch('/api/inventory'),
    //     ]);
    //     const delivData = await delivRes.json();
    //     const invData   = await invRes.json();
    //
    //     setDeliveriesData(delivData.deliveries);
    //     INIT_DELIVERIES = delivData.deliveries;   // bridge for InventoryOverview
    //     INVENTORY_STATE = invData.inventory;      // bridge for InventoryOverview
    //   } catch (err) {
    //     setError('Failed to load stock delivery data.');
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

  useEffect(() => { setPage(1); }, [dateFilter, customStart, customEnd]);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="do-page-container"><p>Loading stock deliveries...</p></div>;
  if (error)   return <div className="do-page-container"><p>{error}</p></div>;

  return (
    <div className="do-page-container">

      {/* =====================================================
          1. HEADER + DATE FILTER
          ===================================================== */}
      <div className="do-header">
        <div>
          <h1 className="do-title">Stock Deliveries</h1>
          <p className="do-subtitle">Incoming cake stock recorded by the Packer</p>
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
            <span className="do-metric-label">Total Deliveries</span>
            <Truck className="do-blue-icon" size={20} />
          </div>
          <div className="do-card-bottom">
            <span className="do-metric-value">{totalDeliveries}</span>
            <span className="do-metric-subtext">Stock delivery records</span>
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
              {totalCakesDelivered === 1 ? 'Cake received into stock' : 'Cakes received into stock'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. STOCK DELIVERIES TABLE
          Columns: Delivery Date · Cake Type · Price · Quantity · Expiry Date
          ===================================================== */}
      <div className="do-table-container">

        <div className="do-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="do-table-section-title">Stock Delivery Records</span>
            <span className="do-table-count-pill">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="do-table-scroll-wrapper">
          <table className="do-deliveries-table">
            <colgroup>
              <col className="col-delivery-date" />
              <col className="col-cake" />
              <col className="col-price" />
              <col className="col-qty" />
              <col className="col-expiry" />
            </colgroup>
            <thead>
              <tr>
                <th>Delivery Date</th>
                <th>Cake Type</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((d) => (
                <tr key={d.id}>
                  <td><span className="do-date-text">{formatDate(d.deliveryDate)}</span></td>
                  <td><span className="do-cake-name-text">{d.cakeType}</span></td>
                  <td><span className="do-price-text">₱{(d.pricePerCake ?? 0).toLocaleString()}</span></td>
                  <td><span className="do-qty-badge">+{d.quantity}</span></td>
                  <td><span className="do-expiry-text">{formatDate(d.expiryDate)}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="do-no-data">
                    No stock deliveries recorded for this period.
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