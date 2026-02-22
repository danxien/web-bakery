import { Trash2 } from 'lucide-react';
import '../../styles/seller/seller-sales.css';

const SellerSales = ({ transactions = [], onDelete }) => {
  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <h1 className="seller-sales-title">Sales Transactions</h1>
        <p className="seller-sales-subtitle">All completed sales</p>
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
              <th></th>
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
                  <td>
                    <button className="seller-delete-btn" onClick={() => onDelete(sale.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="seller-empty-row">No sales recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerSales;