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
//   Exports a PDF matching the Regis Cake Shop report style:
//     - Logo (top-left) + "SALES REPORT" title + period subtitle
//     - Summary table, Revenue Breakdown table, Sales Records table
//   Uses jsPDF + autoTable (loaded at runtime via CDN script injection).
//   All rows in dateScoped are exported — not just the current page.
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
   PDF EXPORT HELPERS
   Loads jsPDF + jspdf-autotable from CDN on first use,
   then builds the report entirely in-memory.
────────────────────────────────────────────────────────────── */

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureJsPDF() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
}

function loadImageAsBase64(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const BLACK       = [0, 0, 0];
const GREY_HEADER = [200, 200, 200];
const GREY_LIGHT  = [245, 245, 245];

async function exportSalesPDF({
  rangeStart, rangeEnd,
  dateScoped, totalRevenue, totalTransactions, totalCakesSold, breakdown,
}) {
  await ensureJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 14;
  const MR = 14;

  const logoBase64 = await loadImageAsBase64('/src/assets/logo.png');

  let y = 14;

  // ── Header ──
  const LOGO_SIZE = 28;
  if (logoBase64) doc.addImage(logoBase64, 'PNG', ML, y, LOGO_SIZE, LOGO_SIZE);
  const titleX = logoBase64 ? ML + LOGO_SIZE + 6 : ML;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...BLACK);
  doc.text('SALES REPORT', titleX, y + 12);

  const periodText = rangeStart === rangeEnd
    ? `PERIOD:  ${formatDate(rangeStart).toUpperCase()}`
    : `PERIOD:  ${formatDate(rangeStart).toUpperCase()} - ${formatDate(rangeEnd).toUpperCase()}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(periodText, titleX, y + 21);

  const generated = `Generated: ${new Date().toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(generated, PW - MR, y + 4, { align: 'right' });

  y = y + LOGO_SIZE + 10;

  // ── Summary Table ──
  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Summary', 'Value']],
    body: [
      ['Total Sales Revenue', `\u20B1${totalRevenue.toLocaleString()}`],
      ['Total Transactions',  String(totalTransactions)],
      ['Total Cakes Sold',    String(totalCakesSold)],
    ],
    styles: { fontSize: 9, cellPadding: 4, textColor: BLACK, lineColor: [180, 180, 180], lineWidth: 0.3 },
    headStyles: { fillColor: GREY_HEADER, textColor: BLACK, fontStyle: 'bold', fontSize: 9, halign: 'center' },
    bodyStyles: { halign: 'center', fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold' }, 1: { halign: 'center' } },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Revenue Breakdown ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text('REVENUE BREAKDOWN', ML, y);
  y += 4;

  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Order Type', 'Sales Revenue']],
    body: [
      ['Walk-In Orders', `\u20B1${(breakdown['Walk-In']?.amount      || 0).toLocaleString()}`],
      ['Reservations',   `\u20B1${(breakdown['Reservation']?.amount  || 0).toLocaleString()}`],
      ['Custom Orders',  `\u20B1${(breakdown['Custom Order']?.amount || 0).toLocaleString()}`],
    ],
    styles: { fontSize: 9, cellPadding: 4, textColor: BLACK, lineColor: [180, 180, 180], lineWidth: 0.3 },
    headStyles: { fillColor: GREY_HEADER, textColor: BLACK, fontStyle: 'bold', fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'center', fontStyle: 'bold' }, 1: { halign: 'center' } },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ── Sales Records ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text('SALES RECORDS', ML, y);
  y += 4;

  const tableRows = dateScoped.map(s => [
    s.orderType,
    s.cakeType,
    String(s.qty),
    `\u20B1${s.amount.toLocaleString()}`,
    s.customer,
    formatDate(s.completionDate),
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Order Type', 'Cake Type', 'Qty', 'Total Amount', 'Customer', 'Completion Date']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', '—', '—', '—', '—']],
    styles: { fontSize: 8, cellPadding: 3, textColor: BLACK, lineColor: [180, 180, 180], lineWidth: 0.3 },
    headStyles: { fillColor: GREY_HEADER, textColor: BLACK, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 30, halign: 'center' },
    },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  // ── Page Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Regis Cake Shop — Confidential', ML, PH - 8);
    doc.text(`Page ${p} of ${pageCount}`, PW - MR, PH - 8, { align: 'right' });
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(ML, PH - 12, PW - MR, PH - 12);
  }

  const safePeriod = `${rangeStart}_to_${rangeEnd}`.replace(/-/g, '');
  doc.save(`BakerySalesReport_${safePeriod}.pdf`);
}


/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const PER_PAGE = 7;

const SalesOverview = () => {

  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

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
  //   Walk-In    → status === 'Completed'  → completionDate = orderDate
  //   Reservation → status === 'Picked Up' → completionDate = pickupDate
  //   Custom      → status === 'Delivered' → completionDate = deliveryDate
  //
  // When any module fetches from the backend it writes back to its INIT_*
  // export, which causes this component to re-derive salesData on the next
  // render — keeping Sales automatically in sync with no event bus needed.
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
  // Module-level refs are not tracked by React's dependency system.
  // Once backend fetch calls populate these arrays, this component
  // will re-derive on the next render via its own state updates.
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

  async function handleExport() {
    setExporting(true);
    try {
      await exportSalesPDF({
        rangeStart, rangeEnd,
        dateScoped,
        totalRevenue, totalTransactions, totalCakesSold,
        breakdown,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
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
            className={`so-export-btn ${exporting ? 'loading' : ''}`}
            onClick={handleExport}
            disabled={exporting}
            title="Export current view as PDF"
          >
            <Download size={15} strokeWidth={2} />
            <span>{exporting ? 'Exporting…' : 'Export Report'}</span>
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