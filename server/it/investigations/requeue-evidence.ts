import { INVESTIGATION_ATTEMPTS } from './budget';
import { investigationEvidence } from './evidence';
import { investigationReady } from './readiness';
import { INVOCATION_SOURCE_REFS } from './invocation-source';
import { OFFICE_SOURCE_PATHS } from './office-source';
import { processGroupAlive } from '../../workers/process';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** Reconsider the SAME diagnosis only for new invocation evidence, through its existing IT lane. */
export function requeueInvestigationEvidence(store: Store, entry: ITInvestigation, alive = processGroupAlive, evidence = investigationEvidence): boolean {
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'surviving-subprocesses' || entry.status !== 'blocked' ||
        entry.report?.officeFix?.status !== 'blocked' || entry.attempts < 1 || entry.attempts >= INVESTIGATION_ATTEMPTS || !entry.reportEvidence ||
        !investigationReady(store, entry, alive)) return false;
    const own = store.state.workLog?.filter(work => work.requestId === entry.id) || [];
    if (own.some(work => !work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 ||
        !['completed', 'failed', 'blocked', 'interrupted'].includes(work.status) || alive(work.processId)) ||
        store.activeClaims().some(claim => claim.work.id === entry.id)) return false;
    const refs = new Set([...INVOCATION_SOURCE_REFS, `artifact:${entry.source.id}/launch-policy.json`]);
    const packet = evidence(store, entry).evidence;
    const valid = packet.flatMap(item => {
        const hash = (item.facts as { sha256?: unknown })?.sha256;
        return typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash) ? [{ ref: item.ref, sha256: hash }] : [];
    });
    const required = [...OFFICE_SOURCE_PATHS.map(path => `office-source:${path}`), ...INVOCATION_SOURCE_REFS];
    if (!required.every(ref => valid.some(item => item.ref === ref))) return false;
    const current = valid.filter(item => refs.has(item.ref));
    const previous = [...entry.reportEvidence, ...(entry.evidenceRequeues || []).flatMap(row => row.evidence)];
    const added = current.filter(item => !previous.some(old => old.ref === item.ref && old.sha256 === item.sha256));
    if (!added.length) return false;
    const at = store.clock.now().toISOString();
    (entry.evidenceRequeues ??= []).push({ at, afterAttempt: entry.attempts, evidence: current });
    entry.status = 'queued'; entry.nextAt = ''; entry.updatedAt = at;
    store.emit('it-investigation-evidence-added', 'New bounded invocation evidence queued the original diagnosis; failure history and attempt budget retained.', 'it', entry.source.ticket);
    return true;
}
