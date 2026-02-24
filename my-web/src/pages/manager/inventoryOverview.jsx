// =============================================================
// InventoryOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Displays inventory stock levels, expiry status,
//          alerts for low/expiring stock, and a filterable table.
//
// BACKEND INTEGRATION CHECKLIST:
//   [ ] Replace mock `fullInventory` array with API response
//   [ ] Replace hardcoded alert rows with dynamic alert data
//   [ ] Add loading and error states after fetching
//   [ ] Connect filter to backend query params (optional)
//   [ ] All metric values are derived — recalculate after fetch
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers, Package, AlertCircle, AlertTriangle, Filter
} from 'lucide-react';
import '../../styles/manager/inventoryOverview.css';

/* ──────────────────────────────────────────────────────────────
   MOCK "TODAY" — fixed for demo consistency.
   🔹 BACKEND: Replace with: const TODAY = new Date();
────────────────────────────────────────────────────────────── */
const TODAY_STR = '2026-02-19';
const TODAY     = new Date(TODAY_STR + 'T00:00:00');

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * System-calculated status — manager never sets this manually.
 * Fresh:       more than 2 days before expiry
 * Near Expiry: 1–2 days before expiry (expiry - today ≤ 2)
 * Expired:     today > expiry date
 */
function computeStatus(expiryStr) {
  const expiry   = new Date(expiryStr + 'T00:00:00');
  const diffDays = Math.floor((expiry - TODAY) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'Expired';
  if (diffDays <= 2) return 'Near Expiry';
  return 'Fresh';
}

function formatDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const LOW_STOCK_THRESHOLD = 5; // 🔹 BACKEND: Make this per-cake-type from API

/* ──────────────────────────────────────────────────────────────
   MOCK DATA
   🔹 BACKEND: Replace this entire array with an API call result.
   Expected shape per inventory item (one row = one batch):
   {
     id:      number   — unique batch/record ID
     name:    string   — cake product name
     qty:     number   — current quantity in stock for this batch
     price:   number   — unit selling price (₱)
     made:    string   — production date (YYYY-MM-DD)
     expiry:  string   — expiry date (YYYY-MM-DD)
     // NOTE: status is NOT stored on backend — computed here from expiry
   }
   Multiple rows with the same name = multiple batches (FIFO)
────────────────────────────────────────────────────────────── */
const RAW_INVENTORY = [
  // 🔹 BACKEND: Replace with API response — e.g. setInventoryData(response.data)
  { id: 1,  name: 'Chocolate Fudge Cake',  qty: 24, price: 850,  made: '2026-02-17', expiry: '2026-02-21' },
  { id: 2,  name: 'Red Velvet Cake',        qty: 3,  price: 950,  made: '2026-02-16', expiry: '2026-02-20' },
  { id: 3,  name: 'Mango Chiffon',          qty: 5,  price: 780,  made: '2026-02-15', expiry: '2026-02-19' },
  { id: 4,  name: 'Blueberry Cheesecake',   qty: 2,  price: 1100, made: '2026-02-14', expiry: '2026-02-18' },
  { id: 5,  name: 'Strawberry Shortcake',   qty: 18, price: 890,  made: '2026-02-18', expiry: '2026-02-22' },
  { id: 6,  name: 'Lemon Pound Cake',       qty: 12, price: 720,  made: '2026-02-17', expiry: '2026-02-23' },
  { id: 7,  name: 'Ube Macapuno Cake',      qty: 4,  price: 950,  made: '2026-02-16', expiry: '2026-02-20' },
  { id: 8,  name: 'Buko Pandan Cake',       qty: 9,  price: 720,  made: '2026-02-18', expiry: '2026-02-24' },
  // Second batch of Chocolate Fudge — FIFO demonstration
  { id: 9,  name: 'Chocolate Fudge Cake',  qty: 8,  price: 850,  made: '2026-02-18', expiry: '2026-02-22' },
  { id: 10, name: 'Caramel Custard Cake',   qty: 6,  price: 650,  made: '2026-02-17', expiry: '2026-02-21' },
];

// Attach computed status to every item (system-calculated, never manually set)
const fullInventory = RAW_INVENTORY.map(item => ({
  ...item,
  status: computeStatus(item.expiry),
}));


const InventoryOverview = () => {

  // -----------------------------------------------------------
  // UI STATE
  // -----------------------------------------------------------
  const [filter,       setFilter]       = useState('All');
  const [quickFilter,  setQuickFilter]  = useState('all'); // 'all' | 'low-stock' | 'near-expiry' | 'expired'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toggle quick filter — clicking the same alert again clears it (mirrors reservation pattern)
  function activateQuick(key) {
    setQuickFilter(prev => (prev === key ? 'all' : key));
  }

  // 🔹 BACKEND: Add state variables for fetched data and loading/error handling
  // const [inventoryData, setInventoryData] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError]     = useState(null);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: These are auto-calculated from `fullInventory`.
  //    Once you replace the mock data with real API data, these
  //    will automatically reflect the correct values.
  // -----------------------------------------------------------

  // Card 1: Total Cake Types — count of UNIQUE cake names
  const totalCakeTypes = useMemo(() =>
    new Set(fullInventory.map(i => i.name)).size,
  []);

  // Card 2: Total Cakes in Stock — sum of ALL batch quantities
  const totalCakesInStock = useMemo(() =>
    fullInventory.reduce((sum, i) => sum + i.qty, 0),
  []);

  // Card 3: Near Expiry Cakes — total qty where status === 'Near Expiry'
  const nearExpiryQty = useMemo(() =>
    fullInventory
      .filter(i => i.status === 'Near Expiry')
      .reduce((sum, i) => sum + i.qty, 0),
  []);

  // Alert counts — total NUMBER of cakes (qty sum), not number of batch rows
  const lowStockCount   = useMemo(() =>
    fullInventory
      .filter(i => i.qty <= LOW_STOCK_THRESHOLD && i.status !== 'Expired')
      .reduce((sum, i) => sum + i.qty, 0),
  []);

  const expiredCount    = useMemo(() =>
    fullInventory
      .filter(i => i.status === 'Expired')
      .reduce((sum, i) => sum + i.qty, 0),
  []);

  const nearExpiryCount = useMemo(() =>
    fullInventory
      .filter(i => i.status === 'Near Expiry')
      .reduce((sum, i) => sum + i.qty, 0),
  []);


  // -----------------------------------------------------------
  // FILTER LOGIC — quickFilter (alert clicks) takes priority
  // over the dropdown status filter, mirroring reservation pattern.
  // -----------------------------------------------------------
  const filterOptions = ['All', 'Fresh', 'Near Expiry', 'Expired'];

  const filteredData = useMemo(() => {
    // Quick filter from alert click — overrides dropdown
    if (quickFilter === 'low-stock')   return fullInventory.filter(i => i.qty <= LOW_STOCK_THRESHOLD && i.status !== 'Expired');
    if (quickFilter === 'near-expiry') return fullInventory.filter(i => i.status === 'Near Expiry');
    if (quickFilter === 'expired')     return fullInventory.filter(i => i.status === 'Expired');
    // Dropdown filter
    if (filter !== 'All') return fullInventory.filter(i => i.status === filter);
    return fullInventory;
  }, [quickFilter, filter]);


  // -----------------------------------------------------------
  // useEffect
  // -----------------------------------------------------------
  useEffect(() => {
    // 🔹 BACKEND: Fetch inventory on mount
    // const fetchInventory = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/inventory');
    //     const data = await response.json();
    //     // Attach computed status on the client after fetch:
    //     const withStatus = data.items.map(item => ({
    //       ...item,
    //       status: computeStatus(item.expiry),
    //     }));
    //     setInventoryData(withStatus);
    //   } catch (err) {
    //     setError('Failed to load inventory data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchInventory();

    // Close dropdown on outside click
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
    <div className="inventory-page-container">

      {/* =====================================================
          1. HEADER
          ===================================================== */}
      <div className="inventory-header">
        <h1 className="inventory-title">Inventory Overview</h1>
        <p className="inventory-subtitle">Monitor stock levels and expiry dates</p>
      </div>


      {/* =====================================================
          2. METRIC CARDS — 3 static display cards
          ===================================================== */}
      <div className="metrics-row">

        {/* Card 1: Total Cake Types — unique cake names */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cake Types</span>
            <Layers className="card-icon blue-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: new Set(inventoryData.map(i => i.name)).size */}
            <span className="metric-value">{totalCakeTypes}</span>
            <span className="metric-subtext">Unique cake varieties</span>
          </div>
        </div>

        {/* Card 2: Total Cakes in Stock — sum of all batch quantities */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cakes in Stock</span>
            <Package className="card-icon green-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: inventoryData.reduce((sum, i) => sum + i.qty, 0) */}
            <span className="metric-value">{totalCakesInStock}</span>
            <span className="metric-subtext">Units across all batches</span>
          </div>
        </div>

        {/* Card 3: Near Expiry Cakes — total qty expiring within 2 days */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Near Expiry Cakes</span>
            <AlertCircle className="card-icon yellow-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: computed from inventoryData after status calculation */}
            <span className="metric-value">{nearExpiryQty}</span>
            <span className="metric-subtext">
              {nearExpiryQty === 1 ? 'Cake expiring within 2 days' : 'Cakes expiring within 2 days'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS — Low Stock / Near Expiry / Expired
          Clickable buttons that filter the table — mirrors reservation pattern.
          Shows total CAKE COUNTS, not individual item lists.
          ===================================================== */}
      <div className="alerts-container">

        {/* Low Stock — critical (red) */}
        <div className="alert-wrapper">
          <button
            className={`alert-row critical ${quickFilter === 'low-stock' ? 'is-active' : ''}`}
            onClick={() => activateQuick('low-stock')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{lowStockCount}</strong>
              {' '}cake{lowStockCount !== 1 ? 's' : ''} low in stock — quantity at or below {LOW_STOCK_THRESHOLD} pcs
            </span>
          </button>
        </div>

        {/* Near Expiry — warning (yellow) */}
        <div className="alert-wrapper">
          <button
            className={`alert-row warning ${quickFilter === 'near-expiry' ? 'is-active' : ''}`}
            onClick={() => activateQuick('near-expiry')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{nearExpiryCount}</strong>
              {' '}cake{nearExpiryCount !== 1 ? 's' : ''} near expiry — expiring within 2 days, prioritize selling
            </span>
          </button>
        </div>

        {/* Expired — critical (red) */}
        <div className="alert-wrapper">
          <button
            className={`alert-row critical ${quickFilter === 'expired' ? 'is-active' : ''}`}
            onClick={() => activateQuick('expired')}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>{expiredCount}</strong>
              {' '}expired cake{expiredCount !== 1 ? 's' : ''} — do not sell, remove from stock
            </span>
          </button>
        </div>

      </div>


      {/* =====================================================
          4. TABLE — filterable, one row per batch
          ===================================================== */}
      <div className="table-container">

        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="table-section-title">Stock List</span>
            <span className="inventory-count-pill">
              {filteredData.length} batch{filteredData.length !== 1 ? 'es' : ''}
              {(quickFilter !== 'all' || filter !== 'All') && ' · filtered'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            <div className="filter-dropdown-wrapper" ref={dropdownRef}>
              <button
                className={`filter-icon-btn ${dropdownOpen ? 'open' : ''}`}
                onClick={() => setDropdownOpen(prev => !prev)}
                title="Filter by status"
              >
                <Filter size={14} />
                <span>{filter === 'All' ? 'Filter' : filter}</span>
              </button>
              {dropdownOpen && (
                <div className="filter-dropdown">
                  {filterOptions.map(f => (
                    <button
                      key={f}
                      className={`dropdown-item ${filter === f && quickFilter === 'all' ? 'selected' : ''}`}
                      onClick={() => {
                        setFilter(f);
                        setQuickFilter('all');
                        setDropdownOpen(false);
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear button — only shown when a quick filter alert is active */}
            {quickFilter !== 'all' && (
              <button
                className="filter-icon-btn"
                onClick={() => setQuickFilter('all')}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

        {/* Scrollable wrapper — sidebar-safe */}
        <div className="inventory-table-scroll">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Cake Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Date Produced</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {/*
                🔹 BACKEND: Map from inventoryData (with computed status) instead of filteredData.
                Each row = one batch. Multiple rows with same name = FIFO batches.
              */}
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item.id} className={item.status === 'Expired' ? 'row-expired' : ''}>

                    {/* 🔹 BACKEND: item.name */}
                    <td className="cake-name-text">{item.name}</td>

                    {/* 🔹 BACKEND: item.qty — red + bold if ≤ LOW_STOCK_THRESHOLD */}
                    <td className={item.qty <= LOW_STOCK_THRESHOLD ? 'qty-low' : ''}>
                      {item.qty}
                    </td>

                    {/* 🔹 BACKEND: item.price — unit selling price */}
                    <td className="price-text">₱{item.price.toLocaleString()}</td>

                    {/* 🔹 BACKEND: item.made — production date (YYYY-MM-DD) */}
                    <td>{formatDate(item.made)}</td>

                    {/* 🔹 BACKEND: item.expiry — expiry date (YYYY-MM-DD) */}
                    <td className={item.status === 'Expired' ? 'expiry-overdue' : item.status === 'Near Expiry' ? 'expiry-soon' : ''}>
                      {formatDate(item.expiry)}
                    </td>

                    {/* Status — system calculated, never manually set */}
                    <td>
                      <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                        {item.status}
                      </span>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">No items match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default InventoryOverview;