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

          <label>Cake Type</label>
          <select value={deliveryForm.cake} onChange={(event) => onChangeField('cake', event.target.value)}>
            {stockItems.map((item) => (
              <option key={`delivery-cake-${item.cake}`} value={item.cake}>
                {item.cake}
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
          />

          <label>Pick-up Date</label>
          <input
            type="date"
            value={deliveryForm.pickupDate}
            onChange={(event) => onChangeField('pickupDate', event.target.value)}
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
