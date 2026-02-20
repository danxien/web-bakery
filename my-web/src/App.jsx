import React, { useState } from 'react';
import LoginSection from "./pages/login-section";
import PackerSection from "./pages/packer/dashboard";
import SellerSection from "./pages/seller/seller-section";
import ManagerSection from "./pages/manager/landing-page";

function App() {
  const [userRole, setUserRole] = useState('guest'); 

  const handleLogout = () => {
    setUserRole('guest');
  };

  return (
    <div className="App">
      {userRole === 'guest' && (
        <LoginSection onLogin={setUserRole} />
      )}

      {userRole === 'packer' && (
        <PackerSection onLogout={handleLogout} />
      )}

      {userRole === 'seller' && (
        <SellerSection onLogout={handleLogout} />
      )}

      {userRole === 'manager' && (
        <ManagerSection onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;