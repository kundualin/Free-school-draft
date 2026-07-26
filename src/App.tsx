import React, { useState, useEffect } from 'react';
import { Repo } from './services/db';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { DonateModal } from './components/DonateModal';
import { ReportModal } from './components/ReportModal';
import { Toast } from './components/Toast';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { ContactView } from './views/ContactView';
import { MissionView } from './views/MissionView';
import { LegalView } from './views/LegalView';
import { DashboardShell } from './views/DashboardShell';
import { User, ViewType } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return Repo.session.get();
  });

  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('fs_theme');
    return saved === 'dark';
  });

  const [authModal, setAuthModal] = useState<{
    open: boolean;
    mode: 'login' | 'signup';
    defaultRole?: 'student' | 'teacher';
  }>({
    open: false,
    mode: 'login',
    defaultRole: 'student'
  });

  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [reportModalTargetId, setReportModalTargetId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; tone?: 'success' | 'error' } | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fs_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fs_theme', 'light');
    }
  }, [isDark]);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToast({ msg, tone });
  };

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const handleOpenAuth = (mode: 'login' | 'signup', defaultRole: 'student' | 'teacher' = 'student') => {
    setAuthModal({ open: true, mode, defaultRole });
  };

  const handleLogout = () => {
    Repo.session.clear();
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Logged out.');
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    Repo.session.set(user);
    setAuthModal(prev => ({ ...prev, open: false }));
    showToast(`Welcome, ${user.name.split(' ')[0]}!`);
    setCurrentView('dashboard');
  };

  const handleNavigate = (view: ViewType) => {
    if (view === 'dashboard' && !currentUser) {
      handleOpenAuth('login');
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate notification count
  const unreadNotifsCount = currentUser
    ? Repo.notifications.forUser(currentUser.id).filter(n => !n.read).length
    : 0;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-fs-cream text-fs-ink selection:bg-fs-gold-pale selection:text-fs-green">
      <Navbar
        currentView={currentView}
        currentUser={currentUser}
        unreadCount={unreadNotifsCount}
        isDark={isDark}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenDonate={() => setDonateModalOpen(true)}
        onToggleTheme={handleToggleTheme}
      />

      <div className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onOpenDonate={() => setDonateModalOpen(true)}
          />
        )}

        {currentView === 'explore' && (
          <ExploreView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenAuth={handleOpenAuth}
            onShowToast={showToast}
          />
        )}

        {currentView === 'contact' && (
          <ContactView
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentView === 'mission' && (
          <MissionView
            onNavigate={handleNavigate}
            onOpenDonate={() => setDonateModalOpen(true)}
          />
        )}

        {(currentView === 'privacy' || currentView === 'terms') && (
          <LegalView
            kind={currentView}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <DashboardShell
            user={currentUser}
            onNavigate={handleNavigate}
            onOpenReportModal={(id) => setReportModalTargetId(id)}
            onShowToast={showToast}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        mode={authModal.mode}
        defaultRole={authModal.defaultRole}
        onClose={() => setAuthModal(prev => ({ ...prev, open: false }))}
        onSuccess={handleAuthSuccess}
        onSwitchMode={(mode) => setAuthModal(prev => ({ ...prev, mode }))}
        onShowToast={showToast}
      />

      {/* Donate Modal */}
      <DonateModal
        isOpen={donateModalOpen}
        user={currentUser}
        onClose={() => setDonateModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Report Modal */}
      {reportModalTargetId && currentUser && (
        <ReportModal
          isOpen={!!reportModalTargetId}
          reporterId={currentUser.id}
          targetUserId={reportModalTargetId}
          onClose={() => setReportModalTargetId(null)}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.msg}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
