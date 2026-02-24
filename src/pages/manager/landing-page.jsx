import { useState } from "react";
import Sidebar from "./sidebarmenu";
import Dashboard from "./dashboard";
import Reports from "./reports";
import InventoryOverview from "./inventoryOverview";
import SalesOverview from "./salesOverview";
import CustomOrders from "./customOrders";
import UserManagement from "./userManagement";
import SystemSettings from "./systemSettings";
import DeliveryOverview from "./deliveriesOverview";
import Messages from "./messages";

// Import the CSS that contains the layout wrapper fixes
import "../../styles/manager/landing-page.css";

export default function ManagerLandingPage({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNavigate = (page) => {
    setActivePage(page);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard setActivePage={setActivePage} />;
      case "reports":
        return <Reports />;
      case "inventory":
        return <InventoryOverview />;
      case "sales":
        return <SalesOverview />;
      case "customOrders":
        return <CustomOrders />;
      case "users":
        return <UserManagement />;
      case "settings":
        return <SystemSettings />;
      case "deliveries":
        return <DeliveryOverview />;
      case "messages":
        return <Messages />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    /* STEP 1: This is the main flex container that holds everything */
    <div className="admin-layout-wrapper">
      
      {/* THE SIDEBAR: Fixed width (260px or 80px) */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onLogout={onLogout}
      />

      {/* STEP 2: The Main Content Area: Stretches to fill remaining width */}
      <main className="main-content-area">
        <div className="content-inner">
          {renderPage()}
        </div>
      </main>

    </div>
  );
}