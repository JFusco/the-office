/** `gh api` flags that take the next argument as their value. */
const VALUE_FLAGS = new Set(['-X', '--method', '-f', '--raw-field', '-F', '--field', '-H', '--header', '--input', '-q', '--jq', '-t', '--template', '--hostname', '-p', '--preview', '--cache']);
/** High-level commands hide how many requests they make. */
const OPAQUE: Record<string, string> = { pr: 'gh-pr', issue: 'gh-issue', auth: 'gh-auth', run: 'gh-run' };

/** The shape of one `gh` invocation, as fixed labels: no path, number, ref, query or field value is kept. */
export type GitHubCall = { family: string; api: boolean; paginate: boolean; slurp: boolean; include: boolean };

function repositoryFamily([head, id, sub, ...more]: string[]): string {
    switch (head) {
        case undefined: return 'repository';
        case 'issues': return id === 'comments' || sub === 'comments' ? 'issue-comments' : sub ? 'issue-other' : id ? 'issue' : 'issues';
        case 'pulls': return sub === 'reviews' ? 'pull-reviews' : sub === 'merge' ? 'pull-merge' : sub ? 'pull-other' : id ? 'pull' : 'pulls';
        case 'commits': return sub === 'check-runs' ? 'check-runs' : sub === 'status' || sub === 'statuses' ? 'statuses' : 'commits';
        case 'check-runs': return 'check-runs';
        case 'actions':
            if (id === 'workflows') return more[0] === 'runs' ? 'workflow-runs' : 'workflows';
            if (id === 'jobs') return 'actions-jobs';
            if (id !== 'runs') return 'actions-other';
            return [sub, ...more].includes('rerun-failed-jobs') ? 'actions-rerun' : [sub, ...more].includes('jobs') ? 'actions-jobs' : sub ? 'actions-run' : 'actions-runs';
        case 'git': return id === 'refs' ? 'git-refs' : 'git-other';
        case 'dependabot': return id === 'alerts' ? 'dependabot-alerts' : 'repository-other';
        case 'branches': case 'compare': case 'rulesets': return head;
        default: return 'repository-other';
    }
}
/** The endpoint a `gh api` call names: its first positional argument. */
function endpoint(args: readonly string[]): string {
    for (let i = 1; i < args.length; i++) {
        if (!args[i].startsWith('-')) return args[i];
        if (VALUE_FLAGS.has(args[i])) i++;
    }
    return '';
}
/** Classify a `gh` invocation by its arguments. Direct `gh api graphql` is its own family. */
export function githubCall(args: readonly string[]): GitHubCall {
    const flags = new Set(args);
    if (args[0] !== 'api') return { family: OPAQUE[args[0]] ?? 'gh-other', api: false, paginate: false, slurp: false, include: false };
    const segments = endpoint(args).replace(/^\//, '').split(/[?#]/)[0].split('/').filter(Boolean);
    const family = segments[0] === 'graphql' && segments.length === 1 ? 'graphql' : segments[0] === 'rate_limit' ? 'rate-limit'
        : segments[0] === 'users' || segments[0] === 'user' ? 'users' : segments[0] === 'repos' && segments.length >= 3 ? repositoryFamily(segments.slice(3)) : 'api-other';
    return { family, api: true, paginate: flags.has('--paginate'), slurp: flags.has('--slurp'), include: flags.has('-i') || flags.has('--include') };
}
