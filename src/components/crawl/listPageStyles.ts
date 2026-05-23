export type ListViewLayout = 'cards' | 'list';

export const iconBtnClass =
  'rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition shrink-0';

export const headerSelectClass =
  'rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shrink-0';

export const filterSelectClass =
  'rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shrink-0';

export const filterInputClass =
  'rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 shrink-0';

export const filterBtnClass =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition shrink-0 whitespace-nowrap';

export const stickyFilterPanelClass =
  'sticky top-[3.5rem] z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-slate-50/95 backdrop-blur border-b border-slate-200/80 sm:border-0 sm:rounded-xl sm:bg-white sm:shadow-sm sm:ring-1 sm:ring-slate-200/60';

export function parseListView(raw: string | null, fallback: ListViewLayout): ListViewLayout {
  return raw === 'cards' || raw === 'list' ? raw : fallback;
}
