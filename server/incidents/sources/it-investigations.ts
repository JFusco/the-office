import { boundedEvidence } from '../bounded-evidence';
import type { IncidentCollector } from '../observation';

/**
 * Diagnoses that point at the Office itself: Ellis named the harness as the cause, or proposed an
 * Office fix. The diagnosis is a model's, so each is its own incident and its wording is evidence
 * only. Resolved and retired investigations are history.
 */
export const itInvestigations: IncidentCollector = ({ projectId, provider, state }) => (state.it?.investigations ?? [])
    .filter(investigation => ['diagnosed', 'blocked'].includes(investigation.status) && !investigation.retirement && !investigation.resolution
        && (investigation.report?.cause === 'harness' || investigation.report?.officeFix?.status === 'proposed'))
    .map(investigation => {
        const fix = investigation.report!.officeFix;
        return {
            subject: { projectId, kind: 'investigation', id: investigation.id, episode: String(investigation.attempts), stage: investigation.source.failureKind, stop: null, lastWorker: state.workLog?.filter(run => run.requestId === investigation.id && run.stage === 'it-investigation').at(-1)?.id ?? '', head: '', unsettledEffect: false },
            cause: { source: 'it-investigation' as const, provider, stage: investigation.source.failureKind, kind: fix?.status === 'proposed' ? 'office-fix-proposed' : 'harness', text: '', author: 'model' as const },
            expected: null,
            evidence: boundedEvidence(fix?.status === 'proposed' ? fix.title : investigation.report!.summary),
        };
    });
