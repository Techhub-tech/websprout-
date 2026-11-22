import React, { useState } from 'react';

export default function Navbar({ currentPage, onNavigate, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'learnease', label: 'LearnEase (Free)' },
    { id: 'portal', label: 'My Portal' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Oversight' }] : []),
    { id: 'login', label: user ? 'Switch Account' : 'Login' },
    { id: 'signup', label: 'Sign Up' }
  ];

  const go = (id) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-500/20 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <button type="button" onClick={() => go('home')} className="flex items-center gap-3 text-left">
          {!logoFailed ? (
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="WebSprout Hub Logo"
              onError={() => setLogoFailed(true)}
              className="h-10 w-10 rounded-xl border border-emerald-400/40 bg-emerald-950 object-contain p-0.5 shadow"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-950 text-sm font-black tracking-tight text-emerald-300 shadow">
              WS
            </div>
          )}
          <div>
            <div className="text-base font-extrabold tracking-tight text-white">
              WebSprout <span className="text-emerald-400">Hub</span>
            </div>
            <div className="text-[11px] font-medium text-emerald-200/75">
              Learn. Build. Grow. Earn.
            </div>
          </div>
        </button>

        <nav className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  item.id === 'signup'
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Log Out
            </button>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-emerald-500/30 bg-slate-900 px-3 py-2 text-xs font-bold text-emerald-300 md:hidden"
        >
          {menuOpen ? 'Close ✕' : 'Menu ☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold ${
                  item.id === 'signup'
                    ? 'bg-emerald-500 text-slate-950'
                    : currentPage === item.id
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-900 text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
            {user && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-sm font-semibold text-rose-300"
              >
                Log Out ({user.full_name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
