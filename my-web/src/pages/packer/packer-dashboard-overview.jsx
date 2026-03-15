import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Box, Truck } from 'lucide-react';

const toDateValue = (value) => {
  if (!value || value === '-') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseTimeToday = (timeValue) => {
  if (!timeValue) return null;
  const match = `${timeValue}`.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [_, hours, minutes] = match;
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number(hours),
    Number(minutes),
    0,
    0
  );
};

const timeFromDate = (dateValue, timeValue) => {
  if (dateValue) {
    const parsed = new Date(`${dateValue}T${timeValue || '00:00'}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return parseTimeToday(timeValue);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Today';
  const time = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - time.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMinutes >= 0 && diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours >= 0 && diffHours < 24 && time.toDateString() === now.toDateString()) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (time.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (time.toDateString() === now.toDateString()) return 'Today';

  return time.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
};

const getLocalDateString = (dateValue) => {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DashboardOverview({
  stockItems = [],
  stockDeliveryItems = [],
  customOrders = [],
  messages = [],
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateString(today);
  const storageKey = 'pkdash-task-status';

  const [taskStatus, setTaskStatus] = useState(() => {
    if (typeof window === 'undefined') {
      return { date: todayStr, completed: {}, counts: {} };
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { date: todayStr, completed: {}, counts: {} };
      const parsed = JSON.parse(stored);
      if (parsed?.date === todayStr) return parsed;
    } catch (error) {
      return { date: todayStr, completed: {}, counts: {} };
    }
    return { date: todayStr, completed: {}, counts: {} };
  });

  useEffect(() => {
    if (taskStatus.date !== todayStr) {
      setTaskStatus({ date: todayStr, completed: {} });
    }
  }, [taskStatus.date, todayStr]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(taskStatus));
    } catch (error) {
      // Ignore storage errors (private mode or quota).
    }
  }, [taskStatus]);

  const totalStockItems = stockItems.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const expiredItems = stockItems.filter((item) => {
    const expiry = toDateValue(item.expiryDate);
    return expiry ? expiry < today : false;
  });
  const expiredCount = expiredItems.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const lowStockItems = stockItems.filter((item) => Number(item.qty || 0) < 10);

  const deliveriesTodayForTotal = stockDeliveryItems.filter(
    (item) => item.deliveryDate === todayStr
  );

  const totalDeliveredQty = deliveriesTodayForTotal.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const deliveriesToday = stockDeliveryItems.filter((item) => item.deliveryDate === todayStr);

  const customOrdersToday = customOrders.filter((order) => {
    const dueDate = order.deliveryDate || order.pickupDate;
    if (!dueDate) return false;
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    return dueDate === todayStr;
  });

  const taskCounts = useMemo(() => ({
    expired: expiredCount,
    deliveries: deliveriesToday.length,
    'custom-orders': customOrdersToday.length,
    'low-stock': lowStockItems.length,
  }), [expiredCount, deliveriesToday.length, customOrdersToday.length, lowStockItems.length]);

  useEffect(() => {
    setTaskStatus((prev) => {
      if (prev.date !== todayStr) {
        return { date: todayStr, completed: {}, counts: { ...taskCounts } };
      }

      const nextCompleted = { ...prev.completed };
      const nextCounts = { ...prev.counts, ...taskCounts };
      let changed = false;

      Object.entries(taskCounts).forEach(([key, count]) => {
        const prevCount = Number(prev.counts?.[key] ?? 0);
        if (count !== prevCount) {
          if (nextCompleted[key]) {
            delete nextCompleted[key];
          }
          changed = true;
        }
        if (nextCounts[key] !== count) {
          nextCounts[key] = count;
          changed = true;
        }
      });

      if (!changed) return prev;
      return { ...prev, completed: nextCompleted, counts: nextCounts };
    });
  }, [taskCounts, todayStr]);

  const tasks = useMemo(() => [
    {
      id: 'expired',
      priority: expiredCount > 0 ? 'Urgent' : 'Normal',
      description: `Expired cakes to handle (${expiredCount})`,
      due: 'Now',
      disabled: expiredCount === 0,
    },
    {
      id: 'deliveries',
      priority: deliveriesToday.length > 0 ? 'High' : 'Normal',
      description: `Deliveries scheduled for today (${deliveriesToday.length})`,
      due: 'Today',
      disabled: deliveriesToday.length === 0,
    },
    {
      id: 'custom-orders',
      priority: customOrdersToday.length > 0 ? 'High' : 'Normal',
      description: `Custom orders due today (${customOrdersToday.length})`,
      due: 'Today',
      disabled: customOrdersToday.length === 0,
    },
    {
      id: 'low-stock',
      priority: lowStockItems.length > 0 ? 'High' : 'Normal',
      description: `Low stock items needing restock (${lowStockItems.length})`,
      due: 'Before close',
      disabled: lowStockItems.length === 0,
    },
  ], [expiredCount, deliveriesToday.length, customOrdersToday.length, lowStockItems.length]);

  const activityFeed = [
    ...stockDeliveryItems.map((item) => ({
      tone: 'success',
      message: `Stock delivery completed - ${item.cakeType || 'Cake'} (+${item.quantity || 0})`,
      timestamp: timeFromDate(item.deliveryDate)?.getTime() || 0,
    })),
    ...customOrders.map((order) => ({
      tone: 'info',
      message: `New custom order received${order.cakeType ? ` - ${order.cakeType}` : order.cake ? ` - ${order.cake}` : ''}`,
      timestamp: timeFromDate(order.orderDate || order.deliveryDate || order.pickupDate)?.getTime() || 0,
    })),
    ...stockItems.map((item) => ({
      tone: 'info',
      message: `Inventory updated - ${item.cake}`,
      timestamp: timeFromDate(item.madeDate || item.expiryDate)?.getTime() || 0,
    })),
    ...messages.map((msg) => ({
      tone: msg.urgent ? 'critical' : 'info',
      message: `New message from ${msg.from || 'Seller'}`,
      timestamp: timeFromDate(null, msg.sentAt)?.getTime() || 0,
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="pkdash-page">
      <header className="pkdash-hero">
        <div>
          <p className="pkdash-eyebrow">Regis Cake Shop</p>
          <h1 className="pkdash-title">Packer Dashboard</h1>
          <p className="pkdash-subtitle">Track stock, deliveries, and urgent bakery tasks in one place.</p>
        </div>
      </header>

      <section className="pkdash-section">
        <div className="pkdash-section-head">
          <h2>Quick Stats</h2>
          <span className="pkdash-section-rule" />
        </div>

        <div className="pkdash-stats-grid">
          <article className="pkdash-stat-card pkdash-stat-card--blue">
            <div className="pkdash-stat-top">
              <span>Total Stock Items</span>
              <Box size={20} />
            </div>
            <div className="pkdash-stat-value">{totalStockItems}</div>
            <p className="pkdash-stat-sub">From Inventory</p>
          </article>

          <article className="pkdash-stat-card pkdash-stat-card--red">
            <div className="pkdash-stat-top">
              <span>Expired Items</span>
              <AlertTriangle size={20} />
            </div>
            <div className="pkdash-stat-value">{expiredCount}</div>
            <p className="pkdash-stat-sub">Need action</p>
          </article>

          <article className="pkdash-stat-card pkdash-stat-card--green">
            <div className="pkdash-stat-top">
              <span>Today's Total Deliveries</span>
              <Truck size={20} />
            </div>
            <div className="pkdash-stat-value">{totalDeliveredQty}</div>
            <p className="pkdash-stat-sub">From Stock Deliveries</p>
          </article>
        </div>
      </section>

      <section className="pkdash-section">
        <div className="pkdash-section-head">
          <h2>Today's Priority Tasks</h2>
          <span className="pkdash-section-rule" />
        </div>

        <div className="pkdash-task-list">
          {tasks.map((task) => {
            const isDone = Boolean(taskStatus.completed?.[task.id]);
            return (
            <div className={`pkdash-task-card ${isDone ? 'is-done' : ''}`} key={task.id}>
              <span className={`pkdash-badge pkdash-badge--${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
              <div className="pkdash-task-info">
                <p className="pkdash-task-title">{task.description}</p>
                <span className="pkdash-task-due">Due: {task.due}</span>
              </div>
              <button
                type="button"
                className="pkdash-task-action"
                disabled={task.disabled || isDone}
                onClick={() => {
                  if (task.disabled || isDone) return;
                  setTaskStatus((prev) => ({
                    date: prev.date,
                    completed: { ...prev.completed, [task.id]: true },
                  }));
                }}
              >
                {isDone ? 'Completed' : 'Take Action'}
              </button>
            </div>
          )})}
        </div>
      </section>

      <section className="pkdash-section">
        <div className="pkdash-section-head">
          <h2>Recent Activity Feed</h2>
          <span className="pkdash-section-rule" />
        </div>

        <div className="pkdash-activity-card">
          {activityFeed.length ? (
            <ul className="pkdash-activity-list">
              {activityFeed.map((activity, index) => (
                <li className="pkdash-activity-item" key={`${activity.message}-${index}`}>
                  <span className={`pkdash-dot pkdash-dot--${activity.tone}`} />
                  <div className="pkdash-activity-body">
                    <p className="pkdash-activity-text">{activity.message}</p>
                    <span className="pkdash-activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pkdash-activity-empty">No recent activity yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
