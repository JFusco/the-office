import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { cecReadbackPrompt } from '../../../server/cec/prompts/cec-reads';
import { CEC, DATA } from '../../../server/office/config';
import { fakeJira } from './parking/fake-jira';
import { cecStore, decision, ticket } from './parking/fixtures';
import type { Stage, StageResult } from '../../../src/shared';

/**
 * One ticket walked down the whole path that follows an exhausted repair budget, through the real stage
 * runner, result gates, repair budget, Jira operations, Effects and resume. Only the model workers are
 * scripted. Each gate has its own focused test; this proves they agree with each other on this path.
 */
const HEAD = 'a'.repeat(40), REPAIRED = 'b'.repeat(40);
const finding = (status: 'open' | 'verified') => ({ id: 'F1', summary: 'Request too large', expected: 'Fits the limit', actual: 'Over the limit', status, attempts: 2 });

function saved(runId: string, id: string, kind: string, commit: string) {
    const root = resolve(DATA, 'runs', runId), path = resolve(root, `${id}.md`);
    mkdirSync(root, { recursive: true }); writeFileSync(path, id);
    return { id, kind, summary: id, path, commit, environment: 'unit', url: '', observedAt: '' } as any;
}

test('failed retest with the budget spent: Sam assesses once, Alex repairs, Sam reviews, and the ticket returns to retest with no gate refusing a step the harness scheduled', async () => {
    const { store } = cecStore(), jira = fakeJira({ 'CEC-900': { status: 'QA' } });
    const t = { ...ticket('QA'), stage: 'retest' as const, activity: 'waiting' as const, findings: [finding('open')], repairAttempts: { F1: 2 },
        approach: { plan: 'reviewed', review: 'full', validation: 'browser', checks: ['Original checks'], reason: 'Original' } as any,
        repairCycle: { owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'qa', sourceHead: HEAD, phase: 'repair' } as any };
    store.state.tickets = [t];
    const engine = new Engine(store), run = t.runId, stages: Stage[] = [], moves: string[] = [], readbacks: string[] = [];
    engine.jira = new JiraOperations(store, jira.execute);
    engine.agents.transition = async (_ticket, target) => {
        moves.push(target); jira.state[t.key].status = target;
        return { ...decision(''), outcome: 'passed', resolution: null, blocker: '', summary: `Moved to ${target}`, receipts: [{ id: 'status', action: 'jira-transition', target: t.key, verified: true, uncertain: false, detail: 'Synthetic read-back' }] };
    };
    engine.agents.readback = async (key: string) => {
        readbacks.push(cecReadbackPrompt(store, key));
        return { key, assignee: CEC.account, subtask: false, boardMember: true, status: jira.state[key].status, statusId: '', updated: '', existingPrId: t.prId, existingOwner: '', blocker: '' };
    };
    engine.agents.reconcile = async () => { throw new Error('Nothing on this path is reconstructed'); };
    const script: Partial<Record<Stage, () => StageResult>> = {
        retest: () => stages.filter(stage => stage === 'retest').length > 1
            ? decision('', { resolution: null, commit: REPAIRED, summary: 'Second retest reached', blocker: 'End of the scripted path' })
            : decision('', { outcome: 'failed', summary: 'The request is still too large.', blocker: '', paidRuns: 1, findings: [finding('open')],
                resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['retest-failure'] } as any, evidence: [saved(run, 'retest-failure', 'checks', HEAD)] }),
        'code-review': () => decision('', { summary: 'Trim the bundle.', blocker: 'The harness must assess this proposal.', findings: [finding('open')],
            resolution: { kind: 'source-repair', findingIds: ['F1'], evidenceIds: ['diagnosis'] } as any, evidence: [saved(run, 'diagnosis', 'review', HEAD)],
            approach: { plan: 'brief', review: 'full', validation: 'browser', checks: ['Request stays under the limit'], reason: 'Trim the bundle' } as any }),
        repair: () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'Trimmed the bundle.', commit: REPAIRED, findings: [{ ...finding('open'), status: 'fixed' as any }], evidence: [saved(run, 'repair-checks', 'checks', REPAIRED)] }),
        'repair-review': () => decision('', { outcome: 'passed', resolution: null, blocker: '', summary: 'The repair is sound.', commit: REPAIRED, findings: [finding('verified')], evidence: [saved(run, 'repair-review', 'review', REPAIRED)] }),
    };
    engine.agents.stage = async (_ticket, stage) => { stages.push(stage); return script[stage]!(); };

    for (let i = 0; i < 12 && store.ticket(t.key).activity !== 'blocked'; i++) await engine.run(t.key);

    const live = store.ticket(t.key);
    expect(stages).toEqual(['retest', 'code-review', 'repair', 'repair-review', 'retest']);
    expect(live).toMatchObject({ stage: 'retest', commit: REPAIRED, blocker: 'End of the scripted path' });
    // The assessment asks for no status move; the review of the repair and the retest each ask for theirs.
    expect(moves).toEqual(['QA', 'Code Review', 'QA']);
    expect(live.repairCycle).toMatchObject({ approachRevision: 1, diagnosisAttempted: true });
    expect(live.approach).toMatchObject({ plan: 'reviewed', review: 'full', validation: 'browser', checks: ['Request stays under the limit'] });
    // Every external write went through Effects once and was read back.
    const effects = store.db.prepare('SELECT id, status FROM effects ORDER BY rowid').all() as { id: string; status: string }[];
    expect(effects.map(effect => effect.status)).toEqual(effects.map(() => 'verified'));
    expect(effects.map(effect => effect.id.split(':')[0])).toEqual(['qa-comment', 'dev-update', 'qa-comment']);
    expect(jira.state[t.key].comments).toHaveLength(3);

    // A resume from that ordinary stop reads the ticket back and reconstructs nothing.
    await engine.resume(t.key, false);
    expect(readbacks).toHaveLength(1);
    expect(store.ticket(t.key)).toMatchObject({ stage: 'retest', activity: 'waiting', blocker: '' });
});
