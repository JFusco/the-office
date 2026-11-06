import { useCallback, useRef, useState } from 'react';
import { officeUrl } from '../../shared';

/** POST a project command with its existing action/payload shape to the captured project. */
export async function saveProjectSetting(fetchImpl: typeof fetch, projectId: string, action: string, payload: object): Promise<unknown> {
    if (!projectId) throw new Error('Wait for the selected project to load');
    const response = await fetchImpl(officeUrl('/api/commands', projectId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
    let data: { error?: string } | null = null;
    try { data = await response.json(); }
    catch { if (response.ok) throw new Error('The Office returned an unreadable response'); }
    if (!response.ok) throw new Error(data?.error || `The Office returned ${response.status}`);
    return data;
}

/** One form's save state. Forms are keyed by project, so a late response never reaches another project's form. */
export function useProjectSetting({ projectId, demo, refresh, success }: { projectId: string; demo: boolean; refresh?: () => Promise<void>; success: string }) {
    const [pending, setPending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(false);
    const busy = useRef(false);
    /** Resolves true only when the Office accepted the change. */
    const save = useCallback(async (action: string, payload: object): Promise<boolean> => {
        if (busy.current || demo) return false;
        busy.current = true; setPending(true); setError(false); setMessage('');
        try { await saveProjectSetting(fetch, projectId, action, payload); setMessage(success); void refresh?.(); return true; }
        catch (e) { setError(true); setMessage(String(e)); return false; }
        finally { busy.current = false; setPending(false); }
    }, [demo, projectId, refresh, success]);
    return { save, pending, message, error, disabled: pending || demo };
}
export interface ProjectFormProps { snapshot: import('../../shared').OfficeSnapshot; refresh?: () => Promise<void> }
