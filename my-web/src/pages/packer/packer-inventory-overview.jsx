import React, { useEffect, useMemo, useState } from 'react';
import { Download, PackageX, Plus, X } from 'lucide-react';
import { exportRowsToCsv } from '../../utils/exportCsv';

const LOW_STOCK_QTY = 5;
const PER_PAGE = 6;

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

const isLowStock = (item) => item.qty <= LOW_STOCK_QTY && item.computedStatus !== 'Expired';

export default function InventoryOverview({
  stockItems,
  stockAddForm,
  onChangeStockAdd,
  onAddStock,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('all');

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

  const dateScoped = inventoryRows;

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
      rows = rows.filter((item) => item.cake.toLowerCase().includes(needle));
    }

    if (statusFilter) {
      rows = statusFilter === 'Low Stock'
        ? rows.filter(isLowStock)
        : rows.filter((item) => item.computedStatus === statusFilter);
    }

    if (viewMode === 'critical') {
      rows = rows.filter((item) =>
        isLowStock(item) ||
        item.computedStatus === 'Near Expiry' ||
        item.computedStatus === 'Expired'
      );
    }

    return rows;
  }, [dateScoped, searchTerm, statusFilter, viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PER_PAGE));
  const paged = filteredData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSummaryFilter = (value) => {
    setStatusFilter((prev) => (prev === value ? null : value));
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
    setPage(1);
  }, [searchTerm, statusFilter, viewMode]);

  const getRowClass = (item) => {
    if (item.computedStatus === 'Expired') return 'row-expired';
    if (item.computedStatus === 'Near Expiry') return 'row-near-expiry';
    if (isLowStock(item)) return 'row-low-stock';
    return '';
  };

  return (
    <>
      <div className="pkinv-page-container">
        <div className="pkinv-header">
          <div>
            <h1 className="pkinv-title">Inventory Overview</h1>
            <p className="pkinv-subtitle">Monitor stock levels and expiry dates</p>
          </div>
        </div>

        <div className="pkinv-summary-row">
          <div className="pkinv-summary-card pkinv-summary-card--total">
            <span className="pkinv-summary-label">Total Stock</span>
            <span className="pkinv-summary-value">{totalCakesInStock}</span>
          </div>
          <button
            type="button"
            className={`pkinv-summary-card pkinv-summary-card--low ${statusFilter === 'Low Stock' ? 'is-active' : ''}`}
            onClick={() => handleSummaryFilter('Low Stock')}
          >
            <span className="pkinv-summary-label">Low Stock</span>
            <span className="pkinv-summary-value">{statusCounts['Low Stock']}</span>
          </button>
          <button
            type="button"
            className={`pkinv-summary-card pkinv-summary-card--fresh ${statusFilter === 'Fresh' ? 'is-active' : ''}`}
            onClick={() => handleSummaryFilter('Fresh')}
          >
            <span className="pkinv-summary-label">Fresh</span>
            <span className="pkinv-summary-value">{statusCounts.Fresh}</span>
          </button>
          <button
            type="button"
            className={`pkinv-summary-card pkinv-summary-card--near ${statusFilter === 'Near Expiry' ? 'is-active' : ''}`}
            onClick={() => handleSummaryFilter('Near Expiry')}
          >
            <span className="pkinv-summary-label">Near Expiry</span>
            <span className="pkinv-summary-value">{statusCounts['Near Expiry']}</span>
          </button>
          <button
            type="button"
            className={`pkinv-summary-card pkinv-summary-card--expired ${statusFilter === 'Expired' ? 'is-active' : ''}`}
            onClick={() => handleSummaryFilter('Expired')}
          >
            <span className="pkinv-summary-label">Expired</span>
            <span className="pkinv-summary-value">{statusCounts.Expired}</span>
          </button>
        </div>

        <div className="pkinv-table-container">
          <div className="pkinv-table-toolbar">
            <div>
              <span className="pkinv-table-section-title">Stock Items</span>
              <span className="pkinv-table-count-pill">{filteredData.length} items</span>
            </div>
            <div className="pkinv-view-toggle">
              <button
                type="button"
                className={`pkinv-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`pkinv-toggle-btn ${viewMode === 'critical' ? 'active' : ''}`}
                onClick={() => setViewMode('critical')}
              >
                Critical
              </button>
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
                      <div className="pkinv-empty-state">
                        <PackageX size={34} />
                        <p>No inventory items found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map((item, index) => (
                    <tr key={`${item.cake}-${item.madeDate}-${index}`} className={getRowClass(item)}>
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
                      <td>{item.madeTime || item.time || '-'}</td>
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
