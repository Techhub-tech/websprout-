import React, { useState, useEffect, useCallback } from 'react';
import { DIGITAL_SKILLS_COURSES, MONTHLY_SUBSCRIPTION_NGN } from '../data/hubData';
import { usePopup } from '../context/PopupContext';

export default function AdminPage({ token, user, onNavigate }) {
  const { notify, openModal } = usePopup();
  const [overview, setOverview] = useState({
    users: [],
    tutoringRequests: [],
    communityCheckins: [],
    callRequests: []
  });
  const [loading, setLoading] = useState(true);

  const [newPortal, setNewPortal] = useState({
    full_name: '',
    email: '',
    phone: '',
    state: '',
    country: 'Nigeria',
    role: 'student',
    age_tier: '18_plus_diploma',
    track_section: 'digital_skills',
    selected_course: 'Web Development'
  });
  const [creating, setCreating] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOverview(data);
    } catch {
      notify('Could not load admin oversight data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, notify]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadOverview();
    } else {
      setLoading(false);
    }
  }, [user, loadOverview]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-2xl font-extrabold text-white">Admin Oversight Restricted</h1>
          <p className="mt-2 text-sm text-slate-300">Log in with an Admin account to manage portals, ₦500/month activations, call requests, and moderation.</p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleCreatePortal = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPortal)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to create portal.', 'error');
      } else {
        notify(`Portal created for ${newPortal.full_name}!`, 'success');
        openModal({
          badge: 'Portal Created',
          title: `Portal Details for ${newPortal.full_name}`,
          body: (
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p><strong>Email:</strong> <span className="font-mono text-emerald-300">{data.email}</span></p>
              <p><strong>Portal ID:</strong> <span className="font-mono text-emerald-300">{data.portal_code}</span></p>
              <p><strong>Login PIN:</strong> <span className="font-mono text-emerald-300">{data.login_pin}</span></p>
            </div>
          ),
          confirmLabel: 'Done'
        });
        setNewPortal((prev) => ({ ...prev, full_name: '', email: '', phone: '', state: '' }));
        await loadOverview();
      }
    } catch {
      notify('Network error generating portal.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleActivateSub = async (targetId) => {
    const res = await fetch(`/api/admin/users/${targetId}/subscription`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      await loadOverview();
    }
  };

  const handleCallStatus = async (id, status) => {
    const res = await fetch(`/api/admin/calls/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      await loadOverview();
    }
  };

  const handleTutorStatus = async (id, status) => {
    const res = await fetch(`/api/admin/tutoring/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      await loadOverview();
    }
  };

  const handleModeration = async (id, approved) => {
    const res = await fetch(`/api/admin/community/${id}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ approved })
    });
    const data = await res.json();
    if (res.ok) {
      notify(data.message, 'success');
      await loadOverview();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
          Admin Oversight
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          WebSprout Hub Control Center
        </h1>
      </div>

      {/* Create Portal */}
      <form onSubmit={handleCreatePortal} className="grid grid-cols-1 gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <h2 className="text-lg font-extrabold text-white">Generate Portal Link/ID & Login PIN</h2>
        </div>
        <input
          type="text"
          required
          value={newPortal.full_name}
          onChange={(e) => setNewPortal({ ...newPortal, full_name: e.target.value })}
          placeholder="Full Name *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="email"
          required
          value={newPortal.email}
          onChange={(e) => setNewPortal({ ...newPortal, email: e.target.value })}
          placeholder="Email *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="tel"
          value={newPortal.phone}
          onChange={(e) => setNewPortal({ ...newPortal, phone: e.target.value })}
          placeholder="Phone Number"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          value={newPortal.state}
          onChange={(e) => setNewPortal({ ...newPortal, state: e.target.value })}
          placeholder="State"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <select
          value={newPortal.role}
          onChange={(e) => setNewPortal({ ...newPortal, role: e.target.value })}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        <select
          value={newPortal.selected_course}
          onChange={(e) => setNewPortal({ ...newPortal, selected_course: e.target.value })}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        >
          {DIGITAL_SKILLS_COURSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 sm:col-span-2 lg:col-span-3"
        >
          {creating ? 'Generating...' : 'Create Portal & PIN'}
        </button>
      </form>

      {/* Users & ₦500/month Subscription Activation */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-extrabold text-white">Portals & Subscriptions ({overview.users.length})</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {overview.users.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs sm:text-sm"
              >
                <div>
                  <div className="font-bold text-white">
                    {u.full_name} • <span className="text-emerald-300">{u.billing_label}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {u.email} • ID: <span className="font-mono text-slate-200">{u.portal_code}</span> • PIN:{' '}
                    <span className="font-mono text-emerald-300">{u.login_pin}</span>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleActivateSub(u.id)}
                    className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
                  >
                    Activate 30 Days (₦{MONTHLY_SUBSCRIPTION_NGN})
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-Portal Call Requests */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-extrabold text-white">Lesson Call Requests ({overview.callRequests.length})</h2>
        <div className="mt-4 space-y-3">
          {overview.callRequests.length === 0 ? (
            <p className="text-sm text-slate-400">No call requests submitted yet.</p>
          ) : (
            overview.callRequests.map((cr) => (
              <div
                key={cr.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs sm:text-sm"
              >
                <div>
                  <div className="font-bold text-white">
                    {cr.student_name} — <span className="text-emerald-300">{cr.course}</span> ({cr.department_or_track})
                  </div>
                  <div className="text-xs text-slate-400">
                    Phone: {cr.phone} • Slot: {cr.preferred_slot || 'Any'} • Status: <strong>{cr.status}</strong>
                  </div>
                  {cr.reason_note && <p className="mt-1 text-xs text-slate-300">{cr.reason_note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleCallStatus(cr.id, 'Contacted / Call Scheduled')}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-950 px-3.5 py-2 text-xs font-bold text-emerald-300"
                >
                  Mark Contacted
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tutoring & Moderation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-base font-extrabold text-white">Tutoring Requests ({overview.tutoringRequests.length})</h2>
          <div className="mt-3 space-y-2.5">
            {overview.tutoringRequests.map((tr) => (
              <div key={tr.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
                <div className="font-bold text-white">
                  {tr.student_name} • {tr.exam_type} ({tr.state})
                </div>
                <div className="text-slate-400">{tr.phone} • {tr.status}</div>
                <button
                  type="button"
                  onClick={() => handleTutorStatus(tr.id, 'Tutor Matched')}
                  className="mt-2 rounded bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300"
                >
                  Mark Tutor Matched
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-base font-extrabold text-white">Community Moderation ({overview.communityCheckins.length})</h2>
          <div className="mt-3 space-y-2.5">
            {overview.communityCheckins.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 text-xs">
                <div className="font-bold text-white">{c.author_label} — {c.topic}</div>
                <p className="mt-1 text-slate-300">{c.message}</p>
                <button
                  type="button"
                  onClick={() => handleModeration(c.id, !c.approved)}
                  className="mt-2 rounded bg-slate-800 px-2.5 py-1 font-bold text-slate-200"
                >
                  {c.approved ? 'Hide Post' : 'Show Post'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
