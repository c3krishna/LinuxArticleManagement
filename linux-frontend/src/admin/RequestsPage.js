import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarCheck, Download, Mail, MessageCircle, Phone, Search, X } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatDate, formatDateTime, fromLocalInput, timeAgo, toLocalInput } from '../lib/format';
import { BUTTON, Chip, FOCUS, Field, INPUT, Pagination, Panel, useDebounced, useToast } from './ui';

const PAGE_SIZE = 20;

const STATUSES = [
    { key: 'new', label: 'New', style: 'text-[#3e52b5] bg-[#eef1ff]' },
    { key: 'contacted', label: 'Contacted', style: 'text-adm-amber bg-adm-amber-bg' },
    { key: 'scheduled', label: 'Scheduled', style: 'text-[#0b6477] bg-[#e4f6f9]' },
    { key: 'completed', label: 'Completed', style: 'text-adm-green bg-adm-green-bg' },
    { key: 'closed', label: 'Closed', style: 'text-[#4a586f] bg-[#f0f3f8]' },
    { key: 'spam', label: 'Spam', style: 'text-adm-red bg-adm-red-bg' }
];
const STATUS = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

const TABS = [
    { key: 'open', label: 'Open' },
    ...STATUSES.map(({ key, label }) => ({ key, label })),
    { key: '', label: 'All', count: 'all' }
];

function RequestStatus({ status }) {
    const s = STATUS[status] || STATUS.closed;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${s.style}`}>
            <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-current" />
            {s.label}
        </span>
    );
}

// DATE values arrive as YYYY-MM-DD; show them without converting through a time zone.
function formatDay(value) {
    if (!value) return '—';
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function whatsappLink(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

function RequestDrawer({ id, onClose, onChanged }) {
    const toast = useToast();
    const [request, setRequest] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const closeRef = useRef(null);

    useEffect(() => {
        let alive = true;
        api.get(`/api/admin/requests/${id}`)
            .then((res) => {
                if (!alive) return;
                setRequest(res.data.request);
                setForm({ status: res.data.request.status, admin_notes: res.data.request.admin_notes || '', scheduled_at: toLocalInput(res.data.request.scheduled_at) });
            })
            .catch((err) => {
                toast(errorMessage(err, 'Could not load the request'), 'error');
                onClose();
            });
        return () => { alive = false; };
    }, [id, toast, onClose]);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.patch(`/api/admin/requests/${id}`, {
                status: form.status,
                admin_notes: form.admin_notes,
                scheduled_at: fromLocalInput(form.scheduled_at)
            });
            setRequest(res.data.request);
            toast('Request updated');
            onChanged();
        } catch (err) {
            toast(errorMessage(err), 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`Delete this ${request.type} from ${request.name} permanently? To keep a record, set it to Closed or Spam instead.`)) return;
        try {
            await api.delete(`/api/admin/requests/${id}`);
            toast('Request deleted');
            onChanged();
            onClose();
        } catch (err) {
            toast(errorMessage(err), 'error');
        }
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const wa = request && whatsappLink(request.phone);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0b1220]/40" role="dialog" aria-modal="true" aria-labelledby="request-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div className="flex h-full w-full max-w-[560px] flex-col overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-adm-line px-6 py-5">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">{request ? `${request.type === 'booking' ? 'Booking' : 'Enquiry'} #${request.id}` : 'Loading'}</p>
                        <h2 id="request-title" className="mt-1 truncate text-[20px] font-bold">{request ? request.name : '…'}</h2>
                        {request && <p className="text-[12px] text-adm-muted">Received {formatDateTime(request.created_at)}{request.source !== 'web' ? ` · imported from the old site` : ''}</p>}
                    </div>
                    <button ref={closeRef} type="button" onClick={onClose} className={`rounded-lg p-1.5 text-adm-muted hover:bg-adm-canvas ${FOCUS}`} aria-label="Close">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {request && form && (
                    <div className="space-y-6 px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                            <a href={`mailto:${request.email}?subject=${encodeURIComponent(`Re: your ${request.type} #${request.id} - ${request.service}`)}`} className={BUTTON.secondary}><Mail size={15} aria-hidden="true" /> Email</a>
                            {request.phone && <a href={`tel:${request.phone.replace(/[^\d+]/g, '')}`} className={BUTTON.secondary}><Phone size={15} aria-hidden="true" /> Call</a>}
                            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className={BUTTON.secondary}><MessageCircle size={15} aria-hidden="true" /> WhatsApp</a>}
                        </div>

                        <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[13px]">
                            <dt className="text-adm-muted">Email</dt><dd className="break-all">{request.email}</dd>
                            <dt className="text-adm-muted">Phone</dt><dd>{request.phone || '—'}</dd>
                            <dt className="text-adm-muted">Company</dt><dd>{request.company || '—'}</dd>
                            <dt className="text-adm-muted">Service</dt><dd>{request.service}</dd>
                            {request.type === 'booking' ? (
                                <><dt className="text-adm-muted">Wants</dt><dd>{formatDay(request.preferred_date)}{request.preferred_slot ? `, ${request.preferred_slot}` : ''}</dd></>
                            ) : (
                                <><dt className="text-adm-muted">Budget</dt><dd>{request.budget || '—'}</dd></>
                            )}
                        </dl>

                        <div>
                            <h3 className="mb-1.5 text-[12px] font-semibold text-[#3d4a62]">Message</h3>
                            <p className="whitespace-pre-wrap break-words rounded-[9px] bg-adm-canvas px-3.5 py-3 text-[14px] text-adm-ink">{request.message || 'No message'}</p>
                        </div>

                        <form onSubmit={save} className="space-y-4 border-t border-adm-line pt-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Status" htmlFor="req-status">
                                    <select id="req-status" value={form.status} onChange={set('status')} className={`${INPUT} bg-white`}>
                                        {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                                    </select>
                                </Field>
                                <Field label="Confirmed time" htmlFor="req-when" hint="Your local time">
                                    <input id="req-when" type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} className={INPUT} />
                                </Field>
                            </div>
                            <Field label="Internal notes" htmlFor="req-notes" hint="Only admins see these">
                                <textarea id="req-notes" rows={4} value={form.admin_notes} onChange={set('admin_notes')} maxLength={4000} className={`${INPUT} h-auto py-2.5`} />
                            </Field>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <button type="button" onClick={remove} className={BUTTON.danger}>Delete</button>
                                <button type="submit" disabled={saving} className={BUTTON.primary}>{saving ? 'Saving…' : 'Save changes'}</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

function RequestsPage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const type = params.get('type') || '';
    const status = params.has('status') ? params.get('status') : 'open';
    const page = Math.max(1, Number(params.get('page')) || 1);
    const openId = Number(params.get('id')) || null;

    const [search, setSearch] = useState(q);
    const debouncedSearch = useDebounced(search, 300);
    const [list, setList] = useState(null);
    const [reload, setReload] = useState(0);
    const [exporting, setExporting] = useState(false);

    const update = useCallback((changes) => {
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
                // "open" is the default tab, so it is kept out of the URL; an empty status means "All".
                if (key === 'status') {
                    if (value === 'open') next.delete('status');
                    else next.set('status', value);
                } else if (value && !(key === 'page' && value === 1)) next.set(key, value);
                else next.delete(key);
            });
            return next;
        }, { replace: true });
    }, [setParams]);

    useEffect(() => {
        if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        api.get('/api/admin/requests', { params: { q, type, status, page, pageSize: PAGE_SIZE } })
            .then((res) => setList(res.data))
            .catch((err) => toast(errorMessage(err, 'Could not load requests'), 'error'));
    }, [q, type, status, page, reload, toast]);

    const refresh = useCallback(() => setReload((n) => n + 1), []);
    const closeDrawer = useCallback(() => update({ id: '', page }), [update, page]);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const res = await api.get('/api/admin/requests/export.csv', { params: { q, type, status }, responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `requests-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast('Export failed. Please try again', 'error');
        } finally {
            setExporting(false);
        }
    };

    const items = list?.items || [];
    const total = list?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <>
            <div className="mb-[25px] flex flex-col items-start justify-between gap-5 nav:flex-row nav:items-end">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">Services</p>
                    <h1 className="mb-[5px] mt-1 text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">Enquiries &amp; bookings</h1>
                    <p className="text-adm-muted">Requests from the contact and booking forms. New ones are listed first.</p>
                </div>
                <button type="button" onClick={exportCsv} disabled={exporting} className={BUTTON.secondary}><Download size={16} aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export CSV'}</button>
            </div>

            <Panel aria-label="Requests">
                <div className="flex flex-wrap items-center gap-2.5 px-[15px] py-[17px] nav:px-[22px]">
                    <label className="relative min-w-[220px] max-w-[440px] flex-1">
                        <span className="sr-only">Search requests</span>
                        <Search size={16} aria-hidden="true" className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#6b778b]" />
                        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, company or message…" className={`${INPUT} pl-[38px]`} />
                    </label>
                    <label>
                        <span className="sr-only">Filter by type</span>
                        <select value={type} onChange={(e) => update({ type: e.target.value })} className={`${INPUT} w-auto bg-white pr-8 text-[#45526a]`}>
                            <option value="">Enquiries and bookings</option>
                            <option value="enquiry">Enquiries only</option>
                            <option value="booking">Bookings only</option>
                        </select>
                    </label>
                </div>

                <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-adm-line px-2.5 nav:px-[22px]">
                    {TABS.map((tab) => {
                        const active = status === tab.key;
                        const count = list ? list.counts[tab.count || tab.key || 'all'] : null;
                        return (
                            <button key={tab.key || 'all'} type="button" role="tab" aria-selected={active} onClick={() => update({ status: tab.key })}
                                className={`whitespace-nowrap border-b-2 px-2 py-[11px] text-[12px] font-semibold nav:px-[13px] ${FOCUS} ${active ? 'border-adm-blue text-adm-blue' : 'border-transparent text-[#5f6b80] hover:text-adm-ink'}`}>
                                {tab.label}
                                <span className="ml-1 rounded-[5px] bg-[#edf1f7] px-1.5 py-0.5 text-[10px] text-[#56637a]">{count ?? '·'}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="overflow-auto">
                    <table className="w-full min-w-[820px] border-collapse">
                        <caption className="sr-only">Enquiries and bookings</caption>
                        <thead>
                            <tr>
                                {['From', 'Request', 'Service', 'Status', 'Received'].map((h) => (
                                    <th key={h} scope="col" className="border-b border-adm-line bg-[#fbfcfe] px-[22px] py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] text-adm-muted">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((r) => (
                                <tr key={r.id} className={`border-b border-[#edf0f5] last:border-0 hover:bg-[#fbfcff] ${r.status === 'new' ? 'bg-[#fafbff]' : ''}`}>
                                    <td className="px-[22px] py-[13px]">
                                        <button type="button" onClick={() => update({ id: r.id, page })} className={`block max-w-[260px] rounded text-left ${FOCUS}`}>
                                            <strong className={`block truncate text-[13px] text-adm-ink hover:text-adm-blue ${r.status === 'new' ? 'font-bold' : 'font-semibold'}`}>{r.name}</strong>
                                            <small className="block truncate text-[12px] text-adm-muted">{r.email}</small>
                                        </button>
                                    </td>
                                    <td className="px-[22px] py-[13px] text-[12px] text-[#39465e]">
                                        {r.type === 'booking' ? (
                                            <span className="flex items-center gap-1.5"><CalendarCheck size={14} aria-hidden="true" className="text-adm-blue" />
                                                <span>Booking · {r.scheduled_at ? formatDateTime(r.scheduled_at) : formatDay(r.preferred_date)}</span>
                                            </span>
                                        ) : (
                                            <span className="line-clamp-2 max-w-[300px]">{r.message || 'Enquiry'}</span>
                                        )}
                                    </td>
                                    <td className="px-[22px] py-[13px]"><Chip>{r.service}</Chip></td>
                                    <td className="px-[22px] py-[13px]"><RequestStatus status={r.status} /></td>
                                    <td className="px-[22px] py-[13px] text-[12px] text-[#39465e]" title={formatDate(r.created_at)}>{timeAgo(r.created_at)}</td>
                                </tr>
                            ))}
                            {list && items.length === 0 && (
                                <tr><td colSpan={5} className="px-[22px] py-12 text-center text-adm-muted">No requests here.</td></tr>
                            )}
                            {!list && (
                                <tr><td colSpan={5} className="px-[22px] py-12 text-center text-adm-muted" role="status">Loading requests…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-adm-line px-[15px] py-[13px] text-[12px] text-adm-muted nav:px-[22px] nav:py-[15px]">
                    <span>{total ? `${total} request${total === 1 ? '' : 's'}` : 'Nothing to show'}</span>
                    <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onChange={(p) => update({ page: p })} />
                </div>
            </Panel>

            {openId && <RequestDrawer key={openId} id={openId} onClose={closeDrawer} onChanged={refresh} />}
        </>
    );
}

export default RequestsPage;
