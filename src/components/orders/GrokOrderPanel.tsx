import React from 'react';

interface GrokOrderPanelProps {
  message: string;
  onMessageChange: (v: string) => void;
  onRun: () => void;
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
}

const GrokOrderPanel: React.FC<GrokOrderPanelProps> = ({
  message,
  onMessageChange,
  onRun,
  disabled,
  busy,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun();
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Grok chat order</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Queue a message on the connected extension. It opens Grok, starts a new chat, and returns the reply.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Message</span>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="What should Grok answer?"
            rows={4}
            className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-y min-h-[96px]"
          />
        </label>
        <button
          type="submit"
          disabled={disabled || busy || !message.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {busy ? 'Sending…' : 'Send Grok order'}
        </button>
      </form>
    </section>
  );
};

export default GrokOrderPanel;
