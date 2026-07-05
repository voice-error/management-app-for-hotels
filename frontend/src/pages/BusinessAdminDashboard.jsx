import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../pages/SuperAdminDashboard.css';

const BusinessAdminDashboard = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState({
    totalBranches: 0,
    totalRooms: 0,
    totalReservations: 0,
    totalOrders: 0
  });
  const [branches, setBranches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/business/dashboard', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setBranches(data.branches);
          
          // Fetch real leaderboard from financials
          const finRes = await fetch('http://localhost:3000/api/business/financials', {
            credentials: 'include'
          });
          if (finRes.ok) {
            const finData = await finRes.json();
            setLeaderboard(finData.map((d, i) => ({
              id: i,
              name: d.branch,
              revenue: d.total,
              target: 10000 // dummy target for UI purposes
            })));
          }
        } else {
          setError('Failed to fetch business metrics');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="dashboard"><p>Loading Business Overview...</p></div>;
  }

  if (error) {
    return <div className="dashboard"><p className="badge badge-danger">{error}</p></div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Business Overview</h2>
        <span className="label-mono text-muted">Last updated: Just now</span>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-value">{metrics.totalBranches}</div>
          <div className="label-mono">Active Branches</div>
          <div className="kpi-change positive">Live from DB</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{metrics.totalRooms}</div>
          <div className="label-mono">Total Rooms</div>
          <div className="kpi-change positive">Across All Branches</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{metrics.totalReservations}</div>
          <div className="label-mono">Total Reservations</div>
          <div className="kpi-change neutral">Pending/Confirmed</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">{metrics.totalOrders}</div>
          <div className="label-mono">POS Orders</div>
          <div className="kpi-change neutral">Total historical</div>
        </div>
      </section>

      <section className="table-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Branch Leaderboard</h3>
            <span className="label-mono text-muted">Revenue vs Target</span>
          </div>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaderboard.map(branch => {
              const maxVal = Math.max(...leaderboard.map(b => Math.max(b.revenue, b.target)));
              const revPercent = (branch.revenue / maxVal) * 100;
              const targetPercent = (branch.target / maxVal) * 100;
              return (
                <div key={branch.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span className="fw-500">{branch.name}</span>
                    <span className="label-mono">रु{branch.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--color-surface-container-highest)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: `${targetPercent}%`, top: 0, bottom: 0, width: '2px', background: 'var(--color-outline)', zIndex: 1 }} title={`Target: रु${branch.target.toLocaleString()}`}></div>
                    <div style={{ width: `${revPercent}%`, height: '100%', background: branch.revenue >= branch.target ? 'var(--color-success, #10b981)' : 'var(--color-primary)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Branch Performance Overview</h3>
          </div>
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Branch ID</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Rooms</th>
                  <th>Orders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="label-mono">{branch.id.substring(0, 8)}...</td>
                    <td className="fw-500">{branch.address || 'N/A'}</td>
                    <td>{branch.contact || 'N/A'}</td>
                    <td>{branch._count?.rooms || 0}</td>
                    <td>{branch._count?.orders || 0}</td>
                    <td>
                      <span className={`badge badge-${branch.status === 'active' ? 'success' : 'neutral'}`}>
                        {branch.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))}
                {branches.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No branches found.</td>
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

export default BusinessAdminDashboard;
