import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/login-section.css';
import logo from '../assets/logo.png';

const LoginSection = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'packer' && password === 'packer123') {
      onLogin('packer');
    } else if (username === 'seller' && password === 'seller123') {
      onLogin('seller');
    } else if (username === 'manager' && password === 'manager123') {
      onLogin('manager');
    } else {
      setError('Invalid Account. Please try again.');
    }
  };

  return (
    <div className="bakery-fullscreen-bg">
      <div className="login-content">
        <img src={logo} alt="Bakery Logo" className="bakery-logo" />

        <div className="login-box">
          <h1 className="welcome-text">Welcome Back!</h1>
          <p className="subtitle">Log in to Manage your Bakery Operations</p>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <button className="login-button" onClick={handleLogin}>
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSection;