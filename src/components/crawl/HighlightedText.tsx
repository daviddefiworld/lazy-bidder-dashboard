import React, { useMemo } from 'react';
import { escapeRegex } from '../../utils/crawlUtils';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query, className = '' }) => {
  const parts = useMemo(() => {
    const q = query.trim();
    if (!q) return [{ text, match: false }];
    const re = new RegExp(`(${escapeRegex(q)})`, 'gi');
    return text.split(re).filter((p) => p.length > 0).map((part) => ({
      text: part,
      match: part.toLowerCase() === q.toLowerCase()
    }));
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded bg-amber-200/80 px-0.5 text-inherit font-inherit"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
};

export default HighlightedText;
