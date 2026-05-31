import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PasswordInput from '../components/PasswordInput';
import RoleBadge from '../components/RoleBadge';
import { users as usersApi } from '../api/client';
import { ROLES } from '../constants/roles';

const emptyForm = { email: '', password: '', name: '', role: 'MEMBER' };

export default function Users({ user, onLogout }) {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'MEMBER', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await usersApi.list();
      setUserList(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user.role === 'ADMIN') loadUsers();
  }, [loadUsers, user.role]);

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await usersApi.create({
        ...form,
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
      });
      setForm(emptyForm);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, role: u.role, password: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { name: editForm.name, role: editForm.role };
      if (editForm.password) payload.password = editForm.password;
      await usersApi.update(editingId, payload);
      setEditingId(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove user "${name}" from the team?`)) return;
    setError('');
    try {
      await usersApi.remove(id);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

  return (
    <AppLayout
      user={user}
      onLogout={onLogout}
      actions={
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      }
    >
      <div className="mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Team Users</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            People who use this tracker. Each user is assigned one permission role
            (<span className="text-slate-300">Administrator</span>,{' '}
            <span className="text-slate-300">Manager</span>, or{' '}
            <span className="text-slate-300">Member</span>) that controls what they can do.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="mb-1 text-lg font-semibold text-white">Add team user</h2>
            <p className="mb-4 text-xs text-slate-500">Create a person, then assign their role.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Full name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
                <PasswordInput
                  inputClassName={inputClass}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Assign role</label>
                <select
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create user'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-400">Loading team users...</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Assigned role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userList.map((u) => (
                  <tr key={u.id} className="bg-slate-900/40 hover:bg-slate-800/40">
                    {editingId === u.id ? (
                      <td colSpan={5} className="p-4">
                        <form onSubmit={handleUpdate} className="space-y-3">
                          <p className="text-xs font-medium text-slate-500">Edit user</p>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <input
                              className={inputClass}
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              placeholder="Full name"
                              required
                            />
                            <div>
                              <label className="mb-1 block text-[10px] uppercase text-slate-600">
                                Assign role
                              </label>
                              <select
                                className={inputClass}
                                value={editForm.role}
                                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                              >
                                {ROLES.map((r) => (
                                  <option key={r.value} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <PasswordInput
                              inputClassName={inputClass}
                              value={editForm.password}
                              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                              placeholder="New password (optional)"
                              minLength={8}
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                        <td className="px-4 py-3 text-slate-400">{u.email}</td>
                        <td className="px-4 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="mr-2 text-indigo-400 hover:text-indigo-300"
                          >
                            Edit
                          </button>
                          {u.id !== user.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id, u.name)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
