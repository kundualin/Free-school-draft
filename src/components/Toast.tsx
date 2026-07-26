import React from 'react';

interface ToastProps {
  message: string | null;
  tone?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, tone = 'success' }) => {
  if (!message) return null;

  const toneClass = tone === 'error' ? 'bg-fs-red' : 'bg-fs-green';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 ${toneClass} text-fs-paper px-5 py-3 rounded-full text-sm font-semibold shadow-lg shadow-black/20 z-[200] max-w-[90vw] flex items-center gap-2 animate-fs-pop`}
    >
      {message}
    </div>
  );
};
