import React, { useState, useEffect } from 'react';
import {
  HUB_SECTIONS,
  WHY_WEBSPROUT,
  WHO_WE_SERVE,
  PRE_UNI_GUIDES,
  FAQS,
  SUPPORT_WHATSAPP_NUMBER,
  SUPPORT_EMAIL,
  MONTHLY_SUBSCRIPTION_NGN
} from '../data/hubData';
import { usePopup } from '../context/PopupContext';

export default function HomePage({ onNavigate, user }) {
  const { notify, openModal } = usePopup();

  // Portal ID Quick-Lookup Bar
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // Nationwide Tutoring Booking Form
  const [tutorForm, setTutorForm] = useState({
    student_name: '',
    guardian_or_email: '',
    phone: '',
    state: '',
    exam_type: 'WAEC',
    subjects: '',
    schedule_note: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // "We Listen, We Don't Judge" Community State
  const [checkins, setCheckins] = useState([]);
  const [postForm, setPostForm] = useState({
    author_label: '',
    age_group: '16 & Under',
    topic: 'School & Exam Pressure',
    message: ''
  });
  const [posting, setPosting] = useState(false);

  const loadCheckins = async () => {
    try {
      const res = await fetch('/api/community/checkins');
      const data = await res.json();
      if (res.ok) setCheckins(data.checkins || []);
    } catch {
      // ignore transient error
    }
  };

  useEffect(() => {
    loadCheckins();
  }, []);

  const handlePortalLookup = async (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/portal/lookup?code=${encodeURIComponent(lookupId.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        notify(data.error || 'No registered portal found for that ID.', 'error');
      } else {
        notify(`Portal ${data.portal_code} found! Proceeding to login.`, 'success');
        onNavigate('login');
      }
    } catch {
      notify('Could not verify Portal ID right now.', 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSectionClick = (section) => {
    if (section.key === 'arabic_fine_arts') {
      openModal({
        badge: 'Coming Soon',
        title: 'Arabic & Fine Arts',
        body: 'This track is currently marked Coming Soon as we prepare dedicated study materials for a future release.',
        confirmLabel: 'Close'
      });
      return;
    }

    if (section.key === 'pre_university') {
      const el = document.getElementById('pre-uni-guides');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      notify('Opened Pre-University Guide & PDF/Reading Resources.', 'info');
      return;
    }

    if (section.key === 'home_tutoring') {
      const el = document.getElementById('nationwide-tutoring');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      notify('Jumped to Nationwide Online Home Tutoring (WAEC, NECO & JAMB).', 'info');
      return;
    }

    onNavigate(user ? 'portal' : 'signup');
  };

  const handleTutorSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      const res = await fetch('/api/tutoring/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tutorForm)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not submit tutoring request.', 'error');
      } else {
        notify(data.message, 'success');
        openModal({
          badge: 'Tutoring Request Logged',
          title: 'Nationwide Home Tutoring Request Received',
          body: `Logged ${tutorForm.exam_type} tutoring request for ${tutorForm.student_name} (${tutorForm.state}). Support contact: ${SUPPORT_WHATSAPP_NUMBER}.`,
          confirmLabel: 'Done'
        });
        setTutorForm({
          student_name: '',
          guardian_or_email: '',
          phone: '',
          state: '',
          exam_type: 'WAEC',
          subjects: '',
          schedule_note: ''
        });
      }
    } catch {
      notify('Network error submitting booking.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      const res = await fetch('/api/community/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postForm)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not share check-in.', 'error');
      } else {
        notify(data.message, 'success');
        setPostForm((prev) => ({ ...prev, message: '' }));
        await loadCheckins();
      }
    } catch {
      notify('Network error posting check-in.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const openPolicyModal = (mode) => {
    if (mode === 'privacy') {
      openModal({
        badge: 'Privacy Notice',
        title: 'WebSprout Hub Privacy Conditions',
        body: (
          <div className="space-y-2 text-xs sm:text-sm">
            <p>We collect only the details needed to run your portal, study preferences, tutoring requests, and community check-ins.</p>
            <p>Passwords and login PINs are hashed on the backend. Never post home addresses, account passwords, or sensitive private details in public community spaces.</p>
            <p>Questions or removal requests: <strong>{SUPPORT_EMAIL}</strong> or <strong>{SUPPORT_WHATSAPP_NUMBER}</strong>.</p>
          </div>
        ),
        confirmLabel: 'Understood'
      });
    } else {
      openModal({
        badge: 'Terms & Conditions',
        title: 'WebSprout Hub Terms of Use',
        body: (
          <div className="space-y-2 text-xs sm:text-sm">
            <p>New portals begin with a 7-day starter window. Ongoing full daily learning and practice tracks use a <strong>₦{MONTHLY_SUBSCRIPTION_NGN}/month</strong> subscription, while LearnEase remains free.</p>
            <p>Pre-University guides provide educational reference on departments, WAEC subject fit, and CGPA calculation; confirm official institutional admission rules directly with your target institution.</p>
            <p>Be respectful in “We Listen, We Don’t Judge.” Harassment or abuse is not permitted.</p>
          </div>
        ),
        confirmLabel: 'Agree & Close'
      });
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero + Portal ID Lookup */}
      <section className="border-b border-emerald-500/20 bg-gradient-to-b from-emerald-950/75 via-slate-950 to-slate-950 px-4 pt-10 pb-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
              WebSprout Hub • Rooted for Africa. Built for the Future.
            </span>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
              7-Day Trial • ₦{MONTHLY_SUBSCRIPTION_NGN}/Month Plan • Free LearnEase
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
            Learn Digital Skills, Master Pre-University Guides & Grow Step by Step.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Built for mobile learners, teachers, and schools. Watch/read lessons, practice in a live code editor, use <strong className="text-emerald-300">LearnEase</strong> for free, and connect inside <strong className="text-emerald-300">“We Listen, We Don’t Judge.”</strong>
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate(user ? 'portal' : 'signup')}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              {user ? 'Open My Portal' : 'Start Your Portal'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('learnease')}
              className="rounded-xl border border-emerald-500/40 bg-emerald-950/70 px-6 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-900/70"
            >
              Open LearnEase (Free)
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Login
            </button>
          </div>

          {/* Portal ID Search Bar */}
          <form
            onSubmit={handlePortalLookup}
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-emerald-500/25 bg-slate-900/90 p-3 sm:flex-row sm:items-center"
          >
            <input
              type="text"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Enter registered Portal ID (e.g., WSH-A1B2C3)..."
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm uppercase text-white focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 sm:text-sm"
            >
              {lookupLoading ? 'Checking...' : 'Find Portal ID'}
            </button>
          </form>
        </div>
      </section>

      {/* Why WebSprout + Mission & Vision */}
      <section className="mx-auto max-w-6xl space-y-8 px-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Our Mission</span>
            <h2 className="mt-1 text-xl font-extrabold text-white">Accessible, Structured Growth Every Day</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              To make practical digital skills, clear pre-university guidance, and supportive exam preparation accessible on everyday mobile devices—with daily pacing, free study tools, and human support.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Our Vision</span>
            <h2 className="mt-1 text-xl font-extrabold text-white">Confident, Capable Young Builders Across Africa</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              To build a trusted virtual hub where students and teachers learn consistently, prepare wisely for higher education and digital careers, and grow in a judgment-free community.
            </p>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Why WebSprout Hub</span>
          <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Why Learners & Schools Choose WebSprout</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_WEBSPROUT.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="text-sm font-extrabold text-emerald-300">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Who We Serve */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Who We Serve</span>
          <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Portals & Pathways Built Around You</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHO_WE_SERVE.map((w) => (
              <div key={w.group} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="text-sm font-extrabold text-white">{w.group}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Hub Sections */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Hub Sections</span>
          <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Core Programs & Sections</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {HUB_SECTIONS.map((sec) => {
            const isComingSoon = sec.key === 'arabic_fine_arts';
            return (
              <div
                key={sec.id}
                className={`flex flex-col justify-between rounded-2xl border p-6 ${
                  isComingSoon
                    ? 'border-slate-800 bg-slate-900/50 opacity-85'
                    : 'border-emerald-500/25 bg-slate-900/90 hover:border-emerald-400/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">SECTION {sec.id}</span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        isComingSoon ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {sec.status}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold text-white">{sec.title}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-300/90">{sec.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{sec.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {sec.tracks.map((tr) => (
                      <span
                        key={tr}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
                      >
                        {tr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleSectionClick(sec)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-extrabold sm:text-sm ${
                      isComingSoon
                        ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {isComingSoon
                      ? 'Coming Soon'
                      : sec.key === 'pre_university'
                        ? 'Read Pre-University Guides ↓'
                        : sec.key === 'home_tutoring'
                          ? 'Book Nationwide Tutoring ↓'
                          : `Open ${sec.title} →`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pre-University Guide & PDF/Reading Sheets */}
      <section id="pre-uni-guides" className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 sm:p-8">
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            Pre-University Guide (PDF / Study Sheets)
          </span>
          <h2 className="mt-2 text-2xl font-extrabold text-white">
            Departments, WAEC Course Alignment, Cut-Off Readiness & CGPA Guides
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Focused on ND1–ND2 / higher-institution preparation guides—including how course credit units and GPA/CGPA work.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {PRE_UNI_GUIDES.map((g) => (
              <div key={g.code} className="rounded-xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="font-mono text-xs font-bold text-emerald-400">{g.code}</div>
                <h3 className="mt-1 text-base font-extrabold text-white">{g.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">{g.summary}</p>
                <button
                  type="button"
                  onClick={() =>
                    openModal({
                      badge: g.code,
                      title: g.title,
                      body: <p className="text-sm leading-relaxed text-slate-200">{g.readingText}</p>,
                      confirmLabel: 'Close Guide'
                    })
                  }
                  className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-950 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900"
                >
                  Read Full Guide Sheet
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nationwide Online Home Tutoring (WAEC, NECO, JAMB) */}
      <section id="nationwide-tutoring" className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                Nationwide Online Service
              </span>
              <h2 className="text-2xl font-extrabold text-white">
                Online Home Tutoring for WAEC, NECO & JAMB
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">
                Request online home tutoring across states for <strong>WAEC</strong>, <strong>NECO</strong>, or <strong>JAMB</strong> preparation.
              </p>
            </div>

            <form onSubmit={handleTutorSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Student Name *</label>
                <input
                  type="text"
                  required
                  value={tutorForm.student_name}
                  onChange={(e) => setTutorForm({ ...tutorForm, student_name: e.target.value })}
                  placeholder="Student full name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Parent / Student Email *</label>
                <input
                  type="email"
                  required
                  value={tutorForm.guardian_or_email}
                  onChange={(e) => setTutorForm({ ...tutorForm, guardian_or_email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={tutorForm.phone}
                  onChange={(e) => setTutorForm({ ...tutorForm, phone: e.target.value })}
                  placeholder="07049111844"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">State *</label>
                <input
                  type="text"
                  required
                  value={tutorForm.state}
                  onChange={(e) => setTutorForm({ ...tutorForm, state: e.target.value })}
                  placeholder="e.g., FCT Abuja, Lagos, Kano"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Exam *</label>
                <select
                  value={tutorForm.exam_type}
                  onChange={(e) => setTutorForm({ ...tutorForm, exam_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="WAEC">WAEC</option>
                  <option value="NECO">NECO</option>
                  <option value="JAMB">JAMB</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Subjects *</label>
                <input
                  type="text"
                  required
                  value={tutorForm.subjects}
                  onChange={(e) => setTutorForm({ ...tutorForm, subjects: e.target.value })}
                  placeholder="Mathematics, English, Physics..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Schedule Note</label>
                <input
                  type="text"
                  value={tutorForm.schedule_note}
                  onChange={(e) => setTutorForm({ ...tutorForm, schedule_note: e.target.value })}
                  placeholder="Preferred days or time window"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 sm:w-auto"
                >
                  {bookingLoading ? 'Submitting...' : 'Submit Tutoring Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* "We Listen, We Don't Judge" */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                Youth Support Space
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-white">We Listen, We Don’t Judge</h2>
            </div>
            <p className="max-w-md text-xs text-slate-300">
              Keep posts kind and supportive. Never share private home addresses, passwords, or personal contact details publicly.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form onSubmit={handleCheckinSubmit} className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-5 lg:col-span-5">
              <div className="text-sm font-bold text-white">Share a Check-In</div>
              <input
                type="text"
                value={postForm.author_label}
                onChange={(e) => setPostForm({ ...postForm, author_label: e.target.value })}
                placeholder="Name or Anonymous"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={postForm.age_group}
                  onChange={(e) => setPostForm({ ...postForm, age_group: e.target.value })}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="16 & Under">16 & Under</option>
                  <option value="18+ Diploma">18+ Diploma</option>
                  <option value="Teacher">Teacher</option>
                </select>
                <input
                  type="text"
                  value={postForm.topic}
                  onChange={(e) => setPostForm({ ...postForm, topic: e.target.value })}
                  placeholder="Topic"
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
              <textarea
                rows={3}
                required
                value={postForm.message}
                onChange={(e) => setPostForm({ ...postForm, message: e.target.value })}
                placeholder="Share what you are working through..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white"
              />
              <button
                type="submit"
                disabled={posting}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
              >
                {posting ? 'Posting...' : 'Post Check-In'}
              </button>
            </form>

            <div className="space-y-3 lg:col-span-7">
              {checkins.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
                  No check-ins shared yet.
                </div>
              ) : (
                checkins.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-emerald-300">
                        {item.author_label} • <span className="text-slate-400">{item.age_group}</span>
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] text-slate-300">
                        {item.topic}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs & Privacy/Terms Bar */}
      <section className="mx-auto max-w-6xl space-y-6 px-4">
        <h2 className="text-2xl font-extrabold text-white">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAQS.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-sm font-bold text-emerald-300">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-xs text-slate-300">
          <div>
            Support: <strong className="text-emerald-300">{SUPPORT_WHATSAPP_NUMBER}</strong> • {SUPPORT_EMAIL}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => openPolicyModal('privacy')} className="font-bold text-emerald-300 hover:underline">
              Privacy Conditions
            </button>
            <button type="button" onClick={() => openPolicyModal('terms')} className="font-bold text-emerald-300 hover:underline">
              Terms & Conditions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
