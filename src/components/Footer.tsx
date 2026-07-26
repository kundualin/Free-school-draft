import React from 'react';
import { ViewType } from '../types';

interface FooterProps {
  onNavigate: (view: ViewType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="px-4 sm:px-8 py-7 border-t border-fs-line text-center text-fs-ink-soft text-[12.5px] flex flex-col gap-2.5">
      <div>Free School — a free, community-run learning space for Bangladesh. Sessions hosted on Zoom.</div>
      <div className="flex gap-4 justify-center flex-wrap">
        <button
          type="button"
          className="underline decoration-fs-line underline-offset-2 hover:text-fs-green hover:decoration-fs-green transition-colors"
          onClick={() => { window.scrollTo(0, 0); onNavigate('privacy'); }}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          className="underline decoration-fs-line underline-offset-2 hover:text-fs-green hover:decoration-fs-green transition-colors"
          onClick={() => { window.scrollTo(0, 0); onNavigate('terms'); }}
        >
          Terms of Service
        </button>
      </div>
    </footer>
  );
};
