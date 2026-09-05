import React, { useEffect, useState } from 'react';
import { Users, Search, UserPlus, Trash2, Edit2, Shield, X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { UserRole } from '../../types';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ users: ManagedUser[] }>('/admin/users');
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (editingUser) {
        await apiRequest(`/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, role, status: editingUser.status }),
        });
      } else {
        await apiRequest('/admin/users', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, role }),
        });
      }

      setShowModal(false);
      setEditingUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
      await fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiRequest(`/admin/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete account for ${userName}? This action is irreversible.`)) return;

    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            User & Role Governance
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Search, provision, modify roles, and enforce security policies across all accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setName('');
            setEmail('');
            setPassword('');
            setRole('USER');
            setShowModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-[#080512] text-white text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-lg shadow-purple-950/5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by athlete name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:ring-2 focus:ring-[#080512]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'USER', 'TRAINER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r ? 'bg-[#080512] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-400 uppercase font-bold border-b border-neutral-100">
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">System Role</th>
                  <th className="py-3.5 px-6">Account Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[#080512]">{u.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">ID: {u.id}</div>
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-medium">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-red-100 text-red-900'
                          : u.role === 'TRAINER'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-neutral-400">{u.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setName(u.name);
                            setEmail(u.email);
                            setRole(u.role);
                            setShowModal(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-[#080512]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#080512]">
                {editingUser ? 'Modify User Profile' : 'Provision User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taylor Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="taylor@ironcore.fit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium disabled:bg-neutral-100 disabled:text-neutral-400"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Role Assignment *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="USER">USER (Standard Athlete)</option>
                  <option value="TRAINER">TRAINER (Coach Portal Access)</option>
                  <option value="ADMIN">ADMIN (Full Governance)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer mt-4"
              >
                {creating ? 'Saving...' : editingUser ? 'Update User' : 'Create User Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
