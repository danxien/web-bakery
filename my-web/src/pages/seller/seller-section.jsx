// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  ShoppingCart, Box, MessageSquare,
  PlusCircle, Sparkles,
} from 'lucide-react';

import SellerSales               from './seller-sales';
import SellerReservations        from './seller-reservations';
import SellerCustom              from './seller-custom';
import SellerDeliveries          from './seller-deliveries';
import SellerInventory           from './seller-inventory';
import SellerMessages            from './seller-messages';
import SellerSettings            from './seller-settings';
import SellerDashboardDeliveries from './seller-dashboarddeliveries';
import SellerModals              from './seller-modals';
import todayDeliveries           from './deliveryData';

import '../../styles/seller/seller-section.css';

// ─── Status Helper ────────────────────────────────────────────────────────────
const getExpiryStatus = (expiresStr) => {
  if (!expiresStr) return { label: 'No Stock' };
  const today  = new Date();
  const expiry = new Date(expiresStr);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired' };
  return { label: 'Fresh' };
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerSection({ activeTab, setActiveTab, fullName, onSaveName }) {

  // ── Modal Open State ──
  const [isModalOpen,            setIsModalOpen]            = useState(false);
  const [isResModalOpen,         setIsResModalOpen]         = useState(false);
  const [isMsgModalOpen,         setIsMsgModalOpen]         = useState(false);
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);

  // ── Data State ──
  const [salesHistory,        setSalesHistory]        = useState([]);
  const [reservationsHistory, setReservationsHistory] = useState([]);
  const [customOrdersList,    setCustomOrdersList]    = useState([]);
  const [inventoryState,      setInventoryState]      = useState(todayDeliveries);

  // ─── Derived Values ──────────────────────────────────────────────────────────
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.amount, 0);
  const orderCount = salesHistory.length;

  // ─── Modal Open Helper ───────────────────────────────────────────────────────
  const openModal = (setterFunc) => setterFunc(true);

  // ─── Inventory Updater (passed down to SellerModals) ─────────────────────────
  const subtractFromInventory = (cakeName, qtyToSubtract) => {
    setInventoryState(prev => prev.map(item =>
      item.cakeType === cakeName
        ? { ...item, qty: Math.max(0, item.qty - qtyToSubtract) }
        : item
    ));
  };

  // ─── Delete Handlers ─────────────────────────────────────────────────────────
  const handleDeleteSale = (id) => {
    const saleToDelete = salesHistory.find(sale => sale.id === id);
    if (saleToDelete) {
      setInventoryState(prev => prev.map(item =>
        item.cakeType === saleToDelete.cakeType
          ? { ...item, qty: item.qty + saleToDelete.qty }
          : item
      ));
    }
    setSalesHistory(prev => prev.filter(sale => sale.id !== id));
  };

  const handleDeleteReservation = (id) => {
    setReservationsHistory(prev => prev.filter(res => res.id !== id));
  };

  const handleDeleteCustomOrder = (id) => {
    setCustomOrdersList(prev => prev.filter(order => order.id !== id));
    setSalesHistory(prev => prev.filter(sale => sale.id !== id));
  };

  // ─── Reservation Status Handler ──────────────────────────────────────────────
  const handleUpdateReservationStatus = (id, newStatus) => {
    setReservationsHistory(prevReservations =>
      prevReservations.map(res => {
        if (res.id === id) {
          if (res.isCompleted) return res;
          if (newStatus === 'Picked Up') {
            const completedSale = {
              id: `sale-${res.id}`,
              date: new Date().toLocaleDateString(),
              cakeType: res.cakeType,
              customer: res.customer,
              qty: res.qty,
              amount: res.amount,
            };
            setSalesHistory(currentSales => {
              const exists = currentSales.find(s => s.id === `sale-${res.id}`);
              if (exists) return currentSales;
              return [completedSale, ...currentSales];
            });
          }
          return { ...res, status: newStatus, isCompleted: true };
        }
        return res;
      })
    );
  };

  // ─── Modal Callbacks (receive new records from SellerModals) ─────────────────
  const handleSaleCreated = (newSale) => {
    setSalesHistory(prev => [newSale, ...prev]);
  };

  const handleReservationCreated = (newRes) => {
    setReservationsHistory(prev => [newRes, ...prev]);
  };

  const handleCustomOrderCreated = (newOrder) => {
    setCustomOrdersList(prev => [newOrder, ...prev]);
    setSalesHistory(prev => [newOrder, ...prev]);
  };

  // ─── Page Renderer ───────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="seller-stats-grid">
              <div className="seller-stat-card">
                <div className="seller-card-header">
                  <span className="seller-card-label">Today's Sales</span>
                  <ShoppingCart size={18} color="#03c04a" />
                </div>
                <h2 className="seller-stat-value">₱{totalSales.toLocaleString()}</h2>
                <p className="seller-stat-sub">
                  {orderCount === 0 ? "No new order" : `${orderCount} order${orderCount > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="seller-stat-card">
                <div className="seller-card-header">
                  <span className="seller-card-label">Total Stock</span>
                  <Box size={18} color="#8806ce" />
                </div>
                <h2 className="seller-stat-value">
                  {inventoryState.reduce((acc, curr) => {
                    const status = getExpiryStatus(curr.expires);
                    return status.label !== 'Expired' ? acc + curr.qty : acc;
                  }, 0)}
                </h2>
                <p className="seller-stat-sub">
                  {(() => {
                    const varietyCount = inventoryState.filter(item => {
                      const status = getExpiryStatus(item.expires);
                      return item.qty > 0 && status.label !== 'Expired';
                    }).length;
                    return `${varietyCount} ${varietyCount === 1 ? 'Variety' : 'Varieties'} available`;
                  })()}
                </p>
              </div>
              <div className="seller-stat-card">
                <div className="seller-card-header">
                  <span className="seller-card-label">Messages</span>
                  <MessageSquare size={18} color="#007bff" />
                </div>
                <h2 className="seller-stat-value">0</h2>
                <p className="seller-stat-sub">Unread messages</p>
              </div>
            </div>

            <div className="seller-action-grid">
              <div className="seller-action-card" onClick={() => openModal(setIsModalOpen)}>
                <div className="seller-icon-box seller-green-bg"><ShoppingCart size={24} /></div>
                <div className="seller-action-text">
                  <h3>New Sale</h3>
                  <p>Record a new sale</p>
                </div>
              </div>
              <div className="seller-action-card" onClick={() => openModal(setIsResModalOpen)}>
                <div className="seller-icon-box seller-yellow-bg"><PlusCircle size={24} /></div>
                <div className="seller-action-text">
                  <h3>New Reservation</h3>
                  <p>Create a reservation</p>
                </div>
              </div>
              <div className="seller-action-card" onClick={() => openModal(setIsMsgModalOpen)}>
                <div className="seller-icon-box seller-blue-bg"><MessageSquare size={24} /></div>
                <div className="seller-action-text">
                  <h3>Message Packer</h3>
                  <p>Request delivery</p>
                </div>
              </div>
              <div className="seller-action-card" onClick={() => openModal(setIsCustomOrderModalOpen)}>
                <div className="seller-icon-box seller-sparkle-bg"><Sparkles size={24} /></div>
                <div className="seller-action-text">
                  <h3>New Custom Order</h3>
                  <p>Create a custom cake order</p>
                </div>
              </div>
            </div>
            <SellerDashboardDeliveries />
          </>
        );
      case 'sales':
        return <SellerSales transactions={salesHistory} onDelete={handleDeleteSale} />;
      case 'reservations':
        return (
          <SellerReservations
            reservations={reservationsHistory}
            onUpdateStatus={handleUpdateReservationStatus}
            onDelete={handleDeleteReservation}
          />
        );
      case 'custom':
        return <SellerCustom customOrders={customOrdersList} onDelete={handleDeleteCustomOrder} />;
      case 'deliveries':
        return <SellerDeliveries />;
      case 'inventory':
        return <SellerInventory inventoryData={inventoryState} />;
      case 'messages':
        return <SellerMessages onOpenMessageModal={() => openModal(setIsMsgModalOpen)} />;
      case 'settings':
        return <SellerSettings currentName={fullName} onSaveName={onSaveName} />;
      default:
        return null;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="seller-main-content">
        {renderPage()}
      </main>

      <SellerModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isResModalOpen={isResModalOpen}
        setIsResModalOpen={setIsResModalOpen}
        isMsgModalOpen={isMsgModalOpen}
        setIsMsgModalOpen={setIsMsgModalOpen}
        isCustomOrderModalOpen={isCustomOrderModalOpen}
        setIsCustomOrderModalOpen={setIsCustomOrderModalOpen}
        inventoryState={inventoryState}
        subtractFromInventory={subtractFromInventory}
        onSaleCreated={handleSaleCreated}
        onReservationCreated={handleReservationCreated}
        onCustomOrderCreated={handleCustomOrderCreated}
      />
    </>
  );
}