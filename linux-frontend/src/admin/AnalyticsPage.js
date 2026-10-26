import { useEffect, useState } from 'react';
import api, { errorMessage } from '../lib/api';
import { formatDate, formatNumber } from '../lib/format';
import { BarList, ChartCard, ColumnChart, TimeSeriesChart } from './charts';
import { FOCUS, useToast } from './ui';

const RANGES = [7, 30, 90];

function dayLabel(iso, long) {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString('en-US', long
        ? { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }
        : { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function monthLabel(key, long) {
    const d = new Date(`${key}-01T00:00:00Z`);
    return d.toLocaleDateString('en-US', long ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'short', timeZone: 'UTC' });
}

function Tile({ label, value, sub, tone }) {
    return (
        <div className="rounded-[14px] border border-adm-line bg-white px-[15px] py-[14px] shadow-adm nav:px-[19px] nav:py-[17px]">
            <p className="text-[12px] text-adm-muted">{label}</p>
            <strong className="mt-1.5 block text-[23px] tracking-[-0.04em] nav:text-[27px]">{value}</strong>
            {sub && <small className={`text-[12px] ${tone === 'up' ? 'text-adm-green' : tone === 'down' ? 'text-adm-red' : 'text-adm-muted'}`}>{sub}</small>}
        </div>
    );
}

function AnalyticsPage() {
    const toast = useToast();
    const [days, setDays] = useState(30);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get('/api/admin/analytics', { params: { days } })
            .then((res) => !cancelled && setData(res.data))
            .catch((err) => !cancelled && toast(errorMessage(err, 'Could not load analytics'), 'error'))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [days, toast]);

    const t = data?.totals;
    let delta = null;
    if (t && t.previousViews > 0) {
        const pct = ((t.views - t.previousViews) / t.previousViews) * 100;
        delta = { sub: `${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}% vs previous ${days} days`, tone: pct >= 0 ? 'up' : 'down' };
    } else if (t) {
        delta = { sub: `No views in the previous ${days} days` };
    }
    const trackingNote = data?.trackingSince ? `View tracking started ${formatDate(data.trackingSince)}.` : 'No views recorded yet.';

    return (
        <>
            <div className="mb-[25px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">Insights</p>
                <h1 className="mb-[5px] mt-1 text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">Analytics</h1>
                <p className="text-adm-muted">Article traffic and publishing activity. {trackingNote} Each visitor counts once per article per day.</p>
            </div>

            <section aria-labelledby="traffic-heading">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="traffic-heading" className="text-[17px] font-bold tracking-[-0.02em]">Traffic</h2>
                    <div role="group" aria-label="Date range" className="inline-flex rounded-[9px] border border-[#dbe2ec] bg-white p-0.5">
                        {RANGES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                aria-pressed={days === r}
                                onClick={() => setDays(r)}
                                className={`rounded-[7px] px-3 py-1.5 text-[12px] font-semibold ${FOCUS} ${days === r ? 'bg-adm-blue text-white' : 'text-[#45526a] hover:bg-[#f5f7fb]'}`}
                            >
                                Last {r} days
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`space-y-5 transition-opacity ${loading && data ? 'opacity-60' : ''}`} aria-busy={loading}>
                    <div className="grid grid-cols-2 gap-[9px] nav:gap-[15px] wide:grid-cols-4">
                        <Tile label="Article views" value={t ? formatNumber(t.views) : '—'} sub={delta?.sub} tone={delta?.tone} />
                        <Tile label="Unique visitors" value={t ? formatNumber(t.visitors) : '—'} sub="Distinct IP addresses" />
                        <Tile label="Articles read" value={t ? formatNumber(t.articles) : '—'} sub="With at least one view" />
                        <Tile label="Views per visitor" value={t && t.visitors ? (t.views / t.visitors).toFixed(1) : '—'} sub="Average in this range" />
                    </div>

                    {data && (
                        <ChartCard
                            title="Views per day"
                            subtitle={`Last ${days} days, UTC`}
                            columns={['Date', 'Views', 'Visitors']}
                            rows={[...data.daily].reverse().map((d) => [dayLabel(d.date, true), d.views, d.visitors])}
                        >
                            <TimeSeriesChart
                                data={data.daily}
                                valueKey="views"
                                label="Views"
                                formatDate={dayLabel}
                                extra={(d) => `${d.visitors} ${d.visitors === 1 ? 'visitor' : 'visitors'}`}
                            />
                        </ChartCard>
                    )}

                    {data && (
                        <div className="grid grid-cols-1 gap-5 wide:grid-cols-2">
                            <ChartCard
                                title="Top articles"
                                subtitle={`Most viewed in the last ${days} days`}
                                columns={['Article', 'Views']}
                                rows={data.topArticles.map((a) => [a.title, a.views])}
                            >
                                <BarList
                                    items={data.topArticles.map((a) => ({ key: a.id, label: a.title, value: a.views, href: `/admin/articles/${a.id}/edit` }))}
                                    emptyText="No article views in this range yet."
                                />
                            </ChartCard>
                            <ChartCard
                                title="Views by category"
                                subtitle={`Last ${days} days`}
                                columns={['Category', 'Views']}
                                rows={data.byCategory.map((c) => [c.category, c.views])}
                            >
                                <BarList
                                    items={data.byCategory.map((c) => ({ key: c.category, label: c.category, value: c.views, href: `/admin/articles?category=${encodeURIComponent(c.category)}` }))}
                                    emptyText="No category views in this range yet."
                                />
                            </ChartCard>
                        </div>
                    )}
                </div>
            </section>

            {data && (
                <section aria-labelledby="publishing-heading" className="mt-8">
                    <h2 id="publishing-heading" className="mb-4 text-[17px] font-bold tracking-[-0.02em]">Publishing</h2>
                    <ChartCard
                        title="Articles published per month"
                        subtitle="Last 12 months · not affected by the traffic date range"
                        columns={['Month', 'Articles']}
                        rows={[...data.publishedByMonth].reverse().map((m) => [monthLabel(m.month, true), m.articles])}
                    >
                        <ColumnChart
                            label="Articles"
                            data={data.publishedByMonth.map((m) => ({ key: m.month, value: m.articles, label: monthLabel(m.month, true), short: monthLabel(m.month) }))}
                        />
                    </ChartCard>
                </section>
            )}

            {!data && loading && <p className="py-16 text-center text-adm-muted" role="status">Loading analytics…</p>}
        </>
    );
}

export default AnalyticsPage;
