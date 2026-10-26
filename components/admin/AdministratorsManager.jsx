'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const blank = { name: '', email: '', role: 'editor', password: '' };

function DateText({ value }) {
  if (!value) return <span className="text-soft">Never</span>;
  const date = new Date(value);
  return <>{Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)}</>;
}

export default function AdministratorsManager({ initialAdmins, roles, currentAdminId }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function beginEdit(admin) {
    setEditing(admin.id);
    setForm({ name: admin.name, email: admin.email, role: admin.role, password: '', active: admin.active });
    setErrors({}); setNotice('');
  }
  function cancelEdit() { setEditing(null); setForm(blank); setErrors({}); }

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setErrors({}); setNotice('');
    const isEditing = Boolean(editing);
    try {
      const response = await fetch(isEditing ? `/api/admin/admins/${editing}` : '/api/admin/admins', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setErrors(data.errors || {});
        throw new Error(data.error || 'Could not save the administrator.');
      }
      setAdmins((items) => isEditing ? items.map((item) => item.id === editing ? data.admin : item) : [...items, data.admin]);
      setNotice(isEditing ? 'Administrator updated.' : 'Administrator added.');
      cancelEdit(); router.refresh();
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  async function remove(admin) {
    if (!window.confirm(`Remove ${admin.name}? This cannot be undone.`)) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not remove the administrator.');
      setAdmins((items) => items.filter((item) => item.id !== admin.id));
      setNotice('Administrator removed.'); router.refresh();
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <header><p className="text-xs uppercase tracking-[0.2em] text-second">Access</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Administrators</h1><p className="mt-2 max-w-2xl text-sm text-soft">Owners have full access. Editors can manage site content and contact enquiries, but cannot manage administrator accounts.</p></header>
    {notice ? <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${notice.includes('updated') || notice.includes('added') || notice.includes('removed') ? 'border-second/40 bg-second/10 text-second' : 'border-red-400/50 bg-red-400/10 text-red-200'}`}>{notice}</p> : null}

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <section className="card overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="font-display text-xl font-bold">Team access <span className="text-soft">({admins.length})</span></h2></div><div className="divide-y divide-line">{admins.map((admin) => <article key={admin.id} className="p-5"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{admin.name} {admin.id === currentAdminId ? <span className="text-sm font-normal text-soft">(you)</span> : null}</h3><span className={`badge ${admin.role === 'owner' ? 'badge-accent' : ''}`}>{admin.role}</span>{!admin.active ? <span className="badge border-amber-400/40 text-amber-100">Inactive</span> : null}</div><p className="mt-1 text-sm text-soft">{admin.email}</p><p className="mt-3 text-xs text-soft">Created <DateText value={admin.createdAt} /> · Last sign-in <DateText value={admin.lastLoginAt} /></p></div><div className="flex gap-2"><button className="btn btn-ghost !px-3 !py-2" type="button" disabled={busy} onClick={() => beginEdit(admin)}>Edit</button>{admin.id !== currentAdminId ? <button className="btn btn-danger !px-3 !py-2" type="button" disabled={busy} onClick={() => remove(admin)}>Remove</button> : null}</div></div></article>)}</div></section>

      <section className="card h-fit p-5 sm:p-6"><h2 className="font-display text-xl font-bold">{editing ? 'Edit administrator' : 'Add administrator'}</h2><p className="mt-1 text-sm text-soft">{editing ? 'Leave the password empty to keep it unchanged.' : 'They can sign in immediately using this password.'}</p><form className="mt-5 space-y-4" onSubmit={submit}><label className="block"><span className="label">Name</span><input className="field" value={form.name} onChange={(event) => setField('name', event.target.value)} required maxLength={60} />{errors.name ? <span className="mt-1 block text-xs text-red-200">{errors.name}</span> : null}</label><label className="block"><span className="label">Email or username</span><input className="field" value={form.email} onChange={(event) => setField('email', event.target.value)} required maxLength={160} />{errors.email ? <span className="mt-1 block text-xs text-red-200">{errors.email}</span> : null}</label><label className="block"><span className="label">Role</span><select className="field" value={form.role} onChange={(event) => setField('role', event.target.value)}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label} — {role.description}</option>)}</select>{errors.role ? <span className="mt-1 block text-xs text-red-200">{errors.role}</span> : null}</label>{editing ? <label className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setField('active', event.target.checked)} /> Account is active</label> : null}<label className="block"><span className="label">{editing ? 'New password (optional)' : 'Password'}</span><input className="field" type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} required={!editing} minLength={10} autoComplete="new-password" />{errors.password ? <span className="mt-1 block text-xs text-red-200">{errors.password}</span> : <span className="mt-1 block text-xs text-soft">At least 10 characters, with uppercase, lowercase and a number.</span>}</label><div className="flex justify-end gap-2 pt-2">{editing ? <button className="btn btn-ghost" type="button" onClick={cancelEdit}>Cancel</button> : null}<button className="btn btn-primary" disabled={busy} type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Add administrator'}</button></div></form></section>
    </div>
  </div>;
}
