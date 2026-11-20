import type { command } from '../../../server/workers/process';

export const REPO = 'JFusco/the-office';
export const SHA = (digit: string) => digit.repeat(40);

/** A fake `gh`: answers by the arguments it was given, records every call, and refuses anything else. */
export function fakeGitHub(answers: Record<string, unknown>) {
    const calls: string[] = [];
    const execute = (async (program: string, args: string[], options?: { readOnly?: boolean }) => {
        const key = args.join(' ');
        calls.push(key);
        if (program !== 'gh' || !options?.readOnly) throw new Error(`unexpected command: ${program} ${key}`);
        if (!(key in answers)) throw new Error(`gh: not found (${key})`);
        return JSON.stringify(answers[key]);
    }) as unknown as typeof command;
    return { execute, calls };
}

export const issueCall = (number: number) => `issue view ${number} --repo ${REPO} --json number,url`;
export const commitCall = (sha: string) => `api repos/${REPO}/commits/${sha}`;
export const historyCall = (commit: string, ref: string) => `api repos/${REPO}/compare/${commit}...${ref}`;
export const compareCall = (sha: string) => historyCall(sha, 'main');
export const pullCall = (number: number) => `pr view ${number} --repo ${REPO} --json number,url,state,headRefOid,mergeCommit`;
export const pull = (number: number, over: Record<string, unknown> = {}) => ({ number, url: `https://github.com/${REPO}/pull/${number}`, state: 'OPEN', headRefOid: SHA('a'), mergeCommit: null, ...over });
