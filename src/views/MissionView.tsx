import React from 'react';
import { Pill } from '../components/Pill';
import { Footer } from '../components/Footer';
import { ViewType, Role } from '../types';

interface MissionViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (tab: 'login' | 'register', role?: Role) => void;
  onOpenDonateModal: () => void;
}

export const MissionView: React.FC<MissionViewProps> = ({
  onNavigate,
  onOpenAuth,
  onOpenDonateModal
}) => {
  const donateMethods = [
    { label: 'bKash', number: '01XXXXXXXXX (Personal)' },
    { label: 'Nagad', number: '01XXXXXXXXX (Personal)' },
    { label: 'Rocket', number: '01XXXXXXXXX-X' },
    { label: 'Bank transfer', number: 'A/C details coming soon' }
  ];

  return (
    <div>
      <section className="px-4 sm:px-8 pt-12 sm:pt-16 max-w-[760px] mx-auto animate-fs-fade-in">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-fs-red uppercase tracking-widest mb-4 before:content-[''] before:w-[18px] before:h-0.5 before:bg-fs-red">
          A note, before anything else
        </div>
        <h2 className="font-serif font-bold text-[26px] sm:text-[34px] leading-[1.18] text-fs-green my-3.5 mb-7 tracking-tight">
          Why Free School exists — and why nobody has to pay.
        </h2>
        <div className="space-y-[18px] [&>p]:text-[15px] [&>p]:text-fs-ink-soft [&>p]:leading-[1.75]">
          <p>
            Across Bangladesh, a good tutor is often the single biggest factor in whether a student passes their board exam or clears an admission test — and just as often, it's the one thing a family can't afford. Free School started from a simple decision: that shouldn't be the deciding factor for anyone.
          </p>
          <p>
            Every class here is taught by a volunteer — someone who once sat for the same HSC or SSC papers, or the same admission tests, and is now giving their evenings to help someone else get through them. Nobody teaching on Free School is paid to do it, and nobody joining is ever asked to pay to learn.
          </p>
          <p className="text-fs-ink font-medium">
            If Free School has ever helped you, there are two ways to carry that forward.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-8 pt-3 pb-16 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Option 1 */}
          <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-2xl p-6 sm:p-7">
            <Pill text="Option one" tone="gold" />
            <h3 className="text-xl text-fs-green font-bold my-3 font-serif">Pass it forward</h3>
            <p className="text-[13.5px] text-fs-ink-soft leading-relaxed mb-5">
              Help a junior, a sibling, or a classmate the way you were helped. This costs nothing and it's the kind of help that keeps the whole thing running.
            </p>
            <button
              type="button"
              className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-[18px] py-2.5 text-sm font-semibold rounded-lg transition-colors"
              onClick={() => onOpenAuth('register', 'teacher')}
            >
              Become a tutor yourself
            </button>
          </div>

          {/* Option 2 */}
          <div className="fs-card-hover bg-fs-paper border border-fs-line rounded-2xl p-6 sm:p-7">
            <Pill text="Option two" tone="red" />
            <h3 className="text-xl text-fs-green font-bold my-3 font-serif">Donate, if you're able to</h3>
            <p className="text-[13.5px] text-fs-ink-soft leading-relaxed mb-5">
              Free School itself will never charge a student. Running it is easier with a little support. Every taka goes back into keeping this free for the next student.
            </p>

            <div className="flex flex-col border border-fs-line rounded-lg overflow-hidden mb-[18px]">
              {donateMethods.map((m) => (
                <div key={m.label} className="flex justify-between items-center px-3.5 py-2.5 border-b border-fs-line last:border-b-0 bg-fs-cream">
                  <div className="text-[13px] font-bold text-fs-ink">{m.label}</div>
                  <div className="text-xs text-fs-ink-soft italic">{m.number}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="w-full bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
              onClick={onOpenDonateModal}
            >
              Donate
            </button>
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
