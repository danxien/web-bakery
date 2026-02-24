// =============================================================
// ManagerSettings.jsx
// FILE: pages/manager/ManagerSettings.jsx
// -------------------------------------------------------------
// Props:
//   managerName  {string}    — current display name, owned by landing-page.jsx
//   onSaveName   {function}  — callback(newName) → updates landing-page state
//                              → flows to SidebarMenu automatically
//
// State flow (no Context needed):
//   LoginSection ──onLogin(role, username)──▶ landing-page.jsx
//     managerName state ──▶ SidebarMenu  (shows in sidebar)
//     managerName state ──▶ ManagerSettings (pre-fills fields)
//     onSaveName(name)  ◀── ManagerSettings (on Save Changes click)
//
// 🔹 BACKEND: Replace onSaveName with PUT /api/manager/profile
// 🔹 BACKEND: Replace managerName prop with GET /api/manager/profile on mount
// =============================================================

import React, { useState, useEffect } from 'react';
import { User, Save, Lock, CheckCircle, X, AtSign } from 'lucide-react';
import '../../styles/manager/managerSettings.css';

const ManagerSettings = ({
  managerName = 'Manager',  // 🔹 BACKEND: seed from GET /api/manager/profile
  onSaveName  = () => {},   // 🔹 BACKEND: replace with PUT /api/manager/profile
}) => {

  // ── Local form state ────────────────────────────────────────
  const [displayName, setDisplayName] = useState(managerName);
  const [username,    setUsername]    = useState(managerName.toLowerCase().replace(/\s+/g, ''));
  const [currentPw,   setCurrentPw]  = useState('');
  const [newPw,       setNewPw]      = useState('');
  const [confirmPw,   setConfirmPw]  = useState('');

  // Sync if managerName prop changes (e.g. parent re-renders after API load)
  useEffect(() => {
    setDisplayName(managerName);
    setUsername(managerName.toLowerCase().replace(/\s+/g, ''));
  }, [managerName]);

  // ── Toast state ─────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, type: 'success', msg: '' });

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // ── Save profile ─────────────────────────────────────────────
  // Calls onSaveName → landing-page updates managerName state
  // → SidebarMenu receives new prop and re-renders with new name
  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      showToast('error', 'Name cannot be empty.');
      return;
    }
    // 🔹 BACKEND: await axios.put('/api/manager/profile', { displayName, username });
    onSaveName(displayName.trim());
    showToast('success', 'Profile updated. Sidebar name has been refreshed.');
  };

  // ── Change password ──────────────────────────────────────────
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
    // 🔹 BACKEND: await axios.put('/api/manager/password', { currentPw, newPw });
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    showToast('success', 'Password changed successfully.');
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="manager-settings__page">

      {/* ── Fixed Header (identical padding to .inventory__header) ── */}
      <div className="manager-settings__header">
        <h1 className="manager-settings__title">Settings</h1>
        <p className="manager-settings__subtitle">Manage your account settings</p>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────── */}
      <div className="manager-settings__body">

        {/* Row 1: Profile + Password side by side, full width */}
        <div className="ms-cards-row">

          {/* ── Card: Profile Information ───────────────────── */}
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
              {/* Display Name — shown in sidebar after save */}
              <div className="ms-input-group">
                <label>Display Name</label>
                {/* 🔹 BACKEND: seed with profile.displayName */}
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                />
              </div>

              {/* Username — editable, affects next login */}
              <div className="ms-input-group">
                <label>Username</label>
                {/* 🔹 BACKEND: seed with profile.username; save to PUT /api/manager/profile */}
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

              {/* Read-only fields */}
              <div className="ms-input-group">
                <label>Role</label>
                {/* 🔹 BACKEND: replace with profile.role */}
                <input type="text" value="Manager" readOnly className="ms-input--readonly" />
              </div>

              <div className="ms-input-group">
                <label>Branch</label>
                {/* 🔹 BACKEND: replace with profile.branch */}
                <input type="text" value="Main Branch" readOnly className="ms-input--readonly" />
              </div>

              <button className="ms-btn ms-btn--save" onClick={handleSaveProfile}>
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </div>

          {/* ── Card: Change Password ───────────────────────── */}
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
                {/* 🔹 BACKEND: validated server-side against hashed password */}
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

        </div>{/* end .ms-cards-row */}

        {/* ── Card: System Information (full width) ──────────── */}
        <div className="ms-card ms-card--full">
          <div className="ms-card__header">
            <h2 className="ms-card__title">System Information</h2>
          </div>

          <div className="ms-info-grid">
            <div className="ms-info-row">
              <span className="ms-info-label">Display Name</span>
              {/* Live — reflects edits before save */}
              <span className="ms-info-value ms-info-value--mono">{displayName}</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Username</span>
              {/* 🔹 BACKEND: replace with profile.username */}
              <span className="ms-info-value ms-info-value--mono">@{username}</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Role</span>
              <span className="ms-info-value ms-info-value--bold">Manager</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">Access Level</span>
              <span className="ms-info-value">Level 2 — Branch Manager</span>
            </div>
            <div className="ms-info-row">
              <span className="ms-info-label">System Version</span>
              <span className="ms-info-value">1.0.0</span>
            </div>
          </div>
        </div>

      </div>{/* end .manager-settings__body */}

      {/* ── Toast Notification ──────────────────────────────────── */}
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
            <button className="ms-toast__close" onClick={() => setToast(t => ({ ...t, show: false }))}>
              <X size={12} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerSettings;