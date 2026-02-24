import React, { useState } from 'react';
import '../../styles/seller/settings.css';
import { FaUser, FaSave, FaLock, FaCheckCircle, FaTimes } from 'react-icons/fa';

const SellerSettings = ({ currentName, onSaveName }) => {
  const [tempName, setTempName] = useState(currentName);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    onSaveName(tempName);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };
  
return (
    <div className="settings-page-container">

      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account settings</p>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="header-content">
            <div className="profile-icon-container violet-bg">
              <FaUser className="black-icon" />
            </div>
            <div className="header-text">
              <h2 className="card-title">Profile Information</h2>
              <p className="card-subtitle">Update your personal information</p>
            </div>
          </div>
        </div>
        <div className="settings-form">
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Role</label>
            <input type="text" defaultValue="Seller" readOnly className="readonly-input" />
          </div>
          <div className="input-group">
            <label>Branch</label>
            <input type="text" defaultValue="Main Branch" readOnly className="readonly-input" />
          </div>
          <button className="save-changes-btn" onClick={handleSave}>
            <FaSave className="black-icon" /> Save Changes
          </button>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <div className="header-content">
            <div className="profile-icon-container blue-bg">
              <FaLock className="black-icon" />
            </div>
            <div className="header-text">
              <h2 className="card-title">Change Password</h2>
              <p className="card-subtitle">Update your password to keep your account secure</p>
            </div>
          </div>
        </div>
        <div className="settings-form">
          <div className="input-group">
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password" />
          </div>
          <div className="input-group">
            <label>New Password</label>
            <input type="password" placeholder="Enter new password" />
          </div>
          <div className="input-group">
            <label>Confirm New Password</label>
            <input type="password" placeholder="Confirm new password" />
          </div>
          <button className="save-changes-btn">
            <FaLock className="black-icon" /> Change Password
          </button>
        </div>
      </div>

      <div className="settings-card">
        <div className="card-header">
          <h2 className="card-title">System Information</h2>
        </div>
        <div className="system-info-container">
          <div className="info-row">
            <span className="info-label">User ID:</span>
            <span className="info-value mono">{tempName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value bold">Seller</span>
          </div>
          <div className="info-row">
            <span className="info-label">System Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="toast-container">
          <div className="toast-content">
            <div className="toast-icon-wrapper">
              <FaCheckCircle size={18} color="#fff" />
            </div>
            <div className="toast-text">
              <p className="toast-main">Profile Updated</p>
              <p className="toast-sub">Your changes have been saved.</p>
            </div>
            <button className="toast-close" onClick={() => setShowToast(false)}>
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerSettings;