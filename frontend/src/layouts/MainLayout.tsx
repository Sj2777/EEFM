import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  LayoutDashboard,
  UserPlus,
  Star,
  Users,
  BarChart3,
  Cpu,
  Settings,
  Leaf,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/new-applicant', label: 'New Applicant', icon: UserPlus },
  { to: '/score', label: 'Credit Score & Explanation', icon: Star },
  { to: '/records', label: 'Applicant Records', icon: Users },
  { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { to: '/model', label: 'Model Performance', icon: Cpu },
  { to: '/settings', label: 'Settings & Data', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-30"
      style={{ background: 'linear-gradient(180deg, #0c1a2e 0%, #112240 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Leaf size={16} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">AltScore</span>
          <span className="block text-blue-400 text-[10px] leading-tight">Credit Intelligence</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={16} className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              <span className="truncate">{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">Guest User</p>
            <p className="text-[10px] text-slate-500">Prototype Mode</p>
          </div>
        </div>
        <div className="mt-2 px-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Prototype • Synthetic Data
          </span>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
interface MainLayoutProps { children: React.ReactNode }

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
