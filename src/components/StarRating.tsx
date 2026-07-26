import React from 'react';

interface StarRatingProps {
  value: number;
  max?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, max = 5 }) => {
  const rounded = Math.round(value);
  const stars = [];

  for (let i = 1; i <= max; i++) {
    stars.push(
      <span key={i} className={`fs-star ${i <= rounded ? 'fs-star-filled' : ''}`}>
        ★
      </span>
    );
  }

  return (
    <span className="inline-flex gap-0.5 text-fs-gold text-[13px]" aria-label={`${value.toFixed(1)} out of ${max} stars`}>
      {stars}
    </span>
  );
};

interface StarRatingInputProps {
  value: number;
  onChange: (val: number) => void;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`fs-star-btn ${star <= value ? 'fs-star-filled' : ''}`}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
};
