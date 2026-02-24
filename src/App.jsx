import React, { useState } from 'react';
import LoginSection from './pages/login-section';
import PackerSection from './pages/packer-section';
import SellerSection from './pages/seller/seller-section';
import ManagerSection from './pages/manager/landing-page';

function App() {
  const [userRole, setUserRole] = useState('guest');

  return (
    <div className="App">
      {userRole === 'guest' && <LoginSection onLogin={setUserRole} />}
      {userRole === 'packer' && <PackerSection onLogout={setUserRole} />}
      {userRole === 'seller' && <SellerSection onLogout={setUserRole} />}
      {userRole === 'manager' && <ManagerSection onLogout={setUserRole} />}
    </div>
  );
}

export default App;
