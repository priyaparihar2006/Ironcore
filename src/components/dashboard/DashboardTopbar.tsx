import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, HelpCircle, LogOut, Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { resolveAvatarUrl } from '../../lib/avatar';
import { useTheme } from '../../lib/theme';
import { NotificationData } from '../../types';

interface DashboardTopbarProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onLogout: () => void;
  searchPlaceholder: string;
  /** Called with the trimmed query when the search form is submitted. */
  onSearch: (query: string) => void;
}

type Panel = 'notifications' | 'help' | 'profile' | null;

const SUPPORT_EMAIL = 'concierge@ironcorefit.com';

/** Simple topbar: search on the left; notifications, help, theme and profile on the right. */
export const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  mobileMenuOpen,
  onToggleMobileMenu,
  onLogout,
  searchPlaceholder,
  onSearch,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [panel, setPanel] = useState<Panel>(null);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<{ notifications: NotificationData[] }>('/user/notifications')
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

  // Close any open panel on outside click or Escape.
  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!actionsRef.current?.contains(e.target as Node)) setPanel(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panel]);

  const togglePanel = (next: Exclude<Panel, null>) => setPanel((current) => (current === next ? null : next));

  const markAllRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => {
      apiRequest(`/user/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {});
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  // Full-width sheet under the topbar on phones; anchored dropdown from `sm` up.
  const panelClass = 'fixed left-4 right-4 top-[calc(var(--topbar-height)+8px)] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 z-50 card shadow-lg animate-fade-in';

  return (
    <header className="dashboard-topbar sticky top-0 z-20 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenuOpen}
          onClick={onToggleMobileMenu}
          className="topbar-icon-button lg:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <form
          role="search"
          className="topbar-search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query.trim());
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            maxLength={100}
          />
        </form>
      </div>

      <div ref={actionsRef} className="flex items-center gap-1 shrink-0">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={panel === 'notifications'}
            onClick={() => togglePanel('notifications')}
            className="topbar-icon-button"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[var(--color-card-bg)]" />
            )}
          </button>
          {panel === 'notifications' && (
            <div className={`${panelClass} sm:w-[360px]`}>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-main)]">
                <span className="card-title">Notifications</span>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="card-link cursor-pointer">Mark all read</button>
                )}
              </div>
              <div className="divide-y divide-[var(--color-border-main)] max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center card-subtitle">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text-main)]">{n.title}</span>
                        <span className="text-xs text-[var(--color-text-muted)] shrink-0">{n.date}</span>
                      </div>
                      <p className="card-subtitle">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative hidden sm:block">
          <button
            type="button"
            aria-label="Help"
            aria-expanded={panel === 'help'}
            onClick={() => togglePanel('help')}
            className="topbar-icon-button"
          >
            <HelpCircle size={20} />
          </button>
          {panel === 'help' && (
            <div className={`${panelClass} sm:w-[300px]`}>
              <h2 className="card-title">Help & support</h2>
              <p className="card-subtitle">Questions about your account, billing or training?</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-secondary w-full mt-4">{SUPPORT_EMAIL}</a>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
          className="topbar-icon-button hidden sm:flex"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative ml-1">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={panel === 'profile'}
            onClick={() => togglePanel('profile')}
            className="flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            <img
              src={resolveAvatarUrl(user)}
              alt=""
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-[var(--color-border-main)]"
            />
          </button>
          {panel === 'profile' && (
            <div className={`${panelClass} sm:w-[260px] !p-3`}>
              <div className="px-2 py-2 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="border-t border-[var(--color-border-main)] my-2" />
              <Link to="/dashboard/profile" onClick={() => setPanel(null)} className="dashboard-nav-link text-neutral-600 hover:bg-neutral-100">
                <User size={18} className="shrink-0" /><span>Profile</span>
              </Link>
              <button type="button" onClick={toggleTheme} className="dashboard-nav-link w-full text-neutral-600 hover:bg-neutral-100 sm:hidden">
                {theme === 'dark' ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
                <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
              </button>
              <button type="button" onClick={onLogout} className="dashboard-nav-link w-full text-neutral-600 hover:bg-red-50 hover:text-red-700">
                <LogOut size={18} className="shrink-0" /><span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
