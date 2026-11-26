import { handsOff } from '../harness/scope';
import { openPulls, type PullInventory } from './shared-pr-inventory';
import type { AssignedIssue } from '../../../src/shared';
import type { TicketJob } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';

export async function discover(this: GitHubDelivery, assigned: AssignedIssue[], shared?: PullInventory) {
    // Provider observation supplies the PR inventory; no model or source work is
    // needed to route already published work to a read-only Lead assessment.
    const inventory = handsOff(this.store) ? await openPulls(this, shared) : await Promise.all((this.store.state.github?.prs.filter(p => p.state === 'open') || []).map(pr => this.api(`pulls/${pr.number}`)));
    const candidates = new Map(assigned.map(i => [i.key, { key: i.key, url: i.url }]));
    for (const i of this.store.state.github?.issues || [])
        if (i.state === 'open' && this.store.state.github?.board?.items.some(card => card.repository === this.store.project.repository && card.number === i.number))
            candidates.set(i.key, { key: i.key, url: i.url });
    for (const p of inventory) {
        if (p.state !== 'open' || p.merged_at)
            continue;
        const pr = { number: p.number };
        const links = JSON.parse(await this.execute('gh', ['pr', 'view', String(pr.number), '--repo', this.store.project.repository, '--json', 'closingIssuesReferences'], { cwd: this.store.project.repo, timeout: 60000 }));
        for (const issue of candidates.values()) {
            const directive = new RegExp(`(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${Number(issue.key.slice(3))}(?![0-9])`, 'i');
            if (!links.closingIssuesReferences?.some((i: any) => i.url === issue.url) && !directive.test(p.body || ''))
                continue;
            this.enqueue(issue.key, pr.number, undefined, { kind: 'linked-pr', reference: `https://github.com/${this.store.project.repository}/pull/${pr.number}` });
            const job = this.jobs.find(j => j.key === issue.key && j.status !== 'cancelled')!;
            job.existingPR = true;
            const routingBug = job.stage === 'lead-pr' && job.status === 'blocked' && job.detail === 'Error: PR repository or target does not match this project';
            const retainedParent = this.jobs.find(parent => parent.pr === job.dependsOnPR && !['completed', 'cancelled'].includes(parent.status));
            job.branch = p.head?.ref || job.branch;
            job.dependsOnPR = retainedParent?.pr || (p.base.ref === this.store.project.target ? undefined : inventory.find(parent => parent.number !== p.number && parent.head?.ref === p.base.ref && !parent.merged_at)?.number);
            // Repair only the known read-only routing bug; never replay a writer.
            if (routingBug && job.steps.every(s => s.result.receipts.every(r => r.verified && !r.uncertain))) {
                job.status = 'queued';
                job.detail = 'Stacked PR routed for current-head review.';
            }
            if (job.dependsOnPR && job.status === 'queued')
                job.detail = `Waiting for parent PR #${job.dependsOnPR}. Sam will continue this ticket after its dependency closes.`;
            for (const r of this.store.state.coordination!.listener.reviews.filter(r => r.key === issue.key && r.status !== 'working')) {
                r.prNumber = pr.number;
                if (r.status === 'queued') {
                    r.status = 'owned';
                    r.endedAt = new Date().toISOString();
                    r.detail = `Existing PR #${pr.number} routed to Sam. No duplicate development; no approval needed.`;
                }
            }
        }
    }
}

const live = (job: TicketJob) => !['completed', 'cancelled'].includes(job.status);
const hasRoutingRefs = (pull: any) => typeof pull?.head?.ref === 'string' && !!pull.head.ref.trim() &&
    typeof pull?.base?.ref === 'string' && !!pull.base.ref.trim();

/**
 * Stacked-PR routing for live jobs only: a finished job's PR is never read again. Rows come from the poll's
 * open-PR inventory when one is given; a live PR it lacks (every live PR, from the pump) is read once by number.
 */
export async function refreshDependencies(this: GitHubDelivery, inventory?: PullInventory) {
    const tracked = this.jobs.filter(j => j.pr && live(j)).map(job => ({ job, id: job.id, key: job.key, pr: job.pr }));
    if (!tracked.length)
        return;
    const current = ({ job, id, key, pr }: typeof tracked[number]) =>
        this.jobs.includes(job) && job.id === id && job.key === key && job.pr === pr && live(job);
    const wanted = new Set(tracked.map(t => t.pr)), metadata = new Map<number, any>();
    // A failed inventory leaves each live PR eligible for a detail read.
    for (const p of inventory ? await inventory.read().catch(() => []) : [])
        if (wanted.has(p.number) && hasRoutingRefs(p))
            metadata.set(p.number, p);
    const missing = [...wanted].filter(pr => !metadata.has(pr));
    await Promise.all(missing.map(async pr => {
        if (!tracked.some(t => t.pr === pr && current(t))) return;
        const p = await this.api(`pulls/${pr}`);
        if (p?.number === pr && hasRoutingRefs(p)) metadata.set(pr, p);
    }));
    for (const entry of tracked) {
        // A job that finished, was cancelled or changed PR while the reads were out keeps its routing as it was.
        if (!current(entry))
            continue;
        const { job, pr } = entry;
        const p = metadata.get(pr);
        if (!p)
            throw new Error('PR dependency identity is unavailable');
        const previous = this.jobs.find(parent => parent.pr === job.dependsOnPR && live(parent));
        // A parent is another job, live as the jobs stand now, whose PR head is this PR's base.
        const parentJob = this.jobs.find(j => live(j) && j.pr !== pr && metadata.get(j.pr)?.head.ref === p.base.ref);
        job.branch = p.head.ref;
        job.dependsOnPR = previous?.pr || parentJob?.pr;
        if (job.dependsOnPR && job.status === 'queued')
            job.detail = `Waiting for parent PR #${job.dependsOnPR} to finish closeout.`;
    }
}

export async function routeExisting(this: GitHubDelivery, key: string, pr: number) {
    const candidate = { key, pr } as TicketJob;
    let p;
    try {
        p = await this.verifyPR(candidate);
    }
    catch (error) {
        // A verified unrelated reference is not delivery ownership. Transport,
        // identity and coverage failures still block a new implementation.
        if (error instanceof Error && error.message === 'PR is not natively linked to this exact project issue')
            return false;
        throw error;
    }
    if (p.state !== 'open' || p.merged_at)
        return false;
    this.enqueue(key, pr, undefined, { kind: 'linked-pr', reference: `https://github.com/${this.store.project.repository}/pull/${pr}` });
    return true;
}
