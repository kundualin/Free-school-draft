import React, { useState } from 'react';
import { Repo } from '../services/db';
import { User } from '../types';

interface ReportModalProps {
  reportedUserId: string | null;
  currentUser: User;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  reportedUserId,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');

  if (!reportedUserId) return null;
  const reported = Repo.users.get(reportedUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    Repo.reports.create({
      reporterId: currentUser.id,
      reportedId: reportedUserId,
      reason: reason.trim()
    });

    onSuccess('Report submitted — an admin will review it.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-5"
      onClick={onClose}
    >
      <div
        className="bg-fs-paper rounded-2xl max-w-[420px] w-full p-8 shadow-2xl relative animate-fs-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <button
          type="button"
          className="absolute top-[18px] right-[18px] w-8 h-8 inline-flex items-center justify-center rounded-lg text-xl text-fs-ink-soft hover:text-fs-ink hover:bg-fs-cream transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-[22px] text-fs-green font-serif font-bold mb-1" id="report-modal-title">
          Report {reported ? reported.name : 'user'}
        </h2>
        <div className="text-[13px] text-fs-ink-soft mb-5">
          Tell us what happened — an admin will review this conversation.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened?"
              required
              className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid min-h-[70px]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-fs-red text-fs-paper hover:brightness-[1.06] font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all"
          >
            Submit report
          </button>
        </form>
      </div>
    </div>
  );
};
