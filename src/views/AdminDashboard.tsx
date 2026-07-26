import React, { useState } from 'react';
import {
  Users, CheckCircle, Clock, BookOpen, HeartHandshake, Flag, Search, Bell,
  UserCheck, CalendarDays, FileText, GraduationCap, Download
} from 'lucide-react';
import { Repo } from '../services/db';
import { Pill } from '../components/Pill';
import { Avatar } from '../components/Avatar';
import { User, DashTabType, Course, VerificationStatus } from '../types';
import { fmtDateShort, timeAgo, notify } from '../utils/helpers';

interface AdminDashboardProps {
  user: User;
  activeTab: DashTabType;
  onNavigateTab: (tab: DashTabType) => void;
  onShowToast: (msg: string, tone?: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  activeTab,
  onNavigateTab,
  onShowToast
}) => {
  const [tutorFilter, setTutorFilter] = useState<string>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCat, setCourseCat] = useState('');
  const [courseLevel, setCourseLevel] = useState('HSC');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseActive, setCourseActive] = useState(true);
  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({});

  const handleApproveTutor = (id: string) => {
    Repo.users.update(id, { verificationStatus: 'approved', rejectionReason: null });
    notify.tutorApproved(id);
    onShowToast('Tutor approved.');
  };

  const handleRejectTutor = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    Repo.users.update(id, { verificationStatus: 'rejected', rejectionReason: rejectReason.trim() });
    notify.tutorRejected(id, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
    onShowToast('Tutor application rejected.');
  };

  const handleRemoveUser = (id: string) => {
    Repo.users.remove(id);
    setConfirmRemoveId(null);
    onShowToast('User removed.');
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!courseCode.trim()) errs.code = 'Enter a course code.';
    if (!courseTitle.trim()) errs.title = 'Enter a title.';
    if (!courseDesc.trim()) errs.desc = 'Enter a description.';

    if (Object.keys(errs).length > 0) {
      setCourseErrors(errs);
      return;
    }

    const catId = courseCat || (Repo.categories.all()[0]?.id || 'cat_science');

    if (editingCourseId) {
      Repo.courses.update(editingCourseId, {
        code: courseCode.trim(),
        title: courseTitle.trim(),
        categoryId: catId,
        level: courseLevel,
        desc: courseDesc.trim(),
        active: courseActive
      });
      onShowToast('Course updated.');
      setEditingCourseId(null);
    } else {
      Repo.courses.create({
        code: courseCode.trim(),
        title: courseTitle.trim(),
        categoryId: catId,
        level: courseLevel,
        desc: courseDesc.trim(),
        active: courseActive
      });
      onShowToast('Course created.');
    }

    setCourseCode('');
    setCourseTitle('');
    setCourseDesc('');
    setCourseErrors({});
  };

  const startEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseCode(c.code);
    setCourseTitle(c.title);
    setCourseCat(c.categoryId);
    setCourseLevel(c.level);
    setCourseDesc(c.desc);
    setCourseActive(c.active !== false);
    setCourseErrors({});
  };

  if (activeTab === 'tutors') {
    const tutors = Repo.users.all().filter(
      u => u.role === 'teacher' && (tutorFilter === 'all' || u.verificationStatus === tutorFilter)
    );

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Manage tutors</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Review qualifications and approve or reject tutor applications.</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] transition-colors ${
                tutorFilter === f
                  ? 'bg-fs-green text-fs-paper border-fs-green'
                  : 'bg-fs-paper border-fs-line text-fs-ink-soft hover:border-fs-green'
              }`}
              onClick={() => setTutorFilter(f)}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {tutors.length > 0 ? (
            tutors.map((t) => {
              const subjects = (t.subjects || []).map(id => Repo.courses.get(id)?.title).filter(Boolean).join(', ') || 'None selected';
              const statusTone = t.verificationStatus === 'approved' ? 'default' : t.verificationStatus === 'rejected' ? 'red' : 'gold';

              return (
                <div key={t.id} className="border border-fs-line rounded-xl p-[18px] mb-3.5 last:mb-0">
                  <div className="flex items-center gap-3 mb-3.5 flex-wrap">
                    <Avatar name={t.name} size={44} photo={t.photo} />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-fs-ink flex items-center gap-2 flex-wrap">
                        {t.name} {!t.emailVerified && <Pill text="Email unverified" tone="red" />}
                      </div>
                      <div className="text-xs text-fs-ink-soft truncate">{t.email}</div>
                    </div>
                    <span className="ml-auto">
                      <Pill text={t.verificationStatus || 'pending'} tone={statusTone} withDot={t.verificationStatus === 'pending' ? 'pulse' : false} />
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
                    <div><strong className="text-fs-green text-[11.5px] uppercase tracking-wide block">Qualification</strong><p className="text-fs-ink-soft mt-0.5">{t.qualification || '—'}</p></div>
                    <div><strong className="text-fs-green text-[11.5px] uppercase tracking-wide block">University</strong><p className="text-fs-ink-soft mt-0.5">{t.university || '—'}</p></div>
                    <div><strong className="text-fs-green text-[11.5px] uppercase tracking-wide block">Experience</strong><p className="text-fs-ink-soft mt-0.5">{t.experience || '—'}</p></div>
                    <div><strong className="text-fs-green text-[11.5px] uppercase tracking-wide block">Subjects</strong><p className="text-fs-ink-soft mt-0.5">{subjects}</p></div>
                  </div>

                  {t.zoomLink && (
                    <div className="text-xs text-fs-ink-soft mt-3">
                      Zoom/Meet: <a href={t.zoomLink} target="_blank" rel="noopener noreferrer" className="underline text-fs-green">{t.zoomLink}</a>
                    </div>
                  )}

                  {t.verificationStatus === 'pending' && (
                    <div className="flex gap-2.5 mt-3.5 flex-wrap">
                      <button
                        type="button"
                        className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                        onClick={() => handleApproveTutor(t.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="bg-fs-red text-fs-paper hover:brightness-[1.06] px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                        onClick={() => { setRejectingId(t.id); setRejectReason(''); }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {rejectingId === t.id && (
                    <form className="bg-fs-cream border border-dashed border-fs-line rounded-lg p-3.5 mt-3" onSubmit={(e) => handleRejectTutor(e, t.id)}>
                      <div className="mb-3">
                        <label className="block text-[12.5px] font-semibold mb-1 text-fs-ink">Reason (shown to the tutor)</label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-fs-line rounded-lg text-xs bg-fs-paper text-fs-ink min-h-[70px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-fs-red text-fs-paper px-3 py-1.5 text-xs font-semibold rounded-lg">Confirm rejection</button>
                        <button type="button" className="bg-transparent border border-fs-line text-fs-ink px-3 py-1.5 text-xs font-semibold rounded-lg" onClick={() => setRejectingId(null)}>Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No tutors in this category right now.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'users') {
    const q = userSearch.trim().toLowerCase();
    const users = Repo.users.all()
      .filter(u => u.role !== 'admin')
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Manage users</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Every student and tutor account on the platform.</p>
        </div>

        <div className="flex items-center gap-2 bg-fs-paper border-[1.5px] border-fs-line rounded-lg px-3.5 py-2.5 max-w-[320px] mb-5">
          <Search className="w-4 h-4 text-fs-ink-soft flex-shrink-0" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="border-none bg-transparent text-sm w-full text-fs-ink focus:outline-none"
          />
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {users.length > 0 ? (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size={36} photo={u.photo} />
                  <div>
                    <div className="text-sm font-bold text-fs-ink">{u.name}</div>
                    <div className="text-xs text-fs-ink-soft mt-0.5">
                      {u.email} · {u.role}{u.role === 'teacher' ? ` · ${u.verificationStatus}` : ''}
                    </div>
                  </div>
                </div>

                {confirmRemoveId === u.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fs-red">Remove {u.name.split(' ')[0]}?</span>
                    <button type="button" className="bg-fs-red text-fs-paper px-2.5 py-1 text-xs font-semibold rounded-lg" onClick={() => handleRemoveUser(u.id)}>Confirm</button>
                    <button type="button" className="bg-transparent border border-fs-line px-2.5 py-1 text-xs font-semibold rounded-lg text-fs-ink" onClick={() => setConfirmRemoveId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bg-fs-red text-fs-paper px-3 py-1.5 text-xs font-semibold rounded-lg hover:brightness-[1.06]"
                    onClick={() => setConfirmRemoveId(u.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-fs-ink-soft">
              <p className="text-sm">No users match your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'admin-courses') {
    const courses = Repo.courses.all();
    const categories = Repo.categories.all();

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Manage courses</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Create, edit, or remove courses shown across the platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">All courses</h3>
            {courses.length > 0 ? (
              courses.map((c) => {
                const cat = Repo.categories.get(c.categoryId);
                return (
                  <div key={c.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 gap-2">
                    <div>
                      <div className="text-sm font-bold text-fs-ink">
                        {c.title} {c.active === false && <Pill text="Inactive" tone="red" />}
                      </div>
                      <div className="text-xs text-fs-ink-soft mt-0.5">
                        {c.code} · {cat ? `${cat.icon} ${cat.name}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-2.5 py-1 text-xs font-semibold rounded-lg"
                        onClick={() => startEditCourse(c)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="bg-fs-red text-fs-paper px-2.5 py-1 text-xs font-semibold rounded-lg"
                        onClick={() => { Repo.courses.remove(c.id); onShowToast('Course deleted.'); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-fs-ink-soft"><p className="text-sm">No courses yet.</p></div>
            )}
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
            <h3 className="text-base text-fs-green font-serif font-semibold mb-3.5">
              {editingCourseId ? 'Edit course' : 'Create a new course'}
            </h3>
            <form onSubmit={handleCourseSubmit} noValidate>
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Course code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. BIO-120"
                  required
                  className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                />
                {courseErrors.code && <div className="text-[11.5px] text-fs-red mt-1">{courseErrors.code}</div>}
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. HSC Biology 1st Paper"
                  required
                  className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                />
                {courseErrors.title && <div className="text-[11.5px] text-fs-red mt-1">{courseErrors.title}</div>}
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Category</label>
                <select
                  value={courseCat || (categories[0]?.id || '')}
                  onChange={(e) => setCourseCat(e.target.value)}
                  className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Level</label>
                <select
                  value={courseLevel}
                  onChange={(e) => setCourseLevel(e.target.value)}
                  className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green"
                >
                  <option>SSC</option>
                  <option>HSC</option>
                  <option>Admission</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  required
                  className="w-full px-3 py-2 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green min-h-[70px]"
                />
                {courseErrors.desc && <div className="text-[11.5px] text-fs-red mt-1">{courseErrors.desc}</div>}
              </div>

              <label className="flex items-center gap-2 text-[13px] text-fs-ink-soft my-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseActive}
                  onChange={(e) => setCourseActive(e.target.checked)}
                  className="accent-fs-green"
                />
                Active (visible to students)
              </label>

              <div className="flex gap-2.5 mt-3">
                <button type="submit" className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-4 py-2 text-sm font-semibold rounded-lg">
                  {editingCourseId ? 'Save changes' : 'Create course'}
                </button>
                {editingCourseId && (
                  <button
                    type="button"
                    className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-4 py-2 text-sm font-semibold rounded-lg"
                    onClick={() => {
                      setEditingCourseId(null);
                      setCourseCode('');
                      setCourseTitle('');
                      setCourseDesc('');
                      setCourseErrors({});
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin-sessions') {
    const sessions = Repo.sessions.all().sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Manage sessions</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">All scheduled sessions across every tutor and course.</p>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {sessions.length > 0 ? (
            sessions.map((s) => {
              const course = Repo.courses.get(s.courseId);
              const teacher = Repo.users.get(s.teacherId);
              return (
                <div key={s.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green font-mono font-bold text-xs flex items-center justify-center">
                      {fmtDateShort(s.date)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-fs-ink">{course?.title || 'Session'}</div>
                      <div className="text-xs text-fs-ink-soft">{s.time} · {teacher?.name || 'Unknown tutor'}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="bg-fs-red text-fs-paper px-3 py-1.5 text-xs font-semibold rounded-lg"
                    onClick={() => { Repo.sessions.remove(s.id); onShowToast('Session cancelled.'); }}
                  >
                    Cancel session
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft"><p className="text-sm">No sessions scheduled on the platform yet.</p></div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'donations') {
    const donations = Repo.donations.all().sort((a, b) => b.createdAt - a.createdAt);
    const totalConfirmed = donations.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0);
    const totalPending = donations.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Donations</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Records submitted by donors after sending via bKash, Nagad, Rocket, or bank transfer.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
          <div className="bg-fs-paper border border-fs-line rounded-xl p-4">
            <b className="font-serif text-2xl text-fs-green block">৳{totalConfirmed}</b>
            <span className="text-xs text-fs-ink-soft">Confirmed total</span>
          </div>
          <div className="bg-fs-paper border border-fs-line rounded-xl p-4">
            <b className="font-serif text-2xl text-fs-green block">৳{totalPending}</b>
            <span className="text-xs text-fs-ink-soft">Pending confirmation</span>
          </div>
          <div className="bg-fs-paper border border-fs-line rounded-xl p-4">
            <b className="font-serif text-2xl text-fs-green block">{donations.length}</b>
            <span className="text-xs text-fs-ink-soft">Total records</span>
          </div>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {donations.length > 0 ? (
            donations.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 gap-2 flex-wrap">
                <div>
                  <div className="text-sm font-bold text-fs-ink">৳{d.amount} · {d.donorName} ({d.method})</div>
                  <div className="text-xs text-fs-ink-soft mt-0.5">Txn: {d.txn} · {timeAgo(d.createdAt)}</div>
                </div>

                {d.status === 'confirmed' ? (
                  <Pill text="Confirmed" tone="default" withDot />
                ) : (
                  <button
                    type="button"
                    className="bg-fs-green text-fs-paper px-3 py-1.5 text-xs font-semibold rounded-lg"
                    onClick={() => { Repo.donations.update(d.id, { status: 'confirmed' }); onShowToast('Donation confirmed.'); }}
                  >
                    Mark confirmed
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-fs-ink-soft"><p className="text-sm">No donation records yet.</p></div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'reports') {
    const reports = Repo.reports.all().sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Reports</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Flags submitted by students or tutors about messages or behavior.</p>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          {reports.length > 0 ? (
            reports.map((r) => {
              const reporter = Repo.users.get(r.reporterId);
              const reported = Repo.users.get(r.reportedId);

              return (
                <div key={r.id} className="flex items-center justify-between py-3.5 border-b border-fs-line last:border-b-0 gap-2 flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-fs-ink">
                      {reporter ? reporter.name : 'Someone'} reported {reported ? reported.name : 'a user'}
                    </div>
                    <div className="text-xs text-fs-ink-soft mt-0.5">{r.reason} · {timeAgo(r.createdAt)}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill text={r.status} tone={r.status === 'open' ? 'red' : 'default'} withDot={r.status === 'open' ? 'pulse' : false} />
                    {r.status === 'open' && (
                      <button
                        type="button"
                        className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1 text-xs font-semibold rounded-lg"
                        onClick={() => { Repo.reports.update(r.id, { status: 'resolved' }); onShowToast('Report marked resolved.'); }}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-fs-ink-soft"><p className="text-sm">No reports filed — a healthy sign.</p></div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    const courses = Repo.courses.all();
    const enrollmentsByCourse = courses.map(c => ({
      course: c,
      count: Repo.enrollments.all().filter(e => e.courseId === c.id).length
    })).sort((a, b) => b.count - a.count);

    const maxCount = Math.max(1, ...enrollmentsByCourse.map(e => e.count));

    const totalStudents = Repo.users.all().filter(u => u.role === 'student').length;
    const totalTutors = Repo.users.all().filter(u => u.role === 'teacher').length;
    const totalSessions = Repo.sessions.all().length;
    const totalAttended = Repo.attendance.all().filter(a => a.status === 'present').length;

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Analytics</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">A high-level look at platform activity.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
          <div className="bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
              <Users className="w-[18px] h-[18px]" />
            </div>
            <div>
              <b className="font-serif text-2xl text-fs-green block leading-tight">{totalStudents}</b>
              <span className="text-xs text-fs-ink-soft">Students</span>
            </div>
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-[18px] h-[18px]" />
            </div>
            <div>
              <b className="font-serif text-2xl text-fs-green block leading-tight">{totalTutors}</b>
              <span className="text-xs text-fs-ink-soft">Tutors</span>
            </div>
          </div>

          <div className="bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-[18px] h-[18px]" />
            </div>
            <div>
              <b className="font-serif text-2xl text-fs-green block leading-tight">{totalSessions}</b>
              <span className="text-xs text-fs-ink-soft">Sessions scheduled</span>
            </div>
          </div>
        </div>

        {/* Enrollment Bar Chart Visual */}
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px] mb-6">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-4">Enrollment by course</h3>
          <div className="space-y-3">
            {enrollmentsByCourse.map((item) => {
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={item.course.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-fs-ink">
                    <span>{item.course.title}</span>
                    <span className="text-fs-ink-soft">{item.count} student(s)</span>
                  </div>
                  <div className="w-full h-4 bg-fs-cream rounded-full overflow-hidden border border-fs-line">
                    <div
                      className="h-full bg-fs-green rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-fs-paper border border-fs-line rounded-2xl p-[22px]">
          <h3 className="text-base text-fs-green font-serif font-semibold mb-4">Engagement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-fs-line rounded-xl p-4 text-center bg-fs-cream/50">
              <CheckCircle className="w-6 h-6 text-fs-green mx-auto mb-2" />
              <div className="text-xl font-bold font-serif text-fs-green">{totalAttended}</div>
              <div className="text-xs text-fs-ink-soft mt-1">Sessions attended</div>
            </div>
            <div className="border border-fs-line rounded-xl p-4 text-center bg-fs-cream/50">
              <FileText className="w-6 h-6 text-fs-green mx-auto mb-2" />
              <div className="text-xl font-bold font-serif text-fs-green">{Repo.assignments.all().length}</div>
              <div className="text-xs text-fs-ink-soft mt-1">Assignments posted</div>
            </div>
            <div className="border border-fs-line rounded-xl p-4 text-center bg-fs-cream/50">
              <GraduationCap className="w-6 h-6 text-fs-green mx-auto mb-2" />
              <div className="text-xl font-bold font-serif text-fs-green">{Repo.certificates.all().length}</div>
              <div className="text-xs text-fs-ink-soft mt-1">Certificates issued</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'settings') {
    const handleExportFullJson = () => {
      const data = {
        users: Repo.users.all(),
        courses: Repo.courses.all(),
        categories: Repo.categories.all(),
        enrollments: Repo.enrollments.all(),
        sessions: Repo.sessions.all(),
        donations: Repo.donations.all(),
        reports: Repo.reports.all(),
        resources: Repo.resources.all(),
        assignments: Repo.assignments.all(),
        quizzes: Repo.quizzes.all(),
        certificates: Repo.certificates.all(),
        reviews: Repo.reviews.all(),
        settings: Repo.settings.get()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freeschool-database-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('Database export downloaded successfully!');
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Platform Settings & Export</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">Manage platform configurations and export database or source code.</p>
        </div>

        {/* Database Export Card */}
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div>
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-fs-green" />
                <h3 className="font-serif font-bold text-lg text-fs-green">Export Database & Platform Data</h3>
              </div>
              <p className="text-xs text-fs-ink-soft mt-2 leading-relaxed">
                Download a complete JSON backup of all users, courses, routine sessions, enrollments, reports, donations, and assignments recorded on Free School.
              </p>
            </div>
            <button
              type="button"
              className="bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-xl px-5 py-2.5 text-xs inline-flex items-center gap-2 flex-shrink-0 transition-all shadow-sm"
              onClick={handleExportFullJson}
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Source Code Export Info Card */}
        <div className="bg-fs-green-pale/60 border border-fs-green/30 rounded-2xl p-6">
          <h3 className="font-serif font-bold text-lg text-fs-green mb-2">How to Export Source Code / ZIP / GitHub</h3>
          <p className="text-xs text-fs-ink leading-relaxed mb-4">
            If you are looking to download the full React / TypeScript source code or push this project to GitHub:
          </p>
          <ol className="list-decimal list-inside text-xs text-fs-ink space-y-2 font-medium">
            <li>Look at the top right header bar of the <strong>Google AI Studio Build</strong> interface (outside this app iframe preview).</li>
            <li>Click the <strong>Settings (⚙️)</strong> icon or the <strong>Export / Share</strong> menu in the AI Studio navbar.</li>
            <li>Select <strong>Export to GitHub</strong> or <strong>Download ZIP</strong> to download the complete codebase.</li>
          </ol>
        </div>

        {/* Data Stats Summary */}
        <div className="bg-fs-paper border border-fs-line rounded-2xl p-6">
          <h3 className="font-serif font-bold text-base text-fs-green mb-4">Database Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-fs-cream p-3.5 rounded-xl border border-fs-line">
              <div className="text-lg font-bold text-fs-green">{Repo.users.all().length}</div>
              <div className="text-[11px] text-fs-ink-soft mt-0.5">Total Users</div>
            </div>
            <div className="bg-fs-cream p-3.5 rounded-xl border border-fs-line">
              <div className="text-lg font-bold text-fs-green">{Repo.courses.all().length}</div>
              <div className="text-[11px] text-fs-ink-soft mt-0.5">Courses</div>
            </div>
            <div className="bg-fs-cream p-3.5 rounded-xl border border-fs-line">
              <div className="text-lg font-bold text-fs-green">{Repo.sessions.all().length}</div>
              <div className="text-[11px] text-fs-ink-soft mt-0.5">Live Sessions</div>
            </div>
            <div className="bg-fs-cream p-3.5 rounded-xl border border-fs-line">
              <div className="text-lg font-bold text-fs-green">{Repo.enrollments.all().length}</div>
              <div className="text-[11px] text-fs-ink-soft mt-0.5">Enrollments</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT Overview Tab
  const studentsCount = Repo.users.all().filter(u => u.role === 'student').length;
  const tutorsApproved = Repo.users.all().filter(u => u.role === 'teacher' && u.verificationStatus === 'approved').length;
  const tutorsPending = Repo.users.all().filter(u => u.role === 'teacher' && u.verificationStatus === 'pending').length;
  const openReports = Repo.reports.all().filter(r => r.status === 'open').length;
  const totalDonations = Repo.donations.all().reduce((s, d) => s + d.amount, 0);

  const handleExportData = () => {
    const data = {
      users: Repo.users.all(),
      courses: Repo.courses.all(),
      enrollments: Repo.enrollments.all(),
      sessions: Repo.sessions.all(),
      donations: Repo.donations.all(),
      reports: Repo.reports.all(),
      settings: Repo.settings.get()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freeschool-data-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Platform data exported as JSON.');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-bold text-fs-green tracking-tight">Admin overview</h1>
          <p className="text-fs-ink-soft text-[13.5px] mt-1.5">A snapshot of everything happening on Free School.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 bg-fs-paper border border-fs-line hover:border-fs-green text-fs-ink px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          onClick={handleExportData}
        >
          <Download className="w-4 h-4 text-fs-green" />
          <span>Export platform data (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <Users className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{studentsCount}</b>
            <span className="text-xs text-fs-ink-soft">Students</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{tutorsApproved}</b>
            <span className="text-xs text-fs-ink-soft">Approved tutors</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <Clock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{tutorsPending}</b>
            <span className="text-xs text-fs-ink-soft">Pending applications</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-7">
        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{Repo.courses.all().length}</b>
            <span className="text-xs text-fs-ink-soft">Courses</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">৳{totalDonations}</b>
            <span className="text-xs text-fs-ink-soft">Donations logged</span>
          </div>
        </div>

        <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-xl px-5 py-[18px] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center flex-shrink-0">
            <Flag className="w-[18px] h-[18px]" />
          </div>
          <div>
            <b className="fs-stat-in font-serif text-2xl text-fs-green block leading-tight">{openReports}</b>
            <span className="text-xs text-fs-ink-soft">Open reports</span>
          </div>
        </div>
      </div>

      {tutorsPending > 0 && (
        <div className="bg-fs-gold-pale border border-fs-gold rounded-2xl p-5 mb-5 flex justify-between items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-3 text-sm text-fs-ink font-medium">
            <Bell className="w-5 h-5 text-fs-gold flex-shrink-0" />
            {tutorsPending} tutor application(s) waiting for review.
          </span>
          <button
            type="button"
            className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-3 py-1.5 text-xs font-semibold rounded-lg"
            onClick={() => onNavigateTab('tutors')}
          >
            Review now
          </button>
        </div>
      )}

      {openReports > 0 && (
        <div className="bg-fs-red-soft border border-fs-red rounded-2xl p-5 mb-5 flex justify-between items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-3 text-sm text-fs-ink font-medium">
            <Flag className="w-5 h-5 text-fs-red flex-shrink-0" />
            {openReports} open report(s) to look at.
          </span>
          <button
            type="button"
            className="bg-transparent border border-fs-red text-fs-red hover:bg-fs-red hover:text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            onClick={() => onNavigateTab('reports')}
          >
            View reports
          </button>
        </div>
      )}
    </div>
  );
};
