// =============================================================
// dashboard.jsx — Regis Cake Shop Manager Dashboard
//
// DATA CONNECTIONS (live, via module-level bridge exports):
//   Walk-In Orders → INIT_WALKIN_ORDERS  (status='Completed',  date=orderDate)
//   Reservations   → INIT_RESERVATIONS   (status='Picked Up',  date=pickupDate)
//   Custom Orders  → INIT_ORDERS         (status='Delivered',  date=deliveryDate)
//
//   Each source module sets INIT_* = data.records after its backend fetch,
//   which triggers a re-render here via the dateFilter state dependency.
//   When the backend is ready, replace the three imports + buildAllSales()
//   with a single GET /api/sales?status=completed fetch stored in local state.
//
// SECTIONS:
//   1. Header   — title + date filter
//   2. Top row  — Sales Trend (area) · Revenue Breakdown (solid pie, pop-out click)
//   3. Bottom   — Top Selling Cakes (dual-axis bar, fixed top-right tooltip)
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Calendar, ChevronDown } from 'lucide-react';
import '../../styles/manager/dashboard.css';

// TODO: Backend — replace these three imports with a unified
//   GET /api/sales?status=completed call stored in local state.
//   Each INIT_* array is populated by its own page's fetch on mount.
import { INIT_WALKIN_ORDERS } from './walkInOrders';
import { INIT_RESERVATIONS }  from './reservationOverview';
import { INIT_ORDERS }        from './customOrders';

/* ─────────────────────────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────────────────────────── */
const TODAY     = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];

const DATE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function getDateRange(filter, customStart, customEnd) {
  const s = new Date(TODAY);
  const e = new Date(TODAY);
  switch (filter) {
    case 'today': return { start: TODAY_STR, end: TODAY_STR };
    case 'week': {
      const day = s.getDay();
      s.setDate(s.getDate() - day);
      e.setDate(e.getDate() + (6 - day));
      return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
    }
    case 'month':
      return {
        start: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1).toISOString().split('T')[0],
        end:   new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).toISOString().split('T')[0],
      };
    case 'custom': return { start: customStart || TODAY_STR, end: customEnd || TODAY_STR };
    default:       return { start: TODAY_STR, end: TODAY_STR };
  }
}

function inRange(date, start, end) { return date >= start && date <= end; }

function fmt(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function datesBetween(start, end) {
  const dates = [];
  const cur   = new Date(start + 'T00:00:00');
  const last  = new Date(end   + 'T00:00:00');
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/* ─────────────────────────────────────────────────────────────
   PALETTE
   Walk-In / Reservation / Custom Order colours match the
   so-icon-* mapping used in salesOverview.css / salesOverview.jsx.
   Bar chart uses teal (qty) and amber (revenue) for contrast.
───────────────────────────────────────────────────────────── */
const C = {
  walkIn : '#db2777',   // deep pink   — Walk-In
  res    : '#16a34a',   // deep green  — Reservations
  co     : '#d97706',   // deep amber  — Custom Orders
  barQty : '#0284c7',   // deep sky-blue — qty sold bars
  barRev : '#7c3aed',   // deep violet   — revenue bars
  grid   : '#ebebeb',
};

/* ─────────────────────────────────────────────────────────────
   DATA BUILDERS
   buildAllSales() — merges the three INIT_* bridge arrays into a
   single flat list of completed transactions for the date range.

   TODO: Backend — replace buildAllSales() with a response from
     GET /api/sales?status=completed&from={rangeStart}&to={rangeEnd}
     Once available, store in a useState and pass directly to the
     three chart builders below instead of calling buildAllSales().
───────────────────────────────────────────────────────────── */
function buildAllSales(rangeStart, rangeEnd) {

  // TODO: Backend will provide completed transactions here
  return [

    // Walk-In Orders — Completed → date = orderDate
    ...INIT_WALKIN_ORDERS
      .filter(w => w.status === 'Completed' && inRange(w.orderDate, rangeStart, rangeEnd))
      .map(w => ({
        orderType: 'Walk-In',
        cakeType:  w.cakeType,
        qty:       w.quantity,
        amount:    w.price,
        date:      w.orderDate,
      })),

    // Reservations — Picked Up → date = pickupDate
    ...INIT_RESERVATIONS
      .filter(r => r.status === 'Picked Up' && inRange(r.pickupDate, rangeStart, rangeEnd))
      .map(r => ({
        orderType: 'Reservation',
        cakeType:  r.cakeType,
        qty:       r.quantity,
        amount:    r.quantity * r.price,
        date:      r.pickupDate,
      })),

    // Custom Orders — Delivered → date = deliveryDate
    ...INIT_ORDERS
      .filter(o => o.status === 'Delivered' && inRange(o.deliveryDate, rangeStart, rangeEnd))
      .map(o => ({
        orderType: 'Custom Order',
        cakeType:  o.cakeType,
        qty:       o.quantity,
        amount:    o.price,
        date:      o.deliveryDate,
      })),

  ];
}

function buildTrendData(sales, rangeStart, rangeEnd) {
  return datesBetween(rangeStart, rangeEnd).map(date => {
    const day = sales.filter(s => s.date === date);
    return {
      label  : fmt(date),
      walkIn : day.filter(s => s.orderType === 'Walk-In').reduce((n, s) => n + s.amount, 0),
      res    : day.filter(s => s.orderType === 'Reservation').reduce((n, s) => n + s.amount, 0),
      co     : day.filter(s => s.orderType === 'Custom Order').reduce((n, s) => n + s.amount, 0),
    };
  });
}

function buildBreakdown(sales) {
  const total = sales.reduce((n, s) => n + s.amount, 0);
  return [
    { name: 'Walk-In Orders', type: 'Walk-In',      color: C.walkIn, value: sales.filter(s => s.orderType === 'Walk-In').reduce((n, s) => n + s.amount, 0),      count: sales.filter(s => s.orderType === 'Walk-In').length,      total },
    { name: 'Reservations',   type: 'Reservation',  color: C.res,    value: sales.filter(s => s.orderType === 'Reservation').reduce((n, s) => n + s.amount, 0),  count: sales.filter(s => s.orderType === 'Reservation').length,  total },
    { name: 'Custom Orders',  type: 'Custom Order', color: C.co,     value: sales.filter(s => s.orderType === 'Custom Order').reduce((n, s) => n + s.amount, 0), count: sales.filter(s => s.orderType === 'Custom Order').length, total },
  ].filter(d => d.value > 0);
}

function buildTopSellers(sales) {
  const map = {};
  sales.forEach(s => {
    if (!map[s.cakeType]) map[s.cakeType] = { name: s.cakeType, qty: 0, revenue: 0 };
    map[s.cakeType].qty     += s.qty;
    map[s.cakeType].revenue += s.amount;
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 6);
}

/* ─────────────────────────────────────────────────────────────
   SVG SOLID PIE CHART
   • Pure SVG — zero Recharts focus outlines / black borders.
   • No hover tooltip, no centre label.
   • Selected segment pops out with spring transition + drop-shadow.
───────────────────────────────────────────────────────────── */
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const s = polarToXY(cx, cy, r, startAngle);
  const e = polarToXY(cx, cy, r, endAngle);
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function SolidPieChart({ data, selectedType, onSegmentClick }) {
  const SIZE   = 190;
  const CX     = SIZE / 2;
  const CY     = SIZE / 2;
  const RADIUS = 82;
  const POP    = 9;

  const total = data.reduce((n, d) => n + d.value, 0);

  const slices = useMemo(() => {
    let angle = 0;
    return data.map(entry => {
      const sweep  = (entry.value / total) * 360;
      const start  = angle;
      const end    = angle + sweep;
      angle = end;
      const mid    = start + sweep / 2;
      const midRad = ((mid - 90) * Math.PI) / 180;
      return {
        ...entry,
        start, end,
        dx: Math.cos(midRad) * POP,
        dy: Math.sin(midRad) * POP,
      };
    });
  }, [data, total]);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ overflow: 'visible', display: 'block', outline: 'none' }}
    >
      {slices.map((s, idx) => {
        const isSelected = selectedType === s.type;
        return (
          <path
            key={idx}
            d={describeSlice(CX, CY, RADIUS, s.start, s.end)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={2.5}
            style={{
              transform:  isSelected ? `translate(${s.dx}px, ${s.dy}px)` : 'translate(0,0)',
              transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), filter 0.22s ease',
              cursor:     'pointer',
              outline:    'none',
              filter:     isSelected
                ? `drop-shadow(${s.dx * 0.4}px ${s.dy * 0.4}px 5px rgba(0,0,0,0.25))`
                : 'none',
            }}
            onClick={() => onSegmentClick(s.type)}
          />
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   TREND TOOLTIP — only rows with value > 0; escapes upward
───────────────────────────────────────────────────────────── */
const TT_STYLE = { pointerEvents: 'none', zIndex: 9999 };

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = [
    { label: 'Walk-In',      color: C.walkIn, val: payload.find(p => p.dataKey === 'walkIn')?.value ?? 0 },
    { label: 'Reservation',  color: C.res,    val: payload.find(p => p.dataKey === 'res')?.value    ?? 0 },
    { label: 'Custom Order', color: C.co,     val: payload.find(p => p.dataKey === 'co')?.value     ?? 0 },
  ].filter(r => r.val > 0);
  if (!rows.length) return null;
  return (
    <div className="dash-tt">
      <p className="dash-tt-head">{label}</p>
      {rows.map((r, i) => (
        <p key={i} className="dash-tt-row">
          <span className="dash-tt-dot" style={{ background: r.color }} />
          <span className="dash-tt-label">{r.label}</span>
          <span className="dash-tt-val">₱{r.val.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BAR TOOLTIP — fixed position top-right of chart container
───────────────────────────────────────────────────────────── */
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tt">
      <p className="dash-tt-head">{label}</p>
      <p className="dash-tt-row">
        <span className="dash-tt-dot" style={{ background: C.barQty }} />
        <span className="dash-tt-label">Qty Sold</span>
        <span className="dash-tt-val">{payload[0]?.value ?? 0} pcs</span>
      </p>
      <p className="dash-tt-row">
        <span className="dash-tt-dot" style={{ background: C.barRev }} />
        <span className="dash-tt-label">Revenue</span>
        <span className="dash-tt-val">₱{(payload[1]?.value ?? 0).toLocaleString()}</span>
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const Dashboard = () => {

  const [dateFilter,   setDateFilter]   = useState('month');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  // null = show all lines; 'Walk-In' | 'Reservation' | 'Custom Order' = filter trend + pie
  const [selectedType, setSelectedType] = useState(null);
  const dateDropRef = useRef(null);


  /* ── Date Range ── */
  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getDateRange(dateFilter, customStart, customEnd),
    [dateFilter, customStart, customEnd]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd)
      return `${fmt(customStart)} – ${fmt(customEnd)}`;
    return DATE_OPTIONS.find(o => o.key === dateFilter)?.label ?? 'This Month';
  }, [dateFilter, customStart, customEnd]);


  /* ── Sales data — derived from INIT_* bridge arrays ──
     INIT_* are module-level refs, not React state, so they are NOT
     reactive dependency targets. allSales re-derives whenever the
     date range changes, which covers the normal post-fetch scenario
     because each source module's fetch triggers its own state update,
     which causes its parent to re-render and repopulate its INIT_* ref
     before the user navigates to the dashboard.

     TODO: Backend — once GET /api/sales?status=completed is available,
       store the response in useState here and remove buildAllSales().
  ── */
  const allSales = useMemo(
    () => buildAllSales(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );


  /* ── Derived chart data ── */
  const trendData  = useMemo(() => buildTrendData(allSales, rangeStart, rangeEnd), [allSales, rangeStart, rangeEnd]);
  const breakdown  = useMemo(() => buildBreakdown(allSales),  [allSales]);
  const topSellers = useMemo(() => buildTopSellers(allSales), [allSales]);


  /* ── Trend lines: all 3 when nothing selected; only the matched one when filtered ── */
  const ALL_LINES = [
    { key: 'walkIn', name: 'Walk-In',      color: C.walkIn, type: 'Walk-In' },
    { key: 'res',    name: 'Reservation',  color: C.res,    type: 'Reservation' },
    { key: 'co',     name: 'Custom Order', color: C.co,     type: 'Custom Order' },
  ];
  const trendLines = selectedType
    ? ALL_LINES.filter(l => l.type === selectedType)
    : ALL_LINES;


  /* ── Handlers ── */
  function handleSegmentClick(type) {
    setSelectedType(prev => prev === type ? null : type);
  }

  function handleDateSelect(key) {
    setDateFilter(key);
    if (key !== 'custom') setDateDropOpen(false);
  }

  function applyCustomRange() {
    if (customStart && customEnd) setDateDropOpen(false);
  }


  /* ── Effects ── */
  useEffect(() => {
    const h = e => {
      if (dateDropRef.current && !dateDropRef.current.contains(e.target))
        setDateDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const noData = allSales.length === 0;


  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="dash-page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Sales overview — Walk-In · Reservations · Custom Orders</p>
        </div>

        <div className="dash-drop-wrap" ref={dateDropRef}>
          <button
            className={`dash-date-btn${dateDropOpen ? ' open' : ''}`}
            onClick={() => setDateDropOpen(p => !p)}
          >
            <Calendar size={15} strokeWidth={2} />
            <span>{dateLabel}</span>
            <ChevronDown size={12} />
          </button>

          {dateDropOpen && (
            <div className="dash-dropdown">
              {DATE_OPTIONS.map(opt => (
                <button key={opt.key}
                  className={`dash-drop-item${dateFilter === opt.key ? ' selected' : ''}`}
                  onClick={() => handleDateSelect(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
              <div className="dash-custom-section">
                <span className="dash-custom-title">Custom Range</span>
                <label className="dash-custom-label">From</label>
                <input type="date" className="dash-date-input" value={customStart}
                  onChange={e => { setCustomStart(e.target.value); setDateFilter('custom'); }} />
                <label className="dash-custom-label">To</label>
                <input type="date" className="dash-date-input" value={customEnd} min={customStart}
                  onChange={e => { setCustomEnd(e.target.value); setDateFilter('custom'); }} />
                <button className="dash-apply-btn" onClick={applyCustomRange}
                  disabled={!customStart || !customEnd}>Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ══ TOP ROW: Sales Trend + Revenue Breakdown ════════════ */}
      <div className="dash-row">

        {/* ── Sales Trend ── */}
        <div className="dash-card">
          <div className="dash-card-head">
            <div>
              <h2 className="dash-card-title">Sales Trend</h2>
              <p className="dash-card-sub">Revenue over time · {dateLabel}</p>
            </div>
            <div className="dash-legend">
              {ALL_LINES.map(l => (
                <span key={l.key}
                  className={`dash-leg-item${selectedType && selectedType !== l.type ? ' dash-leg-item--dim' : ''}`}
                  onClick={() => handleSegmentClick(l.type)}
                >
                  <span className="dash-leg-dot" style={{ background: l.color }} />
                  {l.name}
                </span>
              ))}
              {selectedType && (
                <button className="dash-clear-btn" onClick={() => setSelectedType(null)}>✕ All</button>
              )}
            </div>
          </div>

          <div className="dash-card-body">
            {noData ? (
              <div className="dash-empty">No sales data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={195}>
                <AreaChart data={trendData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    {trendLines.map(l => (
                      <linearGradient key={l.key} id={`g-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={l.color} stopOpacity={selectedType ? 0.55 : 0.42} />
                        <stop offset="100%" stopColor={l.color} stopOpacity={0.04} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
                    tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} width={44}
                  />
                  <Tooltip
                    content={<TrendTooltip />}
                    cursor={false}
                    wrapperStyle={TT_STYLE}
                    allowEscapeViewBox={{ x: false, y: true }}
                    offset={16}
                  />
                  {trendLines.map(l => (
                    <Area key={l.key} type="monotone" dataKey={l.key} name={l.name}
                      stroke={l.color} strokeWidth={selectedType ? 3.5 : 3}
                      fill={`url(#g-${l.key})`}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: l.color }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Revenue Breakdown (Solid SVG Pie) ── */}
        <div className="dash-card dash-card--pie">
          <div className="dash-card-head">
            <h2 className="dash-card-title">Revenue Breakdown</h2>
            <p className="dash-card-sub">Click a segment to filter · {dateLabel}</p>
          </div>

          <div className="dash-card-body dash-card-body--pie">
            {breakdown.length === 0 ? (
              <div className="dash-empty">No sales data for this period</div>
            ) : (
              <>
                <div className="dash-pie-wrap">
                  <SolidPieChart
                    data={breakdown}
                    selectedType={selectedType}
                    onSegmentClick={handleSegmentClick}
                  />
                </div>

                <div className="dash-pie-legend">
                  {breakdown.map((entry, idx) => (
                    <div key={idx}
                      className={`dash-pie-leg-row${selectedType === entry.type ? ' is-active' : ''}${selectedType && selectedType !== entry.type ? ' is-dim' : ''}`}
                      onClick={() => handleSegmentClick(entry.type)}
                    >
                      <span className="dash-leg-dot" style={{ background: entry.color }} />
                      <span className="dash-pie-leg-name">{entry.name}</span>
                      <span className="dash-pie-leg-pct">
                        {entry.total > 0 ? ((entry.value / entry.total) * 100).toFixed(0) : 0}%
                      </span>
                      <span className="dash-pie-leg-val">₱{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>


      {/* ══ BOTTOM: Top Selling Cakes ═══════════════════════════ */}
      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <h2 className="dash-card-title">Top Selling Cakes</h2>
            <p className="dash-card-sub">Quantity sold · {dateLabel}</p>
          </div>
          <div className="dash-legend">
            <span className="dash-leg-item">
              <span className="dash-leg-dot" style={{ background: C.barQty }} />
              Qty Sold
            </span>
            <span className="dash-leg-item">
              <span className="dash-leg-dot" style={{ background: C.barRev }} />
              Revenue
            </span>
          </div>
        </div>

        <div className="dash-card-body">
          {topSellers.length === 0 ? (
            <div className="dash-empty">No sales data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={topSellers}
                margin={{ top: 4, right: 46, left: 0, bottom: 18 }}
                barCategoryGap="38%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} vertical={false} />
                <XAxis dataKey="name"
                  tick={{ fontSize: 11, fill: '#555' }}
                  axisLine={false} tickLine={false}
                  interval={0}
                  tickFormatter={v => v.length > 13 ? v.slice(0, 12) + '…' : v}
                />
                <YAxis yAxisId="qty"
                  tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} width={22}
                />
                <YAxis yAxisId="rev" orientation="right"
                  tickFormatter={v => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`}
                  tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} width={42}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={false}
                  wrapperStyle={TT_STYLE}
                  position={{ x: 'auto', y: 0 }}
                  allowEscapeViewBox={{ x: false, y: false }}
                />
                <Bar yAxisId="qty" dataKey="qty"     name="Qty Sold" fill={C.barQty} radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Bar yAxisId="rev" dataKey="revenue" name="Revenue"  fill={C.barRev} radius={[4, 4, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;