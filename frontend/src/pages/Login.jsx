import { useState } from 'react';
import { auth } from '../api/client';
import PasswordInput from '../components/PasswordInput';
import { getRoleLabel } from '../constants/roles';

const DEMO_USERS = [
  { name: 'Sarah Johnson', email: 'admin@acme.com', password: 'Admin@123', role: 'ADMIN' },
  { name: 'Mike Thompson', email: 'manager@acme.com', password: 'Manager@123', role: 'MANAGER' },
  { name: 'Emily Davis', email: 'member@acme.com', password: 'Member@123', role: 'MEMBER' },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('member@acme.com');
  const [password, setPassword] = useState('Member@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoUser) => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setError('');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Team Task Tracker</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your user account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputClassName="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              Demo users
            </p>
            <p className="mb-3 text-xs text-slate-600">
              Each person is a user; ADMIN / MANAGER / MEMBER is the role assigned to them.
            </p>
            <div className="flex flex-col gap-2">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.email}
                  type="button"
                  onClick={() => fillDemo(demoUser)}
                  className="rounded-lg border border-slate-700/80 bg-slate-800/40 px-4 py-3 text-left transition hover:border-indigo-500/50 hover:bg-slate-800"
                >
                  <p className="font-medium text-slate-200">{demoUser.name}</p>
                  <p className="text-xs text-slate-500">{demoUser.email}</p>
                  <p className="mt-1 text-xs text-indigo-400/90">
                    Assigned role: {getRoleLabel(demoUser.role)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
