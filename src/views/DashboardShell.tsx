import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, FileText, HelpCircle, Award,
  MessageSquare, User as UserIcon, Users, UserCheck, HeartHandshake, Flag, BarChart2, Settings
} from 'lucide-react';
import { Repo } from '../services/db';
import { Avatar } from '../components/Avatar';
import { Footer } from '../components/Footer';
import { StudentDashboard } from './StudentDashboard';
import { TutorDashboard } from './TutorDashboard';
import { AdminDashboard } from './AdminDashboard';
import { User, ViewType, DashTabType } from '../types';

interface DashboardShellProps {
  user: User;
  onNavigate: (view: ViewType) => void;
  onOpenReportModal: (targetUserId: string) => void;
  onShowToast: (msg: string, tone?: 'success' | 'error') => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  user,
  onNavigate,
  onOpenReportModal,
  onShowToast,
  onUpdateUser
}) => {
  const [activeTab, setActiveTab] = useState<DashTabType>('overview');

  const pendingTutorCount = Repo.users.all().filter(u => u.role === 'teacher' && u.verificationStatus === 'pending').length;
  const openReportCount = Repo.reports.all().filter(r => r.status === 'open').length;

  const getNavItems = (): { id: DashTabType; label: string; icon: React.ReactNode; badge?: number }[] => {
    if (user.role === 'student') {
      return [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'courses', label: 'Browse courses', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'sessions', label: 'My routine', icon: <Calendar className="w-4 h-4" /> },
        { id: 'assignments', label: 'Assignments', icon: <FileText className="w-4 h-4" /> },
        { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="w-4 h-4" /> },
        { id: 'certificates', label: 'Certificates', icon: <Award className="w-4 h-4" /> },
        { id: 'chat', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'profile', label: 'My profile', icon: <UserIcon className="w-4 h-4" /> }
      ];
    }

    if (user.role === 'teacher') {
      return [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'courses', label: 'My courses', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'sessions', label: 'My sessions', icon: <Calendar className="w-4 h-4" /> },
        { id: 'students', label: 'My students', icon: <Users className="w-4 h-4" /> },
        { id: 'resources', label: 'Notes & recordings', icon: <FileText className="w-4 h-4" /> },
        { id: 'assignments', label: 'Assignments', icon: <FileText className="w-4 h-4" /> },
        { id: 'quizzes', label: 'Quizzes', icon: <HelpCircle className="w-4 h-4" /> },
        { id: 'chat', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'profile', label: 'My profile', icon: <UserIcon className="w-4 h-4" /> }
      ];
    }

    // Admin
    return [
      { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'tutors', label: 'Manage tutors', icon: <UserCheck className="w-4 h-4" />, badge: pendingTutorCount },
      { id: 'users', label: 'Manage users', icon: <Users className="w-4 h-4" /> },
      { id: 'admin-courses', label: 'Manage courses', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'admin-sessions', label: 'Manage sessions', icon: <Calendar className="w-4 h-4" /> },
      { id: 'donations', label: 'Donations', icon: <HeartHandshake className="w-4 h-4" /> },
      { id: 'reports', label: 'Reports', icon: <Flag className="w-4 h-4" />, badge: openReportCount },
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings & export', icon: <Settings className="w-4 h-4" /> }
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex flex-col bg-fs-cream">
      <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-[1240px] w-full mx-auto flex-1">
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <aside className="bg-fs-paper border border-fs-line rounded-2xl p-4 sm:p-5 md:sticky md:top-24">
            <div className="flex items-center gap-3 py-1 mb-4 border-b border-fs-line pb-4">
              <Avatar name={user.name} size={40} photo={user.photo} />
              <div className="min-w-0">
                <div className="font-bold text-sm text-fs-ink truncate">{user.name}</div>
                <div className="text-xs text-fs-ink-soft capitalize">{user.role}</div>
              </div>
            </div>

            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors w-full ${
                      isActive
                        ? 'bg-fs-green text-fs-paper'
                        : 'text-fs-ink-soft hover:bg-fs-cream hover:text-fs-ink'
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className={isActive ? 'text-fs-paper' : 'text-fs-ink-soft'}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {!!item.badge && item.badge > 0 && (
                      <span className="bg-fs-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Dashboard Panel */}
          <main className="min-w-0 animate-fs-fade-in">
            {user.role === 'student' && (
              <StudentDashboard
                user={user}
                activeTab={activeTab}
                onNavigateTab={setActiveTab}
                onOpenReportModal={onOpenReportModal}
                onShowToast={onShowToast}
                onUpdateUser={onUpdateUser}
              />
            )}

            {user.role === 'teacher' && (
              <TutorDashboard
                user={user}
                activeTab={activeTab}
                onNavigateTab={setActiveTab}
                onOpenReportModal={onOpenReportModal}
                onShowToast={onShowToast}
                onUpdateUser={onUpdateUser}
              />
            )}

            {user.role === 'admin' && (
              <AdminDashboard
                user={user}
                activeTab={activeTab}
                onNavigateTab={setActiveTab}
                onShowToast={onShowToast}
              />
            )}
          </main>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
