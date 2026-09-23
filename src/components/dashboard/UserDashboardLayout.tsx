import { DashboardSidebar } from './DashboardSidebar';
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
  Bell,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { resolveAvatarUrl } from '../../lib/avatar';
import { isFitnessProfileComplete } from '../../lib/profile';
import { NotificationData } from '../../types';

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);


  useEffect(() => {
    apiRequest<{ notifications: NotificationData[] }>('/user/notifications')
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

  const markAllRead = () => {
    notifications.forEach((n) => {
      apiRequest(`/user/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {});
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  return (
    <div className="dashboard-shell min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-text-main)] flex flex-col lg:flex-row">
      
      {/* Desktop Sidebar */}
      <DashboardSidebar role="Athlete" items={navItems} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="dashboard-topbar bg-white/80 backdrop-blur-md border-b border-[var(--color-border-main)]/80 sticky top-0 z-20 flex items-center justify-between">
          
          {/* Left Greeting */}
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
              <p className="text-base sm:text-lg font-bold tracking-tight text-[var(--color-text-main)]">
                {location.pathname === '/dashboard' ? 'Overview' : 
                 navItems.find(i => location.pathname.startsWith(i.path) && i.path !== '/dashboard')?.label || 'Overview'}
              </p>
              
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 min-w-0">
            
            {/* Notifications Button & Dropdown */}
            <div className="relative">
              <button
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl bg-neutral-100/80 hover:bg-neutral-200/80 flex items-center justify-center relative text-neutral-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-purple-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-4 right-4 sm:left-auto sm:absolute sm:right-0 mt-2 w-[min(384px,calc(100vw-32px))] bg-white rounded-lg shadow-sm border border-[var(--color-border-main)]/80 p-6 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <span className="font-bold text-sm text-[var(--color-text-main)]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[var(--color-text-muted)]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--color-text-main)]">{n.title}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{n.date}</span>
                          </div>
                          <p className="text-[var(--color-text-muted)] mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Link */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <img
                src={resolveAvatarUrl(user)}
                alt={user?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-[var(--color-border-main)]"
              />
              <span className="hidden sm:inline text-xs font-bold text-[var(--color-text-main)] truncate max-w-[120px]">
                {user?.name?.split(' ')[0]}
              </span>
            </Link>

          </div>

        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[var(--color-border-main)] p-6 space-y-1 z-20">
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
                      ? 'bg-[var(--color-primary)]/15 border-l-[var(--color-primary)] text-neutral-900'
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
