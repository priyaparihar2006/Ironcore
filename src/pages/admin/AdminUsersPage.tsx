import { ValidationInput, ValidationSelect, useFormValidation } from '../../components/ValidationInput';
import { emailError, nameError, passwordError, choiceError } from '../../lib/validation';
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

  const [formError, setFormError] = useState('');
  const validation = useFormValidation({ name: nameError(name), email: editingUser ? undefined : emailError(email), password: editingUser ? undefined : passwordError(password), role: choiceError(role, ['USER', 'TRAINER', 'ADMIN'], 'role') });

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
    setFormError('');
    if (creating || !validation.validate()) return;
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
      validation.server(err);
      setFormError(err instanceof Error ? err.message : 'Unable to save this account.');
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
    <div className="space-y-section">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
            User & Role Governance
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
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
            validation.reset(); setFormError(''); setShowModal(true);
          }}
          className="px-6 py-3 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-sm shadow-purple-950/5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-card rounded-3xl border border-[var(--color-border-main)]/80 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by athlete name or email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {(['ALL', 'USER', 'TRAINER', 'ADMIN'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                roleFilter === r ? 'bg-[var(--color-primary)] text-[var(--color-text-main)]' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
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
            <div key={i} className="h-16 bg-neutral-200 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--color-border-main)] shadow-sm/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-neutral-50/80 text-[var(--color-text-muted)] uppercase font-bold border-b border-neutral-100">
                  <th className="py-4 px-6">User / Identity</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">System Role</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-[var(--color-text-main)]">{u.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono">ID: {u.id}</div>
                    </td>
                    <td className="py-4 px-6 text-neutral-600 font-medium">{u.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-red-100 text-red-900'
                          : u.role === 'TRAINER'
                          ? 'bg-purple-100 text-[var(--color-text-main)]'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-[var(--color-text-muted)]">{u.createdAt}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setName(u.name);
                            setEmail(u.email);
                            setRole(u.role);
                            validation.reset(); setFormError(''); setShowModal(true);
                          }}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-neutral-100 hover:text-[var(--color-text-main)]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="bg-white rounded-lg p-card sm:p-card max-w-md w-full shadow-sm border border-[var(--color-border-main)] animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">
                {editingUser ? 'Modify User Profile' : 'Provision User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            {formError && <p role="alert" className="text-sm text-red-700 mb-3">{formError}</p>}
            <form noValidate onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Full Name *</label>
                <ValidationInput {...validation.field('name', 'Full name')}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taylor Vance"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
                maxLength={100} />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Email Address *</label>
                <ValidationInput {...validation.field('email', 'Email address')}
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="taylor@ironcore.fit"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium disabled:bg-neutral-100 disabled:text-[var(--color-text-muted)]"
                maxLength={254} autoComplete="email" />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Initial Password *</label>
                  <ValidationInput {...validation.field('password', 'Password')}
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-medium"
                  maxLength={256} autoComplete="new-password" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-main)] mb-1">Role Assignment *</label>
                <ValidationSelect {...validation.field('role', 'role')}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-main)] text-xs font-bold"
                >
                  <option value="USER">USER (Standard Athlete)</option>
                  <option value="TRAINER">TRAINER (Coach Portal Access)</option>
                  <option value="ADMIN">ADMIN (Full Governance)</option>
                </ValidationSelect>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-main)] text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer mt-4"
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
