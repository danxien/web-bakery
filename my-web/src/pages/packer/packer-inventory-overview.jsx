import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, Plus, X } from 'lucide-react';
import { exportRowsToCsv } from '../../utils/exportCsv';

const LOW_STOCK_QTY = 5;
const HIGH_STOCK_QTY = 16;

const toDate = (value) => {
  if (!value || value === '-') return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinPeriod = (targetDate, period, selectedMonth) => {
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

  if (period === 'pick-month') {
    if (!selectedMonth) return true;
    const [year, month] = selectedMonth.split('-').map(Number);
    return targetDate.getFullYear() === year && targetDate.getMonth() === month - 1;
  }

  return true;
};

export default function InventoryOverview({
  stockItems,
  getBadgeClass,
  stockAddForm,
  onChangeStockAdd,
  onAddStock,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stockBandFilter, setStockBandFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);

  const setNowMadeTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    onChangeStockAdd('madeTime', `${hours}:${minutes}`);
  };

  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const madeDate = toDate(item.madeDate);
      const matchesSearch =
        item.cake.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.price).includes(searchTerm) ||
        item.expiryDate.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesStockBand =
        stockBandFilter === 'all' ||
        (stockBandFilter === 'low' && item.qty <= LOW_STOCK_QTY) ||
        (stockBandFilter === 'balanced' && item.qty > LOW_STOCK_QTY && item.qty < HIGH_STOCK_QTY) ||
        (stockBandFilter === 'high' && item.qty >= HIGH_STOCK_QTY);
      const matchesDate = dateFilter === 'all' || isWithinPeriod(madeDate, dateFilter, selectedMonth);
      return matchesSearch && matchesStatus && matchesStockBand && matchesDate;
    });
  }, [dateFilter, searchTerm, selectedMonth, statusFilter, stockBandFilter, stockItems]);

  const stockAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getInventoryStatus = (item) => {
      const expiry = toDate(item.expiryDate);
      if (!expiry) return item.status || 'Fresh';
      const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Expired';
      if (diffDays <= 2) return 'Near Expiry';
      return 'Fresh';
    };

    let lowStockUnits = 0;
    let nearExpiryUnits = 0;
    let expiredUnits = 0;

    stockItems.forEach((item) => {
      const computedStatus = getInventoryStatus(item);

      if (item.qty <= LOW_STOCK_QTY && computedStatus !== 'Expired') {
        lowStockUnits += item.qty;
      }

      if (computedStatus === 'Near Expiry') {
        nearExpiryUnits += item.qty;
      }

      if (computedStatus === 'Expired') {
        expiredUnits += item.qty;
      }
    });

    return { lowStockUnits, nearExpiryUnits, expiredUnits };
  }, [stockItems]);

  const stockBands = useMemo(() => {
    const low = stockItems.filter((item) => item.qty <= LOW_STOCK_QTY).length;
    const balanced = stockItems.filter((item) => item.qty > LOW_STOCK_QTY && item.qty < HIGH_STOCK_QTY).length;
    const high = stockItems.filter((item) => item.qty >= HIGH_STOCK_QTY).length;
    return { low, balanced, high };
  }, [stockItems]);

  const totalUnits = useMemo(
    () => stockItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [stockItems]
  );

  const exportInventoryReport = () => {
    exportRowsToCsv(
      `packer-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        { key: 'cake', label: 'Cake' },
        { key: 'price', label: 'Price' },
        { key: 'qty', label: 'Qty' },
        { key: 'madeDate', label: 'Made Date' },
        { key: 'time', label: 'Time' },
        { key: 'expiryDate', label: 'Expiry Date' },
        { key: 'status', label: 'Status' },
      ],
      filteredStockItems
    );
  };

  const handleAddStockSubmit = () => {
    const qty = Number(stockAddForm.qty);
    if (!stockAddForm.cake || Number.isNaN(qty) || qty <= 0 || !stockAddForm.madeDate || !stockAddForm.madeTime || !stockAddForm.expiryDate) return;
    onAddStock();
    setIsAddStockOpen(false);
  };

  return (
    <>
      <div className="pkinv-metrics-row">
        <article className="pkinv-metric-card">
          <div className="pkinv-metric-top">
            <span>Total Stock Units</span>
          </div>
          <h2>{totalUnits}</h2>
          <small>All units currently in inventory</small>
        </article>

        <article className="pkinv-metric-card">
          <div className="pkinv-metric-top">
            <span>Low Stock Units</span>
          </div>
          <h2>{stockAlerts.lowStockUnits}</h2>
          <small>Needs replenishment</small>
        </article>

        <article className="pkinv-metric-card">
          <div className="pkinv-metric-top">
            <span>Near Expiry Units</span>
          </div>
          <h2>{stockAlerts.nearExpiryUnits}</h2>
          <small>Prioritize selling</small>
        </article>

        <article className="pkinv-metric-card">
          <div className="pkinv-metric-top">
            <span>Expired Units</span>
          </div>
          <h2>{stockAlerts.expiredUnits}</h2>
          <small>Remove from available stock</small>
        </article>
      </div>

      <div className="pkinv-stock-band-row">
        <button
          type="button"
          className={`pkinv-stock-band danger ${stockBandFilter === 'low' ? 'active' : ''}`}
          onClick={() => setStockBandFilter((prev) => (prev === 'low' ? 'all' : 'low'))}
        >
          <span>Low Stock</span>
          <strong>{stockBands.low}</strong>
          <small>Urgent replenish</small>
        </button>

        <button
          type="button"
          className={`pkinv-stock-band balanced ${stockBandFilter === 'balanced' ? 'active' : ''}`}
          onClick={() => setStockBandFilter((prev) => (prev === 'balanced' ? 'all' : 'balanced'))}
        >
          <span>Balanced</span>
          <strong>{stockBands.balanced}</strong>
          <small>Healthy range</small>
        </button>

        <button
          type="button"
          className={`pkinv-stock-band high ${stockBandFilter === 'high' ? 'active' : ''}`}
          onClick={() => setStockBandFilter((prev) => (prev === 'high' ? 'all' : 'high'))}
        >
          <span>High Stock</span>
          <strong>{stockBands.high}</strong>
          <small>Good reserve</small>
        </button>
      </div>

      <div className="pkinv-alerts-container">
        <div className="pkinv-alert-wrapper">
          <div className="pkinv-alert-row warning">
            <AlertTriangle size={18} />
            <span>
              {stockAlerts.lowStockUnits} low stock unit{stockAlerts.lowStockUnits !== 1 ? 's' : ''} - refill needed soon
            </span>
          </div>
        </div>

        <div className="pkinv-alert-wrapper">
          <div className="pkinv-alert-row info">
            <AlertTriangle size={18} />
            <span>{stockAlerts.nearExpiryUnits} near-expiry unit{stockAlerts.nearExpiryUnits !== 1 ? 's' : ''} - prioritize selling</span>
          </div>
        </div>

        <div className="pkinv-alert-wrapper">
          <div className="pkinv-alert-row critical">
            <AlertTriangle size={18} />
            <span>{stockAlerts.expiredUnits} expired unit{stockAlerts.expiredUnits !== 1 ? 's' : ''} - remove from available stock</span>
          </div>
        </div>
      </div>

      <section className="packer-panel-card">
        <h3>Inventory (Main Branch)</h3>
        <p>Update stock and expiry details for Main Branch.</p>

        <div className="inventory-controls">
          <input
            type="text"
            placeholder="Search cake / price / expiry"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="inventory-search"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="inventory-filter">
            <option value="All">All Status</option>
            <option value="Fresh">Fresh</option>
            <option value="Near Expiry">Near Expiry</option>
            <option value="Expired">Expired</option>
          </select>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="inventory-filter">
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="pick-month">Select Month</option>
          </select>
          {dateFilter === 'pick-month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="inventory-search inventory-date-input"
            />
          )}
          <button type="button" className="inventory-add-btn inventory-primary-btn" onClick={() => setIsAddStockOpen(true)}>
            <Plus size={14} /> Add Stock
          </button>
          <button type="button" className="inventory-add-btn" onClick={exportInventoryReport}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        <div className="packer-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cake</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Made Date</th>
                <th>Time</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStockItems.length === 0 && (
                <tr>
                  <td colSpan={7}>No matching inventory rows</td>
                </tr>
              )}
              {filteredStockItems.map((item) => (
                <tr
                  key={`${item.branch}-inv-${item.cake}`}
                  className={item.qty <= LOW_STOCK_QTY ? 'stock-row-low' : item.qty >= HIGH_STOCK_QTY ? 'stock-row-high' : ''}
                >
                  <td>{item.cake}</td>
                  <td>PHP {item.price}</td>
                  <td>
                    <span className={`stock-qty-chip ${item.qty <= LOW_STOCK_QTY ? 'low' : item.qty >= HIGH_STOCK_QTY ? 'high' : 'normal'}`}>
                      {item.qty}
                    </span>
                  </td>
                  <td>{item.madeDate}</td>
                  <td>{item.time || '-'}</td>
                  <td>{item.expiryDate}</td>
                  <td>
                    <span className={`status-chip ${getBadgeClass(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
