import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function Navbar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isAdmin = location.pathname.startsWith('/admin');
  const isDocs = location.pathname === '/' || (!['/cheatsheets', '/issues', '/forum', '/login', '/register', '/ask-question', '/privacy-policy', '/linux-crash'].includes(location.pathname) && !isAdmin && !location.pathname.startsWith('/forum'));

  const link = (active) =>
    `text-[14px] font-medium px-2 py-1 ${active ? 'text-white' : 'text-slate-300 hover:text-white'}`;

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-50 bg-navy text-white h-14">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/SI_logo.svg" alt="" className="w-7 h-7" />
          <span className="text-[15px] font-semibold tracking-tight">Linux Docs</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          <Link to="/" className={link(location.pathname === '/')}>Home</Link>
          <Link to="/" className={link(isDocs && location.pathname !== '/')}>Articles</Link>
          <Link to="/cheatsheets" className={link(isActive('/cheatsheets'))}>Cheat sheets</Link>
          <Link to="/issues" className={link(isActive('/issues'))}>Issues</Link>
          <Link to="/forum" className={link(location.pathname.startsWith('/forum') || location.pathname === '/ask-question')}>Forum</Link>
        </nav>

        <div className="flex items-center gap-3 text-[14px]">
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className={`font-medium ${isAdmin ? 'text-white' : 'text-slate-300 hover:text-white'}`}>
                  Editor
                </Link>
              )}
              <button onClick={logout} className="text-slate-300 hover:text-white">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-300 hover:text-white">Login</Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1.5 rounded-md">
                Register
              </Link>
            </>
          )}
          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-navy border-t border-white/10 px-4 py-3 flex flex-col gap-2">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/cheatsheets" onClick={() => setOpen(false)}>Cheat sheets</Link>
          <Link to="/issues" onClick={() => setOpen(false)}>Issues</Link>
          <Link to="/forum" onClick={() => setOpen(false)}>Forum</Link>
        </div>
      )}
    </header>
  );
}

export default Navbar;
