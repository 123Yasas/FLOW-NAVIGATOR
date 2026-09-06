import React, { useState } from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { SmartPlanTab } from './tabs/SmartPlanTab';
import { LiveMonitorTab } from './tabs/LiveMonitorTab';
import { CrowdIntelligenceTab } from './tabs/CrowdIntelligenceTab';
import { RouteManagementTab } from './tabs/RouteManagementTab';
import { SensorsIoTTab } from './tabs/SensorsIoTTab';
import { AlertsTab } from './tabs/AlertsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { SystemStatusTab } from './tabs/SystemStatusTab';

export const AdminDashboard: React.FC = () => {
  const { adminTab } = useCrowd();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Collapsible Sidebar with 9 Sections */}
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {adminTab === 'overview' && <OverviewTab />}
          {adminTab === 'smart_plan' && <SmartPlanTab />}
          {adminTab === 'live_monitor' && <LiveMonitorTab />}
          {adminTab === 'crowd_intelligence' && <CrowdIntelligenceTab />}
          {adminTab === 'route_management' && <RouteManagementTab />}
          {adminTab === 'sensors' && <SensorsIoTTab />}
          {adminTab === 'alerts' && <AlertsTab />}
          {adminTab === 'analytics' && <AnalyticsTab />}
          {adminTab === 'system_status' && <SystemStatusTab />}
        </main>
      </div>

    </div>
  );
};
