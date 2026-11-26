import { MISSING_NATIVE_LINK } from '../../intake/dependency-bots/resume-linked-delivery';
import { adoptionFor, restoreRedos } from './ledger';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { Store } from '../../../store/store';
import type { TicketJob } from '../../../../src/shared';

const linkState = new WeakMap<object, boolean>();
/** False only when the recovery reader returned this PR without its native issue link; otherwise it was read strictly. */
export const nativeLinked = (pr: object) => linkState.get(pr) !== false;

/** An idle merge job whose adopted PR has a recorded redo or a superseded wiki close. */
function recovering(store: Store, job: TicketJob): boolean {
    if (job.stage !== 'merge' || ['queued', 'working'].includes(job.status)) return false;
    if (job.supersededWikiClose) return true;
    const adoption = adoptionFor(store, job);
    if (!adoption) return false;
    if (!adoption.redos?.length) restoreRedos(store, adoption);
    return !!adoption.redos?.some(r => r.pr === job.pr);
}

/**
 * Observation's PR reader. A recovering PR that is not merged is returned with its actual native-link state instead of
 * throwing, so the recovery can wait, relink or stop. Every other read, and every merged PR, stays strict.
 */
export function withRecoveryReader(delivery: GitHubDelivery): GitHubDelivery {
    const view: GitHubDelivery = Object.create(delivery);
    view.verifyPR = async (job, requireTarget = false, read) => {
        if (read || !recovering(delivery.store, job)) return delivery.verifyPR(job, requireTarget, read);
        const { store, execute } = delivery, p = await delivery.api(`pulls/${job.pr}`);
        const links = async () => JSON.parse(await execute('gh', ['pr', 'view', String(job.pr), '--repo', store.project.repository, '--json', 'closingIssuesReferences'], { cwd: store.project.repo, timeout: 60000 }));
        const reader = async (kind: 'pull-request' | 'issue-links') => kind === 'pull-request' ? p : links();
        if (p.merged_at) return delivery.verifyPR(job, requireTarget, reader);
        try { await delivery.verifyPR(job, true, reader); linkState.set(p, true); }
        catch (error) { if (String(error) !== MISSING_NATIVE_LINK) throw error; linkState.set(p, false); }
        return p;
    };
    return view;
}
