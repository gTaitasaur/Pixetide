import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';

export const MainLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
