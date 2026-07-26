import React, { useState } from 'react';
import {
  CalendarClock, BookOpen, FileText, Search, Calendar as CalendarIcon
} from 'lucide-react';
import { Repo } from '../services/db';
import { Pill } from '../components/Pill';
import { StarRating, StarRatingInput } from '../components/StarRating';
import { Calendar } from '../components/Calendar';
import { Chat } from '../components/Chat';
import { User, DashTabType, Course, Quiz } from '../types';
import {
  fmtDateShort, fmtDateLong, isValidUrl, validateName, validateEmail, notify
} from '../utils/helpers';

interface StudentDashboardProps {
  user: User;
  activeTab: DashTabType;
  onNavigateTab: (tab: DashTabType) => void;
  onOpenReportModal: (targetUserId: string) => void;
  onShowToast: (msg: string, tone?: 'success' | 'error') => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  activeTab,
  onNavigateTab,
  onOpenReportModal,
  onShowToast,
  onUpdateUser
}) => {
  // Local states
  const [browseSearch, setBrowseSearch] = useState('');
  const [browseCategory, setBrowseCategory] = useState('all');

  const [reviewFormFor, setReviewFormFor] = useState<string | null>(null); // "courseId__teacherId"
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const [calendarMonth, setCalendarMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  });

  const [submitAssignmentId, setSubmitAssignmentId] = useState<string | null>(null);
  const [assignmentLink, setAssignmentLink] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const [profileName, setRegName] = useState(user.name);
  const [profileEmail, setRegEmail] = useState(user.email);
  const [profileLevel, setRegLevel] = useState(user.level || 'SSC candidate');
  const [profileBio, setRegBio] = useState(user.bio || '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Helper getters
  const myEnrolledCourseIds = Repo.enrollments.all()
    .filter(e => e.userId === user.id)
    .map(e => e.courseId);

  const myCourses = Repo.courses.all().filter(c => myEnrolledCourseIds.includes(c.id));

  const upcomingSessions = Repo.sessions.all()
    .filter(s => myEnrolledCourseIds.includes(s.courseId))
    .filter(s => new Date(s.date + 'T' + s.time) >= new Date(Date.now() - 3 * 3600 * 1000))
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const courseProgressPct = (courseId: string) => {
    const sessions = Repo.sessions.all().filter(s => s.courseId === courseId && new Date(s.date + 'T' + s.time) < new Date());
    if (!sessions.length) return 0;
    const attended = sessions.filter(s => {
      const rec = Repo.attendance.all().find(a => a.sessionId === s.id && a.userId === user.id);
      return rec && rec.status === 'present';
    }).length;
    return Math.round((attended / sessions.length) * 100);
  };

  const pendingAssignments = Repo.assignments.all()
    .filter(a => myEnrolledCourseIds.includes(a.courseId))
    .filter(a => !Repo.submissions.all().some(s => s.assignmentId === a.id && s.studentId === user.id));

  /* Actions */
  const toggleEnroll = (courseId: string, currentlyJoined: boolean) => {
    if (currentlyJoined) {
      Repo.enrollments.remove(user.id, courseId);
      onShowToast('Left course.');
    } else {
      Repo.enrollments.create({ userId: user.id, courseId });
      onShowToast('Joined course — check "My routine" for sessions.');
    }
  };

  const handleJoinCall = (sessionId: string) => {
    const s = Repo.sessions.get(sessionId);
    if (!s) return;
    const teacher = Repo.users.get(s.teacherId);
    const link = teacher?.zoomLink || '';

    Repo.attendance.mark(sessionId, user.id, 'present');

    if (link && isValidUrl(link)) {
      window.open(link.startsWith('http') ? link : 'https://' + link, '_blank');
    } else {
      onShowToast("This tutor hasn't added a valid Zoom/Meet link yet.", 'error');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent, courseId: string, teacherId: string) => {
    e.preventDefault();
    Repo.reviews.create({
      studentId: user.id,
      teacherId,
      courseId,
      rating: reviewRating,
      comment: reviewComment.trim()
    });
    notify.newReview(teacherId, reviewRating);
    setReviewFormFor(null);
    setReviewComment('');
    setReviewRating(5);
    onShowToast('Thanks for your review!');
  };

  const handleSubmitAssignment = (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!isValidUrl(assignmentLink.trim())) {
      onShowToast('Enter a valid link to your work.', 'error');
      return;
    }
    Repo.submissions.create({
      assignmentId,
      studentId: user.id,
      link: assignmentLink.trim(),
      note: assignmentNote.trim()
    });
    setSubmitAssignmentId(null);
    setAssignmentLink('');
    setAssignmentNote('');
    onShowToast('Assignment submitted.');
  };

  const handleQuizSubmit = (e: React.FormEvent, quiz: Quiz) => {
    e.preventDefault();
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctIndex) {
        score++;
      }
    });

    Repo.quizAttempts.create({
      quizId: quiz.id,
      studentId: user.id,
      score
    });

    setActiveQuizId(null);
    setQuizAnswers({});
    onShowToast(`Quiz submitted — you scored ${score}/${quiz.questions.length}.`);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const nameErr = validateName(profileName);
    const emailErr = validateEmail(profileEmail);
    if (nameErr) errs.name = nameErr;
    if (emailErr) errs.email = emailErr;

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    const updated = Repo.users.update(user.id, {
      name: profileName.trim(),
      email: profileEmail.trim().toLowerCase(),
      bio: profileBio.trim(),
      level: profileLevel
    });

    if (updated) {
      onUpdateUser(updated);
      onShowToast('Profile updated.');
    }
  };

  // Render Panel content
  if (activeTab === 'chat') {
    return (
      <Chat
        user={user}
        onOpenReportModal={onOpenReportModal}
        onShowToast={onShowToast}
      />
    );
  }

  if (activeTab === 'courses') {
    const categories = Repo.categories.all();
    const filtered = Repo.courses.all().filter(c => {
      if (c.active === false) return false;
      if (browseCategory !== 'all' && c.categoryId !== browseCategory) return false;
      if (browseSearch.trim()) {
        const q = browseSearch.toLowerCase().trim();
        return c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q);
      }
      return true;
    });

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Browse courses</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Join a course to see it on your routine and message its tutors.</p>
        </div>

        <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-2 bg-fs-paper border-[1.5px] border-fs-line rounded-lg px-3.5 py-2.5 flex-1 min-w-[220px] max-w-[360px] transition-colors focus-within:border-fs-green-mid">
            <Search className="w-4 h-4 text-fs-ink-soft flex-shrink-0" />
            <input
              type="text"
              value={browseSearch}
              onChange={(e) => setBrowseSearch(e.target.value)}
              placeholder="Search courses..."
              className="border-none bg-transparent text-sm w-full text-fs-ink focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] cursor-pointer whitespace-nowrap transition-colors ${
                browseCategory === 'all'
                  ? 'bg-fs-green text-fs-paper border-fs-green'
                  : 'bg-fs-paper border-fs-line text-fs-ink-soft hover:border-fs-green'
              }`}
              onClick={() => setBrowseCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] cursor-pointer whitespace-nowrap transition-colors ${
                  browseCategory === cat.id
                    ? 'bg-fs-green text-fs-paper border-fs-green'
                    : 'bg-fs-paper border-fs-line text-fs-ink-soft hover:border-fs-green'
                }`}
                onClick={() => setBrowseCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {filtered.map(c => {
            const joined = myEnrolledCourseIds.includes(c.id);
            const teachers = Repo.users.all().filter(u => u.role === 'teacher' && u.verificationStatus === 'approved' && (u.subjects || []).includes(c.id));

            return (
              <div key={c.id} className="fs-card-hover bg-fs-paper border border-fs-line rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2.5">
                  <div>
                    <div className="font-mono text-[11px] text-fs-ink-soft tracking-wide">{c.code}</div>
                    <h3 className="text-[17px] text-fs-green font-serif font-semibold mt-1">{c.title}</h3>
                  </div>
                  {joined && <Pill text="Joined" tone="default" withDot />}
                </div>

                <p className="text-[13.5px] text-fs-ink-soft leading-relaxed flex-1">{c.desc}</p>

                {teachers.length > 0 ? (
                  teachers.map(t => {
                    const reviewKey = `${c.id}__${t.id}`;
                    const isReviewing = reviewFormFor === reviewKey;

                    return (
                      <div key={t.id} className="w-full">
                        <div className="flex items-center justify-between gap-2 text-[12.5px] text-fs-ink-soft w-full">
                          <span className="flex items-center gap-2">{t.name}</span>
                          {joined && (
                            <button
                              type="button"
                              className="text-fs-green font-bold underline text-[12.5px]"
                              onClick={() => { setReviewFormFor(isReviewing ? null : reviewKey); setReviewRating(5); setReviewComment(''); }}
                            >
                              Rate tutor
                            </button>
                          )}
                        </div>

                        {isReviewing && (
                          <form
                            className="bg-fs-cream border border-dashed border-fs-line rounded-lg p-3.5 mt-2 w-full"
                            onSubmit={(e) => handleReviewSubmit(e, c.id, t.id)}
                          >
                            <div className="mb-3.5">
                              <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Your rating</label>
                              <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                            </div>
                            <div className="mb-3.5">
                              <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Comment (optional)</label>
                              <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="How was this tutor?"
                                className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green min-h-[70px]"
                              />
                            </div>
                            <div className="flex gap-2.5">
                              <button
                                type="submit"
                                className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                              >
                                Submit review
                              </button>
                              <button
                                type="button"
                                className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                                onClick={() => setReviewFormFor(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-fs-ink-soft">No tutor assigned yet</div>
                )}

                <button
                  type="button"
                  className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors ${
                    joined
                      ? 'bg-transparent text-fs-green border border-fs-line hover:border-fs-green'
                      : 'bg-fs-green text-fs-paper hover:bg-fs-green-mid'
                  }`}
                  onClick={() => toggleEnroll(c.id, joined)}
                >
                  {joined ? 'Leave course' : 'Join course'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeTab === 'sessions') {
    const eventsByDate: Record<string, { label: string }[]> = {};
    Repo.sessions.all().filter(s => myEnrolledCourseIds.includes(s.courseId)).forEach(s => {
      const course = Repo.courses.get(s.courseId);
      (eventsByDate[s.date] = eventsByDate[s.date] || []).push({ label: course ? course.title : 'Session' });
    });

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My routine</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Sessions from the courses you've joined.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Upcoming sessions</h3>
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((s) => {
                const course = Repo.courses.get(s.courseId);
                const teacher = Repo.users.get(s.teacherId);
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3.5 py-3.5 border-b border-fs-line last:border-b-0">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                        {fmtDateShort(s.date)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-fs-ink">{course?.title || 'Session'}</div>
                        <div className="text-xs text-fs-ink-soft mt-0.5">
                          {s.time} · with {teacher ? teacher.name : 'Tutor'} {s.recurring ? ' · 🔁 Weekly' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-3 py-1.5 text-[13px] hover:-translate-y-px transition-all"
                      onClick={() => handleJoinCall(s.id)}
                    >
                      Join call
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft">
                <p className="text-sm">No sessions on your routine yet.</p>
                <button
                  type="button"
                  className="mt-3 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                  onClick={() => onNavigateTab('courses')}
                >
                  Browse courses
                </button>
              </div>
            )}
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <Calendar
              year={calendarMonth.year}
              month={calendarMonth.month}
              eventsByDate={eventsByDate}
              onShiftMonth={(delta) => {
                let m = calendarMonth.month + delta;
                let y = calendarMonth.year;
                if (m < 0) { m = 11; y--; }
                if (m > 11) { m = 0; y++; }
                setCalendarMonth({ year: y, month: m });
              }}
              onDayClick={(dateStr) => onShowToast('Sessions on ' + fmtDateLong(dateStr))}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'assignments') {
    const assignments = Repo.assignments.all().filter(a => myEnrolledCourseIds.includes(a.courseId));

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Assignments</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Work assigned by your tutors, due dates, and submission status.</p>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {assignments.length > 0 ? (
            assignments.map((a) => {
              const course = Repo.courses.get(a.courseId);
              const submission = Repo.submissions.all().find(s => s.assignmentId === a.id && s.studentId === user.id);
              const overdue = a.dueDate && new Date(a.dueDate) < new Date() && !submission;
              const isSubmitting = submitAssignmentId === a.id;

              return (
                <div key={a.id} className="py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="flex items-start justify-between gap-3.5">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                        {a.dueDate ? fmtDateShort(a.dueDate) : '—'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-fs-ink">
                          {a.title} <span className="text-xs text-fs-ink-soft font-normal">· {course?.title || ''}</span>
                        </div>
                        <div className="text-xs text-fs-ink-soft mt-0.5">{a.description}</div>
                        {submission ? (
                          <div className="text-[11.5px] font-bold mt-1 text-fs-green">
                            {submission.grade != null ? `Graded: ${submission.grade}` : 'Submitted — awaiting grade'}
                          </div>
                        ) : overdue ? (
                          <div className="text-[11.5px] font-bold mt-1 text-fs-red">Overdue</div>
                        ) : null}
                      </div>
                    </div>

                    {submission ? (
                      <Pill text="Submitted" tone="gold" withDot />
                    ) : (
                      <button
                        type="button"
                        className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                        onClick={() => { setSubmitAssignmentId(isSubmitting ? null : a.id); setAssignmentLink(''); setAssignmentNote(''); }}
                      >
                        Submit
                      </button>
                    )}
                  </div>

                  {isSubmitting && (
                    <form className="bg-fs-cream border border-dashed border-fs-line rounded-lg p-3.5 my-2 w-full" onSubmit={(e) => handleSubmitAssignment(e, a.id)}>
                      <div className="mb-3.5">
                        <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Link to your work (Google Drive, Docs, etc.)</label>
                        <input
                          type="text"
                          value={assignmentLink}
                          onChange={(e) => setAssignmentLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          required
                          className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                        />
                      </div>
                      <div className="mb-3.5">
                        <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Notes for your tutor (optional)</label>
                        <textarea
                          value={assignmentNote}
                          onChange={(e) => setAssignmentNote(e.target.value)}
                          className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green min-h-[70px]"
                        />
                      </div>
                      <div className="flex gap-2.5">
                        <button type="submit" className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-3 py-1.5 text-[13px] font-semibold rounded-lg">
                          Submit assignment
                        </button>
                        <button type="button" className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg" onClick={() => setSubmitAssignmentId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No assignments yet — join a course to see work from your tutors here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'quizzes') {
    const quizzes = Repo.quizzes.all().filter(q => myEnrolledCourseIds.includes(q.courseId));
    const activeQuiz = activeQuizId ? Repo.quizzes.get(activeQuizId) : null;

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Quizzes</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Quick checks from your tutors — take them anytime.</p>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px] mb-5">
          {quizzes.length > 0 ? (
            quizzes.map((q) => {
              const course = Repo.courses.get(q.courseId);
              const attempt = Repo.quizAttempts.all().find(a => a.quizId === q.id && a.studentId === user.id);

              return (
                <div key={q.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                      {q.questions.length}Q
                    </div>
                    <div>
                      <div className="text-sm font-bold text-fs-ink">
                        {q.title} <span className="text-xs text-fs-ink-soft font-normal">· {course?.title || ''}</span>
                      </div>
                      <div className="text-xs text-fs-ink-soft mt-0.5">
                        {attempt ? `Scored ${attempt.score}/${q.questions.length}` : 'Not attempted yet'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg ${
                      attempt
                        ? 'bg-transparent text-fs-green border border-fs-line hover:border-fs-green'
                        : 'bg-fs-green text-fs-paper hover:bg-fs-green-mid'
                    }`}
                    onClick={() => { setActiveQuizId(q.id); setQuizAnswers({}); }}
                  >
                    {attempt ? 'Retake' : 'Take quiz'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No quizzes available yet.</p>
            </div>
          )}
        </div>

        {/* Active Quiz Taker */}
        {activeQuiz && (
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px] animate-fs-pop">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base text-fs-green font-serif font-semibold">{activeQuiz.title}</h3>
              <Pill text={`${activeQuiz.questions.length} question(s)`} />
            </div>

            <form onSubmit={(e) => handleQuizSubmit(e, activeQuiz)}>
              {activeQuiz.questions.map((q, i) => (
                <div key={i} className="py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="font-semibold text-[13.5px] text-fs-ink mb-2.5">
                    {i + 1}. {q.text}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className={`flex items-center gap-2.5 text-[13px] text-fs-ink py-2 px-3 rounded-lg border border-fs-line cursor-pointer transition-colors ${
                          quizAnswers[i] === oi ? 'border-fs-green bg-fs-green-pale/60 font-semibold' : 'hover:bg-fs-cream'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          checked={quizAnswers[i] === oi}
                          onChange={() => setQuizAnswers({ ...quizAnswers, [i]: oi })}
                          required
                          className="accent-fs-green"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-2.5 mt-4">
                <button type="submit" className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-4 py-2 text-sm font-semibold rounded-lg">
                  Submit quiz
                </button>
                <button type="button" className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-4 py-2 text-sm font-semibold rounded-lg" onClick={() => setActiveQuizId(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'certificates') {
    const certs = Repo.certificates.forUser(user.id);

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Certificates</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Earned once you complete a course's sessions and requirements.</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
          {certs.length > 0 ? (
            certs.map((c, i) => {
              const course = Repo.courses.get(c.courseId);
              return (
                <div
                  key={c.id}
                  className="fs-card-hover fs-stagger bg-fs-paper border-2 border-fs-gold rounded-2xl px-[22px] py-7 text-center relative"
                  style={{ '--fs-delay': `${i * 90}ms` } as React.CSSProperties}
                >
                  <div className="text-3xl mb-2.5">🎓</div>
                  <div className="font-serif text-base text-fs-green font-bold">Certificate of Completion</div>
                  <div className="text-[13px] text-fs-ink-soft mt-1.5">{course ? course.title : 'Course'}</div>
                  <div className="text-[15px] font-bold mt-3.5 text-fs-ink">{user.name}</div>
                  <div className="text-[11.5px] text-fs-ink-soft mt-1.5">
                    Issued {fmtDateLong(new Date(c.issuedAt).toISOString().slice(0, 10))}
                  </div>
                  <div className="font-mono text-[10px] text-fs-gold mt-2.5 tracking-wide">{c.certNo}</div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-fs-ink-soft">
              <div className="text-3xl mb-2">🎓</div>
              <p className="text-sm">No certificates yet — attend sessions and complete assignments to earn one.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My profile</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">This is what tutors see about you.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Details</h3>
            <form onSubmit={handleProfileSubmit} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Full name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                      profileErrors.name ? 'border-fs-red' : 'border-fs-line'
                    }`}
                  />
                  {profileErrors.name && <div className="text-[11.5px] text-fs-red mt-1">{profileErrors.name}</div>}
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                      profileErrors.email ? 'border-fs-red' : 'border-fs-line'
                    }`}
                  />
                  {profileErrors.email && <div className="text-[11.5px] text-fs-red mt-1">{profileErrors.email}</div>}
                </div>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Class / level</label>
                <select
                  value={profileLevel}
                  onChange={(e) => setRegLevel(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                >
                  <option>SSC candidate</option>
                  <option>HSC 1st year</option>
                  <option>HSC 2nd year</option>
                  <option>Admission candidate</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Short bio</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Tell your tutors a little about yourself..."
                  className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid min-h-[70px]"
                />
              </div>

              <button type="submit" className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors">
                Save changes
              </button>
            </form>
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Preview</h3>
            <div className="text-center py-2.5 pb-5">
              <div className="inline-block">
                <div className="w-16 h-16 rounded-full bg-fs-green text-fs-gold-pale flex items-center justify-center font-bold font-serif text-xl mx-auto">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="font-bold text-base mt-2.5 text-fs-ink">{profileName}</div>
              <div className="text-xs text-fs-ink-soft">{profileLevel}</div>
            </div>
            <p className="text-xs text-fs-ink-soft leading-relaxed">{profileBio || 'No bio added yet.'}</p>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT Overview Tab
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Here's what's next in your learning.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{upcomingSessions.length}</b>
            <span className="text-xs text-fs-ink-soft">Upcoming sessions</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{myCourses.length}</b>
            <span className="text-xs text-fs-ink-soft">Courses joined</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <FileText className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{pendingAssignments.length}</b>
            <span className="text-xs text-fs-ink-soft">Assignments due</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Upcoming sessions</h3>
          {upcomingSessions.length > 0 ? (
            upcomingSessions.slice(0, 5).map((s) => {
              const course = Repo.courses.get(s.courseId);
              const teacher = Repo.users.get(s.teacherId);
              return (
                <div key={s.id} className="flex items-center justify-between gap-3.5 py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                      {fmtDateShort(s.date)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-fs-ink">{course?.title || 'Session'}</div>
                      <div className="text-xs text-fs-ink-soft mt-0.5">
                        {s.time} · with {teacher ? teacher.name : 'Tutor'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-3 py-1.5 text-[13px] transition-all"
                    onClick={() => handleJoinCall(s.id)}
                  >
                    Join call
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No sessions on your routine yet — join a course to get started.</p>
              <button
                type="button"
                className="mt-3 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                onClick={() => onNavigateTab('courses')}
              >
                Browse courses
              </button>
            </div>
          )}
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Your courses</h3>
          {myCourses.length > 0 ? (
            myCourses.map((c) => {
              const pct = courseProgressPct(c.id);
              return (
                <div key={c.id} className="flex flex-col gap-2 py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-bold text-fs-ink">{c.title}</div>
                    <span className="text-xs font-semibold text-fs-ink-soft tabular-nums">{pct}%</span>
                  </div>
                  <div className="w-full h-[7px] bg-fs-line/60 rounded-full overflow-hidden">
                    <div className="h-full bg-fs-green rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">You haven't joined any courses yet.</p>
              <button
                type="button"
                className="mt-3 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                onClick={() => onNavigateTab('courses')}
              >
                Browse courses
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
