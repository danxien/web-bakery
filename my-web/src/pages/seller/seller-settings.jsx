import React, { useState } from 'react';
import '../../styles/seller/seller-settings.css';
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
    <div className="seller-settings-page-container">

      <div className="seller-settings-header">
        <h1 className="seller-settings-title">Settings</h1>
        <p className="seller-settings-subtitle">Manage your account settings</p>
      </div>

      <div className="seller-settings-card">
        <div className="seller-card-header">
          <div className="seller-header-content">
            <div className="seller-profile-icon-container seller-violet-bg">
              <FaUser className="black-icon" />
            </div>
            <div className="header-text">
              <h2 className="seller-card-title">Profile Information</h2>
              <p className="seller-card-subtitle">Update your personal information</p>
            </div>
          </div>
        </div>
        <div className="seller-settings-form">
          <div className="seller-input-group">
            <label>Full Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
          </div>
          <div className="seller-input-group">
            <label>Role</label>
            <input type="text" defaultValue="Seller" readOnly className="seller-readonly-input" />
          </div>
          <div className="seller-input-group">
            <label>Branch</label>
            <input type="text" defaultValue="Main Branch" readOnly className="seller-readonly-input" />
          </div>
          <button className="seller-save-changes-btn" onClick={handleSave}>
            <FaSave className="black-icon" /> Save Changes
          </button>
        </div>
      </div>

      <div className="seller-settings-card">
        <div className="seller-card-header">
          <div className="seller-header-content">
            <div className="seller-profile-icon-container seller-blue-bg">
              <FaLock className="black-icon" />
            </div>
            <div className="header-text">
              <h2 className="seller-card-title">Change Password</h2>
              <p className="seller-card-subtitle">Update your password to keep your account secure</p>
            </div>
          </div>
        </div>
        <div className="seller-settings-form">
          <div className="seller-input-group">
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password" />
          </div>
          <div className="seller-input-group">
            <label>New Password</label>
            <input type="password" placeholder="Enter new password" />
          </div>
          <div className="seller-input-group">
            <label>Confirm New Password</label>
            <input type="password" placeholder="Confirm new password" />
          </div>
          <button className="seller-save-changes-btn">
            <FaLock className="black-icon" /> Change Password
          </button>
        </div>
      </div>

      <div className="seller-settings-card">
        <div className="seller-card-header">
          <h2 className="seller-card-title">System Information</h2>
        </div>
        <div className="seller-system-info-container">
          <div className="seller-info-row">
            <span className="seller-info-label">User ID:</span>
            <span className="seller-info-value mono">{tempName}</span>
          </div>
          <div className="seller-info-row">
            <span className="seller-info-label">Role:</span>
            <span className="seller-info-value bold">Seller</span>
          </div>
          <div className="seller-info-row">
            <span className="seller-info-label">System Version:</span>
            <span className="seller-info-value">1.0.0</span>
          </div>
        </div>
      </div>

      {showToast && (
        <div className="seller-toast-container">
          <div className="seller-toast-content">
            <div className="seller-toast-icon-wrapper">
              <FaCheckCircle size={18} color="#fff" />
            </div>
            <div className="seller-toast-text">
              <p className="seller-toast-main">Profile Updated</p>
              <p className="seller-toast-sub">Your changes have been saved.</p>
            </div>
            <button className="seller-toast-close" onClick={() => setShowToast(false)}>
              <FaTimes size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerSettings;