import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Calendar,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TrainerDashboardLayoutProps {
  children: React.ReactNode;
}

export const TrainerDashboardLayout: React.FC<TrainerDashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Trainer Overview', path: '/trainer', icon: LayoutDashboard },
    { label: 'Assigned Athletes', path: '/trainer/clients', icon: Users },
    { label: 'Workout Regimens', path: '/trainer/plans', icon: Dumbbell },
    { label: 'Coaching Schedule', path: '/trainer/schedule', icon: Calendar },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#080512] flex flex-col lg:flex-row">
      
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-neutral-200/80 p-6 flex-shrink-0 min-h-screen sticky top-0 z-30">
        
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center shadow-md">
              <div className="w-3.5 h-3.5 border-2 border-purple-200 rounded-full"></div>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#080512]">
              IronCore
            </span>
          </Link>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
            Coach
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 flex-1">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#080512] text-white shadow-lg shadow-purple-950/5'
                    : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-[#080512]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Return to Athlete Dashboard or Admin Dashboard */}
        <div className="my-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-[#080512]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Athlete View</span>
          </Link>
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="flex items-center gap-2 text-xs font-bold text-purple-700 hover:underline mt-2 pt-2 border-t border-neutral-200"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Switch to Admin Panel →</span>
            </Link>
          )}
        </div>

        {/* Coach Card & Sign Out */}
        <div className="pt-4 border-t border-neutral-200/70">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-neutral-50 border border-neutral-200/60 mb-3">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'
              }
              alt={user?.name || 'Coach'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-[#080512] truncate">{user?.name}</div>
              <div className="text-[10px] text-purple-700 font-bold uppercase">Master Coach</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-2 py-0.5 rounded-full bg-purple-50">
                Coaching Portal
              </span>
              <h1 className="text-lg font-black tracking-tight text-[#080512] mt-0.5">
                Coach {user?.name}
              </h1>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-neutral-200 p-4 space-y-1 z-20">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                    isActive ? 'bg-[#080512] text-white' : 'text-neutral-600 hover:bg-neutral-100'
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
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
};
