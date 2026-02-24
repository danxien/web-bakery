import React from "react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  ClipboardList,
  Users,
  Truck,
  MessageSquare,
  Settings,
  LogOut,
  FileText
} from "lucide-react";

import logo from "../../assets/logo.png";
import "../../styles/manager/sidebarmenu.css";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "sales", label: "Sales", icon: BarChart3 },
  { key: "customOrders", label: "Custom Orders", icon: ClipboardList },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "deliveries", label: "Deliveries", icon: Truck },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "users", label: "User Management", icon: Users },
];

export default function SidebarMenu({
  activePage,
  onNavigate,
  collapsed,
  onToggle,
  onLogout,
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* HEADER SECTION */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo-group">
            <div className="sidebar-logo-container">
              <img src={logo} alt="Regis Logo" className="sidebar-logo-img" />
            </div>
            <div className="logo-text">
              <h2>Regis Cake Shop</h2>
              <p>Main Branch</p>
            </div>
          </div>
        )}

        <button className="collapse-btn" onClick={onToggle}>
          {collapsed ? <img src={logo} alt="Logo" className="collapse-logo" /> : "⮜"}
        </button>
      </div>

      {/* USER PROFILE - Hidden when collapsed */}
      {!collapsed && (
        <div className="user-info">
          <h3>Dadi Rob</h3>
          <p>Manager</p>
        </div>
      )}

      {/* NAVIGATION LINKS */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${activePage === item.key ? "active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* FOOTER ACTIONS */}
      <div className="sidebar-footer">
        <button className="footer-nav-item">
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </button>
        
        <button className="footer-nav-item logout" onClick={onLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}