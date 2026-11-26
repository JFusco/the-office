import type { EffectIntent, TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { githubIdentity } from '../../github/identity/identity-runtime';
import { savedAuthor } from '../../github/identity/office-authors';

/** The job's attempted Office merge Effects: the one it records and its default id. */
function mergeEffects(store: Store, job: Pick<TicketJob, 'id' | 'head' | 'mergeIntentId'>): EffectIntent[] {
    return [...new Set([job.mergeIntentId, `merge:${job.id}:${job.head}`].filter((id): id is string => !!id))]
        .map(id => store.getEffect(id)).filter((effect): effect is EffectIntent => !!effect && effect.operation === 'github-merge' && !!effect.dispatchedAt);
}

/**
 * The verified Office merge Effect GitHub's record of this merged pull request matches: the same PR, the guarded
 * head, the merge commit the Effect read back, and `merged_by` equal to the writer the Effect saved (the historical
 * operator for a legacy merge). Undefined when no Office merge accounts for it.
 */
export function officeMerge(store: Store, job: Pick<TicketJob, 'id' | 'head' | 'mergeIntentId'>, pull: any): EffectIntent | undefined {
    return mergeEffects(store, job).find(effect => effect.status === 'verified' && effect.target === pull?.html_url &&
        (effect.payload as { sha?: string })?.sha === pull?.head?.sha && (effect.receipt as { sha?: string } | null)?.sha === pull?.merge_commit_sha &&
        pull?.merged_by?.login === savedAuthor(effect));
}
/** True when the job has sent a merge of its own: such a merge is the harness's, never the owner's. */
export const harnessMergeAttempted = (store: Store, job: Pick<TicketJob, 'id' | 'head' | 'mergeIntentId'>) => mergeEffects(store, job).length > 0;
/** True when GitHub records the Office App's bot as the merger: only a matching Office merge Effect can account for that. */
export const mergedByOfficeBot = (store: Store, pull: any) => !!pull?.merged_by?.login && pull.merged_by.login === githubIdentity(store).config()?.botLogin;
