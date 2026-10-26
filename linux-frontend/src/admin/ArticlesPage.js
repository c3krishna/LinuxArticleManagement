import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Clock, Download, ExternalLink, FileText, LayoutGrid, PenLine, Plus, Search, Trash2, TrendingUp, Users } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatDate, formatDateTime, formatNumber, timeAgo } from '../lib/format';
import { BUTTON, Chip, FOCUS, INPUT, Pagination, Panel, StatusBadge, useDebounced, useToast } from './ui';

const PAGE_SIZE = 20;
const TABS = [
    { key: '', label: 'All', count: 'all' },
    { key: 'published', label: 'Published', count: 'published' },
    { key: 'draft', label: 'Drafts', count: 'draft' },
    { key: 'scheduled', label: 'Scheduled', count: 'scheduled' }
];

const ACTIVITY = {
    published: { icon: Check, text: (a) => `Published${a.user_name ? ` by ${a.user_name}` : ''}` },
    auto_published: { icon: Check, text: () => 'Published on schedule' },
    scheduled: { icon: Clock, text: (a) => `Scheduled for publication${a.user_name ? ` by ${a.user_name}` : ''}` },
    unpublished: { icon: PenLine, text: (a) => `Moved back to draft${a.user_name ? ` by ${a.user_name}` : ''}` },
    draft_created: { icon: PenLine, text: (a) => `Draft created${a.user_name ? ` by ${a.user_name}` : ''}` },
    draft_saved: { icon: PenLine, text: (a) => `Draft updated${a.user_name ? ` by ${a.user_name}` : ''}` },
    updated: { icon: PenLine, text: (a) => `Updated${a.user_name ? ` by ${a.user_name}` : ''}` },
    deleted: { icon: Trash2, text: (a) => `Deleted${a.user_name ? ` by ${a.user_name}` : ''}` },
    user_created: { icon: Users, text: () => 'Account created' },
    role_changed: { icon: Users, text: () => 'Role changed' },
    user_disabled: { icon: Users, text: () => 'Account disabled' },
    user_enabled: { icon: Users, text: () => 'Account re-enabled' },
    user_deleted: { icon: Users, text: () => 'Account deleted' },
    password_reset: { icon: Users, text: () => 'Password reset by an admin' }
};

function StatCard({ label, icon: Icon, value, sub, positive }) {
    return (
        <div className="rounded-[14px] border border-adm-line bg-white px-[13px] py-[13px] shadow-adm nav:px-[19px] nav:py-[17px]">
            <div className="flex items-center justify-between text-[12px] text-adm-muted">
                {label}
                <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f0f3ff] text-adm-blue" aria-hidden="true"><Icon size={16} /></span>
            </div>
            <strong className="mt-2 block text-[23px] tracking-[-0.04em] nav:text-[27px]">{value}</strong>
            <small className={`text-[12px] ${positive ? 'text-adm-green' : 'text-adm-muted'}`}>{sub}</small>
        </div>
    );
}

function viewsTrend(stats) {
    if (!stats.viewsLastMonth) return { sub: stats.viewsThisMonth ? 'First month with tracked views' : 'No views recorded yet', positive: false };
    const change = ((stats.viewsThisMonth - stats.viewsLastMonth) / stats.viewsLastMonth) * 100;
    return { sub: `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% vs last month`, positive: change >= 0 };
}

function ArticlesPage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const category = params.get('category') || '';
    const status = params.get('status') || '';
    const sort = params.get('sort') || 'updated';
    const page = Math.max(1, Number(params.get('page')) || 1);

    const [search, setSearch] = useState(q);
    const debouncedSearch = useDebounced(search, 300);
    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [categories, setCategories] = useState([]);
    const [activity, setActivity] = useState([]);
    const [exporting, setExporting] = useState(false);

    // Changing any filter returns to page 1.
    const update = (changes) => {
        const next = new URLSearchParams(params);
        Object.entries({ page: '', ...changes }).forEach(([key, value]) => {
            if (value && !(key === 'sort' && value === 'updated') && !(key === 'page' && value === 1)) next.set(key, value);
            else next.delete(key);
        });
        setParams(next, { replace: true });
    };

    useEffect(() => {
        if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        api.get('/api/admin/stats').then((res) => setStats(res.data)).catch(() => {});
        api.get('/api/admin/categories').then((res) => setCategories(res.data)).catch(() => {});
        api.get('/api/admin/activity', { params: { limit: 6 } }).then((res) => setActivity(res.data)).catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get('/api/admin/articles', { params: { q, category, status, sort, page, pageSize: PAGE_SIZE } })
            .then((res) => !cancelled && setList(res.data))
            .catch((err) => !cancelled && toast(errorMessage(err, 'Could not load articles'), 'error'))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [q, category, status, sort, page, toast]);

    const exportCsv = async () => {
        setExporting(true);
        try {
            const res = await api.get('/api/admin/articles/export.csv', { params: { q, category, status, sort }, responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `articles-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast(`Exported ${total} article${total === 1 ? '' : 's'}`);
        } catch (err) {
            toast('Export failed. Please try again', 'error');
        } finally {
            setExporting(false);
        }
    };

    const items = list?.items || [];
    const total = list?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const from = total ? (page - 1) * PAGE_SIZE + 1 : 0;
    const to = Math.min(page * PAGE_SIZE, total);
    const filtered = Boolean(q || category || status);
    const trend = stats ? viewsTrend(stats) : null;

    return (
        <>
            <div className="mb-[25px] flex flex-col items-start justify-between gap-5 nav:flex-row nav:items-end">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">Content workspace</p>
                    <h1 className="mb-[5px] mt-1 text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">Articles</h1>
                    <p className="text-adm-muted">Create, organize and publish your Linux knowledge base.</p>
                </div>
                <Link to="/admin/articles/new" className={BUTTON.primary}><Plus size={16} aria-hidden="true" /> New article</Link>
            </div>

            <section aria-label="Article summary" className="mb-6 grid grid-cols-2 gap-[9px] nav:gap-[15px] wide:grid-cols-4">
                <StatCard label="Total articles" icon={FileText} value={stats ? formatNumber(stats.total) : '—'} sub={`Across ${categories.length} categories`} />
                <StatCard label="Published" icon={Check} value={stats ? formatNumber(stats.published) : '—'} sub={stats ? `● ${stats.publishedThisMonth} published this month` : ''} positive={stats?.publishedThisMonth > 0} />
                <StatCard label="Drafts" icon={PenLine} value={stats ? formatNumber(stats.drafts) : '—'} sub={stats ? `${stats.draftsRecent} updated in the last 7 days` : ''} />
                <StatCard label="Views this month" icon={TrendingUp} value={stats ? formatNumber(stats.viewsThisMonth) : '—'} sub={trend?.sub} positive={trend?.positive} />
            </section>

            <Panel aria-labelledby="all-articles">
                <div className="flex items-center justify-between gap-4 px-[15px] pb-4 pt-[17px] nav:px-[22px] nav:pt-5">
                    <div>
                        <h2 id="all-articles" className="text-[16px] font-bold tracking-[-0.02em]">All articles</h2>
                        <p className="mt-[3px] text-[12px] text-adm-muted">Manage content, publication status and updates.</p>
                    </div>
                    <button type="button" onClick={exportCsv} disabled={exporting || !total} className={BUTTON.secondary}>
                        <Download size={15} aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export'}
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 px-[15px] pb-[17px] nav:px-[22px]">
                    <label className="relative min-w-[220px] max-w-[440px] flex-1">
                        <span className="sr-only">Search articles</span>
                        <Search size={16} aria-hidden="true" className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#6b778b]" />
                        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, slug or tag…" className={`${INPUT} pl-[38px]`} />
                    </label>
                    <label>
                        <span className="sr-only">Filter by category</span>
                        <select value={category} onChange={(e) => update({ category: e.target.value })} className={`${INPUT} w-auto bg-white pr-8 text-[#45526a]`}>
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                    </label>
                    <label>
                        <span className="sr-only">Sort articles</span>
                        <select value={sort} onChange={(e) => update({ sort: e.target.value })} className={`${INPUT} w-auto bg-white pr-8 text-[#45526a]`}>
                            <option value="updated">Recently updated</option>
                            <option value="title">Title A–Z</option>
                            <option value="views">Most viewed</option>
                        </select>
                    </label>
                </div>

                <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto border-b border-adm-line px-2.5 nav:px-[22px]">
                    {TABS.map((tab) => {
                        const active = status === tab.key;
                        return (
                            <button
                                key={tab.key || 'all'}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => update({ status: tab.key })}
                                className={`whitespace-nowrap border-b-2 px-2 py-[11px] text-[12px] font-semibold nav:px-[13px] ${FOCUS} ${active ? 'border-adm-blue text-adm-blue' : 'border-transparent text-[#5f6b80] hover:text-adm-ink'}`}
                            >
                                {tab.label}
                                <span className="ml-1 rounded-[5px] bg-[#edf1f7] px-1.5 py-0.5 text-[10px] text-[#56637a]">{list ? list.counts[tab.count] : '·'}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="overflow-auto" aria-busy={loading}>
                    <table className="w-full min-w-[760px] border-collapse">
                        <caption className="sr-only">Articles, {status || 'all statuses'}</caption>
                        <thead>
                            <tr>
                                {['Article', 'Category', 'Status', 'Views', 'Last updated', 'Actions'].map((h) => (
                                    <th key={h} scope="col" className="border-b border-adm-line bg-[#fbfcfe] px-[22px] py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] text-adm-muted">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={loading && list ? 'opacity-60' : ''}>
                            {items.map((a) => (
                                <tr key={a.id} className="border-b border-[#edf0f5] last:border-0 hover:bg-[#fbfcff]">
                                    <td className="px-[22px] py-[15px]">
                                        <div className="flex min-w-[260px] items-center gap-3">
                                            <span aria-hidden="true" className="grid h-[42px] w-[38px] shrink-0 place-items-center rounded-lg border border-[#dfe5f0] bg-[#f7f9fd] text-[#5069b6]"><FileText size={17} /></span>
                                            <div className="min-w-0">
                                                <Link to={`/admin/articles/${a.id}/edit`} className={`block rounded text-[13px] font-semibold text-[#1d2940] hover:text-adm-blue ${FOCUS}`}>{a.title}</Link>
                                                <small className="mt-[3px] block font-admin-mono text-[11px] text-adm-muted">/{a.slug}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-[22px] py-[15px]">{a.category ? <Chip>{a.category}</Chip> : <span className="text-[12px] text-adm-muted">—</span>}</td>
                                    <td className="px-[22px] py-[15px]">
                                        <StatusBadge status={a.status} />
                                        {a.status === 'scheduled' && <small className="mt-1 block text-[11px] text-adm-muted">{formatDateTime(a.scheduled_at)}</small>}
                                        {a.visibility === 'unlisted' && <small className="mt-1 block text-[11px] text-adm-muted">Unlisted</small>}
                                    </td>
                                    <td className="px-[22px] py-[15px] text-[12px] tabular-nums text-[#39465e]">{a.status === 'published' || a.views ? formatNumber(a.views) : '—'}</td>
                                    <td className="px-[22px] py-[15px] text-[12px] tabular-nums text-[#39465e]">{formatDate(a.updated_at)}</td>
                                    <td className="px-[22px] py-[15px]">
                                        <div className="flex gap-1.5">
                                            <Link to={`/admin/articles/${a.id}/edit`} className={BUTTON.mini} aria-label={`Edit ${a.title}`}>Edit</Link>
                                            <a href={`/admin/articles/${a.id}/preview`} target="_blank" rel="noreferrer" className={BUTTON.mini} aria-label={`Preview ${a.title} (opens in a new tab)`}>Preview</a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-[22px] py-14 text-center">
                                        <p className="font-semibold">{filtered ? 'No articles match these filters' : 'No articles yet'}</p>
                                        {filtered ? (
                                            <button type="button" className={`${BUTTON.secondary} mt-4`} onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear filters</button>
                                        ) : (
                                            <Link to="/admin/articles/new" className={`${BUTTON.primary} mt-4`}>Write the first article</Link>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {loading && !list && (
                                <tr><td colSpan={6} className="px-[22px] py-14 text-center text-adm-muted" role="status">Loading articles…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-adm-line px-[15px] py-[13px] text-[12px] text-adm-muted nav:px-[22px] nav:py-[15px]">
                    <span>{total ? `Showing ${from}–${to} of ${total} articles` : 'No articles to show'}</span>
                    <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} onChange={(p) => update({ page: p })} />
                </div>
            </Panel>

            <div className="mt-5 grid grid-cols-1 gap-3 nav:gap-[18px] wide:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
                <Panel className="px-[22px] py-[19px]" aria-labelledby="recent-activity">
                    <h2 id="recent-activity" className="mb-[15px] text-[15px] font-bold">Recent activity</h2>
                    {activity.length === 0 && <p className="text-[13px] text-adm-muted">No activity yet. Publishing, scheduling and edits will appear here.</p>}
                    <ul>
                        {activity.map((a) => {
                            const meta = ACTIVITY[a.action] || { icon: PenLine, text: () => a.action };
                            const Icon = meta.icon;
                            const link = a.entity_type === 'document' && a.action !== 'deleted' ? `/admin/articles/${a.entity_id}/edit` : null;
                            return (
                                <li key={a.id} className="flex gap-[11px] border-b border-[#edf0f5] py-2.5 last:border-0">
                                    <span aria-hidden="true" className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[#eff3ff] text-[#3e5fd1]"><Icon size={15} /></span>
                                    <div className="min-w-0">
                                        {link ? (
                                            <Link to={link} className={`block truncate rounded text-[12px] font-semibold hover:text-adm-blue ${FOCUS}`}>{a.summary}</Link>
                                        ) : (
                                            <strong className="block truncate text-[12px] font-semibold">{a.summary}</strong>
                                        )}
                                        <p className="mt-0.5 text-[11px] text-adm-muted">{meta.text(a)}</p>
                                    </div>
                                    <time dateTime={a.created_at} title={formatDateTime(a.created_at)} className="ml-auto whitespace-nowrap text-[11px] text-adm-muted">{timeAgo(a.created_at)}</time>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>

                <Panel className="px-[22px] py-[19px]" aria-labelledby="quick-actions">
                    <h2 id="quick-actions" className="mb-[15px] text-[15px] font-bold">Quick actions</h2>
                    <div className="grid grid-cols-2 gap-[9px]">
                        {[
                            { to: '/admin/articles/new', icon: Plus, title: 'New article', sub: 'Start a draft' },
                            { to: '/admin/categories', icon: LayoutGrid, title: 'Manage categories', sub: 'Organize your knowledge base' },
                            { to: '/admin/users', icon: Users, title: 'Users & roles', sub: 'Who can publish' },
                            { href: '/', icon: ExternalLink, title: 'View public site', sub: 'Opens in a new tab' }
                        ].map((item) => {
                            const body = (
                                <>
                                    <item.icon size={18} aria-hidden="true" className="mb-[7px] text-adm-blue" />
                                    <strong className="block text-[12px]">{item.title}</strong>
                                    <small className="text-[11px] text-adm-muted">{item.sub}</small>
                                </>
                            );
                            const cls = `block rounded-[10px] border border-adm-line p-[13px] text-[#34415b] hover:border-[#b8c6fa] hover:bg-[#f8f9ff] ${FOCUS}`;
                            return item.to
                                ? <Link key={item.title} to={item.to} className={cls}>{body}</Link>
                                : <a key={item.title} href={item.href} target="_blank" rel="noreferrer" className={cls}>{body}</a>;
                        })}
                    </div>
                </Panel>
            </div>
        </>
    );
}

export default ArticlesPage;
