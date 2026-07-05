import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../pages/SuperAdminDashboard.css';

const Financials = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [filter, setFilter] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch generic financials (table)
    fetch('http://localhost:3000/api/business/financials', {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      setReports(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    // Fetch chart data
    fetch(`http://localhost:3000/api/business/financials/chart?filter=${filter}`, {
      credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
      setChartData(data);
    })
    .catch(err => console.error(err));
  }, [token, filter]);

  if (loading) return <div className="dashboard"><p>Loading Financials...</p></div>;

  const totalPos = reports.reduce((sum, r) => sum + r.posRevenue, 0);
  const totalHotel = reports.reduce((sum, r) => sum + r.hotelRevenue, 0);
  const grandTotal = reports.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Consolidated Financials</h2>
        <button className="btn-ghost">Export CSV</button>
      </header>

      <section className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-value">रु{grandTotal.toLocaleString()}</div>
          <div className="label-mono">Global Revenue (Today)</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">रु{totalHotel.toLocaleString()}</div>
          <div className="label-mono">Hotel Revenue</div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-value">रु{totalPos.toLocaleString()}</div>
          <div className="label-mono">POS / F&B Revenue</div>
        </div>
      </section>

      <section className="chart-section" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Revenue Trends</h3>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="settings-select" style={{ padding: '6px' }}>
              <option value="week">Past Week</option>
              <option value="month">Past 30 Days</option>
              <option value="year">Past Year</option>
            </select>
          </div>
          <div style={{ width: '100%', height: 350, padding: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHotel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `रु${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="hotel" name="Hotel Revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHotel)" />
                <Area type="monotone" dataKey="pos" name="POS Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorPos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="table-section" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Revenue by Location (End of Day)</h3>
          </div>
          <div className="table-container">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch Location</th>
                  <th>Hotel Revenue</th>
                  <th>POS Revenue</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => (
                  <tr key={idx}>
                    <td>{report.date}</td>
                    <td className="fw-500">{report.branch}</td>
                    <td className="label-mono">रु{report.hotelRevenue.toLocaleString()}</td>
                    <td className="label-mono">रु{report.posRevenue.toLocaleString()}</td>
                    <td className="label-mono fw-500 text-success">रु{report.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Financials;
