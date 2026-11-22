import React, { createContext, useContext, useState, useCallback } from 'react';

const PopupContext = createContext(null);

export function PopupProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const openModal = useCallback(({ title, body, badge, confirmLabel = 'Got it' }) => {
    setModal({ title, body, badge, confirmLabel });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <PopupContext.Provider value={{ notify, openModal, closeModal }}>
      {children}

      {/* Instant Pop-Up Toasts */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur ${
              t.type === 'error'
                ? 'border-rose-500/40 bg-rose-950/95 text-rose-100'
                : t.type === 'info'
                  ? 'border-emerald-400/40 bg-slate-900/95 text-emerald-100'
                  : 'border-emerald-500/50 bg-emerald-950/95 text-emerald-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
                {t.type === 'error' ? '!' : 'WS'}
              </span>
              <div className="leading-snug">{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Instant Pop-Up Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            {modal.badge && (
              <span className="inline-block rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
                {modal.badge}
              </span>
            )}
            <h3 className="mt-2 text-xl font-extrabold text-white">{modal.title}</h3>
            <div className="mt-3 text-sm leading-relaxed text-slate-300">{modal.body}</div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 sm:w-auto"
              >
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  return useContext(PopupContext);
}
