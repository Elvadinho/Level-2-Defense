import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { RegisterData, User, UserRole } from '../../types/auth';
import { Alert } from '../../components/common/Alert';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Department } from '../../types/employee';

const roles: UserRole[] = ['admin', 'hr_manager', 'project_manager', 'employee', 'accountant', 'customer'];
const emptyForm: RegisterData = { name: '', email: '', password: '', password_confirmation: '', role: 'employee', department_id: undefined, job_title: '', hire_date: new Date().toISOString().slice(0, 10) };

export const UserAccountsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<RegisterData>(emptyForm);
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await authService.getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load user accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { authService.getRegistrationDepartments().then(setDepartments).catch(() => setDepartments([])); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', password_confirmation: '', role: user.role, department_id: user.employee?.department_id, job_title: user.employee?.job_title || '', hire_date: user.employee?.hire_date?.slice(0, 10) || new Date().toISOString().slice(0, 10) });
    setError(null);
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { password, password_confirmation, ...account } = form;
        const update = password ? form : account;
        await authService.updateUser(editing.id, update);
        setSuccess('User account updated.');
      } else {
        await authService.createUser(form);
        setSuccess(form.role === 'employee' ? 'Employee account and employee profile created.' : 'User account created.');
      }
      setOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the account.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (user: User) => {
    if (!window.confirm(`Delete ${user.name}'s account? This also removes any linked employee profile.`)) return;
    try {
      await authService.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccess('User account deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the account.');
    }
  };

  return <div className="space-y-5">
    {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
    {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-xl font-bold text-slate-900">User Accounts</h1><p className="text-xs text-slate-500 mt-1">Manage sign-in accounts and access roles.</p></div>
      <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>Create Account</Button>
    </div>
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading accounts…</p> : <div className="overflow-x-auto"><table className="min-w-full text-xs"><thead className="bg-slate-50 text-left text-slate-500 uppercase tracking-wide"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Created</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id}><td className="px-4 py-3 font-mono text-slate-500">#{user.id}</td><td className="px-4 py-3"><p className="font-semibold text-slate-800">{user.name}</p><p className="text-slate-500 mt-0.5">{user.email}</p></td><td className="px-4 py-3"><Badge role={user.role} size="sm" /></td><td className="px-4 py-3 text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-right space-x-1"><button className="p-1.5 text-slate-500 hover:text-[#05AD98]" title="Edit account" onClick={() => openEdit(user)}><Pencil className="w-4 h-4" /></button><button className="p-1.5 text-slate-500 hover:text-rose-600" title="Delete account" onClick={() => remove(user)}><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table>{users.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No user accounts yet.</p>}</div>}
    </div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><Users className="w-5 h-5 text-[#05AD98]" /><h2 className="font-bold text-slate-900">{editing ? 'Edit User Account' : 'Create User Account'}</h2></div><button onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div><form onSubmit={save} className="space-y-3.5 pt-4"><Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /><Input label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /><div><label className="mb-1 block text-xs font-semibold text-slate-700">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">{roles.map((role) => <option value={role} key={role}>{role.replace('_', ' ')}</option>)}</select></div>{form.role === 'employee' && <div className="space-y-3 rounded-lg border border-[#05AD98]/30 bg-[#05AD98]/5 p-3"><p className="text-xs font-semibold text-[#035D52]">Employee profile — required for attendance scanning</p><div><label className="mb-1 block text-xs font-semibold text-slate-700">Department</label><select value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required><option value="" disabled>Select a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><Input label="Job Title" value={form.job_title || ''} onChange={(e) => setForm({ ...form, job_title: e.target.value })} required /><Input label="Hire Date" type="date" value={form.hire_date || ''} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} required /></div></div>}<div className="grid grid-cols-2 gap-3"><Input label={editing ? 'New Password' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} helperText={editing ? 'Leave blank to keep current password.' : 'At least 8 characters.'} /><Input label="Confirm Password" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required={!editing} /></div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" isLoading={saving}>{editing ? 'Save Changes' : 'Create Account'}</Button></div></form></div></div>}
  </div>;
};
