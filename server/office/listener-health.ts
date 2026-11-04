import type { OfficeSnapshot, ServiceHealth } from '../../src/shared';

/** Explain polling freshness using the saved source and scheduler state. */
export function listenerHealth(snapshot: OfficeSnapshot, now = Date.now()): ServiceHealth | undefined {
    const coordination = snapshot.coordination, listener = coordination?.listener;
    if (!listener) return;
    const pending = coordination?.requests?.find(r => r.action === 'poll' && ['queued', 'working'].includes(r.status));
    const checkedAt = listener.lastCheckedAt || '', age = now - Date.parse(checkedAt), fresh = age >= 0 && age < 150000;
    const paused = snapshot.paused || coordination?.enabled === false;
    return {
        id: `listener:${snapshot.project?.id}`, name: `${snapshot.project?.name || 'Project'} · assignment listener`, kind: 'listener',
        status: paused ? 'unknown' : listener.error ? 'warning' : fresh ? 'connected' : 'unknown',
        statusLabel: snapshot.paused ? 'Paused' : coordination?.enabled === false ? 'Not enabled' : listener.error ? 'Check failed' : fresh ? 'Up to date' : pending?.status === 'working' ? 'Checking assignments' : pending ? 'Check queued' : 'Check overdue',
        detail: paused ? 'Assignment checks wait until this project is resumed and checkpoints are enabled.' : listener.error ? 'The latest assignment check failed; the last successful result is retained. Ellis and Morgan own the follow-up.' : fresh ? 'A recent assignment check succeeded.' : pending ? `The next assignment check is ${pending.status === 'working' ? 'running' : 'queued with the scheduler'}. The timestamp below belongs to the last successful check.` : 'No successful assignment check in the last 2½ minutes. This is a polling delay, not evidence of a provider login failure.',
        checkedAt, checkedLabel: 'Last successful assignment check',
        expiresAt: !paused ? new Date((fresh ? Date.parse(checkedAt) : now) + 150000).toISOString() : undefined,
    };
}
