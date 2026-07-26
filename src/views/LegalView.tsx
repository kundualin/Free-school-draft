import React from 'react';
import { Footer } from '../components/Footer';
import { ViewType } from '../types';

interface LegalViewProps {
  kind: 'privacy' | 'terms';
  onNavigate: (view: ViewType) => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ kind, onNavigate }) => {
  const isPrivacy = kind === 'privacy';

  return (
    <div>
      <section className="px-4 sm:px-8 py-14 sm:py-16 max-w-[760px] mx-auto animate-fs-fade-in">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-fs-red uppercase tracking-widest mb-4 before:content-[''] before:w-[18px] before:h-0.5 before:bg-fs-red">
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </div>
        <h2 className="font-serif font-bold text-2xl sm:text-[28px] text-fs-green mb-6 tracking-tight">
          {isPrivacy ? 'How we handle your information' : 'The basics of using Free School'}
        </h2>

        <div className="[&>h3]:text-base [&>h3]:text-fs-green [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-2 [&>p]:text-sm [&>p]:text-fs-ink-soft [&>p]:leading-relaxed space-y-4">
          {isPrivacy ? (
            <>
              <h3>What we store</h3>
              <p>Free School stores your name, email, role, and the course/session activity needed to run your dashboard — enrollments, messages with tutors, assignment submissions, and attendance.</p>
              <h3>Tutor information</h3>
              <p>Tutors additionally share qualification, university, and experience details so our team can verify them before they're allowed to teach.</p>
              <h3>Messaging</h3>
              <p>Messages between a student and their tutor are visible to both participants and to Free School administrators for moderation and safety purposes only.</p>
              <h3>Your choices</h3>
              <p>You can edit or remove your profile information at any time from your dashboard. If you'd like your account fully removed, contact an administrator.</p>
            </>
          ) : (
            <>
              <h3>Who can join</h3>
              <p>Students may register freely. Tutors must apply with real qualifications and are reviewed by an administrator before they can schedule sessions — impersonating credentials is grounds for permanent removal.</p>
              <h3>Conduct</h3>
              <p>Be respectful in messages and sessions. Harassment, spam, or sharing inappropriate content can be reported from any conversation and may result in a warning or a block.</p>
              <h3>Sessions & Zoom links</h3>
              <p>Free School links out to Zoom (or Google Meet) for live classes; we don't host video ourselves, so please follow Zoom's own terms during calls.</p>
              <h3>No payment for learning</h3>
              <p>Students are never charged to join a course. Voluntary donations support running the platform and are never required to access any course.</p>
            </>
          )}
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
