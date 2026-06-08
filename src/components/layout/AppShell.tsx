import React from 'react';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="desktop-nav">
        <SideNav />
      </div>
      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom))',
      }} className="main-content">
        {children}
      </main>
      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        <BottomNav />
      </div>
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none; }
          .main-content { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
