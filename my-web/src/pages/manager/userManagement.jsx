// =============================================================
// userManagement.jsx
// FILE: pages/manager/userManagement.jsx
// -------------------------------------------------------------
// PURPOSE: Manager view for managing Seller and Packer accounts.
//          Supports add, edit, and remove operations.
// =============================================================

import { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";
import "../../styles/manager/userManagement.css";

const EMPTY_FORM = { name: "", email: "", role: "Seller", password: "" };

const ROLE_OPTIONS = ["All", "Seller", "Packer"];

export default function UserManagement() {

  // -----------------------------------------------------------
  // STATE
  // TODO: Backend - Replace empty array with fetched user accounts
  // Endpoint: GET /api/users?roles=seller,packer
  // Expected shape per user:
  // {
  //   id:     number | string  — unique identifier
  //   name:   string
  //   email:  string
  //   role:   'Seller' | 'Packer'
  //   status: 'Active' | 'Inactive'
  // }
  // -----------------------------------------------------------
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [modal,        setModal]        = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [filterRole,   setFilterRole]   = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);


  // -----------------------------------------------------------
  // EFFECTS
  // -----------------------------------------------------------
  useEffect(() => {
    // TODO: Backend - Fetch users on mount
    // Example:
    // const fetchUsers = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await fetch('/api/users?roles=seller,packer');
    //     const data = await response.json();
    //     setUsers(data.users);
    //   } catch (err) {
    //     setError('Failed to load users.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchUsers();
    setLoading(false);

    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  // -----------------------------------------------------------
  // MODAL HANDLERS
  // -----------------------------------------------------------
  const openAdd    = () => { setForm(EMPTY_FORM); setModal("add"); };
  const openEdit   = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, password: "" });
    setSelectedUser(u);
    setModal("edit");
  };
  const openDelete = (u) => { setSelectedUser(u); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelectedUser(null); setForm(EMPTY_FORM); };


  // -----------------------------------------------------------
  // CRUD OPERATIONS
  // TODO: Backend - Connect each handler to the appropriate API endpoint
  // -----------------------------------------------------------

  const handleAdd = () => {
    if (!form.name || !form.email || !form.password) return;

    // TODO: Backend - Create user via API
    // Endpoint: POST /api/users { name, email, role, password }
    // On success: refetch users or append response to state
    setUsers(p => [...p, { id: Date.now(), ...form, status: "Active" }]);
    closeModal();
  };

  const handleEdit = () => {
    if (!form.name || !form.email || !form.password) return;

    // TODO: Backend - Update user via API
    // Endpoint: PUT /api/users/:id { name, email, role, password }
    // On success: refetch users or update matching record in state
    setUsers(p => p.map(u => u.id === selectedUser.id ? { ...u, ...form } : u));
    closeModal();
  };

  const handleDelete = () => {
    // TODO: Backend - Delete user via API
    // Endpoint: DELETE /api/users/:id
    // On success: remove from state
    setUsers(p => p.filter(u => u.id !== selectedUser.id));
    closeModal();
  };

  const filtered = users.filter(u => filterRole === "All" || u.role === filterRole);


  // -----------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------
  if (loading) return <div className="um-page-container"><p>Loading users...</p></div>;
  if (error)   return <div className="um-page-container"><p>{error}</p></div>;

  return (
    <div className="um-page-container">

      {/* ── Page Header ── */}
      <div className="um-header">
        <div>
          <h1 className="um-title">User Management</h1>
          <p className="um-subtitle">Add, edit, or remove Seller and Packer accounts.</p>
        </div>
        <button className="um-add-btn" onClick={openAdd}>+ Add User</button>
      </div>

      {/* ── Table Container ── */}
      <div className="um-table-container">

        <div className="um-table-toolbar">
          <div className="um-toolbar-left">
            <span className="um-table-section-title">User Accounts</span>
            <span className="um-table-count-pill">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
              {filterRole !== "All" && " · filtered"}
            </span>
          </div>

          <div className="um-filter-dropdown-wrapper" ref={dropdownRef}>
            <button
              className={`um-filter-btn ${dropdownOpen ? "open" : ""}`}
              onClick={() => setDropdownOpen(prev => !prev)}
              title="Filter by role"
            >
              <Filter size={14} />
              <span>{filterRole === "All" ? "Filter" : filterRole}</span>
            </button>
            {dropdownOpen && (
              <div className="um-filter-dropdown">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`um-dropdown-item ${filterRole === opt ? "selected" : ""}`}
                    onClick={() => { setFilterRole(opt); setDropdownOpen(false); }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="um-table-scroll-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="um-no-data">No users found for this filter.</td>
                </tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td className="um-name-cell">{u.name}</td>
                  <td className="um-email-cell">{u.email}</td>
                  <td>
                    <span className={`um-role-badge um-role-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`um-status-pill ${u.status === "Active" ? "active" : "inactive"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div className="um-action-btns">
                      <button className="um-edit-btn"   onClick={() => openEdit(u)}>Edit</button>
                      <button className="um-delete-btn" onClick={() => openDelete(u)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ ADD MODAL ══ */}
      {modal === "add" && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal">
            <div className="um-modal-header">
              <div>
                <h2 className="um-modal-title">Add New User</h2>
                <p className="um-modal-subtitle">Create a new Seller or Packer account.</p>
              </div>
              <button className="um-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-grid">
                <div className="um-form-field">
                  <label className="um-form-label">Full Name <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Maria Santos"
                    autoComplete="off"
                  />
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">Email Address <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@ladouceur.ph"
                    autoComplete="off"
                  />
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">Role <span className="um-required">*</span></label>
                  <select className="um-form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="Seller">Seller</option>
                    <option value="Packer">Packer</option>
                  </select>
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">Password <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Set a password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="um-modal-actions">
                <button className="um-btn-cancel" onClick={closeModal}>Cancel</button>
                <button
                  className="um-btn-save"
                  onClick={handleAdd}
                  disabled={!form.name || !form.email || !form.password}
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ══ */}
      {modal === "edit" && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal">
            <div className="um-modal-header">
              <div>
                <h2 className="um-modal-title">Edit User</h2>
                <p className="um-modal-subtitle">Updating account for <strong>{selectedUser?.name}</strong>.</p>
              </div>
              <button className="um-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-form-grid">
                <div className="um-form-field">
                  <label className="um-form-label">Full Name <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">Email Address <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    autoComplete="off"
                  />
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">Role <span className="um-required">*</span></label>
                  <select className="um-form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="Seller">Seller</option>
                    <option value="Packer">Packer</option>
                  </select>
                </div>
                <div className="um-form-field">
                  <label className="um-form-label">New Password <span className="um-required">*</span></label>
                  <input
                    className="um-form-input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="um-modal-actions">
                <button className="um-btn-cancel" onClick={closeModal}>Cancel</button>
                <button
                  className="um-btn-save"
                  onClick={handleEdit}
                  disabled={!form.name || !form.email || !form.password}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE MODAL ══ */}
      {modal === "delete" && (
        <div className="um-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="um-modal um-modal-sm">
            <div className="um-modal-header">
              <h2 className="um-modal-title">Remove User</h2>
              <button className="um-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>
            </div>
            <div className="um-modal-body">
              <div className="um-delete-warning">
                You are about to remove <strong>{selectedUser?.name}</strong>. This action cannot be undone.
              </div>
              <div className="um-modal-actions">
                <button className="um-btn-cancel" onClick={closeModal}>Cancel</button>
                <button className="um-btn-danger" onClick={handleDelete}>Yes, Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}