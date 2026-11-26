import { holdReason } from '../../office/project-holds';
import { assertDeliveryMayMutate } from '../harness/guards';
import { adoptionFor, botOf } from '../repairs/bot-redo/ledger';
import { assertHarnessMayMerge } from './merge-ceiling';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

interface AdoptionBinding { adoption: string; bot: string; pr: number; issue: number }

/**
 * Synchronous, last in an automation write's preflight, after every awaited read: the live adoption, the job and its
 * running claim, issue and PR holds, pause, the project merge ceiling, a pending approval, and the merge switch or an
 * approval for exactly `sha`.
 */
export function assertAutomationAuthority(store: Store, jobs: TicketJob[], job: TicketJob, sha: string, expected: AdoptionBinding): void {
    assertHarnessMayMerge(store);
    const adoption = adoptionFor(store, job);
    if (!adoption || adoption.id !== expected.adoption || botOf(adoption) !== expected.bot || adoption.pr !== expected.pr || adoption.issue !== expected.issue)
        throw new Error('Automation adoption changed before the write');
    assertDeliveryMayMutate(store, jobs, job, sha);
    if (holdReason(store.project, `GH-${job.pr}`)) throw new Error(`GH-${job.pr} is held: ${holdReason(store.project, `GH-${job.pr}`)}`);
    if (job.mergeApprovalRequired || job.mergeAuthorization && job.mergeAuthorization.head !== sha || !store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== sha)
        throw new Error('Office merging is paused, disabled, or awaiting this PR’s approval');
}
