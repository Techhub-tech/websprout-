import React, { useState, useEffect } from 'react';
import {
  DIGITAL_SKILLS_COURSES,
  DAILY_LESSONS,
  MONTHLY_SUBSCRIPTION_NGN,
  SUPPORT_WHATSAPP_NUMBER
} from '../data/hubData';
import { usePopup } from '../context/PopupContext';

export default function PortalPage({ token, user, onUserUpdate, onNavigate }) {
  const { notify, openModal } = usePopup();

  // Preferences state
  const [ageTier, setAgeTier] = useState(user?.age_tier || '18_plus_diploma');
  const [trackSection, setTrackSection] = useState(user?.track_section || 'digital_skills');
  const [selectedCourse, setSelectedCourse] = useState(user?.selected_course || 'Web Development');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Editable Profile + Photo state
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    state: user?.state || '',
    country: user?.country || 'Nigeria',
    preferred_study_time: user?.preferred_study_time || '18:00',
    avatar_data: user?.avatar_data || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Daily lesson & CodePen-style practice state
  const lessonIndex = Math.min(Math.max((user?.daily_streak || 1) - 1, 0), DAILY_LESSONS.length - 1);
  const currentLesson = DAILY_LESSONS[lessonIndex] || DAILY_LESSONS[0];
  const [htmlCode, setHtmlCode] = useState(currentLesson.starterHtml);
  const [cssCode, setCssCode] = useState(currentLesson.starterCss);
  const [jsCode, setJsCode] = useState(currentLesson.starterJs);

  // In-portal "Book a Call" state
  const [callForm, setCallForm] = useState({
    student_name: user?.full_name || '',
    course: user?.selected_course || 'Web Development',
    department_or_track: user?.age_tier === '16_under_foundation' ? '16 & Under Foundation' : '18+ Diploma',
    phone: user?.phone || '',
    preferred_slot: '18:00 (30-min call)',
    reason_note: ''
  });
  const [sendingCall, setSendingCall] = useState(false);

  useEffect(() => {
    if (user) {
      setAgeTier(user.age_tier || '18_plus_diploma');
      setTrackSection(user.track_section || 'digital_skills');
      setSelectedCourse(user.selected_course || 'Web Development');
      setProfileForm({
        full_name: user.full_name || '',
        phone: user.phone || '',
        state: user.state || '',
        country: user.country || 'Nigeria',
        preferred_study_time: user.preferred_study_time || '18:00',
        avatar_data: user.avatar_data || ''
      });
      setCallForm((prev) => ({
        ...prev,
        student_name: user.full_name || prev.student_name,
        course: user.selected_course || prev.course,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  useEffect(() => {
    setHtmlCode(currentLesson.starterHtml);
    setCssCode(currentLesson.starterCss);
    setJsCode(currentLesson.starterJs);
  }, [currentLesson]);

  if (!token || !user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-8">
          <h1 className="text-2xl font-extrabold text-white">Individual Portal Access</h1>
          <p className="mt-2 text-sm text-slate-300">
            Log in or create a portal to start your 7-day trial, daily lesson pacing, CodePen-style practice, and profile tools.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
            >
              Sign Up / Create Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLocked = user.access_active === false;
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = user.last_checkin_date === today;

  const handleReadOut = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      notify('Read-Out voice is not supported in this browser.', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(`${currentLesson.title}. ${currentLesson.summary}`);
    utter.rate = 0.98;
    window.speechSynthesis.speak(utter);
    notify('Reading lesson aloud...', 'info');
  };

  const handleDailyCheckin = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/portal/daily-checkin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not complete daily check-in.', 'error');
      } else {
        if (data.user) onUserUpdate(data.user);
        notify(data.message, data.alreadyCheckedIn ? 'info' : 'success');
        if (data.celebrate) {
          openModal({
            badge: '🎉 Daily Milestone Reached',
            title: 'Congratulations on Today’s Lesson!',
            body: `Great job completing today’s session. Your next daily lesson unlocks tomorrow at your fixed study time (${data.user?.preferred_study_time || '18:00'}).`,
            confirmLabel: 'See You Tomorrow 🎉'
          });
        }
      }
    } catch {
      notify('Network error recording daily check-in.', 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file (JPG, PNG, WebP).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, avatar_data: String(reader.result || '') }));
      notify('Profile photo selected. Click Save Profile to store it.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not update profile.', 'error');
      } else {
        if (data.user) onUserUpdate(data.user);
        notify(data.message, 'success');
      }
    } catch {
      notify('Network error saving profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrefs = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const res = await fetch('/api/portal/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          age_tier: ageTier,
          track_section: trackSection,
          selected_course: selectedCourse
        })
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not save preferences.', 'error');
      } else {
        if (data.user) onUserUpdate(data.user);
        notify(data.message, 'success');
      }
    } catch {
      notify('Network error saving preferences.', 'error');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleBookCall = async (e) => {
    e.preventDefault();
    setSendingCall(true);
    try {
      const res = await fetch('/api/portal/book-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(callForm)
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not send call request.', 'error');
      } else {
        notify(data.message, 'success');
        openModal({
          badge: 'Call Request Logged',
          title: 'Stay Right Here — Your Request Was Sent',
          body: (
            <div className="space-y-2 text-xs sm:text-sm">
              <p>Your call request for <strong>{callForm.course}</strong> has been saved for WebSprout Hub.</p>
              <p>Support line: <strong className="text-emerald-300">{SUPPORT_WHATSAPP_NUMBER}</strong></p>
              <a
                href={`https://wa.me/234${SUPPORT_WHATSAPP_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(
                  `Hello WebSprout Hub (${SUPPORT_WHATSAPP_NUMBER}), I am ${callForm.student_name} (${callForm.phone}) on ${callForm.course} [${callForm.department_or_track}]. I need clarification: ${callForm.reason_note || 'Lesson follow-up'}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-slate-950"
              >
                Open WhatsApp Chat to {SUPPORT_WHATSAPP_NUMBER} (Optional)
              </a>
            </div>
          ),
          confirmLabel: 'Stay in Portal'
        });
        setCallForm((prev) => ({ ...prev, reason_note: '' }));
      }
    } catch {
      notify('Network error sending call request.', 'error');
    } finally {
      setSendingCall(false);
    }
  };

  const previewSrcDoc = `<!doctype html><html><head><style>${cssCode}</style></head><body>${htmlCode}<script>${jsCode}<\/script></body></html>`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Portal Top Card */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatar_data ? (
              <img
                src={user.avatar_data}
                alt={user.full_name}
                className="h-14 w-14 rounded-2xl border border-emerald-400/40 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-950 text-lg font-black text-emerald-300">
                {user.full_name?.slice(0, 2).toUpperCase() || 'WS'}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold uppercase text-emerald-300">
                  {user.role}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-0.5 font-mono text-xs text-slate-200">
                  ID: {user.portal_code}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                  {user.billing_label}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-extrabold text-white">{user.full_name}</h1>
              <p className="text-xs text-slate-300">
                {user.selected_course} • Daily Study Time: <strong>{user.preferred_study_time || '18:00'}</strong> • Streak: <strong>{user.daily_streak || 0} day(s)</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDailyCheckin}
            disabled={checkingIn || isLocked || completedToday}
            className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 sm:text-sm"
          >
            {isLocked
              ? 'Subscription Needed (₦500/mo)'
              : completedToday
                ? '✓ Today’s Lesson Done (Next Tomorrow)'
                : checkingIn
                  ? 'Completing...'
                  : 'Complete Today’s Lesson & Check-In'}
          </button>
        </div>
      </div>

      {/* Subscription Lock Notice if 7-day trial ended without ₦500/month activation */}
      {isLocked ? (
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6">
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
            Subscription Required
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-white">
            7-Day Starter Access Ended — Subscribe ₦{MONTHLY_SUBSCRIPTION_NGN}/Month to Continue
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Your daily lessons and CodePen-style practice are paused until your <strong>₦{MONTHLY_SUBSCRIPTION_NGN}/month</strong> subscription is activated. Contact WebSprout Hub on <strong>{SUPPORT_WHATSAPP_NUMBER}</strong> to complete payment—then Admin Oversight activates your 30-day access. Meanwhile, <strong>LearnEase</strong> stays free!
          </p>
        </div>
      ) : (
        /* Daily Lesson + Read Out + CodePen-Style Editor */
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
                One Lesson Per Day • 4-Month Track Flow
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-white">{currentLesson.title}</h2>
            </div>
            <button
              type="button"
              onClick={handleReadOut}
              className="rounded-xl border border-emerald-500/40 bg-emerald-950 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900"
            >
              🔊 Read Out Lesson
            </button>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">{currentLesson.summary}</p>

          {completedToday && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3.5 text-xs font-semibold text-emerald-200">
              You have completed today’s step. To keep learning steady without rushing, the next daily lesson opens tomorrow at your chosen study time ({user.preferred_study_time}).
            </div>
          )}

          <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-black">
            <iframe
              src={currentLesson.videoUrl}
              title={currentLesson.title}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* CodePen-Style Practice Editor */}
          <div className="space-y-3 rounded-xl border border-emerald-500/25 bg-slate-950 p-4">
            <div className="text-sm font-extrabold text-emerald-300">CodePen-Style Practice Workspace</div>
            <p className="text-xs text-slate-300">{currentLesson.practicePrompt}</p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">HTML</label>
                <textarea
                  rows={6}
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-emerald-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">CSS</label>
                <textarea
                  rows={6}
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-sky-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">JS</label>
                <textarea
                  rows={6}
                  value={jsCode}
                  onChange={(e) => setJsCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 font-mono text-xs text-amber-200"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-bold uppercase text-slate-400">Live Output Preview</div>
              <iframe
                title="Live Code Practice Preview"
                srcDoc={previewSrcDoc}
                sandbox="allow-scripts"
                className="h-44 w-full rounded-xl border border-slate-800 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* In-Portal "Book a Call" When Not Clear / Not Satisfied With Lesson */}
      <form onSubmit={handleBookCall} className="grid grid-cols-1 gap-4 rounded-2xl border border-emerald-500/25 bg-slate-900 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
            Stay Inside Your Portal
          </span>
          <h2 className="mt-2 text-lg font-extrabold text-white">
            Not Clear or Not Satisfied With This Lesson? Book a Call
          </h2>
          <p className="text-xs text-slate-400">
            Submit your details below without leaving your portal—your request goes to WebSprout Hub ({SUPPORT_WHATSAPP_NUMBER}).
          </p>
        </div>

        <input
          type="text"
          required
          value={callForm.student_name}
          onChange={(e) => setCallForm({ ...callForm, student_name: e.target.value })}
          placeholder="Your Name *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          required
          value={callForm.course}
          onChange={(e) => setCallForm({ ...callForm, course: e.target.value })}
          placeholder="Course *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          required
          value={callForm.department_or_track}
          onChange={(e) => setCallForm({ ...callForm, department_or_track: e.target.value })}
          placeholder="Department / Track *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="tel"
          required
          value={callForm.phone}
          onChange={(e) => setCallForm({ ...callForm, phone: e.target.value })}
          placeholder="Phone Number *"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          value={callForm.preferred_slot}
          onChange={(e) => setCallForm({ ...callForm, preferred_slot: e.target.value })}
          placeholder="Preferred time (e.g., 18:00)"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <input
          type="text"
          value={callForm.reason_note}
          onChange={(e) => setCallForm({ ...callForm, reason_note: e.target.value })}
          placeholder="What part needs explanation?"
          className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={sendingCall}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {sendingCall ? 'Sending...' : 'Send Call Request'}
          </button>
        </div>
      </form>

      {/* Editable Profile + Photo Upload & Track Preferences */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={handleSaveProfile} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-extrabold text-white">Edit Profile & Photo</h2>
          <input
            type="text"
            required
            value={profileForm.full_name}
            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
            placeholder="Full Name"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="Phone / WhatsApp Number"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
            <input
              type="text"
              value={profileForm.state}
              onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
              placeholder="State"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={profileForm.country}
              onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
              placeholder="Country"
              className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Fix Daily Study Time</label>
              <input
                type="time"
                value={profileForm.preferred_study_time}
                onChange={(e) => setProfileForm({ ...profileForm, preferred_study_time: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">Upload Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>

        <form onSubmit={handleSavePrefs} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-extrabold text-white">Course & Age Pathway</h2>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Age Tier</label>
            <select
              value={ageTier}
              onChange={(e) => setAgeTier(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              <option value="18_plus_diploma">18+ Diploma Track</option>
              <option value="16_under_foundation">16 & Under Foundation Track</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Section</label>
            <select
              value={trackSection}
              onChange={(e) => setTrackSection(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              <option value="digital_skills">Digital Skills Academy</option>
              <option value="pre_university">Pre-University Academy Guide</option>
              <option value="home_tutoring">Nationwide Home Tutoring</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Digital Skill Track</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            >
              {DIGITAL_SKILLS_COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={savingPrefs}
            className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950 py-2.5 text-sm font-extrabold text-emerald-300 hover:bg-emerald-900 disabled:opacity-60"
          >
            {savingPrefs ? 'Updating...' : 'Update Track Selection'}
          </button>
        </form>
      </div>
    </div>
  );
}
