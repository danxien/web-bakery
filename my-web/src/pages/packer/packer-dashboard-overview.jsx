import React from 'react';
import {
  Truck,
  MessageSquare,
  Package,
  Clock3,
  CheckCircle2,
  CircleAlert,
} from 'lucide-react';

const LOW_STOCK_QTY = 5;
const HIGH_STOCK_QTY = 16;

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


      <section className="packer-table-card">
        <div className="packer-table-head">
          <h3>Main Branch Stock List</h3>
        </div>
        <div className="packer-table-wrap dashboard-table-wrap">
          <table className="dashboard-table">
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
              {stockItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="dashboard-empty-cell">
                    <span className="dashboard-empty">
                      <CircleAlert size={16} />
                      No stock rows available
                    </span>
                  </td>
                </tr>
              )}
              {stockItems.map((item) => (
                <tr
                  key={`${item.branch}-${item.cake}`}
                  className={item.qty <= LOW_STOCK_QTY ? 'stock-row-low' : item.qty >= HIGH_STOCK_QTY ? 'stock-row-high' : ''}
                >
                  <td>{item.cake}</td>
                  <td>PHP {item.price}</td>
                  <td>
                    <span className={`stock-qty-chip ${item.qty <= LOW_STOCK_QTY ? 'low' : item.qty >= HIGH_STOCK_QTY ? 'high' : 'normal'}`}>
                      {item.qty}
                    </span>
                  </td>
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
        <div className="packer-table-wrap dashboard-table-wrap">
          <table className="dashboard-table">
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
                  <td colSpan={7} className="dashboard-empty-cell">
                    <span className="dashboard-empty">
                      <CircleAlert size={16} />
                      No pending delivery orders
                    </span>
                  </td>
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
        <div className="packer-table-wrap dashboard-table-wrap">
          <table className="dashboard-table">
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
              {customOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="dashboard-empty-cell">
                    <span className="dashboard-empty">
                      <CircleAlert size={16} />
                      No custom orders found
                    </span>
                  </td>
                </tr>
              )}
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

