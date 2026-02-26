import React from 'react';
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
  return               { label: 'Fresh',           className: 'seller-status-fresh'       };
};

const SellerInventory = ({ inventoryData = [] }) => {
  
  const inventoryItems = inventoryData.filter(item => {
    const status = getExpiryStatus(item.expires);
    return status.label !== 'Expired'; 
  });

  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <h1 className="seller-sales-title">Inventory</h1>
        <p className="seller-sales-subtitle">Current stock details</p>
      </div>

      <div className="seller-table-container">
        <table className="seller-sales-table">
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
            {inventoryItems.length > 0 ? (
              inventoryItems.map((item) => {
                const status = getExpiryStatus(item.expires);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'normal', color: '#333' }}>{item.cakeType}</td>
                    <td style={{ fontWeight: 'bold' }}>{item.qty}</td>
                    <td>{item.delivered}</td>
                    <td>{item.expires}</td>
                    <td>
                      <span className={`seller-delivery-status-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="seller-empty-row">No items in inventory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerInventory;