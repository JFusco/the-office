import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

/** Recoveries the IT specialist handed to a person: its attempts are spent, or the entry allowed only one. */
export const itRecoveries: IncidentCollector = ({ projectId, provider, state }) => Object.entries(state.it?.recoveries ?? {})
    .filter(([, recovery]) => recovery.status === 'needs-human')
    .map(([id, recovery]) => ({
        subject: { projectId, kind: 'recovery', id, episode: String(recovery.attempts), stage: id.split(':')[0], stop: null, lastWorker: '', head: '', unsettledEffect: false },
        // A recovery's detail is copied from what it tried to recover; only a service probe's is the harness's own.
        cause: { source: 'it-recovery' as const, provider, stage: id.split(':')[0], kind: 'needs-human', ...(/^(?:probe|login):/.test(id) ? { text: normalizeCause(recovery.detail), author: 'harness' as const } : { text: '', author: 'unknown' as const }) },
        expected: null,
        evidence: boundedEvidence(recovery.detail),
    }));
