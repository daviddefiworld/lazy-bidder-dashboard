import React from 'react';

interface TagListProps {
  items: string[];
  emptyLabel?: string;
  variant?: 'default' | 'benefit';
}

const variantClass: Record<NonNullable<TagListProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700',
  benefit: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/15'
};

const TagList: React.FC<TagListProps> = ({
  items,
  emptyLabel = 'None listed',
  variant = 'default'
}) => {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 italic">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((label, i) => (
        <li
          key={`${label}-${i}`}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${variantClass[variant]}`}
        >
          {label}
        </li>
      ))}
    </ul>
  );
};

export default TagList;
