import { useState } from 'react';
import { BookOpen, Eye, EyeOff, MessagesSquare, ShieldCheck } from 'lucide-react';

export const AUTH_FOCUS = 'focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#b9c8ff] focus-visible:ring-offset-1';
export const AUTH_INPUT = `h-11 w-full rounded-[10px] border border-[#d5dce7] bg-[#fbfcfe] px-3.5 text-[15px] text-adm-ink placeholder:text-[#7d889b] ${AUTH_FOCUS} focus-visible:border-adm-blue aria-[invalid=true]:border-adm-red`;
export const AUTH_BUTTON = `inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-adm-blue text-[15px] font-semibold text-white shadow-[0_3px_8px_#3157d52b] hover:bg-adm-blue-dark disabled:opacity-60 ${AUTH_FOCUS}`;

const POINTS = [
    { icon: BookOpen, title: 'Read everything', text: 'Every guide, cheat sheet and crash analysis.' },
    { icon: MessagesSquare, title: 'Ask the community', text: 'Signed-in readers can ask and answer in the forum.' },
    { icon: ShieldCheck, title: 'Curated by admins', text: 'Only administrators publish and edit articles.' }
];

// Split card used by the login and registration pages.
function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-adm-canvas px-4 py-10 font-admin">
            <div className="grid w-full max-w-[920px] overflow-hidden rounded-[18px] border border-adm-line bg-white shadow-[0_18px_50px_rgba(20,35,65,.08)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="hidden flex-col justify-between gap-10 bg-adm-side p-9 text-[#dbe4f4] md:flex">
                    <div className="flex items-center gap-[11px]">
                        <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[#4f70ec] font-bold tracking-[-0.04em] text-white" aria-hidden="true">LD</span>
                        <span>
                            <strong className="block text-[16px] tracking-[-0.02em] text-white">LinuxDocs</strong>
                            <small className="block text-[10px] font-bold tracking-[0.13em] text-adm-side-muted">KNOWLEDGE HUB</small>
                        </span>
                    </div>
                    <ul className="space-y-5">
                        {POINTS.map(({ icon: Icon, title: t, text }) => (
                            <li key={t} className="flex gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-adm-side-active text-white" aria-hidden="true"><Icon size={17} /></span>
                                <span>
                                    <strong className="block text-[14px] text-white">{t}</strong>
                                    <span className="text-[13px] text-adm-side-text">{text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-[12px] text-adm-side-muted">Practical Linux, DevOps and infrastructure knowledge.</p>
                </div>

                <div className="px-6 py-9 sm:px-10 sm:py-11">
                    <h1 className="text-[26px] font-bold tracking-[-0.03em] text-adm-ink">{title}</h1>
                    <p className="mb-7 mt-1 text-[14px] text-adm-muted">{subtitle}</p>
                    {children}
                    {footer && <div className="mt-7 border-t border-adm-line pt-5 text-center text-[14px] text-adm-muted">{footer}</div>}
                </div>
            </div>
        </div>
    );
}

export function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className={`${AUTH_INPUT} pr-12`}
                required
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className={`absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-adm-muted hover:bg-adm-canvas hover:text-adm-ink ${AUTH_FOCUS}`}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
        </div>
    );
}

export function Notice({ tone = 'info', children }) {
    const styles = tone === 'error'
        ? 'border-[#f1caca] bg-adm-red-bg text-[#8f2a2a]'
        : 'border-[#c9d6fb] bg-adm-blue-soft text-[#2a3f9e]';
    return <div className={`mb-5 rounded-[10px] border px-3.5 py-2.5 text-[13px] font-medium ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

// Only same-site paths are allowed as post-login redirects.
export function safeNext(value) {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

export default AuthShell;
