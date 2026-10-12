import React from 'react';
import { CrowdProvider, useCrowd } from './context/CrowdContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CitizenView } from './components/citizen/CitizenView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PublicKioskDisplay } from './components/public/PublicKioskDisplay';
function MainAppContent() {
  const { role } = useCrowd();

  // If in public kiosk mode, render the full-screen kiosk layout without standard app navbar
  if (role === 'public_kiosk') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <PublicKioskDisplay />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1">
        {role === 'landing' && <LandingPage />}
        {role === 'visitor' && <CitizenView />}
        {role === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CrowdProvider>
      <MainAppContent />
    </CrowdProvider>
  );
}
