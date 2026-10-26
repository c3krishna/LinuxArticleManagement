import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/format';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  // Article pages live at /:slug, so anything that isn't another section counts as Articles.
  const isArticles = location.pathname !== '/' && !['/cheatsheets', '/issues', '/forum', '/login', '/register', '/ask-question', '/privacy-policy', '/linux-crash', '/account', '/services', '/contact', '/book', '/tools', '/about', '/terms'].includes(location.pathname) && !location.pathname.startsWith('/forum');

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

        <nav className="hidden lg:flex items-center gap-4 xl:gap-5" aria-label="Main">
          <Link to="/" className={link(location.pathname === '/')}>Home</Link>
          <Link to="/articles" className={link(isArticles)}>Articles</Link>
          <Link to="/cheatsheets" className={link(isActive('/cheatsheets'))}>Cheat sheets</Link>
          <Link to="/issues" className={link(isActive('/issues'))}>Issues</Link>
          <Link to="/forum" className={link(location.pathname.startsWith('/forum') || location.pathname === '/ask-question')}>Forum</Link>
          <Link to="/tools" className={link(isActive('/tools'))}>Tools</Link>
          <Link to="/services" className={link(['/services', '/contact', '/book'].includes(location.pathname))}>Services</Link>
        </nav>

        <div className="flex items-center gap-3 text-[14px]">
          <Link to="/book" className="hidden sm:inline rounded-md border border-white/30 px-3 py-1.5 font-medium text-white hover:bg-white/10">
            Book a call
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin/articles" className="hidden sm:inline font-medium text-slate-300 hover:text-white">
                  Admin
                </Link>
              )}
              <Link to="/account" className="flex items-center gap-2 rounded-full text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" title="My account">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800" aria-hidden="true">{initials(user.name)}</span>
                )}
                <span className="hidden lg:inline max-w-[160px] truncate">{user.name}</span>
                <span className="sr-only lg:hidden">My account</span>
              </Link>
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
          <button className="lg:hidden px-1" onClick={() => setOpen((v) => !v)} aria-label="Menu" aria-expanded={open}>☰</button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden bg-navy border-t border-white/10 px-4 py-3 flex flex-col gap-2">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/articles" onClick={() => setOpen(false)}>Articles</Link>
          <Link to="/cheatsheets" onClick={() => setOpen(false)}>Cheat sheets</Link>
          <Link to="/issues" onClick={() => setOpen(false)}>Issues</Link>
          <Link to="/forum" onClick={() => setOpen(false)}>Forum</Link>
          <Link to="/tools" onClick={() => setOpen(false)}>Network tools</Link>
          <Link to="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link to="/book" onClick={() => setOpen(false)}>Book a call</Link>
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
          {isAdmin && <Link to="/admin/articles" onClick={() => setOpen(false)}>Admin</Link>}
          {user && <Link to="/account" onClick={() => setOpen(false)}>My account</Link>}
          {!user && <Link to="/register" onClick={() => setOpen(false)}>Register</Link>}
        </div>
      )}
    </header>
  );
}

export default Navbar;
