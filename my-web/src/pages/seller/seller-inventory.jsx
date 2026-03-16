import React, { useMemo, useState } from 'react';
import { Layers, Package } from 'lucide-react';
import '../../styles/seller/seller-sales.css';
import '../../styles/seller/seller-deliveries.css';

const getExpiryStatus = (expiresStr) => {
  const today  = new Date();
  const expiry = new Date(expiresStr);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: 'Expired',     className: 'seller-status-expired'     };
  if (diffDays <= 3) return { label: 'Near Expiry', className: 'seller-status-near-expiry' };
  return               { label: 'Fresh',            className: 'seller-status-fresh'       };
};

const LOW_STOCK_THRESHOLD = 5;
const PER_PAGE = 10;

const STATUS_CARDS = [
  { key: 'Fresh',       label: 'Fresh',       mod: 'fresh'       },
  { key: 'Near Expiry', label: 'Near Expiry', mod: 'near-expiry' },
  { key: 'Expired',     label: 'Expired',     mod: 'expired'     },
  { key: 'Low Stock',   label: 'Low Stock',   mod: 'low-stock'   },
];

// ── Row class helper ──
const getRowClassName = (item) => {
  if (item.statusObj.label === 'Expired')     return 'si-row-expired';
  if (item.statusObj.label === 'Near Expiry') return 'si-row-near-expiry';
  if (item.qty <= LOW_STOCK_THRESHOLD)        return 'si-row-low-stock';
  return '';
};

const SellerInventory = ({ inventoryData = [] }) => {

  const [page, setPage] = useState(1);

  const itemsWithStatus = useMemo(() =>
    inventoryData.map(item => ({
      ...item,
      statusObj: getExpiryStatus(item.expires),
    })),
    [inventoryData]
  );

  // ── Only Fresh + Near Expiry (sellable items) ──
  const sellableItems = useMemo(
    () => itemsWithStatus.filter(i => i.statusObj.label !== 'Expired'),
    [itemsWithStatus]
  );

  // ── Metric tile values ──
  const totalCakeTypes = useMemo(
    () => new Set(sellableItems.filter(i => (i.qty || 0) > 0).map(i => i.cakeType)).size,
    [sellableItems]
  );

  const totalCakesInStock = useMemo(
    () => sellableItems.reduce((s, i) => s + (i.qty || 0), 0),
    [sellableItems]
  );

  // ── Status card counts ──
  const statusCounts = useMemo(() => ({
    'Fresh':       itemsWithStatus.filter(i => i.statusObj.label === 'Fresh').reduce((s, i) => s + (i.qty || 0), 0),
    'Near Expiry': itemsWithStatus.filter(i => i.statusObj.label === 'Near Expiry').reduce((s, i) => s + (i.qty || 0), 0),
    'Expired':     itemsWithStatus.filter(i => i.statusObj.label === 'Expired').reduce((s, i) => s + (i.qty || 0), 0),
    'Low Stock':   itemsWithStatus.filter(i => i.qty <= LOW_STOCK_THRESHOLD && i.statusObj.label !== 'Expired').length,
  }), [itemsWithStatus]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(itemsWithStatus.length / PER_PAGE));
  const paged      = itemsWithStatus.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="seller-sales-container">

      {/* ── Header ── */}
      <div className="seller-sales-header">
        <div>
          <h1 className="seller-sales-title">Inventory</h1>
          <p className="seller-sales-subtitle">Current stock details</p>
        </div>
      </div>

      {/* ── Metric Tiles ── */}
      <div className="sd-metrics-row">
        <div className="sd-metric-card">
          <div className="sd-card-top">
            <span className="sd-metric-label">Total Available Cake Types</span>
            <Layers size={20} className="sd-blue-icon" />
          </div>
          <div className="sd-card-bottom">
            <span className="sd-metric-value">{totalCakeTypes}</span>
            <span className="sd-metric-subtext">Unique cake varieties available</span>
          </div>
        </div>

        <div className="sd-metric-card">
          <div className="sd-card-top">
            <span className="sd-metric-label">Total Available Cakes in Stock</span>
            <Package size={20} className="sd-green-icon" />
          </div>
          <div className="sd-card-bottom">
            <span className="sd-metric-value">{totalCakesInStock}</span>
            <span className="sd-metric-subtext">Total number of cakes available</span>
          </div>
        </div>
      </div>

      {/* ── Status Tiles ── */}
      <div className="si-status-cards-row">
        {STATUS_CARDS.map(card => (
          <div
            key={card.key}
            className={`si-status-card si-status-card--${card.mod}`}
          >
            <span className="si-status-card-count">{statusCounts[card.key] ?? 0}</span>
            <span className="si-status-card-label">{card.label}</span>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="seller-table-container">
        <table className="seller-sales-table si-inventory-table">
          <thead>
            <tr>
              <th>Cake Type</th>
              <th>Quantity</th>
              <th>Production Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paged.length > 0 ? (
              paged.map((item) => (
                <tr key={item.id} className={getRowClassName(item)}>
                  <td style={{ fontWeight: 'normal', color: '#333' }}>{item.cakeType}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.qty}</td>
                  <td>{item.delivered}</td>
                  <td>{item.expires}</td>
                  <td>
                    {item.statusObj.label === 'Fresh' && item.qty <= LOW_STOCK_THRESHOLD ? (
                      <span className="seller-delivery-status-badge seller-status-low-stock">
                        Low Stock
                      </span>
                    ) : (
                      <span className={`seller-delivery-status-badge ${item.statusObj.className}`}>
                        {item.statusObj.label}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="seller-empty-row">No items in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* ── Pagination ── */}
        <div className="si-pagination">
          <span className="si-pagination-info">
            {itemsWithStatus.length === 0
              ? 'No results'
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, itemsWithStatus.length)} of ${itemsWithStatus.length}`}
          </span>
          <div className="si-pagination-btns">
            <button className="si-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`si-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="si-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export { getExpiryStatus };
export default SellerInventory;