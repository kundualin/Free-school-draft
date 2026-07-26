export type Role = 'student' | 'teacher' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type DonationStatus = 'pending' | 'confirmed';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  password?: string;
  bio?: string;
  emailVerified: boolean;
  photo?: string | null;
  createdAt: number;
  
  // Student specific
  level?: string;
  progress?: Record<string, number>;

  // Tutor specific
  subjects?: string[];
  zoomLink?: string;
  qualification?: string;
  university?: string;
  experience?: string;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  categoryId: string;
  desc: string;
  level: string;
  createdAt: number;
  active: boolean;
}

export interface Session {
  id: string;
  teacherId: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  recurring?: boolean;
  createdAt: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  createdAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  attachment?: string;
  readBy: string[];
  ts: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'message' | 'session' | 'assignment' | 'tutor_application' | 'announcement';
  title: string;
  body: string;
  link?: { tab: string };
  read: boolean;
  ts: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  link: string;
  note?: string;
  submittedAt: number;
  status: string;
  grade: string | null;
}

export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  takenAt: number;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  status: 'present' | 'absent';
  ts: number;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: number;
  certNo: string;
}

export interface Review {
  id: string;
  studentId: string;
  teacherId: string;
  courseId: string;
  rating: number;
  comment?: string;
  createdAt: number;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  createdAt: number;
  status: 'open' | 'resolved';
}

export interface Donation {
  id: string;
  method: string;
  amount: number;
  txn: string;
  donorName: string;
  donorUserId?: string | null;
  createdAt: number;
  status: DonationStatus;
}

export interface Resource {
  id: string;
  courseId: string;
  teacherId: string;
  type: 'notes' | 'recording';
  title: string;
  link: string;
  createdAt: number;
}

export interface AppSettings {
  darkMode: boolean;
}

export interface TokenRecord {
  token: string;
  userId: string;
  createdAt: number;
}

export type ViewType = 
  | 'home'
  | 'explore'
  | 'contact'
  | 'mission'
  | 'privacy'
  | 'terms'
  | 'dashboard'
  | 'verify-pending'
  | 'verify'
  | 'reset'
  | 'not-found';

export type DashTabType =
  | 'overview'
  | 'courses'
  | 'sessions'
  | 'assignments'
  | 'quizzes'
  | 'certificates'
  | 'chat'
  | 'profile'
  | 'students'
  | 'resources'
  | 'tutors'
  | 'users'
  | 'admin-courses'
  | 'admin-sessions'
  | 'donations'
  | 'reports'
  | 'analytics'
  | 'settings';
