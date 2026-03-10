import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, Download, Layers, Package, Plus, X } from 'lucide-react';
import { exportRowsToCsv } from '../../utils/exportCsv';

const LOW_STOCK_QTY = 5;
const PER_PAGE = 6;

const DATE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const STATUS_CARDS = [
  { key: 'Fresh', label: 'Fresh' },
  { key: 'Near Expiry', label: 'Near Expiry' },
  { key: 'Expired', label: 'Expired' },
  { key: 'Low Stock', label: 'Low Stock' },
];

const toDate = (value) => {
  if (!value || value === '-') return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const computeStatus = (expiryDate) => {
  const expiry = toDate(expiryDate);
  if (!expiry) return 'Fresh';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 2) return 'Near Expiry';
  return 'Fresh';
};

const isWithinPeriod = (targetDate, period, customStart, customEnd) => {
  if (!targetDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'today') {
    return targetDate.getTime() === today.getTime();
  }

  if (period === 'week') {
    const start = new Date(today);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return targetDate >= start && targetDate <= end;
  }

  if (period === 'month') {
    return targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear();
  }

  if (period === 'custom') {
    const start = toDate(customStart);
    const end = toDate(customEnd);
    if (!start || !end) return true;

    const customStartDate = new Date(start);
    customStartDate.setHours(0, 0, 0, 0);

    const customEndDate = new Date(end);
    customEndDate.setHours(23, 59, 59, 999);

    return targetDate >= customStartDate && targetDate <= customEndDate;
  }

  return true;
};

const isLowStock = (item) => item.qty <= LOW_STOCK_QTY && item.computedStatus !== 'Expired';

export default function InventoryOverview({
  stockItems,
  stockAddForm,
  onChangeStockAdd,
  onAddStock,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isDateDropOpen, setIsDateDropOpen] = useState(false);
  const dateDropRef = useRef(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [page, setPage] = useState(1);

  const setNowMadeTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    onChangeStockAdd('madeTime', `${hours}:${minutes}`);
  };

  const inventoryRows = useMemo(
    () =>
      stockItems.map((item) => ({
        ...item,
        computedStatus: computeStatus(item.expiryDate),
      })),
    [stockItems]
  );

  const dateLabel = useMemo(() => {
    if (dateFilter === 'custom' && customStart && customEnd) {
      return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    }
    return DATE_OPTIONS.find((option) => option.value === dateFilter)?.label || 'All Dates';
  }, [customEnd, customStart, dateFilter]);

  const dateScoped = useMemo(
    () =>
      inventoryRows.filter((item) => {
        const d = toDate(item.expiryDate);
        return d && isWithinPeriod(d, dateFilter, customStart, customEnd);
      }),
    [customEnd, customStart, dateFilter, inventoryRows]
  );

  const totalCakeTypes = useMemo(
    () => new Set(dateScoped.map((item) => item.cake.toLowerCase())).size,
    [dateScoped]
  );

  const totalCakesInStock = useMemo(
    () => dateScoped.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [dateScoped]
  );

  const statusCounts = useMemo(
    () => ({
      Fresh: dateScoped.filter((item) => item.computedStatus === 'Fresh').reduce((sum, item) => sum + Number(item.qty || 0), 0),
      'Near Expiry': dateScoped.filter((item) => item.computedStatus === 'Near Expiry').reduce((sum, item) => sum + Number(item.qty || 0), 0),
      Expired: dateScoped.filter((item) => item.computedStatus === 'Expired').reduce((sum, item) => sum + Number(item.qty || 0), 0),
      'Low Stock': dateScoped.filter(isLowStock).reduce((sum, item) => sum + Number(item.qty || 0), 0),
    }),
    [dateScoped]
  );

  const filteredData = useMemo(() => {
    let rows = dateScoped;

    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      rows = rows.filter((item) =>
        item.cake.toLowerCase().includes(needle) ||
        String(item.price).includes(needle) ||
        item.expiryDate.includes(needle)
      );
    }

    if (statusFilter) {
      rows = statusFilter === 'Low Stock'
        ? rows.filter(isLowStock)
        : rows.filter((item) => item.computedStatus === statusFilter);
    }

    return rows;
  }, [dateScoped, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleDateSelect = (value) => {
    setDateFilter(value);
    setStatusFilter(null);
    setPage(1);
    if (value !== 'custom') {
      setIsDateDropOpen(false);
    }
  };

  const handleStatusCard = (value) => {
    setStatusFilter((prev) => (prev === value ? null : value));
    setPage(1);
  };

  const applyCustomRange = () => {
    if (!customStart || !customEnd) return;
    setDateFilter('custom');
    setIsDateDropOpen(false);
    setPage(1);
  };

  const handleExportCsv = () => {
    const columns = [
      { key: 'cake', label: 'Cake' },
      { key: 'qty', label: 'Quantity' },
      { key: 'price', label: 'Price' },
      { key: 'madeDate', label: 'Made Date' },
      { key: 'madeTime', label: 'Made Time' },
      { key: 'expiryDate', label: 'Expiry Date' },
      { key: 'computedStatus', label: 'Status' },
    ];

    exportRowsToCsv(
      `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`,
      columns,
      filteredData
    );
  };

  const handleAddStockSubmit = () => {
    const qty = Number(stockAddForm.qty);
    if (!stockAddForm.cake || Number.isNaN(qty) || qty <= 0 || !stockAddForm.madeDate || !stockAddForm.madeTime || !stockAddForm.expiryDate) return;
    onAddStock();
    setIsAddStockOpen(false);
  };

  useEffect(() => {
    const handler = (event) => {
      if (dateDropRef.current && !dateDropRef.current.contains(event.target)) {
        setIsDateDropOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [customEnd, customStart, dateFilter, searchTerm, statusFilter]);

  return (
    <>
      <div className="pkinv-page-container">
        <div className="pkinv-header">
          <div>
            <h1 className="pkinv-title">Inventory Overview</h1>
            <p className="pkinv-subtitle">Monitor stock levels and expiry dates</p>
          </div>

          <div className="pkinv-filter-dropdown-wrapper" ref={dateDropRef}>
            <button
              className={`pkinv-date-filter-btn ${isDateDropOpen ? 'open' : ''}`}
              onClick={() => setIsDateDropOpen((prev) => !prev)}
              title="Filter by date"
              type="button"
            >
              <Calendar size={16} />
              <span>{dateLabel}</span>
              <ChevronDown size={13} />
            </button>

            {isDateDropOpen && (
              <div className="pkinv-date-dropdown">
                {DATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`pkinv-dropdown-item ${dateFilter === option.value ? 'selected' : ''}`}
                    onClick={() => handleDateSelect(option.value)}
                  >
                    {option.label}
                  </button>
                ))}

                <div className="pkinv-custom-range-section">
                  <span className="pkinv-custom-range-title">Custom Range</span>
                  <label className="pkinv-custom-label">From</label>
                  <input
                    type="date"
                    className="pkinv-date-input"
                    value={customStart}
                    onChange={(event) => {
                      setCustomStart(event.target.value);
                      setDateFilter('custom');
                    }}
                  />
                  <label className="pkinv-custom-label">To</label>
                  <input
                    type="date"
                    className="pkinv-date-input"
                    value={customEnd}
                    min={customStart}
                    onChange={(event) => {
                      setCustomEnd(event.target.value);
                      setDateFilter('custom');
                    }}
                  />
                  <button type="button" className="pkinv-apply-btn" onClick={applyCustomRange} disabled={!customStart || !customEnd}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pkinv-metrics-row">
          <article className="pkinv-metric-card">
            <div className="pkinv-card-top">
              <span className="pkinv-metric-label">Total Cake Types</span>
              <Layers size={20} className="pkinv-blue-icon" />
            </div>
            <div className="pkinv-card-bottom">
              <span className="pkinv-metric-value">{totalCakeTypes}</span>
              <span className="pkinv-metric-subtext">Unique cake varieties</span>
            </div>
          </article>

          <article className="pkinv-metric-card">
            <div className="pkinv-card-top">
              <span className="pkinv-metric-label">Total Cakes in Stock</span>
              <Package size={20} className="pkinv-green-icon" />
            </div>
            <div className="pkinv-card-bottom">
              <span className="pkinv-metric-value">{totalCakesInStock}</span>
              <span className="pkinv-metric-subtext">Units across all batches</span>
            </div>
          </article>
        </div>

        <div className="pkinv-status-cards-row">
          {STATUS_CARDS.map((card) => (
            <button
              key={card.key}
              className={`pkinv-status-card pkinv-status-card--${card.key.toLowerCase().replace(/\s+/g, '-')} ${statusFilter === card.key ? 'is-active' : ''}`}
              onClick={() => handleStatusCard(card.key)}
              type="button"
            >
              <span className="pkinv-status-card-count">{statusCounts[card.key] ?? 0}</span>
              <span className="pkinv-status-card-label">{card.label}</span>
            </button>
          ))}
        </div>

        <div className="pkinv-table-container">
          <div className="pkinv-table-toolbar">
            <div>
              <span className="pkinv-table-section-title">Stock Items</span>
              <span className="pkinv-table-count-pill">{filteredData.length} items</span>
            </div>
            <div className="pkinv-toolbar-actions">
              <input
                type="text"
                className="pkinv-search-input"
                placeholder="Search cakes..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <button type="button" className="pkinv-action-btn pkinv-action-btn--primary" onClick={() => setIsAddStockOpen(true)}>
                <Plus size={14} /> Add Stock
              </button>

              <button type="button" className="pkinv-action-btn" onClick={handleExportCsv}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="pkinv-table-scroll-wrapper">
            <table className="pkinv-table">
              <thead>
                <tr>
                  <th>Cake</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Made Date</th>
                  <th>Made Time</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="pkinv-no-data">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  paged.map((item, index) => (
                    <tr key={`${item.cake}-${item.madeDate}-${index}`} className={item.computedStatus === 'Expired' ? 'row-expired' : ''}>
                      <td>
                        <span className="pkinv-cake-name-text">{item.cake}</span>
                      </td>
                      <td>
                        <span className={item.qty <= LOW_STOCK_QTY ? 'pkinv-qty-low' : ''}>{item.qty}</span>
                      </td>
                      <td>
                        <span className="pkinv-price-text">₱{Number(item.price).toFixed(2)}</span>
                      </td>
                      <td>{formatDate(item.madeDate)}</td>
                      <td>{item.madeTime || '-'}</td>
                      <td>
                        <span className={item.computedStatus === 'Near Expiry' ? 'pkinv-expiry-soon' : item.computedStatus === 'Expired' ? 'pkinv-expiry-overdue' : ''}>
                          {formatDate(item.expiryDate)}
                        </span>
                      </td>
                      <td>
                        <span className={`pkinv-status-pill ${item.computedStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                          {item.computedStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pkinv-pagination">
            <span className="pkinv-pagination-info">
              Page {page} of {totalPages}
            </span>
            <div className="pkinv-pagination-btns">
              <button
                className="pkinv-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                type="button"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`pkinv-page-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                  type="button"
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="pkinv-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                type="button"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAddStockOpen && (
        <div className="add-cake-modal-overlay" onClick={() => setIsAddStockOpen(false)}>
          <div className="add-cake-modal" onClick={(event) => event.stopPropagation()}>
            <div className="add-cake-modal-header">
              <div>
                <h3>Add Stock (Main Branch)</h3>
                <p>Fill in stock details to update inventory.</p>
              </div>
              <button className="close-modal-btn" onClick={() => setIsAddStockOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="add-cake-modal-body">
              <label>Cake Type</label>
              <select value={stockAddForm.cake} onChange={(event) => onChangeStockAdd('cake', event.target.value)}>
                {stockItems.map((item) => (
                  <option key={`stock-add-modal-${item.cake}`} value={item.cake}>
                    {item.cake}
                  </option>
                ))}
              </select>

              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={stockAddForm.qty}
                onChange={(event) => onChangeStockAdd('qty', event.target.value)}
                placeholder="0"
              />

              <label>Made Date</label>
              <input
                type="date"
                value={stockAddForm.madeDate}
                onChange={(event) => onChangeStockAdd('madeDate', event.target.value)}
              />

              <label>Made Time</label>
              <div className="inventory-modal-time-row">
                <input
                  type="time"
                  value={stockAddForm.madeTime || ''}
                  onChange={(event) => onChangeStockAdd('madeTime', event.target.value)}
                />
                <button type="button" className="time-now-btn" onClick={setNowMadeTime}>
                  Now
                </button>
              </div>

              <label>Expiry Date</label>
              <input
                type="date"
                value={stockAddForm.expiryDate}
                onChange={(event) => onChangeStockAdd('expiryDate', event.target.value)}
              />
            </div>

            <div className="add-cake-modal-actions">
              <button className="confirm-add-cake-btn" onClick={handleAddStockSubmit} type="button">
                Add Stock
              </button>
              <button className="cancel-add-cake-btn" onClick={() => setIsAddStockOpen(false)} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
