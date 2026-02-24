import React from 'react';
import '../../styles/seller/seller-sales.css';
const SellerReservations = ({ reservations, onUpdateStatus }) => {
  return (
    <div className="sales-page-container">
      <div className="sales-header">
        <h1 className="sales-title">Reservations</h1>
        <p className="sales-subtitle">Customer cake reservations</p>
      </div>
      <div className="table-container">
        <table className="sales-table">
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
                    <span className={`status-badge ${res.status?.toLowerCase().replace(/\s/g, '-') || 'pending'}`}>
                      {res.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {res.isCompleted ? (
                      <span className="completed-text" style={{ color: '#03c04a', fontWeight: 'bold' }}>
                        Completed
                      </span>
                    ) : (
                      <div className="action-buttons-group">
                        <button
                          className="btn-picked-up"
                          onClick={() => onUpdateStatus(res.id, 'Picked Up')}
                        >
                          Picked Up
                        </button>
                        <button
                          className="btn-not-picked-up"
                          onClick={() => onUpdateStatus(res.id, 'Not Picked Up')}
                        >
                          Not Picked Up
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="empty-row">No reservations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SellerReservations;