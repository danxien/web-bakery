import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingCart, Calendar, Star,
  Truck, Package, MessageSquare, Settings, LogOut,
  Box, PlusCircle, Sparkles, X, CheckCircle
} from 'lucide-react';
import '../../styles/seller/seller-section.css';
import logo from '../../assets/logo.png';
import SellerSales from './seller-sales';
import SellerReservations from './seller-reservations';
import SellerCustom from './seller-custom';
import SellerMessages from './seller-messages';

const SellerSection = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [salesHistory, setSalesHistory] = useState([]);
  const [reservationsHistory, setReservationsHistory] = useState([]);
  const [customOrdersList, setCustomOrdersList] = useState([]);
  const [packerMessage, setPackerMessage] = useState("");

  const [selectedCake, setSelectedCake] = useState("Chocolate Cake");
  const [selectedPrice, setSelectedPrice] = useState(500);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  
  const [customCakeType, setCustomCakeType] = useState("");
  const [customPrice, setCustomPrice] = useState(1000);
  const [customInstructions, setCustomInstructions] = useState("");

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

  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.amount, 0);
  const orderCount = salesHistory.length;

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
  };

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
    setIsModalOpen(false);
    resetForm();
  };

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
    setIsResModalOpen(false);
    resetForm();
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

  const handleSendMessage = () => {
    if (packerMessage.trim() === "") return;
    setPackerMessage("");
    setIsMsgModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
    setIsCustomOrderModalOpen(false);
    resetForm();
  };

  return (
    <div className="dashboard-container">
      {showToast && (
        <div className="toast-container">
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              <CheckCircle size={20} color="#fff" />
            </div>
            <div className="toast-text">
              <p className="toast-main">Message Sent</p>
              <p className="toast-sub">The packer has been notified.</p>
            </div>
            <button className="toast-close" onClick={() => setShowToast(false)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logo} alt="Bakery Logo" className="sidebar-logo-img" />
          </div>
          <div className="logo-text">
            <h2>Regis Cake Shop</h2>
            <p>Main Branch</p>
          </div>
        </div>
        <div className="user-info">
          <h3>Mami Oni</h3>
          <p>Seller</p>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
            <ShoppingCart size={20} /> <span>Sales</span>
          </button>
          <button className={`nav-item ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>
            <Calendar size={20} /> <span>Reservations</span>
          </button>
          <button className={`nav-item ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
            <Star size={20} /> <span>Custom Orders</span>
          </button>
          <button className={`nav-item ${activeTab === 'deliveries' ? 'active' : ''}`} onClick={() => setActiveTab('deliveries')}>
            <Truck size={20} /> <span>Deliveries</span>
          </button>
          <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package size={20} /> <span>Inventory</span>
          </button>
          <button className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <MessageSquare size={20} /> <span>Messages</span>
            <span className="badge">0</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="footer-nav-item"><Settings size={18} /> <span>Settings</span></button>
          <button className="footer-nav-item logout" onClick={onLogout}><LogOut size={18} /> <span>Logout</span></button>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="card-header">
                  <span className="card-label">Today's Sales</span>
                  <ShoppingCart size={18} color="#03c04a" />
                </div>
                <h2 className="stat-value">₱{totalSales.toLocaleString()}</h2>
                <p className="stat-sub">
                  {orderCount === 0 ? "No new order" : `${orderCount} order${orderCount > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="stat-card">
                <div className="card-header">
                  <span className="card-label">Total Stock</span>
                  <Box size={18} color="#8806ce" />
                </div>
                <h2 className="stat-value">145</h2>
                <p className="stat-sub">5 items</p>
              </div>
              <div className="stat-card">
                <div className="card-header">
                  <span className="card-label">Messages</span>
                  <MessageSquare size={18} color="#007bff" />
                </div>
                <h2 className="stat-value">0</h2>
                <p className="stat-sub">Unread messages</p>
              </div>
            </div>

            <div className="action-grid">
              <div className="action-card" onClick={() => setIsModalOpen(true)}>
                <div className="icon-box green-bg"><ShoppingCart size={24} /></div>
                <div className="action-text">
                  <h3>New Sale</h3>
                  <p>Record a new sale</p>
                </div>
              </div>
              <div className="action-card" onClick={() => setIsResModalOpen(true)}>
                <div className="icon-box yellow-bg"><PlusCircle size={24} /></div>
                <div className="action-text">
                  <h3>New Reservation</h3>
                  <p>Create a reservation</p>
                </div>
              </div>
              <div className="action-card" onClick={() => setIsMsgModalOpen(true)}>
                <div className="icon-box blue-bg"><MessageSquare size={24} /></div>
                <div className="action-text">
                  <h3>Message Packer</h3>
                  <p>Request delivery</p>
                </div>
              </div>
              <div className="action-card" onClick={() => setIsCustomOrderModalOpen(true)}>
                <div className="icon-box sparkle-bg"><Sparkles size={24} /></div>
                <div className="action-text">
                  <h3>New Custom Order</h3>
                  <p>Create a custom cake order</p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'sales' && <SellerSales transactions={salesHistory} />}
        {activeTab === 'inventory' && <h1>Inventory Content Coming Soon...</h1>}
        {activeTab === 'custom' && <SellerCustom customOrders={customOrdersList} />}
        {activeTab === 'messages' && (
          <SellerMessages onOpenMessageModal={() => setIsMsgModalOpen(true)} />
        )}
        {activeTab === 'reservations' && (
          <SellerReservations
            reservations={reservationsHistory}
            onUpdateStatus={handleUpdateReservationStatus}
          />
        )}


        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">New Sale</h2>
                  <p className="modal-subtitle">Record a new sale transaction</p>
                </div>
                <button className="close-x-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cake Type</label>
                  <select className="modal-input" value={selectedCake} onChange={handleCakeChange}>
                    {Object.keys(cakePrices).map(cake => (
                      <option key={cake} value={cake}>{cake} - ₱{cakePrices[cake]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" className="modal-input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} min="1" />
                  <span className="helper-text">Available: 18</span>
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" className="modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="total-display">
                  <span>Total Amount:</span>
                  <span className="amount-text">₱{(selectedPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="record-sale-btn" onClick={handleRecordSale}>Record Sale</button>
                <button className="cancel-sale-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isResModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">New Reservation</h2>
                  <p className="modal-subtitle">Create a new cake reservation</p>
                </div>
                <button className="close-x-btn" onClick={() => setIsResModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cake Type</label>
                  <select className="modal-input" value={selectedCake} onChange={handleCakeChange}>
                    {Object.keys(cakePrices).map(cake => (
                      <option key={cake} value={cake}>{cake} - ₱{cakePrices[cake]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" className="modal-input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} min="1" />
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" className="modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Pickup Date</label>
                  <input type="date" className="modal-input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="total-display">
                  <span>Total Amount:</span>
                  <span className="amount-text">₱{(selectedPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="record-sale-btn" onClick={handleRecordReservation}>Create Reservation</button>
                <button className="cancel-sale-btn" onClick={() => setIsResModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isMsgModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Message Packer</h2>
                  <p className="modal-subtitle">Send a message to request delivery</p>
                </div>
                <button className="close-x-btn" onClick={() => setIsMsgModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Message</label>
                  <textarea className="modal-input" placeholder="Type your message..." rows="4" style={{ resize: 'none', padding: '12px', fontFamily: 'inherit' }} value={packerMessage} onChange={(e) => setPackerMessage(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="record-sale-btn" onClick={handleSendMessage}>Send Message</button>
                <button className="cancel-sale-btn" onClick={() => setIsMsgModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {isCustomOrderModalOpen && (
          <div className="modal-overlay">
            <div className="modal-box custom-order-modal">
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">New Custom Order</h2>
                  <p className="modal-subtitle">Create a new custom cake order</p>
                </div>
                <button className="close-x-btn" onClick={() => setIsCustomOrderModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Cake Type</label>
                  <input type="text" className="modal-input" placeholder="Enter cake type" value={customCakeType} onChange={(e) => setCustomCakeType(e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input type="number" className="modal-input" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 0)} min="1" />
                  </div>
                  <div className="form-group">
                    <label>Price per Cake</label>
                    <input type="number" className="modal-input" value={customPrice} onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" className="modal-input" placeholder="Enter customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Special Instructions</label>
                  <textarea className="modal-input" placeholder="Enter any special instructions" rows="2" style={{ resize: 'none', padding: '10px', fontFamily: 'inherit' }} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} />
                </div>
                <div className="total-display compact-total">
                  <span>Total Amount:</span>
                  <span className="amount-text">₱{(customPrice * quantity).toLocaleString()}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="record-sale-btn" onClick={handleCreateCustomOrder}>Create Custom Order</button>
                <button className="cancel-sale-btn" onClick={() => setIsCustomOrderModalOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SellerSection;