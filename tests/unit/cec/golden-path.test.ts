import { afterEach, expect, test } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { CEC, DATA } from '../../../server/office/config';
import { drainStages } from '../../fixtures/scheduler';
import type { AzureBuild, AzurePR, Evidence, Stage, StageResult, Ticket } from '../../../src/shared';

const cleanup: string[] = [], stores: Store[] = [];
afterEach(() => {
    for (const store of stores.splice(0)) store.close();
    for (const path of cleanup.splice(0)) rmSync(path, { recursive: true, force: true });
});
const sha = 'a'.repeat(40), mergeCommit = 'd'.repeat(40);

/**
 * Safety net for harness refactors: one Jira/Azure ticket from first assessment to the Ready for
 * Staging wait with only synthetic workers. Pins the stage order, each stage's role and which
 * Jira status changes are requested through the separate transition worker today.
 */
test('a Jira/Azure ticket goes from understanding to the Ready for Staging wait', async () => {
    const store = new Store(':memory:');
    stores.push(store);
    const runId = `unit-${crypto.randomUUID()}`, root = resolve(DATA, 'runs', runId);
    mkdirSync(root, { recursive: true });
    cleanup.push(root);
    const t: Ticket = { key: 'CEC-999', summary: 'Synthetic golden path', type: 'Bug', status: 'To Do', statusId: '1', assignee: CEC.account, subtask: false, boardMember: true, url: '', updated: '', stage: 'understand', activity: 'waiting', blocker: '', runId, attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: true, observedAt: '' };
    store.state.tickets = [t];
    const engine = new Engine(store), stages: string[] = [], transitions: string[] = [];
    const proof = (kind: Evidence['kind']): Evidence => {
        const path = resolve(root, `${kind}-${stages.length}.txt`);
        writeFileSync(path, 'Synthetic unit fixture; not live QA');
        return { id: `${kind}-${stages.length}`, kind, path, summary: 'Synthetic', commit: sha, url: 'http://127.0.0.1:1234', observedAt: new Date().toISOString(), environment: 'unit' };
    };
    const output = (result: Partial<StageResult> = {}): StageResult => ({ outcome: 'passed', summary: 'Synthetic', commit: sha, evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: t.prId, qaRunDir: '', paidRuns: 0, blocker: '', ...result });
    const receipt = (action: string, target: string) => ({ id: `${action}-${target}`, action, target, verified: true, uncertain: false, detail: 'Synthetic read-back' });
    engine.agents.transition = async (_ticket, target) => { transitions.push(target); return output({ receipts: [receipt('jira-transition', target)] }); };
    engine.agents.stage = async (_ticket, stage: Stage, role) => {
        stages.push(`${role}:${stage}`);
        if (stage === 'understand') return output({ commit: '', approach: { plan: 'brief', review: 'focused', validation: 'independent-checks', checks: ['Saved value persists after refresh'], reason: 'Synthetic' } });
        if (stage === 'enhance') return output({ commit: '', receipts: [receipt('jira-update', t.key)] });
        if (stage === 'plan') return output({ commit: '', evidence: [proof('checks')] });
        if (stage === 'draft-pr') return output({ prId: 9, receipts: [receipt('draft-pr', 'PR9')] });
        if (stage === 'publish') return output({ receipts: [receipt('publish-pr', 'PR9')] });
        if (stage === 'ready-for-staging') return output({ receipts: [receipt('jira-transition', 'Ready for Staging')] });
        return output({ evidence: [proof('checks'), proof('review')] });
    };

    // The Dev update did not reach Jira here: the ticket goes on regardless.
    const updates: string[] = [];
    engine.jira.devUpdate = async (ticket, stage) => { updates.push(`${stage} after ${Object.keys(ticket.results).at(-1)}`); return ''; };
    await drainStages(engine, t.key);
    expect(t).toMatchObject({ stage: 'ci', activity: 'waiting', commit: sha, prId: 9 });
    // Requested once, after the code review result was accepted and before the draft PR result is recorded as passed.
    expect(updates).toEqual(['draft-pr after code-review']);
    expect(t.results['draft-pr']?.receipts.map(item => item.action)).toEqual(['draft-pr']);

    // Without a passing policy observation the ticket waits; no worker runs.
    await engine.run(t.key);
    expect(t).toMatchObject({ stage: 'ci', activity: 'waiting', blocker: 'Waiting for required Azure policies on the current PR head' });
    expect(stages.at(-1)).toBe('developer:publish');

    // Required Azure policies pass on the current PR head.
    const pr: AzurePR = { id: 9, title: 'Synthetic', draft: false, status: 'active', source: 'fixture', target: CEC.target, commit: sha, mergeCommit, url: '', policies: [{ name: 'Build', status: 'approved', buildId: 77 }] };
    const build = { id: 77, name: 'Build', status: 'completed', result: 'succeeded', commit: mergeCommit } as AzureBuild;
    Object.assign(store.state.azure, { prs: [pr], builds: [build], observedAt: new Date().toISOString() });
    await engine.run(t.key);

    expect(stages).toEqual(['pm:understand', 'pm:enhance', 'developer:plan', 'developer:implement', 'lead:code-review', 'developer:draft-pr', 'qa:qa', 'developer:publish', 'pm:ready-for-staging']);
    expect(transitions).toEqual(['In Progress', 'Code Review', 'QA']);
    // Ready for Staging is a waiting boundary: merge and deployment stay with a human.
    expect(t).toMatchObject({ stage: 'ready-for-staging', activity: 'waiting', blocker: 'Awaiting human merge and verified staging deployment', commit: sha, prId: 9 });
    expect(Object.keys(t.results)).toEqual(['understand', 'enhance', 'plan', 'implement', 'code-review', 'draft-pr', 'qa', 'publish', 'ready-for-staging']);
    expect(Object.values(t.results).every(result => result?.outcome === 'passed')).toBe(true);
});
