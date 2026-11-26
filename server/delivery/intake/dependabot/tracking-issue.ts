import { activeEffectId, harnessEffect } from '../../harness/effect';
import { readBackOrThrow } from '../../harness/read-retry';
import { resolveLane } from '../../board/move-lane';
import { cardStatus, projectCards, projectGraphql, setCardStatus, statusField, type Execute } from '../../board/project-graphql';
import { readRepo, type DependabotPR } from './qualify';
import type { Store } from '../../../store/store';
import { centralCompanionHandoff, centralCompanionIssue } from '../dependency-bots/companion-issue';
import { discoveredAuthor, issueCreationAuthor, OPERATOR_LOGIN } from '../../../github/identity/office-authors';

export interface TrackingIssue { number: number; nodeId: string; url: string }

/** Hidden marker that ties exactly one tracking issue to its Dependabot PR across restarts. */
export const trackingMarker = (pr: number, bot = 'dependabot') => `<!-- office-${bot}-pr:${pr} -->`;
const issueTarget = (store: Store, pr: number, bot: string) => `${store.project.repository}#${bot}-${pr}`;
const receipt = (i: any): TrackingIssue => ({ number: i.number, nodeId: i.node_id, url: i.html_url });
export const trackingIssueAuthor = (store: Store, issue: number, pr: number, bot: string) =>
    issueCreationAuthor(store, issue, issueTarget(store, pr, bot));

/**
 * The Office's own tracking issue, each fact checked on its own: written by an accepted Office author (the historical
 * operator unless another is given), assigned to Joe, carrying the marker and, when named, on this repository.
 */
export function ownTracking(i: any, pr: number, bot = 'dependabot', authors: readonly string[] = [OPERATOR_LOGIN], repository?: string): boolean {
    return !i.pull_request && authors.includes(i.user?.login) && i.assignees?.some((a: any) => a.login === 'JFusco') && String(i.body || '').includes(trackingMarker(pr, bot)) &&
        (!repository || i.html_url === `https://github.com/${repository}/issues/${i.number}`);
}

export async function findTrackingIssue(store: Store, execute: Execute, pr: number, known = 0, bot = 'dependabot', scan = !known): Promise<TrackingIssue | null> {
    const central = bot === 'pin-courier' && centralCompanionHandoff(store.project.repository);
    const author = known ? trackingIssueAuthor(store, known, pr, bot) : undefined;
    // Every author's issues, all pages: no single-creator filter, so a bot-written tracking issue is found too.
    const matches = (i: any) => {
        const login = i?.user?.login;
        const marked = typeof login === 'string' && ownTracking(i, pr, bot, [login], store.project.repository);
        const pinned = i?.number === known ? author : marked ? trackingIssueAuthor(store, i.number, pr, bot) : undefined;
        if (pinned !== undefined) return marked && login === pinned;
        if (marked) {
            const standing = discoveredAuthor(store, 'github-issue-create', login, i.created_at);
            if (standing === 'ambiguous')
                throw new Error(`Tracking issue #${i.number} for dependency PR #${pr} was written by the operator after the App cutover; reconcile it before adoption`);
            if (standing === 'office') return true;
        }
        return central && centralCompanionIssue(i, store.project.repository, pr);
    };
    const issues = scan ? await readRepo(store, execute, 'issues?state=all&per_page=100', true) : [await readRepo(store, execute, `issues/${known}`)];
    const found = issues.filter(matches);
    if (found.length > 1)
        throw new Error(`Dependency PR #${pr} has ${found.length} tracking issues; reconcile before adoption`);
    if (!found[0] || known && found[0].number !== known) return null;
    if (found[0].state !== 'open')
        throw new Error(`Tracking issue #${found[0].number} for dependency PR #${pr} is closed; reopen it or move the PR card out of the pickup lane`);
    return receipt(found[0]);
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
    const central = pr.bot === 'pin-courier' && centralCompanionHandoff(store.project.repository);
    const effectId = central ? undefined : activeEffectId(store, `harness:${record.id}:issue:${pr.number}`);
    const prior = effectId ? store.getEffect(effectId) : undefined;
    const known = record.issue || (prior?.status === 'verified' ? (prior.receipt as TrackingIssue | null)?.number : undefined);
    if (known || !prior?.dispatchedAt) {
        const existing = await findTrackingIssue(store, execute, pr.number, known, pr.bot);
        if (existing) return existing;
        if (known) throw new Error(`Known tracking issue #${known} no longer matches; preserve it for reconciliation`);
    }
    if (!effectId)
        throw new Error(`Pin Courier PR #${pr.number} awaits its central companion issue; Office will not create a competing issue`);
    const read = () => findTrackingIssue(store, execute, pr.number, (store.getEffect(effectId)?.receipt as TrackingIssue | null)?.number, pr.bot);
    return harnessEffect(store, record, {
        key: `issue:${pr.number}`, operation: 'github-issue-create', target: issueTarget(store, pr.number, pr.bot || 'dependabot'), payload: { pr: pr.number }, guard,
        dispatch: async () => {
            const raw = await execute('gh', ['api', `repos/${store.project.repository}/issues`, '-X', 'POST', '-f', `title=${trackingIssueTitle(pr)}`, '-f', `body=${trackingIssueBody(pr)}`, '-f', 'assignees[]=JFusco'], { cwd: store.project.repo, timeout: 60000 });
            const created = raw.trim() ? JSON.parse(raw) : null;
            if (Number.isSafeInteger(created?.number) && created.number > 0 && created.html_url === `https://github.com/${store.project.repository}/issues/${created.number}`)
                return receipt(created);
            return readBackOrThrow(read, `Tracking issue for ${pr.bot || 'Dependabot'} PR #${pr.number}`);
        },
        verify: async created => {
            const found = await readBackOrThrow(() => findTrackingIssue(store, execute, pr.number, created.number, pr.bot, true),
                `Tracking issue for ${pr.bot || 'Dependabot'} PR #${pr.number}`);
            return found.nodeId === created.nodeId;
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
