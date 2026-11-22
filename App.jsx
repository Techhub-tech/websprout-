import React, { useState, useEffect, useCallback } from 'react';
import { PopupProvider, usePopup } from './context/PopupContext';
import Navbar from './components/Navbar';
import SproutChatbot from './components/SproutChatbot';
import HomePage from './pages/HomePage';
import LearnEasePage from './pages/LearnEasePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ForgotEmailPage from './pages/ForgotEmailPage';
import PortalPage from './pages/PortalPage';
import AdminPage from './pages/AdminPage';

function HubShell() {
  const { notify } = usePopup();
  const [currentPage, setCurrentPage] = useState('home');
  const [token, setToken] = useState(() => localStorage.getItem('wsh_v1_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wsh_v1_user') || 'null');
    } catch {
      return null;
    }
  });

  const syncMe = useCallback(async (activeToken) => {
    if (!activeToken) return;
    try {
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('wsh_v1_user', JSON.stringify(data.user));
      }
    } catch {
      // ignore transient check
    }
  }, []);

  useEffect(() => {
    if (token) syncMe(token);
  }, [token, syncMe]);

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('wsh_v1_token', newToken);
    localStorage.setItem('wsh_v1_user', JSON.stringify(newUser));
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('wsh_v1_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('wsh_v1_token');
    localStorage.removeItem('wsh_v1_user');
    setCurrentPage('home');
    notify('You have been logged out.', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onLogout={handleLogout}
      />

      <main>
        {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} user={user} />}
        {currentPage === 'learnease' && (
          <LearnEasePage token={token} user={user} onNavigate={setCurrentPage} />
        )}
        {currentPage === 'login' && (
          <LoginPage onAuthSuccess={handleAuthSuccess} onNavigate={setCurrentPage} />
        )}
        {currentPage === 'signup' && (
          <SignupPage onAuthSuccess={handleAuthSuccess} onNavigate={setCurrentPage} />
        )}
        {currentPage === 'forgot-password' && <ForgotPasswordPage onNavigate={setCurrentPage} />}
        {currentPage === 'forgot-email' && <ForgotEmailPage onNavigate={setCurrentPage} />}
        {currentPage === 'portal' && (
          <PortalPage
            token={token}
            user={user}
            onUserUpdate={handleUserUpdate}
            onNavigate={setCurrentPage}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage token={token} user={user} onNavigate={setCurrentPage} />
        )}
      </main>

      <SproutChatbot />

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-8 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-6xl space-y-1">
          <div className="font-bold text-slate-200">
            WebSprout Hub • Learn. Build. Grow. Earn. • Rooted for Africa. Built for the Future.
          </div>
          <div>
            Digital Skills Academy • Pre-University Guide • Nationwide Online Home Tutoring • Arabic & Fine Arts (Coming Soon)
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <PopupProvider>
      <HubShell />
    </PopupProvider>
  );
}
