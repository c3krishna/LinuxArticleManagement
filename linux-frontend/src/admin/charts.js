import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FOCUS } from './ui';

// Single-series charts in the admin brand blue (validated: passes contrast vs white).
const SERIES = '#3157d5';
const GRID = '#e5eaf1';
const AXIS_TEXT = '#5f6b80';

function useWidth() {
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useLayoutEffect(() => {
        if (!ref.current) return undefined;
        const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
        ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);
    return [ref, width];
}

// Clean axis maximum and tick step: 0 / 5 / 10 / 15 / 20 rather than 0 / 4.75 / 9.5 …
function niceScale(max, ticks = 4) {
    if (max <= 0) return { max: ticks, step: 1 };
    const raw = max / ticks;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
    return { max: step * Math.ceil(max / step), step };
}

function compact(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
}

// Column rounded only at the data end (top), square at the baseline.
function columnPath(x, y, w, h) {
    const r = Math.min(4, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function Tooltip({ left, top, children }) {
    return (
        <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-adm-line bg-white px-3 py-2 text-[12px] shadow-[0_8px_24px_rgba(20,35,65,.12)]"
            style={{ left, top: top - 10 }}
            role="status"
        >
            {children}
        </div>
    );
}

// Views over time: 2px line, 10% area wash, crosshair that snaps to the nearest day.
export function TimeSeriesChart({ data, valueKey, label, formatDate, extra, height = 240 }) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null);
    // Right margin leaves room for the end-value label beside the last point.
    const m = { top: 16, right: 36, bottom: 28, left: 36 };
    const w = Math.max(0, width - m.left - m.right);
    const h = height - m.top - m.bottom;
    const values = data.map((d) => d[valueKey]);
    const { max, step } = niceScale(Math.max(...values, 0));
    const x = (i) => m.left + (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
    const y = (v) => m.top + h - (v / max) * h;

    const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d[valueKey])}`).join('');
    const area = `${line}L${x(data.length - 1)},${m.top + h}L${x(0)},${m.top + h}Z`;
    const ticks = [];
    for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
    const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(w / 80))));
    const last = data.length - 1;

    const pick = useCallback((clientX) => {
        const rect = ref.current.getBoundingClientRect();
        const rel = clientX - rect.left - m.left;
        setActive(Math.max(0, Math.min(last, Math.round((rel / Math.max(w, 1)) * last))));
    }, [ref, w, last, m.left]);

    const onKey = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); setActive((a) => Math.min(last, (a ?? -1) + 1)); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((a) => Math.max(0, (a ?? last + 1) - 1)); }
        if (e.key === 'Escape') setActive(null);
    };

    const total = values.reduce((a, b) => a + b, 0);

    return (
        <div ref={ref} className="relative">
            {width > 0 && (
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={`${label}: ${total} in total over ${data.length} days. Use left and right arrow keys to read each day.`}
                    tabIndex={0}
                    onKeyDown={onKey}
                    onBlur={() => setActive(null)}
                    onPointerMove={(e) => pick(e.clientX)}
                    onPointerLeave={() => setActive(null)}
                    className={`block touch-pan-y rounded-md ${FOCUS}`}
                >
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={m.left} x2={m.left + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
                            <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT} style={{ fontVariantNumeric: 'tabular-nums' }}>{compact(t)}</text>
                        </g>
                    ))}
                    {data.map((d, i) => (i % labelEvery === 0 || i === last) && (i === last || last - i >= labelEvery / 2) ? (
                        <text key={d.date} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'} fontSize="11" fill={AXIS_TEXT}>{formatDate(d.date)}</text>
                    ) : null)}
                    <path d={area} fill={SERIES} fillOpacity="0.1" />
                    <path d={line} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {active !== null && <line x1={x(active)} x2={x(active)} y1={m.top} y2={m.top + h} stroke="#9aa6b8" strokeWidth="1" />}
                    {[active ?? last].map((i) => (
                        <circle key={i} cx={x(i)} cy={y(data[i][valueKey])} r="4.5" fill={SERIES} stroke="#fff" strokeWidth="2" />
                    ))}
                    {active === null && (
                        <text x={x(last) + 9} y={y(values[last])} dy="0.32em" textAnchor="start" fontSize="12" fontWeight="600" fill="#172033">{compact(values[last])}</text>
                    )}
                </svg>
            )}
            {active !== null && width > 0 && (
                <Tooltip left={Math.min(Math.max(x(active), 70), width - 70)} top={y(values[active])}>
                    <strong className="block text-[14px] text-adm-ink">{values[active].toLocaleString()} {label.toLowerCase()}</strong>
                    <span className="text-adm-muted">{formatDate(data[active].date, true)}{extra ? ` · ${extra(data[active])}` : ''}</span>
                </Tooltip>
            )}
        </div>
    );
}

// Vertical columns for a short ordered series (e.g. months). Labels only on the peak; the rest via hover/table.
export function ColumnChart({ data, label, height = 220 }) {
    const [ref, width] = useWidth();
    const [active, setActive] = useState(null);
    const m = { top: 22, right: 8, bottom: 28, left: 32 };
    const w = Math.max(0, width - m.left - m.right);
    const h = height - m.top - m.bottom;
    const values = data.map((d) => d.value);
    const peak = Math.max(...values, 0);
    const { max, step } = niceScale(peak);
    const band = data.length ? w / data.length : 0;
    const barW = Math.min(24, Math.max(4, band - 2));
    const y = (v) => m.top + h - (v / max) * h;
    const ticks = [];
    for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
    const peakIndex = values.indexOf(peak);
    const labelEvery = band < 34 ? 2 : 1;

    return (
        <div ref={ref} className="relative">
            {width > 0 && (
                <svg width={width} height={height} role="img" aria-label={`${label}, ${data.length} periods`} className="block">
                    {ticks.map((t) => (
                        <g key={t}>
                            <line x1={m.left} x2={m.left + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
                            <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill={AXIS_TEXT}>{compact(t)}</text>
                        </g>
                    ))}
                    {data.map((d, i) => {
                        const cx = m.left + band * i + band / 2;
                        const bh = (d.value / max) * h;
                        return (
                            <g key={d.key}>
                                {d.value > 0 && (
                                    <path d={columnPath(cx - barW / 2, m.top + h - bh, barW, bh)} fill={SERIES} fillOpacity={active === null || active === i ? 1 : 0.55} />
                                )}
                                {i === peakIndex && peak > 0 && (
                                    <text x={cx} y={y(d.value) - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill="#172033">{d.value}</text>
                                )}
                                {i % labelEvery === 0 && <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>{d.short}</text>}
                                <rect
                                    x={m.left + band * i}
                                    y={m.top}
                                    width={band}
                                    height={h}
                                    fill="transparent"
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`${d.label}: ${d.value}`}
                                    onPointerEnter={() => setActive(i)}
                                    onPointerLeave={() => setActive(null)}
                                    onFocus={() => setActive(i)}
                                    onBlur={() => setActive(null)}
                                    className="outline-none"
                                />
                            </g>
                        );
                    })}
                </svg>
            )}
            {active !== null && width > 0 && (
                <Tooltip left={Math.min(Math.max(m.left + band * active + band / 2, 60), width - 60)} top={y(data[active].value)}>
                    <strong className="block text-[14px] text-adm-ink">{data[active].value} {label.toLowerCase()}</strong>
                    <span className="text-adm-muted">{data[active].label}</span>
                </Tooltip>
            )}
        </div>
    );
}

// Ranked horizontal bars with the value at the tip. Items may link somewhere.
export function BarList({ items, emptyText }) {
    const max = Math.max(...items.map((i) => i.value), 0);
    if (!items.length || max === 0) {
        return <p className="py-8 text-center text-[13px] text-adm-muted">{emptyText}</p>;
    }
    return (
        <ol className="space-y-3">
            {items.map((item) => (
                <li key={item.key}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
                        {item.href ? (
                            <Link to={item.href} className={`truncate rounded font-medium text-adm-ink hover:text-adm-blue ${FOCUS}`}>{item.label}</Link>
                        ) : (
                            <span className="truncate font-medium text-adm-ink">{item.label}</span>
                        )}
                        <span className="shrink-0 tabular-nums text-[12px] font-semibold text-[#39465e]">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-r bg-[#f0f3f8]" aria-hidden="true">
                        <div className="h-2 rounded-r" style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: SERIES }} />
                    </div>
                </li>
            ))}
        </ol>
    );
}

// Card with a Chart / Table switch so every value is reachable without hovering.
export function ChartCard({ title, subtitle, columns, rows, children, className = '' }) {
    const [table, setTable] = useState(false);
    return (
        <section className={`rounded-[14px] border border-adm-line bg-white p-[18px] shadow-adm nav:p-[22px] ${className}`} aria-label={title}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-[15px] font-bold">{title}</h2>
                    {subtitle && <p className="mt-0.5 text-[12px] text-adm-muted">{subtitle}</p>}
                </div>
                {rows && (
                    <button type="button" onClick={() => setTable((t) => !t)} aria-pressed={table} className={`rounded-[7px] border border-[#e0e6ef] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#4a586f] hover:text-adm-blue ${FOCUS}`}>
                        {table ? 'Chart' : 'Table'}
                    </button>
                )}
            </div>
            {table && rows ? (
                <div className="max-h-[320px] overflow-auto">
                    <table className="w-full text-[13px]">
                        <thead className="sticky top-0 bg-white">
                            <tr>{columns.map((c, i) => <th key={c} scope="col" className={`border-b border-adm-line py-2 font-semibold text-adm-muted ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r[0]} className="border-b border-[#edf0f5] last:border-0">
                                    {r.map((cell, i) => <td key={i} className={`py-1.5 ${i ? 'text-right tabular-nums' : ''}`}>{cell}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : children}
        </section>
    );
}
