import React, { useState } from 'react';
import LoginSection  from "./pages/login-section";
import PackerSection from "./pages/packer/landing-page";
import SellerSection from "./pages/seller/seller-landingpage";
import ManagerSection from "./pages/manager/landing-page";

function App() {
  const [userRole,   setUserRole]   = useState('guest');
  const [loginName,  setLoginName]  = useState('Manager');

  // LoginSection calls onLogin(role, username) — capture both
  const handleLogin = (role, username) => {
    setUserRole(role);
    setLoginName(username);
  };

  const handleLogout = () => {
    setUserRole('guest');
    setLoginName('Manager');
  };

  return (
    <div className="App">
      {userRole === 'guest' && (
        <LoginSection onLogin={handleLogin} />
      )}

      {userRole === 'packer' && (
        <PackerSection onLogout={handleLogout} />
      )}

      {userRole === 'seller' && (
        <SellerSection onLogout={handleLogout} />
      )}

      {userRole === 'manager' && (
        <ManagerSection
          onLogout={handleLogout}
          initialName={loginName}
        />
      )}
    </div>
  );
}

export default App;
