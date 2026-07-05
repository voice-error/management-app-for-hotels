import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BusinessAdminDashboard from './pages/BusinessAdminDashboard';
import BranchManagement from './pages/BranchManagement';
import MasterCatalog from './pages/MasterCatalog';
import BranchAdmins from './pages/BranchAdmins';
import Financials from './pages/Financials';
import Tenants from './pages/Tenants';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading, logout } = useAuth();
  
  if (isLoading) return null; // AuthContext handles global loading state
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // If they go to the root page but they are a BUSINESS_ADMIN, just redirect them to their dashboard
    if (requiredRole === 'SUPER_ADMIN' && user.role === 'BUSINESS_ADMIN' && window.location.pathname === '/') {
      return <Navigate to="/business" replace />;
    }
    
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>Access Denied</h2>
        <p>Your role ({user.role}) does not have permission to view this page.</p>
        <button 
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
          className="btn-primary"
          style={{ marginTop: '20px' }}
        >
          Logout & Return to Login
        </button>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="users" element={<Users />} />
            <Route path="logs" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="/business" element={
            <ProtectedRoute requiredRole="BUSINESS_ADMIN">
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<BusinessAdminDashboard />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="catalog" element={<MasterCatalog />} />
            <Route path="staff" element={<BranchAdmins />} />
            <Route path="financials" element={<Financials />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
