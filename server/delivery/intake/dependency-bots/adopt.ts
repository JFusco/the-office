import { HOLDS } from '../../../office/config';
import { handsOff } from '../../harness/scope';
import { dependabotPR, inPickupLane, readRepo } from '../dependabot/qualify';
import { ensureReviewCards, ensureTrackingIssue } from '../dependabot/tracking-issue';
import { closesIssue, linkPR } from '../dependabot/link-pr';
import { autoAdoptable, autoAdopts, waitsQuietly } from './auto-adopt';
import { relinkPinCourier } from './relink-pin-courier';
import { MISSING_NATIVE_LINK } from './resume-linked-delivery';
import type { Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';
import type { DependabotAdoption, PickupPolicy, TicketJob } from '../../../../src/shared';

export interface DependencyBot {
    id: 'dependabot' | 'pin-courier' | 'wiki-sync';
    label: string;
    autoAdoptLanes?: readonly string[];
    openPulls: (store: Store, execute: Execute) => Promise<any[]>;
    refusal: (store: Store, execute: Execute, pull: any) => Promise<string>;
}
type Guard = () => void;

/**
 * A Dependabot PR whose card a person moved to the pickup lane is bridged into the existing-PR flow:
 * the harness creates one tracking issue, links the PR with `Closes #<issue>` and puts both cards In review.
 * PR discovery then routes it to Sam's review, the guarded merge and closeout. Nothing is merged here.
 * Adoption never stops the rest of the poll: its own failures are recorded on the adoption.
 */
export async function adoptDependencyBot(store: Store, execute: Execute, jobs: TicketJob[], pickup: PickupPolicy, bot: DependencyBot): Promise<void> {
    if (!handsOff(store) || store.state.paused || store.state.draining)
        return;
    const all = store.state.coordination!.adoptions ??= [];
    const records = all.filter(record => (record.bot || 'dependabot') === bot.id);
    const guard: Guard = () => { if (store.state.paused || store.state.draining) throw new Error('Office paused before a dependency adoption write'); };
    let pulls: any[];
    try { pulls = await bot.openPulls(store, execute); }
    catch (error) { store.emit(`${bot.id}-unavailable`, `${bot.label} PRs could not be read; adoption skipped this poll: ${String(error)}`, 'pm', ''); return; }
    withdrawStale(store, records, pulls, bot);
    if (pickup.enabled) {
        let ready: any[] = [];
        const auto = autoAdopts(store.project, bot.id);
        try { ready = auto ? await autoAdoptable(store, execute, pulls, pickup.status, bot.autoAdoptLanes) : await inPickupLane(store, execute, pulls, pickup.status); }
        catch (error) { store.emit(`${bot.id}-unavailable`, `${bot.label} PR cards could not be read; adoption skipped this poll: ${String(error)}`, 'pm', ''); }
        for (const p of ready)
            await adoptOne(store, execute, records, p, pickup, guard, bot, auto);
    }
    await reverify(store, execute, records, pulls, jobs, guard, bot);
}

function settle(store: Store, record: DependabotAdoption, status: DependabotAdoption['status'], detail: string, kind: string): void {
    if (record.status === status && record.detail === detail) return;
    Object.assign(record, { status, detail, at: new Date().toISOString() });
    store.emit(kind, detail, 'pm', record.issue ? `GH-${record.issue}` : '');
}

async function adoptOne(store: Store, execute: Execute, records: DependabotAdoption[], p: any, pickup: PickupPolicy, guard: Guard, bot: DependencyBot, auto = false): Promise<void> {
    const pr = { ...dependabotPR(p), bot: bot.id };
    let record = records.find(r => r.pr === pr.number);
    if (record?.status === 'adopted' || HOLDS[`GH-${pr.number}`])
        return;
    if (auto && !record && waitsQuietly(await bot.refusal(store, execute, p)))
        return;
    if (!record)
        records.push(record = { id: crypto.randomUUID(), pr: pr.number, url: pr.url, title: pr.title, issue: 0, status: 'blocked', detail: `${bot.label} PR #${pr.number} adoption started.`, at: new Date().toISOString(), ...(bot.id !== 'dependabot' ? { bot: bot.id } : {}) });
    if (!store.state.coordination!.adoptions!.includes(record)) store.state.coordination!.adoptions!.push(record);
    try {
        const refused = await bot.refusal(store, execute, p);
        if (refused) {
            settle(store, record, 'refused', auto ? `${bot.label} PR #${pr.number} was not adopted automatically: ${refused}. Handle it manually.` : `${bot.label} PR #${pr.number} was not adopted: ${refused}. Move its card out of ${pickup.status} or handle it manually.`, `${bot.id}-refused`);
            return;
        }
        const writeGuard = headGuard(store, execute, p, bot, guard);
        const issue = await ensureTrackingIssue(store, execute, record, pr, writeGuard);
        record.issue = issue.number;
        // Link first: a card moved out of the pickup lane before the link would never be offered again.
        if (!closesIssue(pr.body, issue.number))
            await linkPR(store, execute, record, pr, issue.number, writeGuard);
        await ensureReviewCards(store, execute, record, issue, pr.number, pickup.status, writeGuard);
        settle(store, record, 'adopted', `${bot.label} PR #${pr.number} adopted through #${issue.number}; required GitHub checks and repository rules govern its Office merge, without an added review or QA cycle.`, `${bot.id}-adopted`);
    }
    catch (error) {
        settle(store, record, 'blocked', `${bot.label} PR #${pr.number} adoption stopped: ${String(error)}`, `${bot.id}-blocked`);
    }
}

/** A refusal or block whose PR closed (merged, superseded or abandoned) no longer needs Joe. */
function withdrawStale(store: Store, records: DependabotAdoption[], pulls: any[], bot: DependencyBot): void {
    for (const record of records.filter(r => ['refused', 'blocked'].includes(r.status) && !pulls.some(p => p.number === r.pr)))
        settle(store, record, 'withdrawn', `${bot.label} PR #${record.pr} is no longer open; its adoption follow-up is withdrawn.`, `${bot.id}-withdrawn`);
}

/**
 * While delivery is live, an adopted PR must still qualify on its current head (anyone else's push
 * withdraws the adoption, and with it Sam's Dependabot guidance), and a Dependabot rebase that
 * rewrote the body is linked again for its new head.
 */
async function reverify(store: Store, execute: Execute, records: DependabotAdoption[], pulls: any[], jobs: TicketJob[], guard: Guard, bot: DependencyBot): Promise<void> {
    for (const record of records.filter(r => r.status === 'adopted' && r.issue)) {
        const p = pulls.find(pull => pull.number === record.pr);
        const live = jobs.some(job => job.key === `GH-${record.issue}` && job.pr === record.pr && !['completed', 'cancelled'].includes(job.status));
        if (!p || !live)
            continue;
        try {
            const refused = await bot.refusal(store, execute, p);
            if (refused) {
                settle(store, record, 'blocked', `${bot.label} PR #${record.pr} no longer qualifies for adoption: ${refused}. Sam's bot-specific guidance is withdrawn.`, `${bot.id}-blocked`);
                continue;
            }
            const lostLink = jobs.some(j => j.pr === record.pr && j.key === `GH-${record.issue}` && j.status === 'blocked' && j.detail === MISSING_NATIVE_LINK);
            if (!closesIssue(p.body || '', record.issue) || bot.id === 'pin-courier' && lostLink) {
                const pr = { ...dependabotPR(p), bot: bot.id }, writeGuard = headGuard(store, execute, p, bot, guard);
                if (bot.id === 'pin-courier') await relinkPinCourier(store, execute, record, pr, jobs, writeGuard);
                else await linkPR(store, execute, record, pr, record.issue, writeGuard);
            }
            delete record.relinkError;
        }
        catch (error) {
            const detail = `${bot.label} PR #${record.pr} could not be re-linked to #${record.issue}: ${String(error)}`;
            if (record.relinkError !== detail) {
                record.relinkError = detail;
                store.emit(`${bot.id}-blocked`, detail, 'pm', `GH-${record.issue}`);
            }
        }
    }
}

/** Recheck opt-in automation identity and exact head at every adoption write boundary. */
function headGuard(store: Store, execute: Execute, pull: any, bot: DependencyBot, guard: Guard) {
    return async () => {
        guard();
        if (bot.id === 'dependabot') return;
        const current = await readRepo(store, execute, `pulls/${pull.number}`);
        if (current.state !== 'open' || current.head?.sha !== pull.head?.sha) throw new Error(`${bot.id} head changed before adoption write`);
        const refused = await bot.refusal(store, execute, current);
        if (refused) throw new Error(refused);
    };
}
