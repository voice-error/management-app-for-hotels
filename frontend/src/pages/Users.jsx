import React, { useState, useEffect } from 'react';
import KebabMenu from '../components/KebabMenu';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const [resetUserId, setResetUserId] = useState(null);
  const [resetPasswords, setResetPasswords] = useState({ newPassword: '', repeatPassword: '' });
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
          credentials: 'include'
        });
        
        const rolesRes = await fetch('http://localhost:3000/api/admin/roles', { credentials: 'include' });
        
        if (response.ok && rolesRes.ok) {
          const data = await response.json();
          const rolesData = await rolesRes.json();
          setUsers(data);
          setRoles(rolesData);
          if (rolesData.length > 0) {
            setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
          }
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (response.ok) {
        const newUser = await response.json();
        setUsers([newUser, ...users]);
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', role_id: roles.length > 0 ? roles[0].id : '' });
      } else {
        alert('Failed to add user');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (u) => {
    if (u.id === user?.userId) return alert('Cannot perform action on yourself');
    if (!window.confirm(`Are you sure you want to toggle access for ${u.name}?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${u.id}/revoke`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(existing => existing.id === u.id ? updatedUser : existing));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to toggle access');
      }
    } catch (e) {
      alert('Network error');
    }
  };

  const handleOpenReset = (u) => {
    setResetUserId(u.id);
    setResetPasswords({ newPassword: '', repeatPassword: '' });
  };

  const submitPasswordReset = async (uId) => {
    if (!resetPasswords.newPassword) return alert('Password cannot be empty');
    if (resetPasswords.newPassword !== resetPasswords.repeatPassword) {
      return alert('Passwords do not match!');
    }
    setResetting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/admin/users/${uId}/reset-password`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPasswords.newPassword }),
        credentials: 'include' 
      });
      if (res.ok) {
        alert('Password reset successfully');
        setResetUserId(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to reset password');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setResetting(false);
    }
  };

  const getUserActions = (u) => {
    const actions = [];
    if (u.id !== user?.userId) {
      actions.push({ label: 'Toggle Access', onClick: handleRevoke, danger: true });
    }
    actions.push({ label: 'Reset Password', onClick: handleOpenReset });
    return actions;
  };

  if (loading) return <div className="dashboard"><p>Loading system admins...</p></div>;
  if (error) return <div className="dashboard"><p className="badge badge-danger">{error}</p></div>;

  return (
    <div className="dashboard" style={{ position: 'relative' }}>
      <header className="dashboard-header">
        <h2>Internal System Admins</h2>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add User</button>
      </header>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'var(--color-surface-container-lowest)' }}>
            <h3 style={{ marginBottom: '16px' }}>Add Super Admin</h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="label-mono">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Role</label>
                <select className="settings-select" value={formData.role_id} onChange={e => setFormData({ ...formData, role_id: e.target.value })} required>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="table-section">
        <div className="card">
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <React.Fragment key={u.id}>
                    <tr>
                      <td className="fw-500">
                        {u.name} 
                        {u.id === user?.userId && <span className="badge" style={{marginLeft:'8px', background:'var(--color-primary)', color:'white'}}>YOU</span>}
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td><span className="label-mono">{u.super_admin_roles?.name || 'Admin'}</span></td>
                      <td>
                        <span className={`badge badge-${u.status === 'active' ? 'success' : 'danger'}`}>
                          {u.status ? u.status.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <KebabMenu actions={getUserActions(u)} tenant={u} />
                      </td>
                    </tr>
                    {resetUserId === u.id && (
                      <tr style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                        <td colSpan="6">
                          <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                              <label className="label-mono">New Password</label>
                              <input type="password" value={resetPasswords.newPassword} onChange={e => setResetPasswords({...resetPasswords, newPassword: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                              <label className="label-mono">Repeat Password</label>
                              <input type="password" value={resetPasswords.repeatPassword} onChange={e => setResetPasswords({...resetPasswords, repeatPassword: e.target.value})} />
                            </div>
                            <button className="btn-primary" onClick={() => submitPasswordReset(u.id)} disabled={resetting}>
                              {resetting ? 'Saving...' : 'Update Password'}
                            </button>
                            <button className="btn-ghost" onClick={() => setResetUserId(null)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Users;
