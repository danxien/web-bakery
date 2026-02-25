// ─── Imports ──────────────────────────────────────────────────────────────────
import {
  LayoutDashboard, Package, BarChart3, ClipboardList,
  Users, Truck, MessageSquare, Settings, LogOut, FileText, CalendarCheck
} from "lucide-react";

import logo from "../../assets/logo.png";
import "../../styles/manager/sidebarmenu.css";

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { key: "inventory",    label: "Inventory",       icon: Package },
  { key: "deliveries",   label: "Deliveries",      icon: Truck },
  { key: "reservations", label: "Reservations",    icon: CalendarCheck },
  { key: "customOrders", label: "Custom Orders",   icon: ClipboardList },
  { key: "sales",        label: "Sales",           icon: BarChart3 },
  { key: "reports",      label: "Reports",         icon: FileText },
  { key: "messages",     label: "Messages",        icon: MessageSquare },
  { key: "users",        label: "User Management", icon: Users },
];

// ─── Component ────────────────────────────────────────────────────────────────
// managerName — passed down from ManagerLandingPage, updated by ManagerSettings
export default function SidebarMenu({
  activePage,
  onNavigate,
  collapsed,
  onToggle,
  onLogout,
  managerName = 'Manager',   // replaces hardcoded "Dadi Rob"
}) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* ── Header ── */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="logo-group">
            <div className="sidebar-logo-container" onClick={onToggle}>
              <img src={logo} alt="Regis Logo" className="sidebar-logo-img" />
            </div>
            <div className="logo-text">
              <h2>Regis Cake Shop</h2>
              <p>Main Branch</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="sidebar-logo-container" onClick={onToggle}>
            <img src={logo} alt="Regis Logo" className="sidebar-logo-img" />
          </div>
        )}
      </div>

      {/* ── User Info — hidden when collapsed ── */}
      {!collapsed && (
        <div className="user-info">
          <h3>{managerName}</h3>   {/* dynamic — updates live from Settings */}
          <p>Manager</p>
        </div>
      )}

      {/* ── Navigation ── */}
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

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button
          className={`footer-nav-item ${activePage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="footer-nav-item logout" onClick={onLogout}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
}