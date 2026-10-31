import { drainStages, drainMaintenance } from '../../fixtures/scheduler';
import { test, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { CEC, DATA } from '../../../server/office/config';
import type { Stage, StageResult, Ticket, Evidence } from '../../../src/shared';
const cleanup: string[] = [];
afterEach(() => {
    for (const p of cleanup.splice(0))
        rmSync(p, { recursive: true, force: true });
});
const sha = 'a'.repeat(40), fixed = 'b'.repeat(40);
function setup() {
    const store = new Store(':memory:');
    const run = mkdtempSync(resolve(DATA, 'runs-test-'));
    cleanup.push(run);
    const runId = `unit-${crypto.randomUUID()}`;
    const artifactRoot = resolve(DATA, 'runs', runId);
    mkdirSync(artifactRoot, { recursive: true });
    cleanup.push(artifactRoot);
    const t: Ticket = { key: 'CEC-999', summary: 'Synthetic engine test', type: 'Bug', status: 'QA', statusId: '10300', assignee: CEC.account, subtask: false, boardMember: true, url: '', updated: '', stage: 'qa', activity: 'waiting', blocker: '', runId, attempt: 0, commit: sha, branch: 'fixture', worktree: '', previewUrl: 'http://127.0.0.1:1234', prId: 9, results: {}, findings: [], evidence: [], pilot: true, observedAt: '' };
    store.state.tickets = [t];
    return { store, t, engine: new Engine(store), artifactRoot };
}
function proof(root: string, kind: Evidence['kind'], commit: string): Evidence { const p = resolve(root, `${kind}.txt`); writeFileSync(p, 'Synthetic unit fixture; not live QA'); return { id: kind, kind, path: p, summary: 'Unit-test proof boundary fixture', commit, url: 'http://127.0.0.1:1234', observedAt: new Date().toISOString(), environment: 'unit' }; }
function output(p: Partial<StageResult> = {}): StageResult { return { outcome: 'passed', summary: 'Synthetic engine fixture', commit: fixed, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 9, qaRunDir: '', paidRuns: 0, blocker: '', ...p }; }
function transitionOutput(p: Partial<StageResult> = {}) { return output({ ...p, receipts: [{ id: 'status', action: 'jira-transition', target: 'Unit fixture', verified: true, uncertain: false, detail: 'Synthetic transition read-back' }] }); }
function harness(root: string) { const d = resolve(root, 'qa'); mkdirSync(d, { recursive: true }); writeFileSync(resolve(d, 'report.json'), JSON.stringify({ product_verdict: 'pass', completion_status: 'complete', result_handoff: { coverage: { tested: 1, failed: 0, blocked: 0 } } })); writeFileSync(resolve(d, 'final.md'), 'Coverage\nTicket delivery\nSynthetic fixture'); return d; }
test('QA failure goes through developer repair, lead review, independent retest and publication before waiting for CI', async () => {
    const { store, t, engine, artifactRoot } = setup();
    const stages: Stage[] = [];
    const finding = { id: 'save-confirmation', summary: 'Synthetic failed save', actual: 'Missing confirmation', expected: 'Saved confirmation', status: 'open' as const, attempts: 0 };
    engine.agents.transition = async () => transitionOutput({ commit: sha });
    engine.agents.stage = async (_t, stage, role) => {
        stages.push(stage);
        if (stage === 'qa') {
            expect(role).toBe('qa');
            return output({ outcome: 'failed', commit: sha, paidRuns: 1, findings: [finding] });
        }
        if (stage === 'repair') {
            expect(role).toBe('developer');
            return output({ evidence: [proof(artifactRoot, 'checks', fixed)], findings: [{ ...finding, status: 'fixed' }] });
        }
        if (stage === 'repair-review') {
            expect(role).toBe('lead');
            return output({ evidence: [proof(artifactRoot, 'review', fixed)] });
        }
        if (stage === 'retest') {
            expect(role).toBe('qa');
            return output({ qaRunDir: harness(artifactRoot), evidence: [proof(artifactRoot, 'browser', fixed), proof(artifactRoot, 'screenshot', fixed)], findings: [{ ...finding, status: 'verified' }], receipts: [{ id: 'qa-update', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Unit fixture' }] });
        }
        return output({ receipts: [{ id: 'publish', action: 'publish-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Unit fixture' }] });
    };
    await drainStages(engine, t.key);
    expect(stages).toEqual(['qa', 'repair', 'repair-review', 'retest', 'publish']);
    expect(t.stage).toBe('ci');
    expect(t.activity).toBe('waiting');
    expect(t.results.qa?.paidRuns).toBe(1);
    expect(t.findings[0].status).toBe('verified');
    store.close();
});
test('two failed repair cycles stop, retaining draft work and the last QA findings', async () => {
    const { store, t, engine, artifactRoot } = setup();
    engine.agents.transition = async () => transitionOutput();
    engine.agents.stage = async (_t, stage) => {
        if (['qa', 'retest'].includes(stage))
            return output({ outcome: 'failed', commit: t.commit, findings: [{ id: 'same-failure', summary: 'Still failing', actual: 'Failed', expected: 'Pass', status: 'open', attempts: t.attempt }] });
        return output({ evidence: [proof(artifactRoot, stage === 'repair' ? 'checks' : 'review', fixed)] });
    };
    await drainStages(engine, t.key);
    expect(t.attempt).toBe(2);
    expect(t.stage).toBe('retest');
    expect(t.activity).toBe('blocked');
    expect(t.results.publish).toBeUndefined();
    store.close();
});
test('a worker timeout cannot silently replay an uncertain paid/external effect', async () => {
    const { store, t, engine } = setup();
    engine.agents.transition = async () => transitionOutput();
    let executions = 0;
    engine.agents.stage = async () => { executions++; throw new Error('timed out after provider submit'); };
    await drainStages(engine, t.key);
    expect(t.activity).toBe('blocked');
    expect(t.results.qa?.receipts[0].uncertain).toBe(true);
    engine.agents.readback = async () => ({ key: t.key, assignee: CEC.account, subtask: false, boardMember: true, status: 'QA', statusId: '10300', updated: '', existingPrId: 9, existingOwner: '', blocker: '' });
    engine.agents.reconcile = async () => output({ outcome: 'blocked', blocker: 'Provider effect still unknown' });
    await expect(engine.resume(t.key)).rejects.toThrow('Reconciliation incomplete');
    expect(executions).toBe(1);
    store.close();
});
test('nightly activation cannot bypass the real pilot gate', () => { const { store, engine } = setup(); expect(() => engine.enableNightly()).toThrow('completed real ticket pilot'); store.close(); });
test('review cannot start when its Jira status transition lacks verified read-back', async () => {
    const { store, t, engine } = setup();
    t.stage = 'code-review';
    let reviews = 0;
    engine.agents.transition = async () => output({ summary: 'Transition unavailable' });
    engine.agents.stage = async () => { reviews++; return output(); };
    await drainStages(engine, t.key);
    expect(reviews).toBe(0);
    expect(t.activity).toBe('blocked');
    expect(t.progressUpdates?.at(-1)?.target).toBe('Code Review');
    store.close();
});
test('QA validates candidate evidence before publishing a passed outcome', async () => {
    const { store, t, engine } = setup();
    engine.agents.transition = async () => transitionOutput({ commit: sha });
    engine.agents.stage = async () => output({ commit: sha });
    let published: any;
    engine.jira.qaComment = async (_ticket, _stage, _attempt, result) => { published = structuredClone(result); result.receipts.push({ id: 'comment', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'fixture' }); };
    await engine.run(t.key);
    expect(published.outcome).toBe('blocked');
    expect(published.blocker).toContain('browser evidence');
    expect(t.activity).toBe('blocked');
    expect(t.stage).toBe('qa');
    store.close();
});

test('typed blocked source finding follows the real Jira repair/review/retest path without a PM approval', async () => {
    const { store, t, engine, artifactRoot } = setup();
    const stages: Stage[] = [];
    const finding = { id: 'typed-source-defect', summary: 'Source check defect', expected: 'Pass', actual: 'Fail', status: 'open' as const, attempts: 0 };
    t.approach = { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['Focused checks'], reason: 'Fixture risk' };
    t.results['draft-pr'] = output({ prId: 9, receipts: [{ id: 'draft', action: 'draft-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Existing fixture draft identity' }] });
    engine.agents.transition = async () => transitionOutput({ commit: t.commit });
    engine.agents.stage = async (_ticket, stage) => {
        stages.push(stage);
        if (stage === 'qa') return output({ outcome: 'blocked', commit: sha, findings: [finding], evidence: [proof(artifactRoot, 'checks', sha)], resolution: { kind: 'source-repair', findingIds: [finding.id], evidenceIds: ['checks'] } });
        if (stage === 'repair') return output({ evidence: [proof(artifactRoot, 'checks', fixed)], findings: [{ ...finding, status: 'fixed' }] });
        if (stage === 'repair-review') return output({ evidence: [proof(artifactRoot, 'review', fixed)], findings: [{ ...finding, status: 'fixed' }] });
        if (stage === 'retest') return output({ evidence: [proof(artifactRoot, 'checks', fixed)], findings: [{ ...finding, status: 'verified' }], receipts: [{ id: 'qa', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture read-back' }] });
        return output({ receipts: [{ id: 'publish', action: 'publish-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Fixture publish' }] });
    };
    await drainStages(engine, t.key);
    expect(stages, t.blocker).toEqual(['qa', 'repair', 'repair-review', 'retest', 'publish']);
    expect(t.stage).toBe('ci'); expect(t.repairCycle?.owner).toBe('developer'); expect(t.results.qa?.outcome).toBe('blocked');
    store.close();
});
