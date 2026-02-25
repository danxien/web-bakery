import React, { useMemo, useState } from 'react';
import {
  Truck,
  MessageSquare,
  Package,
  CircleAlert,
  Clock3,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export default function DashboardOverview({
  totals,
  unreadCount,
  stockItems,
  pendingOrders,
  customOrders,
  getBadgeClass,
  onOpenDeliveryModal,
  onOpenMessages,
}) {
  const [isStockFilterOpen, setIsStockFilterOpen] = useState(false);
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [stockSortBy, setStockSortBy] = useState('None');
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  const todayDate = new Date().toISOString().slice(0, 10);
  const isExpired = (item) => item.status === 'Expired' || item.expiryDate < todayDate;

  const filteredStockItems = useMemo(() => {
    const filtered = stockItems.filter((item) => {
      const matchesSearch =
        item.cake.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        String(item.price).includes(stockSearchTerm) ||
        item.expiryDate.includes(stockSearchTerm) ||
        item.madeDate.includes(stockSearchTerm);
      
      if (stockStatusFilter === 'All') return matchesSearch;
      if (stockStatusFilter === 'Expired') return matchesSearch && isExpired(item);
      return matchesSearch && item.status === stockStatusFilter;
    });

    const sorted = [...filtered];
    if (stockSortBy === 'Qty (Low to High)') {
      sorted.sort((a, b) => a.qty - b.qty);
    }
    if (stockSortBy === 'Expiry (Soonest)') {
      sorted.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    }
    if (stockSortBy === 'Price (High to Low)') {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [stockItems, stockSortBy, stockStatusFilter, stockSearchTerm]);

  const activeFilterCount = Number(stockStatusFilter !== 'All') + Number(stockSortBy !== 'None');

  const resetStockFilters = () => {
    setStockStatusFilter('All');
    setStockSortBy('None');
  };

  return (
    <>
      <div className="packer-heading-block">
        <h1>Dashboard</h1>
        <p>Monitor stock levels, expiry dates, and branch deliveries.</p>
      </div>

      <div className="packer-action-cards">
        <button className="packer-action-card new-delivery" onClick={onOpenDeliveryModal} type="button">
          <div className="packer-action-icon">
            <Truck size={20} />
          </div>
          <div>
            <h4>New Delivery</h4>
            <p>Add delivery order for Main Branch</p>
          </div>
        </button>

        <button className="packer-action-card messages" onClick={onOpenMessages} type="button">
          <div className="packer-action-icon">
            <MessageSquare size={20} />
          </div>
          <div>
            <h4>Messages</h4>
            <p>{unreadCount} unread messages</p>
          </div>
        </button>
      </div>

      <div className="packer-stats-grid">
        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Total Cakes</span>
            <Package size={18} />
          </div>
          <h2>{totals.totalCakes}</h2>
          <small>Units in stock</small>
        </article>

        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Fresh Cakes</span>
            <CheckCircle2 size={18} />
          </div>
          <h2>{totals.freshCount}</h2>
          <small>Safe to sell</small>
        </article>

        <article className="packer-stat-card">
          <div className="packer-stat-row">
            <span>Near Expiry</span>
            <Clock3 size={18} />
          </div>
          <h2>{totals.nearExpiryCount}</h2>
          <small>Needs fast dispatch</small>
        </article>

              </div>

      <div className="packer-alerts">
        <div className="alert danger">
          <CircleAlert size={16} />
          <span>Red Velvet Cake - only 6 left in Main Branch</span>
        </div>
        <div className="alert warn">
          <CircleAlert size={16} />
          <span>Blueberry Cheesecake - expired in Main Branch (2 pcs)</span>
        </div>
      </div>

      <section className="packer-table-card">
        <div className="packer-table-head">
          <h3>Main Branch Stock List</h3>
        </div>
        {isStockFilterOpen && (
          <div className="stock-filter-panel">
            <label>
              Status
              <select value={stockStatusFilter} onChange={(event) => setStockStatusFilter(event.target.value)}>
                <option value="All">All</option>
                <option value="Fresh">Fresh</option>
                <option value="Near Expiry">Near Expiry</option>
                <option value="Expired">Expired</option>
              </select>
            </label>
            <label>
              Sort By
              <select value={stockSortBy} onChange={(event) => setStockSortBy(event.target.value)}>
                <option value="None">None</option>
                <option value="Qty (Low to High)">Qty (Low to High)</option>
                <option value="Expiry (Soonest)">Expiry (Soonest)</option>
                <option value="Price (High to Low)">Price (High to Low)</option>
              </select>
            </label>
            <button type="button" className="stock-filter-reset-btn" onClick={resetStockFilters}>
              Reset
            </button>
          </div>
        )}
        <div className="packer-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cake Name</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Made Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStockItems.length === 0 && (
                <tr>
                  <td colSpan={6}>No stock rows match the selected filters</td>
                </tr>
              )}
              {filteredStockItems.map((item) => (
                <tr key={`${item.branch}-${item.cake}`}>
                  <td>{item.cake}</td>
                  <td>PHP {item.price}</td>
                  <td>{item.qty}</td>
                  <td>{item.madeDate}</td>
                  <td>{item.expiryDate}</td>
                  <td>
                    <span className={`status-chip ${getBadgeClass(item.status)}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="packer-table-card mt-14">
        <div className="packer-table-head">
          <h3>New Delivery Orders</h3>
        </div>
        <div className="packer-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch</th>
                <th>Cake</th>
                <th>Qty</th>
                <th>Production Date</th>
                <th>Expiry Date</th>
                <th>Order Note</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 && (
                <tr>
                  <td colSpan={7}>No pending delivery orders</td>
                </tr>
              )}
              {pendingOrders.map((order, index) => (
                <tr key={`${order.cake}-${order.time}-${index}`}>
                  <td>{order.branch}</td>
                  <td>{order.cake}</td>
                  <td>{order.qty}</td>
                  <td>{order.productionDate || '-'}</td>
                  <td>{order.expiryDate || '-'}</td>
                  <td>{order.note || '-'}</td>
                  <td>
                    <span className={`status-chip ${getBadgeClass(order.status)}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="packer-table-card mt-14">
        <div className="packer-table-head">
          <h3>Main Branch Custom Orders</h3>
        </div>
        <div className="packer-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Cake</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Pickup Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customOrders.map((order) => (
                <tr key={`${order.customer}-${order.pickup}`}>
                  <td>{order.customer}</td>
                  <td>{order.cake}</td>
                  <td>{order.qty}</td>
                  <td>PHP {order.price}</td>
                  <td>PHP {order.price * order.qty}</td>
                  <td>{order.pickup}</td>
                  <td>
                    <span className={`status-chip ${getBadgeClass(order.status)}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
