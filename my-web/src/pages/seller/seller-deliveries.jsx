import React from 'react';
import todayDeliveries from './deliveryData';
import '../../styles/seller/seller-sales.css';
import '../../styles/seller/seller-deliveries.css';

// ─── Status Helper ────────────────────────────────────────────────────────────
const getExpiryStatus = (expiresStr) => {
  const today  = new Date();
  const expiry = new Date(expiresStr);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: 'Expired',     className: 'seller-status-expired'     };
  if (diffDays <= 3) return { label: 'Near Expiry', className: 'seller-status-near-expiry' };
  return               { label: 'Fresh',        className: 'seller-status-fresh'       };
};

// ─── Component ────────────────────────────────────────────────────────────────
const SellerDeliveries = () => {

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  });

  const currentDeliveries = todayDeliveries.filter(d => d.delivered === todayStr);
  const pastDeliveries    = todayDeliveries.filter(d => d.delivered !== todayStr);

  const renderRows = (list) => list.map((delivery) => {
    const status = getExpiryStatus(delivery.expires);
    return (
      <tr key={delivery.id}>
        <td>{delivery.delivered}</td>
        <td>{delivery.cakeType}</td>
        <td style={{ fontWeight: 'bold' }}>{delivery.qty}</td>
        <td>{delivery.expires}</td>
        <td>
          <span className={`seller-delivery-status-badge ${status.className}`}>
            {status.label}
          </span>
        </td>
      </tr>
    );
  });

  return (
    <div className="seller-sales-container">

      {/* ── Today's Deliveries Table ── */}
      <div className="seller-sales-header">
        <h1 className="seller-sales-title">Deliveries</h1>
        <p className="seller-sales-subtitle">All delivery details</p>
      </div>

      <div className="seller-table-container">
        <table className="seller-sales-table">
          <thead>
            <tr>
              <th>Delivery Date</th>
              <th>Cake Type</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentDeliveries.length > 0 ? renderRows(currentDeliveries) : (
              <tr>
                <td colSpan="5" className="seller-empty-row">No deliveries today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Past Deliveries Table ── */}
      <div className="seller-delivery-history-card">
        <div className="seller-table-container">
          <table className="seller-sales-table">
            <thead>
              <tr>
                <th>Delivery Date</th>
                <th>Cake Type</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastDeliveries.length > 0 ? renderRows(pastDeliveries) : (
                <tr>
                  <td colSpan="5" className="seller-empty-row">No past deliveries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SellerDeliveries;