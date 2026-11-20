import { harnessEffect } from '../../harness/effect';
import { readBackOrThrow } from '../../harness/read-retry';
import { cardStatus, projectCards, projectGraphql, setCardStatus, statusField, type Execute } from '../../board/project-graphql';
import { readRepo } from './qualify';
import type { DependabotAlert } from './alerts';
import type { Store } from '../../../store/store';

export interface AlertIssue { number: number; nodeId: string; url: string; open: boolean }
type Guard = () => void | Promise<void>;

/** Hidden marker that ties exactly one issue to a Dependabot alert, whoever filed it. */
export const alertMarker = (alert: number) => `<!-- office-dependabot-alert:${alert} -->`;

export const alertIssueTitle = (alert: DependabotAlert) => `[Bug] Resolve Dependabot alert #${alert.number}: ${alert.package}`;

export function alertIssueBody(alert: DependabotAlert): string {
    return [
        '## Summary', '', `Dependabot alert #${alert.number} (${alert.advisory || 'no advisory id'}, ${alert.severity}) is open for \`${alert.package}\`${alert.summary ? `: ${alert.summary}` : ''}. Dependabot has not opened a pull request for it.`, '',
        '## Context', '', `\`${alert.package}\` is a ${alert.relationship} ${alert.ecosystem} dependency in \`${alert.manifest || 'the manifest'}\`. Vulnerable range: \`${alert.range || 'not stated'}\`. First fixed version: \`${alert.fixed || 'none published'}\`. A day without a Dependabot pull request usually means no fixed version installs under the current dependency ranges.`, '',
        '## Details', '', '- Find which packages require the vulnerable version.', '- Resolve it the smallest way that works: update the parent package, or add a package-manager override to the first fixed version.', '- Refresh the lockfile and run the repository\'s full checks.', '',
        '## Expected Outcome', '', 'No vulnerable version remains installed and the alert closes after merge.', '',
        '**Acceptance Criteria**', '', `- The lockfile holds no \`${alert.package}\` in the vulnerable range.`, '- The repository\'s required checks pass.', '- If no change passes the checks, ship nothing: report the failure here with its error and leave the alert open.', '',
        '## Additional Notes', '', `${alert.url ? `Alert: ${alert.url}. ` : ''}Opened by the Office because the alert had no pull request after a day.`, '',
        alertMarker(alert.number), '',
    ].join('\n');
}

/** Every issue Joe's login filed, open or closed: where an alert's issue is looked for. Read once per poll. */
export const listOwnIssues = (store: Store, execute: Execute): Promise<any[]> => readRepo(store, execute, 'issues?state=all&creator=JFusco&per_page=100', true);

/** The one issue carrying this alert's marker, open or closed. More than one is a person's to untangle. */
export async function findAlertIssue(store: Store, execute: Execute, alert: number, known = 0, listed?: () => Promise<any[]>): Promise<AlertIssue | null> {
    // The marker on a line of its own: an issue that only quotes it in a sentence is not the alert's issue.
    const marked = (i: any) => !i.pull_request && String(i.body || '').split(/\r?\n/).some(line => line.trim() === alertMarker(alert));
    const found = known ? [await readRepo(store, execute, `issues/${known}`)].filter(marked) : (await (listed ? listed() : listOwnIssues(store, execute))).filter(marked);
    if (found.length > 1) throw new Error(`Dependabot alert #${alert} has ${found.length} issues; reconcile them`);
    return found.length ? { number: found[0].number, nodeId: found[0].node_id, url: found[0].html_url, open: found[0].state === 'open' } : null;
}

/** Creates the one issue for the alert, assigned to Joe, or returns the one that exists. Never creates twice. */
export async function ensureAlertIssue(store: Store, execute: Execute, record: { id: string; issue: number }, alert: DependabotAlert, guard: Guard, listed?: () => Promise<any[]>): Promise<AlertIssue> {
    const existing = await findAlertIssue(store, execute, alert.number, record.issue, listed);
    if (existing) return existing;
    if (record.issue) throw new Error(`Known issue #${record.issue} for Dependabot alert #${alert.number} no longer carries its marker; preserve it for reconciliation`);
    const read = () => findAlertIssue(store, execute, alert.number);
    return harnessEffect(store, record, {
        key: 'issue', operation: 'github-issue-create', target: `${store.project.repository}#dependabot-alert-${alert.number}`, payload: { alert: alert.number }, guard,
        dispatch: async () => {
            await execute('gh', ['api', `repos/${store.project.repository}/issues`, '-X', 'POST', '-f', `title=${alertIssueTitle(alert)}`, '-f', `body=${alertIssueBody(alert)}`, '-f', 'assignees[]=JFusco'], { cwd: store.project.repo, timeout: 60000 });
            return readBackOrThrow(read, `Issue for Dependabot alert #${alert.number}`);
        },
        readBack: read,
    });
}

/**
 * Puts the issue's card in the pickup lane so the Office works it like any other ticket. Only a card
 * that is absent or still in Backlog is moved; any other lane is a person's or the harness's own choice.
 */
export async function ensurePickupCard(store: Store, execute: Execute, record: { id: string }, issue: AlertIssue, pickupLane: string, guard: Guard): Promise<void> {
    if (!store.project.githubProject) return;
    const field = await statusField(store, execute), lanes = field.options.filter(o => o.name.trim().toLowerCase() === pickupLane.trim().toLowerCase());
    if (lanes.length !== 1) throw new Error(`Project board needs exactly one "${pickupLane}" Status option; found ${lanes.length}`);
    const option = lanes[0];
    const card = async () => (await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: issue.number }]))[0] || null;
    const item = await card() ?? await harnessEffect(store, record, {
        key: `card:${issue.number}`, operation: 'github-project-add', target: `${field.projectId}:issue-${issue.number}`, payload: { issue: issue.number }, guard,
        dispatch: async () => {
            await projectGraphql(store, execute, 'mutation($project:ID!,$content:ID!){addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}', { project: field.projectId, content: issue.nodeId }, false);
            return readBackOrThrow(card, `Board card for #${issue.number}`);
        },
        readBack: card,
    });
    const current = await cardStatus(store, execute, item.id, field.fieldId), lane = field.options.find(o => o.id === current)?.name.trim().toLowerCase() || '';
    if (current === option.id || lane && lane !== 'backlog') return;
    const inLane = async () => await cardStatus(store, execute, item.id, field.fieldId) === option.id ? { lane: option.name } : null;
    await harnessEffect(store, record, {
        key: `card-status:${item.id}`, operation: 'github-project-status', target: item.id, payload: { lane: option.name }, guard,
        dispatch: async () => { await setCardStatus(store, execute, field.projectId, item.id, field.fieldId, option.id); return readBackOrThrow(inLane, `${option.name} lane for issue #${issue.number}`); },
        readBack: inLane,
    });
}

/**
 * Says why and closes the issue of an alert that is no longer open. Two writes, each read back.
 * `state` is the alert's own current state, read just before: `fixed` closes as completed, anything
 * else (dismissed, auto_dismissed) as not planned.
 */
export async function closeAlertIssue(store: Store, execute: Execute, record: { id: string }, issue: number, alert: number, state: string, guard: Guard): Promise<void> {
    const fixed = state === 'fixed', note = `Dependabot alert #${alert} is now ${state.replace(/_/g, ' ')}, so there is nothing left to resolve here.\n\n<!-- office-dependabot-alert-closed:${alert} -->`;
    const commented = async () => (await readRepo(store, execute, `issues/${issue}/comments?per_page=100`, true)).some((c: any) => String(c.body || '').includes(`office-dependabot-alert-closed:${alert}`)) ? { commented: true } : null;
    if (!await commented()) await harnessEffect(store, record, {
        key: 'close-comment', operation: 'github-issue-comment', target: `${store.project.repository}#${issue}`, payload: { alert }, guard,
        dispatch: async () => { await execute('gh', ['api', `repos/${store.project.repository}/issues/${issue}/comments`, '-X', 'POST', '-f', `body=${note}`], { cwd: store.project.repo, timeout: 60000 }); return readBackOrThrow(commented, `Closing note on #${issue}`); },
        readBack: commented,
    });
    const closed = async () => (await readRepo(store, execute, `issues/${issue}`)).state === 'closed' ? { closed: true } : null;
    await harnessEffect(store, record, {
        key: 'close', operation: 'github-issue-close', target: `${store.project.repository}#${issue}`, payload: { alert }, guard,
        dispatch: async () => { await execute('gh', ['api', `repos/${store.project.repository}/issues/${issue}`, '-X', 'PATCH', '-f', 'state=closed', '-f', `state_reason=${fixed ? 'completed' : 'not_planned'}`], { cwd: store.project.repo, timeout: 60000 }); return readBackOrThrow(closed, `Closed state of #${issue}`); },
        readBack: closed,
    });
}
