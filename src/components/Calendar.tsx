import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fmtDateLong } from '../utils/helpers';

interface EventItem {
  label: string;
}

interface CalendarProps {
  year: number;
  month: number;
  eventsByDate: Record<string, EventItem[]>;
  onShiftMonth: (delta: number) => void;
  onDayClick?: (dateStr: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  year,
  month,
  eventsByDate,
  onShiftMonth,
  onDayClick
}) => {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = eventsByDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    const hasEvents = dayEvents.length > 0;

    const toneClass = isToday
      ? 'bg-fs-green text-fs-paper font-bold shadow-fs'
      : hasEvents
      ? 'bg-fs-green-pale/70 hover:bg-fs-green-pale font-semibold text-fs-ink'
      : 'bg-fs-cream hover:bg-fs-green-pale text-fs-ink';

    cells.push(
      <button
        key={d}
        type="button"
        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] cursor-pointer relative gap-0.5 transition-colors ${toneClass}`}
        onClick={() => onDayClick && onDayClick(dateStr)}
        aria-label={`${fmtDateLong(dateStr)}${hasEvents ? `, ${dayEvents.length} event(s)` : ''}`}
      >
        <span>{d}</span>
        <span className="flex gap-0.5">
          {dayEvents.slice(0, 2).map((e, idx) => (
            <span
              key={idx}
              className={`fs-cal-dot ${isToday ? '!bg-fs-paper' : ''}`}
              title={e.label}
            />
          ))}
        </span>
        {dayEvents.length > 2 && (
          <span className={`text-[8px] ${isToday ? 'text-fs-paper/80' : 'text-fs-ink-soft'}`}>
            +{dayEvents.length - 2}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="w-full animate-fs-fade-in">
      <div className="flex justify-between items-center mb-3">
        <button
          type="button"
          className="p-1.5 rounded-lg border border-fs-line text-fs-green hover:border-fs-green transition-colors"
          onClick={() => onShiftMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-[15px] font-serif font-semibold text-fs-green">{monthLabel}</h3>
        <button
          type="button"
          className="p-1.5 rounded-lg border border-fs-line text-fs-green hover:border-fs-green transition-colors"
          onClick={() => onShiftMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[10.5px] text-fs-ink-soft font-bold">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
};
