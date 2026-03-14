import React, { useMemo, useState } from 'react';
import PackerSidebar from './packer-sidebarmenu';
import DashboardOverview from './packer-dashboard-overview';
import InventoryOverview from './packer-inventory-overview';
import DeliveriesOverview from './packer-stock-deliveries';

import CustomOrdersOverview from './packer-custom-orders-overview';
import PackerMessages from './packer-messages';
import CakePrices from './packer-cake-prices';
import PackerSettings from './packer-settings';
import { AddCakeModal, CustomOrderModal, DeliveryModal, StockDeliveryModal } from './packer-modals';
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
import '../../styles/packer/packer-inventory-overview.css';
import '../../styles/packer/packer-stock-deliveries.css';

import '../../styles/packer/packer-custom-orders-overview.css';
import '../../styles/packer/packer-messages.css';
import '../../styles/packer/packer-modals.css';
import '../../styles/packer/packer-cake-prices.css';
import '../../styles/packer/packer-settings.css';

const toDateValue = (value) => {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const computeStockStatus = (expiryDate) => {
  const expiry = toDateValue(expiryDate);
  if (!expiry) return 'Fresh';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 2) return 'Near Expiry';
  return 'Fresh';
};

export default function PackerLandingPage({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packerName, setPackerName] = useState('Packer');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [stockItems, setStockItems] = useState(initialBranchStock);
  const [deliveryItems, setDeliveryItems] = useState(initialDeliveryToday);
  const [stockDeliveryItems, setStockDeliveryItems] = useState(initialStockDeliveries);
  const [customOrderItems, setCustomOrderItems] = useState(customOrders);

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
  const [isCustomOrderModalOpen, setIsCustomOrderModalOpen] = useState(false);
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
  const [customOrderForm, setCustomOrderForm] = useState({
    branch: 'Main Branch',
    cake: '',
    customer: '',
    contact: '',
    address: '',
    qty: '',
    price: '',
    pickupDate: '',
    specialInstructions: '',
  });

  const totals = useMemo(() => {
    const totalCakes = stockItems.reduce((sum, row) => sum + row.qty, 0);
    const freshCount = stockItems
      .filter((row) => computeStockStatus(row.expiryDate) === 'Fresh')
      .reduce((sum, row) => sum + row.qty, 0);
    const nearExpiryCount = stockItems
      .filter((row) => computeStockStatus(row.expiryDate) === 'Near Expiry')
      .reduce((sum, row) => sum + row.qty, 0);
    
    const today = new Date().toISOString().slice(0, 10);
    const deliveredToday = deliveryItems
      .filter((row) => row.status === 'Delivered' && row.orderDate === today)
      .reduce((sum, row) => sum + row.qty, 0);
    
    const revenueToday = deliveryItems
      .filter((row) => row.status === 'Delivered' && row.orderDate === today)
      .reduce((sum, row) => sum + (row.price * row.qty), 0);
    
    const customOrderCount = customOrderItems.length;

    return { totalCakes, freshCount, nearExpiryCount, deliveredToday, revenueToday, customOrderCount };
  }, [stockItems, deliveryItems, customOrderItems]);

  const unreadCount = messages.filter((msg) => msg.unread).length;
  const pendingOrders = deliveryItems.filter(
    (row) => row.status === 'Pending' || row.status === 'Ready' || row.status === 'Out for Delivery' || row.status === 'In Transit'
  );

  const handleDeleteCustomOrder = (rowIndex) => {
    setCustomOrderItems((prev) => prev.filter((_, index) => index !== rowIndex));
  };

  const handleUpdateCustomOrderStatus = (rowIndex, status) => {
    setCustomOrderItems((prev) =>
      prev.map((row, index) => (index === rowIndex ? { ...row, status } : row))
    );
  };

  const handleCustomOrderInput = (key, value) => {
    setCustomOrderForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateCustomOrder = () => {
    const qty = Number(customOrderForm.qty);
    const price = Number(customOrderForm.price);
    if (
      !customOrderForm.cake.trim() ||
      !customOrderForm.customer.trim() ||
      Number.isNaN(qty) ||
      qty <= 0 ||
      Number.isNaN(price) ||
      price <= 0 ||
      !customOrderForm.pickupDate
    ) return;

    setCustomOrderItems((prev) => [
      ...prev,
      {
        branch: 'Main Branch',
        cake: customOrderForm.cake.trim(),
        customer: customOrderForm.customer.trim(),
        contact: customOrderForm.contact.trim() || '-',
        address: customOrderForm.address.trim() || '-',
        qty,
        price,
        pickupDate: customOrderForm.pickupDate,
        status: 'Pending',
        orderDate: new Date().toISOString().slice(0, 10),
        orderType: 'custom',
        specialInstructions: customOrderForm.specialInstructions.trim() || '-',
      },
    ]);

    setIsCustomOrderModalOpen(false);
    setCustomOrderForm({
      branch: 'Main Branch',
      cake: '',
      customer: '',
      contact: '',
      address: '',
      qty: '',
      price: '',
      pickupDate: '',
      specialInstructions: '',
    });
  };

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
      !stockAddForm.expiryDate
    ) return;

    setStockItems((prev) => {
      const matchedCake = prev.find((item) => item.cake === stockAddForm.cake);
      return [
        ...prev,
        {
          branch: 'Main Branch',
          cake: stockAddForm.cake,
          price: matchedCake?.price || 0,
          qty: qtyToAdd,
          madeDate: stockAddForm.madeDate,
          expiryDate: stockAddForm.expiryDate,
          status: computeStockStatus(stockAddForm.expiryDate),
        },
      ];
    });

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
        orderType: 'regular',
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
      const eligibleBatches = stockItems.filter(
        (item) =>
          item.cake === targetDelivery.cake &&
          Number(item.qty || 0) > 0 &&
          computeStockStatus(item.expiryDate) !== 'Expired'
      );
      const availableQty = eligibleBatches.reduce((sum, item) => sum + Number(item.qty || 0), 0);

      if (availableQty < targetDelivery.qty) {
        setDeliveryWarning(
          `Cannot confirm ${targetDelivery.cake} for ${targetDelivery.customer || 'customer'}: ` +
            `requested ${targetDelivery.qty}, available ${availableQty}.`
        );
        return;
      }

      setStockItems((prev) => {
        const next = prev.map((item) => ({ ...item }));
        let remaining = Number(targetDelivery.qty || 0);

        const sortedBatchIndexes = next
          .map((item, index) => ({ item, index }))
          .filter(
            ({ item }) =>
              item.cake === targetDelivery.cake &&
              Number(item.qty || 0) > 0 &&
              computeStockStatus(item.expiryDate) !== 'Expired'
          )
          .sort((a, b) => {
            const aDate = toDateValue(a.item.expiryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const bDate = toDateValue(b.item.expiryDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return aDate - bDate;
          })
          .map(({ index }) => index);

        sortedBatchIndexes.forEach((index) => {
          if (remaining <= 0) return;
          const currentQty = Number(next[index].qty || 0);
          const deductQty = Math.min(currentQty, remaining);
          next[index].qty = currentQty - deductQty;
          remaining -= deductQty;
        });

        return next;
      });

      setDeliveryItems((prev) =>
        prev.map((row, index) => (index === rowIndex ? { ...row, status: 'Out for Delivery' } : row))
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
      setDeliveryForm({
        branch: 'Main Branch',
        customer: targetMessage.from.replace('Seller - ', '').trim() || 'Reserved Customer',
        contact: '',
        address: '',
        cake: detectedCake,
        price: stockItems.find((item) => item.cake === detectedCake)?.price || 0,
        qty: getMessageQty(targetMessage.content),
        orderDate: new Date().toISOString().slice(0, 10),
        deliveryDateTime: '',
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
          stockDeliveryItems={stockDeliveryItems}
          deliveryItems={deliveryItems}
          customOrders={customOrderItems}
          messages={messages}
          onOpenCustomOrderModal={() => setIsCustomOrderModalOpen(true)}
          onOpenStockDeliveryModal={() => setIsStockDeliveryModalOpen(true)}
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

    if (activeTab === 'custom-orders') {
      return (
        <CustomOrdersOverview
          customOrderItems={customOrderItems}
          onDeleteOrder={handleDeleteCustomOrder}
          onUpdateStatus={handleUpdateCustomOrderStatus}
          onOpenCustomOrderModal={() => setIsCustomOrderModalOpen(true)}
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

      <CustomOrderModal
        isOpen={isCustomOrderModalOpen}
        customOrderForm={customOrderForm}
        onChangeField={handleCustomOrderInput}
        onClose={() => setIsCustomOrderModalOpen(false)}
        onSubmit={handleCreateCustomOrder}
      />
    </div>
  );
}
