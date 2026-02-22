import React from 'react';
import { Trash2 } from 'lucide-react';
import '../../styles/seller/seller-sales.css';

const SellerReservations = ({ reservations = [], onUpdateStatus = () => {}, onDelete = () => {} }) => {
  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header">
        <h1 className="seller-sales-title">Reservations</h1>
        <p className="seller-sales-subtitle">Customer cake reservations</p>
      </div>
      <div className="seller-table-container">
        <table className="seller-sales-table">
          <thead>
            <tr>
              <th>Reserved Date</th>
              <th>Pickup Date</th>
              <th>Cake Type</th>
              <th>Customer</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reservations.length > 0 ? (
              reservations.map((res) => (
                <tr key={res.id}>
                  <td>{res.date}</td>
                  <td>{res.pickupDate}</td>
                  <td>{res.cakeType}</td>
                  <td>{res.customer}</td>
                  <td>{res.qty}</td>
                  <td>₱{res.amount.toLocaleString()}</td>
                  <td>
                    <span className={`seller-status-badge ${res.status?.toLowerCase().replace(/\s/g, '-') || 'pending'}`}>
                      {res.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {res.isCompleted ? (
                      <span className="seller-completed-text">Completed</span>
                    ) : (
                      <div className="seller-action-buttons-group">
                        <button className="seller-btn-picked-up" onClick={() => onUpdateStatus(res.id, 'Picked Up')}>
                          Picked Up
                        </button>
                        <button className="seller-btn-not-picked-up" onClick={() => onUpdateStatus(res.id, 'Not Picked Up')}>
                          Not Picked Up
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="seller-delete-btn" onClick={() => onDelete(res.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="seller-empty-row">No reservations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerReservations;