import type { command } from '../../workers/process';

export interface DraftCreate { repository: string; base: string; branch: string; title: string; body: string; cwd: string }

/**
 * The one explicit-head `gh pr create --draft` both delivery and maintenance send (#612): title as an argument, the
 * body on stdin, never a body file a worker could change. Returns what the command printed (the new PR's URL).
 */
export function dispatchDraftCreate(execute: typeof command, input: DraftCreate): Promise<string> {
    return execute('gh', ['pr', 'create', '--repo', input.repository, '--base', input.base, '--head', input.branch, '--draft', '--title', input.title, '--body-file', '-'],
        { cwd: input.cwd, input: input.body, timeout: 120000 });
}
