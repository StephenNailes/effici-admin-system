import { memo, useState } from 'react';

export type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: number;
  fallbackInitial?: string;
  className?: string;
};

const Avatar = memo(({ src, alt, size = 40, fallbackInitial = 'U', className = '' }: AvatarProps) => {
  const [errored, setErrored] = useState(false);
  const dimension = `${size}px`;
  const baseClasses = `rounded-full object-cover ${className}`.trim();

  if (!src || errored) {
    const textSize = size <= 32 ? 'text-xs' : size <= 40 ? 'text-sm' : 'text-base';
    return (
      <div
        style={{ width: dimension, height: dimension }}
        className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold ${textSize}`}
        aria-label={alt}
      >
        {(fallbackInitial || 'U').toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: dimension, height: dimension }}
      className={baseClasses}
      onError={() => setErrored(true)}
    />
  );
});

export default Avatar;
