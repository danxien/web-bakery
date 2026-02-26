// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

import '../../styles/seller/seller-section.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const cakePrices = {
  "Chocolate Cake":    500,
  "Vanilla Cake":      450,
  "Red Velvet Cake":   600,
  "Carrot Cake":       550,
  "Cheesecake":        650,
  "Black Forest Cake": 700,
  "Strawberry Cake":   580,
  "Mango Cake":        520,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerModals({
  // Modal open/close triggers (controlled by seller-section)
  isModalOpen,
  setIsModalOpen,
  isResModalOpen,
  setIsResModalOpen,
  isMsgModalOpen,
  setIsMsgModalOpen,
  isCustomOrderModalOpen,
  setIsCustomOrderModalOpen,

  // Inventory data & updater (owned by seller-section)
  inventoryState,
  subtractFromInventory,

  // Callbacks to push new records up to seller-section
  onSaleCreated,
  onReservationCreated,
  onCustomOrderCreated,
}) {

  // ── Toast State ──
  const [showToast, setShowToast] = useState(false);

  // ── Shared Form State ──
  const [selectedCake,       setSelectedCake]       = useState("Chocolate Cake");
  const [selectedPrice,      setSelectedPrice]      = useState(500);
  const [quantity,           setQuantity]           = useState(1);
  const [customerName,       setCustomerName]       = useState("");
  const [pickupDate,         setPickupDate]         = useState("");
  const [packerMessage,      setPackerMessage]      = useState("");
  const [customCakeType,     setCustomCakeType]     = useState("");
  const [customPrice,        setCustomPrice]        = useState(1000);
  const [customInstructions, setCustomInstructions] = useState("");

  // ─── Helpers ─────────────────────────────────────────────────────────────────
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

  const getAvailableStock = (cakeName) => {
    const item = inventoryState.find(d => d.cakeType === cakeName);
    if (!item) return 0;
    const status = getExpiryStatus(item.expires);
    if (status.label === 'Expired') return 0;
    return item.qty;
  };

  const currentAvailable = getAvailableStock(selectedCake);

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

  const closeModal = (setterFunc) => { setterFunc(false); resetForm(); };

  // ─── Sale Handler ─────────────────────────────────────────────────────────────
  const handleRecordSale = () => {
    if (quantity > currentAvailable || currentAvailable === 0) return;

    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      cakeType: selectedCake,
      customer: customerName || "Walk-in Customer",
      qty: quantity,
      amount: selectedPrice * quantity,
    };

    subtractFromInventory(selectedCake, quantity);
    onSaleCreated(newSale);
    closeModal(setIsModalOpen);
  };

  // ─── Reservation Handler ──────────────────────────────────────────────────────
  const handleRecordReservation = () => {
    if (quantity > currentAvailable || currentAvailable === 0) return;

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
      isCompleted: false,
    };

    subtractFromInventory(selectedCake, quantity);
    onReservationCreated(newRes);
    closeModal(setIsResModalOpen);
  };

  // ─── Custom Order Handler ─────────────────────────────────────────────────────
  const handleCreateCustomOrder = () => {
    const newOrder = {
      id: `custom-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      cakeType: customCakeType,
      customer: customerName || "Guest",
      qty: quantity,
      amount: customPrice * quantity,
      instructions: customInstructions,
    };

    subtractFromInventory(customCakeType, quantity);
    onCustomOrderCreated(newOrder);
    closeModal(setIsCustomOrderModalOpen);
  };

  // ─── Message Handler ──────────────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (packerMessage.trim() === "") return;
    closeModal(setIsMsgModalOpen);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── New Sale Modal ── */}
      {isModalOpen && (
        <div className="seller-modal-overlay">
          <div className="seller-modal-box">
            <div className="seller-modal-header">
              <div>
                <h2 className="seller-modal-title">New Sale</h2>
                <p className="seller-modal-subtitle">Record a new sale transaction</p>
              </div>
              <button className="seller-close-x-btn" onClick={() => closeModal(setIsModalOpen)}>
                <X size={20} />
              </button>
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
                <input
                  type="number"
                  className="seller-modal-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                  min="1"
                />
                <span className="seller-helper-text" style={{ color: currentAvailable === 0 ? 'red' : 'inherit' }}>
                  Available: {currentAvailable > 0 ? currentAvailable : "No stock"}
                </span>
              </div>
              <div className="seller-form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  className="seller-modal-input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="seller-total-display">
                <span>Total Amount:</span>
                <span className="seller-amount-text">₱{(selectedPrice * (quantity || 0)).toLocaleString()}</span>
              </div>
            </div>
            <div className="seller-modal-footer">
              <button
                className="seller-record-sale-btn"
                onClick={handleRecordSale}
                disabled={currentAvailable === 0 || quantity > currentAvailable}
              >
                Record Sale
              </button>
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
              <button className="seller-close-x-btn" onClick={() => closeModal(setIsResModalOpen)}>
                <X size={20} />
              </button>
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
                <input
                  type="number"
                  className="seller-modal-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                  min="1"
                />
                <span className="seller-helper-text" style={{ color: currentAvailable === 0 ? 'red' : 'inherit' }}>
                  Available: {currentAvailable > 0 ? currentAvailable : "No stock"}
                </span>
              </div>
              <div className="seller-form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  className="seller-modal-input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="seller-form-group">
                <label>Pickup Date</label>
                <input
                  type="date"
                  className="seller-modal-input"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="seller-total-display">
                <span>Total Amount:</span>
                <span className="seller-amount-text">₱{(selectedPrice * (quantity || 0)).toLocaleString()}</span>
              </div>
            </div>
            <div className="seller-modal-footer">
              <button
                className="seller-record-sale-btn"
                onClick={handleRecordReservation}
                disabled={currentAvailable === 0 || quantity > currentAvailable}
              >
                Create Reservation
              </button>
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
              <button className="seller-close-x-btn" onClick={() => closeModal(setIsMsgModalOpen)}>
                <X size={20} />
              </button>
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
              <button className="seller-close-x-btn" onClick={() => closeModal(setIsCustomOrderModalOpen)}>
                <X size={20} />
              </button>
            </div>
            <div className="seller-modal-body">
              <div className="seller-form-group">
                <label>Cake Type</label>
                <input
                  type="text"
                  className="seller-modal-input"
                  placeholder="Enter cake type"
                  value={customCakeType}
                  onChange={(e) => setCustomCakeType(e.target.value)}
                />
              </div>
              <div className="seller-form-row">
                <div className="seller-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    className="seller-modal-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div className="seller-form-group">
                  <label>Price per Cake</label>
                  <input
                    type="number"
                    className="seller-modal-input"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="seller-form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  className="seller-modal-input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
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
                <span className="seller-amount-text">₱{(customPrice * (quantity || 0)).toLocaleString()}</span>
              </div>
            </div>
            <div className="seller-modal-footer">
              <button className="seller-record-sale-btn" onClick={handleCreateCustomOrder}>Create Custom Order</button>
              <button className="seller-cancel-sale-btn" onClick={() => closeModal(setIsCustomOrderModalOpen)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}