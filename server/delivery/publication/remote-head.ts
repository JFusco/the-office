import type { command } from '../../workers/process';

type Candidate = Readonly<{ branch: string; worktree: string }>;
const list = (execute: typeof command, candidate: Candidate) =>
    execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${candidate.branch}`], { cwd: candidate.worktree, timeout: 60000, readOnly: true });

/** The published tip of the candidate's branch on origin, or '' when unpublished: delivery's original read. */
export async function remoteHead(execute: typeof command, candidate: Candidate): Promise<string> {
    const line = (await list(execute, candidate)).trim();
    return line ? line.split(/\s+/)[0] : '';
}

/** The same read, exactly by the full ref name: a ref that only ends with the pattern is never taken for it (#612). */
export async function exactRemoteHead(execute: typeof command, candidate: Candidate): Promise<string> {
    const ref = `refs/heads/${candidate.branch}`;
    const exact = (await list(execute, candidate)).split('\n').filter(Boolean).map(line => line.split(/\s+/)).filter(([, name]) => name === ref);
    if (exact.length > 1) throw new Error(`Remote ref ${ref} was listed twice; reconcile before publication`);
    if (exact[0] && !/^[a-f0-9]{40}$/.test(exact[0][0])) throw new Error(`Remote ref ${ref} could not be read exactly`);
    return exact[0]?.[0] ?? '';
}
