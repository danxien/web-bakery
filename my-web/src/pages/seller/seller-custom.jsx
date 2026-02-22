import React from 'react';
import { Trash2 } from 'lucide-react';
import '../../styles/seller/seller-sales.css';

const SellerCustom = ({ customOrders = [], onDelete }) => {
  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <h1 className="seller-sales-title">Custom Orders</h1>
        <p className="seller-sales-subtitle">Special cake orders</p>
      </div>

      <div className="seller-table-container">
        <table className="seller-sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Cake Type</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Special Instructions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customOrders.length === 0 ? (
              <tr>
                <td colSpan="7" className="seller-empty-row">No custom orders recorded yet</td>
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
                    <span className="seller-instructions-text">
                      {order.instructions || "—"}
                    </span>
                  </td>
                  <td>
                    <button className="seller-delete-btn" onClick={() => onDelete(order.id)}>
                      <Trash2 size={16} />
                    </button>
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