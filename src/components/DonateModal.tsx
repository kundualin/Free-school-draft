import React, { useState } from 'react';
import { Repo } from '../services/db';
import { User } from '../types';

interface DonateModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const DONATE_METHODS = [
  { key: 'bkash', label: 'bKash', number: '01XXXXXXXXX (Personal)' },
  { key: 'nagad', label: 'Nagad', number: '01XXXXXXXXX (Personal)' },
  { key: 'rocket', label: 'Rocket', number: '01XXXXXXXXX-X' },
  { key: 'bank', label: 'Bank transfer', number: 'A/C details coming soon' }
];

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [txn, setTxn] = useState('');
  const [donorName, setDonorName] = useState('');

  const [amountError, setAmountError] = useState('');
  const [txnError, setTxnError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError('');
    setTxnError('');

    const numAmount = Number(amount);
    let hasError = false;

    if (!amount || isNaN(numAmount) || numAmount < 10) {
      setAmountError('Enter an amount of at least ৳10.');
      hasError = true;
    }

    if (!txn.trim()) {
      setTxnError('Enter your transaction ID.');
      hasError = true;
    }

    if (hasError) return;

    Repo.donations.create({
      method,
      amount: numAmount,
      txn: txn.trim(),
      donorName: donorName.trim() || 'Anonymous',
      donorUserId: currentUser ? currentUser.id : null
    });

    onSuccess('Thank you — your donation record has been submitted for confirmation.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-5"
      onClick={onClose}
    >
      <div
        className="fs-scroll bg-fs-paper rounded-2xl max-w-[420px] w-full p-8 shadow-2xl max-h-[88vh] overflow-y-auto relative animate-fs-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-modal-title"
      >
        <button
          type="button"
          className="absolute top-[18px] right-[18px] w-8 h-8 inline-flex items-center justify-center rounded-lg text-xl text-fs-ink-soft hover:text-fs-ink hover:bg-fs-cream transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h2 className="text-[22px] text-fs-green font-serif font-bold mb-1" id="donate-modal-title">
          Support Free School
        </h2>
        <div className="text-[13px] text-fs-ink-soft mb-5">
          Send an amount through any method below, then let us know so we can say thanks.
        </div>

        <div className="flex flex-col border border-fs-line rounded-lg overflow-hidden mb-[18px]">
          {DONATE_METHODS.map((m) => (
            <div key={m.key} className="flex justify-between items-center px-3.5 py-2.5 border-b border-fs-line last:border-b-0 bg-fs-cream">
              <div className="text-[13px] font-bold text-fs-ink">{m.label}</div>
              <div className="text-xs text-fs-ink-soft italic">{m.number}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Method used</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
            >
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
              <option value="bank">Bank transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Amount (৳)</label>
            <input
              type="number"
              min="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 200"
              required
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                amountError ? 'border-fs-red' : 'border-fs-line'
              }`}
            />
            {amountError && <div className="text-[11.5px] text-fs-red mt-1">{amountError}</div>}
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Transaction ID / reference</label>
            <input
              type="text"
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              placeholder="e.g. 8N7X..."
              required
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid ${
                txnError ? 'border-fs-red' : 'border-fs-line'
              }`}
            />
            {txnError && <div className="text-[11.5px] text-fs-red mt-1">{txnError}</div>}
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold mb-1.5 text-fs-ink">Your name (optional)</label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonymous is fine too"
              className="w-full px-3 py-2.5 border-[1.5px] border-fs-line rounded-lg text-sm bg-fs-paper text-fs-ink focus:outline-none focus:border-fs-green-mid"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-fs-green text-fs-paper hover:bg-fs-green-mid font-semibold rounded-lg px-[18px] py-2.5 text-sm transition-all hover:-translate-y-0.5 mt-2"
          >
            Submit donation record
          </button>
        </form>

        <div className="text-[12.5px] text-fs-ink-soft text-center mt-4">
          This logs your donation for our records — actual payment happens through the app/number above.
        </div>
      </div>
    </div>
  );
};
