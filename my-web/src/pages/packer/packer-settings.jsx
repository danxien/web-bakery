import React, { useState } from 'react';
import { AtSign, CheckCircle, Lock, Save, User, X } from 'lucide-react';
import '../../styles/packer/packer-settings.css';

export default function PackerSettings({
  packerName = 'Packer',
  onSaveName = () => {},
}) {
  const [displayName, setDisplayName] = useState(packerName);
  const [username, setUsername] = useState(packerName.toLowerCase().replace(/\s+/g, ''));
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [toast, setToast] = useState({ show: false, type: 'success', msg: '' });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      showToast('error', 'Name cannot be empty.');
      return;
    }
    onSaveName(displayName.trim());
    showToast('success', 'Packer profile updated successfully.');
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast('error', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      showToast('error', 'New passwords do not match.');
      return;
    }
    if (newPw.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    showToast('success', 'Password changed successfully.');
  };

  return (
    <div className="packer-settings__page">
      <div className="packer-settings__header">
        <h1 className="packer-settings__title">Settings</h1>
        <p className="packer-settings__subtitle">Manage your packer account settings</p>
      </div>

      <div className="packer-settings__body">
        <div className="ms-cards-row">
          <div className="ms-card">
            <div className="ms-card__header">
              <div className="ms-icon-wrap ms-icon--purple">
                <User size={20} />
              </div>
              <div>
                <h2 className="ms-card__title">Profile Information</h2>
                <p className="ms-card__subtitle">Update your display name and login username</p>
              </div>
            </div>

            <div className="ms-form">
              <div className="ms-input-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
              </div>

              <div className="ms-input-group">
                <label>Username</label>
                <div className="ms-input-icon-wrap">
                  <AtSign size={14} className="ms-input-icon" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="username"
                    className="ms-input--with-icon"
                  />
                </div>
                <span className="ms-input-hint">Changing this will affect your next login.</span>
              </div>

              <div className="ms-input-group">
                <label>Role</label>
                <input type="text" value="Packer" readOnly className="ms-input--readonly" />
              </div>

              <div className="ms-input-group">
                <label>Branch</label>
                <input type="text" value="Main Branch" readOnly className="ms-input--readonly" />
              </div>

              <button className="ms-btn ms-btn--save" onClick={handleSaveProfile}>
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>

          <div className="ms-card">
            <div className="ms-card__header">
              <div className="ms-icon-wrap ms-icon--blue">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="ms-card__title">Change Password</h2>
                <p className="ms-card__subtitle">Keep your account secure</p>
              </div>
            </div>

            <div className="ms-form">
              <div className="ms-input-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="ms-input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="ms-input-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button className="ms-btn ms-btn--save" onClick={handleChangePassword}>
                <Lock size={14} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="ms-card ms-card--full">
          <div className="ms-card__header">
            <h2 className="ms-card__title">System Information</h2>
          </div>

          <div className="ms-info-grid">
            <div className="ms-info-row">
              <span className="ms-info-label">Display Name</span>
              <span className="ms-info-value ms-info-value--mono">{displayName}</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Username</span>
              <span className="ms-info-value ms-info-value--mono">@{username}</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Role</span>
              <span className="ms-info-value ms-info-value--bold">Packer</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Access Level</span>
              <span className="ms-info-value">Level 1 - Production Staff</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">System Version</span>
              <span className="ms-info-value">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className="ms-toast">
          <div className="ms-toast__content">
            <div className={`ms-toast__icon-wrap ${toast.type === 'success' ? 'ms-toast--success' : 'ms-toast--error'}`}>
              <CheckCircle size={16} color="#fff" />
            </div>
            <div className="ms-toast__text">
              <p className="ms-toast__main">{toast.type === 'success' ? 'Saved' : 'Error'}</p>
              <p className="ms-toast__sub">{toast.msg}</p>
            </div>
            <button className="ms-toast__close" onClick={() => setToast((prev) => ({ ...prev, show: false }))}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
