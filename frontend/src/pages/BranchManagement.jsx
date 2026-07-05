import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/SuperAdminDashboard.css';

const BranchManagement = () => {
  const { token } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', contact: '' });

  useEffect(() => {
    fetch('http://localhost:3000/api/business/branches', {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      setBranches(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newBranch.name) return;
    
    try {
      const res = await fetch('http://localhost:3000/api/business/branches', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBranch.name,
          address: newBranch.address,
          contact: newBranch.contact
        })
      });
      
      if (res.ok) {
        const created = await res.json();
        const branch = {
          id: created.id,
          name: created.name || created.address,
          address: created.address,
          contact: created.contact,
          status: created.status,
          manager: 'Pending'
        };
        setBranches([...branches, branch]);
        setShowModal(false);
        setNewBranch({ name: '', address: '', contact: '' });
      }
    } catch (error) {
      console.error('Failed to create branch', error);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editBranch || !editBranch.name) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/business/branches/${editBranch.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editBranch.name,
          address: editBranch.address,
          contact: editBranch.contact,
          status: editBranch.status
        })
      });
      
      if (res.ok) {
        const updated = await res.json();
        setBranches(branches.map(b => b.id === updated.id ? { ...b, name: updated.name || updated.address, address: updated.address, contact: updated.contact, status: updated.status } : b));
        setShowEditModal(false);
        setEditBranch(null);
      } else {
        console.error('Failed to update branch', await res.text());
      }
    } catch (error) {
      console.error('Failed to update branch', error);
    }
  };

  if (loading) return <div className="dashboard"><p>Loading branches...</p></div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Branch Management</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Create New Branch
        </button>
      </header>

      <section className="table-section">
        <div className="card">
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Branch Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td className="fw-500">{b.name}</td>
                    <td>{b.address || '-'}</td>
                    <td>{b.contact || '-'}</td>
                    <td>{b.manager}</td>
                    <td>
                      <span className={`badge badge-${b.status === 'active' ? 'success' : 'neutral'}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost" onClick={() => { setEditBranch({...b}); setShowEditModal(true); }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <h3>Create New Branch</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Branch Name *</label>
                <input type="text" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Address</label>
                <input type="text" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="label-mono">Contact Info</label>
                <input type="text" value={newBranch.contact} onChange={e => setNewBranch({...newBranch, contact: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editBranch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <h3>Edit Branch</h3>
              <button className="btn-icon" onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Branch Name *</label>
                <input type="text" value={editBranch.name || ''} onChange={e => setEditBranch({...editBranch, name: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Address</label>
                <input type="text" value={editBranch.address || ''} onChange={e => setEditBranch({...editBranch, address: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label-mono">Contact Info</label>
                <input type="text" value={editBranch.contact || ''} onChange={e => setEditBranch({...editBranch, contact: e.target.value})} style={{ width: '100%', padding: '8px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="label-mono">Status</label>
                <select value={editBranch.status || 'active'} onChange={e => setEditBranch({...editBranch, status: e.target.value})} className="settings-select" style={{ width: '100%', padding: '8px' }}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
