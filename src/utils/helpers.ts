import { Repo } from '../services/db';
import { User } from '../types';

export function escapeHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
}

export function initials(name: string): string {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtDateShort(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function fmtDateLong(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + 'd ago';
  return fmtDateShort(new Date(ts).toISOString().slice(0, 10));
}

export function isValidUrl(str: string): boolean {
  if (!str) return false;
  try {
    const u = new URL(str.startsWith('http') ? str : 'https://' + str);
    return !!u.hostname;
  } catch {
    return false;
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password should include both letters and numbers.';
  return null;
}

export function validateName(name: string): string | null {
  if (!name || name.trim().length < 2) return 'Enter your full name.';
  return null;
}

export const notify = {
  newMessage(toUserId: string, fromUser: User) {
    Repo.notifications.create({
      userId: toUserId,
      type: 'message',
      title: 'New message',
      body: `${fromUser.name} sent you a message.`,
      link: { tab: 'chat' }
    });
  },
  sessionReminder(userId: string, courseTitle: string, when: string) {
    Repo.notifications.create({
      userId,
      type: 'session',
      title: 'Upcoming class',
      body: `${courseTitle} starts ${when}.`,
      link: { tab: 'sessions' }
    });
  },
  newAssignment(userId: string, courseTitle: string) {
    Repo.notifications.create({
      userId,
      type: 'assignment',
      title: 'New assignment posted',
      body: `A new assignment was posted for ${courseTitle}.`,
      link: { tab: 'assignments' }
    });
  },
  assignmentGraded(userId: string, courseTitle: string, grade: string) {
    Repo.notifications.create({
      userId,
      type: 'assignment',
      title: 'Assignment graded',
      body: `Your submission for ${courseTitle} was graded: ${grade}.`,
      link: { tab: 'assignments' }
    });
  },
  tutorApproved(userId: string) {
    Repo.notifications.create({
      userId,
      type: 'announcement',
      title: "You're approved!",
      body: 'Your tutor application was approved. You can now schedule sessions.',
      link: { tab: 'overview' }
    });
  },
  tutorRejected(userId: string, reason: string) {
    Repo.notifications.create({
      userId,
      type: 'announcement',
      title: 'Tutor application update',
      body: reason ? `Your application needs changes: ${reason}` : 'Your tutor application was not approved this time.',
      link: { tab: 'profile' }
    });
  },
  newReview(teacherId: string, rating: number) {
    Repo.notifications.create({
      userId: teacherId,
      type: 'announcement',
      title: 'New review',
      body: `A student left you a ${rating}-star review.`,
      link: { tab: 'profile' }
    });
  },
  certificateIssued(userId: string, courseTitle: string) {
    Repo.notifications.create({
      userId,
      type: 'announcement',
      title: 'Certificate issued',
      body: `You've earned a certificate for ${courseTitle}.`,
      link: { tab: 'certificates' }
    });
  }
};
