import { expect, test } from 'vitest';
import { azureBinding } from '../../../../server/office/project-bindings';
import { followProduction } from '../../../../server/cec/production/follow-production';
import { promotionText } from '../../../../server/cec/production/promotion-pr';
import { awaitingProduction } from '../../../../server/cec/production/awaiting-production';
import { cecStore, ticket, decision } from '../parking/fixtures';
import type { PipelineOutcome } from '../../../../src/contracts/pipelines';

const SHA = 'a'.repeat(40), PROD = 'b'.repeat(40);
/** A fake Azure: which commits each base contains, the open promotion pull requests, and every write. */
function fake(options: { staging?: boolean; production?: boolean; inRun?: boolean; open?: number[]; createFails?: 'lost' | 'refused'; createdId?: number; diffFails?: boolean } = {}) {
    const state = { open: [...(options.open || [])], writes: [] as string[][], reads: [] as string[][] };
    const row = (id: number) => ({ pullRequestId: id, status: 'active', sourceRefName: 'refs/heads/staging', targetRefName: 'refs/heads/production' });
    const read = async <T>(args: string[]) => {
        state.reads.push(args);
        if (args.includes('commitDiffs')) {
            if (options.diffFails) throw new Error('TF401175: the commit could not be found');
            const base = args.find(a => a.startsWith('baseVersion='))!.split('=')[1];
            const contained = base === 'staging' ? options.staging !== false : base === 'production' ? !!options.production : !!options.inRun;
            return { aheadCount: contained ? 0 : 3 } as T;
        }
        if (args[2] === 'list') return state.open.map(row) as T;
        throw new Error(`unexpected read ${args.join(' ')}`);
    };
    const write = async <T>(args: string[]) => {
        state.writes.push(args);
        if (options.createFails === 'refused') throw new Error('TF401027: You need the Git PullRequestContribute permission');
        if (options.createFails !== 'lost') state.open.push(options.createdId || 41600);
        if (options.createFails === 'lost') throw new Error('socket hang up');
        return row(options.createdId || 41600) as T;
    };
    return { state, io: { read, write } };
}
function verified() {
    const { store } = cecStore(), t = ticket('Ready for Staging');
    Object.assign(t, { key: 'CEC-154', summary: 'Apply comment feedback', stage: 'complete', activity: 'idle', pilot: true, commit: SHA, prId: 41448 });
    t.results['staging-qa'] = decision('', { outcome: 'passed', commit: SHA });
    store.state.tickets.push(t);
    return { store, t, azure: azureBinding(store.project) };
}
const prodRun = (store: ReturnType<typeof verified>['store'], id: number, outcome: PipelineOutcome = 'passed', branch = 'production') => {
    store.state.pipelines = { observedAt: 'now', error: '', items: [{ id: '460', name: 'prod-deploy', enabled: true, url: 'u', runs: [{ id, status: 'completed', result: outcome, outcome, reason: 'manual', pullRequest: false, branch, commit: PROD, queuedAt: '', finishedAt: '2026-11-20T00:00:00Z', url: 'https://ci.example/run' }] }] };
};
const kinds = (store: ReturnType<typeof verified>['store']) => store.state.events.map(e => e.kind).filter(k => k.startsWith('promotion') || k.startsWith('production'));

test('a ticket verified on staging gets one promotion pull request, opened once', async () => {
    const { store, t, azure } = verified(), az = fake();
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toHaveLength(1);
    expect(az.state.writes[0]).toEqual(expect.arrayContaining(['repos', 'pr', 'create', '--source-branch', 'staging', '--target-branch', 'production', 'Promote staging to production: CEC-154']));
    expect(az.state.writes[0].slice(az.state.writes[0].indexOf('--description') + 1).some(line => !line || line.startsWith('-'))).toBe(false);
    expect(t.production).toMatchObject({ pr: 41600, prSource: 'opened' });
    expect(store.getEffect(`promotion-pr:CEC-154:${SHA}:0`)?.status).toBe('verified');
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toHaveLength(1);
    expect(kinds(store)).toEqual(['promotion-pr-opened']);
});

test('an open promotion pull request is joined, not doubled', async () => {
    const { store, t, azure } = verified(), az = fake({ open: [41700, 41650] });
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toEqual([]);
    expect(t.production).toMatchObject({ pr: 41650, prSource: 'joined' });
});

test.each([['not on staging', { staging: false }], ['already on production', { production: true }]])('nothing is opened for a commit %s', async (_name, options) => {
    const { store, t, azure } = verified(), az = fake(options);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toEqual([]);
    expect(t.production?.pr).toBeUndefined();
});

test('a creation whose answer was lost is never sent again; it is settled by the open pull requests', async () => {
    const { store, t, azure } = verified(), az = fake({ createFails: 'lost' });
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toHaveLength(1);
    expect(t.production?.note).toContain('It is not sent again');
    expect(kinds(store).filter(k => k === 'promotion-pr-waiting')).toHaveLength(1);
    az.state.open.push(41601);
    await followProduction(store, azure, az.io);
    expect(t.production).toMatchObject({ pr: 41601, prSource: 'joined' });
    expect(t.production?.note).toBeUndefined();
    expect(az.state.writes).toHaveLength(1);
});

test('a look that fails says so once and does not throw', async () => {
    const { store, azure } = verified(), az = fake({ createFails: 'refused' });
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    expect(store.state.events.filter(e => e.kind === 'production-follow-failed')).toHaveLength(1);
});

test('production is recorded only for a passed production run that contains the commit', async () => {
    const { store, t, azure } = verified(), az = fake({ open: [41650], inRun: false });
    prodRun(store, 900);
    await followProduction(store, azure, az.io);
    expect(t.production).toMatchObject({ pr: 41650, checkedBuildId: 900 });
    expect(t.production?.deployedAt).toBeUndefined();
    const before = az.state.reads.length;
    await followProduction(store, azure, az.io);
    expect(az.state.reads.length).toBe(before);
    const later = fake({ open: [41650], inRun: true });
    for (const [id, outcome, branch] of [[901, 'failed', 'production'], [902, 'passed', 'staging']] as const) {
        prodRun(store, id, outcome, branch);
        await followProduction(store, azure, later.io);
        expect(t.production?.deployedAt).toBeUndefined();
    }
    prodRun(store, 903);
    await followProduction(store, azure, later.io);
    expect(t.production).toMatchObject({ buildId: 903, deployedAt: '2026-11-20T00:00:00Z' });
    expect(awaitingProduction(store)).toEqual([]);
    expect(kinds(store)).toContain('production-deployed');
});

test('a failed pipeline read decides nothing, and a project without production settings is left alone', async () => {
    const { store, t, azure } = verified(), az = fake({ open: [41650], inRun: true });
    prodRun(store, 903); store.state.pipelines!.error = 'Pipelines could not be read';
    await followProduction(store, azure, az.io);
    expect(t.production?.deployedAt).toBeUndefined();
    const { production: _, ...staging } = azure, quiet = fake();
    await followProduction(store, staging, quiet.io);
    expect(quiet.state.reads).toEqual([]);
});

test('only tickets the Office verified on staging are followed', () => {
    const { store, t } = verified();
    expect(awaitingProduction(store).map(x => x.key)).toEqual(['CEC-154']);
    t.results['staging-qa']!.outcome = 'blocked';
    expect(awaitingProduction(store)).toEqual([]);
    t.results['staging-qa']!.outcome = 'passed'; t.stage = 'staging-qa';
    expect(awaitingProduction(store)).toEqual([]);
    expect(promotionText('staging', 'production', [t]).lines.join('\n')).toContain('* CEC-154: Apply comment feedback (pull request 41448)');
});

test('nothing is opened while another ticket of the Office is still in staging QA', async () => {
    const { store, t, azure } = verified(), az = fake(), other = ticket('Ready for Staging');
    Object.assign(other, { key: 'CEC-200', stage: 'staging-qa', pilot: true });
    store.state.tickets.push(other);
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toEqual([]);
    expect(t.production?.note).toContain('until staging QA finishes for CEC-200');
    expect(kinds(store)).toEqual(['promotion-pr-waiting']);
    other.stage = 'complete';
    await followProduction(store, azure, az.io);
    expect(t.production).toMatchObject({ pr: 41600, prSource: 'opened' });
});

test('a commit Azure cannot compare stops only that ticket, and the deploy is still looked for', async () => {
    const { store, t, azure } = verified(), az = fake({ diffFails: true });
    prodRun(store, 900);
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toEqual([]);
    expect(t.production?.note).toContain('could not compare');
    expect(store.state.events.filter(e => e.kind === 'promotion-pr-waiting')).toHaveLength(1);
});

test('a creation refused before sending is tried as a fresh intent three times, then left to a person', async () => {
    const { store, t, azure } = verified(), az = fake();
    store.state.paused = true;
    for (let look = 0; look < 6; look++) await followProduction(store, azure, az.io);
    expect(az.state.writes).toEqual([]);
    expect(t.production?.prAttempt).toBe(3);
    expect(t.production?.note).toContain('refused 3 times');
});

test('a recorded pull request that was abandoned is said once and not reopened', async () => {
    const { store, t, azure } = verified(), az = fake();
    await followProduction(store, azure, az.io);
    az.state.open.length = 0;
    store.state.azure.prs = [{ id: 41600, title: '', draft: false, status: 'abandoned', source: 'refs/heads/staging', target: 'refs/heads/production', commit: '', mergeCommit: '', url: '', policies: [] }];
    await followProduction(store, azure, az.io);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toHaveLength(1);
    expect(t.production).toMatchObject({ pr: 41600 });
    expect(kinds(store).filter(k => k === 'promotion-pr-abandoned')).toHaveLength(1);
});

test('two verified tickets share one pull request, and a ticket is followed for 30 days', async () => {
    const { store, t, azure } = verified(), az = fake(), second = structuredClone(t);
    Object.assign(second, { key: 'CEC-155', commit: 'c'.repeat(40) });
    store.state.tickets.push(second);
    await followProduction(store, azure, az.io);
    expect(az.state.writes).toHaveLength(1);
    expect(az.state.writes.every(args => args.slice(0, 3).join(' ') === 'repos pr create')).toBe(true);
    expect([t.production?.pr, store.ticket('CEC-155').production?.pr]).toEqual([41600, 41600]);
    expect(awaitingProduction(store)).toHaveLength(2);
    for (const x of store.state.tickets) x.production!.since = '2026-09-01T00:00:00Z';
    expect(awaitingProduction(store)).toEqual([]);
});
