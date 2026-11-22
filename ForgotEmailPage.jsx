import React, { useState } from 'react';
import { usePopup } from '../context/PopupContext';

export default function ForgotEmailPage({ onNavigate }) {
  const { notify, openModal } = usePopup();
  const [phone, setPhone] = useState('');
  const [portalCode, setPortalCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, portal_code: portalCode })
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not retrieve email.', 'error');
      } else {
        notify('Account email found!', 'success');
        openModal({
          badge: 'Email Lookup',
          title: 'Account Email Found',
          body: (
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p><strong>Name:</strong> {data.full_name}</p>
              <p><strong>Email:</strong> <span className="font-mono text-emerald-300">{data.email}</span></p>
              <p><strong>Portal ID:</strong> <span className="font-mono text-emerald-300">{data.portal_code}</span></p>
            </div>
          ),
          confirmLabel: 'Go to Login'
        });
        onNavigate('login');
      }
    } catch {
      notify('Network error looking up email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 shadow-xl">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
          Dedicated Recovery Page
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-white">Forgot Your Email?</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07049111844"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Or Portal ID</label>
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
            {loading ? 'Searching...' : 'Find My Email'}
          </button>
        </form>
        <div className="mt-5 flex justify-between border-t border-slate-800 pt-4 text-xs">
          <button type="button" onClick={() => onNavigate('login')} className="font-semibold text-emerald-300 hover:underline">
            ← Back to Login
          </button>
          <button type="button" onClick={() => onNavigate('forgot-password')} className="font-semibold text-slate-300 hover:text-white">
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
