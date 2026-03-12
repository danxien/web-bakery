import React from 'react';
import { X } from 'lucide-react';

export function AddCakeModal({
  isOpen,
  cakeName,
  cakePrice,
  onChangeCakeName,
  onChangeCakePrice,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="add-cake-modal-overlay" onClick={onClose}>
      <div className="add-cake-modal" onClick={(event) => event.stopPropagation()}>
        <div className="add-cake-modal-header">
          <div>
            <h3>Add New Cake to Main Branch</h3>
            <p>Enter cake name and price.</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="add-cake-modal-body">
          <label>Cake Name</label>
          <input type="text" value={cakeName} onChange={(event) => onChangeCakeName(event.target.value)} placeholder="e.g. Ube Cake" />

          <label>Price (PHP)</label>
          <input
            type="number"
            min="1"
            value={cakePrice}
            onChange={(event) => onChangeCakePrice(event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="add-cake-modal-actions">
          <button className="confirm-add-cake-btn" onClick={onSubmit}>
            Add Cake
          </button>
          <button className="cancel-add-cake-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeliveryModal({
  isOpen,
  deliveryForm,
  stockItems,
  onChangeField,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  const cakeOptions = stockItems.reduce((list, item) => {
    if (!list.some((cakeName) => cakeName.toLowerCase() === item.cake.toLowerCase())) {
      list.push(item.cake);
    }
    return list;
  }, []);

  return (
    <div className="add-cake-modal-overlay" onClick={onClose}>
      <div className="add-cake-modal" onClick={(event) => event.stopPropagation()}>
        <div className="add-cake-modal-header">
          <div>
            <h3>Create New Delivery</h3>
            <p>Fill in the delivery details for Main Branch.</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="add-cake-modal-body">
          <label>Branch</label>
          <input type="text" value="Main Branch" disabled />

          <label>Customer Name</label>
          <input
            type="text"
            value={deliveryForm.customer}
            onChange={(event) => onChangeField('customer', event.target.value)}
            placeholder="e.g. Juan Dela Cruz"
          />

          <label>Contact Number</label>
          <input
            type="text"
            value={deliveryForm.contact}
            onChange={(event) => onChangeField('contact', event.target.value)}
            placeholder="e.g. 09171234567"
          />

          <label>Delivery Address</label>
          <input
            type="text"
            value={deliveryForm.address}
            onChange={(event) => onChangeField('address', event.target.value)}
            placeholder="e.g. 123 Rizal St., Calamba"
          />

          <label>Cake Type</label>
          <select value={deliveryForm.cake} onChange={(event) => onChangeField('cake', event.target.value)}>
            {cakeOptions.map((cakeName) => (
              <option key={`delivery-cake-${cakeName}`} value={cakeName}>
                {cakeName}
              </option>
            ))}
          </select>

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={deliveryForm.qty}
            onChange={(event) => onChangeField('qty', event.target.value)}
            placeholder="0"
          />

          <label>Price (PHP)</label>
          <input
            type="number"
            min="1"
            value={deliveryForm.price}
            onChange={(event) => onChangeField('price', event.target.value)}
            placeholder="0"
          />

          <label>Order Date</label>
          <input
            type="date"
            value={deliveryForm.orderDate}
            onChange={(event) => onChangeField('orderDate', event.target.value)}
            disabled
          />

          <label>Delivery Date & Time</label>
          <input
            type="datetime-local"
            value={deliveryForm.deliveryDateTime || ''}
            onChange={(event) => onChangeField('deliveryDateTime', event.target.value)}
          />

          <label>Special Instructions</label>
          <input
            type="text"
            value={deliveryForm.specialInstructions}
            onChange={(event) => onChangeField('specialInstructions', event.target.value)}
            placeholder="e.g. less sugar / add dedication note"
          />
        </div>

        <div className="add-cake-modal-actions">
          <button className="confirm-add-cake-btn" onClick={onSubmit}>
            Create Delivery
          </button>
          <button className="cancel-add-cake-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function StockDeliveryModal({
  isOpen,
  stockDeliveryForm,
  stockItems,
  onChangeField,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  const today = new Date().toISOString().slice(0, 10);
  const cakeOptions = stockItems.reduce((list, item) => {
    if (!list.some((cakeName) => cakeName.toLowerCase() === item.cake.toLowerCase())) {
      list.push(item.cake);
    }
    return list;
  }, []);

  return (
    <div className="add-cake-modal-overlay" onClick={onClose}>
      <div className="add-cake-modal" onClick={(event) => event.stopPropagation()}>
        <div className="add-cake-modal-header">
          <div>
            <h3>Add Stock Delivery</h3>
            <p>Record cakes delivered to Main Branch stock.</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="add-cake-modal-body">
          <label>Branch</label>
          <input type="text" value="Main Branch" disabled />

          <label>Cake Type</label>
          <select 
            value={stockDeliveryForm.cakeType || ''} 
            onChange={(event) => onChangeField('cakeType', event.target.value)}
            required
          >
            <option value="">Select cake type</option>
            {cakeOptions.map((cakeName) => (
              <option key={`stock-cake-${cakeName}`} value={cakeName}>
                {cakeName}
              </option>
            ))}
          </select>

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={stockDeliveryForm.quantity || ''}
            onChange={(event) => onChangeField('quantity', event.target.value)}
            placeholder="0"
            required
          />

          <label>Price (PHP)</label>
          <input
            type="number"
            min="1"
            value={stockDeliveryForm.price || ''}
            onChange={(event) => onChangeField('price', event.target.value)}
            placeholder="0"
            required
          />

          <label>Expiry Date</label>
          <input
            type="date"
            value={stockDeliveryForm.expiryDate || ''}
            onChange={(event) => onChangeField('expiryDate', event.target.value)}
            required
          />

          <label>Delivery Date</label>
          <input
            type="date"
            value={stockDeliveryForm.deliveryDate || today}
            onChange={(event) => onChangeField('deliveryDate', event.target.value)}
            required
          />
        </div>

        <div className="add-cake-modal-actions">
          <button className="confirm-add-cake-btn" onClick={onSubmit}>
            Deliver
          </button>
          <button className="cancel-add-cake-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomOrderModal({
  isOpen,
  customOrderForm,
  onChangeField,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="add-cake-modal-overlay" onClick={onClose}>
      <div className="add-cake-modal" onClick={(event) => event.stopPropagation()}>
        <div className="add-cake-modal-header">
          <div>
            <h3>Create Custom Order</h3>
            <p>Fill in the custom order details for Main Branch.</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="add-cake-modal-body">
          <label>Branch</label>
          <input type="text" value="Main Branch" disabled />

          <label>Custom Cake</label>
          <input
            type="text"
            value={customOrderForm.cake}
            onChange={(event) => onChangeField('cake', event.target.value)}
            placeholder="e.g. 3-tier Wedding Cake, Chocolate Truffle Cake"
          />

          <label>Customer Name</label>
          <input
            type="text"
            value={customOrderForm.customer}
            onChange={(event) => onChangeField('customer', event.target.value)}
            placeholder="e.g. Juan Dela Cruz"
          />

          <label>Contact Number</label>
          <input
            type="text"
            value={customOrderForm.contact || ''}
            onChange={(event) => onChangeField('contact', event.target.value)}
            placeholder="e.g. 09171234567"
          />

          <label>Delivery Address</label>
          <input
            type="text"
            value={customOrderForm.address || ''}
            onChange={(event) => onChangeField('address', event.target.value)}
            placeholder="e.g. 123 Rizal St., Calamba"
          />

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={customOrderForm.qty}
            onChange={(event) => onChangeField('qty', event.target.value)}
            placeholder="0"
          />

          <label>Price (PHP)</label>
          <input
            type="number"
            min="1"
            value={customOrderForm.price}
            onChange={(event) => onChangeField('price', event.target.value)}
            placeholder="0"
          />

          <label>Pick-Up Date</label>
          <input
            type="date"
            value={customOrderForm.pickupDate}
            onChange={(event) => onChangeField('pickupDate', event.target.value)}
          />

          <label>Special Instructions</label>
          <input
            type="text"
            value={customOrderForm.specialInstructions}
            onChange={(event) => onChangeField('specialInstructions', event.target.value)}
            placeholder="e.g. less sugar / add dedication note"
          />
        </div>

        <div className="add-cake-modal-actions">
          <button className="confirm-add-cake-btn" onClick={onSubmit}>
            Create Order
          </button>
          <button className="cancel-add-cake-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
