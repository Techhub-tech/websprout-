import React, { useState } from 'react';
import { usePopup } from '../context/PopupContext';

export default function LoginPage({ onAuthSuccess, onNavigate }) {
  const { notify } = usePopup();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalCode, setPortalCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal_code: portalCode })
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Login failed.', 'error');
      } else {
        onAuthSuccess(data.token, data.user);
        notify(`Welcome back, ${data.user.full_name}!`, 'success');
        onNavigate(data.user.role === 'admin' ? 'admin' : 'portal');
      }
    } catch {
      notify('Could not connect to backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 shadow-xl">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
          Dedicated Login Page
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-white">Log In to WebSprout Hub</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Password or Login PIN *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password or 6-digit PIN"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Portal Code (Optional)</label>
            <input
              type="text"
              value={portalCode}
              onChange={(e) => setPortalCode(e.target.value)}
              placeholder="e.g., WSH-A1B2C3"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm uppercase text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? 'Signing In...' : 'Log In'}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-4 text-xs">
          <button type="button" onClick={() => onNavigate('forgot-password')} className="font-semibold text-emerald-300 hover:underline">
            Forgot Password?
          </button>
          <button type="button" onClick={() => onNavigate('forgot-email')} className="font-semibold text-emerald-300 hover:underline">
            Forgot Email?
          </button>
          <button type="button" onClick={() => onNavigate('signup')} className="font-semibold text-slate-300 hover:text-white">
            Sign Up →
          </button>
        </div>
      </div>
    </div>
  );
}
