import React, { useState, useEffect } from 'react';
import KebabMenu from '../components/KebabMenu';
import { X } from 'lucide-react';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    name: '', owner_name: '', email: '', contact1: '', contact2: '', address: '', business_type_id: '', password: ''
  });
  const [subFormData, setSubFormData] = useState({ subscription_type_id: '' });
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    email: '',
    contact1: '',
    contact2: '',
    address: '',
    business_type_id: '',
    retailer_id: '',
    password: '',
    subscription_type_id: ''
  });

  const fetchTenants = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/tenants', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data);
      } else {
        setError('Failed to fetch tenants');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionTypes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/subscription-types', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionTypes(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription types', err);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchSubscriptionTypes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          owner_name: '',
          email: '',
          contact1: '',
          contact2: '',
          address: '',
          business_type_id: '',
          retailer_id: '',
          password: '',
          subscription_type_id: ''
        });
        fetchTenants();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create tenant');
      }
    } catch (err) {
      alert('Network error while creating tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTenant = (t) => {
    setSelectedTenant(t);
    setEditFormData({
      name: t.name || '',
      owner_name: t.owner_name || '',
      email: t.email || '',
      contact1: t.contact1 || '',
      contact2: t.contact2 || '',
      address: t.address || '',
      business_type_id: t.business_type_id || '',
      password: ''
    });
    setEditModalOpen(true);
  };

  const handleManageSub = (t) => {
    setSelectedTenant(t);
    setSubFormData({ subscription_type_id: '' });
    setSubModalOpen(true);
  };

  const handleToggleStatus = async (t) => {
    if (!window.confirm(`Are you sure you want to ${t.status === 'active' ? 'suspend' : 'activate'} this tenant?`)) return;
    try {
      const response = await fetch(`http://localhost:3000/api/admin/tenants/${t.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: t.status === 'active' ? 'suspended' : 'active' })
      });
      if (response.ok) fetchTenants();
      else alert('Failed to update status');
    } catch (e) {
      alert('Network error');
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFormData)
      });
      if (response.ok) {
        setEditModalOpen(false);
        fetchTenants();
      } else {
        alert('Failed to update tenant');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSub = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/tenants/${selectedTenant.id}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(subFormData)
      });
      if (response.ok) {
        setSubModalOpen(false);
        fetchTenants();
      } else {
        alert('Failed to update subscription');
      }
    } catch (e) {
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tenantActions = [
    { label: 'View / Edit Tenant', onClick: handleEditTenant },
    { label: 'Manage Subscription', onClick: handleManageSub },
    { label: 'Suspend / Activate', onClick: handleToggleStatus, danger: true }
  ];
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Tenants Directory</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-ghost">Export CSV</button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>Add New Tenant</button>
        </div>
      </header>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Tenant</h3>
              <button className="btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="label-mono">Business Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Owner Name</label>
                <input type="text" name="owner_name" value={formData.owner_name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Admin Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Business Type</label>
                <select name="business_type_id" value={formData.business_type_id} onChange={handleInputChange} className="settings-select" style={{ width: '100%', padding: '10px', marginTop: '4px' }}>
                  <option value="">-- Select Business Type --</option>
                  <option value="1">Resort</option>
                  <option value="2">Restaurant</option>
                  <option value="3">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label-mono">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Contact Phone</label>
                <input type="text" name="contact1" value={formData.contact1} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Contact Phone 2 (Optional)</label>
                <input type="text" name="contact2" value={formData.contact2} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Retailer ID (Optional)</label>
                <input type="text" name="retailer_id" value={formData.retailer_id} onChange={handleInputChange} placeholder="e.g. UUID of retailer" />
              </div>
              <div className="form-group">
                <label className="label-mono">Initial Admin Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Subscription Type (starts in 21 days)</label>
                <select name="subscription_type_id" value={formData.subscription_type_id} onChange={handleInputChange} className="settings-select" style={{ width: '100%', padding: '10px', marginTop: '4px' }}>
                  <option value="">-- No Subscription --</option>
                  {subscriptionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - रु{type.price}/{type.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Tenant</h3>
              <button className="btn-ghost" onClick={() => setEditModalOpen(false)} style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitEdit} className="login-form">
              <div className="form-group">
                <label className="label-mono">Business Name</label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Owner Name</label>
                <input type="text" name="owner_name" value={editFormData.owner_name} onChange={handleEditInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Admin Email</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleEditInputChange} required />
              </div>
              <div className="form-group">
                <label className="label-mono">Contact Phone 1</label>
                <input type="text" name="contact1" value={editFormData.contact1} onChange={handleEditInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Contact Phone 2</label>
                <input type="text" name="contact2" value={editFormData.contact2} onChange={handleEditInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Address</label>
                <input type="text" name="address" value={editFormData.address} onChange={handleEditInputChange} />
              </div>
              <div className="form-group">
                <label className="label-mono">Business Type</label>
                <select name="business_type_id" value={editFormData.business_type_id} onChange={handleEditInputChange} className="settings-select" style={{ width: '100%', padding: '10px', marginTop: '4px' }}>
                  <option value="">-- Select Business Type --</option>
                  <option value="1">Resort</option>
                  <option value="2">Restaurant</option>
                  <option value="3">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label-mono">Admin Password (Leave blank to keep current)</label>
                <input type="password" name="password" value={editFormData.password} onChange={handleEditInputChange} placeholder="New password" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {subModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Manage Subscription</h3>
              <button className="btn-ghost" onClick={() => setSubModalOpen(false)} style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitSub} className="login-form">
              <div className="form-group">
                <label className="label-mono">New Subscription Type</label>
                <select 
                  name="subscription_type_id" 
                  value={subFormData.subscription_type_id} 
                  onChange={(e) => setSubFormData({ subscription_type_id: e.target.value })} 
                  className="settings-select" 
                  style={{ width: '100%', padding: '10px', marginTop: '4px' }}
                  required
                >
                  <option value="">-- Select Subscription --</option>
                  {subscriptionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} - रु{type.price}/{type.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setSubModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Subscription'}
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
                  <th>Tenant ID</th>
                  <th>Business Details</th>
                  <th>Technical</th>
                  <th>Financials</th>
                  <th>Lifecycle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  let arr = 0;
                  let planName = 'No Plan';
                  if (t.business_subscription && t.business_subscription.length > 0) {
                      const activeSub = t.business_subscription.find(s => s.status === 'active') || t.business_subscription[0];
                      if (activeSub) {
                          const monthlyCost = parseFloat(activeSub.custom_price) || (activeSub.subscription_type ? parseFloat(activeSub.subscription_type.price) : 0);
                          const billingCycle = activeSub.subscription_type?.billing_cycle || 'monthly';
                          if (billingCycle === 'monthly') {
                              arr = monthlyCost * 12;
                          } else if (billingCycle === 'yearly') {
                              arr = monthlyCost;
                          }
                          planName = activeSub.subscription_type?.name || 'Custom Plan';
                      }
                  }
                  return (
                    <tr key={t.id}>
                      <td className="label-mono">{t.id.substring(0,8)}...</td>
                      <td>
                        <div className="fw-500">{t.name}</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{t.email || t.contact1 || 'N/A'}</div>
                      </td>
                      <td>
                        <div>{t.domain || 'N/A'}</div>
                        <div className="text-muted label-mono">{t.timezone || 'UTC'}</div>
                      </td>
                      <td>
                        <div className="fw-500">ARR: रु{arr.toLocaleString()}</div>
                        <div className="text-muted label-mono" style={{ fontSize: '12px' }}>{planName}</div>
                      </td>
                      <td>
                        <div>{new Date(t.created_at).toLocaleDateString()}</div>
                        <span className={`badge badge-${t.status === 'active' ? 'success' : 'danger'}`}>
                          {t.status ? t.status.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        <KebabMenu actions={tenantActions} tenant={t} />
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No tenants found.</td>
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

export default Tenants;
