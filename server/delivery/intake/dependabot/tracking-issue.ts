import { harnessEffect } from '../../harness/effect';
import { readBackOrThrow } from '../../harness/read-retry';
import { resolveLane } from '../../board/move-lane';
import { cardStatus, projectCards, projectGraphql, setCardStatus, statusField, type Execute } from '../../board/project-graphql';
import { readRepo, type DependabotPR } from './qualify';
import type { Store } from '../../../store/store';
import { centralCompanionHandoff, centralCompanionIssue } from '../dependency-bots/companion-issue';

export interface TrackingIssue { number: number; nodeId: string; url: string }

/** Hidden marker that ties exactly one tracking issue to its Dependabot PR across restarts. */
export const trackingMarker = (pr: number, bot = 'dependabot') => `<!-- office-${bot}-pr:${pr} -->`;

/** The Office's own tracking issue: created through Joe's token, assigned to him, carrying the marker. */
function ownTracking(i: any, pr: number, bot = 'dependabot'): boolean {
    return !i.pull_request && i.user?.login === 'JFusco' && i.assignees?.some((a: any) => a.login === 'JFusco') && String(i.body || '').includes(trackingMarker(pr, bot));
}

export async function findTrackingIssue(store: Store, execute: Execute, pr: number, known = 0, bot = 'dependabot'): Promise<TrackingIssue | null> {
    const central = bot === 'pin-courier' && centralCompanionHandoff(store.project.repository);
    const matches = (i: any) => ownTracking(i, pr, bot) || central && centralCompanionIssue(i, store.project.repository, pr);
    const found = known ? [await readRepo(store, execute, `issues/${known}`)].filter(matches)
        : (await readRepo(store, execute, central ? 'issues?state=all&per_page=100' : 'issues?state=all&creator=JFusco&per_page=100', true)).filter(matches);
    if (found.length > 1)
        throw new Error(`Dependency PR #${pr} has ${found.length} tracking issues; reconcile before adoption`);
    if (found[0] && found[0].state !== 'open')
        throw new Error(`Tracking issue #${found[0].number} for dependency PR #${pr} is closed; reopen it or move the PR card out of the pickup lane`);
    return found.length ? { number: found[0].number, nodeId: found[0].node_id, url: found[0].html_url } : null;
}

export const trackingIssueTitle = (pr: DependabotPR) => pr.bot === 'wiki-sync' ? `[Task] Merge wiki-sync PR #${pr.number}` : `[Task] Merge ${pr.bot === 'pin-courier' ? 'pin-courier' : 'Dependabot'} update #${pr.number}`;

export function trackingIssueBody(pr: DependabotPR): string {
    const wiki = pr.bot === 'wiki-sync';
    return [
        '## Summary', '', wiki ? `wiki-sync opened #${pr.number} (\`${pr.title}\`), a wiki reconciliation adopted under the project's automation policy.` : `${pr.bot === 'pin-courier' ? 'pin-courier' : 'Dependabot'} opened #${pr.number} (\`${pr.title}\`), a dependency update, and its card was moved to the pickup lane.`, '',
        '## Context', '', wiki ? 'The wiki PR already contains the reconciliation; this issue tracks its checks and delivery.' : 'The dependency PR already contains the implementation; this issue tracks its checks and delivery.', '',
        '## Details', '', `The Office adopts the existing PR instead of developing a duplicate: the guarded merge runs once the exact head passes its required GitHub checks and repository rules, without an added review or QA cycle. Merging #${pr.number} closes this issue.`, '',
        '## Expected Outcome', '', wiki ? 'The existing wiki reconciliation is delivered through the Office.' : 'The existing dependency update is delivered through the Office.', '',
        '**Acceptance Criteria**', '', wiki ? '- Required GitHub checks pass for the exact wiki head; no additional Office review or QA cycle.' : '- Required GitHub checks pass for the exact dependency head; no additional Office review or QA cycle.', '- Merge only the verified current head under the project merge policy.', '- Verify issue closure, board closeout and the configured Slack notification.', '',
        '## Additional Notes', '', `Existing PR: ${pr.url}. No duplicate implementation is requested.`, '',
        trackingMarker(pr.number, pr.bot), '',
    ].join('\n');
}

/** Creates the one tracking issue, assigned to Joe, or returns the existing one. Never creates twice. */
export async function ensureTrackingIssue(store: Store, execute: Execute, record: { id: string; issue: number }, pr: DependabotPR, guard: () => void | Promise<void>): Promise<TrackingIssue> {
    const existing = await findTrackingIssue(store, execute, pr.number, record.issue, pr.bot);
    if (existing)
        return existing;
    if (record.issue) throw new Error(`Known tracking issue #${record.issue} no longer matches; preserve it for reconciliation`);
    if (pr.bot === 'pin-courier' && centralCompanionHandoff(store.project.repository))
        throw new Error(`Pin Courier PR #${pr.number} awaits its central companion issue; Office will not create a competing issue`);
    const read = () => findTrackingIssue(store, execute, pr.number, 0, pr.bot);
    return harnessEffect(store, record, {
        key: `issue:${pr.number}`, operation: 'github-issue-create', target: `${store.project.repository}#${pr.bot || 'dependabot'}-${pr.number}`, payload: { pr: pr.number }, guard,
        dispatch: async () => {
            await execute('gh', ['api', `repos/${store.project.repository}/issues`, '-X', 'POST', '-f', `title=${trackingIssueTitle(pr)}`, '-f', `body=${trackingIssueBody(pr)}`, '-f', 'assignees[]=JFusco'], { cwd: store.project.repo, timeout: 60000 });
            return readBackOrThrow(read, `Tracking issue for ${pr.bot || 'Dependabot'} PR #${pr.number}`);
        },
        readBack: read,
    });
}

/**
 * Puts the tracking issue's card and the PR's card in In review: the published PR is awaiting required GitHub checks and guarded merge.
 * Project automation may already have added the issue card in its default lane.
 */
export async function ensureReviewCards(store: Store, execute: Execute, record: { id: string }, issue: TrackingIssue, pr: number, pickupLane: string, guard: () => void | Promise<void>): Promise<void> {
    if (!store.project.githubProject)
        return;
    const field = await statusField(store, execute), option = resolveLane(field, 'In review');
    const find = async (kind: 'Issue' | 'PullRequest', number: number) => (await projectCards(store, execute, field.projectId, [{ kind, number }]))[0] || null;
    const issueCard = async () => find('Issue', issue.number);
    const issueItem = await issueCard() ?? await harnessEffect(store, record, {
        key: `card:${issue.number}`, operation: 'github-project-add', target: `${field.projectId}:issue-${issue.number}`, payload: { issue: issue.number }, guard,
        dispatch: async () => {
            await projectGraphql(store, execute, 'mutation($project:ID!,$content:ID!){addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}', { project: field.projectId, content: issue.nodeId }, false);
            return readBackOrThrow(issueCard, `Board card for #${issue.number}`);
        },
        readBack: issueCard,
    });
    const prItem = await find('PullRequest', pr);
    const cards = [{ item: issueItem, label: `tracking issue #${issue.number}`, tracking: true }, ...(prItem ? [{ item: prItem, label: `PR #${pr}`, tracking: false }] : [])];
    for (const { item, label, tracking } of cards) {
        const current = await cardStatus(store, execute, item.id, field.fieldId);
        if (current === option.id)
            continue;
        // An owned tracking issue may already be In progress; its implementation is the existing PR.
        // Preserve Block/Done and unexpected PR lanes rather than overriding a human decision.
        const name = field.options.find(o => o.id === current)?.name.trim().toLowerCase() || '';
        if (name && !['backlog', pickupLane.trim().toLowerCase(), ...(tracking ? ['in progress'] : [])].includes(name))
            throw new Error(`The ${label} card is in "${name}"; the harness will not move it`);
        const inReview = async () => await cardStatus(store, execute, item.id, field.fieldId) === option.id ? { lane: option.name } : null;
        await harnessEffect(store, record, {
            key: `card-status:${item.id}`, operation: 'github-project-status', target: item.id, payload: { lane: option.name }, guard,
            dispatch: async () => { await setCardStatus(store, execute, field.projectId, item.id, field.fieldId, option.id); return readBackOrThrow(inReview, `In review lane for the ${label}`); },
            readBack: inReview,
        });
    }
}
