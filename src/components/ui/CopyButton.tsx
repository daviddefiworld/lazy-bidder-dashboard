import React from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const defaultClassName =
  'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition';

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  className = defaultClassName,
  disabled = false
}) => {
  const { copy, status } = useCopyToClipboard();

  const buttonLabel =
    status === 'ok' ? 'Copied' : status === 'fail' ? 'Copy failed' : label;

  return (
    <button
      type="button"
      disabled={disabled || !text}
      onClick={() => void copy(text)}
      className={className}
    >
      {buttonLabel}
    </button>
  );
};

export default CopyButton;
