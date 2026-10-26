import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ExternalLink, FileText, Inbox, LayoutGrid, LogOut, UserRound, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';
import { Avatar, FOCUS, ToastProvider } from './ui';

const NAV = [
    { to: '/admin/articles', label: 'Articles', icon: FileText },
    { to: '/admin/categories', label: 'Categories', icon: LayoutGrid },
    { to: '/admin/requests', label: 'Enquiries', icon: Inbox },
    { to: '/admin/users', label: 'Users & roles', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
];

function crumbFor(pathname) {
    if (pathname.startsWith('/admin/articles/new')) return ['Articles', 'New article'];
    if (/^\/admin\/articles\/\d+\/edit/.test(pathname)) return ['Articles', 'Edit article'];
    if (pathname.startsWith('/admin/categories')) return ['Categories'];
    if (pathname.startsWith('/admin/users')) return ['Users & roles'];
    if (pathname.startsWith('/admin/analytics')) return ['Analytics'];
    if (pathname.startsWith('/admin/requests')) return ['Enquiries & bookings'];
    return ['Articles'];
}

function AccountMenu({ user, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const close = (e) => {
            if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', close);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${user.name}`}
                className={`rounded-full ${FOCUS}`}
            >
                <Avatar text={initials(user.name)} src={user.avatar_url} />
            </button>
            {open && (
                <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 rounded-[12px] border border-adm-line bg-white p-2 shadow-[0_12px_32px_rgba(20,35,65,.14)]">
                    <div className="border-b border-adm-line px-3 pb-2.5 pt-1.5">
                        <p className="truncate text-[13px] font-semibold text-adm-ink">{user.name}</p>
                        <p className="truncate text-[12px] text-adm-muted">{user.email}</p>
                    </div>
                    <Link
                        to="/account"
                        role="menuitem"
                        className={`mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#33415b] hover:bg-[#f5f7fb] ${FOCUS}`}
                    >
                        <UserRound size={15} aria-hidden="true" /> My account &amp; photo
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={onLogout}
                        className={`mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-[#33415b] hover:bg-[#f5f7fb] ${FOCUS}`}
                    >
                        <LogOut size={15} aria-hidden="true" /> Log out
                    </button>
                </div>
            )}
        </div>
    );
}

function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const crumb = crumbFor(pathname);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <ToastProvider>
            <div className="min-h-screen bg-adm-canvas font-admin text-[14px] leading-normal text-adm-ink nav:grid nav:grid-cols-[210px_minmax(0,1fr)] wide:grid-cols-[248px_minmax(0,1fr)]">
                <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-adm-blue">
                    Skip to content
                </a>

                {/* The wrapper paints the dark column for the full page height; the sidebar itself stays in view. */}
                <div className="bg-adm-side">
                <aside className="flex flex-col gap-3.5 bg-adm-side p-3.5 text-[#dbe4f4] nav:sticky nav:top-0 nav:h-screen nav:gap-7 nav:px-4 nav:py-6">
                    <Link to="/admin/articles" className={`flex items-center gap-[11px] rounded-lg px-1 nav:px-2 ${FOCUS}`}>
                        <span className="grid h-[38px] w-[38px] place-items-center rounded-[12px] bg-[#4f70ec] font-bold tracking-[-0.04em] text-white" aria-hidden="true">LD</span>
                        <span>
                            <strong className="block text-[16px] tracking-[-0.02em] text-white">LinuxDocs</strong>
                            <small className="block text-[10px] font-bold tracking-[0.13em] text-adm-side-muted">KNOWLEDGE HUB</small>
                        </span>
                    </Link>

                    <div>
                        <p className="mb-[7px] hidden px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-adm-side-muted nav:block">Workspace</p>
                        <nav aria-label="Admin" className="grid grid-cols-2 gap-1 min-[420px]:grid-cols-5 nav:grid-cols-1">
                            {NAV.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    className={({ isActive }) => `flex items-center justify-center gap-[5px] rounded-[9px] px-[5px] py-[9px] text-[11px] nav:justify-start nav:gap-3 nav:px-3 nav:py-2.5 nav:text-[14px] ${FOCUS} ${
                                        isActive ? 'bg-adm-side-active font-semibold text-white' : 'text-adm-side-text hover:bg-adm-side-hover hover:text-white'
                                    }`}
                                >
                                    <Icon size={17} aria-hidden="true" className="shrink-0" />
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto hidden border-t border-adm-side-line px-2 pt-[18px] nav:block">
                        <div className="flex items-center gap-2.5">
                            <Avatar text={initials(user.name)} src={user.avatar_url} />
                            <div className="min-w-0 flex-1">
                                <strong className="block truncate text-[12px] text-white">{user.name}</strong>
                                <small className="block text-[11px] text-adm-side-muted">Administrator</small>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className={`rounded-lg p-2 text-adm-side-text hover:bg-adm-side-hover hover:text-white ${FOCUS}`}
                                aria-label="Log out"
                                title="Log out"
                            >
                                <LogOut size={16} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </aside>
                </div>

                <div className="min-w-0">
                    <header className="flex h-[58px] items-center justify-between gap-5 border-b border-adm-line bg-white px-4 nav:h-[76px] nav:px-[22px] wide:px-[34px]">
                        <nav aria-label="Breadcrumb" className="text-[12px] text-adm-muted">
                            <ol className="flex items-center gap-2">
                                <li>Workspace</li>
                                {crumb.map((part, i) => (
                                    <li key={part} className="flex items-center gap-2">
                                        <span aria-hidden="true">/</span>
                                        {i === crumb.length - 1 ? (
                                            <b className="font-semibold text-adm-ink" aria-current="page">{part}</b>
                                        ) : (
                                            <Link to="/admin/articles" className={`rounded hover:text-adm-ink ${FOCUS}`}>{part}</Link>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                        <div className="flex items-center gap-3">
                            <a href="/" target="_blank" rel="noreferrer" className={`hidden items-center gap-1 rounded text-[12px] font-semibold text-[#44546f] hover:text-adm-blue nav:inline-flex ${FOCUS}`}>
                                View public site <ExternalLink size={13} aria-hidden="true" />
                            </a>
                            <AccountMenu user={user} onLogout={handleLogout} />
                        </div>
                    </header>

                    <main id="admin-main" className="mx-auto max-w-[1600px] px-3.5 pb-11 pt-[22px] nav:px-[22px] nav:pt-[25px] wide:px-[34px] wide:pt-[30px]">
                        <Outlet />
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}

export default AdminLayout;
