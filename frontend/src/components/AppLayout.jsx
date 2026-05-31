import { Link, useLocation } from 'react-router-dom';
import { auth } from '../api/client';
import RoleBadge from './RoleBadge';

export default function AppLayout({ user, children, onLogout, actions }) {
  const location = useLocation();
  const isAdmin = user.role === 'ADMIN';

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          active
            ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/40'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Team Task Tracker</p>
                <p className="text-sm font-semibold text-white">{user.name}</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {navLink('/', 'Task Board')}
              {isAdmin && navLink('/users', 'Team Users')}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <RoleBadge role={user.role} />
            {actions}
            <button
              type="button"
              onClick={() => auth.logout().then(onLogout)}
              className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
