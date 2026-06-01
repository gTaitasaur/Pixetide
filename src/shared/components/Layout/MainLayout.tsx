import React, { useEffect, Suspense } from 'react';
import { Navbar } from './Navbar';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';

const WorkingOnIt = React.lazy(() => import('../UI/WorkingOnIt/WorkingOnIt'));

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

      {/* Floating fixed widget for Working On It */}
      <div className="fixed bottom-12 right-6 z-50 scale-105 md:scale-95 lg:scale-100 origin-bottom-right transition-transform duration-300">
        <Suspense fallback={null}>
          <WorkingOnIt />
        </Suspense>
      </div>
    </div>
  );
};
