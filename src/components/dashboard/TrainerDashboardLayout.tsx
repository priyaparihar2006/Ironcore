import { DashboardSidebar } from './DashboardSidebar';
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Calendar,
  LogOut,
  Menu,
  X,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolveAvatarUrl } from '../../lib/avatar';

interface TrainerDashboardLayoutProps {
  children: React.ReactNode;
}

export const TrainerDashboardLayout: React.FC<TrainerDashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Trainer Overview', path: '/trainer', icon: LayoutDashboard, group: 'Main' },
    { label: 'Assigned Athletes', path: '/trainer/clients', icon: Users, group: 'Main' },
    { label: 'Workout Regimens', path: '/trainer/plans', icon: Dumbbell, group: 'Main' },
    { label: 'Coaching Schedule', path: '/trainer/schedule', icon: Calendar, group: 'Management' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-text-main)] flex flex-col lg:flex-row">
      
      {/* Sidebar */}
      <DashboardSidebar role="Coach" items={navItems} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="dashboard-topbar bg-white/80 backdrop-blur-md border-b border-[var(--color-border-main)]/80 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden shrink-0 p-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-main)] px-2 py-1 rounded-full bg-[var(--color-brand-bg)]">
                Coaching Portal
              </span>
              <p className="text-base sm:text-lg font-bold truncate tracking-tight text-[var(--color-text-main)] mt-1">
                Coach {user?.name}
              </p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[var(--color-border-main)] p-6 space-y-1 z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/trainer'
                  ? location.pathname === '/trainer'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 pl-3 pr-4 py-3 rounded-xl text-sm font-bold border-l-[3px] ${
                    isActive
                      ? 'bg-[var(--color-primary)]/15 border-l-[var(--color-primary)] text-neutral-900'
                      : 'border-l-transparent text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Switch to Athlete View</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
};
