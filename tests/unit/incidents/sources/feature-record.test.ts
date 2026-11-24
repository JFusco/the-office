import { afterEach, expect, test } from 'vitest';
import { FEATURE_QUESTIONS, featureRecord } from '../../../../server/incidents/sources/feature-record';
import type { Store } from '../../../../server/store/store';
import { item, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
const P = 'cms-field-vocabulary';
const round = (over: Record<string, unknown> = {}) => ({ id: 'round-1', revision: 1, questions: [{ id: 'q1', question: 'PRIVATE which tenant?', recommendation: 'PRIVATE r', choices: [] }], answers: {}, createdAt: 'c', ...over });
const feature = (over: Record<string, unknown> = {}) => ({ id: 'f-1', projectId: P, title: 't', status: 'waiting', paused: false, revision: 1, phase: 'discovery', detail: 'PRIVATE detail', rounds: [round()], approvals: [], publication: [], sourceTicket: '', ...over }) as any;
const waiting = (stage = 'feature-discovery') => item('feature', 'f-1', stage, 'waiting', 'Casey is waiting for your answers.');
const read = (s: Store, stage = 'feature-discovery', projected = waiting(stage)) => featureRecord({ state: s.state, projectId: P, provider: 'github' }, projected.work, stage, projected.eligibility);

test('a waiting feature with a current question round is a question, in the harness\'s own words and marked by the round', () => {
    const s = store();
    s.state.features = [feature({ rounds: [round({ id: 'round-0', answers: { q1: 'a' } }), round()] })];
    const record = read(s);
    expect(record).toMatchObject({ standing: 'stopped', author: 'harness', kind: 'question', text: FEATURE_QUESTIONS, identity: FEATURE_QUESTIONS, episode: 'round-1', facts: { question: true }, stop: null, head: '', lastWorker: '', covers: [] });
    expect(record!.effects).toEqual([{ projectId: P, kind: 'feature', id: 'f-1' }]);
    expect(JSON.stringify(record)).not.toContain('PRIVATE');
});

test('an answered, resolved or stale round is no question', () => {
    const s = store();
    for (const rounds of [[round({ answers: { q1: 'yes' } })], [round({ resolvedAt: 'r' })], [round({ revision: 0 })], [round({ reviewRevision: 1, reviewRun: 'old' })]]) {
        s.state.features = [feature({ rounds, review: { run: 'new', revision: 1 } })];
        expect(read(s)).toBeNull();
    }
});

test('a paused, blocked or otherwise projected feature keeps the scheduler\'s reading', () => {
    const s = store();
    s.state.features = [feature({ paused: true })];
    expect(read(s)).toBeNull();
    s.state.features[0].paused = false;
    expect(read(s)).not.toBeNull();
    s.state.features = [feature({ status: 'blocked' })];
    expect(read(s)).toBeNull();
    s.state.features = [feature()];
    expect(read(s, 'feature-discovery', item('feature', 'f-1', 'feature-discovery', 'blocked', 'x'))).toBeNull();
    // Another project's feature with the same ID is not this one.
    s.state.features = [feature({ projectId: 'brain' })];
    expect(read(s)).toBeNull();
});

test('a feature held by its intake or by the automatic policy is not waiting on answers', () => {
    const s = store();
    // Configured intake does not list the source ticket yet.
    s.state.features = [feature({ handoff: { key: 'GH-5' }, sourceTicket: 'GH-5' })];
    expect(read(s)).toBeNull();
    s.state.coordination!.listener.assigned = [{ key: 'GH-5' }] as any;
    s.state.coordination!.pickup = { status: 'Ready' } as any;
    s.state.features = [feature({ progression: 'automatic' })];
    expect(read(s)).toBeNull();
});

test('a publication read-back waits only on the harness\'s own rounds', () => {
    const s = store();
    s.state.features = [feature()];
    expect(read(s, 'feature-publication-readback')).toBeNull();
    s.state.features = [feature({ rounds: [round(), round({ id: 'round-h', author: 'harness', questions: [] })] })];
    expect(read(s, 'feature-publication-readback')).toMatchObject({ episode: 'round-h' });
});

test('a recovery deadline alone produces no reading, ahead or past', () => {
    const s = store();
    for (const nextAt of ['2099-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z']) {
        s.state.features = [feature({ rounds: [], recovery: { stage: 'discovery', revision: 1, generation: 0, attempts: 1, replacements: [], nextAt, wait: 'retry', detail: 'PRIVATE error' } })];
        expect(read(s)).toBeNull();
    }
});
