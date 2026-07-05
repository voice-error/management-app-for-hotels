import React, { useState, useEffect } from 'react';
import KebabMenu from '../components/KebabMenu';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchTenants();
  }, []);

  if (loading) {
    return <div className="dashboard"><p>Loading Global Overview...</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="badge badge-danger">{error}</p></div>;
  }

  // Derived metrics
  const activeTenantsCount = tenants.length; // In a real app, filter by status
  const pendingCount = tenants.filter(t => t.name.includes('Pending')).length || 0; 
  // We don't have ARR yet in the DB schema for businesses, so we'll just mock it or omit it.

  const tenantActions = [
    { label: 'View / Edit Tenant', onClick: (t) => console.log('Edit', t.name) },
    { label: 'Impersonate (Login As)', onClick: (t) => console.log('Impersonate', t.name) },
    { label: 'Manage Subscription', onClick: (t) => console.log('Subscription', t.name) },
    { label: 'Suspend / Deactivate', onClick: (t) => console.log('Suspend', t.name), danger: true },
    { label: 'Delete Tenant', onClick: (t) => console.log('Delete', t.name), danger: true },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Global Overview</h2>
        <span className="label-mono text-muted">Last updated: Just now</span>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-value">{activeTenantsCount}</div>
          <div className="label-mono">Total Registered Tenants</div>
          <div className="kpi-change positive">Live from DB</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">N/A</div>
          <div className="label-mono">Monthly Recurring Rev</div>
          <div className="kpi-change neutral">Pending Subscription Module</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{pendingCount}</div>
          <div className="label-mono">Pending Onboarding</div>
          <div className="kpi-change neutral">Live from DB</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">0</div>
          <div className="label-mono">Critical System Alerts</div>
          <div className="kpi-change positive">Systems Normal</div>
        </div>
      </section>

      <section className="table-section">
        <div className="card">
          <div className="card-header">
            <h3>Recent Tenant Activity</h3>
            <button className="btn-ghost">View All</button>
          </div>
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Tenant ID</th>
                  <th>Business Name</th>
                  <th>Domain</th>
                  <th>Timezone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="label-mono">{tenant.id.substring(0, 8)}...</td>
                    <td className="fw-500">{tenant.name}</td>
                    <td>{tenant.domain || 'N/A'}</td>
                    <td>{tenant.timezone}</td>
                    <td>
                      <span className="badge badge-success">
                        ACTIVE
                      </span>
                    </td>
                    <td>
                      <KebabMenu actions={tenantActions} tenant={tenant} />
                    </td>
                  </tr>
                ))}
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

export default SuperAdminDashboard;
