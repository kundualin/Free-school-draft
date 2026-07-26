import React from 'react';

interface PillProps {
  text: string;
  tone?: 'default' | 'red' | 'gold';
  withDot?: boolean | 'pulse';
}

export const Pill: React.FC<PillProps> = ({ text, tone = 'default', withDot }) => {
  const toneClasses = {
    default: 'bg-fs-green-pale text-fs-green',
    red: 'bg-fs-red-soft text-fs-red',
    gold: 'bg-fs-gold-pale text-[#8a6d1f] dark:text-fs-gold'
  }[tone];

  const dotClasses = {
    default: 'bg-fs-green',
    red: 'bg-fs-red',
    gold: 'bg-fs-gold'
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${toneClasses}`}>
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClasses} ${withDot === 'pulse' ? 'fs-pulse' : ''}`}
          aria-hidden="true"
        />
      )}
      {text}
    </span>
  );
};
