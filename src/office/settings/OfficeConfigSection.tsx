import { useEffect, useState } from 'react';
import type { OfficeConfigSummary } from '../../shared';
import { OfficeConfigView, type OfficeConfigState } from './OfficeConfigView';

/** GET the office-wide configuration projection. */
export async function loadOfficeConfig(fetchImpl: typeof fetch, signal?: AbortSignal): Promise<OfficeConfigSummary> {
  const response = await fetchImpl('/api/office-config', { signal });
  if (!response.ok) throw new Error(`The Office returned ${response.status}`);
  const data = await response.json() as OfficeConfigSummary;
  if (!Array.isArray(data?.projects) || !Array.isArray(data?.holds) || !data?.cec) throw new Error('The Office returned an incomplete configuration');
  return data;
}

/** Fetching wrapper: a failed read affects only this block. */
export function OfficeConfigSection() {
  const [attempt, setAttempt] = useState(0), [state, setState] = useState<OfficeConfigState>({ status: 'loading' });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    loadOfficeConfig(fetch, controller.signal).then(config => { if (!controller.signal.aborted) setState({ status: 'ready', config }); }).catch(error => { if (!controller.signal.aborted) setState({ status: 'error', message: String(error) }); });
    return () => controller.abort();
  }, [attempt]);
  return <OfficeConfigView state={state} onRetry={() => setAttempt(n => n + 1)} />;
}
