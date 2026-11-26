import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { observeSupersededClose } from '../closeout/superseded-wiki-pr';
import { adoptionFor, botOf, redoOf } from '../repairs/bot-redo/ledger';
import { observeRedos } from '../repairs/bot-redo/reconcile';
import { nativeLinked } from '../repairs/bot-redo/recovery-reader';
import { automationMergePolicy } from './automation-merge';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { BotRedo, TicketJob } from '../../../src/shared';

const VERB = { dependabot: 'rebase it', 'pin-courier': 'rebase it', 'wiki-sync': 'regenerate it' } as Record<string, string>;

/**
 * Conflict handling for an adopted bot PR during observation: reads and local transitions only, never a provider
 * write. Null leaves the PR to ordinary automation observation; true or false is the observation's result.
 */
export async function observeAutomationConflict(delivery: GitHubDelivery, job: TicketJob, pr: any): Promise<boolean | null> {
    const { store } = delivery, record = adoptionFor(store, job);
    if (!record) return null;
    if (job.supersededWikiClose) return observeSupersededClose(delivery, job, pr);
    const { stage, status, key, pr: number, head, branch } = job, adoptedBot = botOf(record);
    const current = () => job.stage === stage && job.status === status &&
        (status === 'watching' || stage === 'merge' && ['blocked', 'interrupted'].includes(status)) &&
        job.key === key && job.pr === number && job.head === head && job.branch === branch &&
        !job.mergeAttempt && !job.mergeCommit && delivery.jobs.includes(job) &&
        adoptionFor(store, job) === record && botOf(record) === adoptedBot;
    if (await observeRedos(delivery, job, pr, record, nativeLinked(pr))) return true;
    if (!current()) return true;
    if (pr.state !== 'open' || pr.merged_at || pr.draft || pr.mergeable !== false || !nativeLinked(pr)) return null;
    // Only a live REST `mergeable: false` admits a redo; GitHub's initial null waits on ordinary observation.
    const sha = pr.head.sha, bot = await automationMergePolicy(delivery, { ...job, head: sha }, pr);
    if (!current()) return true;
    if (!bot || job.mergeApprovalRequired || !store.state.coordination?.merges?.enabled && job.mergeAuthorization?.head !== sha) return null;
    if (!assessDeliveryEligibility(store, job).eligible) throw new Error('Automation head cannot change while delivery is held or owned');
    let redo = redoOf(store, record, job.pr, sha);
    if (!redo) (record.redos ??= []).push(redo = { sha, pr: job.pr, issue: record.issue, bot: bot as BotRedo['bot'], branch: pr.head.ref,
        issueUrl: `https://github.com/${store.project.repository}/issues/${record.issue}`, firstSeenAt: store.clock.now().toISOString() });
    if (redo.settled || redo.closed) return null;
    const heads = record.redos!.filter(r => r.pr === job.pr).length;
    job.head = sha; job.branch = pr.head.ref;
    delete job.reviewContext; delete job.reviewInputSha256; delete job.stop;
    job.stage = 'merge'; job.status = 'queued';
    job.detail = `${bot} PR #${job.pr} conflicts with ${store.project.target} at ${sha.slice(0, 7)}; the merge stage asks ${bot} to ${VERB[bot]}, once for this head${heads > 1 ? ` (conflicted head ${heads} of this PR)` : ''}.`;
    store.emit('bot-redo-conflict', `${job.key}: ${job.detail}`, 'pm', job.key);
    return true;
}
