import React, { useState } from 'react';
import {
  CalendarClock, BookOpen, Users, Hourglass, AlertTriangle, Check, X, GraduationCap
} from 'lucide-react';
import { Repo } from '../services/db';
import { Pill } from '../components/Pill';
import { StarRating } from '../components/StarRating';
import { Calendar } from '../components/Calendar';
import { Chat } from '../components/Chat';
import { User, DashTabType, Course } from '../types';
import {
  fmtDateShort, fmtDateLong, isValidUrl, validateName, validateEmail, notify
} from '../utils/helpers';

interface TutorDashboardProps {
  user: User;
  activeTab: DashTabType;
  onNavigateTab: (tab: DashTabType) => void;
  onOpenReportModal: (targetUserId: string) => void;
  onShowToast: (msg: string, tone?: 'success' | 'error') => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  user,
  activeTab,
  onNavigateTab,
  onOpenReportModal,
  onShowToast,
  onUpdateUser
}) => {
  // If application pending or rejected
  if (user.verificationStatus === 'pending') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Application under review</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Our team is checking your qualifications and experience.</p>
        </div>
        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-2xl p-8 sm:p-10 text-center max-w-[480px] mx-auto animate-fs-pop">
          <div className="w-16 h-16 rounded-2xl bg-fs-gold-pale text-fs-gold flex items-center justify-center mx-auto mb-4">
            <Hourglass className="w-7 h-7" />
          </div>
          <h3 className="mb-2.5 text-base font-bold text-fs-ink">Thanks for applying, {user.name.split(' ')[0]}</h3>
          <p className="text-[13px] text-fs-ink-soft leading-relaxed">
            You'll be notified as soon as an administrator reviews your application. You can still edit your profile in the meantime.
          </p>
          <button
            type="button"
            className="mt-5 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-[18px] py-2.5 text-sm font-semibold rounded-lg"
            onClick={() => onNavigateTab('profile')}
          >
            Edit my profile
          </button>
        </div>
      </div>
    );
  }

  if (user.verificationStatus === 'rejected') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Application not approved</h1>
        </div>
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-8 sm:p-10 text-center max-w-[480px] mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-fs-red-soft text-fs-red flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <p className="text-[13px] text-fs-ink-soft leading-relaxed">
            {user.rejectionReason || 'Your application was not approved this time.'}
          </p>
        </div>
      </div>
    );
  }

  // Session state
  const mySubjects = Repo.courses.all().filter(c => (user.subjects || []).includes(c.id));

  const [sessionCourse, setSessionCourse] = useState(mySubjects.length > 0 ? mySubjects[0].id : '');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionRecurring, setSessionRecurring] = useState(false);

  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);

  const [calendarMonth, setCalendarMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  });

  const [resCourse, setResCourse] = useState(mySubjects.length > 0 ? mySubjects[0].id : '');
  const [resType, setResType] = useState<'notes' | 'recording'>('notes');
  const [resTitle, setResTitle] = useState('');
  const [resLink, setResLink] = useState('');

  const [asgCourse, setAsgCourse] = useState(mySubjects.length > 0 ? mySubjects[0].id : '');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDue, setAsgDue] = useState('');
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  const [quizCourse, setQuizCourse] = useState(mySubjects.length > 0 ? mySubjects[0].id : '');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<Array<{ text: string; options: string[]; correctIndex: number }>>([
    { text: '', options: ['', ''], correctIndex: 0 }
  ]);

  const [profileName, setProfName] = useState(user.name);
  const [profileEmail, setProfEmail] = useState(user.email);
  const [profileZoom, setProfZoom] = useState(user.zoomLink || '');
  const [profileQual, setProfQual] = useState(user.qualification || '');
  const [profileUni, setProfUni] = useState(user.university || '');
  const [profileBio, setProfBio] = useState(user.bio || '');
  const [profileSubjects, setProfSubjects] = useState<string[]>(user.subjects || []);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const mySessions = Repo.sessions.all()
    .filter(s => s.teacherId === user.id)
    .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

  const getMyStudents = () => {
    const subjects = user.subjects || [];
    const studentIds = new Set<string>();
    Repo.enrollments.all().forEach(e => {
      if (subjects.includes(e.courseId)) studentIds.add(e.userId);
    });
    return Repo.users.all().filter(u => studentIds.has(u.id));
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate || !sessionTime || !sessionCourse) {
      onShowToast('Pick course, date and time.', 'error');
      return;
    }

    const course = Repo.courses.get(sessionCourse);
    const datesToCreate = [sessionDate];
    if (sessionRecurring) {
      const d = new Date(sessionDate + 'T00:00:00');
      for (let i = 1; i < 8; i++) {
        d.setDate(d.getDate() + 7);
        datesToCreate.push(d.toISOString().slice(0, 10));
      }
    }

    datesToCreate.forEach(dt => {
      Repo.sessions.create({
        teacherId: user.id,
        courseId: sessionCourse,
        date: dt,
        time: sessionTime,
        recurring: sessionRecurring
      });
    });

    const enrolledIds = Repo.enrollments.all().filter(e => e.courseId === sessionCourse).map(e => e.userId);
    enrolledIds.forEach(sid => notify.sessionReminder(sid, course?.title || 'your course', `on ${fmtDateLong(sessionDate)} at ${sessionTime}`));

    onShowToast(sessionRecurring ? 'Recurring sessions added (8 weeks).' : 'Session scheduled.');
    setSessionDate('');
    setSessionTime('');
  };

  const handleDeleteSession = (id: string) => {
    Repo.sessions.remove(id);
    onShowToast('Session removed.');
  };

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(resLink.trim())) {
      onShowToast('Enter a valid link.', 'error');
      return;
    }
    Repo.resources.create({
      courseId: resCourse,
      teacherId: user.id,
      type: resType,
      title: resTitle.trim(),
      link: resLink.trim()
    });
    setResTitle('');
    setResLink('');
    onShowToast('Resource shared with students.');
  };

  const handlePostAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim()) {
      onShowToast('Enter a title.', 'error');
      return;
    }
    Repo.assignments.create({
      courseId: asgCourse,
      teacherId: user.id,
      title: asgTitle.trim(),
      description: asgDesc.trim(),
      dueDate: asgDue || null
    });

    const course = Repo.courses.get(asgCourse);
    Repo.enrollments.all().filter(e => e.courseId === asgCourse).forEach(e => notify.newAssignment(e.userId, course?.title || 'your course'));

    setAsgTitle('');
    setAsgDesc('');
    setAsgDue('');
    onShowToast('Assignment posted.');
  };

  const handleGradeSubmission = (subId: string, studentId: string, assignmentId: string) => {
    const grade = gradeInputs[subId]?.trim();
    if (!grade) {
      onShowToast('Enter a grade first.', 'error');
      return;
    }
    Repo.submissions.update(subId, { grade });
    const assignment = Repo.assignments.all().find(a => a.id === assignmentId);
    const course = assignment ? Repo.courses.get(assignment.courseId) : null;
    notify.assignmentGraded(studentId, course?.title || 'your course', grade);
    onShowToast('Grade saved.');
  };

  const handlePostQuiz = () => {
    if (!quizTitle.trim()) {
      onShowToast('Enter a quiz title.', 'error');
      return;
    }
    const valid = quizQuestions.filter(q => q.text.trim() && q.options.every(o => o.trim()));
    if (!valid.length) {
      onShowToast('Add at least one complete question with options.', 'error');
      return;
    }

    Repo.quizzes.create({
      courseId: quizCourse,
      teacherId: user.id,
      title: quizTitle.trim(),
      questions: valid
    });

    setQuizTitle('');
    setQuizQuestions([{ text: '', options: ['', ''], correctIndex: 0 }]);
    onShowToast('Quiz posted.');
  };

  const handleIssueCert = (studentId: string, courseId: string) => {
    const existing = Repo.certificates.all().find(c => c.userId === studentId && c.courseId === courseId);
    if (existing) {
      onShowToast('This student already has a certificate for that course.', 'error');
      return;
    }
    Repo.certificates.create({ userId: studentId, courseId });
    const course = Repo.courses.get(courseId);
    notify.certificateIssued(studentId, course?.title || 'the course');
    onShowToast('Certificate issued.');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const nameErr = validateName(profileName);
    const emailErr = validateEmail(profileEmail);
    if (nameErr) errs.name = nameErr;
    if (emailErr) errs.email = emailErr;
    if (profileZoom && !isValidUrl(profileZoom)) errs.zoom = 'Enter a valid link, or leave blank.';

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    const updated = Repo.users.update(user.id, {
      name: profileName.trim(),
      email: profileEmail.trim().toLowerCase(),
      subjects: profileSubjects,
      zoomLink: profileZoom.trim(),
      qualification: profileQual.trim(),
      university: profileUni.trim(),
      bio: profileBio.trim()
    });

    if (updated) {
      onUpdateUser(updated);
      onShowToast('Profile updated.');
    }
  };

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
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My courses</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">
            These are the subjects listed on your profile. Edit your profile to add or remove subjects.
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {mySubjects.length > 0 ? (
            mySubjects.map((c) => {
              const studentCount = Repo.enrollments.all().filter(e => e.courseId === c.id).length;
              return (
                <div key={c.id} className="fs-card-hover bg-fs-paper border border-fs-line rounded-2xl p-[22px] flex flex-col gap-3">
                  <div>
                    <div className="font-mono text-[11px] text-fs-ink-soft tracking-wide">{c.code}</div>
                    <h3 className="text-[19px] text-fs-green font-serif font-semibold mt-1">{c.title}</h3>
                  </div>
                  <p className="text-[13.5px] text-fs-ink-soft leading-relaxed flex-1">{c.desc}</p>
                  <div className="flex justify-between items-center border-t border-fs-line pt-3">
                    <Pill text={`${studentCount} student(s)`} />
                    <button
                      type="button"
                      className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                      onClick={() => onNavigateTab('sessions')}
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-fs-ink-soft">
              <p className="text-sm">You haven't added any subjects yet — edit your profile to select what you teach.</p>
              <button
                type="button"
                className="mt-3 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                onClick={() => onNavigateTab('profile')}
              >
                Edit profile
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'sessions') {
    const eventsByDate: Record<string, { label: string }[]> = {};
    mySessions.forEach(s => {
      const course = Repo.courses.get(s.courseId);
      (eventsByDate[s.date] = eventsByDate[s.date] || []).push({ label: course?.title || 'Session' });
    });

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My sessions</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">
            Schedule a class — students who've joined that course will see it on their routine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          {/* Upcoming & Past sessions */}
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Scheduled sessions</h3>
            {mySessions.length > 0 ? (
              mySessions.map((s) => {
                const course = Repo.courses.get(s.courseId);
                const attendees = Repo.enrollments.all().filter(e => e.courseId === s.courseId).length;
                const isPast = new Date(s.date + 'T' + s.time) < new Date();
                const isAttendanceOpen = attendanceSessionId === s.id;

                return (
                  <div key={s.id} className="py-3.5 border-b border-fs-line last:border-b-0">
                    <div className="flex items-center justify-between gap-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                          {fmtDateShort(s.date)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-fs-ink">
                            {course?.title || 'Session'}{s.recurring ? ' 🔁' : ''}
                          </div>
                          <div className="text-xs text-fs-ink-soft mt-0.5">
                            {s.time} · {attendees} student(s) enrolled
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isPast && (
                          <button
                            type="button"
                            className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                            onClick={() => setAttendanceSessionId(isAttendanceOpen ? null : s.id)}
                          >
                            Attendance
                          </button>
                        )}
                        <button
                          type="button"
                          className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                          onClick={() => handleDeleteSession(s.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Attendance Sheet */}
                    {isAttendanceOpen && (
                      <div className="w-full py-3 bg-fs-cream/60 rounded-lg px-3 mt-3 animate-fs-fade-in">
                        <h4 className="text-xs font-bold text-fs-ink mb-2">Mark Attendance</h4>
                        {Repo.enrollments.all().filter(e => e.courseId === s.courseId).map(e => {
                          const student = Repo.users.get(e.userId);
                          if (!student) return null;
                          const rec = Repo.attendance.all().find(a => a.sessionId === s.id && a.userId === student.id);
                          const status = rec ? rec.status : 'unmarked';

                          return (
                            <div key={student.id} className="flex justify-between items-center py-2 text-[13px]">
                              <span className="text-fs-ink font-medium">{student.name}</span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-lg border transition-colors ${
                                    status === 'present' ? 'bg-fs-green text-fs-paper border-fs-green' : 'bg-fs-paper text-fs-ink-soft border-fs-line'
                                  }`}
                                  onClick={() => Repo.attendance.mark(s.id, student.id, 'present')}
                                >
                                  <Check className="w-3 h-3 inline mr-1" /> Present
                                </button>
                                <button
                                  type="button"
                                  className={`px-2.5 py-1 text-[11.5px] font-semibold rounded-lg border transition-colors ${
                                    status === 'absent' ? 'bg-fs-red text-white border-fs-red' : 'bg-fs-paper text-fs-ink-soft border-fs-line'
                                  }`}
                                  onClick={() => Repo.attendance.mark(s.id, student.id, 'absent')}
                                >
                                  <X className="w-3 h-3 inline mr-1" /> Absent
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft">
                <p className="text-sm">No sessions scheduled yet.</p>
              </div>
            )}
          </div>

          <div>
            <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px] mb-5">
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
              />
            </div>

            <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
              <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Schedule a new session</h3>
              {mySubjects.length > 0 ? (
                <form onSubmit={handleScheduleSubmit}>
                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Course</label>
                    <select
                      value={sessionCourse}
                      onChange={(e) => setSessionCourse(e.target.value)}
                      className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                    >
                      {mySubjects.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Date</label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                    />
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Time</label>
                    <input
                      type="time"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      required
                      className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-[13px] text-fs-ink-soft my-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sessionRecurring}
                      onChange={(e) => setSessionRecurring(e.target.checked)}
                      className="accent-fs-green"
                    />
                    Repeat weekly for 8 weeks
                  </label>

                  <button
                    type="submit"
                    className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all mt-2.5"
                  >
                    Add to routine
                  </button>
                </form>
              ) : (
                <p className="text-xs text-fs-ink-soft">Add a subject to your profile first.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'students') {
    const students = getMyStudents();

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My students</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Everyone currently enrolled in one of your courses.</p>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {students.length > 0 ? (
            students.map((st) => {
              const enrolledIn = Repo.enrollments.all()
                .filter(e => e.userId === st.id && (user.subjects || []).includes(e.courseId))
                .map(e => Repo.courses.get(e.courseId))
                .filter((c): c is Course => c !== null);

              return (
                <div key={st.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 flex-wrap gap-3">
                  <div>
                    <div className="text-sm font-bold text-fs-ink">{st.name}</div>
                    <div className="text-xs text-fs-ink-soft mt-0.5">
                      {st.level || 'Student'} · {enrolledIn.map(c => c.title).join(', ')}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {enrolledIn.length > 0 && (
                      <>
                        <select
                          id={`cert-course-${st.id}`}
                          className="w-auto px-2 py-1.5 text-xs border-[1.5px] border-fs-line rounded-lg bg-fs-paper text-fs-ink"
                        >
                          {enrolledIn.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                          onClick={() => {
                            const sel = document.getElementById(`cert-course-${st.id}`) as HTMLSelectElement;
                            if (sel) handleIssueCert(st.id, sel.value);
                          }}
                        >
                          🎓 Issue certificate
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                      onClick={() => onNavigateTab('chat')}
                    >
                      Message
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No students yet — once someone joins your course, they'll appear here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'resources') {
    const resources = Repo.resources.all().filter(r => (user.subjects || []).includes(r.courseId));

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Notes & recordings</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">
            Share Google Drive links for notes, PDFs, and past recordings with your students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Shared resources</h3>
            {resources.length > 0 ? (
              resources.map((r) => {
                const course = Repo.courses.get(r.courseId);
                return (
                  <div key={r.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0">
                    <div>
                      <div className="text-sm font-bold text-fs-ink">
                        {r.title} <span className="text-xs text-fs-ink-soft font-normal">· {course?.title}</span>
                      </div>
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-fs-green font-bold underline text-[12.5px]">
                        Open link
                      </a>
                    </div>
                    <button
                      type="button"
                      className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                      onClick={() => { Repo.resources.remove(r.id); onShowToast('Resource removed.'); }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft">
                <p className="text-sm">No resources shared yet.</p>
              </div>
            )}
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Share a new resource</h3>
            {mySubjects.length > 0 ? (
              <form onSubmit={handleResourceSubmit}>
                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Course</label>
                  <select
                    value={resCourse}
                    onChange={(e) => setResCourse(e.target.value)}
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  >
                    {mySubjects.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as 'notes' | 'recording')}
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  >
                    <option value="notes">Notes / PDF</option>
                    <option value="recording">Class recording</option>
                  </select>
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Title</label>
                  <input
                    type="text"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="e.g. Week 3 notes"
                    required
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Link (Google Drive, etc.)</label>
                  <input
                    type="text"
                    value={resLink}
                    onChange={(e) => setResLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    required
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
                >
                  Share with students
                </button>
              </form>
            ) : (
              <p className="text-xs text-fs-ink-soft">Add a subject to your profile first.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'assignments') {
    const myAssignments = Repo.assignments.all().filter(a => (user.subjects || []).includes(a.courseId));

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Assignments</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Post work for your students and grade what comes in.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Posted assignments</h3>
            {myAssignments.length > 0 ? (
              myAssignments.map((a) => {
                const course = Repo.courses.get(a.courseId);
                const submissions = Repo.submissions.all().filter(s => s.assignmentId === a.id);

                return (
                  <div key={a.id} className="py-3.5 border-b border-fs-line last:border-b-0 space-y-2">
                    <div className="flex justify-between items-start gap-2.5">
                      <div>
                        <div className="text-sm font-bold text-fs-ink">{a.title}</div>
                        <div className="text-xs text-fs-ink-soft mt-0.5">
                          {course?.title} {a.dueDate ? `· Due ${fmtDateShort(a.dueDate)}` : ''}
                        </div>
                      </div>
                      <Pill text={`${submissions.length} submitted`} />
                    </div>

                    {submissions.length > 0 && (
                      <div className="pt-2 border-t border-dashed border-fs-line space-y-2">
                        {submissions.map((sub) => {
                          const student = Repo.users.get(sub.studentId);
                          return (
                            <div key={sub.id} className="flex justify-between items-center text-[12.5px] gap-2 flex-wrap bg-fs-cream/60 p-2 rounded-lg">
                              <span>{student?.name || 'Student'} · <a href={sub.link} target="_blank" rel="noopener noreferrer" className="underline font-bold text-fs-green">View work</a></span>
                              {sub.grade != null ? (
                                <Pill text={`Graded: ${sub.grade}`} tone="gold" />
                              ) : (
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="text"
                                    placeholder="Grade"
                                    value={gradeInputs[sub.id] || ''}
                                    onChange={(e) => setGradeInputs({ ...gradeInputs, [sub.id]: e.target.value })}
                                    className="w-[70px] px-2 py-1 border-[1.5px] border-fs-line rounded-md text-xs bg-fs-paper text-fs-ink focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-2 py-1 text-xs font-semibold rounded-md"
                                    onClick={() => handleGradeSubmission(sub.id, sub.studentId, a.id)}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft">
                <p className="text-sm">No assignments posted yet.</p>
              </div>
            )}
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Post a new assignment</h3>
            {mySubjects.length > 0 ? (
              <form onSubmit={handlePostAssignment}>
                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Course</label>
                  <select
                    value={asgCourse}
                    onChange={(e) => setAsgCourse(e.target.value)}
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  >
                    {mySubjects.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Title</label>
                  <input
                    type="text"
                    value={asgTitle}
                    onChange={(e) => setAsgTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 problem set"
                    required
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Description</label>
                  <textarea
                    value={asgDesc}
                    onChange={(e) => setAsgDesc(e.target.value)}
                    placeholder="What should students do?"
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green min-h-[70px]"
                  />
                </div>

                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Due date</label>
                  <input
                    type="date"
                    value={asgDue}
                    onChange={(e) => setAsgDue(e.target.value)}
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
                >
                  Post assignment
                </button>
              </form>
            ) : (
              <p className="text-xs text-fs-ink-soft">Add a subject to your profile first.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'quizzes') {
    const myQuizzes = Repo.quizzes.all().filter(q => (user.subjects || []).includes(q.courseId));

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Quizzes</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Build a short multiple-choice quiz for a course.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Posted quizzes</h3>
            {myQuizzes.length > 0 ? (
              myQuizzes.map((q) => {
                const course = Repo.courses.get(q.courseId);
                const attempts = Repo.quizAttempts.all().filter(a => a.quizId === q.id);
                return (
                  <div key={q.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0">
                    <div>
                      <div className="text-sm font-bold text-fs-ink">{q.title}</div>
                      <div className="text-xs text-fs-ink-soft mt-0.5">
                        {course?.title} · {attempts.length} attempt(s)
                      </div>
                    </div>
                    <button
                      type="button"
                      className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                      onClick={() => { Repo.quizzes.remove(q.id); onShowToast('Quiz removed.'); }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft">
                <p className="text-sm">No quizzes yet.</p>
              </div>
            )}
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Build a quiz</h3>
            {mySubjects.length > 0 ? (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Course</label>
                  <select
                    value={quizCourse}
                    onChange={(e) => setQuizCourse(e.target.value)}
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  >
                    {mySubjects.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Quiz title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g. Chapter 2 quick check"
                    className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                  />
                </div>

                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="border border-fs-line rounded-lg p-3.5 bg-fs-cream/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-fs-green">Question {qi + 1}</label>
                      {quizQuestions.length > 1 && (
                        <button
                          type="button"
                          className="text-xs text-fs-red font-bold hover:underline"
                          onClick={() => {
                            const updated = [...quizQuestions];
                            updated.splice(qi, 1);
                            setQuizQuestions(updated);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => {
                        const updated = [...quizQuestions];
                        updated[qi].text = e.target.value;
                        setQuizQuestions(updated);
                      }}
                      placeholder="Question text"
                      className="w-full px-3 py-1.5 border-[1.5px] border-fs-line rounded-lg text-xs bg-fs-paper text-fs-ink focus:outline-none"
                    />

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correctIndex === oi}
                            onChange={() => {
                              const updated = [...quizQuestions];
                              updated[qi].correctIndex = oi;
                              setQuizQuestions(updated);
                            }}
                            className="accent-fs-green"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[qi].options[oi] = e.target.value;
                              setQuizQuestions(updated);
                            }}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 px-2.5 py-1 text-xs border-[1.5px] border-fs-line rounded-md bg-fs-paper text-fs-ink"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="text-fs-green font-bold underline text-[12px]"
                      onClick={() => {
                        const updated = [...quizQuestions];
                        updated[qi].options.push('');
                        setQuizQuestions(updated);
                      }}
                    >
                      + Add option
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-xs font-semibold rounded-lg"
                  onClick={() => setQuizQuestions([...quizQuestions, { text: '', options: ['', ''], correctIndex: 0 }])}
                >
                  + Add question
                </button>

                <button
                  type="button"
                  className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
                  onClick={handlePostQuiz}
                >
                  Post quiz
                </button>
              </div>
            ) : (
              <p className="text-xs text-fs-ink-soft">Add a subject to your profile first.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    const reviews = Repo.reviews.forTeacher(user.id);

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">My profile</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">This is what students see about you.</p>
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
                    onChange={(e) => setProfName(e.target.value)}
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
                    onChange={(e) => setProfEmail(e.target.value)}
                    required
                    className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                      profileErrors.email ? 'border-fs-red' : 'border-fs-line'
                    }`}
                  />
                  {profileErrors.email && <div className="text-[11.5px] text-fs-red mt-1">{profileErrors.email}</div>}
                </div>
              </div>

              <div className="my-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Subjects you teach</label>
                <select
                  multiple
                  value={profileSubjects}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value);
                    setProfSubjects(opts);
                  }}
                  size={5}
                  className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                >
                  {Repo.courses.all().map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Zoom or Google Meet link</label>
                <input
                  type="text"
                  value={profileZoom}
                  onChange={(e) => setProfZoom(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                    profileErrors.zoom ? 'border-fs-red' : 'border-fs-line'
                  }`}
                />
                {profileErrors.zoom && <div className="text-[11.5px] text-fs-red mt-1">{profileErrors.zoom}</div>}
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Highest qualification</label>
                <input
                  type="text"
                  value={profileQual}
                  onChange={(e) => setProfQual(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">University / institution</label>
                <input
                  type="text"
                  value={profileUni}
                  onChange={(e) => setProfUni(e.target.value)}
                  className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Short bio</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfBio(e.target.value)}
                  placeholder="Tell students a little about yourself..."
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
              <div className="text-xs text-fs-ink-soft">Tutor · {profileUni}</div>
              {reviews.length > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-fs-ink-soft">
                  <StarRating value={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length} />
                  <span>{reviews.length} review(s)</span>
                </div>
              )}
            </div>
            <div className="text-xs text-fs-ink-soft mb-2.5">
              <strong className="text-fs-ink">Teaches:</strong> {profileSubjects.map(id => Repo.courses.get(id)?.title).filter(Boolean).join(', ') || 'Not set'}
            </div>
            <p className="text-xs text-fs-ink-soft leading-relaxed">{profileBio || 'No bio added yet.'}</p>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT Overview Tab
  const reviews = Repo.reviews.forTeacher(user.id);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Here's what's coming up for your courses.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{mySessions.length}</b>
            <span className="text-xs text-fs-ink-soft">Upcoming sessions</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{mySubjects.length}</b>
            <span className="text-xs text-fs-ink-soft">Courses teaching</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <Users className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{getMyStudents().length}</b>
            <span className="text-xs text-fs-ink-soft">Students total</span>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px] mb-5">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-2">Your rating</h3>
          <div className="flex items-center gap-2.5">
            <StarRating value={avgRating} />
            <span className="text-sm text-fs-ink-soft">{avgRating.toFixed(1)} average from {reviews.length} review(s)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Upcoming sessions</h3>
          {mySessions.length > 0 ? (
            mySessions.slice(0, 5).map((s) => {
              const course = Repo.courses.get(s.courseId);
              return (
                <div key={s.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center font-mono font-bold text-xs text-center flex-shrink-0">
                      {fmtDateShort(s.date)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-fs-ink">{course?.title}</div>
                      <div className="text-xs text-fs-ink-soft mt-0.5">{s.time}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No sessions scheduled yet.</p>
              <button
                type="button"
                className="mt-3 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                onClick={() => onNavigateTab('sessions')}
              >
                Go to My sessions
              </button>
            </div>
          )}
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">Your courses</h3>
          {mySubjects.length > 0 ? (
            mySubjects.map((c) => (
              <div key={c.id} className="py-3 border-b border-fs-line last:border-b-0">
                <div className="text-sm font-bold text-fs-ink">{c.title}</div>
                <div className="text-xs text-fs-ink-soft">{c.code}</div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">You haven't added subjects to your profile yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
