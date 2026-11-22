import React, { useState, useEffect, useCallback } from 'react';
import { usePopup } from '../context/PopupContext';

const STARTER_EXPLANATIONS = {
  cgpa: 'CGPA (Cumulative Grade Point Average) divides your total quality points across all semesters by your total credit units.',
  html: 'HTML structures content (headings, paragraphs, lists, buttons) on a webpage before CSS styles it.',
  css: 'CSS controls visual styling such as spacing, colors, borders, and mobile/desktop layout.'
};

export default function LearnEasePage({ token, user, onNavigate }) {
  const { notify } = usePopup();
  const [term, setTerm] = useState('');
  const [explanation, setExplanation] = useState('');
  const [sourceArea, setSourceArea] = useState('Pre-University / Study Note');
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/learnease/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setNotes(data.notes || []);
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleGenerateDraft = () => {
    const key = term.trim().toLowerCase();
    const foundKey = Object.keys(STARTER_EXPLANATIONS).find((k) => key.includes(k));
    if (foundKey) {
      setExplanation(STARTER_EXPLANATIONS[foundKey]);
      notify('Draft explanation generated for free!', 'info');
    } else if (term.trim()) {
      setExplanation(
        `Summary note for "${term.trim()}": Break this concept into its main definition, one real-world example, and a 2-sentence summary in your own words.`
      );
      notify('Study breakdown drafted in LearnEase.', 'info');
    } else {
      notify('Type a term or topic first.', 'error');
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!token || !user) {
      notify('Log in or create a free portal first to save notes to your LearnEase library.', 'info');
      onNavigate('login');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/learnease/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          term_or_topic: term,
          explanation,
          source_area: sourceArea
        })
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Could not save note.', 'error');
      } else {
        notify(data.message, 'success');
        setTerm('');
        setExplanation('');
        await loadNotes();
      }
    } catch {
      notify('Network error saving note.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/learnease/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      notify('Removed note from LearnEase.', 'info');
      await loadNotes();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6">
        <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-300">
          Free Forever • Dictionary & Study Library
        </span>
        <h1 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">LearnEase Library</h1>
        <p className="mt-1 text-sm text-slate-300">
          Look up or paste anything you don’t understand in your guides or lessons, write/refine a clear explanation, and save it to your personal library—free of monthly subscription lock.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form onSubmit={handleSaveNote} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-5">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Term, Concept or Passage *</label>
            <input
              type="text"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g., CGPA, CSS Flexbox, Credit Units"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-slate-400">Category / Source</label>
            <input
              type="text"
              value={sourceArea}
              onChange={(e) => setSourceArea(e.target.value)}
              placeholder="Pre-University Guide or Digital Skills"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase text-slate-400">Explanation / Summary *</label>
              <button
                type="button"
                onClick={handleGenerateDraft}
                className="text-xs font-bold text-emerald-300 hover:underline"
              >
                Draft Explanation
              </button>
            </div>
            <textarea
              rows={5}
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Write or draft a clear explanation you can revisit later..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save to My LearnEase Library'}
          </button>
        </form>

        <div className="space-y-3 lg:col-span-7">
          <h2 className="text-lg font-extrabold text-white">Saved Study Library ({notes.length})</h2>
          {!token || !user ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-300">
              Sign in or create a portal to save and sync your personal LearnEase library across sessions.
            </div>
          ) : notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-400">
              No saved LearnEase entries yet. Add your first term or study note on the left.
            </div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                      {n.source_area}
                    </span>
                    <h3 className="mt-1.5 text-base font-extrabold text-white">{n.term_or_topic}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{n.explanation}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
