import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { command } from '../../workers/process';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;
export interface PRContent { title: string; body: string; source: 'developer' | 'office' }

/** Alex writes `pr.json` ({title, body}) in the job's artifact directory; that is the model's half of the handoff. */
export function developerPRContent(root: string): PRContent | null {
    const path = resolve(root, 'pr.json');
    if (!existsSync(path)) return null;
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    if (typeof raw?.title !== 'string' || typeof raw?.body !== 'string' || !raw.title.trim() || !raw.body.trim())
        throw new Error('pr.json must contain a nonblank title and body');
    return { title: raw.title.trim(), body: raw.body, source: 'developer' };
}

/** Fallback built only from recorded delivery evidence when the developer did not supply PR content. */
export function officePRContent(job: TicketJob, issueNumber: number, subject: string): PRContent {
    const implemented = job.steps.filter(step => ['implement', 'scope-repair', 'update-base'].includes(step.stage) && step.result.outcome === 'passed').at(-1)?.result;
    const verified = job.steps.filter(step => ['review', 'validate'].includes(step.stage) && step.result.outcome === 'passed' && step.result.commit === job.head);
    const checks = [...new Set([...(job.approach?.checks || []), ...(implemented?.evidence || []).filter(e => e.kind === 'checks').map(e => e.summary)])];
    // Tick a checklist item only when recorded evidence supports it; the repository lint then decides.
    const evidenced = (pattern: RegExp) => checks.some(check => pattern.test(check));
    const reviewed = verified.some(step => step.stage === 'review');
    const tick = (ok: boolean, text: string) => `- [${ok ? 'x' : ' '}] ${text}`;
    const body = [
        '## Summary', '', implemented?.summary || subject, '',
        '## Linked issue', '', `Closes #${issueNumber}`, '',
        '## Changes', '', `- ${implemented?.summary || subject}`, '',
        '## Verification', '', ...(checks.length ? checks.map(check => `- ${check}`) : ['- Required repository checks recorded by the Office delivery.']),
        ...verified.map(step => `- ${step.stage === 'review' ? 'Independent review' : 'Independent validation'} passed on ${job.head.slice(0, 7)}.`), '',
        '## Risk and rollback', '', '- Risk: Scoped to the linked issue; independent review and checks are recorded by the Office delivery.', '- Rollback: Revert this pull request.', '',
        '## Checklist', '',
        tick(!!implemented && (reviewed || verified.length > 0), 'Scope matches the linked issue.'), tick(evidenced(/\btests?\b|verify:ci/i), 'Tests and documentation are updated.'), tick(evidenced(/wiki/i), 'Wiki records are updated for substantive work.'),
        tick(reviewed, 'No secrets, generated local artifacts, or unrelated changes are included.'), tick(evidenced(/verify:ci/i), '`pnpm run verify:ci` passes.'), '',
    ].join('\n');
    return { title: subject, body, source: 'office' };
}

export async function prContent(execute: Execute, job: TicketJob, issueNumber: number, root: string): Promise<PRContent> {
    const developer = developerPRContent(root);
    if (developer) return developer;
    const subject = (await execute('git', ['log', '-1', '--format=%s', job.head], { cwd: job.worktree, timeout: 30000, readOnly: true })).trim();
    return officePRContent(job, issueNumber, subject);
}

/** Runs the repository's own PR body/title linters when it defines them, so CI does not reject the PR. */
export async function lintPRContent(execute: Execute, worktree: string, content: PRContent, issueNumber: number): Promise<void> {
    if (!new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${issueNumber}(?![0-9])`, 'i').test(content.body))
        throw new Error(`PR body needs a native closing reference to this issue: "Closes #${issueNumber}"`);
    const others = [...content.body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map(match => Number(match[1])).filter(number => number !== issueNumber);
    if (others.length)
        throw new Error(`PR body would also close unrelated issue(s) ${others.map(n => `#${n}`).join(', ')}`);
    const pkg = existsSync(resolve(worktree, 'package.json')) ? JSON.parse(readFileSync(resolve(worktree, 'package.json'), 'utf8')) : {};
    if (pkg.scripts?.['lint:pr'])
        await execute('pnpm', ['run', '--silent', 'lint:pr'], { cwd: worktree, input: content.body, timeout: 120000, readOnly: true });
    if (existsSync(resolve(worktree, 'commitlint.config.cjs')))
        await execute('pnpm', ['exec', 'commitlint', '--config', 'commitlint.config.cjs'], { cwd: worktree, input: `${content.title}\n`, timeout: 120000, readOnly: true });
}
