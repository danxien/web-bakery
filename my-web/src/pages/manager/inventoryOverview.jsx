// =============================================================
// InventoryOverview.jsx
// -------------------------------------------------------------
// PURPOSE: Displays inventory stock levels, expiry status,
//          alerts for low/expiring stock, and a filterable table.
// =============================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers, Package, AlertCircle, AlertTriangle, Filter
} from 'lucide-react';
import '../../styles/manager/inventoryOverview.css';

// TODO: Backend - Replace with: const TODAY = new Date();
const TODAY = new Date();

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * System-calculated status — never set manually.
 * Fresh:       more than 2 days before expiry
 * Near Expiry: 1–2 days before expiry
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

// TODO: Backend - Fetch this threshold value from API or config (per-cake-type)
const LOW_STOCK_THRESHOLD = 5;
const PER_PAGE = 6;

const InventoryOverview = () => {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched inventory data
  // Expected shape per item:
  // {
  //   name:   string  — cake product name
  //   qty:    number  — current quantity in stock for this batch
  //   price:  number  — unit selling price (₱)
  //   made:   string  — production date (YYYY-MM-DD)
  //   expiry: string  — expiry date (YYYY-MM-DD)
  //   // NOTE: status is computed from expiry, not stored on backend
  // }
  // Multiple rows with the same name = multiple batches (FIFO)
  // -----------------------------------------------------------
  const [inventoryData, setInventoryData] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const [filter,       setFilter]       = useState('All');
  const [quickFilter,  setQuickFilter]  = useState('all');
  const [page,         setPage]         = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  function activateQuick(key) {
    setQuickFilter(prev => (prev === key ? 'all' : key));
    setPage(1);
  }

  // Attach computed status to every item after fetch
  const fullInventory = useMemo(() =>
    inventoryData.map(item => ({ ...item, status: computeStatus(item.expiry) })),
  [inventoryData]);


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // -----------------------------------------------------------
  const totalCakeTypes = useMemo(() =>
    new Set(fullInventory.map(i => i.name)).size,
  [fullInventory]);

  const totalCakesInStock = useMemo(() =>
    fullInventory.reduce((sum, i) => sum + i.qty, 0),
  [fullInventory]);

  const nearExpiryCount = useMemo(() =>
    fullInventory
      .filter(i => i.status === 'Near Expiry')
      .reduce((sum, i) => sum + i.qty, 0),
  [fullInventory]);

  const lowStockCount = useMemo(() =>
    fullInventory
      .filter(i => i.qty <= LOW_STOCK_THRESHOLD && i.status !== 'Expired')
      .reduce((sum, i) => sum + i.qty, 0),
  [fullInventory]);

  const expiredCount = useMemo(() =>
    fullInventory
      .filter(i => i.status === 'Expired')
      .reduce((sum, i) => sum + i.qty, 0),
  [fullInventory]);


  // -----------------------------------------------------------
  // FILTER LOGIC
  // -----------------------------------------------------------
  const filterOptions = ['All', 'Fresh', 'Near Expiry', 'Expired'];

  const filteredData = useMemo(() => {
    if (quickFilter === 'low-stock')   return fullInventory.filter(i => i.qty <= LOW_STOCK_THRESHOLD && i.status !== 'Expired');
    if (quickFilter === 'near-expiry') return fullInventory.filter(i => i.status === 'Near Expiry');
    if (quickFilter === 'expired')     return fullInventory.filter(i => i.status === 'Expired');
    if (filter !== 'All')              return fullInventory.filter(i => i.status === filter);
    return fullInventory;
  }, [quickFilter, filter, fullInventory]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged      = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [filteredData]);


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend - Fetch inventory data on mount
    // Example:
    // const fetchInventory = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/inventory');
    //     const data = await response.json();
    //     setInventoryData(data.items);
    //   } catch (err) {
    //     setError('Failed to load inventory data.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchInventory();
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
  if (loading) return <div className="inventory-page-container"><p>Loading inventory...</p></div>;
  if (error)   return <div className="inventory-page-container"><p>{error}</p></div>;

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
          2. METRIC CARDS
          ===================================================== */}
      <div className="metrics-row">

        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cake Types</span>
            <Layers className="card-icon blue-icon" size={20} />
          </div>
          <div className="card-bottom">
            <span className="metric-value">{totalCakeTypes}</span>
            <span className="metric-subtext">Unique cake varieties</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cakes in Stock</span>
            <Package className="card-icon green-icon" size={20} />
          </div>
          <div className="card-bottom">
            <span className="metric-value">{totalCakesInStock}</span>
            <span className="metric-subtext">Units across all batches</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Near Expiry Cakes</span>
            <AlertCircle className="card-icon yellow-icon" size={20} />
          </div>
          <div className="card-bottom">
            <span className="metric-value">{nearExpiryCount}</span>
            <span className="metric-subtext">
              {nearExpiryCount === 1 ? 'Cake expiring within 2 days' : 'Cakes expiring within 2 days'}
            </span>
          </div>
        </div>

      </div>


      {/* =====================================================
          3. ALERTS
          ===================================================== */}
      <div className="alerts-container">

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
          4. TABLE
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
                        setPage(1);
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {quickFilter !== 'all' && (
              <button
                className="filter-icon-btn"
                onClick={() => { setQuickFilter('all'); setPage(1); }}
              >
                ✕ Clear
              </button>
            )}

          </div>
        </div>

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
              {paged.length > 0 ? (
                paged.map((item, idx) => (
                  <tr key={idx} className={item.status === 'Expired' ? 'row-expired' : ''}>
                    <td className="cake-name-text">{item.name}</td>
                    <td className={item.qty <= LOW_STOCK_THRESHOLD ? 'qty-low' : ''}>
                      {item.qty}
                    </td>
                    <td className="price-text">₱{item.price.toLocaleString()}</td>
                    <td>{formatDate(item.made)}</td>
                    <td className={item.status === 'Expired' ? 'expiry-overdue' : item.status === 'Near Expiry' ? 'expiry-soon' : ''}>
                      {formatDate(item.expiry)}
                    </td>
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

        <div className="inventory-pagination">
          <span className="inventory-pagination-info">
            {filteredData.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filteredData.length)} of ${filteredData.length}`}
          </span>
          <div className="inventory-pagination-btns">
            <button
              className="inventory-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`inventory-page-btn ${page === p ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="inventory-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              ›
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InventoryOverview;