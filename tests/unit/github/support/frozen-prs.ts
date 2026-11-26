import { H20, H21, H22, H30, O22 } from './pull-fixtures';

/**
 * The monitor's rows for the paired fixtures, as the REST projection produced them before the GraphQL inventory
 * (the pre-change `GitHubMonitor` at 08900b7, whose projection `restPR` keeps). Complete and ordered: equality is checked.
 */
const run = (name: string, status: string, conclusion: string, url: string, sha: string) => ({ name, status, conclusion, url, sha });
export const FROZEN_GOLDEN = [
    { linkedIssues: [11], number: 22, title: 'chore(deps): bump eslint', state: 'open', draft: false, author: 'dependabot[bot]', head: H22, base: 'main', url: 'https://github.com/JFusco/brain/pull/22', mergedAt: '', mergeable: null,
        description: 'Closes #11\n\nBumps eslint. Bearer [redacted]', descriptionTruncated: false,
        reviews: [{ author: 'copilot-pull-request-reviewer[bot]', state: 'COMMENTED', commit: O22 }, { author: 'JFusco', state: 'APPROVED', commit: H22 }],
        checks: [run('build', 'completed', 'success', 'https://github.com/JFusco/brain/actions/runs/220/job/2201', H22), run('deploy/preview', 'completed', 'success', '', H22)] },
    { linkedIssues: [11], number: 21, title: 'Draft parser rewrite', state: 'open', draft: true, author: 'JFusco', head: H21, base: 'main', url: 'https://github.com/JFusco/brain/pull/21', mergedAt: '', mergeable: false,
        description: 'Fixes #11', descriptionTruncated: false, reviews: [], checks: [run('test', 'queued', '', 'https://github.com/JFusco/brain/actions/runs/210/job/2101', H21)] },
    { linkedIssues: [11], number: 20, title: 'Child of #19', state: 'open', draft: false, author: 'JFusco', head: H20, base: 'codex/19-parent', url: 'https://github.com/JFusco/brain/pull/20', mergedAt: '', mergeable: true,
        description: `${'Parent work. '.repeat(630)}Pa`, descriptionTruncated: true, reviews: [], checks: [] },
];
const lint = Array.from({ length: 9 }, (_, i) => 8 - i).map(i => run(`lint-${i}`, 'completed', 'success', `https://github.com/JFusco/brain/actions/runs/399/job/${2900 + i}`, H30));
/**
 * #30's rows on each refresh, in REST's order (descending run ID): A1 and B, then the rerun A2 and B with the newer
 * same-name status, then conflicting after a base move.
 */
export const frozenRerun = (refresh: 1 | 2 | 3) => [{ linkedIssues: [], number: 30, title: 'Rerun fixture', state: 'open', draft: false, author: 'JFusco', head: H30, base: 'main', url: 'https://github.com/JFusco/brain/pull/30', mergedAt: '',
    mergeable: refresh !== 3, description: '', descriptionTruncated: false, reviews: [],
    checks: refresh === 1
        ? [run('test', 'completed', 'success', 'https://github.com/JFusco/brain/actions/runs/301/job/3002', H30), run('test', 'completed', 'failure', 'https://github.com/JFusco/brain/actions/runs/300/job/3001', H30), ...lint, run('test', 'pending', 'pending', 'https://ci.example.test/s/1', H30)]
        : [run('test', 'completed', 'success', 'https://github.com/JFusco/brain/actions/runs/300/job/3003', H30), run('test', 'completed', 'success', 'https://github.com/JFusco/brain/actions/runs/301/job/3002', H30), ...lint, run('test', 'completed', 'success', 'https://ci.example.test/s/2', H30)] }];
