import { harnessDelivers } from './scope';
import { harnessDraft } from '../publication/draft-stage';
import { harnessPrepare } from '../publication/prepare-stage';
import { harnessCloseout } from '../closeout/closeout';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/** Returns a harness StageResult for model-free stages, or null when a model worker should run. */
export async function runHarnessStage(delivery: GitHubDelivery, job: TicketJob, root: string, readyChecks: boolean): Promise<StageResult | null> {
    if (!harnessDelivers(delivery.store, job)) return null;
    if (job.stage === 'draft') return harnessDraft(delivery, job, root);
    if (job.stage === 'prepare-pr') return harnessPrepare(delivery, job, root, readyChecks);
    if (job.stage === 'closeout') return harnessCloseout(delivery, job, root);
    return null;
}
