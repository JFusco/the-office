import { afterEach, expect, test, vi } from 'vitest';
import { admitTrial } from '../../../../../server/github/identity/app-trial/trial-admission';
import { AppTrialPacket } from '../../../../../server/github/identity/app-trial/trial-packet';
import { ENTRY, ISSUE, PACKET, trialOffice, type TrialOffice } from './support/trial-fixture';

const holds = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('../../../../../server/office/project-holds', async original => ({
    ...await original<typeof import('../../../../../server/office/project-holds')>(),
    holdReason: (_project: unknown, key: string) => holds.value[key],
}));

let f: TrialOffice | undefined;
afterEach(() => { f?.cleanup(); f = undefined; holds.value = {}; });
const admit = (office: TrialOffice, packet: object = PACKET) => admitTrial(office.store, AppTrialPacket.parse(packet));

test('the designated trial on a never-activated route is admitted, and admission reads no provider', () => {
    f = trialOffice();
    expect(admit(f)).toMatchObject({ target: ISSUE, entry: ENTRY });
    expect([f.counts.posts, f.counts.listReads, f.counts.issueReads, f.counts.tokens]).toEqual([[], 0, 0, 0]);
});

test('a paused or draining project, or a held issue, refuses', () => {
    f = trialOffice();
    f.store.state.paused = true;
    expect(() => admit(f!)).toThrow(/paused or draining/);
    f.store.state.paused = false; f.store.state.draining = true;
    expect(() => admit(f!)).toThrow(/paused or draining/);
    f.store.state.draining = false; holds.value = { 'GH-629': 'Joe holds this issue.' };
    expect(() => admit(f!)).toThrow(/GH-629 is held/);
    holds.value = { 'GH-630': 'Another issue.' };
    expect(admit(f).target).toBe(ISSUE);
});

test.each([
    ['no App block', undefined, {}],
    ['another App', { comment: ENTRY }, { appId: 1 }],
    ['another installation', { comment: { ...ENTRY, installationId: 1 } }, { installationId: 1 }],
    ['another bot login', { comment: ENTRY }, { botLogin: 'other[bot]' }],
    ['no bot id', { comment: ENTRY }, { botId: undefined }],
    ['another bot id', { comment: ENTRY }, { botId: 1 }],
])('a config with %s refuses', (_name, writes, change) => {
    f = trialOffice({}, change);
    f.configure(writes, change);
    expect(() => admit(f!)).toThrow(/App, installation or bot/);
});

test('a repository binding with another id refuses', () => {
    f = trialOffice({}, { repositories: { 'the-office': { repository: 'JFusco/the-office', repositoryId: 1 } } });
    expect(() => admit(f!)).toThrow(/repository binding/);
});

test.each([
    ['no comment route', {}],
    ['the operator route', { comment: 'operator' }],
    ['a trial for another Effect id', { comment: { ...ENTRY, effectId: 'office-app-trial:the-office:comment:629:other' } }],
    ['a trial for another change', { comment: { ...ENTRY, expectedDigest: 'b'.repeat(64) } }],
    ['a trial for another issue', { comment: { ...ENTRY, target: 'https://github.com/JFusco/the-office/issues/1' } }],
])('%s refuses: the route would not send this id as the designated trial', (_name, writes) => {
    f = trialOffice(writes);
    expect(() => admit(f!)).toThrow(/no pending comment trial|does not name this Effect/);
});

test('a held route refuses with its reason', () => {
    f = trialOffice();
    f.store.db.prepare("INSERT INTO github_write_routes (project_id, operation, activation_effect_id, state) VALUES ('the-office', 'comment', 'missing', 'active')").run();
    expect(() => admit(f!)).toThrow(/route holds: the current activation Effect is missing/);
});

test('the packet binding is checked first', () => {
    f = trialOffice();
    expect(() => admit(f!, { ...PACKET, projectId: 'brain' })).toThrow(/project or repository/);
});
