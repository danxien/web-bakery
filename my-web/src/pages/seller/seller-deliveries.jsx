import React from 'react';
import '../../styles/seller/seller-sales.css';

const SellerDeliveries = ({ deliveries = [] }) => {
  return (
    <div className="seller-sales-container">
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
            {deliveries.length > 0 ? (
              deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.deliveryDate}</td>
                  <td style={{ fontWeight: 'bold', color: '#000' }}>{delivery.cakeType}</td>
                  <td>{delivery.quantity}</td>
                  <td>{delivery.expiryDate}</td>
                  <td>{delivery.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="seller-empty-row">No deliveries scheduled yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerDeliveries;