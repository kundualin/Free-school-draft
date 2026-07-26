import React, { useState } from 'react';
import { Repo, setSessionUserId } from '../services/db';
import { validateName, validateEmail, validatePassword, notify } from '../utils/helpers';
import { Role, User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register' | 'forgot';
  initialRole?: Role;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onVerificationPending: (token: string, userId: string) => void;
  onNavigateReset: (token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  initialRole = 'student',
  onClose,
  onLoginSuccess,
  onVerificationPending,
  onNavigateReset
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [role, setRole] = useState<Role>(initialRole);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetTokenIssued, setResetTokenIssued] = useState<string | null>(null);
  const [forgotInfo, setForgotInfo] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLevel, setRegLevel] = useState('SSC candidate');
  const [regQualification, setRegQualification] = useState('');
  const [regUniversity, setRegUniversity] = useState('');
  const [regExperience, setRegExperience] = useState('');
  const [regSubjects, setRegSubjects] = useState<string[]>([]);
  const [regZoom, setRegZoom] = useState('');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const courses = Repo.courses.all();

  /* Handlers */
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const email = loginEmail.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) { setLoginError(emailErr); return; }
    if (!loginPassword) { setLoginError('Enter your password.'); return; }

    const user = Repo.users.getByEmail(email);
    if (!user || user.password !== loginPassword) {
      setLoginError('Incorrect email or password.');
      return;
    }

    if (user.role === 'teacher' && user.verificationStatus === 'rejected') {
      setLoginError('Your tutor application was not approved. Contact support for details.');
      return;
    }

    setSessionUserId(user.id);
    onLoginSuccess(user);
    onClose();
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotInfo('');
    setResetTokenIssued(null);

    const email = forgotEmail.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setRegErrors({ forgotEmail: emailErr });
      return;
    }

    const user = Repo.users.getByEmail(email);
    if (!user) {
      setForgotInfo('If that email is registered, a reset link has been sent.');
      return;
    }

    const token = Repo.tokens.createReset(user.id);
    setResetTokenIssued(token);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const nameErr = validateName(regName);
    if (nameErr) errs.name = nameErr;

    const email = regEmail.trim().toLowerCase();
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const pwErr = validatePassword(regPassword);
    if (pwErr) errs.password = pwErr;

    if (!errs.email && Repo.users.getByEmail(email)) {
      errs.email = 'An account with this email already exists — try logging in instead.';
    }

    if (role === 'teacher') {
      if (!regQualification.trim()) errs.qualification = 'Enter your highest qualification.';
      if (!regUniversity.trim()) errs.university = 'Enter your university or institution.';
      if (!regExperience.trim()) errs.experience = 'Briefly describe your teaching experience.';
      if (regSubjects.length === 0) errs.subjects = 'Select at least one subject.';
    }

    if (Object.keys(errs).length > 0) {
      setRegErrors(errs);
      return;
    }

    const baseUser = {
      role,
      name: regName.trim(),
      email,
      password: regPassword,
      bio: '',
      emailVerified: false,
      photo: null
    };

    let user: User;
    if (role === 'student') {
      user = Repo.users.create({
        ...baseUser,
        level: regLevel || 'Other',
        progress: {}
      });
    } else {
      user = Repo.users.create({
        ...baseUser,
        subjects: regSubjects,
        zoomLink: regZoom.trim(),
        qualification: regQualification.trim(),
        university: regUniversity.trim(),
        experience: regExperience.trim(),
        verificationStatus: 'pending',
        rejectionReason: null
      });

      // Notify admins
      Repo.users.all().filter(u => u.role === 'admin').forEach(admin => {
        Repo.notifications.create({
          userId: admin.id,
          type: 'tutor_application',
          title: 'New tutor application',
          body: `${user.name} applied to teach — review their profile in Manage Tutors.`,
          link: { tab: 'tutors' }
        });
      });
    }

    const token = Repo.tokens.createVerification(user.id);
    onClose();
    onVerificationPending(token, user.id);
  };

  const titles = {
    login: 'Welcome back',
    register: 'Create your profile',
    forgot: 'Reset your password'
  };

  const subs = {
    login: 'Log in to reach your dashboard.',
    register: 'Join Free School as a student or tutor.',
    forgot: "We'll send a reset link to your email."
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-5"
      onClick={onClose}
    >
      <div
        className="overlay bg-fs-paper rounded-2xl max-w-[420px] w-full p-8 shadow-2xl max-h-[88vh] overflow-y-auto relative animate-fs-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          className="absolute top-[18px] right-[18px] w-8 h-8 inline-flex items-center justify-center rounded-lg text-xl text-fs-ink-soft hover:text-fs-ink hover:bg-fs-cream transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-[22px] text-fs-green font-serif font-bold mb-1" id="auth-modal-title">
          {titles[tab]}
        </h2>
        <div className="text-[13px] text-fs-ink-soft mb-[22px]">{subs[tab]}</div>

        {tab !== 'forgot' && (
          <div className="flex bg-fs-green-pale rounded-lg p-1 mb-[22px]">
            <button
              type="button"
              className={`flex-1 text-center py-2 text-[13px] font-semibold rounded-md transition-all text-fs-green ${
                tab === 'login' ? 'bg-fs-paper shadow-sm opacity-100' : 'opacity-60'
              }`}
              onClick={() => { setTab('login'); setLoginError(''); }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`flex-1 text-center py-2 text-[13px] font-semibold rounded-md transition-all text-fs-green ${
                tab === 'register' ? 'bg-fs-paper shadow-sm opacity-100' : 'opacity-60'
              }`}
              onClick={() => { setTab('register'); setRegErrors({}); }}
            >
              Register
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} noValidate>
            {loginError && <div className="text-fs-red text-[12.5px] mb-2.5">{loginError}</div>}
            
            <div className="mb-3.5">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
              />
            </div>

            <div className="mb-3.5">
              <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Your password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
              />
            </div>

            <div className="text-right -mt-1.5 mb-3.5">
              <button
                type="button"
                className="text-fs-green font-bold underline text-[12.5px]"
                onClick={() => setTab('forgot')}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
            >
              Log in
            </button>

            <div className="text-[12.5px] text-fs-ink-soft text-center mt-4">
              New here?{' '}
              <button
                type="button"
                className="text-fs-green font-bold underline"
                onClick={() => setTab('register')}
              >
                Create a profile
              </button>
            </div>
            <div className="text-[11px] text-fs-ink-soft text-center mt-2.5 opacity-75">
              Admin? Use your admin email and password to log in here too.
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {tab === 'forgot' && (
          <div>
            {resetTokenIssued ? (
              <div>
                <div className="bg-fs-green-pale text-fs-green text-[12.5px] px-3 py-2.5 rounded-lg mb-4 leading-relaxed">
                  A reset link has been generated for demo testing:
                </div>
                <div className="font-mono text-xs bg-fs-cream border border-dashed border-fs-line rounded-lg px-3 py-2.5 break-all mb-3.5">
                  #reset/{resetTokenIssued}
                </div>
                <button
                  type="button"
                  className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
                  onClick={() => {
                    onClose();
                    onNavigateReset(resetTokenIssued);
                  }}
                >
                  Use this link now
                </button>
                <div className="text-[12.5px] text-fs-ink-soft text-center mt-4">
                  <button
                    type="button"
                    className="text-fs-green font-bold underline"
                    onClick={() => setTab('login')}
                  >
                    Back to log in
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                {forgotInfo && (
                  <div className="bg-fs-green-pale text-fs-green text-[12.5px] px-3 py-2.5 rounded-lg mb-4 leading-relaxed">
                    {forgotInfo}
                  </div>
                )}
                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                  />
                  {regErrors.forgotEmail && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.forgotEmail}</div>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
                >
                  Send reset link
                </button>
                <div className="text-[12.5px] text-fs-ink-soft text-center mt-4">
                  <button
                    type="button"
                    className="text-fs-green font-bold underline"
                    onClick={() => setTab('login')}
                  >
                    Back to log in
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <div>
            <div className="flex gap-2.5 mb-4">
              <button
                type="button"
                className={`flex-1 border-[1.5px] rounded-lg p-3 text-center text-[13px] font-semibold transition-all ${
                  role === 'student' ? 'border-fs-green bg-fs-green-pale text-fs-green' : 'border-fs-line text-fs-ink-soft'
                }`}
                onClick={() => setRole('student')}
              >
                🎓 I'm a student
              </button>
              <button
                type="button"
                className={`flex-1 border-[1.5px] rounded-lg p-3 text-center text-[13px] font-semibold transition-all ${
                  role === 'teacher' ? 'border-fs-green bg-fs-green-pale text-fs-green' : 'border-fs-line text-fs-ink-soft'
                }`}
                onClick={() => setRole('teacher')}
              >
                📚 I'm a tutor
              </button>
            </div>

            {role === 'teacher' && (
              <div className="bg-fs-green-pale text-fs-green text-[12.5px] px-3 py-2.5 rounded-lg mb-4 leading-relaxed">
                Tutor accounts are reviewed by an admin before you can schedule sessions.
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} noValidate>
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Full name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Farhan Kabir"
                  required
                  autoComplete="name"
                  className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                    regErrors.name ? 'border-fs-red' : 'border-fs-line'
                  }`}
                />
                {regErrors.name && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.name}</div>}
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                    regErrors.email ? 'border-fs-red' : 'border-fs-line'
                  }`}
                />
                {regErrors.email && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.email}</div>}
              </div>

              <div className="mb-3.5">
                <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 characters, with a number"
                  required
                  autoComplete="new-password"
                  className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                    regErrors.password ? 'border-fs-red' : 'border-fs-line'
                  }`}
                />
                {regErrors.password && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.password}</div>}
              </div>

              {role === 'student' ? (
                <div className="mb-3.5">
                  <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Class / level</label>
                  <select
                    value={regLevel}
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
              ) : (
                <>
                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Highest qualification</label>
                    <input
                      type="text"
                      value={regQualification}
                      onChange={(e) => setRegQualification(e.target.value)}
                      placeholder="e.g. BSc in Physics"
                      className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                        regErrors.qualification ? 'border-fs-red' : 'border-fs-line'
                      }`}
                    />
                    {regErrors.qualification && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.qualification}</div>}
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">University / institution</label>
                    <input
                      type="text"
                      value={regUniversity}
                      onChange={(e) => setRegUniversity(e.target.value)}
                      placeholder="e.g. Dhaka University"
                      className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                        regErrors.university ? 'border-fs-red' : 'border-fs-line'
                      }`}
                    />
                    {regErrors.university && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.university}</div>}
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Teaching experience</label>
                    <textarea
                      value={regExperience}
                      onChange={(e) => setRegExperience(e.target.value)}
                      placeholder="e.g. 2 years tutoring HSC Physics privately"
                      className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid min-h-[70px] ${
                        regErrors.experience ? 'border-fs-red' : 'border-fs-line'
                      }`}
                    />
                    {regErrors.experience && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.experience}</div>}
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Subjects you can teach</label>
                    <select
                      multiple
                      value={regSubjects}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions, o => (o as HTMLOptionElement).value);
                        setRegSubjects(opts);
                      }}
                      size={5}
                      className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                        regErrors.subjects ? 'border-fs-red' : 'border-fs-line'
                      }`}
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <div className="text-[11px] text-fs-ink-soft mt-1">Hold Ctrl (or ⌘ on Mac) to select more than one.</div>
                    {regErrors.subjects && <div className="text-[11.5px] text-fs-red mt-1">{regErrors.subjects}</div>}
                  </div>

                  <div className="mb-3.5">
                    <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Your Zoom or Google Meet link</label>
                    <input
                      type="text"
                      value={regZoom}
                      onChange={(e) => setRegZoom(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all mt-1.5"
              >
                {role === 'teacher' ? 'Submit application' : 'Create profile'}
              </button>
            </form>

            <div className="text-[12.5px] text-fs-ink-soft text-center mt-4">
              Already registered?{' '}
              <button
                type="button"
                className="text-fs-green font-bold underline"
                onClick={() => setTab('login')}
              >
                Log in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
