import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Building, Settings, FileText, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>R&R Management</h2>
        <span className="label-mono">Super Admin</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/tenants" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <Building size={18} />
          <span>Tenants</span>
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <Users size={18} />
          <span>Users</span>
        </NavLink>
        <NavLink to="/logs" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <FileText size={18} />
          <span>Audit Logs</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">SA</div>
          <div className="user-info">
            <span className="name">{user?.name || 'Genesis Admin'}</span>
            <span className="label-mono">superadmin@saas.com</span>
          </div>
        </div>
        <button className="nav-link logout-btn" onClick={handleLogout} style={{ marginTop: '10px', width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
