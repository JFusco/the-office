import type { WorkEligibility, WorkRef } from '../../../src/contracts/work';
import { pendingRounds } from '../../../src/features/questions/pending-round';
import { automaticIntakeWait } from '../../features/handoff/intake-eligibility';
import { automaticEnabled, automaticFeature } from '../../features/progression/policy';
import { FEATURE_PLANNING } from '../../office/config';
import type { ProjectObservation } from '../observation';
import type { StoppedRecord } from './stopped-record';

/** The harness's own words for a feature waiting on answers. The questions and answers themselves never enter the ledger. */
export const FEATURE_QUESTIONS = 'Feature is waiting for answers to its questions';

/** A publication read-back waits only on the harness's own rounds (`scheduledFeatures`). */
const READBACK = 'feature-publication-readback';

/**
 * A feature waiting on a person's answers. Its latest current question round is the stop, recorded in
 * the harness's own words and marked by the round. It is read only while the scheduler projects the
 * feature as waiting, the feature itself waits and is not paused, and neither the automatic policy nor
 * configured intake holds it. Anything else, a blocked feature or a recovery deadline included, keeps
 * the scheduler's own reading: null.
 */
export function featureRecord({ state, projectId, provider }: Pick<ProjectObservation, 'state' | 'projectId' | 'provider'>, work: WorkRef, stage: string, eligibility: WorkEligibility): StoppedRecord | null {
    const feature = state.features?.find(feature => feature.id === work.id && feature.projectId === work.projectId);
    if (!feature || eligibility.state !== 'waiting' || feature.status !== 'waiting' || feature.paused) return null;
    if (automaticFeature(feature) && !automaticEnabled(feature, FEATURE_PLANNING)) return null;
    if (stage !== READBACK && automaticIntakeWait({ state, project: { id: projectId, provider: provider === 'github' ? 'github' : 'azure' } }, feature)) return null;
    const round = pendingRounds(feature, stage === READBACK ? 'harness' : undefined).at(-1);
    if (!round) return null;
    return { standing: 'stopped', key: '', text: FEATURE_QUESTIONS, identity: FEATURE_QUESTIONS, author: 'harness', kind: 'question', stop: null, head: '', lastWorker: '', episode: round.id,
        facts: { question: true }, covers: [], effects: [work] };
}
