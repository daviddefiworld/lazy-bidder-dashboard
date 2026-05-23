import React from 'react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  actions,
  as: Heading = 'h1',
  className = ''
}) => (
  <div className={`mb-4 flex items-center justify-between gap-4 ${className}`}>
    <Heading className="text-2xl font-semibold text-slate-900 tracking-tight shrink-0">{title}</Heading>
    {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
  </div>
);

export default PageHeader;
