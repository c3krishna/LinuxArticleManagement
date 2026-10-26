import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isDocs = location.pathname === '/' || (!['/cheatsheets', '/issues', '/forum', '/login', '/register', '/ask-question', '/privacy-policy', '/linux-crash'].includes(location.pathname) && !location.pathname.startsWith('/forum'));

  const link = (active) =>
    `text-[14px] font-medium px-2 py-1 rounded ${active ? 'text-white' : 'text-slate-300 hover:text-white'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300`;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-navy text-white h-14">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/SI_logo.svg" alt="" className="w-7 h-7" />
          <span className="text-[15px] font-semibold tracking-tight">Linux Docs</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5" aria-label="Main">
          <Link to="/" className={link(location.pathname === '/')}>Home</Link>
          <Link to="/" className={link(isDocs && location.pathname !== '/')}>Articles</Link>
          <Link to="/cheatsheets" className={link(isActive('/cheatsheets'))}>Cheat sheets</Link>
          <Link to="/issues" className={link(isActive('/issues'))}>Issues</Link>
          <Link to="/forum" className={link(location.pathname.startsWith('/forum') || location.pathname === '/ask-question')}>Forum</Link>
        </nav>

        <div className="flex items-center gap-3 text-[14px]">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin/articles" className="hidden sm:inline font-medium text-slate-300 hover:text-white">
                  Admin
                </Link>
              )}
              <span className="hidden lg:inline text-slate-400 max-w-[160px] truncate" title={user.email}>{user.name}</span>
              <button onClick={handleLogout} className="text-slate-300 hover:text-white">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white">Log in</Link>
              <Link to="/register" className="hidden sm:inline bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md">
                Register
              </Link>
            </>
          )}
          <button className="md:hidden px-1" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>☰</button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-navy border-t border-white/10 px-4 py-3 flex flex-col gap-2">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/cheatsheets" onClick={() => setOpen(false)}>Cheat sheets</Link>
          <Link to="/issues" onClick={() => setOpen(false)}>Issues</Link>
          <Link to="/forum" onClick={() => setOpen(false)}>Forum</Link>
          {isAdmin && <Link to="/admin/articles" onClick={() => setOpen(false)}>Admin</Link>}
          {!user && <Link to="/register" onClick={() => setOpen(false)}>Register</Link>}
        </div>
      )}
    </header>
  );
}

export default Navbar;
