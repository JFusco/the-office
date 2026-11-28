import { expect, test } from 'vitest';
import { maintenanceCandidate } from '../../../../server/delivery/candidate/maintenance-candidate';

const REPO = '/work/cms-field-vocabulary', BRANCH = 'codex/173-saas-rich-text-media', WORKTREE = '/work/cms-field-vocabulary-worktrees/173-saas-rich-text-media';
const candidate = (extra: Record<string, unknown> = {}) => ({ issue: 173, worktree: WORKTREE, branch: BRANCH, head: 'a'.repeat(40), summary: '', ...extra });
const step = (stage: string, candidates: unknown[], extra: Record<string, unknown> = {}) => ({ role: 'developer', stage, result: { outcome: 'passed', summary: '', receipts: [{ id: 'pr', action: 'draft-pr', target: '', verified: true, uncertain: false, detail: '' }], candidates, ...extra } });
const store = (runs: unknown[]) => ({ project: { repo: REPO, repository: 'JFusco/cms-field-vocabulary' }, state: { maintenance: { runs } } }) as any;
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
    ['the draft-pr step has no receipt', [run([step('draft-pr', [candidate()], { receipts: [] })])]],
    ['a draft-pr receipt is uncertain', [run([step('draft-pr', [candidate()], { receipts: [{ id: 'pr', action: 'draft-pr', target: '', verified: true, uncertain: true, detail: '' }] })])]],
    ['a draft-pr receipt is unverified', [run([step('draft-pr', [candidate()], { receipts: [{ id: 'pr', action: 'draft-pr', target: '', verified: false, uncertain: false, detail: '' }] })])]],
    ['the step names another issue', [run([step('draft-pr', [candidate({ issue: 174 })])])]],
    ['the step names another branch', [run([step('draft-pr', [candidate({ branch: 'codex/173-other' })])])]],
    ['the worktree is not the Office path for the branch', [run([step('draft-pr', [candidate({ worktree: '/work/elsewhere/173-saas-rich-text-media' })])])]],
    ['the step names no worktree', [run([step('draft-pr', [candidate({ worktree: '' })])])]],
    ['the job is on a branch that is not this issue\'s', [run([step('draft-pr', [candidate({ branch: 'feature/human', worktree: '/work/cms-field-vocabulary-worktrees/human' })])])], { key: 'GH-173', branch: 'feature/human' }],
    ['the job key is not a GitHub issue', [run([step('draft-pr', [candidate()])])], { key: 'CEC-173', branch: BRANCH }],
])('nothing is owned when %s', (_name, runs, other) => {
    expect(maintenanceCandidate(store(runs), other || job)).toBe('');
});

const RECORD = { version: 1 as const, proposalStep: 0, issue: 173, issueUrl: 'https://github.com/JFusco/cms-field-vocabulary/issues/173', pr: 9, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/9',
    branch: BRANCH, head: 'a'.repeat(40), worktree: WORKTREE, issueEffect: 'maintenance:run:k:issue-create', pushEffect: 'maintenance:run:k:push:a', prEffect: 'maintenance:run:k:pr-create:a', linkEffect: 'maintenance:run:k:link', at: '2026-11-28T00:00:00Z' };
/** A completed versioned run (#612) whose proposal step 0 built the candidate, with this completion record. */
const versionedRun = (record: Record<string, unknown>, status = 'completed') => {
    const draft = step('draft-pr', [candidate()], { receipts: [] }), proposal = step('proposal', [candidate()]);
    (draft as any).publicationVersion = 1; (proposal as any).publicationVersion = 1;
    return { ...run([proposal, draft], status), publication: { version: 1, evidence: [], candidates: [{ index: 0, key: 'k', proposalStep: 0, completed: record }] } };
};

test('a versioned group (#612) owns its candidate only through its complete completion record; a content-only draft step does not', () => {
    const versioned = step('draft-pr', [candidate()], { receipts: [] });
    (versioned as any).publicationVersion = 1;
    expect(maintenanceCandidate(store([run([step('proposal', [candidate()]), versioned])]), job)).toBe('');
    expect(maintenanceCandidate(store([versionedRun(RECORD)]), job)).toBe(WORKTREE);
    expect(maintenanceCandidate(store([versionedRun(RECORD, 'blocked')]), job)).toBe('');
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, branch: 'codex/173-other' })]), job)).toBe('');
});

test.each(['issueEffect', 'pushEffect', 'prEffect', 'linkEffect', 'issueUrl', 'prUrl', 'at'])('a versioned completion record missing %s authorizes no cleanup', field => {
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, [field]: '' })]), job)).toBe('');
});

test('a versioned record must name the canonical issue and PR, a positive PR number and the saved proposal binding', () => {
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, issueUrl: 'https://github.com/someone/else/issues/173' })]), job)).toBe('');
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, pr: 0, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/0' })]), job)).toBe('');
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, proposalStep: 1 })]), job)).toBe('');
    expect(maintenanceCandidate(store([versionedRun({ ...RECORD, head: 'b'.repeat(40) })]), job)).toBe('');
});
