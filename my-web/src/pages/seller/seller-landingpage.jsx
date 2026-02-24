// ─── Imports ──────────────────────────────────────────────────────────────────
import { useState } from 'react';

// ─── Page Components ──────────────────────────────────────────────────────────
import SellerSidebar from './seller-sidebar';
import SellerSection from './seller-section';

// ─── Styles ───────────────────────────────────────────────────────────────────
import '../../styles/seller/seller-section.css';

// ─── Component ────────────────────────────────────────────────────────────────
export default function SellerLandingPage({ onLogout, initialName = 'Seller' }) {

  const [activeTab,        setActiveTab]        = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullName, setFullName] = useState(initialName);

  const handleNavigate      = (tab)  => setActiveTab(tab);
  const handleToggleSidebar = ()     => setSidebarCollapsed(prev => !prev);
  const handleSaveName      = (name) => setFullName(name);

  return (
    <div className="seller-dashboard-container">

      <SellerSidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        onLogout={onLogout}
        fullName={fullName}
      />

      <SellerSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fullName={fullName}
        onSaveName={handleSaveName}
      />

    </div>
  );
}