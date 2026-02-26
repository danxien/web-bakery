import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

export default function CakePrices({ stockItems, onAddCake, onSaveCake, onDeleteCake }) {
  const [draftRows, setDraftRows] = useState([]);

  useEffect(() => {
    setDraftRows(stockItems.map((item) => ({ cake: item.cake, price: String(item.price) })));
  }, [stockItems]);

  const updateDraft = (index, key, value) => {
    setDraftRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row))
    );
  };

  return (
    <section className="cake-prices-panel">
      <div className="cake-prices-header">
        <div>
          <h3>Main Branch - Cake Prices</h3>
          <p>Manage prices and add new cakes</p>
        </div>
        <button className="cake-prices-add-btn" onClick={onAddCake}>
          <Plus size={16} />
          <span>Add Cake</span>
        </button>
      </div>

      <div className="cake-prices-table">
        <div className="cake-prices-row cake-prices-row-head">
          <span>Cake Name</span>
          <span>Price (P)</span>
          <span>Actions</span>
        </div>

        {draftRows.map((row, index) => (
          <div className="cake-prices-row" key={`${stockItems[index]?.branch || 'main'}-price-${index}`}>
            <input
              type="text"
              value={row.cake}
              onChange={(event) => updateDraft(index, 'cake', event.target.value)}
              className="cake-prices-input"
              placeholder="Cake name"
            />

            <input
              type="number"
              min="1"
              value={row.price}
              onChange={(event) => updateDraft(index, 'price', event.target.value)}
              className="cake-prices-input cake-prices-input-price"
              placeholder="Price"
            />

            <div className="cake-prices-actions">
              <button
                className="cake-prices-action-btn"
                onClick={() =>
                  onSaveCake(index, {
                    cake: row.cake,
                    price: row.price,
                  })
                }
              >
                Save
              </button>
              <button className="cake-prices-action-btn delete" onClick={() => onDeleteCake(index)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
