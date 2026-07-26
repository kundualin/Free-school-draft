import React from 'react';
import { initials } from '../utils/helpers';

interface AvatarProps {
  name: string;
  size?: number;
  photo?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 36, photo }) => {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className="rounded-full bg-fs-green text-fs-gold-pale flex items-center justify-center font-bold font-serif flex-shrink-0"
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${fontSize}px` }}
    >
      {initials(name)}
    </div>
  );
};
