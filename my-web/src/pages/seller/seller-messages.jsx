import React from 'react';
import '../../styles/seller/seller-sales.css';

const SellerMessages = ({ messages = [] }) => {
  return (
    <div className="seller-sales-container">
      <div className="seller-sales-header" style={{ marginBottom: '20px' }}>
        <h1 className="seller-sales-title">Messages</h1>
        <p className="seller-sales-subtitle">Communication with Packer</p>
      </div>

      <div className="seller-table-container">
        <table className="seller-sales-table">
          <tbody>
            {messages.length > 0 ? (
              messages.map((msg) => (
                <tr key={msg.id}>
                  <td style={{ width: '20%' }}>{msg.date}</td>
                  <td className="seller-instructions-text">{msg.content}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="seller-status-badge pending" style={{ backgroundColor: '#e7f1ff', color: '#007bff' }}>Sent</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="seller-empty-row" style={{ border: 'none', padding: '100px 0', textAlign: 'center' }}>
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