import React from 'react';
import { iconBtnClass, type ListViewLayout } from './listPageStyles';

interface ListLayoutToggleProps {
  value: ListViewLayout;
  onChange: (layout: ListViewLayout) => void;
}

const activeClass = 'bg-primary-50 text-primary-800 ring-1 ring-primary-200';
const idleClass = 'text-slate-600 hover:bg-slate-50';

const ListLayoutToggle: React.FC<ListLayoutToggleProps> = ({ value, onChange }) => (
  <div
    className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
    role="group"
    aria-label="Layout"
  >
    <button
      type="button"
      onClick={() => onChange('cards')}
      className={`${iconBtnClass} border-0 p-2 ${value === 'cards' ? activeClass : idleClass}`}
      aria-label="Card layout"
      aria-pressed={value === 'cards'}
      title="Card layout"
    >
      <CardsIcon />
    </button>
    <button
      type="button"
      onClick={() => onChange('list')}
      className={`${iconBtnClass} border-0 p-2 ${value === 'list' ? activeClass : idleClass}`}
      aria-label="List layout"
      aria-pressed={value === 'list'}
      title="List layout"
    >
      <ListIcon />
    </button>
  </div>
);

const CardsIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
    />
  </svg>
);

const ListIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

export default ListLayoutToggle;
