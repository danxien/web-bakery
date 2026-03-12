// =============================================================
// salesOverview.jsx
// PURPOSE: Manager financial view — completed sales only.
//          Aggregates confirmed revenue from Deliveries,
//          Reservations, Custom Orders, and Walk-In Orders.
// FILTERING: Date Filter (header calendar icon) + Breakdown Cards (clickable)
//
// SALES DEFINITION:
//   Delivery     → Status = 'Delivered'
//   Reservation  → Status = 'Picked Up'
//   Custom Order → Status = 'Picked Up'
//   Walk-In      → Status = 'Completed' (all walk-ins are always Completed)
//
//   Never include: Pending, Cancelled, Overdue, Ready,
//                  Out for Delivery, Not Picked Up
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
  Truck, CalendarCheck, ClipboardList, ShoppingBag,
  Calendar, ChevronDown, Download,
} from 'lucide-react';
import '../../styles/manager/salesOverview.css';

// TODO: Backend - Replace these imports with a unified API call
import { INIT_DELIVERIES }    from './deliveriesOverview';
import { INIT_RESERVATIONS }  from './reservationOverview';
import { INIT_ORDERS }        from './customOrders';
import { INIT_WALKIN_ORDERS } from './walkInOrders';

/* ──────────────────────────────────────────────────────────────
   ORDER TYPE CONFIG
────────────────────────────────────────────────────────────── */
const ORDER_TYPES = {
  Delivery:       { label: 'Delivery',     css: 'delivery',     Icon: Truck },
  Reservation:    { label: 'Reservation',  css: 'reservation',  Icon: CalendarCheck },
  'Custom Order': { label: 'Custom Order', css: 'custom-order', Icon: ClipboardList },
  'Walk-In':      { label: 'Walk-In',      css: 'walk-in',      Icon: ShoppingBag },
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
  return ORDER_TYPES[type]?.css || 'delivery';
}

/* ──────────────────────────────────────────────────────────────
   PDF EXPORT HELPERS
   Loads jsPDF + jspdf-autotable from CDN on first use,
   then builds the report entirely in-memory.
────────────────────────────────────────────────────────────── */

// Lazy-load a script once and return a promise that resolves when ready.
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

// Load logo image as base64 from the project assets
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
    img.onerror = () => resolve(null); // gracefully skip if logo fails
    img.src = src;
  });
}

// Table style constants — clean black & white to match reference PDF
const BLACK      = [0, 0, 0];
const WHITE      = [255, 255, 255];
const GREY_HEADER = [200, 200, 200]; // light grey header fill
const GREY_LIGHT  = [245, 245, 245]; // alternate row fill

async function exportSalesPDF({
  dateLabel,
  rangeStart,
  rangeEnd,
  dateScoped,
  totalRevenue,
  totalTransactions,
  totalCakesSold,
  breakdown,
}) {
  await ensureJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const ML = 14; // margin-left
  const MR = 14; // margin-right

  // ── Load logo ──
  const logoBase64 = await loadImageAsBase64('/src/assets/logo.png');

  let y = 14; // current Y cursor

  // ══════════════════════════════════════════════════════
  // HEADER — Logo (left) + Title block (right of logo)
  // Matches reference: logo top-left, "SALES REPORT" large,
  // "PERIOD: ..." subtitle underneath, all on white bg.
  // ══════════════════════════════════════════════════════
  const LOGO_SIZE = 28; // logo height in mm (roughly square)
  const LOGO_X    = ML;
  const LOGO_Y    = y;

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE);
  }

  const titleX = logoBase64 ? LOGO_X + LOGO_SIZE + 6 : ML;

  // "SALES REPORT" — large bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...BLACK);
  doc.text('SALES REPORT', titleX, LOGO_Y + 12);

  // Period subtitle
  const periodText = rangeStart === rangeEnd
    ? `PERIOD:  ${formatDate(rangeStart).toUpperCase()}`
    : `PERIOD:  ${formatDate(rangeStart).toUpperCase()} - ${formatDate(rangeEnd).toUpperCase()}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(periodText, titleX, LOGO_Y + 21);

  // Generated timestamp (small, far right)
  const generated = `Generated: ${new Date().toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(generated, PW - MR, LOGO_Y + 4, { align: 'right' });

  y = LOGO_Y + LOGO_SIZE + 10;

  // ══════════════════════════════════════════════════════
  // SECTION: SUMMARY TABLE
  // Two-column table: Summary | Value
  // ══════════════════════════════════════════════════════
  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Summary', 'Value']],
    body: [
      ['Total Sales Revenue', `\u20B1${totalRevenue.toLocaleString()}`],
      ['Total Transactions',  String(totalTransactions)],
      ['Total Cakes Sold',    String(totalCakesSold)],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: BLACK,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: GREY_HEADER,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ══════════════════════════════════════════════════════
  // SECTION HEADING: REVENUE BREAKDOWN
  // ══════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text('REVENUE BREAKDOWN', ML, y);
  y += 4;

  // ══════════════════════════════════════════════════════
  // REVENUE BREAKDOWN TABLE
  // Two-column: Order Type | Sales Revenue
  // ══════════════════════════════════════════════════════
  doc.autoTable({
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Order Type', 'Sales Revenue']],
    body: [
      ['Delivery',     `\u20B1${(breakdown['Delivery']?.amount     || 0).toLocaleString()}`],
      ['Reservation',  `\u20B1${(breakdown['Reservation']?.amount  || 0).toLocaleString()}`],
      ['Custom Order', `\u20B1${(breakdown['Custom Order']?.amount || 0).toLocaleString()}`],
      ['Walk-In',      `\u20B1${(breakdown['Walk-In']?.amount      || 0).toLocaleString()}`],
    ],
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: BLACK,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: GREY_HEADER,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { halign: 'center' },
    },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  y = doc.lastAutoTable.finalY + 12;

  // ══════════════════════════════════════════════════════
  // SECTION HEADING: SALES RECORDS
  // ══════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text('SALES RECORDS', ML, y);
  y += 4;

  // ══════════════════════════════════════════════════════
  // SALES RECORDS TABLE — all rows, no pagination
  // ══════════════════════════════════════════════════════
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
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: BLACK,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: GREY_HEADER,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 30, halign: 'center' },
    },
    alternateRowStyles: { fillColor: GREY_LIGHT },
  });

  // ══════════════════════════════════════════════════════
  // PAGE FOOTER — page numbers on every page
  // ══════════════════════════════════════════════════════
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Regis Cake Shop — Confidential', ML, PH - 8);
    doc.text(`Page ${p} of ${pageCount}`, PW - MR, PH - 8, { align: 'right' });
    // thin rule above footer
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.4);
    doc.line(ML, PH - 12, PW - MR, PH - 12);
  }

  // ── Save ──
  const safePeriod = `${rangeStart}_to_${rangeEnd}`.replace(/-/g, '');
  doc.save(`BakerySalesReport_${safePeriod}.pdf`);
}

/* ──────────────────────────────────────────────────────────────
   AGGREGATED SALES DATA
   TODO: Backend - Replace this derived array with a direct API call
   Endpoint: GET /api/sales?status=completed
────────────────────────────────────────────────────────────── */
const buildSalesData = () => [

  ...INIT_DELIVERIES
    .filter(d => d.status === 'Delivered')
    .map(d => ({
      orderType:      'Delivery',
      cakeType:       d.items.length === 1
                        ? d.items[0].name
                        : `${d.items[0].name} + ${d.items.length - 1} more`,
      qty:            d.totalQty,
      amount:         d.totalPrice,
      customer:       d.customer,
      completionDate: d.deliveryDate,
    })),

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

  ...INIT_ORDERS
    .filter(o => o.status === 'Picked Up')
    .map(o => ({
      orderType:      'Custom Order',
      cakeType:       o.cakeType,
      qty:            o.quantity,
      amount:         o.price,
      customer:       o.customer,
      completionDate: o.pickupDate,
    })),

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
];

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
────────────────────────────────────────────────────────────── */

const PER_PAGE = 7;

const SalesOverview = () => {

  const [salesData,   setSalesData]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [exporting,   setExporting]   = useState(false);

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
  // DATE-SCOPED SALES
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
      result[type] = {
        amount: dateScoped.filter(s => s.orderType === type).reduce((sum, s) => sum + s.amount, 0),
        count:  dateScoped.filter(s => s.orderType === type).length,
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
        dateLabel,
        rangeStart,
        rangeEnd,
        dateScoped,        // ALL scoped rows — ignores pagination + typeFilter
        totalRevenue,
        totalTransactions,
        totalCakesSold,
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
    // TODO: Backend - Fetch sales data on mount
    // setSalesData(buildSalesData()); — current mock approach
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
          <p className="so-subtitle">Completed transactions only — Delivered, Picked Up, and Walk-In orders</p>
        </div>

        {/* ── Right-side controls: Date Filter + Export Report ── */}
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
          3. REVENUE BREAKDOWN
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
          ===================================================== */}
      <div className="so-table-container">

        <div className="so-table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="so-table-section-title">Sales Records</span>
            <span className="so-table-count-pill">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
              {typeFilter && ` · ${typeFilter}`}
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