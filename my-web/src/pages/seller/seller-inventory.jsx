import React from 'react';
import '../../styles/seller/seller-sales.css';

const SellerInventory = ({ inventory = [] }) => {
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
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 'bold', color: '#000' }}>{item.cakeType}</td>
                  <td>{item.quantity}</td>
                  <td>{item.productionDate}</td>
                  <td>{item.expiryDate}</td>
                  <td>{item.status}</td>
                </tr>
              ))
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