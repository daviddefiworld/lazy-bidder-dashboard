import React from 'react';
import { iconBtnClass } from './listPageStyles';

export const RefreshIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

interface RefreshIconButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const RefreshIconButton: React.FC<RefreshIconButtonProps> = ({ onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={iconBtnClass}
    aria-label="Refresh list"
    title="Refresh"
  >
    <RefreshIcon />
  </button>
);

export const SortDescendingIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m13.5 0v6.75m0 0-3-3m3 3 3-3M3 16.5h5.25"
    />
  </svg>
);

export const SortAscendingIcon: React.FC = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m-9.75 3.75h9.75M12 4.5v15m0 0 3-3m-3 3-3-3"
    />
  </svg>
);
