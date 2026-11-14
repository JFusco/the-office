import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { cecPrompt } from '../../../server/cec/prompts/cec';
import { stagePrompt } from '../../../server/delivery/pipeline/stage-prompts';
import type { Stage, Ticket, TicketJob } from '../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function setup(validation = 'browser') {
    const store = new Store(':memory:'); stores.push(store);
    const ticket = { key: 'CEC-900', runId: 'unit-run', attempt: 4, stage: 'retest', commit: 'a'.repeat(40), results: {},
        approach: { plan: 'none', review: 'focused', validation, checks: ['Relevant acceptance'], reason: 'Fixture' } } as Ticket;
    return { store, ticket };
}

test.each(['qa', 'retest', 'staging-qa', 'preview'] as Stage[])('%s browser stage includes actual-window, callback and same-run ownership guidance', stage => {
    const { store, ticket } = setup();
    const prompt = cecPrompt(store, ticket, stage, 'qa', '/tmp/qa-unit');
    expect(prompt).toContain(`canonical current QA run is /tmp/qa-unit/.qa/runs/qa-${stage}-4`);
    expect(prompt).toContain('Before asking Joe to sign in, show the exact existing window');
    expect(prompt).toContain('documented SSO callback origin');
    expect(prompt).toContain('Do not stop a preview/browser and then invite Joe');
    expect(prompt).toContain('never copy another profile');
});

test('a same-head access block resumes the same canonical QA run, while unknown usage and changed candidates cannot authorize adoption', () => {
    const { store, ticket } = setup();
    ticket.results.retest = { outcome: 'blocked', commit: ticket.commit, qaRunDir: '/tmp/qa-unit/.qa/runs/qa-retest-4', paidRuns: 0,
        resolution: { kind: 'permission', findingIds: [], evidenceIds: [] }, receipts: [] } as any;
    expect(cecPrompt(store, ticket, 'retest', 'qa', '/tmp/qa-unit')).toContain('Resume this same access-blocked, same-head run');
    ticket.results.retest!.paidRuns = null;
    expect(cecPrompt(store, ticket, 'retest', 'qa', '/tmp/qa-unit')).not.toContain('Resume this same access-blocked');
    ticket.results.retest!.paidRuns = 0; ticket.results.retest!.commit = 'b'.repeat(40);
    expect(cecPrompt(store, ticket, 'retest', 'qa', '/tmp/qa-unit')).not.toContain('Resume this same access-blocked');
});

test.each(['developer-checks', 'independent-checks'])('%s does not acquire a browser or human sign-in handoff', validation => {
    const { store, ticket } = setup(validation);
    expect(cecPrompt(store, ticket, 'retest', 'qa', '/tmp/qa-unit')).not.toContain('BROWSER STARTUP AND ACCESS HANDOFF:');
});

test('GitHub browser validation receives the same guidance without widening its no-paid-run authority', () => {
    const { store, ticket } = setup();
    const job: TicketJob = { id: 'job-900', key: 'GH-900', requestedAt: '', status: 'working', stage: 'validate',
        approach: ticket.approach, head: ticket.commit, branch: 'codex/unit-browser', worktree: '/tmp/candidate',
        pr: 0, prUrl: '', detail: '', steps: [] };
    const input = { store, project: store.project, job, root: '/tmp/qa-unit', issue: {}, readyChecks: false };
    expect(stagePrompt(input)).toContain('BROWSER STARTUP AND ACCESS HANDOFF:');
    expect(stagePrompt(input)).toContain('No source or external changes, paid runs, merge or release');
    job.approach!.validation = 'independent-checks';
    expect(stagePrompt(input)).not.toContain('BROWSER STARTUP AND ACCESS HANDOFF:');
});
