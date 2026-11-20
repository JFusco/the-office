import type { Ticket } from '../../../src/shared';
import type { AzureBinding } from '../../office/project-bindings-config';
import { sanitize } from '../../office/security';
import { EffectUncertainError, Effects } from '../../store/effects';
import type { Store } from '../../store/store';
import { containedIn, type AzureRead } from './contained';

export interface PromotionIO { read: AzureRead; write: AzureRead }
type Row = { pullRequestId: number; status: string; sourceRefName: string; targetRefName: string };
const ref = (branch: string) => `refs/heads/${branch}`;

/** What the pull request says. Each line is its own argument; none is empty or starts with a dash. */
export function promotionText(target: string, production: string, tickets: readonly Ticket[]): { title: string; lines: string[] } {
    const listed = tickets.slice(0, 20);
    return {
        title: `Promote ${target} to ${production}: ${tickets.map(t => t.key).join(', ')}`.slice(0, 380),
        lines: [`Promotes what is on ${target} to ${production}.`, `Verified on ${target} by the Office:`,
            ...listed.map(t => `* ${t.key}: ${sanitize(t.summary).replace(/\s+/g, ' ').slice(0, 120)}${t.prId ? ` (pull request ${t.prId})` : ''}`),
            ...(tickets.length > listed.length ? [`* and ${tickets.length - listed.length} more`] : []),
            `This pull request carries everything on ${target}, including changes the Office did not deliver.`,
            'Opened by the Office on Joe\'s behalf. The Office does not complete this pull request or start a deploy.'],
    };
}

const MAX_REFUSALS = 3;

/**
 * Makes sure a staging-to-production pull request is open for tickets whose commit is on staging and
 * not yet on production: the one already open is joined, otherwise one is opened through Effects.
 * An uncertain creation is settled by this same read of the open pull requests, never sent again.
 * Nothing is opened while another ticket of the Office is still in staging QA, since the pull
 * request carries everything on staging.
 */
export async function ensurePromotionPR(store: Store, io: PromotionIO, azure: AzureBinding, tickets: readonly Ticket[]): Promise<void> {
    const production = azure.production!, target = store.project.target, repository = store.project.repository;
    const say = (t: Ticket, note: string, kind = 'promotion-pr-waiting') => { if (t.production?.note !== note) { t.production = { ...t.production, note }; store.save(); store.emit(kind, `${t.key}: ${note}`, 'pm', t.key); } };
    const pending: Ticket[] = [];
    for (const t of tickets) {
        if (!t.production?.since) { t.production = { ...t.production, since: store.clock.now().toISOString() }; store.save(); }
        if (t.production?.pr) {
            // A recorded pull request someone abandoned is said once and never reopened by the Office.
            if (store.state.azure.prs.find(pr => pr.id === t.production!.pr)?.status === 'abandoned') say(t, `Pull request ${t.production.pr} was abandoned. The Office does not open another; open one by hand if the change should still go to ${production.branch}.`, 'promotion-pr-abandoned');
            continue;
        }
        try { if (await containedIn(io.read, azure, { branch: target }, t.commit) && !await containedIn(io.read, azure, { branch: production.branch }, t.commit)) pending.push(t); }
        catch (error) { say(t, `Azure could not compare this ticket's commit with ${target} and ${production.branch}: ${sanitize(String(error)).slice(0, 300)}`); }
    }
    if (!pending.length) return;
    const lead = pending[0];
    const unverified = store.state.tickets.filter(t => t.pilot && t.stage === 'staging-qa').map(t => t.key);
    if (unverified.length) return say(lead, `Waiting to open the ${target} to ${production.branch} pull request until staging QA finishes for ${unverified.join(', ')}.`);
    const listOpen = async () => (await io.read<Row[]>(['repos', 'pr', 'list', '--repository', repository, '--status', 'active', '--source-branch', target, '--target-branch', production.branch]))
        .filter(row => Number.isInteger(row.pullRequestId) && row.status === 'active' && row.sourceRefName === ref(target) && row.targetRefName === ref(production.branch)).sort((a, b) => a.pullRequestId - b.pullRequestId);
    const record = (id: number, source: 'opened' | 'joined') => {
        const url = `${azure.organization}/${azure.project}/_git/${repository}/pullrequest/${id}`, at = store.clock.now().toISOString();
        for (const t of pending) { const { note: _, ...kept } = t.production || {}; t.production = { ...kept, pr: id, prUrl: url, prSource: source, prAt: at }; }
        store.save();
        store.emit(source === 'opened' ? 'promotion-pr-opened' : 'promotion-pr-joined',
            `${pending.map(t => t.key).join(', ')}: ${source === 'opened' ? 'opened' : 'already covered by'} the ${target} to ${production.branch} pull request ${id}. Completing it and deploying stay with a person. ${url}`, 'pm', lead.key);
    };
    const open = await listOpen();
    if (open.length) return record(open[0].pullRequestId, 'joined');

    const attempt = lead.production?.prAttempt || 0, id = `promotion-pr:${lead.key}:${lead.commit}:${attempt}`;
    if (attempt >= MAX_REFUSALS) return say(lead, `Opening the ${target} to ${production.branch} pull request was refused ${MAX_REFUSALS} times before anything was sent. The Office has stopped trying; open one by hand.`);
    const sent = store.getEffect(id);
    if (sent && ['dispatching', 'uncertain'].includes(sent.status))
        return say(lead, `A ${target} to ${production.branch} pull request was sent, Azure answered with an error or not at all, and none is open now. It is not sent again; open one by hand if it is still wanted.`);
    try {
        const created = await new Effects(store).execute<{ lead: string; commit: string }, { id: number }>({
            id, work: { projectId: store.project.id, kind: 'delivery', id: lead.key }, attemptId: `${lead.commit}:${attempt}`, operation: 'azure-pr-create', target: `${target}->${production.branch}`,
            authorization: lead.runId, payload: { lead: lead.key, commit: lead.commit }, expectedState: { source: ref(target), target: ref(production.branch), open: 0 },
            preflight: async () => { if ((await listOpen()).length) throw new Error('A promotion pull request is already open'); },
            dispatch: async () => {
                const text = promotionText(target, production.branch, pending);
                const row = await io.write<Row>(['repos', 'pr', 'create', '--repository', repository, '--source-branch', target, '--target-branch', production.branch, '--title', text.title, '--description', ...text.lines]);
                if (!Number.isInteger(row?.pullRequestId)) throw new Error('Azure returned no pull request id');
                return { id: row.pullRequestId };
            },
            verify: async receipt => (await listOpen()).some(row => row.pullRequestId === receipt.id),
        });
        record(created.id, 'opened');
    }
    catch (error) {
        if (error instanceof EffectUncertainError || store.getEffect(id)?.status !== 'rejected') throw error;
        // Refused before sending: nothing was written, so the next look is a fresh intent, up to the limit.
        lead.production = { ...lead.production, prAttempt: attempt + 1 };
        store.save();
    }
}
