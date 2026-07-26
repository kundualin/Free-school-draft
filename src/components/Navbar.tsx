import React, { useState } from 'react';
import { Sun, Moon, Menu, X, LogOut, Heart } from 'lucide-react';
import { ViewType, Role, User } from '../types';
import { Avatar } from './Avatar';

interface NavbarProps {
  currentView: ViewType;
  currentUser?: User | null;
  unreadCount?: number;
  isDark?: boolean;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleDarkMode?: () => void;
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (mode: 'login' | 'signup' | 'register', role?: Role) => void;
  onLogout?: () => void;
  onOpenDonate?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentUser,
  unreadCount = 0,
  isDark,
  darkMode,
  onToggleTheme,
  onToggleDarkMode,
  onNavigate,
  onOpenAuth,
  onLogout,
  onOpenDonate
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isDarkMode = isDark ?? darkMode ?? false;

  const handleToggleDark = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  };

  const pages: { id: ViewType; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore' },
    { id: 'mission', label: 'Our Mission' },
    { id: 'contact', label: 'Join as a tutor' }
  ];

  if (currentUser) {
    pages.push({ id: 'dashboard', label: 'Dashboard' });
  }

  const handleNav = (view: ViewType) => {
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onNavigate(view);
  };

  return (
    <nav className="bg-fs-paper border-b border-fs-line sticky top-0 z-40 transition-colors">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-4">
        {/* Brand */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => handleNav('home')}
        >
          <div className="w-9 h-9 rounded-lg bg-fs-green flex items-center justify-center text-fs-gold-pale font-serif font-bold text-lg shadow-fs flex-shrink-0">
            FS
          </div>
          <div>
            <div className="font-serif font-bold text-lg text-fs-green leading-tight">Free School</div>
            <div className="text-[11px] text-fs-ink-soft -mt-0.5">শেখা হোক সবার জন্য</div>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {pages.map((p) => {
            const isActive = currentView === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`relative text-[13.5px] font-semibold py-1 transition-colors ${
                  isActive
                    ? 'text-fs-green after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:bg-fs-red after:rounded-full'
                    : 'text-fs-ink-soft hover:text-fs-green'
                }`}
                onClick={() => handleNav(p.id)}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onOpenDonate && (
            <button
              type="button"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-fs-red bg-fs-red-soft/60 hover:bg-fs-red-soft px-3 py-2 rounded-lg transition-colors"
              onClick={onOpenDonate}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Donate</span>
            </button>
          )}

          <button
            type="button"
            className="w-9 h-9 border border-fs-line rounded-lg inline-flex items-center justify-center hover:border-fs-green transition-colors text-fs-ink"
            onClick={handleToggleDark}
            aria-label="Toggle dark mode"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-fs-gold" /> : <Moon className="w-4 h-4 text-fs-ink" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-fs-cream transition-colors text-left"
                onClick={() => handleNav('dashboard')}
              >
                <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-fs-ink leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-fs-ink-soft capitalize">{currentUser.role}</div>
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  className="w-9 h-9 border border-fs-line rounded-lg inline-flex items-center justify-center text-fs-ink-soft hover:text-fs-red hover:border-fs-red transition-colors"
                  onClick={onLogout}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="hidden sm:inline-flex bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
                onClick={() => onOpenAuth('login', 'student')}
              >
                Log in
              </button>

              <button
                type="button"
                className="hidden sm:inline-flex bg-fs-green text-fs-paper hover:bg-fs-green-mid px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
                onClick={() => onOpenAuth('signup', 'student')}
              >
                Join free
              </button>
            </>
          )}

          <button
            type="button"
            className="w-9 h-9 border border-fs-line rounded-lg inline-flex md:hidden items-center justify-center hover:border-fs-green transition-colors text-fs-ink"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileNavOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-fs-line px-4 sm:px-8 py-3 flex flex-col gap-1 animate-fs-pop bg-fs-paper">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                currentView === p.id ? 'bg-fs-green-pale text-fs-green' : 'text-fs-ink-soft hover:bg-fs-cream'
              }`}
              onClick={() => handleNav(p.id)}
            >
              {p.label}
            </button>
          ))}
          {currentUser ? (
            <div className="pt-3 border-t border-fs-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar name={currentUser.name} src={currentUser.avatar} size="sm" />
                <div>
                  <div className="text-xs font-bold text-fs-ink">{currentUser.name}</div>
                  <div className="text-[10px] text-fs-ink-soft capitalize">{currentUser.role}</div>
                </div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="text-xs font-semibold text-fs-red hover:underline flex items-center gap-1"
                  onClick={() => { setMobileNavOpen(false); onLogout(); }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Log out
                </button>
              )}
            </div>
          ) : (
            <div className="flex sm:hidden gap-2 mt-2 pt-3 border-t border-fs-line">
              <button
                type="button"
                className="flex-1 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
                onClick={() => { setMobileNavOpen(false); onOpenAuth('login', 'student'); }}
              >
                Log in
              </button>
              <button
                type="button"
                className="flex-1 bg-fs-green text-fs-paper hover:bg-fs-green-mid px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
                onClick={() => { setMobileNavOpen(false); onOpenAuth('signup', 'student'); }}
              >
                Join free
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
