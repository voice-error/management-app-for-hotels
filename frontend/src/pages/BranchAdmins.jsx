import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/SuperAdminDashboard.css';

const BranchAdmins = () => {
  const { token } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', branch: '', role: 'Branch Manager', status: 'active' });

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/business/staff', { credentials: 'include' }).then(r => r.json()),
      fetch('http://localhost:3000/api/business/branches', { credentials: 'include' }).then(r => r.json())
    ])
    .then(([adminData, branchData]) => {
      setAdmins(adminData);
      setBranches(branchData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.branch) return; // Note: newAdmin.branch is storing the branch ID from the select options
    
    try {
      const res = await fetch('http://localhost:3000/api/business/staff', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          branchId: newAdmin.branch,
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: newAdmin.role,
          status: newAdmin.status
        })
      });
      
      if (res.ok) {
        const created = await res.json();
        const branchObj = branches.find(b => b.id === newAdmin.branch);
        
        const admin = {
          id: created.id,
          name: created.name,
          email: created.email,
          branch: branchObj ? (branchObj.address || branchObj.name) : 'Unknown Branch',
          role: created.role,
          status: created.status
        };
        
        setAdmins([...admins, admin]);
        setShowModal(false);
        setNewAdmin({ name: '', email: '', branch: '', role: 'Branch Manager' });
      }
    } catch (error) {
      console.error('Failed to invite staff', error);
    }
  };

  if (loading) return <div className="dashboard"><p>Loading Branch Admins...</p></div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Branch Admins</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Add Branch Admin
        </button>
      </header>

      <section className="table-section">
        <div className="card">
          <div className="card-header">
            <h3>Assigned Managers</h3>
            <span className="label-mono text-muted">Only managers/admins are managed here. General staff are managed at the branch level.</span>
          </div>
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assigned Branch</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td className="fw-500">{admin.name}</td>
                    <td>{admin.email}</td>
                    <td className="fw-500">{admin.branch}</td>
                    <td><span className="badge badge-neutral">{admin.role}</span></td>
                    <td>
                      <span className={`badge badge-${admin.status === 'active' ? 'success' : 'neutral'}`}>
                        {admin.status.toUpperCase()}
                      </span>
                    </td>
                    <td><button className="btn-ghost text-danger">Revoke</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '450px', maxWidth: '90%' }}>
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <h3>Add Branch Admin</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Full Name *</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Email Address *</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Password *</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Assign to Branch *</label>
                <select value={newAdmin.branch} onChange={e => setNewAdmin({...newAdmin, branch: e.target.value})} required className="settings-select" style={{ width: '100%', padding: '8px' }}>
                  <option value="" disabled>Select a branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.address || b.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Admin Role *</label>
                <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})} required className="settings-select" style={{ width: '100%', padding: '8px' }}>
                  <option value="Branch Manager">Branch Manager</option>
                  <option value="Branch Admin">Branch Admin</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="label-mono">Status *</label>
                <select value={newAdmin.status} onChange={e => setNewAdmin({...newAdmin, status: e.target.value})} required className="settings-select" style={{ width: '100%', padding: '8px' }}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchAdmins;
