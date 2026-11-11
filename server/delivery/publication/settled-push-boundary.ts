import { LifecycleDiagnostic } from '../../workers/lifecycle/contract';
import { prePushRejection } from './pre-push-boundary';

/** Native launch and owned-group settlement are separate from Git's hook trace. */
export function settledPushBoundary(trace: string, input: { pid: number; cwd: string; head: string; branch: string; lifecycle: unknown }) {
    const lifecycle = LifecycleDiagnostic.parse(input.lifecycle);
    const exits = lifecycle.events.filter(event => event.phase === 'exit'), closes = lifecycle.events.filter(event => event.phase === 'close');
    const probes = lifecycle.events.filter(event => event.phase === 'probe');
    if (lifecycle.processGroup !== input.pid || lifecycle.outcome !== 'failed' || lifecycle.failureCategory !== 'uncertain-effect' ||
        lifecycle.omittedEvents || exits.length !== 1 || closes.length !== 1 || exits[0].code !== 1 || closes[0].code !== 1 ||
        exits[0].signal || closes[0].signal || lifecycle.events.some(event => event.phase === 'term' || event.phase === 'kill') ||
        probes.at(-1)?.state !== 'absent' || lifecycle.events.at(-1)?.phase !== 'settled' ||
        lifecycle.events.indexOf(exits[0]) >= lifecycle.events.indexOf(closes[0]) ||
        lifecycle.events.indexOf(closes[0]) >= lifecycle.events.indexOf(probes.at(-1)!))
        throw new Error('A complete naturally settled native push rejection is required');
    return prePushRejection(trace, { pid: input.pid, cwd: input.cwd, head: input.head, branch: input.branch });
}
