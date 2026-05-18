import React from 'react';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
