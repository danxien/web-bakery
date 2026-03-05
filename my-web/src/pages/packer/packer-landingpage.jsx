import React, { useMemo, useState } from 'react';
import PackerSidebar from './packer-sidebarmenu';
import DashboardOverview from './packer-dashboard-overview';
import InventoryOverview from './packer-inventory-overview';
import DeliveriesOverview from './packer-deliveries-overview';
import PackerMessages from './packer-messages';
import CakePrices from './packer-cake-prices';
import PackerSettings from './packer-settings';
import { AddCakeModal, DeliveryModal } from './packer-modals';
import {
  initialBranchStock,
  initialDeliveryToday,
  inboxMessages,
  customOrders,
  getBadgeClass,
} from './packer-data';

import '../../styles/packer/packer-dashboard.css';
import '../../styles/packer/packer-sidebarmenu.css';
import '../../styles/packer/packer-dashboard-overview.css';
import '../../styles/packer/packer-inventory-overview.css';
import '../../styles/packer/packer-deliveries-overview.css';
import '../../styles/packer/packer-messages.css';
import '../../styles/packer/packer-modals.css';
import '../../styles/packer/packer-cake-prices.css';
import '../../styles/packer/packer-settings.css';

const getCurrentTimeValue = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function PackerLandingPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packerName, setPackerName] = useState('Packer');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [stockItems, setStockItems] = useState(initialBranchStock);
  const [deliveryItems, setDeliveryItems] = useState(initialDeliveryToday);
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
  const [deliveryForm, setDeliveryForm] = useState({
    branch: 'Main Branch',
    orderType: 'regular',
    customer: '',
    contact: '',
    address: '',
    cake: initialBranchStock[0]?.cake || '',
    customCakeName: '',
    customSize: '',
    customFlavor: '',
    customTheme: '',
    dedicationMessage: '',
    price: initialBranchStock[0]?.price || 0,
    qty: '',
    orderDate: new Date().toISOString().slice(0, 10),
    pickupDate: '',
    deliveryTime: '',
    specialInstructions: '',
  });
  const [stockAddForm, setStockAddForm] = useState({
    cake: initialBranchStock[0]?.cake || '',
    qty: '',
    madeDate: new Date().toISOString().slice(0, 10),
    madeTime: getCurrentTimeValue(),
    expiryDate: '',
  });
  const [deliveryWarning, setDeliveryWarning] = useState('');

  const totals = useMemo(() => {
    const totalCakes = stockItems.reduce((sum, row) => sum + row.qty, 0);
    const freshCount = stockItems.filter((row) => row.status === 'Fresh').reduce((sum, row) => sum + row.qty, 0);
    const nearExpiryCount = stockItems
      .filter((row) => row.status === 'Near Expiry')
      .reduce((sum, row) => sum + row.qty, 0);
    
    const today = new Date().toISOString().slice(0, 10);
    const deliveredToday = deliveryItems
      .filter((row) => row.status === 'Delivered' && row.orderDate === today)
      .reduce((sum, row) => sum + row.qty, 0);
    
    const revenueToday = deliveryItems
      .filter((row) => row.status === 'Delivered' && row.orderDate === today)
      .reduce((sum, row) => sum + (row.price * row.qty), 0);
    
    const customOrderCount = customOrders.length;

    return { totalCakes, freshCount, nearExpiryCount, deliveredToday, revenueToday, customOrderCount };
  }, [stockItems, deliveryItems]);

  const unreadCount = messages.filter((msg) => msg.unread).length;
  const pendingOrders = deliveryItems.filter(
    (row) => row.status === 'Pending' || row.status === 'Out for Delivery' || row.status === 'In Transit'
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
    if (
      !stockAddForm.cake ||
      Number.isNaN(qtyToAdd) ||
      qtyToAdd <= 0 ||
      !stockAddForm.madeDate ||
      !stockAddForm.madeTime ||
      !stockAddForm.expiryDate
    ) return;

    setStockItems((prev) =>
      prev.map((item) =>
        item.cake === stockAddForm.cake
          ? {
              ...item,
              qty: item.qty + qtyToAdd,
              madeDate: stockAddForm.madeDate,
              time: stockAddForm.madeTime,
              expiryDate: stockAddForm.expiryDate,
            }
          : item
      )
    );

    setStockAddForm((prev) => ({ 
      ...prev, 
      qty: '',
      madeDate: new Date().toISOString().slice(0, 10),
      madeTime: getCurrentTimeValue(),
      expiryDate: '',
    }));
  };

  const handleDeliveryInput = (key, value) => {
    if (key === 'orderType') {
      if (value === 'custom') {
        setDeliveryForm((prev) => ({
          ...prev,
          orderType: 'custom',
          customCakeName: prev.customCakeName || prev.cake || '',
        }));
        return;
      }

      const fallbackCake = stockItems[0]?.cake || '';
      const fallbackPrice = stockItems.find((item) => item.cake === fallbackCake)?.price || 0;
      setDeliveryForm((prev) => ({
        ...prev,
        orderType: 'regular',
        cake: fallbackCake,
        price: fallbackPrice,
      }));
      return;
    }

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
    const isCustom = deliveryForm.orderType === 'custom';
    const normalizedCake = isCustom
      ? (deliveryForm.customCakeName.trim() || 'Custom Cake Order')
      : deliveryForm.cake;
    if (
      !normalizedCake ||
      Number.isNaN(qty) ||
      qty <= 0 ||
      Number.isNaN(price) ||
      price <= 0 ||
      !deliveryForm.deliveryTime
    ) return;

    setDeliveryItems((prev) => [
      ...prev,
      {
        branch: 'Main Branch',
        customer: deliveryForm.customer.trim() || 'Walk-in Customer',
        contact: deliveryForm.contact.trim() || '-',
        address: deliveryForm.address.trim() || '-',
        orderType: deliveryForm.orderType || 'regular',
        cake: normalizedCake,
        price,
        qty,
        time: deliveryForm.deliveryTime,
        status: 'Pending',
        orderDate: deliveryForm.orderDate,
        pickupDate: deliveryForm.pickupDate || '-',
        customSize: deliveryForm.customSize?.trim() || '-',
        customFlavor: deliveryForm.customFlavor?.trim() || '-',
        customTheme: deliveryForm.customTheme?.trim() || '-',
        dedicationMessage: deliveryForm.dedicationMessage?.trim() || '-',
        specialInstructions: deliveryForm.specialInstructions.trim() || '-',
      },
    ]);

    setDeliveryWarning('');
    setIsDeliveryModalOpen(false);
    setDeliveryForm({
      branch: 'Main Branch',
      orderType: 'regular',
      customer: '',
      contact: '',
      address: '',
      cake: stockItems[0]?.cake || '',
      customCakeName: '',
      customSize: '',
      customFlavor: '',
      customTheme: '',
      dedicationMessage: '',
      price: stockItems[0]?.price || 0,
      qty: '',
      orderDate: new Date().toISOString().slice(0, 10),
      pickupDate: '',
      deliveryTime: '',
      specialInstructions: '',
    });
  };

  const handleAdvanceDeliveryStatus = (rowIndex) => {
    const targetDelivery = deliveryItems[rowIndex];
    if (!targetDelivery || targetDelivery.status === 'Delivered') return;

    if (targetDelivery.status === 'Pending') {
      setDeliveryWarning('');
      setDeliveryItems((prev) =>
        prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Out for Delivery' } : row))
      );
      return;
    }

    if (targetDelivery.status === 'Out for Delivery' || targetDelivery.status === 'In Transit') {
      if (targetDelivery.orderType === 'custom') {
        setDeliveryItems((prev) =>
          prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Delivered' } : row))
        );
        setDeliveryWarning('');
        return;
      }

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
        prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Delivered' } : row))
      );
      setDeliveryWarning('');
    }
  };

  const handleCancelDeliveryStatus = (rowIndex) => {
    setDeliveryItems((prev) =>
      prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Cancelled' } : row))
    );
    setDeliveryWarning('');
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
      const isCustomAction = actionKey === 'create-reservation' || actionKey === 'add-custom-delivery';
      setDeliveryForm({
        branch: 'Main Branch',
        orderType: isCustomAction ? 'custom' : 'regular',
        customer: targetMessage.from.replace('Seller - ', '').trim() || 'Reserved Customer',
        contact: '',
        address: '',
        cake: detectedCake,
        customCakeName: isCustomAction ? detectedCake : '',
        customSize: '',
        customFlavor: '',
        customTheme: '',
        dedicationMessage: '',
        price: stockItems.find((item) => item.cake === detectedCake)?.price || 0,
        qty: getMessageQty(targetMessage.content),
        orderDate: new Date().toISOString().slice(0, 10),
        pickupDate: '',
        deliveryTime: '',
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
          totals={totals}
          unreadCount={unreadCount}
          stockItems={stockItems}
          pendingOrders={pendingOrders}
          customOrders={customOrders}
          getBadgeClass={getBadgeClass}
          onOpenDeliveryModal={() => setIsDeliveryModalOpen(true)}
          onOpenMessages={() => setActiveTab('messages')}
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
          totals={totals}
          customOrders={customOrders}
        />
      );
    }

    if (activeTab === 'deliveries') {
      return (
        <DeliveriesOverview
          deliveryItems={deliveryItems}
          onAdvanceStatus={handleAdvanceDeliveryStatus}
          onCancelStatus={handleCancelDeliveryStatus}
          deliveryWarning={deliveryWarning}
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

      <main className="packer-main-content">
        <div className="packer-content-inner">{renderActivePage()}</div>
      </main>

      <AddCakeModal
        isOpen={isAddCakeOpen}
        cakeName={newCakeName}
        cakePrice={newCakePrice}
        onChangeCakeName={setNewCakeName}
        onChangeCakePrice={setNewCakePrice}
        onClose={() => setIsAddCakeOpen(false)}
        onSubmit={handleAddCake}
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
