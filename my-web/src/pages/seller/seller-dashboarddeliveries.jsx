// ─── Imports ──────────────────────────────────────────────────────────────────
import { Truck } from 'lucide-react';
import todayDeliveries from './deliveryData';
import '../../styles/seller/seller-dashboarddeliveries.css';

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerDashboardDeliveries() {

  const today = new Date().toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric'
  });

  // ─── Filter only today's deliveries ─────────────────────────────────────────
  const todayOnly    = todayDeliveries.filter(d => d.delivered === today);
  const totalPieces  = todayOnly.reduce((sum, d) => sum + d.qty, 0);
  const varietyCount = todayOnly.length;

  return (
    <div className="seller-dashboard-deliveries-wrapper">

      {/* ── Main Card ── */}
      <div className="seller-dashboard-deliveries-card">

        {/* ── Header ── */}
        <div className="seller-dashboard-deliveries-header">
          <div className="seller-dashboard-deliveries-header-left">
            <Truck size={20} color="#8806ce" />
            <div>
              <p className="seller-dashboard-deliveries-title">
                Today's Deliveries — {today}
              </p>
              <p className="seller-dashboard-deliveries-subtitle">
                {varietyCount} types of cakes delivered • Total: {totalPieces} pieces
              </p>
            </div>
          </div>
          <span className="seller-dashboard-deliveries-badge">
            {varietyCount} Varieties
          </span>
        </div>

        {/* ── Cards Row ── */}
        {todayOnly.length === 0 ? (
          <p className="seller-delivery-empty">No deliveries today.</p>
        ) : (
          <div className="seller-delivery-cards-row">
            {todayOnly.map(item => (
              <div key={item.id} className="seller-delivery-item-card">
                <div className="seller-delivery-item-top">
                  <p className="seller-delivery-item-cake">{item.cakeType}</p>
                  <span className="seller-delivery-qty-badge">{item.qty} pcs</span>
                </div>
                <div className="seller-delivery-item-details">
                  <div className="seller-delivery-item-row">
                    <span className="seller-delivery-item-label">Delivered:</span>
                    <span className="seller-delivery-item-value">{item.delivered}</span>
                  </div>
                  <div className="seller-delivery-item-row">
                    <span className="seller-delivery-item-label">Expires:</span>
                    <span className="seller-delivery-item-value">{item.expires}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}