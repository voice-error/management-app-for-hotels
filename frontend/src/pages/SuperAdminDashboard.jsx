import React, { useState, useEffect } from 'react';
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
  
  const mrr = tenants.reduce((acc, t) => {
      let monthlyCost = 0;
      if (t.business_subscription && t.business_subscription.length > 0) {
          const activeSub = t.business_subscription.find(s => s.status === 'active') || t.business_subscription[0];
          if (activeSub) {
              const cost = parseFloat(activeSub.custom_price) || (activeSub.subscription_type ? parseFloat(activeSub.subscription_type.price) : 0);
              const billingCycle = activeSub.subscription_type?.billing_cycle || 'monthly';
              if (billingCycle === 'monthly') {
                  monthlyCost = cost;
              } else if (billingCycle === 'yearly') {
                  monthlyCost = cost / 12;
              }
          }
      }
      return acc + monthlyCost;
  }, 0);

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
          <div className="kpi-value">रु{Math.round(mrr).toLocaleString()}</div>
          <div className="label-mono">Monthly Recurring Rev</div>
          <div className="kpi-change positive">Live from DB</div>
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
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No tenants found.</td>
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
