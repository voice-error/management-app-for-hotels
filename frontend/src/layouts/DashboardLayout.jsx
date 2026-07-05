import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-canvas">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
