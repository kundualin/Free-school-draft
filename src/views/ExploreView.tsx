import React, { useState } from 'react';
import { Search, UserPlus, Video, MessageCircle } from 'lucide-react';
import { Repo } from '../services/db';
import { StarRating } from '../components/StarRating';
import { Avatar } from '../components/Avatar';
import { Footer } from '../components/Footer';
import { ViewType, Role, Course } from '../types';

interface ExploreViewProps {
  onNavigate: (view: ViewType) => void;
  onOpenAuth: (tab: 'login' | 'register', role?: Role) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onNavigate, onOpenAuth }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = Repo.categories.all();

  const getAvgRating = (courseId: string) => {
    const teacherIds = Repo.users.all()
      .filter(u => u.role === 'teacher' && (u.subjects || []).includes(courseId))
      .map(t => t.id);

    const reviews = Repo.reviews.all().filter(r => teacherIds.includes(r.teacherId));
    if (!reviews.length) return { avg: 0, count: 0 };
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return { avg, count: reviews.length };
  };

  const filteredCourses = Repo.courses.all().filter((c) => {
    if (c.active === false) return false;
    if (category !== 'all' && c.categoryId !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <section className="px-4 sm:px-8 pt-10 sm:pt-14 pb-16 max-w-[1100px] mx-auto">
        <div className="flex justify-between items-end mb-8 gap-5 flex-wrap animate-fs-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-fs-red uppercase tracking-widest mb-4 before:content-[''] before:w-[18px] before:h-0.5 before:bg-fs-red">
              Explore
            </div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-fs-green tracking-tight">
              Courses running right now
            </h2>
            <p className="text-fs-ink-soft text-sm mt-1.5 max-w-[480px]">
              A short, focused list — built around what Bangladeshi students actually need for boards and admissions.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-2 bg-fs-paper border-[1.5px] border-fs-line rounded-lg px-3.5 py-2.5 flex-1 min-w-[220px] max-w-[360px] transition-colors focus-within:border-fs-green-mid">
            <Search className="w-4 h-4 text-fs-ink-soft flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="border-none bg-transparent text-sm w-full text-fs-ink focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] cursor-pointer whitespace-nowrap transition-all ${
                category === 'all'
                  ? 'bg-fs-green text-fs-paper border-fs-green'
                  : 'bg-fs-paper border-fs-line text-fs-ink-soft hover:border-fs-green'
              }`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border-[1.5px] cursor-pointer whitespace-nowrap transition-all ${
                  category === cat.id
                    ? 'bg-fs-green text-fs-paper border-fs-green'
                    : 'bg-fs-paper border-fs-line text-fs-ink-soft hover:border-fs-green'
                }`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((c, i) => {
              const teachers = Repo.users.all().filter(
                u => u.role === 'teacher' && u.verificationStatus === 'approved' && (u.subjects || []).includes(c.id)
              );
              const cat = Repo.categories.get(c.categoryId);
              const rating = getAvgRating(c.id);

              return (
                <div
                  key={c.id}
                  className="fs-card-hover fs-stagger bg-fs-paper border border-fs-line rounded-2xl p-5 flex flex-col gap-3"
                  style={{ '--fs-delay': `${Math.min(i, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div>
                    <div className="font-mono text-[11px] text-fs-ink-soft tracking-wide">
                      {c.code} {cat ? `· ${cat.icon} ${cat.name}` : ''}
                    </div>
                    <h3 className="text-[19px] text-fs-green mt-1 font-serif font-semibold">{c.title}</h3>
                  </div>
                  <p className="text-[13.5px] text-fs-ink-soft leading-relaxed flex-1">{c.desc}</p>

                  {rating.count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-fs-ink-soft">
                      <StarRating value={rating.avg} />
                      <span>{rating.avg.toFixed(1)} ({rating.count})</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-fs-line pt-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {teachers.length > 0 ? (
                        teachers.slice(0, 3).map((t) => (
                          <div key={t.id} title={t.name}>
                            <Avatar name={t.name} size={26} photo={t.photo} />
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-fs-ink-soft">No tutor yet</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-colors"
                      onClick={() => onOpenAuth('register', 'student')}
                    >
                      Join
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-fs-ink-soft">
              <div className="text-3xl mb-2">🔎</div>
              <p className="text-sm">No courses match your search — try a different keyword or category.</p>
              <button
                type="button"
                className="mt-4 bg-transparent text-fs-green border border-fs-line hover:border-fs-green px-3 py-1.5 text-[13px] font-semibold rounded-lg"
                onClick={() => { setSearch(''); setCategory('all'); }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-8 py-16 max-w-[1100px] mx-auto" id="how">
        <div className="mb-8">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-fs-green tracking-tight">
            How Free School works
          </h2>
          <p className="text-fs-ink-soft text-sm mt-1.5">
            No installs, no fees — just a profile, a routine, and a Zoom link.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            {
              num: '১',
              Icon: UserPlus,
              title: 'Make a profile',
              body: 'Students sign up instantly; tutors go through a short approval step first.'
            },
            {
              num: '২',
              Icon: Video,
              title: 'Join a session',
              body: "Pick a course, see the scheduled class, and join — it opens straight into the tutor's Zoom room."
            },
            {
              num: '৩',
              Icon: MessageCircle,
              title: 'Message your tutor',
              body: 'Stuck on something after class? Chat directly with your tutor from your dashboard, anytime.'
            }
          ].map(({ num, Icon, title, body }, i) => (
            <div
              key={i}
              className="fs-card-hover fs-stagger bg-fs-paper border border-fs-line rounded-2xl p-6"
              style={{ '--fs-delay': `${i * 90}ms` } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="font-serif text-[34px] text-fs-gold font-bold leading-none">{num}</div>
                <div className="w-9 h-9 rounded-lg bg-fs-green-pale text-fs-green flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
              </div>
              <h3 className="text-[17px] text-fs-green font-bold my-3">{title}</h3>
              <p className="text-[13.5px] text-fs-ink-soft leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="relative overflow-hidden bg-fs-green rounded-3xl p-8 sm:p-12 mx-4 sm:mx-auto max-w-[1036px] mb-16 flex justify-between items-center gap-6 flex-wrap">
        <div className="relative">
          <h2 className="text-fs-paper font-serif text-2xl sm:text-[26px]">Ready to join a course?</h2>
          <p className="text-[#BFD3C9] text-sm mt-2">Create your student profile — it takes less than a minute.</p>
        </div>
        <button
          type="button"
          className="relative bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all shadow-lg shadow-black/20 hover:-translate-y-0.5"
          onClick={() => onOpenAuth('register', 'student')}
        >
          Join free
        </button>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
