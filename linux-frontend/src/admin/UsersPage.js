import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShieldCheck, BookOpen, UserPlus, X } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate, initials, timeAgo } from '../lib/format';
import { Avatar, BUTTON, FOCUS, Field, INPUT, Pagination, Panel, StatusBadge, useDebounced, useToast } from './ui';

const PAGE_SIZE = 20;
const TABS = [
    { key: '', label: 'All', count: 'all' },
    { key: 'admin', label: 'Admins', count: 'admin' },
    { key: 'user', label: 'Readers', count: 'user' }
];

function AddUserDialog({ onClose, onCreated }) {
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [error, setError] = useState({});
    const [saving, setSaving] = useState(false);
    const firstRef = useRef(null);

    useEffect(() => {
        firstRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError({});
        try {
            const res = await api.post('/api/admin/users', form);
            toast(`${res.data.user.name} added as ${form.role === 'admin' ? 'an admin' : 'a reader'}`);
            onCreated();
        } catch (err) {
            setError({ [err.response?.data?.field || 'form']: errorMessage(err) });
            setSaving(false);
        }
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1220]/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
            <form onSubmit={submit} className="w-full max-w-md rounded-[14px] bg-white p-6 shadow-2xl" noValidate>
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h2 id="add-user-title" className="text-[18px] font-bold">Add user</h2>
                        <p className="text-[13px] text-adm-muted">Share the password with them securely. They can sign in straight away.</p>
                    </div>
                    <button type="button" onClick={onClose} className={`rounded-lg p-1.5 text-adm-muted hover:bg-adm-canvas ${FOCUS}`} aria-label="Close">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="space-y-4">
                    <Field label="Name" htmlFor="nu-name" error={error.name}>
                        <input ref={firstRef} id="nu-name" value={form.name} onChange={set('name')} className={INPUT} autoComplete="off" required />
                    </Field>
                    <Field label="Email" htmlFor="nu-email" error={error.email}>
                        <input id="nu-email" type="email" value={form.email} onChange={set('email')} className={INPUT} autoComplete="off" required />
                    </Field>
                    <Field label="Temporary password" htmlFor="nu-password" error={error.password} hint="At least 8 characters">
                        <input id="nu-password" type="text" value={form.password} onChange={set('password')} className={`${INPUT} font-admin-mono`} autoComplete="new-password" required />
                    </Field>
                    <fieldset>
                        <legend className="mb-1.5 text-[12px] font-semibold text-[#3d4a62]">Role</legend>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'user', label: 'Reader', sub: 'Reads articles, posts in the forum', icon: BookOpen },
                                { value: 'admin', label: 'Admin', sub: 'Writes, publishes and manages users', icon: ShieldCheck }
                            ].map((r) => (
                                <label key={r.value} className={`cursor-pointer rounded-[10px] border p-3 text-[12px] focus-within:ring-[3px] focus-within:ring-[#b9c8ff] ${form.role === r.value ? 'border-adm-blue bg-adm-blue-soft' : 'border-adm-line'}`}>
                                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} className="sr-only" />
                                    <r.icon size={16} aria-hidden="true" className="mb-1 text-adm-blue" />
                                    <strong className="block text-[13px]">{r.label}</strong>
                                    <span className="text-adm-muted">{r.sub}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    {error.form && <p className="text-[13px] font-medium text-adm-red" role="alert">{error.form}</p>}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={BUTTON.secondary}>Cancel</button>
                    <button type="submit" disabled={saving} className={BUTTON.primary}>{saving ? 'Adding…' : 'Add user'}</button>
                </div>
            </form>
        </div>
    );
}

function ResetPasswordDialog({ user, onClose }) {
    const toast = useToast();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/api/admin/users/${user.id}`, { password });
            toast(`Password reset for ${user.name}`);
            onClose();
        } catch (err) {
            setError(errorMessage(err));
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1220]/50 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <form onSubmit={submit} className="w-full max-w-sm rounded-[14px] bg-white p-6 shadow-2xl" noValidate>
                <h2 id="reset-title" className="text-[18px] font-bold">Reset password</h2>
                <p className="mb-5 text-[13px] text-adm-muted">Set a new password for {user.name} and share it with them securely.</p>
                <Field label="New password" htmlFor="reset-password" error={error} hint="At least 8 characters">
                    <input ref={inputRef} id="reset-password" type="text" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className={`${INPUT} font-admin-mono`} autoComplete="new-password" />
                </Field>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={BUTTON.secondary}>Cancel</button>
                    <button type="submit" disabled={saving} className={BUTTON.primary}>{saving ? 'Saving…' : 'Reset password'}</button>
                </div>
            </form>
        </div>
    );
}

function UsersPage() {
    const toast = useToast();
    const { user: me } = useAuth();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const role = params.get('role') || '';
    const status = params.get('status') || '';
    const page = Math.max(1, Number(params.get('page')) || 1);

    const [search, setSearch] = useState(q);
    const debouncedSearch = useDebounced(search, 300);
    const [list, setList] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [adding, setAdding] = useState(false);
    const [resetting, setResetting] = useState(null);
    const [reload, setReload] = useState(0);

    const update = (changes) => {
        const next = new URLSearchParams(params);
        Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
            if (value && !(key === 'page' && value === 1)) next.set(key, value);
            else next.delete(key);
        });
        setParams(next, { replace: true });
    };

    useEffect(() => {
        if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        api.get('/api/admin/users', { params: { q, role, status, page, pageSize: PAGE_SIZE } })
            .then((res) => setList(res.data))
            .catch((err) => toast(errorMessage(err, 'Could not load users'), 'error'));
    }, [q, role, status, page, reload, toast]);

    const refresh = useCallback(() => setReload((n) => n + 1), []);

    const change = async (u, body, confirmText, success) => {
        if (confirmText && !window.confirm(confirmText)) return;
        setBusyId(u.id);
        try {
            await api.patch(`/api/admin/users/${u.id}`, body);
            toast(success);
            refresh();
        } catch (err) {
            toast(errorMessage(err), 'error');
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (u) => {
        if (!window.confirm(`Delete ${u.name}'s account permanently? This cannot be undone. To keep their history, disable the account instead.`)) return;
        setBusyId(u.id);
        try {
            await api.delete(`/api/admin/users/${u.id}`);
            toast(`${u.name} deleted`);
            refresh();
        } catch (err) {
            toast(errorMessage(err), 'error');
        } finally {
            setBusyId(null);
        }
    };

    const items = list?.items || [];
    const total = list?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <>
            <div className="mb-[25px] flex flex-col items-start justify-between gap-5 nav:flex-row nav:items-end">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">Access control</p>
                    <h1 className="mb-[5px] mt-1 text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">Users &amp; roles</h1>
                    <p className="text-adm-muted">Admins write, publish and manage users. Readers can read every article and post in the forum.</p>
                </div>
                <button type="button" onClick={() => setAdding(true)} className={BUTTON.primary}><UserPlus size={16} aria-hidden="true" /> Add user</button>
            </div>

            <Panel aria-label="Users">
                <div className="flex flex-wrap items-center gap-2.5 px-[15px] py-[17px] nav:px-[22px]">
                    <label className="relative min-w-[220px] max-w-[440px] flex-1">
                        <span className="sr-only">Search users</span>
                        <Search size={16} aria-hidden="true" className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#6b778b]" />
                        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className={`${INPUT} pl-[38px]`} />
                    </label>
                    <label>
                        <span className="sr-only">Filter by account status</span>
                        <select value={status} onChange={(e) => update({ status: e.target.value })} className={`${INPUT} w-auto bg-white pr-8 text-[#45526a]`}>
                            <option value="">Any status</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </label>
                </div>

                <div role="tablist" aria-label="Filter by role" className="flex gap-1 overflow-x-auto border-b border-adm-line px-2.5 nav:px-[22px]">
                    {TABS.map((tab) => {
                        const active = role === tab.key;
                        return (
                            <button key={tab.key || 'all'} type="button" role="tab" aria-selected={active} onClick={() => update({ role: tab.key })}
                                className={`whitespace-nowrap border-b-2 px-2 py-[11px] text-[12px] font-semibold nav:px-[13px] ${FOCUS} ${active ? 'border-adm-blue text-adm-blue' : 'border-transparent text-[#5f6b80] hover:text-adm-ink'}`}>
                                {tab.label}
                                <span className="ml-1 rounded-[5px] bg-[#edf1f7] px-1.5 py-0.5 text-[10px] text-[#56637a]">{list ? list.counts[tab.count] : '·'}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="overflow-auto">
                    <table className="w-full min-w-[780px] border-collapse">
                        <caption className="sr-only">User accounts</caption>
                        <thead>
                            <tr>
                                {['User', 'Role', 'Status', 'Last login', 'Joined', 'Actions'].map((h) => (
                                    <th key={h} scope="col" className="border-b border-adm-line bg-[#fbfcfe] px-[22px] py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] text-adm-muted">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((u) => {
                                const isMe = u.id === me.id;
                                const isAdmin = u.role === 'admin';
                                const busy = busyId === u.id;
                                return (
                                    <tr key={u.id} className={`border-b border-[#edf0f5] last:border-0 hover:bg-[#fbfcff] ${u.is_active ? '' : 'bg-[#fcfcfd]'}`}>
                                        <td className="px-[22px] py-[13px]">
                                            <div className="flex min-w-[240px] items-center gap-3">
                                                <Avatar text={initials(u.name)} className={u.is_active ? '' : 'opacity-50'} />
                                                <div className="min-w-0">
                                                    <strong className="block truncate text-[13px] font-semibold">
                                                        {u.name}{isMe && <span className="ml-1.5 rounded bg-[#edf1f7] px-1.5 py-0.5 text-[10px] font-semibold text-[#56637a]">You</span>}
                                                    </strong>
                                                    <small className="block truncate text-[12px] text-adm-muted">{u.email}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-[22px] py-[13px]">
                                            <StatusBadge status={isAdmin ? 'admin' : 'user'} label={isAdmin ? 'Admin' : 'Reader'} />
                                        </td>
                                        <td className="px-[22px] py-[13px]">
                                            <StatusBadge status={u.is_active ? 'active' : 'disabled'} label={u.is_active ? 'Active' : 'Disabled'} />
                                        </td>
                                        <td className="px-[22px] py-[13px] text-[12px] text-[#39465e]">{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</td>
                                        <td className="px-[22px] py-[13px] text-[12px] text-[#39465e]">{formatDate(u.created_at)}</td>
                                        <td className="px-[22px] py-[13px]">
                                            {isMe ? (
                                                <span className="text-[12px] text-adm-muted">Ask another admin to change your account</span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    <button type="button" disabled={busy} className={BUTTON.mini}
                                                        onClick={() => change(u, { role: isAdmin ? 'user' : 'admin' },
                                                            isAdmin ? `Remove admin rights from ${u.name}? They will become a read-only reader immediately.` : `Make ${u.name} an admin? They will be able to publish articles and manage users.`,
                                                            isAdmin ? `${u.name} is now a reader` : `${u.name} is now an admin`)}>
                                                        {isAdmin ? 'Make reader' : 'Make admin'}
                                                    </button>
                                                    <button type="button" disabled={busy} className={BUTTON.mini}
                                                        onClick={() => change(u, { is_active: !u.is_active },
                                                            u.is_active ? `Disable ${u.name}? They will be signed out and unable to log in.` : null,
                                                            u.is_active ? `${u.name} disabled` : `${u.name} re-enabled`)}>
                                                        {u.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button type="button" disabled={busy} className={BUTTON.mini} onClick={() => setResetting(u)}>
                                                        Reset password
                                                    </button>
                                                    <button type="button" disabled={busy} className={`${BUTTON.mini} hover:!border-[#f1caca] hover:!text-adm-red`} onClick={() => remove(u)} aria-label={`Delete ${u.name}`}>
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {list && items.length === 0 && (
                                <tr><td colSpan={6} className="px-[22px] py-12 text-center text-adm-muted">No users match these filters.</td></tr>
                            )}
                            {!list && (
                                <tr><td colSpan={6} className="px-[22px] py-12 text-center text-adm-muted" role="status">Loading users…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-adm-line px-[15px] py-[13px] text-[12px] text-adm-muted nav:px-[22px] nav:py-[15px]">
                    <span>{total ? `${total} account${total === 1 ? '' : 's'}` : 'No accounts to show'}</span>
                    <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onChange={(p) => update({ page: p })} />
                </div>
            </Panel>

            {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(null)} />}
            {adding && <AddUserDialog onClose={() => setAdding(false)} onCreated={() => { setAdding(false); refresh(); }} />}
        </>
    );
}

export default UsersPage;
