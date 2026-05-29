export const ANALYTICS_PREFERENCES_KEY = 'lazybidder_analytics_prefs';

export const RELEVANT_THRESHOLD_DEFAULT = 30;
export const RELEVANT_THRESHOLD_MIN = 0;
export const RELEVANT_THRESHOLD_MAX = 100;

export function clampRelevantThreshold(value: number): number {
  return Math.min(RELEVANT_THRESHOLD_MAX, Math.max(RELEVANT_THRESHOLD_MIN, Math.round(value)));
}

export function readRelevantJobsThreshold(): number {
  try {
    const raw = localStorage.getItem(ANALYTICS_PREFERENCES_KEY);
    if (!raw) return RELEVANT_THRESHOLD_DEFAULT;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const n = Number(data.relevantThreshold);
    return Number.isFinite(n) ? clampRelevantThreshold(n) : RELEVANT_THRESHOLD_DEFAULT;
  } catch {
    return RELEVANT_THRESHOLD_DEFAULT;
  }
}

export function saveRelevantJobsThreshold(threshold: number): void {
  try {
    localStorage.setItem(
      ANALYTICS_PREFERENCES_KEY,
      JSON.stringify({ relevantThreshold: clampRelevantThreshold(threshold) })
    );
  } catch {
    /* private mode / quota */
  }
}
