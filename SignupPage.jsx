import React, { useState } from 'react';
import { DIGITAL_SKILLS_COURSES } from '../data/hubData';
import { usePopup } from '../context/PopupContext';

export default function SignupPage({ onAuthSuccess, onNavigate }) {
  const { notify, openModal } = usePopup();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    state: '',
    country: 'Nigeria',
    role: 'student',
    age_tier: '18_plus_diploma',
    track_section: 'digital_skills',
    selected_course: 'Web Development',
    preferred_study_time: '18:00',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not create portal.', 'error');
      } else {
        onAuthSuccess(data.token, data.user);
        notify(`Portal ${data.user.portal_code} created with 7-day trial!`, 'success');
        openModal({
          badge: 'Portal Created • 7-Day Trial Active',
          title: 'Your WebSprout Hub Portal Is Ready',
          body: (
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p><strong>Portal ID:</strong> <span className="font-mono text-emerald-300">{data.user.portal_code}</span></p>
              <p><strong>Login PIN / Password:</strong> <span className="font-mono text-emerald-300">{data.login_pin}</span></p>
              <p className="text-slate-400">Keep your Portal ID and PIN safe for future sign-ins.</p>
            </div>
          ),
          confirmLabel: 'Go to My Portal'
        });
        onNavigate('portal');
      }
    } catch {
      notify('Could not connect to backend server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 shadow-xl sm:p-8">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
          Dedicated Sign-Up Page
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-white">Create Your Portal Account</h1>
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Full Name *</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Phone Number *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07049111844"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">State *</label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Country *</label>
            <input
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Nigeria"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Age Pathway</label>
            <select
              value={form.age_tier}
              onChange={(e) => setForm({ ...form, age_tier: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              <option value="18_plus_diploma">18+ Diploma Track</option>
              <option value="16_under_foundation">16 & Under Foundation Track</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Course Track</label>
            <select
              value={form.selected_course}
              onChange={(e) => setForm({ ...form, selected_course: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              {DIGITAL_SKILLS_COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Daily Study Time</label>
            <input
              type="time"
              value={form.preferred_study_time}
              onChange={(e) => setForm({ ...form, preferred_study_time: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
              Custom Password / PIN (Optional — 6-digit PIN generated if blank)
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {submitting ? 'Creating Portal...' : 'Create Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
