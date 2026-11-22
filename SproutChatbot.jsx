import React, { useState } from 'react';
import { SUPPORT_WHATSAPP_NUMBER } from '../data/hubData';

const QUICK_ANSWERS = [
  {
    q: 'How does the ₦500/month plan & 7-day trial work?',
    a: 'New portals include a 7-day starter window. Afterward, full daily lessons & practice use a ₦500/month subscription, while LearnEase remains free.'
  },
  {
    q: 'How do I log in with my Portal ID & PIN?',
    a: 'Use the Portal ID search on Home or go to Login with your registered email and 6-digit Login PIN.'
  },
  {
    q: 'What is inside Pre-University Guide?',
    a: 'Guides and reading sheets on choosing a course from WAEC grades, departments, credit units, cut-off prep, and CGPA calculation (no HND).'
  }
];

export default function SproutChatbot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `Hi! I’m Sprout Chatbot. Ask a quick question here or connect directly with ${SUPPORT_WHATSAPP_NUMBER} if you need personal help.`
    }
  ]);

  const handleAsk = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const userText = question.trim();
    setQuestion('');

    const matched = QUICK_ANSWERS.find((item) =>
      userText.toLowerCase().includes(item.q.toLowerCase().split(' ')[1] || '')
    );

    const reply = matched
      ? matched.a
      : `Got it: "${userText}". For direct guidance on this difficulty, tap WhatsApp ${SUPPORT_WHATSAPP_NUMBER} below and your message will open ready to send.`;

    setMessages((prev) => [
      ...prev,
      { from: 'user', text: userText },
      { from: 'bot', text: reply }
    ]);
  };

  const whatsappHref = `https://wa.me/234${SUPPORT_WHATSAPP_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(
    'Hello WebSprout Hub, I need assistance via Sprout Chatbot.'
  )}`;

  return (
    <div className="fixed right-4 bottom-4 z-40">
      {open && (
        <div className="mb-3 w-[90vw] max-w-sm rounded-2xl border border-emerald-400/40 bg-slate-900 p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <div className="text-sm font-extrabold text-white">Sprout Chatbot</div>
              <div className="text-[11px] text-emerald-300">Instant Help • {SUPPORT_WHATSAPP_NUMBER}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`rounded-xl px-3 py-2 leading-relaxed ${
                  m.from === 'user'
                    ? 'ml-6 bg-emerald-500 font-semibold text-slate-950'
                    : 'mr-4 bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {QUICK_ANSWERS.map((qa) => (
              <button
                key={qa.q}
                type="button"
                onClick={() =>
                  setMessages((prev) => [
                    ...prev,
                    { from: 'user', text: qa.q },
                    { from: 'bot', text: qa.a }
                  ])
                }
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-emerald-300 hover:border-emerald-500/40"
              >
                {qa.q}
              </button>
            ))}
          </div>

          <form onSubmit={handleAsk} className="mt-3 flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your difficulty or question..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
            >
              Ask
            </button>
          </form>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 block w-full rounded-xl border border-emerald-500/40 bg-emerald-950 py-2 text-center text-xs font-bold text-emerald-300 hover:bg-emerald-900"
          >
            Chat / Call {SUPPORT_WHATSAPP_NUMBER} on WhatsApp →
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500 px-4 py-3 text-xs font-black text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-emerald-300">
          WS
        </span>
        <span>Sprout Bot</span>
      </button>
    </div>
  );
}
