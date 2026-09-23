import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Dumbbell, LogOut, PanelLeftClose, PanelLeftOpen, Shield, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolveAvatarUrl } from '../../lib/avatar';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Uppercase group heading this item is filed under (e.g. "Main", "Management"). Items without a group render ungrouped. */
  group?: string;
}

interface Props {
  role: 'Athlete' | 'Coach' | 'Admin';
  items: NavItem[];
  onLogout: () => void;
}

/** Groups items by `group`, preserving first-seen order; ungrouped items are dropped in as a nameless leading group. */
function groupItems(items: NavItem[]): { name: string | null; items: NavItem[] }[] {
  const groups: { name: string | null; items: NavItem[] }[] = [];
  for (const item of items) {
    const name = item.group ?? null;
    let bucket = groups.find((g) => g.name === name);
    if (!bucket) {
      bucket = { name, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(item);
  }
  return groups;
}

export function DashboardSidebar({ role, items, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const root = items[0].path;
  const groups = groupItems(items);
  const portals = [
    ...(role !== 'Athlete' ? [{ path: '/dashboard', label: 'Athlete View', icon: ArrowLeft }] : []),
    ...(user?.role === 'ADMIN' && role !== 'Admin' ? [{ path: '/admin', label: 'Admin Panel', icon: Shield }] : []),
    ...(user?.role === 'ADMIN' && role === 'Admin' || user?.role === 'TRAINER' && role === 'Athlete'
      ? [{ path: '/trainer', label: 'Trainer View', icon: Dumbbell }] : []),
  ];

  const navLink = (path: string, label: string, Icon: LucideIcon, active: boolean, key?: string) => (
    <Link key={key ?? path} to={path} aria-label={label} title={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`dashboard-nav-link ${active
        ? 'bg-[var(--color-primary)]/15 border-l-[var(--color-primary)] text-neutral-900 font-bold'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}`}>
      <Icon size={19} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <aside className="dashboard-sidebar" data-collapsed={collapsed} aria-label={`${role} sidebar`}>
      <div className="flex items-center justify-between gap-2 min-h-10">
        {!collapsed && <Link to="/" className="font-bold text-xl tracking-tight">IronCore</Link>}
        <button type="button" onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
          className="sidebar-toggle flex items-center justify-center rounded-lg hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
      {!collapsed && <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{role} workspace</p>}
      <nav aria-label={`${role} navigation`} className="dashboard-nav flex-1">
        {groups.map((group, i) => (
          <div key={group.name ?? `group-${i}`} className="dashboard-nav-group">
            {group.name && !collapsed && <p className="dashboard-nav-heading">{group.name}</p>}
            <div className="space-y-1">
              {group.items.map(({ path, label, icon: Icon }) => {
                const active = path === root ? pathname === path : pathname.startsWith(path);
                return navLink(path, label, Icon, active);
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--color-border-main)] pt-4 space-y-2">
        {portals.map(({ path, label, icon: Icon }) => navLink(path, label, Icon, false, path))}
        {!collapsed && <div className="flex items-center gap-3 py-4 min-w-0">
          <img src={resolveAvatarUrl(user)} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover shrink-0" />
          <div className="min-w-0 text-xs"><p className="font-bold truncate">{user?.name}</p><p className="text-neutral-500 truncate">{user?.email}</p></div>
        </div>}
        <button type="button" onClick={onLogout} aria-label="Sign Out" title={collapsed ? 'Sign Out' : undefined}
          className="dashboard-nav-link w-full text-neutral-600 hover:bg-red-50 hover:text-red-700">
          <LogOut size={19} className="shrink-0" />{!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
