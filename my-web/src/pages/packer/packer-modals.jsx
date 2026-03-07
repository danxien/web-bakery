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

          <label>Order Type</label>
          <div className="delivery-type-toggle">
            <button
              type="button"
              className={deliveryForm.orderType === 'regular' ? 'active' : ''}
              onClick={() => onChangeField('orderType', 'regular')}
            >
              Regular
            </button>
            <button
              type="button"
              className={deliveryForm.orderType === 'custom' ? 'active' : ''}
              onClick={() => onChangeField('orderType', 'custom')}
            >
              Custom
            </button>
          </div>

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

          {deliveryForm.orderType === 'custom' ? (
            <>
              <label>Custom Cake Name</label>
              <input
                type="text"
                value={deliveryForm.customCakeName || ''}
                onChange={(event) => onChangeField('customCakeName', event.target.value)}
                placeholder="e.g. Unicorn Theme Cake"
              />

              <label>Size</label>
              <input
                type="text"
                value={deliveryForm.customSize || ''}
                onChange={(event) => onChangeField('customSize', event.target.value)}
                placeholder="e.g. 8 inch"
              />

              <label>Flavor</label>
              <input
                type="text"
                value={deliveryForm.customFlavor || ''}
                onChange={(event) => onChangeField('customFlavor', event.target.value)}
                placeholder="e.g. Chocolate Moist"
              />

              <label>Design / Theme</label>
              <input
                type="text"
                value={deliveryForm.customTheme || ''}
                onChange={(event) => onChangeField('customTheme', event.target.value)}
                placeholder="e.g. Frozen Theme"
              />

              <label>Message on Cake</label>
              <input
                type="text"
                value={deliveryForm.dedicationMessage || ''}
                onChange={(event) => onChangeField('dedicationMessage', event.target.value)}
                placeholder="e.g. Happy Birthday Anna"
              />
            </>
          ) : (
            <>
              <label>Cake Type</label>
              <select value={deliveryForm.cake} onChange={(event) => onChangeField('cake', event.target.value)}>
                {cakeOptions.map((cakeName) => (
                  <option key={`delivery-cake-${cakeName}`} value={cakeName}>
                    {cakeName}
                  </option>
                ))}
              </select>
            </>
          )}

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

          <label>Delivery Time</label>
          <input
            type="time"
            value={deliveryForm.deliveryTime || ''}
            onChange={(event) => onChangeField('deliveryTime', event.target.value)}
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
