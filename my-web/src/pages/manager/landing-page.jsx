import { useState } from "react";

// ─── Page Components ──────────────────────────────────────────────────────────
import Sidebar              from "./sidebarmenu";
import Dashboard            from "./dashboard";
import InventoryOverview    from "./inventoryOverview";
import SalesOverview        from "./salesOverview";
import CustomOrders         from "./customOrders";
import UserManagement       from "./userManagement";
import DeliveryOverview     from "./deliveriesOverview";
import Messages             from "./messages";
import ReservationsOverview from "./reservationOverview";
import ManagerSettings      from "./ManagerSettings";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../../styles/manager/landing-page.css";

// ─── Component ────────────────────────────────────────────────────────────────
// initialName — the username typed at login, passed from App.jsx
export default function ManagerLandingPage({ onLogout, initialName = 'Manager' }) {
  const [activePage,       setActivePage]       = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Seeded from login username, editable via ManagerSettings
  const [managerName,    setManagerName]    = useState(initialName);

  // TODO: Backend - Initialize to 0; real count is pushed by Messages via onUnreadChange
  const [unreadMessages, setUnreadMessages] = useState(0);

  const handleNavigate = (page) => {
    // Clear badge when the user opens the Messages page
    if (page === "messages") setUnreadMessages(0);
    setActivePage(page);
  };

  const handleToggleSidebar = ()     => setSidebarCollapsed((prev) => !prev);
  const handleSaveName      = (name) => setManagerName(name);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard setActivePage={setActivePage} />;
      case "inventory":
        return <InventoryOverview />;
      case "sales":
        return <SalesOverview />;
      case "customOrders":
        return <CustomOrders />;
      case "reservations":
        return <ReservationsOverview />;
      case "users":
        return <UserManagement />;
      case "settings":
        return (
          <ManagerSettings
            managerName={managerName}
            onSaveName={handleSaveName}
          />
        );
      case "deliveries":
        return <DeliveryOverview />;
      case "messages":
        // onUnreadChange — called by Messages whenever the unread count changes
        // (e.g. new message arrives via polling or WebSocket)
        return <Messages onUnreadChange={setUnreadMessages} />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="admin-layout-wrapper">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onLogout={onLogout}
        managerName={managerName}
        unreadMessages={unreadMessages}
      />
      <main className="main-content-area">
        <div className="content-inner">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}