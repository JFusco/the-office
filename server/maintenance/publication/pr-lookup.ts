import { readRepo } from '../../delivery/intake/dependabot/qualify';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';

type Execute = typeof command;
export interface DraftExpectation {
    branch: string; head: string; issueUrl: string; title: string; body: string;
    /** The base the draft must target: the one an attempted create saved, otherwise the project's current target. */
    base?: string;
}
export interface VerifiedDraft { number: number; url: string; head: string; title: string; body: string; author: string }

/** Every pull request of the repository, all states and pages, whose head ref is this branch, from any repository. */
export async function branchPulls(store: Store, execute: Execute, branch: string): Promise<any[]> {
    return (await readRepo(store, execute, 'pulls?state=all&per_page=100', true) as any[]).filter(pull => pull?.head?.ref === branch);
}

/**
 * The one draft for this candidate, verified completely, or null when the branch has no pull request at all. A
 * second pull request in any state, a fork's branch of the same name, a different base, head, state, link, title or
 * body is not "no draft": it throws, so nothing is created beside it and nothing else is adopted.
 */
export async function matchingDraft(store: Store, execute: Execute, expected: DraftExpectation): Promise<VerifiedDraft | null> {
    const { repository } = store.project, target = expected.base ?? store.project.target, same = (name: unknown) => typeof name === 'string' && name.toLowerCase() === repository.toLowerCase();
    const pulls = await branchPulls(store, execute, expected.branch);
    if (!pulls.length) return null;
    if (pulls.length > 1) throw new Error(`Branch ${expected.branch} has ${pulls.length} pull requests; reconcile them before publication`);
    const [pull] = pulls;
    if (!same(pull.head?.repo?.full_name) || !same(pull.base?.repo?.full_name)) throw new Error(`PR #${pull.number} is from another repository's ${expected.branch}; reconcile before publication`);
    if (pull.base?.ref !== target || pull.head?.sha !== expected.head || pull.state !== 'open' || pull.draft !== true)
        throw new Error(`PR #${pull.number} is not the open draft of the reviewed head on ${target}; reconcile before publication`);
    if (!Number.isSafeInteger(pull.number) || pull.html_url !== `https://github.com/${repository}/pull/${pull.number}`) throw new Error(`PR #${pull.number} has no canonical URL`);
    const view = JSON.parse(await execute('gh', ['pr', 'view', String(pull.number), '--repo', repository, '--json', 'number,url,closingIssuesReferences,title,body,headRefOid,isDraft'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (view.number !== pull.number || view.url !== pull.html_url || view.headRefOid !== expected.head || view.isDraft !== true || !Array.isArray(view.closingIssuesReferences))
        throw new Error(`PR #${pull.number} could not be read back exactly`);
    if (!view.closingIssuesReferences.some((issue: any) => issue?.url === expected.issueUrl)) throw new Error(`PR #${pull.number} does not natively close ${expected.issueUrl}`);
    if (view.title !== expected.title || view.body !== expected.body || pull.title !== expected.title || (pull.body || '') !== expected.body)
        throw new Error(`PR #${pull.number} does not carry the approved title and body`);
    return { number: pull.number, url: pull.html_url, head: expected.head, title: view.title, body: view.body, author: String(pull.user?.login || '') };
}
