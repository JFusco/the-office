import { HOLDS } from '../../../office/config';
import { handsOff } from '../../harness/scope';
import { dependabotPR, inPickupLane, openDependabotPulls, refusal } from './qualify';
import { ensureReviewCards, ensureTrackingIssue } from './tracking-issue';
import { closesIssue, linkPR } from './link-pr';
import type { Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';
import type { DependabotAdoption, PickupPolicy, TicketJob } from '../../../../src/shared';

type Guard = () => void;

/**
 * A Dependabot PR whose card a person moved to the pickup lane is bridged into the existing-PR flow:
 * the harness creates one tracking issue, links the PR with `Closes #<issue>` and puts both cards In review.
 * PR discovery then routes it to Sam's review, the guarded merge and closeout. Nothing is merged here.
 * Adoption never stops the rest of the poll: its own failures are recorded on the adoption.
 */
export async function adoptDependabot(store: Store, execute: Execute, jobs: TicketJob[], pickup: PickupPolicy): Promise<void> {
    if (!handsOff(store) || store.state.paused || store.state.draining)
        return;
    const records = store.state.coordination!.adoptions ??= [];
    const guard: Guard = () => { if (store.state.paused || store.state.draining) throw new Error('Office paused before a Dependabot adoption write'); };
    let pulls: any[];
    try { pulls = await openDependabotPulls(store, execute); }
    catch (error) { store.emit('dependabot-unavailable', `Dependabot PRs could not be read; adoption skipped this poll: ${String(error)}`, 'pm', ''); return; }
    withdrawStale(store, records, pulls);
    if (pickup.enabled) {
        let ready: any[] = [];
        try { ready = await inPickupLane(store, execute, pulls, pickup.status); }
        catch (error) { store.emit('dependabot-unavailable', `Dependabot PR cards could not be read; adoption skipped this poll: ${String(error)}`, 'pm', ''); }
        for (const p of ready)
            await adoptOne(store, execute, records, p, pickup, guard);
    }
    await reverify(store, execute, records, pulls, jobs, guard);
}

function settle(store: Store, record: DependabotAdoption, status: DependabotAdoption['status'], detail: string, kind: string): void {
    if (record.status === status && record.detail === detail) return;
    Object.assign(record, { status, detail, at: new Date().toISOString() });
    store.emit(kind, detail, 'pm', record.issue ? `GH-${record.issue}` : '');
}

async function adoptOne(store: Store, execute: Execute, records: DependabotAdoption[], p: any, pickup: PickupPolicy, guard: Guard): Promise<void> {
    const pr = dependabotPR(p);
    let record = records.find(r => r.pr === pr.number);
    if (record?.status === 'adopted' || HOLDS[`GH-${pr.number}`])
        return;
    if (!record)
        records.push(record = { id: crypto.randomUUID(), pr: pr.number, url: pr.url, title: pr.title, issue: 0, status: 'blocked', detail: `Dependabot PR #${pr.number} adoption started.`, at: new Date().toISOString() });
    try {
        const refused = await refusal(store, execute, p);
        if (refused) {
            settle(store, record, 'refused', `Dependabot PR #${pr.number} was not adopted: ${refused}. Move its card out of ${pickup.status} or handle it manually.`, 'dependabot-refused');
            return;
        }
        const issue = await ensureTrackingIssue(store, execute, record, pr, guard);
        record.issue = issue.number;
        // Link first: a card moved out of the pickup lane before the link would never be offered again.
        if (!closesIssue(pr.body, issue.number))
            await linkPR(store, execute, record, pr, issue.number, guard);
        await ensureReviewCards(store, execute, record, issue, pr.number, pickup.status, guard);
        settle(store, record, 'adopted', `Dependabot PR #${pr.number} adopted through #${issue.number}; Sam reviews its exact head before the guarded merge.`, 'dependabot-adopted');
    }
    catch (error) {
        settle(store, record, 'blocked', `Dependabot PR #${pr.number} adoption stopped: ${String(error)}`, 'dependabot-blocked');
    }
}

/** A refusal or block whose PR closed (merged, superseded or abandoned) no longer needs Joe. */
function withdrawStale(store: Store, records: DependabotAdoption[], pulls: any[]): void {
    for (const record of records.filter(r => ['refused', 'blocked'].includes(r.status) && !pulls.some(p => p.number === r.pr)))
        settle(store, record, 'withdrawn', `Dependabot PR #${record.pr} is no longer open; its adoption follow-up is withdrawn.`, 'dependabot-withdrawn');
}

/**
 * While delivery is live, an adopted PR must still qualify on its current head (anyone else's push
 * withdraws the adoption, and with it Sam's Dependabot guidance), and a Dependabot rebase that
 * rewrote the body is linked again for its new head.
 */
async function reverify(store: Store, execute: Execute, records: DependabotAdoption[], pulls: any[], jobs: TicketJob[], guard: Guard): Promise<void> {
    for (const record of records.filter(r => r.status === 'adopted' && r.issue)) {
        const p = pulls.find(pull => pull.number === record.pr);
        const live = jobs.some(job => job.key === `GH-${record.issue}` && job.pr === record.pr && !['completed', 'cancelled'].includes(job.status));
        if (!p || !live)
            continue;
        try {
            const refused = await refusal(store, execute, p);
            if (refused) {
                settle(store, record, 'blocked', `Dependabot PR #${record.pr} no longer qualifies for adoption: ${refused}. Sam's Dependabot guidance is withdrawn.`, 'dependabot-blocked');
                continue;
            }
            if (!closesIssue(p.body || '', record.issue))
                await linkPR(store, execute, record, dependabotPR(p), record.issue, guard);
        }
        catch (error) {
            const detail = `Dependabot PR #${record.pr} could not be re-linked to #${record.issue}: ${String(error)}`;
            if (record.relinkError !== detail) {
                record.relinkError = detail;
                store.emit('dependabot-blocked', detail, 'pm', `GH-${record.issue}`);
            }
        }
    }
}
