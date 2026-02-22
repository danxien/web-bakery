// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Calendar, Star,
  Truck, Package, MessageSquare, Settings, LogOut,
  Box, PlusCircle, Sparkles, X, CheckCircle
} from 'lucide-react';

import logo from '../../assets/logo.png';
import '../../styles/seller/seller-section.css';

import SellerSales from './seller-sales';
import SellerReservations from './seller-reservations';
import SellerCustom from './seller-custom';
import SellerMessages from './seller-messages';
import SellerSettings from './seller-settings';

// ─── Constants ────────────────────────────────────────────────────────────────
const cakePrices = {
  "Chocolate Cake": 500,
  "Vanilla Cake": 450,
  "Red Velvet Cake": 600,
  "Carrot Cake": 550,
  "Cheesecake": 650,
  "Black Forest Cake": 700,
  "Strawberry Cake": 580,
  "Mango Cake": 520
};

// ─── Component ────────────────────────────────────────────────────────────────
const SellerSection = ({ onLogout }) => {

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ── Modal State ──
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);

  // ── User State ──
  const [fullName, setFullName] = useState("Mami Oni");

  // ── Data State ──
  const [salesHistory, setSalesHistory] = useState([]);
  const [reservationsHistory, setReservationsHistory] = useState([]);
  const [customOrdersList, setCustomOrdersList] = useState([]);

  // ── Form State ──
  const [selectedCake, setSelectedCake] = useState("Chocolate Cake");
  const [selectedPrice, setSelectedPrice] = useState(500);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [packerMessage, setPackerMessage] = useState("");
  const [customCakeType, setCustomCakeType] = useState("");
  const [customPrice, setCustomPrice] = useState(1000);
  const [customInstructions, setCustomInstructions] = useState("");

  // ─── Derived Values ──────────────────────────────────────────────────────────
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.amount, 0);
  const orderCount = salesHistory.length;

  // ─── Sidebar Toggle ──────────────────────────────────────────────────────────
  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // ─── Form Handlers ───────────────────────────────────────────────────────────
  const handleCakeChange = (e) => {
    const name = e.target.value;
    setSelectedCake(name);
    setSelectedPrice(cakePrices[name]);
  };

  const resetForm = () => {
    setQuantity(1);
    setCustomerName("");
    setPickupDate("");
    setSelectedCake("Chocolate Cake");
    setSelectedPrice(500);
    setCustomCakeType("");
    setCustomPrice(1000);
    setCustomInstructions("");
    setPackerMessage("");
  };

  // Helper to open modals with a clean slate
  const openModal = (setterFunc) => {
    resetForm();
    setterFunc(true);
  };

  // Helper to close modals and clean up
  const closeModal = (setterFunc) => {
    setterFunc(false);
    resetForm();
  };

  // ─── Delete Handlers ─────────────────────────────────────────────────────────
  const handleDeleteSale = (id) => {
    setSalesHistory(prev => prev.filter(sale => sale.id !== id));
  };

  const handleDeleteReservation = (id) => {
    setReservationsHistory(prev => prev.filter(res => res.id !== id));
  };

  const handleDeleteCustomOrder = (id) => {
    setCustomOrdersList(prev => prev.filter(order => order.id !== id));
    setSalesHistory(prev => prev.filter(sale => sale.id !== id));
  };

  // ─── Sale Handlers ───────────────────────────────────────────────────────────
  const handleRecordSale = () => {
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      cakeType: selectedCake,
      customer: customerName || "Walk-in Customer",
      qty: quantity,
      amount: selectedPrice * quantity
    };
    setSalesHistory([newSale, ...salesHistory]);
    closeModal(setIsModalOpen);
  };

  const handleCreateCustomOrder = () => {
    const newOrder = {
      id: `custom-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      cakeType: customCakeType,
      customer: customerName || "Guest",
      qty: quantity,
      amount: customPrice * quantity,
      instructions: customInstructions
    };
    setCustomOrdersList([newOrder, ...customOrdersList]);
    setSalesHistory([newOrder, ...salesHistory]);
    closeModal(setIsCustomOrderModalOpen);
  };

  // ─── Reservation Handlers ────────────────────────────────────────────────────
  const handleRecordReservation = () => {
    const dateObj = new Date(pickupDate);
    const formattedPickupDate = isNaN(dateObj.getTime())
      ? pickupDate
      : dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const newRes = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      cakeType: selectedCake,
      customer: customerName || "Guest",
      qty: quantity,
      pickupDate: formattedPickupDate,
      amount: selectedPrice * quantity,
      status: 'Pending',
      isCompleted: false
    };
    setReservationsHistory([newRes, ...reservationsHistory]);
    closeModal(setIsResModalOpen);
  };

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
              amount: res.amount
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

  // ─── Message Handler ─────────────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (packerMessage.trim() === "") return;
    closeModal(setIsMsgModalOpen);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="seller-dashboard-container">

      {/* ── Sidebar ── */}
      <aside className={`seller-sidebar ${sidebarCollapsed ? 'seller-collapsed' : ''}`}>

        {/* Header */}
        <div className="seller-sidebar-header">
          {!sidebarCollapsed && (
            <div className="seller-logo-group">
              <div className="seller-sidebar-logo-container" onClick={handleToggleSidebar}>
                <img src={logo} alt="Bakery Logo" className="seller-sidebar-logo-img" />
              </div>
              <div className="seller-logo-text">
                <h2>Regis Cake Shop</h2>
                <p>Main Branch</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="seller-sidebar-logo-container" onClick={handleToggleSidebar}>
              <img src={logo} alt="Bakery Logo" className="seller-sidebar-logo-img" />
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="seller-user-info">
            <h3>{fullName}</h3>
            <p>Seller</p>
          </div>
        )}

        <nav className="seller-sidebar-nav">
          <button className={`seller-nav-item ${activeTab === 'dashboard' ? 'seller-active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'sales' ? 'seller-active' : ''}`} onClick={() => setActiveTab('sales')}>
            <ShoppingCart size={20} />
            {!sidebarCollapsed && <span>Sales</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'reservations' ? 'seller-active' : ''}`} onClick={() => setActiveTab('reservations')}>
            <Calendar size={20} />
            {!sidebarCollapsed && <span>Reservations</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'custom' ? 'seller-active' : ''}`} onClick={() => setActiveTab('custom')}>
            <Star size={20} />
            {!sidebarCollapsed && <span>Custom Orders</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'deliveries' ? 'seller-active' : ''}`} onClick={() => setActiveTab('deliveries')}>
            <Truck size={20} />
            {!sidebarCollapsed && <span>Deliveries</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'inventory' ? 'seller-active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package size={20} />
            {!sidebarCollapsed && <span>Inventory</span>}
          </button>
          <button className={`seller-nav-item ${activeTab === 'messages' ? 'seller-active' : ''}`} onClick={() => setActiveTab('messages')}>
            <MessageSquare size={20} />
            {!sidebarCollapsed && <span>Messages</span>}
            {!sidebarCollapsed && <span className="seller-badge">0</span>}
          </button>
        </nav>

        <div className="seller-sidebar-footer">
          <button className={`seller-footer-nav-item ${activeTab === 'settings' ? 'seller-active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
          <button className="seller-footer-nav-item seller-logout" onClick={onLogout}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* ── Main Content ── */}
      <main className="seller-main-content">

        {activeTab === 'dashboard' && (
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
                <h2 className="seller-stat-value">145</h2>
                <p className="seller-stat-sub">5 items</p>
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
          </>
        )}

        {activeTab === 'sales' && <SellerSales transactions={salesHistory} onDelete={handleDeleteSale} />}
        {activeTab === 'inventory' && <h1>Inventory Content Coming Soon...</h1>}
        {activeTab === 'deliveries' && <h1>Deliveries Content Coming Soon...</h1>}
        {activeTab === 'custom' && <SellerCustom customOrders={customOrdersList} onDelete={handleDeleteCustomOrder} />}
        {activeTab === 'messages' && <SellerMessages onOpenMessageModal={() => openModal(setIsMsgModalOpen)} />}
        {activeTab === 'reservations' && (
          <SellerReservations
            reservations={reservationsHistory}
            onUpdateStatus={handleUpdateReservationStatus}
            onDelete={handleDeleteReservation}
          />
        )}
        {activeTab === 'settings' && (
          <SellerSettings
            currentName={fullName}
            onSaveName={(newName) => setFullName(newName)}
          />
        )}

        {/* ── New Sale Modal ── */}
        {isModalOpen && (
          <div className="seller-modal-overlay">
            <div className="seller-modal-box">
              <div className="seller-modal-header">
                <div>
                  <h2 className="seller-modal-title">New Sale</h2>
                  <p className="seller-modal-subtitle">Record a new sale transaction</p>
                </div>
                <button className="seller-close-x-btn" onClick={() => closeModal(setIsModalOpen)}><X size={20} /></button>
              </div>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label>Cake Type</label>
                  <select className="seller-modal-input" value={selectedCake} onChange={handleCakeChange}>
                    {Object.keys(cakePrices).map(cake => (
                      <option key={cake} value={cake}>{cake} - ₱{cakePrices[cake]}</option>
                    ))}
                  </select>
                </div>
                <div className="seller-form-group">
                  <label>Quantity</label>
                  <input type="number" className="seller-modal-input" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" />
                  <span className="seller-helper-text">Available: 18</span>
                </div>
                <div className="seller-form-group">
                  <label>Customer Name</label>
                  <input type="text" className="seller-modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="seller-total-display">
                  <span>Total Amount:</span>
                  <span className="seller-amount-text">₱{(selectedPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="seller-modal-footer">
                <button className="seller-record-sale-btn" onClick={handleRecordSale}>Record Sale</button>
                <button className="seller-cancel-sale-btn" onClick={() => closeModal(setIsModalOpen)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── New Reservation Modal ── */}
        {isResModalOpen && (
          <div className="seller-modal-overlay">
            <div className="seller-modal-box">
              <div className="seller-modal-header">
                <div>
                  <h2 className="seller-modal-title">New Reservation</h2>
                  <p className="seller-modal-subtitle">Create a new cake reservation</p>
                </div>
                <button className="seller-close-x-btn" onClick={() => closeModal(setIsResModalOpen)}><X size={20} /></button>
              </div>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label>Cake Type</label>
                  <select className="seller-modal-input" value={selectedCake} onChange={handleCakeChange}>
                    {Object.keys(cakePrices).map(cake => (
                      <option key={cake} value={cake}>{cake} - ₱{cakePrices[cake]}</option>
                    ))}
                  </select>
                </div>
                <div className="seller-form-group">
                  <label>Quantity</label>
                  <input type="number" className="seller-modal-input" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" />
                </div>
                <div className="seller-form-group">
                  <label>Customer Name</label>
                  <input type="text" className="seller-modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="seller-form-group">
                  <label>Pickup Date</label>
                  <input type="date" className="seller-modal-input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="seller-total-display">
                  <span>Total Amount:</span>
                  <span className="seller-amount-text">₱{(selectedPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="seller-modal-footer">
                <button className="seller-record-sale-btn" onClick={handleRecordReservation}>Create Reservation</button>
                <button className="seller-cancel-sale-btn" onClick={() => closeModal(setIsResModalOpen)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Message Packer Modal ── */}
        {isMsgModalOpen && (
          <div className="seller-modal-overlay">
            <div className="seller-modal-box">
              <div className="seller-modal-header">
                <div>
                  <h2 className="seller-modal-title">Message Packer</h2>
                  <p className="seller-modal-subtitle">Send a message to request delivery</p>
                </div>
                <button className="seller-close-x-btn" onClick={() => closeModal(setIsMsgModalOpen)}><X size={20} /></button>
              </div>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label>Message</label>
                  <textarea
                    className="seller-modal-input"
                    placeholder="Type your message..."
                    rows="4"
                    style={{ resize: 'none', padding: '12px', fontFamily: 'inherit' }}
                    value={packerMessage}
                    onChange={(e) => setPackerMessage(e.target.value)}
                  />
                </div>
              </div>
              <div className="seller-modal-footer">
                <button className="seller-record-sale-btn" onClick={handleSendMessage}>Send Message</button>
                <button className="seller-cancel-sale-btn" onClick={() => closeModal(setIsMsgModalOpen)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Custom Order Modal ── */}
        {isCustomOrderModalOpen && (
          <div className="seller-modal-overlay">
            <div className="seller-modal-box seller-custom-order-modal">
              <div className="seller-modal-header">
                <div>
                  <h2 className="seller-modal-title">New Custom Order</h2>
                  <p className="seller-modal-subtitle">Create a new custom cake order</p>
                </div>
                <button className="seller-close-x-btn" onClick={() => closeModal(setIsCustomOrderModalOpen)}><X size={20} /></button>
              </div>
              <div className="seller-modal-body">
                <div className="seller-form-group">
                  <label>Cake Type</label>
                  <input type="text" className="seller-modal-input" placeholder="Enter cake type" value={customCakeType} onChange={(e) => setCustomCakeType(e.target.value)} />
                </div>
                <div className="seller-form-row">
                  <div className="seller-form-group">
                    <label>Quantity</label>
                    <input type="number" className="seller-modal-input" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" />
                  </div>
                  <div className="seller-form-group">
                    <label>Price per Cake</label>
                    <input type="number" className="seller-modal-input" value={customPrice} onChange={(e) => setCustomPrice(parseInt(e.target.value) || " ")} />
                  </div>
                </div>
                <div className="seller-form-group">
                  <label>Customer Name</label>
                  <input type="text" className="seller-modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="seller-form-group">
                  <label>Special Instructions</label>
                  <textarea
                    className="seller-modal-input"
                    placeholder="Enter any special instructions"
                    rows="2"
                    style={{ resize: 'none', padding: '10px', fontFamily: 'inherit' }}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                  />
                </div>
                <div className="seller-total-display seller-compact-total">
                  <span>Total Amount:</span>
                  <span className="seller-amount-text">₱{(customPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="seller-modal-footer">
                <button className="seller-record-sale-btn" onClick={handleCreateCustomOrder}>Create Custom Order</button>
                <button className="seller-cancel-sale-btn" onClick={() => closeModal(setIsCustomOrderModalOpen)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Toast Notification ── */}
      {showToast && (
        <div className="seller-toast-container">
          <div className="seller-toast-content">
            <div className="seller-toast-icon-wrapper">
              <CheckCircle size={20} color="#fff" />
            </div>
            <div className="seller-toast-text">
              <p className="seller-toast-main">Message Sent</p>
              <p className="seller-toast-sub">The packer has been notified.</p>
            </div>
            <button className="seller-toast-close" onClick={() => setShowToast(false)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerSection;