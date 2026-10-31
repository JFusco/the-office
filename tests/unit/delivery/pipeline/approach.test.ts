import { drainStages, drainMaintenance } from '../../../fixtures/scheduler';
import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { DATA, CEC } from '../../../../server/office/config';
import { projectById } from '../../../../server/office/projects';
import { publicationEvidenceGap, resultGate } from '../../../../server/cec/workflow';
import { recordApproach, recordJobApproach, reroute, unresolvedVerification } from '../../../../server/delivery/pipeline/approach';
import type { Evidence, Stage, StageResult, Ticket, WorkApproach } from '../../../../src/shared';
const sha = 'a'.repeat(40), roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(p => rmSync(p, { recursive: true, force: true })); });
const small: WorkApproach = { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['Relevant build/typecheck'], reason: 'A small understood change is covered by focused checks.' };
function output(p: Partial<StageResult> = {}): StageResult { return { outcome: 'passed', summary: 'Synthetic routing fixture only', commit: sha, evidence: [], findings: [], receipts: [], previewUrl: 'http://127.0.0.1:1234', worktree: '', branch: 'fixture', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '', ...p }; }
function setup(approach = small) {
    const id = `routing-unit-${crypto.randomUUID()}`, root = resolve(DATA, 'runs', id);
    mkdirSync(root, { recursive: true });
    roots.push(root);
    const store = new Store(':memory:');
    stores.push(store);
    const t: Ticket = { key: 'CEC-999', summary: 'Synthetic routing test', type: 'Bug', status: 'To Do', statusId: '10000', assignee: CEC.account, subtask: false, boardMember: true, url: '', updated: '', stage: 'understand', activity: 'waiting', blocker: '', runId: id, attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: true, observedAt: '' };
    store.state.tickets = [t];
    const engine = new Engine(store), calls: Stage[] = [];
    const proof = (kind: Evidence['kind'], commit = sha): Evidence => { const path = resolve(root, `${kind}-${commit}.txt`); writeFileSync(path, 'Synthetic fixture; not live evidence'); return { id: kind, kind, path, commit, url: 'http://127.0.0.1:1234', summary: 'Unit fixture', environment: 'unit', observedAt: '' }; };
    engine.agents.transition = async () => ({ ...output(), receipts: [{ id: 'transition', action: 'jira-transition', target: 'Unit fixture', verified: true, uncertain: false, detail: 'Synthetic verified workflow transition' }] });
    const stage = async (_ticket: Ticket, s: Stage): Promise<StageResult> => {
        calls.push(s);
        if (s === 'understand')
            return output({ approach, commit: '' });
        if (s === 'enhance')
            return output({ commit: '', receipts: [{ id: 'enhance', action: 'jira-update', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
        if (s === 'plan')
            return output({ evidence: [proof('checks')] });
        if (s === 'plan-review' || s === 'code-review')
            return output({ evidence: [proof('review')] });
        if (s === 'implement')
            return output({ evidence: [proof('checks')] });
        if (s === 'draft-pr')
            return output({ commit: t.commit, prId: 9, receipts: [{ id: 'draft', action: 'draft-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Fixture' }] });
        if (s === 'preview')
            return output({ evidence: [proof('browser')] });
        if (s === 'qa') {
            const qa = resolve(root, 'qa');
            mkdirSync(qa, { recursive: true });
            writeFileSync(resolve(qa, 'report.json'), JSON.stringify({ product_verdict: 'pass', completion_status: 'complete', result_handoff: { coverage: { tested: 1, failed: 0, blocked: 0 } } }));
            writeFileSync(resolve(qa, 'final.md'), 'Coverage\nTicket delivery\nSynthetic fixture');
            return output({ qaRunDir: qa, evidence: [proof('checks'), proof('browser'), proof('screenshot')], receipts: [{ id: 'qa', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
        }
        return output({ commit: t.commit, prId: t.prId, receipts: [{ id: 'publish', action: 'publish-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Fixture' }] });
    };
    engine.agents.stage = stage;
    return { store, engine, t, calls, stage, proof, root };
}
test('small task executes only selected assignments and never fabricates passed reviews or browser QA', async () => {
    const { engine, t, calls } = setup();
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'implement', 'draft-pr', 'publish']);
    expect(t.stage).toBe('ci');
    for (const stage of ['plan', 'plan-review', 'code-review', 'preview', 'qa'] as Stage[]) {
        expect(t.results[stage]).toBeUndefined();
        expect(t.skippedStages?.[stage]).toBe(small.reason);
    }
    expect(t.decisions?.[0].role).toBe('pm');
    expect(t.results.implement?.evidence[0].kind).toBe('checks');
});
test('brief plan can go unreviewed while code review and independent command checks remain selected', async () => {
    const { engine, t, calls } = setup({ ...small, plan: 'brief', review: 'focused', validation: 'independent-checks' });
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'plan', 'implement', 'code-review', 'draft-pr', 'qa', 'publish']);
    expect(t.stage).toBe('ci');
    expect(t.results['plan-review']).toBeUndefined();
    expect(t.results.preview).toBeUndefined();
});
test('a reviewed plan and real-browser proof requirements still apply when the team selects them', async () => {
    const { engine, t, calls } = setup({ ...small, plan: 'reviewed', review: 'focused', validation: 'browser' });
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'plan', 'plan-review', 'implement', 'code-review', 'draft-pr', 'preview', 'qa', 'publish']);
    expect(t.stage).toBe('ci');
});
test('developer can escalate before implementation without executing the writer twice', async () => {
    const { engine, t, calls, stage } = setup();
    let first = true, writes = 0;
    engine.agents.stage = async (ticket, s, role) => {
        if (s === 'implement' && first) {
            first = false;
            return output({ outcome: 'reroute', approach: { ...small, plan: 'reviewed', reason: 'Source inspection found an ambiguous shared contract.' } });
        }
        if (s === 'implement')
            writes++;
        return stage(ticket, s);
    };
    await drainStages(engine, t.key);
    expect(writes).toBe(1);
    expect(calls).toEqual(['understand', 'enhance', 'plan', 'plan-review', 'implement', 'draft-pr', 'publish']);
    expect(t.decisions?.at(-1)?.role).toBe('developer');
    expect(t.stage).toBe('ci');
});
test('a later lead planning request returns to the review and never replays completed implementation', async () => {
    const { engine, t, calls, stage } = setup({ ...small, review: 'focused' });
    let first = true;
    engine.agents.stage = async (ticket, s) => {
        if (s === 'code-review' && first) {
            first = false;
            return output({ outcome: 'reroute', approach: { ...small, plan: 'brief', review: 'focused', reason: 'Document the newly discovered boundary before publishing.' } });
        }
        return stage(ticket, s);
    };
    await drainStages(engine, t.key);
    expect(calls.filter(s => s === 'implement')).toHaveLength(1);
    expect(calls).toEqual(['understand', 'enhance', 'implement', 'plan', 'code-review', 'draft-pr', 'publish']);
    expect(t.stage).toBe('ci');
});
test('nested planning escalations preserve the completed implementation and original review continuation', async () => {
    const { engine, t, calls, stage } = setup({ ...small, review: 'focused' });
    let detours = 0;
    engine.agents.stage = async (ticket, s) => {
        if (s === 'code-review' && detours === 0) {
            detours++;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...small, plan: 'brief', review: 'focused' } });
        }
        if (s === 'plan' && detours === 1) {
            detours++;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...small, plan: 'reviewed', review: 'focused' } });
        }
        return stage(ticket, s);
    };
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'implement', 'code-review', 'plan', 'plan', 'plan-review', 'code-review', 'draft-pr', 'publish']);
    expect(calls.filter(s => s === 'implement')).toHaveLength(1);
    expect(t.stage).toBe('ci');
    expect(t.approachReturnStage).toBeUndefined();
});
test('QA review escalations schedule missing planning and review before returning to QA', async () => {
    for (const plan of ['none', 'reviewed'] as const) {
        const initial = { ...small, validation: 'independent-checks' as const }, { engine, t, calls, stage } = setup(initial);
        let first = true;
        engine.agents.stage = async (ticket, s) => {
            if (s === 'qa' && first) {
                first = false;
                calls.push(s);
                return output({ outcome: 'reroute', approach: { ...initial, plan, review: 'focused' } });
            }
            return stage(ticket, s);
        };
        await drainStages(engine, t.key);
        expect(calls).toEqual(['understand', 'enhance', 'implement', 'draft-pr', 'qa', ...(plan === 'reviewed' ? ['plan', 'plan-review'] as Stage[] : []), 'code-review', 'qa', 'publish']);
        expect(t.stage).toBe('ci');
        expect(t.approachReturnStage).toBeUndefined();
    }
});
test('a review added during QA can request nested planning without repeating the draft writer', async () => {
    const initial = { ...small, validation: 'independent-checks' as const }, { engine, t, calls, stage } = setup(initial);
    let detours = 0;
    engine.agents.stage = async (ticket, s) => {
        if (s === 'qa' && detours === 0) {
            detours++;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...initial, review: 'focused' } });
        }
        if (s === 'code-review' && detours === 1) {
            detours++;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...initial, plan: 'brief', review: 'focused' } });
        }
        if (s === 'plan' && detours === 2) {
            detours++;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...initial, plan: 'reviewed', review: 'focused' } });
        }
        return stage(ticket, s);
    };
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'implement', 'draft-pr', 'qa', 'code-review', 'plan', 'plan', 'plan-review', 'code-review', 'qa', 'publish']);
    expect(t.stage).toBe('ci');
    expect(t.approachReturnStage).toBeUndefined();
});
test('a passed writer adding late gates is saved and resumes through those gates without repeating its effects', async () => {
    for (const late of ['implement', 'draft-pr', 'qa'] as Stage[]) {
        const initial = { ...small, validation: 'independent-checks' as const }, { engine, t, calls, stage, store } = setup(initial);
        engine.agents.stage = async (ticket, s) => { const result = await stage(ticket, s); return s === late || s === 'plan' ? { ...result, approach: { ...initial, plan: 'reviewed', review: 'focused' } } : result; };
        await drainStages(engine, t.key);
        expect(t.activity).toBe('blocked');
        expect(t.blocker).toBe('Use reroute before the stage to add gates');
        expect(t.stage).toBe('plan');
        expect(t.results[late]?.outcome).toBe('passed');
        store.save();
        const saved = store.db.prepare('SELECT body FROM state WHERE id=1').get() as {
            body: string;
        };
        Object.assign(t, JSON.parse(saved.body).tickets[0]);
        await drainStages(engine, t.key);
        expect(t.stage).toBe('ci');
        expect(calls.filter(s => s === 'implement')).toHaveLength(1);
        expect(calls.filter(s => s === 'draft-pr')).toHaveLength(1);
        expect(calls.slice(calls.indexOf(late) + 1, calls.indexOf(late) + 4)).toEqual(['plan', 'plan-review', 'code-review']);
    }
});
test('a failed late review still requires independent retest after repair', async () => {
    const initial = { ...small, validation: 'independent-checks' as const }, { engine, t, calls, stage, proof } = setup(initial);
    let first = true;
    const finding = { id: 'late-review', summary: 'Broken boundary', expected: 'Pass', actual: 'Fail', status: 'open' as const, attempts: 0 };
    engine.agents.stage = async (ticket, s) => {
        if (s === 'qa' && first) {
            first = false;
            calls.push(s);
            return output({ outcome: 'reroute', approach: { ...initial, review: 'focused' } });
        }
        if (s === 'code-review') {
            calls.push(s);
            return output({ outcome: 'failed', findings: [finding] });
        }
        if (s === 'repair') {
            calls.push(s);
            return output({ evidence: [proof('checks')], findings: [{ ...finding, status: 'fixed' }] });
        }
        if (s === 'repair-review') {
            calls.push(s);
            return output({ evidence: [proof('review')], findings: [{ ...finding, status: 'fixed' }] });
        }
        if (s === 'retest') {
            calls.push(s);
            return output({ evidence: [proof('checks')], findings: [{ ...finding, status: 'verified' }], receipts: [{ id: 'retest', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
        }
        return stage(ticket, s);
    };
    await drainStages(engine, t.key);
    expect(calls).toEqual(['understand', 'enhance', 'implement', 'draft-pr', 'qa', 'code-review', 'repair', 'repair-review', 'retest', 'publish']);
    expect(t.stage).toBe('ci');
    expect(t.findings[0].status).toBe('verified');
});
test('failed review and QA repairs create a missing draft or reuse the existing PR without replaying implementation', async () => {
    for (const failure of ['code-review', 'qa'] as const) {
        const { engine, t, calls, stage, proof } = setup({ ...small, review: 'focused', validation: 'independent-checks' }), fixed = 'b'.repeat(40);
        const finding = { id: 'repair-boundary', summary: 'Broken boundary', expected: 'Pass', actual: 'Fail', status: 'open' as const, attempts: 0 };
        engine.agents.stage = async (ticket, s, role) => {
            if (!ticket.results['draft-pr'])
                expect(ticket.prId).toBe(0);
            if (s === failure) {
                calls.push(s);
                return output({ outcome: 'failed', findings: [finding] });
            }
            if (s === 'repair') {
                calls.push(s);
                expect(role).toBe('developer');
                return output({ commit: fixed, evidence: [proof('checks', fixed)], findings: [{ ...finding, status: 'fixed' }] });
            }
            if (s === 'repair-review') {
                calls.push(s);
                expect(role).toBe('lead');
                return output({ commit: fixed, evidence: [proof('review', fixed)], findings: [{ ...finding, status: 'fixed' }] });
            }
            if (s === 'retest') {
                calls.push(s);
                expect(role).toBe('qa');
                return output({ commit: fixed, evidence: [proof('checks', fixed)], findings: [{ ...finding, status: 'verified' }], receipts: [{ id: 'retest', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
            }
            if (s === 'publish') {
                expect(ticket.prId).toBe(9);
                expect(ticket.results['draft-pr']?.prId).toBe(9);
                expect(ticket.results.retest?.findings[0].status).toBe('verified');
            }
            return stage(ticket, s);
        };
        await drainStages(engine, t.key);
        expect(calls).toEqual(['understand', 'enhance', 'implement', 'code-review', ...(failure === 'qa' ? ['draft-pr', 'qa'] as Stage[] : []), 'repair', 'repair-review', 'retest', ...(failure === 'code-review' ? ['draft-pr'] as Stage[] : []), 'publish']);
        for (const once of ['implement', 'draft-pr', 'publish'] as Stage[])
            expect(calls.filter(s => s === once)).toHaveLength(1);
        expect(t.stage).toBe('ci');
        expect(t.commit).toBe(fixed);
        expect(t.prId).toBe(9);
        expect(t.findings[0].status).toBe('verified');
        expect(t.results['draft-pr']?.commit).toBe(failure === 'qa' ? sha : fixed);
    }
});
test('failed QA requires verified retest findings and keeps current-head, receipt and usage guards', () => {
    const { t, root, proof } = setup();
    t.commit = sha;
    t.approach = { ...small, validation: 'independent-checks' };
    const finding = { id: 'qa-boundary', summary: 'Broken boundary', expected: 'Pass', actual: 'Fail', status: 'fixed' as const, attempts: 1 };
    t.results.qa = output({ outcome: 'failed', findings: [{ ...finding, status: 'open' }] });
    const retest = output({ evidence: [proof('checks')], findings: [finding], receipts: [{ id: 'retest', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
    t.results.retest = retest;
    expect(unresolvedVerification(t)).toBe('qa');
    expect(resultGate(t, 'retest', retest, root)).toContain('unresolved findings');
    t.results.retest = { ...retest, findings: [{ ...finding, status: 'verified' }] };
    expect(unresolvedVerification(t)).toBeUndefined();
    for (const patch of [{ commit: 'b'.repeat(40) }, { paidRuns: null }, { receipts: [{ ...retest.receipts[0], uncertain: true }] }]) {
        t.results.retest = { ...retest, findings: [{ ...finding, status: 'verified' }], ...patch };
        expect(unresolvedVerification(t)).toBe('qa');
    }
});
test('plan rereview requires explicit verification of every prior finding before implementation', async () => {
    const { engine, t, calls, stage } = setup({ ...small, plan: 'reviewed' });
    const finding = { id: 'plan-boundary', summary: 'Missing boundary', expected: 'Document contract', actual: 'Missing contract', status: 'open' as const, attempts: 0 };
    let reviews = 0, verify = false;
    engine.agents.stage = async (ticket, s) => {
        const result = await stage(ticket, s);
        if (s !== 'plan-review')
            return result;
        if (reviews++ === 0)
            return { ...result, outcome: 'failed', findings: [finding] };
        return { ...result, findings: verify ? [{ ...finding, status: 'verified' }] : [] };
    };
    await drainStages(engine, t.key);
    expect(t.stage).toBe('plan-review');
    expect(t.activity).toBe('blocked');
    expect(t.blocker).toContain('explicit verified disposition');
    expect(calls).not.toContain('implement');
    expect(t.findings[0].status).toBe('open');
    verify = true;
    await drainStages(engine, t.key);
    expect(t.stage).toBe('ci');
    expect(t.findings[0].status).toBe('verified');
    expect(calls.filter(s => s === 'implement')).toHaveLength(1);
});
test('failed and blocked QA without finding IDs cannot be bypassed by reducing validation', async () => {
    for (const outcome of ['failed', 'blocked'] as const)
        for (const resolution of ['qa', 'retest'] as const) {
            const initial = { ...small, validation: 'independent-checks' as const }, { engine, t, calls, stage, proof, root, store } = setup(initial);
            engine.agents.stage = async (ticket, s) => s === 'qa' ? (calls.push(s), output({ outcome, blocker: 'Synthetic QA failure without finding IDs' })) : stage(ticket, s);
            await drainStages(engine, t.key);
            expect(t.stage).toBe('qa');
            expect(t.results.qa?.findings).toEqual([]);
            engine.agents.stage = async (_ticket, s) => { calls.push(s); return output({ outcome: 'reroute', approach: small }); };
            await drainStages(engine, t.key);
            expect(t.activity).toBe('blocked');
            expect(t.blocker).toContain('Resolve failed or blocked verification');
            expect(t.approach).toEqual(initial);
            expect(calls).not.toContain('publish');
            // A persisted reduction must also fail at the pre-publication boundary.
            t.approach = small;
            t.stage = 'publish';
            await drainStages(engine, t.key);
            expect(calls).not.toContain('publish');
            expect(publicationEvidenceGap(t, root)).toContain('failed or blocked');
            t.approach = initial;
            t.stage = resolution;
            engine.agents.stage = async (ticket, s) => s === 'retest' ? (calls.push(s), output({ evidence: [proof('checks')], receipts: [{ id: 'retest', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] })) : stage(ticket, s);
            await drainStages(engine, t.key);
            expect(t.stage as Stage).toBe('ci');
            expect(calls.filter(s => s === 'implement')).toHaveLength(1);
            recordApproach(t, small, 'qa', resolution);
            expect(publicationEvidenceGap(t, root)).toBe('');
            const attempts = store.db.prepare('SELECT status FROM attempts WHERE ticket=? AND stage=?').all(t.key, 'qa') as {
                status: string;
            }[];
            expect(attempts.some(a => a.status === outcome)).toBe(true);
        }
});
test('route changes cannot erase findings, replay an uncertain effect or invent missing publication checks', () => {
    const { t, root, proof } = setup();
    t.commit = sha;
    t.approach = { ...small, validation: 'browser' };
    t.findings = [{ id: 'failure', summary: 'Unresolved', expected: 'Pass', actual: 'Fail', status: 'open', attempts: 0 }];
    expect(() => reroute(t, 'qa', output({ outcome: 'reroute', approach: small }), 'qa')).toThrow('Resolve findings');
    t.findings = [];
    expect(() => reroute(t, 'qa', output({ outcome: 'reroute', approach: small, receipts: [{ id: 'effect', action: 'write', target: 'x', verified: false, uncertain: true, detail: 'Unknown' }] }), 'qa')).toThrow('Reconcile');
    t.approach = small;
    expect(resultGate(t, 'publish', output(), root)).toContain('implementation check');
    t.results.implement = output({ evidence: [proof('checks')] });
    t.prId = 9;
    t.results['draft-pr'] = output({ prId: 9, receipts: [{ id: 'draft', action: 'draft-pr', target: 'PR9', verified: true, uncertain: false, detail: 'Fixture' }] });
    t.approach = { ...small, validation: 'independent-checks' };
    expect(resultGate(t, 'publish', output(), root)).toContain('QA evidence');
});
test('independent check-based QA accepts saved command evidence and still rejects unknown usage or stale heads', () => {
    const { t, root, proof } = setup();
    t.commit = sha;
    t.approach = { ...small, validation: 'independent-checks' };
    const r = output({ evidence: [proof('checks')], receipts: [{ id: 'qa', action: 'jira-comment', target: t.key, verified: true, uncertain: false, detail: 'Fixture' }] });
    expect(resultGate(t, 'qa', r, root)).toBe('');
    expect(resultGate(t, 'qa', { ...r, commit: 'b'.repeat(40) }, root)).toContain('current candidate');
    expect(resultGate(t, 'qa', { ...r, paidRuns: null }, root)).toContain('reconciliation');
});
test('publication evidence is checked before the publisher can perform an external action', async () => {
    const { engine, t } = setup();
    t.stage = 'publish';
    t.commit = sha;
    t.approach = small;
    let called = false;
    engine.agents.stage = async () => { called = true; return output(); };
    await drainStages(engine, t.key);
    expect(called).toBe(false);
    expect(t.activity).toBe('blocked');
    expect(t.blocker).toContain('implementation check');
});
test('publisher is never dispatched without a matching verified draft PR identity', async () => {
    for (const invalid of ['missing-id', 'missing-result', 'failed', 'different-id', 'unverified', 'uncertain'] as const) {
        const { engine, t, proof } = setup();
        t.stage = 'publish';
        t.commit = sha;
        t.approach = small;
        t.prId = invalid === 'missing-id' ? 0 : 9;
        t.results.implement = output({ evidence: [proof('checks')] });
        if (invalid !== 'missing-result')
            t.results['draft-pr'] = output({ outcome: invalid === 'failed' ? 'failed' : 'passed', prId: invalid === 'different-id' ? 10 : 9, receipts: [{ id: 'draft', action: 'draft-pr', target: 'PR9', verified: invalid !== 'unverified', uncertain: invalid === 'uncertain', detail: 'Fixture' }] });
        let called = false;
        engine.agents.stage = async () => { called = true; return output(); };
        await drainStages(engine, t.key);
        expect(called).toBe(false);
        expect(t.activity).toBe('blocked');
        expect(t.blocker).toMatch(/draft PR|reconciliation/);
    }
});
test('CMS agents can omit review and QA assignments, but only with a saved reason and actual candidate checks', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-approach-cms-'));
    roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    stores.push(store);
    mkdirSync(resolve(root, 'handover'));
    writeFileSync(resolve(root, 'handover/policies.json'), JSON.stringify([{ id: 'fixture', prompt: 'Unit fixture only', memory: '' }]));
    const engine = new Engine(store), calls: string[] = [];
    engine.maintenance.verifyCandidate = async () => { };
    engine.maintenance.verifyDraft = async () => { };
    const candidate = { issue: 123, worktree: '/private/tmp/fixture-worktree', branch: 'codex/123-fixture', head: sha, summary: 'Synthetic fixture', approach: small };
    engine.agents.run = async (_role, _task, _schema, opts) => { const stage = opts!.stage!; calls.push(stage); const path = resolve(root, 'runs', opts!.requestId!, 'checks.txt'); writeFileSync(path, 'Synthetic fixture; no actual package checks'); return { outcome: 'passed', summary: 'Fixture', ledger: 'Fixture', blocker: '', receipts: [], checks: [{ path, commit: sha, summary: 'Fixture' }], candidates: ['vendor-review', 'proposal'].includes(stage) ? [candidate] : [] } as any; };
    const run = engine.maintenance.request();
    run.weekly = true;
    await drainMaintenance(engine.maintenance);
    expect(run.status).toBe('completed');
    expect(calls).toEqual(['follow-up', 'vendor-review', 'proposal', 'draft-pr']);
    expect(run.decisions?.[0].approach).toEqual(small);
});
test('a first focused review is not a reduction from an invented full review; skips retain failure guards', () => {
    const job: any = { stage: 'lead-pr', steps: [{ stage: 'prepare-pr', result: output({ findings: [{ id: 'source-acceptance', status: 'open' } as any] }) }] };
    expect(() => recordJobApproach(job, { ...small, review: 'focused', validation: 'independent-checks' }, 'lead', true)).not.toThrow();
    expect(job.approach.review).toBe('focused');
    expect(() => recordJobApproach(job, small, 'lead', true)).toThrow('Reconcile failed');
});
