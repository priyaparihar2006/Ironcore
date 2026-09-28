import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { ValidationInput, ValidationSelect, useFormValidation } from '../../components/ValidationInput';
import { emailError, nameError, passwordError, choiceError } from '../../lib/validation';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  // The topbar search navigates here with ?q=, so seed (and keep in sync with) that query.
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const urlQuery = searchParams.get('q');
  useEffect(() => {
    if (urlQuery !== null) setSearch(urlQuery);
  }, [urlQuery]);
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
      <PageHeader
        title="Users"
        subtitle="Search, provision and manage roles across all accounts."
        actions={
          <>
            <button
              onClick={() => {
                setEditingUser(null);
                setName('');
                setEmail('');
                setPassword('');
                setRole('USER');
                validation.reset(); setFormError(''); setShowModal(true);
              }}
              className="btn btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New User</span>
            </button>
          </>
        }
      />

      {/* Filter & Search Bar */}
      <div className="card flex flex-col sm:flex-row items-center gap-6 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by athlete name or email..."
            className="form-input w-full pl-10"
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
      ) : filteredUsers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No matching accounts"
            body={search || roleFilter !== 'ALL' ? 'Try a different search term or role filter.' : 'No accounts have been created yet.'}
          />
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>User / Identity</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th className="text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/50">
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-text-main)] font-semibold text-xs flex items-center justify-center shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--color-text-main)] truncate">{u.name}</div>
                          <div className="text-xs text-[var(--color-text-muted)] font-mono truncate">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-neutral-600 font-medium">{u.email}</td>
                    <td>
                      <Badge tone={u.role === 'ADMIN' ? 'danger' : u.role === 'TRAINER' ? 'info' : 'neutral'}>{u.role}</Badge>
                    </td>
                    <td>
                      <button onClick={() => handleToggleStatus(u)} className={`badge cursor-pointer ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                        {u.status}
                      </button>
                    </td>
                    <td className="text-[var(--color-text-muted)]">{u.createdAt}</td>
                    <td className="text-right">
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
          <div className="card max-w-md w-full animate-fade-in">
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
                <label className="form-label">Full Name *</label>
                <ValidationInput {...validation.field('name', 'Full name')}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Taylor Vance"
                  className="form-input"
                maxLength={100} />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <ValidationInput {...validation.field('email', 'Email address')}
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="taylor@ironcore.fit"
                  className="form-input disabled:bg-neutral-100 disabled:text-[var(--color-text-muted)]"
                maxLength={254} autoComplete="email" />
              </div>

              {!editingUser && (
                <div>
                  <label className="form-label">Initial Password *</label>
                  <ValidationInput {...validation.field('password', 'Password')}
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="form-input"
                  maxLength={256} autoComplete="new-password" />
                </div>
              )}

              <div>
                <label className="form-label">Role Assignment *</label>
                <ValidationSelect {...validation.field('role', 'role')}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="form-select"
                >
                  <option value="USER">USER (Standard Athlete)</option>
                  <option value="TRAINER">TRAINER (Coach Portal Access)</option>
                  <option value="ADMIN">ADMIN (Full Governance)</option>
                </ValidationSelect>
              </div>

              <button type="submit" disabled={creating} className="btn btn-primary w-full mt-4">
                {creating ? 'Saving...' : editingUser ? 'Update User' : 'Create User Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
