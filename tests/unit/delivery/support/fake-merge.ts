import { REPOSITORY, type fakeGitHub } from './fake-github';

export const MERGE_COMMIT = 'c'.repeat(40);

/**
 * Adds a mergeable, green PR and the guarded merge itself to the synthetic GitHub: a passing
 * status on a PR's current head only, clean merge rules, the merge write and finished Actions on the merge commit.
 */
export function withFakeMerge(f: ReturnType<typeof fakeGitHub>) {
    const base = f.delivery.execute;
    f.delivery.execute = (async (program: string, args: string[], options: any = {}) => {
        const path = program === 'gh' && args[0] === 'api' ? args[1] : '';
        const status = path.match(/\/commits\/([a-f0-9]{40})\/status$/);
        if (status && f.state.prs.some(pr => pr.head.sha === status[1])) { f.state.calls.push(`${program} ${args.join(' ')}`); return JSON.stringify({ sha: status[1], state: 'success', total_count: 1, statuses: [{ state: 'success', context: 'ci/verify' }] }); }
        if (path === 'graphql' && String(JSON.parse(options.input).query).includes('pullRequest(number')) {
            f.state.calls.push(`${program} ${args.join(' ')}`);
            const pr = f.state.prs.find(p => p.number === JSON.parse(options.input).variables.number);
            return JSON.stringify({ data: { repository: { pullRequest: { headRefOid: pr.head.sha, baseRefName: pr.base.ref, mergeStateStatus: 'CLEAN', reviewDecision: null, reviewThreads: { nodes: [], pageInfo: { hasNextPage: false } } } } } });
        }
        if (path === `repos/${REPOSITORY}`) { f.state.calls.push(`${program} ${args.join(' ')}`); return JSON.stringify({ allow_merge_commit: true }); }
        // The base fixture logs board writes as a bare graphql call; name the mutation so tests can count it.
        if (path === 'graphql' && String(JSON.parse(options.input).query).startsWith('mutation')) f.state.calls.push(`board mutation ${JSON.parse(options.input).variables.option ?? 'add-card'}`);
        const merge = path.match(/\/pulls\/(\d+)\/merge$/);
        if (merge && args.includes('PUT')) {
            f.state.calls.push(`${program} ${args.join(' ')}`);
            const pr = f.state.prs.find(p => p.number === Number(merge[1]));
            Object.assign(pr, { state: 'closed', merged_at: '2026-10-31T13:00:00Z', merge_commit_sha: MERGE_COMMIT });
            f.state.runs.push({ id: 1, head_sha: MERGE_COMMIT, event: 'push', head_branch: 'main', status: 'completed', conclusion: 'success' });
            return JSON.stringify({ merged: true, sha: MERGE_COMMIT });
        }
        const output = await base(program, args, options);
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'create') f.state.prs.at(-1).mergeable = true;
        return output;
    }) as typeof base;
    return f;
}
