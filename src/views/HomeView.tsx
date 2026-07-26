import React from 'react';
import { HeartHandshake, BookOpenCheck, ShieldCheck } from 'lucide-react';
import { Repo } from '../services/db';
import { Pill } from '../components/Pill';
import { Footer } from '../components/Footer';
import { ViewType, Role } from '../types';

interface HomeViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (tab: 'login' | 'register', role?: Role) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenAuth }) => {
  const teacherCount = Repo.users.all().filter(u => u.role === 'teacher' && u.verificationStatus === 'approved').length;
  const studentCount = Repo.users.all().filter(u => u.role === 'student').length;
  const courseCount = Repo.courses.all().length;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-14 sm:pt-20 pb-16 overflow-hidden fs-hero-wash">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div className="animate-fs-fade-in">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-fs-red uppercase tracking-widest mb-4 before:content-[''] before:w-[18px] before:h-0.5 before:bg-fs-red">
              Free live classes on Zoom
            </div>
            <h1 className="font-serif font-bold text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.1] text-fs-green tracking-tight">
              Learning built for <em class="not-italic text-fs-red">Bangladeshi</em> students, taught by real tutors.
            </h1>
            <p className="text-[15.5px] sm:text-[17px] text-fs-ink-soft my-5 max-w-[480px] leading-relaxed">
              Free School is a community-run learning space where verified volunteer tutors teach HSC, SSC and admission-test subjects live over Zoom — free to join, with a tutor you can actually message when you're stuck.
            </p>
            <div className="flex gap-3 flex-wrap mb-8">
              <button
                type="button"
                className="bg-fs-green text-fs-paper hover:bg-fs-green-mid px-[18px] py-2.5 text-sm font-semibold rounded-lg shadow-fs hover:-translate-y-0.5 transition-all"
                onClick={() => onNavigate('explore')}
              >
                Explore courses
              </button>
              <button
                type="button"
                className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
                onClick={() => onOpenAuth('register', 'teacher')}
              >
                Become a tutor
              </button>
            </div>
            <div className="flex gap-5 sm:gap-7 flex-wrap pt-5 border-t border-fs-line">
              <div className="fs-stagger" style={{ '--fs-delay': '0ms' } as React.CSSProperties}>
                <b className="fs-stat-in font-serif text-2xl text-fs-green block">{courseCount}</b>
                <span className="text-xs text-fs-ink-soft">Courses running</span>
              </div>
              <div className="fs-stagger" style={{ '--fs-delay': '80ms' } as React.CSSProperties}>
                <b className="fs-stat-in font-serif text-2xl text-fs-green block">{teacherCount}</b>
                <span className="text-xs text-fs-ink-soft">Verified tutors</span>
              </div>
              <div className="fs-stagger" style={{ '--fs-delay': '160ms' } as React.CSSProperties}>
                <b className="fs-stat-in font-serif text-2xl text-fs-green block">{studentCount}</b>
                <span className="text-xs text-fs-ink-soft">Students learning</span>
              </div>
            </div>
          </div>

          {/* Routine Card Motif */}
          <div className="fs-admit-card fs-card-hover relative bg-fs-paper border-[1.5px] border-fs-line rounded-2xl shadow-fs px-6 pt-6 pb-5 animate-fs-pop">
            <div className="flex justify-between items-start border-b-[1.5px] border-dashed border-fs-line pb-3.5 mb-3.5">
              <div>
                <div className="font-mono text-xs text-fs-ink-soft">FREE SCHOOL · WEEKLY ROUTINE</div>
                <div className="font-serif text-xl text-fs-green font-semibold">Class Routine</div>
              </div>
              <Pill text="This week" tone="gold" />
            </div>
            {[
              ['HSC Physics 1st Paper', 'with a verified tutor', 'Sat · 7:00 PM'],
              ['SSC Higher Math', 'with a verified tutor', 'Sun · 6:30 PM'],
              ['English for Admission', 'with a verified tutor', 'Mon · 8:00 PM'],
              ['ICT & Programming', 'with a verified tutor', 'Wed · 7:30 PM']
            ].map(([subj, who, time], i) => (
              <div
                key={i}
                className="fs-stagger flex justify-between items-center py-2.5 border-b border-dotted border-fs-line last:border-b-0 gap-2.5"
                style={{ '--fs-delay': `${i * 60}ms` } as React.CSSProperties}
              >
                <div>
                  <div className="font-semibold text-sm text-fs-ink">{subj}</div>
                  <div className="text-xs text-fs-ink-soft">{who}</div>
                </div>
                <span className="font-mono text-xs bg-fs-green-pale text-fs-green px-2 py-1 rounded-md whitespace-nowrap">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Free School Exists */}
      <section className="px-4 sm:px-8 py-16 max-w-[1100px] mx-auto" id="mission-teaser">
        <div className="flex justify-between items-end mb-8 gap-5 flex-wrap">
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-fs-green tracking-tight">
              Why Free School exists
            </h2>
            <p className="text-fs-ink-soft text-sm mt-1.5 max-w-[480px]">
              A short story, not a sales pitch.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              mark: '০১',
              Icon: HeartHandshake,
              title: "Good tutoring shouldn't cost money",
              body: "Private tuition is often the difference between struggling with a subject and doing well in it — but not every family can afford it. Free School exists to close that gap."
            },
            {
              mark: '০২',
              Icon: BookOpenCheck,
              title: 'Built around our own boards',
              body: 'Courses are built around what Bangla-medium students actually sit for — HSC and SSC papers, and the admission tests that follow them.'
            },
            {
              mark: '০৩',
              Icon: ShieldCheck,
              title: 'Every tutor is reviewed',
              body: 'Tutors go through an approval step — qualifications and experience checked — before they can post a session.'
            }
          ].map(({ mark, Icon, title, body }, i) => (
            <div
              key={i}
              className="fs-card-hover fs-stagger border-t-[3px] border-fs-green pt-4 bg-fs-paper/60 rounded-b-xl px-1 pb-1"
              style={{ '--fs-delay': `${i * 90}ms` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="font-mono text-xs text-fs-red font-bold tracking-wide">{mark}</div>
                <div className="w-9 h-9 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
              </div>
              <h3 className="text-[17px] text-fs-green font-bold mb-2.5 leading-tight">{title}</h3>
              <p className="text-[13.5px] text-fs-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="relative overflow-hidden bg-fs-green rounded-3xl p-8 sm:p-12 mx-4 sm:mx-auto max-w-[1036px] mb-16 flex justify-between items-center gap-6 flex-wrap">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-fs-paper/5" aria-hidden="true" />
        <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-fs-gold/10" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-fs-paper font-serif text-2xl sm:text-[26px] max-w-[420px]">
            See what's being taught right now.
          </h2>
          <p className="text-[#BFD3C9] text-sm mt-2">
            Browse the current courses, tutors, and this week's routine.
          </p>
        </div>
        <button
          type="button"
          className="relative bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5"
          onClick={() => onNavigate('explore')}
        >
          Explore courses
        </button>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
