import { expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { config, intakeFixture, event } from './fixture';
import { newTask } from '../../../../server/knowledge/slack-intake/collect';
import { IntakeConfig, configDigest } from '../../../../server/knowledge/slack-intake/config';
import { reconcileIntakeReports, readIntakeReport } from '../../../../server/knowledge/slack-intake/report';
import { intakeLaunchLimit } from '../../../../server/knowledge/slack-intake/seed-status';
import { scheduledSlackIntake } from '../../../../server/knowledge/slack-intake/schedule';
import type { ReadTask, SourceUnit, Proposal } from '../../../../server/knowledge/slack-intake/contracts';
import type { KnowledgeRunner } from '../../../../server/knowledge/run-retrospective';
import { SlackSeedStatus } from '../../../../src/knowledge/SlackSeedStatus';
const configured = { ...config, seedLaunchesPerDay: 32 };
function finishedReads(f: ReturnType<typeof intakeFixture>) {
    f.configure(configured);
    f.task.latest = '1000000.000000'; f.task.status = 'complete'; f.ledger.put('task', f.task.id, f.task);
    f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: f.task.latest, enumerated: true, caughtUp: true, through: '1000100.000000', week: '2026-11-06' });
    for (const [kind, oldest, latest] of [['inventory', '0.000000', f.task.latest], ['channel', '827200.000000', '1000100.000000'], ['search', '827200.000000', '1000100.000000'], ['inventory', '827200.000000', '1000100.000000']] as const) {
        const t = newTask(configured, 'C123', kind, '', oldest, latest, '2026-11-06', 'now'); t.status = 'complete'; f.ledger.put('task', t.id, t);
    }
}
const unit = (state: SourceUnit['state']): SourceUnit => ({ id: 'fixture', kind: 'file', resource: 'F123', channel: 'C123', text: 'Private fixture body', version: 'v1', url: 'https://fixture.slack.com/files/F123', references: [], state, reason: 'fixture', requests: [], observedAt: 'now', attempt: 'fixture', week: '2026-11-06' });

test('seed progress exists without a rollup and queued catch-up cannot imply completion', () => {
    const f = intakeFixture();
    try {
        f.configure(configured); reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.slackSeed).toMatchObject({ status: 'seeding', channelsEnumerated: 0, dailyLimit: 32 });
        finishedReads(f);
        const search = f.ledger.all<ReadTask>('task').find(t => t.kind === 'search')!; search.status = 'pending'; f.ledger.put('task', search.id, search);
        reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.slackSeed).toMatchObject({ status: 'seeding', channelsEnumerated: 1, pendingReads: 1 });
        expect(f.ledger.all('seed-completion')).toHaveLength(0);
        expect(JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06')).historicalSeed.status).toBe('seeding');
    } finally { f.close(); }
});
test('terminal coverage gaps permit one durable completion, unaffected by weekly reads or cache loss', () => {
    const f = intakeFixture();
    try {
        finishedReads(f); f.ledger.put('unit', 'fixture:v1', unit('inaccessible'));
        f.ledger.put('link', 'fixture', { state: 'deferred', source: 'fixture:v1', week: '2026-11-06', url: 'https://www.sqlite.org/', depth: 0, reason: 'public-read-unverified' });
        reconcileIntakeReports(f.store); const complete = f.store.state.knowledge!.slackSeed!;
        expect(complete).toMatchObject({ status: 'complete-with-gaps', coverageGaps: 6, dailyLimit: 8, completedAt: f.store.clock.now().toISOString() });
        expect(intakeLaunchLimit(f.ledger, configured)).toBe(8);
        const report = JSON.parse(readIntakeReport(f.store, 'intake-2026-11-06')); expect(report).toMatchObject({ status: 'settled', outstanding: 0, coverageGaps: 6 });
        f.advance(7 * 86400000); const weekly = newTask(configured, 'C123', 'channel', '', '1000000.000000', '2000000.000000', '2026-11-13', 'later'); f.ledger.put('task', weekly.id, weekly);
        f.store.db.prepare("DELETE FROM slack_intake WHERE kind='meta' AND id='report'").run(); delete f.store.state.knowledge!.slackSeed;
        reconcileIntakeReports(f.store); reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.slackSeed).toEqual(complete);
        expect(f.ledger.all('seed-completion')).toHaveLength(1);
        expect(f.store.state.events.filter(e => e.kind === 'slack-seed-complete')).toHaveLength(1);
        const html = renderToStaticMarkup(createElement(SlackSeedStatus, { seed: complete }));
        expect(html).toContain('Complete with coverage gaps'); expect(html).toContain('Weekly incremental intake continues');
        expect(JSON.stringify(complete) + html).not.toMatch(/C123|fixture.slack.com|Private fixture body/);
    } finally { f.close(); }
});
test('unresolved sources, exhausted reads, and uncertain or invalid capture receipts cannot complete a seed', () => {
    for (const blocker of ['source', 'read', 'capture', 'invalid-receipt'] as const) {
        const f = intakeFixture();
        try {
            finishedReads(f);
            if (blocker === 'source') f.ledger.put('unit', 'fixture:v1', unit('deferred'));
            if (blocker === 'read') { const t = { ...f.task, status: 'needs-attention' as const }; f.ledger.put('task', t.id, t); }
            if (blocker === 'capture' || blocker === 'invalid-receipt') f.ledger.put('proposal', 'p', { id: 'p', task: f.task.id, domain: 'tooling', body: 'private', hash: 'hash', units: [], sourceVersions: [], status: blocker === 'capture' ? 'unresolved' : 'captured', configHash: configDigest(configured) } satisfies Proposal);
            reconcileIntakeReports(f.store);
            expect(f.store.state.knowledge!.slackSeed?.status).toBe('needs-attention'); expect(f.ledger.all('seed-completion')).toHaveLength(0);
            expect(intakeLaunchLimit(f.ledger, configured)).toBe(32);
        } finally { f.close(); }
    }
});
test('missing native-window proof or changed authority never reuses a completion record', () => {
    const f = intakeFixture();
    try {
        finishedReads(f); f.ledger.put('task', f.task.id, { ...f.task, latest: '900000.000000' }); reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.slackSeed?.status).toBe('seeding');
        f.ledger.put('task', f.task.id, f.task); reconcileIntakeReports(f.store); expect(intakeLaunchLimit(f.ledger, configured)).toBe(8);
        const changed = { ...configured, domains: ['tooling', 'security'] }; f.configure(changed); reconcileIntakeReports(f.store);
        expect(f.store.state.knowledge!.slackSeed?.status).not.toBe('complete-with-gaps'); expect(intakeLaunchLimit(f.ledger, changed)).toBe(32);
    } finally { f.close(); }
});
test('approved seed allowance preserves source authority and existing daily counts, then enforces its cap', async () => {
    const f = intakeFixture();
    try {
        expect(configDigest(configured)).toBe(configDigest(config));
        expect(() => IntakeConfig.parse({ ...configured, seedLaunchesPerDay: 33 })).toThrow();
        f.configure(configured); f.ledger.put('channel', 'C123', { id: 'C123', seedUpperTs: '200.000000', enumerated: false, through: '200.000000', week: '2026-11-06' });
        f.ledger.put('launches', '2026-11-06', 8);
        const run = (async (_p, _s, opts) => { opts.onIntakeLaunch?.(); const task = f.ledger.get<ReadTask>('task', f.task.id)!; opts.onIntakeEvent?.(event(task)); return { units: [{ id: 'C123:100.000001', outcome: 'no-reusable-lesson', reason: 'fixture' }], proposals: [] }; }) as KnowledgeRunner;
        await scheduledSlackIntake(f.store, run, f.store.clock.now())[0].execute();
        expect(f.ledger.get('launches', '2026-11-06')).toBe(9);
        // An unfinished inventory gives the scheduler work whose allowance it must fence.
        const t = newTask(configured, 'C123', 'inventory', '', '0.000000', '200.000000', '2026-11-06', 'now'); f.ledger.put('task', t.id, t); f.ledger.put('launches', '2026-11-06', 32);
        expect(scheduledSlackIntake(f.store, run, f.store.clock.now())[0].eligibility).toMatchObject({ state: 'waiting', reason: 'Learning intake daily launch budget reached' });
        expect(f.ledger.get('launches', '2026-11-06')).toBe(32);
    } finally { f.close(); }
});
