import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Building, Settings, FileText, LogOut, Store, BookOpen, UserPlus, DollarSign } from 'lucide-react';
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
        <span className="label-mono">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Admin'}</span>
      </div>
      
      <nav className="sidebar-nav">
        {user?.role === 'SUPER_ADMIN' ? (
          <>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
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
          </>
        ) : (
          <>
            <NavLink to="/business" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/business/branches" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Store size={18} />
              <span>Branches</span>
            </NavLink>
            <NavLink to="/business/catalog" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <BookOpen size={18} />
              <span>Master Catalog</span>
            </NavLink>
            <NavLink to="/business/staff" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <UserPlus size={18} />
              <span>Branch Admins</span>
            </NavLink>
            <NavLink to="/business/financials" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <DollarSign size={18} />
              <span>Financials</span>
            </NavLink>
            <NavLink to="/business/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </>
        )}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{user?.role === 'SUPER_ADMIN' ? 'SA' : 'BA'}</div>
          <div className="user-info">
            <span className="name">{user?.name || 'User'}</span>
            <span className="label-mono">{user?.email || 'user@saas.com'}</span>
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
