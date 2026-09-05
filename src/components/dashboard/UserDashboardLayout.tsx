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
  ChevronRight,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { NotificationData } from '../../types';

interface UserDashboardLayoutProps {
  children: React.ReactNode;
}

export const UserDashboardLayout: React.FC<UserDashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Workouts', path: '/dashboard/workouts', icon: Dumbbell },
    { label: 'Progress', path: '/dashboard/progress', icon: TrendingUp },
    { label: 'Nutrition', path: '/dashboard/nutrition', icon: Apple },
    { label: 'Membership', path: '/dashboard/membership', icon: CreditCard },
    { label: 'Bookings', path: '/dashboard/bookings', icon: Calendar },
    { label: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-[#080512] flex flex-col lg:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-neutral-200/80 p-6 flex-shrink-0 min-h-screen sticky top-0 z-30">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#080512] rounded-lg flex items-center justify-center shadow-md">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-xl font-black tracking-tighter text-[#080512]">
              IronCore
            </span>
          </Link>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            Athlete
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5 flex-1">
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

        {/* Switch to Trainer or Admin if user has elevated role */}
        {user && user.role !== 'USER' && (
          <div className="my-4 p-3 bg-purple-50 rounded-2xl border border-purple-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              Role Portal Access
            </div>
            <Link
              to={user.role === 'ADMIN' ? '/admin' : '/trainer'}
              className="text-xs text-purple-700 font-bold hover:underline block"
            >
              Switch to {user.role === 'ADMIN' ? 'Admin Dashboard' : 'Trainer Dashboard'} →
            </Link>
          </div>
        )}

        {/* User Card & Logout in Sidebar */}
        <div className="pt-4 border-t border-neutral-200/70">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-neutral-50 border border-neutral-200/60 mb-3">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
              }
              alt={user?.name || 'User'}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-[#080512] truncate">{user?.name}</div>
              <div className="text-[11px] text-neutral-400 truncate">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between">
          
          {/* Left Greeting */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-neutral-600 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-xs font-semibold text-neutral-400">
                {getGreeting()},
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#080512]">
                {user?.name || 'Athlete'}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl bg-neutral-100/80 hover:bg-neutral-200/80 flex items-center justify-center relative text-neutral-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-purple-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200/80 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <span className="font-bold text-sm text-[#080512]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-neutral-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800">{n.title}</span>
                            <span className="text-[10px] text-neutral-400">{n.date}</span>
                          </div>
                          <p className="text-neutral-500 mt-0.5">{n.message}</p>
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
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
                }
                alt={user?.name || 'User'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover border border-neutral-200"
              />
              <span className="hidden sm:inline text-xs font-bold text-neutral-800 truncate max-w-[120px]">
                {user?.name?.split(' ')[0]}
              </span>
            </Link>

          </div>

        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-neutral-200 p-4 space-y-1 z-20">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                    isActive
                      ? 'bg-[#080512] text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
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
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
};
