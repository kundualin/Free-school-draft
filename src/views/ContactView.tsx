import React from 'react';
import { Pill } from '../components/Pill';
import { Footer } from '../components/Footer';
import { ViewType, Role } from '../types';

interface ContactViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (tab: 'login' | 'register', role?: Role) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate, onOpenAuth }) => {
  return (
    <div>
      <section className="px-4 sm:px-8 pt-14 sm:pt-20 pb-16 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
          <div className="animate-fs-fade-in">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-fs-red uppercase tracking-widest mb-4 before:content-[''] before:w-[18px] before:h-0.5 before:bg-fs-red">
              For tutors
            </div>
            <h2 className="font-serif font-bold text-[28px] sm:text-[38px] leading-[1.14] text-fs-green mb-[18px] tracking-tight">
              Teach the subject you know, on your own schedule.
            </h2>
            <p className="text-[15.5px] sm:text-[17px] text-fs-ink-soft leading-relaxed max-w-[440px]">
              Free School runs on volunteer tutors. Register a profile with your qualifications, and once our team reviews and approves it, you can schedule sessions and take on students.
            </p>

            <div className="flex flex-col gap-3.5 mt-5">
              {[
                ['১', 'Register with your qualification, university, and experience.'],
                ['২', 'Our team reviews your application — usually within a few days.'],
                ['৩', 'Once approved, schedule sessions and message your students.']
              ].map(([num, text], i) => (
                <div
                  key={i}
                  className="fs-stagger flex items-start gap-3 text-sm text-fs-ink-soft leading-snug"
                  style={{ '--fs-delay': `${i * 90}ms` } as React.CSSProperties}
                >
                  <span className="font-mono font-bold text-xs text-fs-green bg-fs-green-pale w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5">
                    {num}
                  </span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all mt-6 shadow-fs hover:-translate-y-0.5"
              onClick={() => onOpenAuth('register', 'teacher')}
            >
              Register to teach
            </button>
          </div>

          <div className="fs-admit-card fs-admit-card-alt fs-card-hover relative bg-fs-paper border-[1.5px] border-fs-line rounded-2xl shadow-fs px-6 pt-6 pb-5 animate-fs-pop">
            <div className="flex justify-between items-start border-b-[1.5px] border-dashed border-fs-line pb-3.5 mb-3.5">
              <div>
                <div className="font-mono text-xs text-fs-ink-soft">TUTOR APPLICATION</div>
                <div className="font-serif text-xl text-fs-green font-semibold">What you'll need</div>
              </div>
              <Pill text="Reviewed by admin" tone="gold" />
            </div>
            {[
              ['Full name & email', 'for your profile'],
              ['Highest qualification', 'e.g. BSc, MSc, current student'],
              ['University / institution', 'where you studied'],
              ['Teaching experience', 'even informal tutoring counts'],
              ['Subjects & Zoom link', 'where your classes will run']
            ].map(([subj, who], i) => (
              <div key={i} className="flex justify-between items-center py-2.5 border-b border-dotted border-fs-line last:border-b-0 gap-2.5">
                <div>
                  <div className="font-semibold text-sm text-fs-ink">{subj}</div>
                  <div className="text-xs text-fs-ink-soft">{who}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
