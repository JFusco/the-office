import { expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { CEC, DATA } from '../../../server/office/config';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import type { StageResult } from '../../../src/shared';

export const OLD = 'a'.repeat(40), NEW = 'b'.repeat(40);
/** A passing stage result with nothing left open. */
export const passed = (extra: Partial<StageResult> = {}): StageResult => decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, prId: 0, ...extra });
export const draft = (extra: Partial<StageResult> = {}): StageResult => decision('', { outcome: 'passed', resolution: null, blocker: '', paidRuns: 0, summary: 'Brought the branch up to date and opened a draft pull request.', commit: NEW, prId: 4242,
    receipts: [{ id: 'push', action: 'git-push', target: 'origin', verified: true, uncertain: false, detail: 'Read back' }, { id: 'pr', action: 'draft-pr', target: 'https://example.test/pullrequest/4242', verified: true, uncertain: false, detail: 'Read back' }], ...extra });
/** Git as the worktree stands after the developer merged the target into the branch. */
export const git = (state: { head?: string; contains?: boolean; fail?: boolean } = {}) => async (program: string, args: string[], options: any) => {
    expect([program, options.readOnly, options.cwd]).toEqual(['git', true, '/worktree']);
    if (state.fail) throw new Error('git unavailable');
    if (args[0] === 'rev-parse') return `${state.head ?? NEW}\n`;
    if (args[0] === 'merge-base') { expect(args.slice(0, 2)).toEqual(['merge-base', '--is-ancestor']); if (state.contains === false) throw new Error('git exited 1'); return ''; }
    throw new Error(`Unexpected git ${args.join(' ')}`);
};
export const saved = (runId: string, id: string, kind: string, commit: string) => {
    const root = resolve(DATA, 'runs', runId), path = resolve(root, `${id}.md`);
    mkdirSync(root, { recursive: true }); writeFileSync(path, id);
    return { id, kind, summary: id, path, commit, environment: 'unit', url: '', observedAt: '' } as any;
};

/** A stopped ticket: the draft result is recorded on the merged head, the ticket is blocked at draft-pr and has no pull request number yet. */
export function stopped() {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'draft-pr' as const, activity: 'blocked' as const, blocker: 'Evidence does not match the current candidate commit', commit: OLD, prId: 0, worktree: '/worktree',
        approach: { plan: 'none', review: 'full', validation: 'independent-checks', checks: ['Focused checks'], reason: 'Unit route' } as any };
    t.results['draft-pr'] = draft();
    store.state.tickets = [t];
    const engine = new Engine(store), worktree = git();
    engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? worktree(program, args, options) : jira.execute(program, args, options)) as any);
    engine.agents.transition = async (_ticket, target) => { jira.state[t.key].status = target;
        return { ...decision(''), outcome: 'passed', resolution: null, blocker: '', summary: `Moved to ${target}`, receipts: [{ id: 'status', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic read-back' }] }; };
    store.begin(t, 'draft-pr');
    return { store, jira, engine, t };
}
export const readback = (existingPrId: number) => async (key: string) => ({ key, assignee: CEC.account, subtask: false, boardMember: true, status: 'QA', statusId: '', updated: '', existingPrId, existingOwner: '', blocker: '' });

