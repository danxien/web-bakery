import React from 'react';
import '../../styles/seller/seller-sales.css';

const SellerMessages = ({ messages = [] }) => {
  return (
    <div className="sales-page-container">
      {/* Header section: Just the Titles */}
      <div className="sales-header" style={{ marginBottom: '20px' }}>
        <h1 className="sales-title">Messages</h1>
        <p className="sales-subtitle">Communication with Packer</p>
      </div>

      {/* Content area: Clean container with no headers or buttons */}
      <div className="table-container">
        <table className="sales-table">
          <tbody>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <tr key={msg.id}>
                  <td style={{ width: '20%' }}>{msg.date}</td>
                  <td className="instructions-text">{msg.content}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="status-badge pending" style={{ backgroundColor: '#e7f1ff', color: '#007bff' }}>Sent</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-row" style={{ border: 'none', padding: '100px 0', textAlign: 'center' }}>
                  No messages yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SellerMessages;