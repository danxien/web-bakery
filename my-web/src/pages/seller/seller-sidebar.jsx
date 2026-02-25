// ─── Imports ──────────────────────────────────────────────────────────────────
import {
  LayoutDashboard, ShoppingCart, Calendar, Star,
  Truck, Package, MessageSquare, Settings, LogOut
} from 'lucide-react';

import logo from '../../assets/logo.png';
import '../../styles/seller/seller-section.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { key: 'sales',        label: 'Sales',          icon: ShoppingCart },
  { key: 'reservations', label: 'Reservations',   icon: Calendar },
  { key: 'custom',       label: 'Custom Orders',  icon: Star },
  { key: 'deliveries',   label: 'Deliveries',     icon: Truck },
  { key: 'inventory',    label: 'Inventory',      icon: Package },
  { key: 'messages',     label: 'Messages',       icon: MessageSquare },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerSidebar({
  activeTab,
  onNavigate,
  collapsed,
  onToggle,
  onLogout,
  fullName = 'Seller',
}) {
  return (
    <aside className={`seller-sidebar ${collapsed ? 'seller-collapsed' : ''}`}>

      {/* ── Header ── */}
      <div className="seller-sidebar-header">
        {!collapsed && (
          <div className="seller-logo-group">
            <div className="seller-sidebar-logo-container" onClick={onToggle}>
              <img src={logo} alt="Bakery Logo" className="seller-sidebar-logo-img" />
            </div>
            <div className="seller-logo-text">
              <h2>Regis Cake Shop</h2>
              <p>Main Branch</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="seller-sidebar-logo-container" onClick={onToggle}>
            <img src={logo} alt="Bakery Logo" className="seller-sidebar-logo-img" />
          </div>
        )}
      </div>

      {/* ── User Info with collapsed */}
      {!collapsed && (
        <div className="seller-user-info">
          <h3>{fullName}</h3>
          <p>Seller</p>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="seller-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`seller-nav-item ${activeTab === item.key ? 'seller-active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.key === 'messages' && (
                <span className="seller-badge">0</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="seller-sidebar-footer">
        <button
          className={`seller-footer-nav-item ${activeTab === 'settings' ? 'seller-active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="seller-footer-nav-item seller-logout" onClick={onLogout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}