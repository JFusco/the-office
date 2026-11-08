import { groupInventory, type InventoryRunner } from './group-inventory';
import { LifecycleDiagnostic, errno, type GroupProbe, type Phase } from './contract';

/** Observes the runner only. Snapshot reads run concurrently and never delay a termination decision. */
export function lifecycleRecorder(group: number, inventory?: InventoryRunner, now = () => new Date().toISOString()) {
    const diagnostic: LifecycleDiagnostic = { version: 1, processGroup: group, providerTerminalObserved: false, outcome: 'completed', probeCount: 0, omittedEvents: 0, events: [], snapshots: [] };
    const pending: Promise<void>[] = []; let abnormal = false, lastProbe = '';
    const event = (phase: Phase, fields: Omit<LifecycleDiagnostic['events'][number], 'phase' | 'at'> = {}) => {
        if (diagnostic.events.length === 24) { diagnostic.events.shift(); diagnostic.omittedEvents++; }
        diagnostic.events.push({ at: now(), phase, ...fields });
    };
    const snapshot = (phase: Phase) => {
        if (pending.length === 5) return;
        const at = now(), index = diagnostic.snapshots.length;
        diagnostic.snapshots.push({ at, phase, status: 'unavailable', errno: 'CAPTURE_PENDING', truncated: false, members: [] });
        pending.push(groupInventory(group, inventory).then(result => { diagnostic.snapshots[index] = { at, phase, ...result }; }).catch(() => {}));
    };
    event('spawn'); snapshot('spawn');
    return {
        event,
        exit(code: number | null, signal: NodeJS.Signals | null) { event('exit', { code, signal }); snapshot('exit'); },
        close(code: number | null, signal: NodeJS.Signals | null) { event('close', { code, signal }); },
        line(line: string) { try { const e = JSON.parse(line); if (['turn.completed', 'turn.failed', 'task_complete', 'result'].includes(e.type) || e.type === 'event_msg' && e.payload?.type === 'task_complete') diagnostic.providerTerminalObserved = true; } catch {} },
        probe(probe: GroupProbe) {
            diagnostic.probeCount++; const key = JSON.stringify(probe);
            if (key !== lastProbe) { event('probe', probe); lastProbe = key; }
        },
        signal(phase: 'term' | 'kill', send: () => void) {
            abnormal = true; snapshot(phase);
            try { send(); event(phase); } catch (error) { event(phase, { errno: errno(error) }); }
        },
        async finish(failureCategory?: string) {
            if (!abnormal && !failureCategory) return;
            event('settled'); snapshot('settled');
            diagnostic.outcome = failureCategory ? 'failed' : 'completed'; diagnostic.failureCategory = failureCategory;
            await Promise.allSettled(pending);
            return LifecycleDiagnostic.parse(diagnostic);
        },
    };
}
