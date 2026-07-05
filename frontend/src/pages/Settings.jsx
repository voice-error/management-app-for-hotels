import React, { useState, useEffect } from 'react';
import './Settings.css';
import { Plus, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BusinessTypesTable = () => {
  const [data, setData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '' });

  const fetchData = async () => {
    const res = await fetch('http://localhost:3000/api/admin/business-types', { credentials: 'include' });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveEdit = async () => {
    await fetch(`http://localhost:3000/api/admin/business-types/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm)
    });
    setEditingId(null);
    fetchData();
  };

  const handleAdd = async () => {
    if (!addForm.name) return;
    await fetch('http://localhost:3000/api/admin/business-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addForm)
    });
    setIsAdding(false);
    setAddForm({ name: '' });
    fetchData();
  };

  return (
    <div className="preset-card card">
      <div className="preset-header">
        <h3>Business Types</h3>
        <button className="btn-ghost" onClick={() => setIsAdding(true)}><Plus size={16}/> Add New</button>
      </div>
      <table className="dense-table">
        <thead>
          <tr><th>ID</th><th>Name</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {isAdding && (
            <tr>
              <td>-</td>
              <td><input type="text" className="preset-input" value={addForm.name} onChange={e => setAddForm({name: e.target.value})} placeholder="New Type Name"/></td>
              <td>
                <button className="btn-icon" onClick={handleAdd}><Check size={16}/></button>
                <button className="btn-icon text-danger" onClick={() => setIsAdding(false)}><X size={16}/></button>
              </td>
            </tr>
          )}
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>
                {editingId === item.id ? 
                  <input type="text" className="preset-input" value={editForm.name} onChange={e => setEditForm({name: e.target.value})} />
                : item.name}
              </td>
              <td>
                {editingId === item.id ? (
                  <>
                    <button className="btn-icon" onClick={handleSaveEdit}><Check size={16}/></button>
                    <button className="btn-icon text-danger" onClick={() => setEditingId(null)}><X size={16}/></button>
                  </>
                ) : (
                  <button className="btn-icon" onClick={() => { setEditingId(item.id); setEditForm({name: item.name}); }}><Edit2 size={16}/></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SubscriptionTypesTable = () => {
  const [data, setData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', billing_cycle: 'monthly' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', price: '', billing_cycle: 'monthly' });

  const fetchData = async () => {
    const res = await fetch('http://localhost:3000/api/admin/subscription-types', { credentials: 'include' });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveEdit = async () => {
    await fetch(`http://localhost:3000/api/admin/subscription-types/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm)
    });
    setEditingId(null);
    fetchData();
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) return;
    await fetch('http://localhost:3000/api/admin/subscription-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addForm)
    });
    setIsAdding(false);
    setAddForm({ name: '', price: '', billing_cycle: 'monthly' });
    fetchData();
  };

  return (
    <div className="preset-card card">
      <div className="preset-header">
        <h3>Subscription Types</h3>
        <button className="btn-ghost" onClick={() => setIsAdding(true)}><Plus size={16}/> Add New</button>
      </div>
      <table className="dense-table">
        <thead>
          <tr><th>Name</th><th>Price</th><th>Cycle</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {isAdding && (
            <tr>
              <td><input type="text" className="preset-input" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Name"/></td>
              <td><input type="number" className="preset-input" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} placeholder="Price"/></td>
              <td>
                <select className="preset-input" value={addForm.billing_cycle} onChange={e => setAddForm({...addForm, billing_cycle: e.target.value})}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </td>
              <td>
                <button className="btn-icon" onClick={handleAdd}><Check size={16}/></button>
                <button className="btn-icon text-danger" onClick={() => setIsAdding(false)}><X size={16}/></button>
              </td>
            </tr>
          )}
          {data.map(item => (
            <tr key={item.id}>
              <td>
                {editingId === item.id ? 
                  <input type="text" className="preset-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                : item.name}
              </td>
              <td>
                {editingId === item.id ? 
                  <input type="number" className="preset-input" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                : `रु${item.price}`}
              </td>
              <td>
                {editingId === item.id ? 
                  <select className="preset-input" value={editForm.billing_cycle} onChange={e => setEditForm({...editForm, billing_cycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                : item.billing_cycle}
              </td>
              <td>
                {editingId === item.id ? (
                  <>
                    <button className="btn-icon" onClick={handleSaveEdit}><Check size={16}/></button>
                    <button className="btn-icon text-danger" onClick={() => setEditingId(null)}><X size={16}/></button>
                  </>
                ) : (
                  <button className="btn-icon" onClick={() => { setEditingId(item.id); setEditForm({name: item.name, price: item.price, billing_cycle: item.billing_cycle}); }}><Edit2 size={16}/></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RetailersTable = () => {
  const [data, setData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', contact: '', email: '', commission_rate: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', address: '', contact: '', email: '', commission_rate: '' });

  const fetchData = async () => {
    const res = await fetch('http://localhost:3000/api/admin/retailers', { credentials: 'include' });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveEdit = async () => {
    await fetch(`http://localhost:3000/api/admin/retailers/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm)
    });
    setEditingId(null);
    fetchData();
  };

  const handleAdd = async () => {
    if (!addForm.name) return;
    await fetch('http://localhost:3000/api/admin/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addForm)
    });
    setIsAdding(false);
    setAddForm({ name: '', address: '', contact: '', email: '', commission_rate: '' });
    fetchData();
  };

  return (
    <div className="preset-card card">
      <div className="preset-header">
        <h3>Retailers / Resellers</h3>
        <button className="btn-ghost" onClick={() => setIsAdding(true)}><Plus size={16}/> Add New</button>
      </div>
      <div className="table-container" style={{overflowX: 'auto'}}>
        <table className="dense-table" style={{minWidth: '800px'}}>
          <thead>
            <tr><th>Name</th><th>Address</th><th>Contact</th><th>Email</th><th>Comm. Rate (%)</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr>
                <td><input type="text" className="preset-input" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Name"/></td>
                <td><input type="text" className="preset-input" value={addForm.address} onChange={e => setAddForm({...addForm, address: e.target.value})} placeholder="Address"/></td>
                <td><input type="text" className="preset-input" value={addForm.contact} onChange={e => setAddForm({...addForm, contact: e.target.value})} placeholder="Contact"/></td>
                <td><input type="email" className="preset-input" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="Email"/></td>
                <td><input type="number" step="0.1" className="preset-input" value={addForm.commission_rate} onChange={e => setAddForm({...addForm, commission_rate: e.target.value})} placeholder="e.g. 10.5"/></td>
                <td>
                  <button className="btn-icon" onClick={handleAdd}><Check size={16}/></button>
                  <button className="btn-icon text-danger" onClick={() => setIsAdding(false)}><X size={16}/></button>
                </td>
              </tr>
            )}
            {data.map(item => (
              <tr key={item.id}>
                <td>
                  {editingId === item.id ? 
                    <input type="text" className="preset-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  : item.name}
                </td>
                <td>
                  {editingId === item.id ? 
                    <input type="text" className="preset-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  : item.address || '-'}
                </td>
                <td>
                  {editingId === item.id ? 
                    <input type="text" className="preset-input" value={editForm.contact} onChange={e => setEditForm({...editForm, contact: e.target.value})} />
                  : item.contact || '-'}
                </td>
                <td>
                  {editingId === item.id ? 
                    <input type="email" className="preset-input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  : item.email || '-'}
                </td>
                <td>
                  {editingId === item.id ? 
                    <input type="number" step="0.1" className="preset-input" value={editForm.commission_rate} onChange={e => setEditForm({...editForm, commission_rate: e.target.value})} />
                  : `${item.commission_rate}%`}
                </td>
                <td>
                  {editingId === item.id ? (
                    <>
                      <button className="btn-icon" onClick={handleSaveEdit}><Check size={16}/></button>
                      <button className="btn-icon text-danger" onClick={() => setEditingId(null)}><X size={16}/></button>
                    </>
                  ) : (
                    <button className="btn-icon" onClick={() => { setEditingId(item.id); setEditForm({name: item.name, address: item.address || '', contact: item.contact || '', email: item.email || '', commission_rate: item.commission_rate || ''}); }}><Edit2 size={16}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const Settings = () => {
  const { user } = useAuth();
  // Default tab based on role
  const [activeTab, setActiveTab] = useState(user?.role === 'SUPER_ADMIN' ? 'general' : 'profile');

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>{user?.role === 'SUPER_ADMIN' ? 'Global Settings' : 'Business Settings'}</h2>
        <button className="btn-primary">Save Changes</button>
      </header>

      <div className="settings-tabs-container">
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
            <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
          </>
        )}
        {user?.role === 'BUSINESS_ADMIN' && (
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Business Profile</button>
        )}
        <button className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>API Integrations</button>
        {user?.role === 'SUPER_ADMIN' && (
          <button className={`tab-btn ${activeTab === 'presets' ? 'active' : ''}`} onClick={() => setActiveTab('presets')}>Preset Data</button>
        )}
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-grid">
            <section className="card settings-section">
              <h3>General</h3>
              <div className="form-group">
                <label className="label-mono">Platform Name</label>
                <input type="text" defaultValue="R&R Management" />
              </div>
              <div className="form-group">
                <label className="label-mono">Global Support Email</label>
                <input type="email" defaultValue="support@saas.com" />
              </div>
              <div className="form-group">
                <label className="label-mono">Default Timezone</label>
                <select className="settings-select">
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>EST (Eastern Standard Time)</option>
                  <option>PST (Pacific Standard Time)</option>
                </select>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="settings-grid">
            <section className="card settings-section">
              <h3>Maintenance</h3>
              <div className="form-group checkbox-group">
                <input type="checkbox" id="maintenance" />
                <label htmlFor="maintenance" className="fw-500 text-danger">Enable Maintenance Mode (Prevents Tenant Logins)</label>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="settings-grid">
            <section className="card settings-section">
              <h3>Business Profile</h3>
              <div className="form-group">
                <label className="label-mono">Business Name</label>
                <input type="text" defaultValue="First Hotel Group" />
              </div>
              <div className="form-group">
                <label className="label-mono">Global Tax Rate (%)</label>
                <input type="number" step="0.1" defaultValue="13.0" />
              </div>
              <div className="form-group">
                <label className="label-mono">Company Logo</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--color-surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    FH
                  </div>
                  <button className="btn-ghost">Upload Logo</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="settings-grid">
            <section className="card settings-section">
              <h3>{user?.role === 'SUPER_ADMIN' ? 'API Integrations' : 'Fonepay Integration'}</h3>
              
              {user?.role === 'SUPER_ADMIN' ? (
                <>
                  <div className="integration-block">
                    <h4>Email / SMTP (SendGrid)</h4>
                    <div className="form-group">
                      <label className="label-mono">API Key</label>
                      <input type="password" defaultValue="SG.xxxxxxxxxxxxxxxxxx" />
                    </div>
                  </div>

                  <div className="integration-block mt-4">
                    <h4>Billing Integration (Fonepay)</h4>
                    <div className="form-group">
                      <label className="label-mono">Merchant Code</label>
                      <input type="password" defaultValue="MERCHANT_XXXXX" />
                    </div>
                    <div className="form-group">
                      <label className="label-mono">Secret Key</label>
                      <input type="password" defaultValue="secret_xxxxxxxxxxxxxxxx" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="integration-block" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '24px', marginBottom: '8px', color: '#e51d2a' }}>fonepay</h4>
                    <p className="text-muted">Link your business account with Fonepay to enable seamless digital payments.</p>
                  </div>
                  
                  <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                    <div className="form-group">
                      <label className="label-mono">Fonepay Merchant ID</label>
                      <input type="text" placeholder="Enter your Merchant ID" />
                    </div>
                    <div className="form-group">
                      <label className="label-mono">Terminal ID (Optional)</label>
                      <input type="text" placeholder="Enter Terminal ID" />
                    </div>
                    <div className="form-group">
                      <label className="label-mono">Password / Secret Key</label>
                      <input type="password" placeholder="••••••••" />
                    </div>
                    <button className="btn-primary" style={{ width: '100%', background: '#e51d2a', color: 'white', border: 'none' }}>
                      Connect Fonepay Account
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'presets' && (
          <div className="presets-container">
            {user?.role === 'SUPER_ADMIN' ? (
              <>
                <BusinessTypesTable />
                <SubscriptionTypesTable />
                <RetailersTable />
              </>
            ) : (
              <div className="card" style={{ padding: '24px' }}>
                <h3>Business Presets</h3>
                <p className="text-muted" style={{ marginBottom: '24px' }}>Manage your business-specific key data (e.g., Room Types, Menu Categories, Tax Rates) here.</p>
                <div style={{ padding: '40px', border: '1px dashed var(--color-outline)', borderRadius: '8px', textAlign: 'center', backgroundColor: 'var(--color-surface-container)' }}>
                  <span className="label-mono" style={{ color: 'var(--color-on-surface-variant)' }}>Configuration Tables Coming Soon</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
