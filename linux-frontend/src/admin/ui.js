import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export const FOCUS = 'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#b9c8ff] focus-visible:ring-offset-1';

const BUTTON_BASE = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] px-[15px] py-[10px] text-[14px] font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`;

export const BUTTON = {
    primary: `${BUTTON_BASE} bg-adm-blue border-adm-blue text-white shadow-[0_3px_8px_#3157d52b] hover:bg-adm-blue-dark`,
    secondary: `${BUTTON_BASE} bg-white border-[#dbe2ec] text-[#33415b] hover:bg-[#f8faff]`,
    danger: `${BUTTON_BASE} bg-white border-[#f1caca] text-adm-red hover:bg-adm-red-bg`,
    mini: `inline-flex items-center rounded-[7px] border border-[#e0e6ef] bg-white px-[9px] py-[6px] text-[12px] font-semibold text-[#4a586f] hover:border-[#aebdf4] hover:text-adm-blue ${FOCUS}`
};

export const INPUT = `h-10 w-full rounded-[9px] border border-[#d5dce7] bg-[#fbfcfe] px-3 text-[14px] text-adm-ink placeholder:text-[#7d889b] ${FOCUS} focus-visible:border-adm-blue`;

const STATUS_STYLES = {
    published: 'text-adm-green bg-adm-green-bg',
    draft: 'text-adm-amber bg-adm-amber-bg',
    scheduled: 'text-[#3e52b5] bg-[#eef1ff]',
    active: 'text-adm-green bg-adm-green-bg',
    disabled: 'text-adm-red bg-adm-red-bg',
    admin: 'text-[#3e52b5] bg-[#eef1ff]',
    user: 'text-[#4a586f] bg-[#f0f3f8]'
};

const STATUS_LABELS = { published: 'Published', draft: 'Draft', scheduled: 'Scheduled' };

export function StatusBadge({ status, label }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.user}`}>
            <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-current" />
            {label || STATUS_LABELS[status] || status}
        </span>
    );
}

export function Chip({ children }) {
    return <span className="inline-block rounded-md bg-[#f0f3f8] px-2 py-1 text-[11px] text-[#4a586f]">{children}</span>;
}

export function Panel({ className = '', children, ...rest }) {
    return (
        <section className={`overflow-hidden rounded-[14px] border border-adm-line bg-white shadow-adm ${className}`} {...rest}>
            {children}
        </section>
    );
}

export function Field({ label, htmlFor, hint, error, children, className = '' }) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-[#3d4a62]">{label}</label>
            {children}
            {error ? (
                <p id={`${htmlFor}-error`} className="mt-1.5 text-[12px] font-medium text-adm-red" role="alert">{error}</p>
            ) : hint ? (
                <p id={`${htmlFor}-hint`} className="mt-1.5 text-[12px] text-adm-muted">{hint}</p>
            ) : null}
        </div>
    );
}

// Numbered pages with a window around the current one, e.g. ‹ 1 … 4 5 6 … 12 ›
export function Pagination({ page, pageCount, onChange }) {
    if (pageCount <= 1) return null;
    const pages = new Set([1, pageCount, page - 1, page, page + 1]);
    const list = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
    const btn = `grid h-[30px] min-w-[30px] place-items-center rounded-[7px] border px-1.5 text-[12px] ${FOCUS}`;

    return (
        <nav className="flex items-center gap-[5px]" aria-label="Pagination">
            <button type="button" className={`${btn} border-adm-line bg-white text-[#4a586f] disabled:opacity-40`} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
            {list.map((p, i) => (
                <span key={p} className="flex items-center gap-[5px]">
                    {i > 0 && p - list[i - 1] > 1 && <span className="px-0.5 text-adm-muted" aria-hidden="true">…</span>}
                    <button
                        type="button"
                        onClick={() => onChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                        className={`${btn} ${p === page ? 'border-adm-blue bg-adm-blue text-white' : 'border-adm-line bg-white text-[#4a586f]'}`}
                    >
                        {p}
                    </button>
                </span>
            ))}
            <button type="button" className={`${btn} border-adm-line bg-white text-[#4a586f] disabled:opacity-40`} onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">›</button>
        </nav>
    );
}

// Profile photo when there is one, otherwise initials. Decorative: the name is always shown beside it.
export function Avatar({ text, src, className = '' }) {
    if (src) {
        return <img src={src} alt="" aria-hidden="true" className={`h-[34px] w-[34px] shrink-0 rounded-full object-cover bg-[#dce6ff] ${className}`} />;
    }
    return (
        <span aria-hidden="true" className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#dce6ff] text-[12px] font-bold text-[#2746aa] ${className}`}>
            {text}
        </span>
    );
}

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timer = useRef();

    const show = useCallback((message, type = 'success') => {
        clearTimeout(timer.current);
        setToast({ message, type, id: Date.now() });
        timer.current = setTimeout(() => setToast(null), type === 'error' ? 6000 : 3200);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div className="pointer-events-none fixed bottom-[22px] right-[22px] z-50 max-w-[calc(100vw-44px)]" role="status" aria-live="polite">
                {toast && (
                    <div key={toast.id} className={`pointer-events-auto flex items-start gap-3 rounded-[10px] px-4 py-3 text-[14px] text-white shadow-[0_10px_30px_#17203333] ${toast.type === 'error' ? 'bg-[#9f2d2d]' : 'bg-[#14213a]'}`}>
                        <span aria-hidden="true">{toast.type === 'error' ? '⚠' : '✓'}</span>
                        <span>{toast.message}</span>
                        <button type="button" onClick={() => setToast(null)} className={`ml-2 rounded text-white/80 hover:text-white ${FOCUS}`} aria-label="Dismiss notification">×</button>
                    </div>
                )}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}

// Returns `value` once it has stopped changing for `delay` ms.
export function useDebounced(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}
