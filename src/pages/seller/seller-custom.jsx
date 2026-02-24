import React from 'react';
import '../../styles/seller/seller-sales.css'; 

const SellerCustom = ({ customOrders = [] }) => {
  return (
    <div className="sales-page-container">
      <div className="sales-header">
        <h1 className="sales-title">Custom Orders</h1>
        <p className="sales-subtitle">Special cake orders</p>
      </div>

      <div className="table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cake Type</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Special Instructions</th>
            </tr>
          </thead>
          <tbody>
            {customOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No custom orders recorded yet
                </td>
              </tr>
            ) : (
              customOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.date}</td>
                  <td style={{ fontWeight: 'normal' }}>{order.cakeType}</td> 
                  <td>{order.customer}</td>
                  <td>{order.qty}</td>
                  <td style={{ color: '#000', fontWeight: 'normal' }}>
                    ₱{order.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className="instructions-text">
                      {order.instructions || "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerCustom;