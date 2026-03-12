import React, { useEffect, useMemo, useState } from 'react';
import PackerSidebar from './packer-sidebarmenu';
import DashboardOverview from './packer-dashboard-overview';
import InventoryOverview from './packer-inventory-overview';
import DeliveriesOverview from './packer-stock-deliveries';
import PackerMessages from './packer-messages';
import CakePrices from './packer-cake-prices';
import PackerSettings from './packer-settings';
import { AddCakeModal, DeliveryModal, StockDeliveryModal } from './packer-modals';
import {
  initialBranchStock,
  initialDeliveryToday,
  initialStockDeliveries,
  inboxMessages,
  customOrders,
  getBadgeClass,
} from './packer-data';

import '../../styles/packer/packer-dashboard.css';
import '../../styles/packer/packer-sidebarmenu.css';
import '../../styles/packer/packer-dashboard-overview.css';
import '../../styles/packer/packer-inventory-overview.css';
import '../../styles/packer/packer-stock-deliveries.css';
import '../../styles/packer/packer-messages.css';
import '../../styles/packer/packer-modals.css';
import '../../styles/packer/packer-cake-prices.css';
import '../../styles/packer/packer-settings.css';

export default function PackerLandingPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packerName, setPackerName] = useState('Packer');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [stockItems, setStockItems] = useState(initialBranchStock);
  const [deliveryItems, setDeliveryItems] = useState(initialDeliveryToday);
  const [stockDeliveryItems, setStockDeliveryItems] = useState(initialStockDeliveries);
  const [messages, setMessages] = useState(
    inboxMessages.map((msg, index) => ({
      ...msg,
      id: `msg-${index + 1}`,
      urgent: msg.urgent || false,
      actionTaken: msg.actionTaken || '',
    }))
  );
  const [isAddCakeOpen, setIsAddCakeOpen] = useState(false);
  const [newCakeName, setNewCakeName] = useState('');
  const [newCakePrice, setNewCakePrice] = useState('');
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isStockDeliveryModalOpen, setIsStockDeliveryModalOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    branch: 'Main Branch',
    customer: '',
    contact: '',
    address: '',
    cake: initialBranchStock[0]?.cake || '',
    price: initialBranchStock[0]?.price || 0,
    qty: '',
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDateTime: '',
    specialInstructions: '',
  });
  const [stockDeliveryForm, setStockDeliveryForm] = useState({
    cakeType: '',
    quantity: '',
    price: '',
    expiryDate: '',
    deliveryDate: new Date().toISOString().slice(0, 10),
  });
  const [stockAddForm, setStockAddForm] = useState({
    cake: initialBranchStock[0]?.cake || '',
    qty: '',
    madeDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
  });
  const [deliveryWarning, setDeliveryWarning] = useState('');

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;

    const prevMaxWidth = root.style.maxWidth;
    const prevWidth = root.style.width;
    const prevMinHeight = root.style.minHeight;
    const prevMargin = root.style.margin;
    const prevPadding = root.style.padding;
    const prevTextAlign = root.style.textAlign;

    root.style.maxWidth = 'none';
    root.style.width = '100vw';
    root.style.minHeight = '100vh';
    root.style.margin = '0';
    root.style.padding = '0';
    root.style.textAlign = 'left';

    return () => {
      root.style.maxWidth = prevMaxWidth;
      root.style.width = prevWidth;
      root.style.minHeight = prevMinHeight;
      root.style.margin = prevMargin;
      root.style.padding = prevPadding;
      root.style.textAlign = prevTextAlign;
    };
  }, []);

  const unreadCount = messages.filter((msg) => msg.unread).length;
  const pendingOrders = deliveryItems.filter(
    (row) => row.status === 'Pending' || row.status === 'Ready' || row.status === 'Out for Delivery' || row.status === 'In Transit'
  );

  const handleAddCake = () => {
    const name = newCakeName.trim();
    const price = Number(newCakePrice);
    if (!name || Number.isNaN(price) || price <= 0) return;

    const duplicated = stockItems.some((item) => item.cake.toLowerCase() === name.toLowerCase());
    if (duplicated) return;

    const now = new Date();
    const madeDate = now.toISOString().slice(0, 10);
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 3);

    setStockItems((prev) => [
      ...prev,
      {
        branch: 'Main Branch',
        cake: name,
        price,
        qty: 0,
        madeDate,
        expiryDate: expiry.toISOString().slice(0, 10),
        status: 'Fresh',
      },
    ]);

    setNewCakeName('');
    setNewCakePrice('');
    setIsAddCakeOpen(false);
  };

  const handleAddCakePriceRow = () => {
    const existingNames = new Set(stockItems.map((item) => item.cake.toLowerCase()));
    let counter = stockItems.length + 1;
    let candidate = `New Cake ${counter}`;

    while (existingNames.has(candidate.toLowerCase())) {
      counter += 1;
      candidate = `New Cake ${counter}`;
    }

    const now = new Date();
    const madeDate = now.toISOString().slice(0, 10);
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + 3);

    setStockItems((prev) => [
      ...prev,
      {
        branch: 'Main Branch',
        cake: candidate,
        price: 500,
        qty: 0,
        madeDate,
        expiryDate: expiry.toISOString().slice(0, 10),
        status: 'Fresh',
      },
    ]);
  };

  const handleSaveCakePriceRow = (rowIndex, rowData) => {
    const name = rowData.cake.trim();
    const price = Number(rowData.price);

    if (!name || Number.isNaN(price) || price <= 0) return;

    const isDuplicateName = stockItems.some(
      (item, index) => index !== rowIndex && item.cake.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicateName) return;

    setStockItems((prev) =>
      prev.map((item, index) =>
        index === rowIndex
          ? {
              ...item,
              cake: name,
              price,
            }
          : item
      )
    );
  };

  const handleDeleteCakePriceRow = (rowIndex) => {
    setStockItems((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  const handleStockAddInput = (key, value) => {
    setStockAddForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddStockQty = () => {
    const qtyToAdd = Number(stockAddForm.qty);
    if (!stockAddForm.cake || Number.isNaN(qtyToAdd) || qtyToAdd <= 0 || !stockAddForm.madeDate || !stockAddForm.expiryDate) return;

    setStockItems((prev) =>
      prev.map((item) =>
        item.cake === stockAddForm.cake
            ? {
                ...item,
                qty: item.qty + qtyToAdd,
                madeDate: stockAddForm.madeDate,
                expiryDate: stockAddForm.expiryDate,
              }
            : item
      )
    );

    setStockAddForm((prev) => ({ 
      ...prev, 
      qty: '',
      madeDate: new Date().toISOString().slice(0, 10),
      expiryDate: '',
    }));
  };

  const handleStockDeliveryInput = (key, value) => {
    if (key === 'cakeType') {
      const matchedCake = stockItems.find((item) => item.cake === value);
      setStockDeliveryForm((prev) => ({
        ...prev,
        cakeType: value,
        price: value ? matchedCake?.price ?? prev.price : '',
      }));
      return;
    }
    setStockDeliveryForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateStockDelivery = () => {
    const quantity = Number(stockDeliveryForm.quantity);
    const price = Number(stockDeliveryForm.price);
    if (
      !stockDeliveryForm.cakeType ||
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      Number.isNaN(price) ||
      price <= 0 ||
      !stockDeliveryForm.expiryDate ||
      !stockDeliveryForm.deliveryDate
    ) {
      return;
    }

    setStockDeliveryItems((prev) => [
      ...prev,
      {
        deliveryDate: stockDeliveryForm.deliveryDate,
        cakeType: stockDeliveryForm.cakeType,
        quantity,
        price,
        expiryDate: stockDeliveryForm.expiryDate,
      },
    ]);

    setIsStockDeliveryModalOpen(false);
    setStockDeliveryForm({
      cakeType: '',
      quantity: '',
      price: '',
      expiryDate: '',
      deliveryDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDeliveryInput = (key, value) => {
    if (key === 'cake') {
      const matchedCake = stockItems.find((item) => item.cake === value);
      setDeliveryForm((prev) => ({
        ...prev,
        cake: value,
        price: matchedCake?.price || prev.price,
      }));
      return;
    }
    setDeliveryForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateDelivery = () => {
    const qty = Number(deliveryForm.qty);
    const price = Number(deliveryForm.price);
    const deliveryDateTime = deliveryForm.deliveryDateTime || '';
    const [datePart, timePart] = deliveryDateTime.split('T');
    if (
      !deliveryForm.cake ||
      Number.isNaN(qty) ||
      qty <= 0 ||
      Number.isNaN(price) ||
      price <= 0 ||
      !datePart ||
      !timePart
    ) return;

    setDeliveryItems((prev) => [
      ...prev,
      {
        branch: 'Main Branch',
        customer: deliveryForm.customer.trim() || 'Walk-in Customer',
        contact: deliveryForm.contact.trim() || '-',
        address: deliveryForm.address.trim() || '-',
        cake: deliveryForm.cake,
        price,
        qty,
        time: timePart,
        status: 'Pending',
        orderDate: deliveryForm.orderDate,
        pickupDate: datePart,
        specialInstructions: deliveryForm.specialInstructions.trim() || '-',
      },
    ]);

    setDeliveryWarning('');
    setIsDeliveryModalOpen(false);
    setDeliveryForm({
      branch: 'Main Branch',
      customer: '',
      contact: '',
      address: '',
      cake: stockItems[0]?.cake || '',
      price: stockItems[0]?.price || 0,
      qty: '',
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDateTime: '',
      specialInstructions: '',
    });
  };

  const handleAdvanceDeliveryStatus = (rowIndex) => {
    const targetDelivery = deliveryItems[rowIndex];
    if (!targetDelivery || targetDelivery.status === 'Out for Delivery') return;

    if (targetDelivery.status === 'Pending') {
      setDeliveryWarning('');
      setDeliveryItems((prev) =>
        prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Ready' } : row))
      );
      return;
    }

    if (targetDelivery.status === 'Ready' || targetDelivery.status === 'In Transit') {
      const stockMatch = stockItems.find((item) => item.cake === targetDelivery.cake);
      const availableQty = stockMatch?.qty || 0;

      if (availableQty < targetDelivery.qty) {
        setDeliveryWarning(
          `Cannot confirm ${targetDelivery.cake} for ${targetDelivery.customer || 'customer'}: ` +
            `requested ${targetDelivery.qty}, available ${availableQty}.`
        );
        return;
      }

      setStockItems((prev) =>
        prev.map((item) =>
          item.cake === targetDelivery.cake
            ? {
                ...item,
                qty: item.qty - targetDelivery.qty,
              }
            : item
        )
      );

      setDeliveryItems((prev) =>
        prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Out for Delivery' } : row))
      );
      setDeliveryWarning('');
    }
  };

  const getMessageCake = (messageContent) => {
    const normalized = messageContent.toLowerCase();
    const matched = stockItems.find((item) => normalized.includes(item.cake.toLowerCase().replace(' cake', '')));
    return matched?.cake || stockItems[0]?.cake || '';
  };

  const getMessageQty = (messageContent) => {
    const firstNumber = messageContent.match(/(\d+)/);
    return firstNumber ? firstNumber[1] : '';
  };

  const handleMessageAction = (messageId, actionKey) => {
    const targetMessage = messages.find((msg) => msg.id === messageId);
    if (!targetMessage) return;

    if (
      actionKey === 'convert-order' ||
      actionKey === 'create-reservation' ||
      actionKey === 'add-order-delivery' ||
      actionKey === 'add-custom-delivery'
    ) {
      const detectedCake = getMessageCake(targetMessage.content);
      setDeliveryForm({
        branch: 'Main Branch',
        customer: targetMessage.from.replace('Seller - ', '').trim() || 'Reserved Customer',
        contact: '',
        address: '',
        cake: detectedCake,
        price: stockItems.find((item) => item.cake === detectedCake)?.price || 0,
        qty: getMessageQty(targetMessage.content),
        orderDate: new Date().toISOString().slice(0, 10),
        pickupDate: '',
        specialInstructions:
          actionKey === 'convert-order' || actionKey === 'add-order-delivery'
            ? `Converted from message: ${targetMessage.content}`
            : `Custom order note: ${targetMessage.content}`,
      });
      setIsDeliveryModalOpen(true);
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              unread: false,
              urgent: actionKey === 'flag-urgent' ? true : msg.urgent,
              actionTaken:
                actionKey === 'convert-order' || actionKey === 'add-order-delivery'
                  ? 'Converted to order'
                  : actionKey === 'create-reservation' || actionKey === 'add-custom-delivery'
                    ? 'Saved as custom order delivery'
                    : 'Flagged as urgent',
            }
          : msg
      )
    );
  };

  const handleSendMessage = (thread, text) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        thread,
        fromRole: 'packer',
        from: 'Packer - Main Branch',
        content: text,
        sentAt: timestamp,
        unread: false,
        urgent: false,
        actionTaken: '',
      },
    ]);
  };

  const handleMarkThreadRead = (thread) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.thread === thread && msg.fromRole !== 'packer'
          ? {
              ...msg,
              unread: false,
            }
          : msg
      )
    );
  };

  const renderActivePage = () => {
    if (activeTab === 'dashboard') {
      return (
        <DashboardOverview
          stockItems={stockItems}
          deliveryItems={deliveryItems}
          customOrders={customOrders}
        />
      );
    }

    if (activeTab === 'inventory') {
      return (
        <InventoryOverview
          stockItems={stockItems}
          getBadgeClass={getBadgeClass}
          stockAddForm={stockAddForm}
          onChangeStockAdd={handleStockAddInput}
          onAddStock={handleAddStockQty}
        />
      );
    }

    if (activeTab === 'deliveries') {
      return (
        <DeliveriesOverview
          stockDeliveryItems={stockDeliveryItems}
          onOpenStockDeliveryModal={() => setIsStockDeliveryModalOpen(true)}
        />
      );
    }

    if (activeTab === 'cake-prices') {
      return (
        <CakePrices
          stockItems={stockItems}
          onAddCake={handleAddCakePriceRow}
          onSaveCake={handleSaveCakePriceRow}
          onDeleteCake={handleDeleteCakePriceRow}
        />
      );
    }

    if (activeTab === 'settings') {
      return <PackerSettings packerName={packerName} onSaveName={setPackerName} />;
    }

    return (
      <PackerMessages
        inboxMessages={messages}
        onAction={handleMessageAction}
        onSendMessage={handleSendMessage}
        onMarkThreadRead={handleMarkThreadRead}
      />
    );
  };

  return (
    <div className={`packer-dashboard-container ${isSidebarMinimized ? 'sidebar-minimized' : ''}`}>
      <PackerSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unreadCount}
        onLogout={onLogout}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized((prev) => !prev)}
        packerName={packerName}
      />

      <main className="packer-main-content">{renderActivePage()}</main>

      <AddCakeModal
        isOpen={isAddCakeOpen}
        cakeName={newCakeName}
        cakePrice={newCakePrice}
        onChangeCakeName={setNewCakeName}
        onChangeCakePrice={setNewCakePrice}
        onClose={() => setIsAddCakeOpen(false)}
        onSubmit={handleAddCake}
      />

      <StockDeliveryModal
        isOpen={isStockDeliveryModalOpen}
        stockDeliveryForm={stockDeliveryForm}
        stockItems={stockItems}
        onChangeField={handleStockDeliveryInput}
        onClose={() => setIsStockDeliveryModalOpen(false)}
        onSubmit={handleCreateStockDelivery}
      />
      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        deliveryForm={deliveryForm}
        stockItems={stockItems}
        onChangeField={handleDeliveryInput}
        onClose={() => setIsDeliveryModalOpen(false)}
        onSubmit={handleCreateDelivery}
      />
    </div>
  );
}
