import {
  User, Course, Category, Session, Enrollment, Message, NotificationItem,
  Assignment, Submission, Quiz, QuizAttempt, AttendanceRecord, Certificate,
  Review, Report, Donation, Resource, AppSettings, TokenRecord
} from '../types';

const DB_KEY = 'freeschool_db_v2';
const SESSION_KEY = 'freeschool_session_v2';

export const ADMIN_EMAIL = 'admin@freeschool.org';
export const ADMIN_PASSWORD = 'FreeSchool2026!';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_science', name: 'Science', icon: '🔬' },
  { id: 'cat_math', name: 'Mathematics', icon: '📐' },
  { id: 'cat_english', name: 'English & Languages', icon: '🗣️' },
  { id: 'cat_ict', name: 'ICT & Programming', icon: '💻' },
  { id: 'cat_admission', name: 'Admission Prep', icon: '🎯' }
];

const DEFAULT_COURSES: Course[] = [
  {
    id: 'c1', code: 'PHY-101', title: 'HSC Physics 1st Paper',
    categoryId: 'cat_science',
    desc: 'Mechanics, waves and vectors explained the way Bangla-medium boards actually ask them — with board-question walkthroughs.',
    level: 'HSC', createdAt: Date.now(), active: true
  },
  {
    id: 'c2', code: 'MATH-201', title: 'SSC Higher Math',
    categoryId: 'cat_math',
    desc: 'Algebra, geometry and trigonometry built up from SSC basics, aimed at students prepping for HSC and admission tests.',
    level: 'SSC', createdAt: Date.now(), active: true
  },
  {
    id: 'c3', code: 'ENG-110', title: 'English for Admission & IELTS',
    categoryId: 'cat_english',
    desc: 'Grammar, comprehension and spoken practice tuned for Dhaka University, engineering admission tests, and IELTS bands.',
    level: 'Admission', createdAt: Date.now(), active: true
  },
  {
    id: 'c4', code: 'ICT-150', title: 'ICT & Intro to Programming',
    categoryId: 'cat_ict',
    desc: 'HSC ICT syllabus plus a gentle first look at real programming — for students curious beyond the exam.',
    level: 'HSC', createdAt: Date.now(), active: true
  },
  {
    id: 'c5', code: 'ADM-300', title: 'University Admission Strategy',
    categoryId: 'cat_admission',
    desc: 'A guided track for engineering & varsity admission tests: MCQ tactics, time management, and past question review.',
    level: 'Admission', createdAt: Date.now(), active: true
  }
];

function seedAdmin(): User {
  return {
    id: 'admin_root',
    role: 'admin',
    name: 'Free School Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    emailVerified: true,
    createdAt: Date.now()
  };
}

interface DatabaseSchema {
  users: User[];
  courses: Course[];
  categories: Category[];
  sessions: Session[];
  enrollments: Enrollment[];
  messages: Message[];
  notifications: NotificationItem[];
  assignments: Assignment[];
  submissions: Submission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  attendance: AttendanceRecord[];
  certificates: Certificate[];
  reviews: Review[];
  reports: Report[];
  donations: Donation[];
  resources: Resource[];
  verificationTokens: TokenRecord[];
  resetTokens: TokenRecord[];
  settings: AppSettings;
}

function freshDB(): DatabaseSchema {
  return {
    users: [seedAdmin()],
    courses: JSON.parse(JSON.stringify(DEFAULT_COURSES)),
    categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
    sessions: [],
    enrollments: [],
    messages: [],
    notifications: [],
    assignments: [],
    submissions: [],
    quizzes: [],
    quizAttempts: [],
    attendance: [],
    certificates: [],
    reviews: [],
    reports: [],
    donations: [],
    resources: [],
    verificationTokens: [],
    resetTokens: [],
    settings: { darkMode: false }
  };
}

let DB: DatabaseSchema | null = null;

export function loadDB(): DatabaseSchema {
  if (DB) return DB;
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      DB = JSON.parse(raw);
      migrateDB();
      return DB!;
    } catch {
      /* fall through to fresh */
    }
  }
  DB = freshDB();
  persist();
  return DB;
}

function migrateDB() {
  if (!DB) return;
  const fresh = freshDB();
  (Object.keys(fresh) as Array<keyof DatabaseSchema>).forEach(key => {
    if (!(key in DB!)) {
      (DB as unknown as Record<string, unknown>)[key] = fresh[key];
    }
  });
  if (!DB.users.some(u => u.email === ADMIN_EMAIL)) {
    DB.users.unshift(seedAdmin());
  }
  if (!DB.settings) DB.settings = { darkMode: false };
}

function persist() {
  if (DB) {
    localStorage.setItem(DB_KEY, JSON.stringify(DB));
  }
}

function uid(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

/* Session Helpers */
export function getSessionUserId(): string | null {
  return sessionStorage.getItem(SESSION_KEY) || null;
}

export function setSessionUserId(id: string | null): void {
  if (id) sessionStorage.setItem(SESSION_KEY, id);
  else sessionStorage.removeItem(SESSION_KEY);
}

/* Repositories */
export const Repo = {
  users: {
    all(): User[] { return loadDB().users; },
    get(id: string): User | null { return loadDB().users.find(u => u.id === id) || null; },
    getByEmail(email: string): User | null {
      return loadDB().users.find(u => u.email.toLowerCase() === (email || '').toLowerCase()) || null;
    },
    create(data: Omit<User, 'id' | 'createdAt'>): User {
      const db = loadDB();
      const user: User = { id: uid('u'), createdAt: Date.now(), ...data };
      db.users.push(user);
      persist();
      return user;
    },
    update(id: string, patch: Partial<User>): User | null {
      const db = loadDB();
      const u = db.users.find(x => x.id === id);
      if (!u) return null;
      Object.assign(u, patch);
      persist();
      return u;
    },
    remove(id: string): void {
      const db = loadDB();
      db.users = db.users.filter(u => u.id !== id);
      persist();
    }
  },

  categories: {
    all(): Category[] { return loadDB().categories; },
    get(id: string): Category | null { return loadDB().categories.find(c => c.id === id) || null; }
  },

  courses: {
    all(): Course[] { return loadDB().courses; },
    get(id: string): Course | null { return loadDB().courses.find(c => c.id === id) || null; },
    create(data: Omit<Course, 'id' | 'createdAt'>): Course {
      const db = loadDB();
      const course: Course = { id: uid('course'), createdAt: Date.now(), active: true, ...data };
      db.courses.push(course);
      persist();
      return course;
    },
    update(id: string, patch: Partial<Course>): Course | null {
      const db = loadDB();
      const c = db.courses.find(x => x.id === id);
      if (!c) return null;
      Object.assign(c, patch);
      persist();
      return c;
    },
    remove(id: string): void {
      const db = loadDB();
      db.courses = db.courses.filter(c => c.id !== id);
      persist();
    }
  },

  sessions: {
    all(): Session[] { return loadDB().sessions; },
    get(id: string): Session | null { return loadDB().sessions.find(s => s.id === id) || null; },
    create(data: Omit<Session, 'id' | 'createdAt'>): Session {
      const db = loadDB();
      const s: Session = { id: uid('s'), createdAt: Date.now(), ...data };
      db.sessions.push(s);
      persist();
      return s;
    },
    update(id: string, patch: Partial<Session>): Session | null {
      const db = loadDB();
      const s = db.sessions.find(x => x.id === id);
      if (!s) return null;
      Object.assign(s, patch);
      persist();
      return s;
    },
    remove(id: string): void {
      const db = loadDB();
      db.sessions = db.sessions.filter(s => s.id !== id);
      persist();
    }
  },

  enrollments: {
    all(): Enrollment[] { return loadDB().enrollments; },
    create(data: Omit<Enrollment, 'id' | 'createdAt'>): Enrollment {
      const db = loadDB();
      const e: Enrollment = { id: uid('en'), createdAt: Date.now(), ...data };
      db.enrollments.push(e);
      persist();
      return e;
    },
    remove(userId: string, courseId: string): void {
      const db = loadDB();
      db.enrollments = db.enrollments.filter(e => !(e.userId === userId && e.courseId === courseId));
      persist();
    }
  },

  messages: {
    all(): Message[] { return loadDB().messages; },
    create(data: Omit<Message, 'id' | 'ts' | 'readBy'>): Message {
      const db = loadDB();
      const m: Message = { id: uid('m'), ts: Date.now(), readBy: [data.senderId], ...data };
      db.messages.push(m);
      persist();
      return m;
    },
    markRead(chatId: string, userId: string): void {
      const db = loadDB();
      db.messages.forEach(m => {
        if (m.chatId === chatId && !m.readBy.includes(userId)) m.readBy.push(userId);
      });
      persist();
    }
  },

  notifications: {
    all(): NotificationItem[] { return loadDB().notifications; },
    forUser(userId: string): NotificationItem[] {
      return loadDB().notifications.filter(n => n.userId === userId).sort((a, b) => b.ts - a.ts);
    },
    create(data: Omit<NotificationItem, 'id' | 'ts' | 'read'>): NotificationItem {
      const db = loadDB();
      const n: NotificationItem = { id: uid('notif'), ts: Date.now(), read: false, ...data };
      db.notifications.unshift(n);
      persist();
      return n;
    },
    markRead(id: string): void {
      const db = loadDB();
      const n = db.notifications.find(x => x.id === id);
      if (n) n.read = true;
      persist();
    },
    markAllRead(userId: string): void {
      const db = loadDB();
      db.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
      persist();
    }
  },

  assignments: {
    all(): Assignment[] { return loadDB().assignments; },
    forCourse(courseId: string): Assignment[] { return loadDB().assignments.filter(a => a.courseId === courseId); },
    create(data: Omit<Assignment, 'id' | 'createdAt'>): Assignment {
      const db = loadDB();
      const a: Assignment = { id: uid('asg'), createdAt: Date.now(), ...data };
      db.assignments.push(a);
      persist();
      return a;
    },
    remove(id: string): void {
      const db = loadDB();
      db.assignments = db.assignments.filter(a => a.id !== id);
      persist();
    }
  },

  submissions: {
    all(): Submission[] { return loadDB().submissions; },
    create(data: Omit<Submission, 'id' | 'submittedAt' | 'status' | 'grade'> & { grade?: string | null }): Submission {
      const db = loadDB();
      const s: Submission = { id: uid('sub'), submittedAt: Date.now(), status: 'submitted', grade: data.grade || null, ...data };
      db.submissions.push(s);
      persist();
      return s;
    },
    update(id: string, patch: Partial<Submission>): Submission | null {
      const db = loadDB();
      const s = db.submissions.find(x => x.id === id);
      if (!s) return null;
      Object.assign(s, patch);
      persist();
      return s;
    }
  },

  quizzes: {
    all(): Quiz[] { return loadDB().quizzes; },
    get(id: string): Quiz | null { return loadDB().quizzes.find(q => q.id === id) || null; },
    forCourse(courseId: string): Quiz[] { return loadDB().quizzes.filter(q => q.courseId === courseId); },
    create(data: Omit<Quiz, 'id' | 'createdAt'>): Quiz {
      const db = loadDB();
      const q: Quiz = { id: uid('quiz'), createdAt: Date.now(), ...data };
      db.quizzes.push(q);
      persist();
      return q;
    },
    remove(id: string): void {
      const db = loadDB();
      db.quizzes = db.quizzes.filter(q => q.id !== id);
      persist();
    }
  },

  quizAttempts: {
    all(): QuizAttempt[] { return loadDB().quizAttempts; },
    create(data: Omit<QuizAttempt, 'id' | 'takenAt'>): QuizAttempt {
      const db = loadDB();
      const a: QuizAttempt = { id: uid('qa'), takenAt: Date.now(), ...data };
      db.quizAttempts.push(a);
      persist();
      return a;
    }
  },

  attendance: {
    all(): AttendanceRecord[] { return loadDB().attendance; },
    forSession(sessionId: string): AttendanceRecord[] { return loadDB().attendance.filter(a => a.sessionId === sessionId); },
    mark(sessionId: string, userId: string, status: 'present' | 'absent'): AttendanceRecord {
      const db = loadDB();
      let rec = db.attendance.find(a => a.sessionId === sessionId && a.userId === userId);
      if (rec) {
        rec.status = status;
      } else {
        rec = { id: uid('att'), sessionId, userId, status, ts: Date.now() };
        db.attendance.push(rec);
      }
      persist();
      return rec;
    }
  },

  certificates: {
    all(): Certificate[] { return loadDB().certificates; },
    forUser(userId: string): Certificate[] { return loadDB().certificates.filter(c => c.userId === userId); },
    create(data: Omit<Certificate, 'id' | 'issuedAt' | 'certNo'>): Certificate {
      const db = loadDB();
      const c: Certificate = {
        id: uid('cert'),
        issuedAt: Date.now(),
        certNo: 'FS-' + Date.now().toString(36).toUpperCase(),
        ...data
      };
      db.certificates.push(c);
      persist();
      return c;
    }
  },

  reviews: {
    all(): Review[] { return loadDB().reviews; },
    forTeacher(teacherId: string): Review[] { return loadDB().reviews.filter(r => r.teacherId === teacherId); },
    create(data: Omit<Review, 'id' | 'createdAt'>): Review {
      const db = loadDB();
      const r: Review = { id: uid('rev'), createdAt: Date.now(), ...data };
      db.reviews.push(r);
      persist();
      return r;
    }
  },

  reports: {
    all(): Report[] { return loadDB().reports; },
    create(data: Omit<Report, 'id' | 'createdAt' | 'status'>): Report {
      const db = loadDB();
      const r: Report = { id: uid('rep'), createdAt: Date.now(), status: 'open', ...data };
      db.reports.push(r);
      persist();
      return r;
    },
    update(id: string, patch: Partial<Report>): Report | null {
      const db = loadDB();
      const r = db.reports.find(x => x.id === id);
      if (!r) return null;
      Object.assign(r, patch);
      persist();
      return r;
    }
  },

  donations: {
    all(): Donation[] { return loadDB().donations; },
    create(data: Omit<Donation, 'id' | 'createdAt' | 'status'>): Donation {
      const db = loadDB();
      const d: Donation = { id: uid('don'), createdAt: Date.now(), status: 'pending', ...data };
      db.donations.push(d);
      persist();
      return d;
    },
    update(id: string, patch: Partial<Donation>): Donation | null {
      const db = loadDB();
      const d = db.donations.find(x => x.id === id);
      if (!d) return null;
      Object.assign(d, patch);
      persist();
      return d;
    }
  },

  resources: {
    all(): Resource[] { return loadDB().resources; },
    forCourse(courseId: string): Resource[] { return loadDB().resources.filter(r => r.courseId === courseId); },
    create(data: Omit<Resource, 'id' | 'createdAt'>): Resource {
      const db = loadDB();
      const r: Resource = { id: uid('res'), createdAt: Date.now(), ...data };
      db.resources.push(r);
      persist();
      return r;
    },
    remove(id: string): void {
      const db = loadDB();
      db.resources = db.resources.filter(r => r.id !== id);
      persist();
    }
  },

  tokens: {
    createVerification(userId: string): string {
      const db = loadDB();
      const token = uid('vtok');
      db.verificationTokens.push({ token, userId, createdAt: Date.now() });
      persist();
      return token;
    },
    consumeVerification(token: string): TokenRecord | null {
      const db = loadDB();
      const rec = db.verificationTokens.find(t => t.token === token);
      if (!rec) return null;
      db.verificationTokens = db.verificationTokens.filter(t => t.token !== token);
      persist();
      return rec;
    },
    createReset(userId: string): string {
      const db = loadDB();
      const token = uid('rtok');
      db.resetTokens.push({ token, userId, createdAt: Date.now() });
      persist();
      return token;
    },
    consumeReset(token: string): TokenRecord | null {
      const db = loadDB();
      const rec = db.resetTokens.find(t => t.token === token);
      if (!rec) return null;
      db.resetTokens = db.resetTokens.filter(t => t.token !== token);
      persist();
      return rec;
    }
  },

  settings: {
    get(): AppSettings { return loadDB().settings; },
    update(patch: Partial<AppSettings>): AppSettings {
      const db = loadDB();
      Object.assign(db.settings, patch);
      persist();
      return db.settings;
    }
  },

  session: {
    get(): User | null {
      const id = getSessionUserId();
      return id ? Repo.users.get(id) : null;
    },
    set(user: User | null): void {
      setSessionUserId(user ? user.id : null);
    },
    clear(): void {
      setSessionUserId(null);
    }
  }
};
