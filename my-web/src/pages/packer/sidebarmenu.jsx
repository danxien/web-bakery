import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logo from '../../assets/logo.png';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'deliveries', label: 'Deliveries', icon: Truck },
  { id: 'cake-prices', label: 'Cake Prices', icon: Wallet },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

export default function PackerSidebar({
  activeTab,
  onTabChange,
  unreadCount,
  onLogout,
  isMinimized,
  onToggleMinimize,
}) {
  const sidebarClass = `packer-sidebar ${isMinimized ? 'collapsed' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="packer-sidebar-header">
        {!isMinimized && (
          <div className="packer-logo-group">
            <div className="packer-logo-wrap">
              <img src={logo} alt="Regis Cake Shop" className="packer-logo" />
            </div>
            <div className="packer-logo-text">
              <h2>Regis Cake Shop</h2>
              <p>Main Branch</p>
            </div>
          </div>
        )}
        {isMinimized && (
          <div className="packer-logo-wrap packer-logo-wrap-collapsed">
            <img src={logo} alt="Regis Cake Shop" className="packer-logo" />
          </div>
        )}

        <button className="packer-minimize-btn" onClick={onToggleMinimize} aria-label="Toggle sidebar">
          {isMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!isMinimized && (
        <div className="packer-user-info">
          <h3>Packer</h3>
          <p>Production Team</p>
        </div>
      )}

      <nav className="packer-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`packer-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
              title={isMinimized ? item.label : ''}
            >
              <Icon size={20} />
              {/* Labels and unread numbers only show when NOT minimized */}
              {!isMinimized && (
                <>
                  <span>{item.label}</span>
                  {item.id === 'messages' && unreadCount > 0 && (
                    <span className="packer-badge">{unreadCount}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="packer-sidebar-footer">
        <button className="packer-footer-item">
          <Settings size={20} />
          {!isMinimized && <span>Settings</span>}
        </button>
        <button 
          className="packer-footer-item packer-logout" 
          onClick={() => onLogout?.('guest')}
        >
          <LogOut size={20} />
          {!isMinimized && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}