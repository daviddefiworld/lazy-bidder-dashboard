import { useCallback, useState } from 'react';

export type CopyStatus = 'idle' | 'ok' | 'fail';

export function useCopyToClipboard(resetMs = 2000) {
  const [status, setStatus] = useState<CopyStatus>('idle');

  const copy = useCallback(
    async (text: string) => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setStatus('ok');
        window.setTimeout(() => setStatus('idle'), resetMs);
      } catch {
        setStatus('fail');
        window.setTimeout(() => setStatus('idle'), resetMs);
      }
    },
    [resetMs]
  );

  return { copy, status };
}
