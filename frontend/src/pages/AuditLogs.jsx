import React, { useState, useEffect } from 'react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/admin/logs', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          setError('Failed to fetch audit logs');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="dashboard"><p>Loading audit logs...</p></div>;
  if (error) return <div className="dashboard"><p className="badge badge-danger">{error}</p></div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>System Audit Logs</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="date" className="btn-ghost" style={{ padding: '6px' }} />
          <button className="btn-ghost">Filter by Event</button>
        </div>
      </header>

      <section className="table-section">
        <div className="card">
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action / Event</th>
                  <th>Target / Resource</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="label-mono">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="fw-500">{log.actor_id} <br/><small className="text-muted">Role: {log.actor_type}</small></td>
                    <td><span className="badge badge-primary">{log.action}</span></td>
                    <td className="text-muted">{log.target_type}:<br/>{log.target_id}</td>
                    <td className="label-mono text-muted">{log.ip_address || 'System'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No audit logs found.</td>
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

export default AuditLogs;
