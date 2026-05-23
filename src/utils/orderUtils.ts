import type { ActionOrder } from '../types/actionOrder';

export function orderPatchedJobCount(order: Pick<ActionOrder, 'output'> | null | undefined): number {
  const o = order?.output;
  if (!o || typeof o !== 'object') return 0;
  const n = (o as { patchedJobCount?: unknown }).patchedJobCount;
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

export function orderGrokMessage(order: ActionOrder | null | undefined): string | undefined {
  if (!order || order.sitename !== 'grok') return undefined;
  const i = order.input as { message?: string } | undefined;
  return typeof i?.message === 'string' ? i.message : undefined;
}

export function orderIndeedSummary(order: ActionOrder | null | undefined): string {
  if (!order || order.sitename === 'grok') return '';
  const i = order.input as { query?: string; location?: string } | undefined;
  const q = i?.query ?? '';
  const l = i?.location ?? '';
  return `${q} / ${l}`.trim() || '—';
}
