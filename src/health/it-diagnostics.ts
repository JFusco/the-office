import type { ITState } from '../shared';

/** Missing, malformed, future or overdue diagnostics are unknown, never a current all-clear. */
export function itDiagnostics(it: ITState | undefined, project: string, now = Date.now()) {
    const checked = Date.parse(it?.checkedAt || '');
    const fresh = !!it && (!it.projectId || it.projectId === project) && Number.isFinite(checked) && checked <= now + 15000 && now - checked < 150000;
    const followUps = fresh ? it.followUps ?? it.reports.at(-1)?.followUps ?? [] : [];
    return { fresh, followUps, status: !fresh ? 'unknown' as const : followUps.some(f => f.owner === 'You' || f.owner === 'Morgan') ? 'needs-attention' as const : followUps.length ? 'retrying' as const : 'monitoring' as const };
}
