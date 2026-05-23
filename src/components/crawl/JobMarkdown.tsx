import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import HighlightedText from './HighlightedText';
import { looksLikeHtml } from '../../utils/jobDescription';

interface JobMarkdownProps {
  content: string;
  searchQuery?: string;
  className?: string;
}

const JobMarkdown: React.FC<JobMarkdownProps> = ({
  content,
  searchQuery = '',
  className = ''
}) => {
  const useHtml = useMemo(() => looksLikeHtml(content), [content]);
  const query = searchQuery.trim();

  const components = useMemo(
    () => ({
      text: ({ children }: { children?: React.ReactNode }) => {
        const text = typeof children === 'string' ? children : String(children ?? '');
        if (!query) return <>{text}</>;
        return <HighlightedText text={text} query={query} />;
      },
      a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800"
        >
          {children}
        </a>
      ),
      h1: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2 first:mt-0">{children}</h3>
      ),
      h2: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-base font-semibold text-slate-900 mt-5 mb-2 first:mt-0">{children}</h3>
      ),
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="text-sm font-semibold text-slate-900 mt-4 mb-1.5 first:mt-0">{children}</h4>
      ),
      p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-sm text-slate-700 leading-relaxed mb-3 last:mb-0">{children}</p>
      ),
      ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ul>
      ),
      ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-slate-700">{children}</ol>
      ),
      li: ({ children }: { children?: React.ReactNode }) => (
        <li className="leading-relaxed pl-0.5">{children}</li>
      ),
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-semibold text-slate-900">{children}</strong>
      ),
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-4 border-slate-200 pl-4 my-3 text-sm text-slate-600 italic">
          {children}
        </blockquote>
      ),
      hr: () => <hr className="my-5 border-slate-200" />,
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-4 overflow-x-auto rounded-lg ring-1 ring-slate-200/80">
          <table className="min-w-full text-sm text-left">{children}</table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {children}
        </thead>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="px-3 py-2 border-b border-slate-200">{children}</th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="px-3 py-2 border-b border-slate-100 text-slate-700">{children}</td>
      ),
      code: ({ className: codeClass, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = codeClass?.includes('language-');
        if (isBlock) {
          return (
            <code className="block overflow-x-auto rounded-lg bg-slate-900 px-4 py-3 text-xs text-slate-100 font-mono">
              {children}
            </code>
          );
        }
        return (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800">
            {children}
          </code>
        );
      }
    }),
    [query]
  );

  return (
    <div className={`job-markdown ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={useHtml ? [rehypeRaw, rehypeSanitize] : undefined}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default JobMarkdown;
