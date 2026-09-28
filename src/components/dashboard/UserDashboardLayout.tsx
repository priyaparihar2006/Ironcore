import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Dumbbell,
  TrendingUp,
  Apple,
  CreditCard,
  Calendar,
  User,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isFitnessProfileComplete } from '../../lib/profile';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export const UserDashboardLayout: React.FC<UserDashboardLayoutProps> = ({ children }) => {
  const { user, profile, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Gate: a new member with no fitness profile yet is sent straight to the
  // profile page to complete onboarding before seeing the rest of the
  // athlete dashboard, rather than an empty/misleading Overview page. Waits
  // for the initial session/profile load (isLoading) so this doesn't fire a
  // false redirect before `profile` has actually arrived.
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (isFitnessProfileComplete(profile)) return;
    if (location.pathname === '/dashboard/profile') return;
    navigate('/dashboard/profile', { replace: true });
  }, [isLoading, user, profile, location.pathname, navigate]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard, group: 'Main' },
    { label: 'My Workouts', path: '/dashboard/workouts', icon: Dumbbell, group: 'Main' },
    { label: 'Progress', path: '/dashboard/progress', icon: TrendingUp, group: 'Main' },
    { label: 'Health & AI', path: '/dashboard/health', icon: Shield, group: 'Main' },
    { label: 'Nutrition', path: '/dashboard/nutrition', icon: Apple, group: 'Main' },
    { label: 'Membership', path: '/dashboard/membership', icon: CreditCard, group: 'Management' },
    { label: 'Bookings', path: '/dashboard/bookings', icon: Calendar, group: 'Management' },
    { label: 'Profile', path: '/dashboard/profile', icon: User, group: 'Account' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Athletes have no member directory to search, so the topbar search jumps to a page.
  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    if (!q) return;
    const match = navItems.find((item) => item.label.toLowerCase().includes(q));
    if (match) navigate(match.path);
  };

  return (
    <div className="dashboard-shell min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-text-main)] flex flex-col lg:flex-row">

      {/* Desktop Sidebar */}
      <DashboardSidebar role="Athlete" items={navItems} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        <DashboardTopbar
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onLogout={handleLogout}
          searchPlaceholder="Search pages..."
          onSearch={handleSearch}
        />

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[var(--color-card-bg)] border-b border-[var(--color-border-main)] p-6 space-y-1 z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 pl-3 pr-4 py-3 rounded-xl text-sm font-bold border-l-[3px] ${
                    isActive
                      ? 'bg-[var(--color-primary)]/15 border-l-[var(--color-primary)] text-[var(--color-text-main)]'
                      : 'border-l-transparent text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Dynamic Page Children */}
        <main className="dashboard-content">
          {children}
        </main>

      </div>

    </div>
  );
};
