import React from 'react';

function scoreTone(score: number): { ring: string; text: string; label: string } {
  if (score >= 80) {
    return { ring: 'stroke-emerald-500', text: 'text-emerald-700', label: 'Strong fit' };
  }
  if (score >= 60) {
    return { ring: 'stroke-lime-500', text: 'text-lime-700', label: 'Good fit' };
  }
  if (score >= 40) {
    return { ring: 'stroke-amber-500', text: 'text-amber-700', label: 'Mixed' };
  }
  if (score >= 20) {
    return { ring: 'stroke-orange-500', text: 'text-orange-700', label: 'Weak fit' };
  }
  return { ring: 'stroke-slate-400', text: 'text-slate-600', label: 'Poor fit' };
}

const RelevanceScore: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'lg' }) => {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const tone = scoreTone(clamped);
  const dim = size === 'lg' ? 96 : 56;
  const r = size === 'lg' ? 40 : 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            className="stroke-slate-100"
            strokeWidth={size === 'lg' ? 8 : 6}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            className={tone.ring}
            strokeWidth={size === 'lg' ? 8 : 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center font-semibold tabular-nums ${tone.text} ${
            size === 'lg' ? 'text-2xl' : 'text-lg'
          }`}
        >
          {clamped}
        </div>
      </div>
      <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
      {size === 'lg' ? (
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Relevance</span>
      ) : null}
    </div>
  );
};

export default RelevanceScore;
