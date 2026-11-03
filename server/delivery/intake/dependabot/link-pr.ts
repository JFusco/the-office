import { harnessEffect } from '../../harness/effect';
import { readBackOrThrow } from '../../harness/read-retry';
import { readRepo, type DependabotPR } from './qualify';
import type { Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';

export function closesIssue(body: string, issue: number): boolean {
    return new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${issue}(?![0-9])`, 'i').test(body);
}

/** Dependabot's own text is kept; only the closing reference the Office pipeline links on is appended. */
export function linkedBody(body: string, issue: number): string {
    return `${body.trimEnd()}\n\nCloses #${issue}\n`;
}

/** Links the PR to its tracking issue. Keyed by head, so a Dependabot rebase that rewrites the body is re-linked once. */
export async function linkPR(store: Store, execute: Execute, record: { id: string }, pr: DependabotPR, issue: number, guard: () => void | Promise<void>): Promise<void> {
    const linked = async () => {
        const p = await readRepo(store, execute, `pulls/${pr.number}`);
        return closesIssue(p.body || '', issue) ? { head: p.head?.sha as string } : null;
    };
    const body = linkedBody(pr.body, issue);
    // GitHub rejects bodies over 65,536 characters; grouped Dependabot bodies can be near that limit.
    if (body.length > 65_000)
        throw new Error(`PR #${pr.number} body is too long to add "Closes #${issue}"; link it manually`);
    await harnessEffect(store, record, {
        key: `pr-body:${pr.number}:${pr.head}`, operation: 'github-pr-body', target: pr.url, payload: { issue }, guard,
        dispatch: async () => {
            await execute('gh', ['api', `repos/${store.project.repository}/pulls/${pr.number}`, '-X', 'PATCH', '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 });
            return readBackOrThrow(linked, `Closes #${issue} on PR #${pr.number}`);
        },
        readBack: linked,
    });
}
