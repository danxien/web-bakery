import React from 'react';
import { Plus } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function DeliveriesOverview({
  stockDeliveryItems,
  onOpenStockDeliveryModal,
}) {
  const formatPrice = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric <= 0) return '-';
    return `PHP ${numeric.toLocaleString('en-PH')}`;
  };

  return (
    <div className="pkdo-page-container">
      <header className="pkdo-header">
        <div>
          <h1 className="pkdo-title">Stock Deliveries</h1>
          <p className="pkdo-subtitle">Deliver freshly made cakes to the branch stock</p>
        </div>
      </header>

      <section className="pkdo-table-container">
        <div className="pkdo-table-toolbar">
          <div>
            <span className="pkdo-table-section-title">Stock Deliveries List</span>
            <span className="pkdo-table-count-pill">
              {stockDeliveryItems.length} deliveries
            </span>
          </div>
          <button type="button" className="pkdo-add-btn" onClick={onOpenStockDeliveryModal}>
            <Plus size={14} /> Add Stock Delivery
          </button>
        </div>

        <div className="pkdo-table-scroll-wrapper">
          <table className="pkdo-stock-deliveries-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Delivery Date</th>
                <th>Cake Type</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {stockDeliveryItems.length > 0 ? (
                stockDeliveryItems.map((row, index) => {
                  return (
                    <tr key={`${row.deliveryDate}-${row.cakeType}-${index}`}>
                      <td>
                        <span className="pkdo-date-text">{formatDate(row.deliveryDate)}</span>
                      </td>
                      <td>
                        <span className="pkdo-cake-name-text">{row.cakeType}</span>
                      </td>
                      <td>
                        <span className="pkdo-price-text">{formatPrice(row.price)}</span>
                      </td>
                      <td>
                        <span className="pkdo-qty-badge">+{row.quantity}</span>
                      </td>
                      <td>
                        <span className="pkdo-expiry-text">{formatDate(row.expiryDate)}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="pkdo-no-data">
                    No stock deliveries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
