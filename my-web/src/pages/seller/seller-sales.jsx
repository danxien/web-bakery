import React from 'react';
import '../../styles/seller/seller-sales.css';

const SellerSales = ({ transactions }) => {
  return (
    <div className="sales-page-container">
      <div className="sales-header">
        <h1 className="sales-title">Sales Transactions</h1>
        <p className="sales-subtitle">All completed sales</p>
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
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.date}</td>
                  <td>{sale.cakeType}</td>
                  <td>{sale.customer}</td>
                  <td>{sale.qty}</td>
                  <td>₱{sale.amount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-row">No sales recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerSales;