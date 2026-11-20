import { expect, test } from 'vitest';
import { maintenanceCandidate } from '../../../../server/delivery/candidate/maintenance-candidate';

const REPO = '/work/cms-field-vocabulary', BRANCH = 'codex/173-saas-rich-text-media', WORKTREE = '/work/cms-field-vocabulary-worktrees/173-saas-rich-text-media';
const candidate = (extra: Record<string, unknown> = {}) => ({ issue: 173, worktree: WORKTREE, branch: BRANCH, head: 'a'.repeat(40), summary: '', ...extra });
const step = (stage: string, candidates: unknown[], extra: Record<string, unknown> = {}) => ({ role: 'developer', stage, result: { outcome: 'passed', summary: '', receipts: [{ id: 'pr', action: 'draft-pr', target: '', verified: true, uncertain: false, detail: '' }], candidates, ...extra } });
const store = (runs: unknown[]) => ({ project: { repo: REPO }, state: { maintenance: { runs } } }) as any;
const run = (steps: unknown[], status = 'completed') => ({ id: 'run', status, steps });
const job = { key: 'GH-173', branch: BRANCH };

test('a completed run whose draft-pr step names this issue, this branch and the Office path for it owns the candidate', () => {
    expect(maintenanceCandidate(store([run([step('proposal', [candidate()]), step('draft-pr', [candidate({ head: 'b'.repeat(40) })])])]), job)).toBe(WORKTREE);
});

test.each<[string, unknown[], { key: string; branch: string }?]>([
    ['there is no maintenance run', []],
    ['the run did not complete', [run([step('draft-pr', [candidate()])], 'blocked')]],
    ['the run built the candidate but never published a draft', [run([step('proposal', [candidate()]), step('proposal-review', [candidate()])])]],
    ['the draft-pr step did not pass', [run([step('draft-pr', [candidate()], { outcome: 'blocked' })])]],
    ['a draft-pr receipt is unverified', [run([step('draft-pr', [candidate()], { receipts: [{ id: 'pr', action: 'draft-pr', target: '', verified: false, uncertain: true, detail: '' }] })])]],
    ['the step names another issue', [run([step('draft-pr', [candidate({ issue: 174 })])])]],
    ['the step names another branch', [run([step('draft-pr', [candidate({ branch: 'codex/173-other' })])])]],
    ['the worktree is not the Office path for the branch', [run([step('draft-pr', [candidate({ worktree: '/work/elsewhere/173-saas-rich-text-media' })])])]],
    ['the step names no worktree', [run([step('draft-pr', [candidate({ worktree: '' })])])]],
    ['the job is on a branch that is not this issue\'s', [run([step('draft-pr', [candidate({ branch: 'feature/human', worktree: '/work/cms-field-vocabulary-worktrees/human' })])])], { key: 'GH-173', branch: 'feature/human' }],
    ['the job key is not a GitHub issue', [run([step('draft-pr', [candidate()])])], { key: 'CEC-173', branch: BRANCH }],
])('nothing is owned when %s', (_name, runs, other) => {
    expect(maintenanceCandidate(store(runs), other || job)).toBe('');
});
