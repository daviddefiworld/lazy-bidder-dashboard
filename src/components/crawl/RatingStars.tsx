import React from 'react';
import { formatRating } from '../../utils/crawlUtils';

interface RatingStarsProps {
  rating?: number | null;
  reviewCount?: number | null;
  size?: 'sm' | 'md';
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, reviewCount, size = 'sm' }) => {
  if (rating == null || !Number.isFinite(rating)) return null;
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 ${text}`}>
      <span className="inline-flex text-amber-400" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`h-3.5 w-3.5 ${i < filled ? 'fill-current' : 'fill-slate-200 text-slate-200'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="font-semibold text-slate-800">{formatRating(rating)}</span>
      {reviewCount != null && reviewCount > 0 ? (
        <span className="text-slate-500">({reviewCount.toLocaleString()})</span>
      ) : null}
    </span>
  );
};

export default RatingStars;
