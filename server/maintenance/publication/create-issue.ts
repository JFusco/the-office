import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { readBackOrThrow } from '../../delivery/harness/read-retry';
import { expectedAuthor } from '../../github/identity/office-authors';
import { activeEffectId } from '../../delivery/harness/effect';
import { allIssues, issueDecision, matchIssues, type GitHubIssue } from './issue-search';
import { carriesMarker, issueContentFault, publishedIssueBody } from './issue-content';
import { maintenanceEffect, maintenanceEffectBase, type MaintenanceOwner } from './maintenance-effect';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';

type Execute = typeof command;
/** The current assignee account until #593 lands a per-project assignee. */
export const MAINTENANCE_ASSIGNEE = 'JFusco';

export interface ProposedIssue { key: string; title: string; body: string; labels: string[]; named: number; provenance?: string; grounded: (issue: GitHubIssue) => boolean }
export interface VerifiedIssue { number: number; url: string; nodeId: string; title: string; effectId: string; adopted: boolean }
export interface CreatePayload { key: string; title: string; body: string; labels: string[]; assignees: string[] }
export interface CreatedIssue { number: number; url: string; nodeId: string }

/** The repository's own label names for the proposed ones, case-insensitively, deduplicated. Unknown labels and a missing area stop. */
export async function canonicalLabels(store: Store, execute: Execute, proposed: readonly string[]): Promise<string[]> {
    const labels = (await readRepo(store, execute, 'labels?per_page=100', true) as { name: string }[]).map(label => label.name);
    const resolved = new Set<string>();
    for (const name of proposed) {
        const found = labels.filter(label => label.toLowerCase() === name.trim().toLowerCase());
        if (found.length !== 1) throw new Error(`Label "${name}" is not one of ${store.project.repository}'s labels`);
        resolved.add(found[0]);
    }
    if (labels.some(label => label.startsWith('area:')) && ![...resolved].some(label => label.startsWith('area:')))
        throw new Error(`${store.project.repository} requires an area: label on every new issue`);
    if (!resolved.size) throw new Error('A maintenance issue needs at least one label');
    return [...resolved].sort();
}

const sorted = (values: string[]) => [...values].sort();
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Exact read-back of a created issue: repository, number and URL, marker, open state, bytes, labels, assignees and writer. */
export function createdMatches(store: Store, issue: GitHubIssue, payload: CreatePayload, author: string): boolean {
    return issue.html_url === `https://github.com/${store.project.repository}/issues/${issue.number}` && !issue.pull_request && issue.state === 'open'
        && carriesMarker(issue.body, payload.key) && issue.title === payload.title && (issue.body || '') === payload.body
        && same(sorted(issue.labels.map(label => label.name)), sorted(payload.labels)) && same(sorted(issue.assignees.map(owner => owner.login)), sorted(payload.assignees))
        && issue.user?.login === author;
}

/**
 * The one keyed issue that settles an attempted create, or null: the only issue carrying the marker, matching the
 * saved payload and writer exactly, and, when the create's own response already named an issue (a field GitHub
 * dropped left it unverified), that same issue by number, URL and node ID. A replacement issue with the same marker
 * and content never settles the original attempt. A lost response with no saved identity is found by its marker.
 * Immediate, CMS and Brain read-back all use this.
 */
export function settlingIssue(store: Store, issues: readonly GitHubIssue[], payload: CreatePayload, author: string, saved: unknown): CreatedIssue | null {
    const found = issues.filter(issue => carriesMarker(issue.body, payload.key));
    if (found.length !== 1 || !createdMatches(store, found[0], payload, author)) return null;
    const [issue] = found, named = saved as Partial<CreatedIssue> | null | undefined;
    if (named && named.number !== undefined && (named.number !== issue.number || named.url !== issue.html_url || named.nodeId !== issue.node_id)) return null;
    return { number: issue.number, url: issue.html_url, nodeId: issue.node_id };
}

/**
 * Verifies or creates the one issue for a maintenance key. A dispatching or uncertain create is read back under its
 * saved writer first and never resent. Otherwise the complete listing decides: adopt one verified match, or send one
 * assigned REST create of the exact validated payload, persisted before dispatch, and read every field back. A field
 * GitHub dropped leaves the attempt unverified with its issue identity retained; it is never created again.
 */
export async function ensureMaintenanceIssue(store: Store, execute: Execute, owner: MaintenanceOwner, proposed: ProposedIssue): Promise<VerifiedIssue> {
    const base = maintenanceEffectBase(owner.run.id, owner.subject, 'issue-create'), effectId = activeEffectId(store, base), prior = store.getEffect(effectId);
    const author = expectedAuthor(store, effectId, 'github-issue-create');
    if (prior?.status === 'verified') {
        const saved = prior.receipt as { number: number; url: string; nodeId: string };
        return { ...saved, title: (prior.payload as CreatePayload).title, effectId, adopted: false };
    }
    const attempted = prior && ['dispatching', 'uncertain'].includes(prior.status);
    if (!attempted) {
        const issues = await allIssues(store, execute);
        const decision = issueDecision(store, issues, matchIssues(issues, proposed.key, proposed.title), proposed);
        if ('stop' in decision) throw new Error(decision.stop);
        if ('adopt' in decision) {
            const issue = decision.adopt;
            return { number: issue.number, url: issue.html_url, nodeId: issue.node_id, title: issue.title, effectId: '', adopted: true };
        }
        // Only a create needs the proposed content to keep the issue-creator rules; an adoption keeps the issue as it is.
        const fault = issueContentFault(proposed.title, proposed.body);
        if (fault) throw new Error(fault);
    }
    // An attempted create is read back against the exact payload it saved, never a recomputed one.
    const payload: CreatePayload = attempted ? prior!.payload as CreatePayload : { key: proposed.key, title: proposed.title, body: publishedIssueBody(proposed.body, proposed.key, proposed.provenance),
        labels: await canonicalLabels(store, execute, proposed.labels), assignees: [MAINTENANCE_ASSIGNEE] };
    // The identity a create's response saved is the one read-back must find again (`settlingIssue`).
    const readBack = async () => settlingIssue(store, await allIssues(store, execute), payload, expectedAuthor(store, effectId, 'github-issue-create'), store.getEffect(effectId)?.receipt);
    const receipt = await maintenanceEffect<CreatedIssue>(store, owner, {
        key: 'issue-create', operation: 'github-issue-create', target: `${store.project.repository}#maintenance-issue-${proposed.key}`,
        payload: payload as unknown as Record<string, unknown>, guard: () => {},
        dispatch: async () => {
            const raw = await execute('gh', ['api', `repos/${store.project.repository}/issues`, '--method', 'POST', '--input', '-'], { cwd: store.project.repo, input: JSON.stringify({ title: payload.title, body: payload.body, labels: payload.labels, assignees: payload.assignees }), timeout: 60000 });
            const created = raw.trim() ? JSON.parse(raw) : null;
            if (Number.isSafeInteger(created?.number) && created.number > 0 && created.html_url === `https://github.com/${store.project.repository}/issues/${created.number}`)
                return { number: created.number, url: created.html_url, nodeId: created.node_id };
            return readBackOrThrow(readBack, `Maintenance issue ${proposed.key}`);
        },
        verify: async created => {
            const issue = await readRepo(store, execute, `issues/${created.number}`) as GitHubIssue;
            return issue.number === created.number && issue.node_id === created.nodeId && createdMatches(store, issue, payload, author);
        },
        readBack,
    });
    return { ...receipt, title: payload.title, effectId: activeEffectId(store, base), adopted: false };
}
