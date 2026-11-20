import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Engine } from '../../../../server/scheduling/engine';
import { JiraOperations } from '../../../../server/cec/jira-operations';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { GATE_REFUSED, gateRefusedPass } from '../../../../server/cec/qa/gate-refused-pass';
import { saveQAReport } from '../../../../server/qa/save-report';
import { fakeJira } from '../parking/fake-jira';
import { ticket } from '../parking/fixtures';
import type { StageResult, Ticket, WorkApproach } from '../../../../src/shared';

const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const HEAD = 'a'.repeat(40), REFUSAL = `${GATE_REFUSED}Real browser, actor, resource and screenshot evidence is required`;
const approach: WorkApproach = { plan: 'none', review: 'focused', validation: 'browser', checks: ['Required acceptance'], reason: 'Unit only' };

/** A browser retest that passed and whose saved report is on disk, recorded on the ticket as the gate's refusal. */
function refused(observedUrl = 'http://127.0.0.1:3000/projects/p1') {
    const dataRoot = mkdtempSync(resolve(tmpdir(), 'office-gate-refused-')); roots.push(dataRoot);
    const store = new Store(':memory:', projectById('cec'), dataRoot); stores.push(store);
    const t: Ticket = { ...ticket('QA'), stage: 'retest', activity: 'blocked', blocker: REFUSAL, approach };
    const root = resolve(dataRoot, 'runs', t.runId), qaRunDir = resolve(root, 'office-qa', 'retest-1');
    mkdirSync(root, { recursive: true });
    const file = resolve(root, 'evidence.txt'); writeFileSync(file, 'Synthetic evidence');
    const item = (id: string, kind: string, url = '') => ({ id, kind, commit: HEAD, path: file, url, environment: 'unit', summary: 'Synthetic', observedAt: '' });
    const result = { outcome: 'passed', commit: HEAD, summary: 'Synthetic pass', findings: [], receipts: [], paidRuns: 2, blocker: '', branch: '', worktree: '', prId: 9, previewUrl: '', qaRunDir,
        evidence: [item('check', 'checks'), item('browser', 'browser', observedUrl), item('png', 'screenshot')],
        qa: { version: 1, ticket: t.key, commit: HEAD, stage: 'retest', validation: 'browser',
            setup: { status: 'ready', summary: 'Synthetic setup', owner: 'Riley', nextAction: 'None', url: 'http://127.0.0.1:3000', actor: 'Synthetic actor', resources: ['Synthetic owned resource'] },
            cases: [{ id: 'AC1', kind: 'acceptance', check: 'Required acceptance', status: 'passed', expected: 'Expected', observed: 'Observed', evidenceIds: ['png'] },
                { id: 'REG1', kind: 'regression', check: 'Adjacent behavior', status: 'passed', expected: 'Expected', observed: 'Observed', evidenceIds: ['check'] }],
            nextOwner: 'Morgan', nextAction: 'Check delivery gates' } } as unknown as StageResult;
    saveQAReport(result, qaRunDir, root);
    t.results.retest = { ...result, outcome: 'blocked', blocker: REFUSAL };
    store.state.tickets = [t];
    return { store, t };
}

test('a pass the gate refused and accepts now is returned as a pass, leaving the saved result untouched', () => {
    const { store, t } = refused();
    expect(gateRefusedPass(store, t, 'retest')).toMatchObject({ outcome: 'passed', blocker: '', paidRuns: 2, summary: 'Synthetic pass' });
    expect(t.results.retest).toMatchObject({ outcome: 'blocked', blocker: REFUSAL });
});

test.each<[string, (t: Ticket) => void]>([
    ['the gate still refuses it', t => { t.results.retest!.evidence = t.results.retest!.evidence.filter(item => item.kind !== 'screenshot'); }],
    ['the block is not one of the gate\'s fixed refusals', t => { t.results.retest!.blocker = `${GATE_REFUSED}Setup needed: sign in. Owner: Joe`; }],
    ['the block is the worker\'s own', t => { t.results.retest!.blocker = 'Needs a second BA'; }],
    ['the result was a failure', t => { t.results.retest!.outcome = 'failed'; }],
    ['the paid runs are not counted', t => { t.results.retest!.paidRuns = null; }],
    ['a receipt is uncertain', t => { t.results.retest!.receipts = [{ id: 'x', action: 'jira-comment', target: t.key, verified: false, uncertain: true, detail: '' }]; }],
    ['the candidate has moved', t => { t.commit = 'b'.repeat(40); }],
    ['the ticket is at another stage', t => { t.stage = 'qa'; }],
    ['there is no structured report', t => { delete t.results.retest!.qa; }],
])('nothing is returned when %s', (_name, change) => {
    const { store, t } = refused(); change(t);
    expect(gateRefusedPass(store, t, 'retest')).toBeUndefined();
});

test('nothing is returned when the observation was on another origin', () => {
    const { store, t } = refused('http://127.0.0.1:3001/projects/p1');
    expect(gateRefusedPass(store, t, 'retest')).toBeUndefined();
});

test('the runner accepts the saved pass without a PM transition or a QA worker and posts its own QA comment', async () => {
    const { store, t } = refused(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    t.activity = 'waiting'; t.blocker = '';
    const engine = new Engine(store);
    engine.jira = new JiraOperations(store, jira.execute);
    let transitions = 0, workers = 0;
    engine.agents.transition = async () => { transitions++; throw new Error('No PM transition on re-acceptance'); };
    engine.agents.stage = async () => { workers++; throw new Error('No worker on re-acceptance'); };

    await engine.run(t.key);

    const live = store.ticket(t.key);
    expect([transitions, workers]).toEqual([0, 0]);
    expect(live.results.retest).toMatchObject({ outcome: 'passed', blocker: '', paidRuns: 2 });
    expect(live.results.retest!.receipts.filter(receipt => receipt.action === 'jira-comment')).toMatchObject([{ verified: true, uncertain: false }]);
    expect(jira.calls.filter(args => args[2] === 'comment' && args[3] === 'create')).toHaveLength(1);
    expect(live.stage).not.toBe('retest');
    expect(live.activity).not.toBe('blocked');
});
