import React from 'react';
import { useCrowd } from '../../context/CrowdContext';
import { AdminTab } from '../../types';
import { 
  LayoutDashboard, 
  Layers, 
  Activity, 
  BrainCircuit, 
  Navigation, 
  Cpu, 
  Bell, 
  BarChart3, 
  Server, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, setCollapsed }) => {
  const { adminTab, setAdminTab, notifications } = useCrowd();

  const unreadAlerts = notifications.filter(n => !n.read && !n.resolved).length;

  const menuItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean; badge?: string | number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'smart_plan', label: 'Smart Plan', icon: Layers, highlight: true, badge: '⭐ CORE' },
    { id: 'live_monitor', label: 'Live Monitor', icon: Activity },
    { id: 'crowd_intelligence', label: 'Crowd Intelligence', icon: BrainCircuit },
    { id: 'route_management', label: 'Route Management', icon: Navigation },
    { id: 'sensors', label: 'Sensors & IoT', icon: Cpu },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts > 0 ? unreadAlerts : undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'system_status', label: 'System Status', icon: Server },
  ];

  return (
    <aside 
      className={`bg-white border-r border-slate-200/90 flex flex-col justify-between transition-all duration-300 shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      <div className="p-4 space-y-6">
        {/* Brand header in sidebar */}
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block">
                  FLOW<span className="text-blue-600">NAVIGATOR</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Control Center
                </span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="mx-auto w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer hidden md:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setAdminTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : item.highlight
                    ? 'text-blue-800 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between text-left">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                        isActive 
                          ? 'bg-white text-blue-700' 
                          : typeof item.badge === 'number'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {collapsed && typeof item.badge === 'number' && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        {!collapsed ? (
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-[11px] space-y-1 text-slate-500">
            <div className="flex items-center justify-between font-bold text-slate-700">
              <span>Edge Gateway</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-[10px] text-slate-400">Firmware v2.4.2 Active</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
