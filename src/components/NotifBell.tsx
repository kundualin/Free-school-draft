import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Repo } from '../services/db';
import { timeAgo } from '../utils/helpers';
import { DashTabType } from '../types';

interface NotifBellProps {
  userId: string;
  onNavigateTab: (tab: DashTabType) => void;
}

export const NotifBell: React.FC<NotifBellProps> = ({ userId, onNavigateTab }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const list = Repo.notifications.forUser(userId);
  const unreadCount = list.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (id: string, tab?: string) => {
    Repo.notifications.markRead(id);
    setOpen(false);
    if (tab) {
      onNavigateTab(tab as DashTabType);
    }
  };

  const handleMarkAllRead = () => {
    Repo.notifications.markAllRead(userId);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative w-9 h-9 border border-fs-line rounded-lg inline-flex items-center justify-center text-fs-ink hover:border-fs-green transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-fs-red text-white text-[9.5px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-11 right-0 w-80 bg-fs-paper border border-fs-line rounded-2xl shadow-2xl shadow-black/20 z-[80] overflow-hidden animate-fs-pop" role="dialog" aria-label="Notifications">
          <div className="flex justify-between items-center px-4 py-3.5 border-b border-fs-line text-[13.5px]">
            <strong className="text-fs-ink">Notifications</strong>
            {list.length > 0 && (
              <button
                type="button"
                className="text-fs-green font-bold underline text-[12.5px]"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {list.length > 0 ? (
              list.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-fs-line last:border-b-0 cursor-pointer hover:brightness-[0.98] transition-colors ${n.read ? '' : 'bg-fs-green-pale'}`}
                  onClick={() => handleNotifClick(n.id, n.link?.tab)}
                >
                  <div className="text-[13px] font-bold text-fs-ink">{n.title}</div>
                  <div className="text-xs text-fs-ink-soft mt-0.5">{n.body}</div>
                  <div className="text-[10.5px] text-fs-ink-soft mt-1">{timeAgo(n.ts)}</div>
                </div>
              ))
            ) : (
              <div className="py-8 px-4 text-center text-xs text-fs-ink-soft">
                You're all caught up — no notifications yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
