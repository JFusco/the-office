import { boundedEvidence } from '../bounded-evidence';
import type { IncidentCollector } from '../observation';

/**
 * Harper's improvement proposals addressed to the Office harness that have not been closed. A
 * proposal is a model's reading of a cause, so each is its own incident.
 */
export const improvements: IncidentCollector = ({ projectId, provider, repository, state }) => (state.knowledge?.improvements ?? [])
    // In the Office's own project a proposal for the Office is saved under that project's ID.
    .filter(improvement => (improvement.destination === 'office-harness' || repository.endsWith('/the-office') && improvement.destination === projectId) && improvement.status !== 'closed')
    .map(improvement => ({
        subject: { projectId, kind: 'improvement', id: improvement.id, episode: improvement.digest, stage: improvement.status, stop: null, lastWorker: '', head: '', unsettledEffect: improvement.status === 'uncertain' },
        cause: { source: 'improvement' as const, provider, stage: 'improvement', kind: 'office-harness', text: '', author: 'model' as const },
        expected: improvement.status === 'uncertain' ? 'uncertain-effect' as const : null,
        evidence: boundedEvidence(improvement.cause),
    }));
