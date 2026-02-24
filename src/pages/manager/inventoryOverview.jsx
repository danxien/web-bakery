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

import React, { useState, useRef, useEffect } from 'react';
import {
  Package, CheckCircle, AlertCircle, AlertTriangle, Filter
} from 'lucide-react';
import '../../styles/manager/inventoryOverview.css';

const InventoryOverview = () => {

  // -----------------------------------------------------------
  // UI STATE — no backend changes needed here
  // -----------------------------------------------------------
  const [filter, setFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 BACKEND: Add state variables for fetched data and loading/error handling
  // const [inventoryData, setInventoryData] = useState([]);
  // const [alerts, setAlerts] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);


  // -----------------------------------------------------------
  // 🔹 BACKEND: MOCK DATA — Replace this entire array with an
  //    API call result. See useEffect below for where to fetch.
  //
  //    Expected shape of each item from the backend:
  //    {
  //      id:     number   — unique cake record ID
  //      name:   string   — cake product name
  //      qty:    number   — current quantity in stock
  //      made:   string   — production date (YYYY-MM-DD)
  //      expiry: string   — expiry date (YYYY-MM-DD)
  //      status: string   — one of: 'Fresh' | 'Near Expiry' | 'Expired'
  //    }
  // -----------------------------------------------------------
  const fullInventory = [
    // 🔹 BACKEND: Replace with API response — e.g. setInventoryData(response.data)
    { id: 1, name: 'Chocolate Fudge Cake', qty: 24, made: '2026-02-17', expiry: '2026-02-21', status: 'Fresh' },
    { id: 2, name: 'Red Velvet Cake',       qty: 3,  made: '2026-02-16', expiry: '2026-02-20', status: 'Near Expiry' },
    { id: 3, name: 'Mango Chiffon',         qty: 5,  made: '2026-02-15', expiry: '2026-02-19', status: 'Near Expiry' },
    { id: 4, name: 'Blueberry Cheesecake',  qty: 2,  made: '2026-02-14', expiry: '2026-02-18', status: 'Expired' },
    { id: 5, name: 'Strawberry Shortcake',  qty: 18, made: '2026-02-18', expiry: '2026-02-22', status: 'Fresh' },
    { id: 6, name: 'Lemon Pound Cake',      qty: 12, made: '2026-02-17', expiry: '2026-02-23', status: 'Fresh' },
  ];


  // -----------------------------------------------------------
  // DERIVED METRIC VALUES
  // 🔹 BACKEND: These are auto-calculated from `fullInventory`.
  //    Once you replace the mock data with real API data, these
  //    will automatically reflect the correct values — no extra
  //    changes needed here unless the backend returns pre-aggregated
  //    totals (e.g. from a summary endpoint), in which case
  //    replace each variable with the corresponding API field.
  //
  //    e.g. const totalCakes = summaryData.totalQty;
  //         const freshCakes = summaryData.freshQty;
  //         const nearExpiryQty = summaryData.nearExpiryQty;
  // -----------------------------------------------------------
  const totalCakes    = fullInventory.reduce((sum, i) => sum + i.qty, 0);
  // 🔹 BACKEND: Replace with API response field if pre-computed — e.g. data.totalCakes
  
  const freshCakes    = fullInventory.filter(i => i.status === 'Fresh').reduce((sum, i) => sum + i.qty, 0);
  // 🔹 BACKEND: Replace with API response field if pre-computed — e.g. data.freshCount

  const nearExpiryQty = fullInventory.filter(i => i.status === 'Near Expiry').reduce((sum, i) => sum + i.qty, 0);
  // 🔹 BACKEND: Replace with API response field if pre-computed — e.g. data.nearExpiryCount


  // -----------------------------------------------------------
  // FILTER LOGIC
  // 🔹 BACKEND (OPTIONAL): If filtering is done server-side,
  //    move the filter logic into the useEffect below and pass
  //    `filter` as a query parameter to the API:
  //    e.g. GET /api/inventory?status=Near+Expiry
  //
  //    If filtering is client-side (current approach), no changes needed.
  // -----------------------------------------------------------
  const filteredData  = fullInventory.filter(i => filter === 'All' || i.status === filter);
  const filterOptions = ['All', 'Fresh', 'Near Expiry', 'Expired'];


  // -----------------------------------------------------------
  // useEffect — SIDE EFFECTS & API CALLS GO HERE
  // -----------------------------------------------------------
  useEffect(() => {
    // 🔹 BACKEND: This is the correct place to fetch inventory data on page load.
    //    Uncomment and replace the fetch URL with your actual API endpoint.
    //
    //    Example using fetch():
    //    -------------------------------------------------
    //    const fetchInventory = async () => {
    //      try {
    //        setLoading(true);
    //        const response = await fetch('/api/inventory');
    //        const data = await response.json();
    //        setInventoryData(data.items);   // replaces fullInventory
    //        setAlerts(data.alerts);         // replaces hardcoded alert rows
    //      } catch (err) {
    //        setError('Failed to load inventory data.');
    //      } finally {
    //        setLoading(false);
    //      }
    //    };
    //    fetchInventory();
    //
    //    Example using axios():
    //    -------------------------------------------------
    //    const fetchInventory = async () => {
    //      try {
    //        setLoading(true);
    //        const { data } = await axios.get('/api/inventory');
    //        setInventoryData(data.items);
    //        setAlerts(data.alerts);
    //      } catch (err) {
    //        setError(err.message);
    //      } finally {
    //        setLoading(false);
    //      }
    //    };
    //    fetchInventory();

    // CURRENT: Close dropdown on outside click (UI only — keep this as-is)
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);

    // 🔹 BACKEND: If refetching on filter change (server-side filtering), add
    //    `filter` to the dependency array: useEffect(() => { ... }, [filter]);
  }, []);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  return (
    <div className="inventory-page-container">

      {/* HEADER */}
      <div className="inventory-header">
        <h1 className="inventory-title">Inventory Overview</h1>
        <p className="inventory-subtitle">Monitor stock levels and expiry dates</p>
      </div>

      {/* =======================================================
          METRIC CARDS
          🔹 BACKEND: Each metric value below is derived from
          `fullInventory`. Replace `fullInventory` with state data
          from your API call and these cards update automatically.
          ======================================================= */}
      <div className="metrics-row">

        {/* Total Cakes */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Total Cakes</span>
            <Package className="card-icon blue-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: Replace `totalCakes` with API total qty field */}
            <span className="metric-value">{totalCakes}</span>
            <span className="metric-subtext">Units in stock</span>
          </div>
        </div>

        {/* Fresh Cakes */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Fresh Cakes</span>
            <CheckCircle className="card-icon green-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: Replace `freshCakes` with API fresh count field */}
            <span className="metric-value">{freshCakes}</span>
            <span className="metric-subtext">Safe to sell</span>
          </div>
        </div>

        {/* Near Expiry */}
        <div className="metric-card">
          <div className="card-top">
            <span className="metric-label">Near Expiry</span>
            <AlertCircle className="card-icon yellow-icon" size={20} />
          </div>
          <div className="card-bottom">
            {/* 🔹 BACKEND: Replace `nearExpiryQty` with API near-expiry count field */}
            <span className="metric-value">{nearExpiryQty}</span>
            <span className="metric-subtext">Expiring soon</span>
          </div>
        </div>

      </div>

      {/* =======================================================
          ALERTS SECTION
          🔹 BACKEND: These alert rows are currently hardcoded.
          Replace with a dynamic list mapped from backend data.

          Expected alert object shape from API:
          {
            id:       number   — unique alert ID
            type:     string   — 'critical' | 'warning'
            message:  string   — alert text to display
          }

          Replace the three static <div className="alert-wrapper">
          blocks below with a dynamic map like:
          -------------------------------------------------
          {alerts.map(alert => (
            <div key={alert.id} className="alert-wrapper">
              <div className={`alert-row ${alert.type}`}>
                <AlertTriangle size={16} />
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
          -------------------------------------------------
          ======================================================= */}
      <div className="alerts-container">

        {/* 🔹 BACKEND: MOCK ALERT — Replace with dynamic alerts from API */}
        <div className="alert-wrapper">
          <div className="alert-row critical">
            <AlertTriangle size={16} />
            <span>Red Velvet Cake — Only 3 left in stock</span>
          </div>
        </div>

        {/* 🔹 BACKEND: MOCK ALERT — Replace with dynamic alerts from API */}
        <div className="alert-wrapper">
          <div className="alert-row warning">
            <AlertTriangle size={16} />
            <span>Mango Chiffon — Expires tomorrow (5 pcs)</span>
          </div>
        </div>

        {/* 🔹 BACKEND: MOCK ALERT — Replace with dynamic alerts from API */}
        <div className="alert-wrapper">
          <div className="alert-row warning">
            <AlertTriangle size={16} />
            <span>Blueberry Cheesecake — Expired (2 pcs)</span>
          </div>
        </div>

      </div>

      {/* =======================================================
          INVENTORY TABLE
          🔹 BACKEND: Table rows are mapped from `filteredData`,
          which is derived from `fullInventory` (mock).
          Replace `fullInventory` with `inventoryData` from state
          once API integration is complete.

          If server-side filtering is preferred, pass the active
          `filter` value as a query param on each filter change
          instead of filtering client-side.
          ======================================================= */}
      <div className="table-container">

        <div className="table-toolbar">
          <span className="table-section-title">Stock List</span>

          {/* FILTER DROPDOWN — UI only, no backend changes needed
              unless switching to server-side filtering           */}
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
                {/* 🔹 BACKEND (OPTIONAL): If filter options come from the API
                    (e.g. only show statuses that exist in current inventory),
                    replace `filterOptions` with a dynamically fetched list. */}
                {filterOptions.map(f => (
                  <button
                    key={f}
                    className={`dropdown-item ${filter === f ? 'selected' : ''}`}
                    onClick={() => {
                      setFilter(f);
                      setDropdownOpen(false);
                      // 🔹 BACKEND (OPTIONAL): Trigger an API call here if
                      //    using server-side filtering:
                      //    fetchInventory(f); // pass filter as argument
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Cake Name</th>
              <th>Qty</th>
              <th>Made Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* 🔹 BACKEND: Map API inventory items here.
                `filteredData` comes from `fullInventory` (mock).
                Once API is connected, this will read from `inventoryData` state.
                
                Each row expects: item.name, item.qty, item.made, item.expiry, item.status
                Ensure backend field names match — update property accessors if they differ. */}
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id}>
                  {/* 🔹 BACKEND: item.name — cake product name */}
                  <td className="cake-name-text">{item.name}</td>

                  {/* 🔹 BACKEND: item.qty — quantity in stock (highlights red if < 5) */}
                  <td className={item.qty < 5 ? 'qty-low' : ''}>{item.qty}</td>

                  {/* 🔹 BACKEND: item.made — production/made date (YYYY-MM-DD) */}
                  <td>{item.made}</td>

                  {/* 🔹 BACKEND: item.expiry — expiry date (YYYY-MM-DD) */}
                  <td>{item.expiry}</td>

                  {/* 🔹 BACKEND: item.status — must be 'Fresh', 'Near Expiry', or 'Expired'
                      The CSS class is derived from this value — ensure backend returns
                      exact strings or add a mapping function here. */}
                  <td>
                    <span className={`status-pill ${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No items match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>

      </div>

    </div>
  );
};

export default InventoryOverview;