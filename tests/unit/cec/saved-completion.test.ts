import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { z } from 'zod';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { savedStageCompletion } from '../../../server/cec/saved-completion';
import { ticket, decision } from './parking/fixtures';

const made: { store: Store; root: string }[] = [];
afterEach(() => { for (const { store, root } of made.splice(0)) { store.close(); rmSync(root, { recursive: true, force: true }); } });
const TIMEOUT = 'codex timed out; previous action outcome must be reconciled', ENDED = '2026-11-16T16:30:27.000Z', gone = () => false;
const schema = z.object({ outcome: z.string(), commit: z.string(), worktree: z.string(), branch: z.string() }).passthrough() as any;
const ALIVE = 'process still alive';
/** A retest that saved its finished result 16 seconds before the stage time limit stopped it. */
function timedOut() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-saved-')), store = new Store(':memory:', projectById('cec'), root);
    made.push({ store, root });
    const t = ticket(); Object.assign(t, { stage: 'retest', activity: 'blocked' });
    t.results.retest = decision('', { outcome: 'blocked', paidRuns: null, blocker: `Interrupted stage; external effects require reconciliation. Error: ${TIMEOUT}`, receipts: [{ id: 'attempt', action: 'retest', target: t.key, verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] });
    const work: any = { id: 'run-1', ticket: t.key, stage: 'retest', role: 'qa', status: 'failed', processId: 4242, startedAt: '2026-11-16T15:45:13.000Z', endedAt: ENDED, failure: { category: 'uncertain-effect', dispatched: true, detail: TIMEOUT } };
    store.state.workLog = [work];
    const directory = resolve(root, 'sessions', work.id), file = resolve(directory, 'completed-output.json');
    mkdirSync(directory, { recursive: true });
    const saved = { outcome: 'failed', commit: t.commit, worktree: t.worktree, branch: t.branch, summary: 'Retest found two defects' };
    const write = (value: unknown, at = '2026-11-16T16:30:11.000Z') => { writeFileSync(file, JSON.stringify(value)); utimesSync(file, new Date(at), new Date(at)); };
    write(saved);
    return { store, t, work, saved, write };
}

test('a result saved before the time limit stopped its worker is the stage result', () => {
    const { store, t, saved } = timedOut();
    expect(savedStageCompletion(store, t, 'retest', schema, gone)).toMatchObject({ work: { id: 'run-1' }, result: saved });
});

test('an Office QA result is accepted only from a directory bound for this stage and attempt', () => {
    const bound = timedOut(); bound.t.attempt = 5;
    bound.write({ ...bound.saved, qa: { setup: { status: 'ready' } }, qaRunDir: '/data/runs/r/office-qa/retest-5-abc' });
    expect(savedStageCompletion(bound.store, bound.t, 'retest', schema, gone)?.result.qaRunDir).toContain('retest-5-abc');
    for (const directory of ['/data/runs/r/office-qa/retest-4-abc', '/data/runs/r/office-qa/qa-5-abc', '/data/runs/r/elsewhere/retest-5-abc']) {
        bound.write({ ...bound.saved, qa: { setup: { status: 'ready' } }, qaRunDir: directory });
        expect(savedStageCompletion(bound.store, bound.t, 'retest', schema, gone), directory).toBeUndefined();
    }
});

test('anything short of that exact case is left to reconciliation', () => {
    const cases: [string, (x: ReturnType<typeof timedOut>) => void][] = [
        [ALIVE, () => {}],
        ['no recorded process', x => { delete x.work.processId; }],
        ['run returned normally', x => { x.work.executionStatus = 'completed'; }],
        ['result already accepted once', x => { x.work.completionAccepted = true; }],
        ['placeholder written after a later error', x => { x.t.results.retest!.blocker = 'Interrupted stage; external effects require reconciliation. Error: Office QA report directory changed'; }],
        ['provider error that only quotes the timeout text', x => { x.work.failure.detail = 'codex exited 1: codex timed out; previous action outcome must be reconciled (quoted)'; }],
        ['interrupted, not timed out', x => { x.work.status = 'interrupted'; }],
        ['another failure', x => { x.work.failure.detail = 'codex stopped producing output; inspect the retained worker evidence'; }],
        ['reader timeout', x => { x.work.failure = { category: 'transient-read', dispatched: true, detail: 'codex read timed out; saved observations retained; safe to retry the read' }; }],
        ['a newer run of the stage', x => { x.store.state.workLog!.push({ ...x.work, id: 'run-2', status: 'blocked', failure: undefined }); }],
        ['result already replaced on the ticket', x => { x.t.results.retest = decision('', { outcome: 'failed', paidRuns: 2, receipts: [] }); }],
        ['placeholder carries another receipt', x => { x.t.results.retest!.receipts.push({ id: 'c', action: 'jira-comment', target: x.t.key, verified: true, uncertain: false, detail: '' }); }],
        ['no checkpoint', x => { rmSync(resolve(x.store.dataRoot, 'sessions', 'run-1', 'completed-output.json')); }],
        ['checkpoint fails the schema', x => { x.write({ outcome: 'failed' }); }],
        ['checkpoint for another commit', x => { x.write({ ...x.saved, commit: 'f'.repeat(40) }); }],
        ['checkpoint for another branch', x => { x.write({ ...x.saved, branch: 'other' }); }],
        ['checkpoint written after the stop', x => { x.write(x.saved, '2026-11-16T16:31:00.000Z'); }],
    ];
    for (const [name, arrange] of cases) {
        const x = timedOut(); arrange(x);
        expect(savedStageCompletion(x.store, x.t, 'retest', schema, name === ALIVE ? () => true : gone), name).toBeUndefined();
    }
    const other = timedOut();
    expect(savedStageCompletion(other.store, other.t, 'qa', schema, gone)).toBeUndefined();
});
