import { expect, test } from 'vitest';
import { AppTrialPacket, approvedEntry, bindPacket, isSuccessorOf } from '../../../../../server/github/identity/app-trial/trial-packet';
import { appBlock, BODY, BOT, ENTRY, ISSUE, MARKER, PACKET, PROJECT } from './support/trial-fixture';

const parsed = (packet: object) => AppTrialPacket.parse(packet);

test('the approved packet binds its issue, comment and exact payload, with no config or provider read', () => {
    const trial = bindPacket(PROJECT, parsed(PACKET));
    expect(trial).toMatchObject({ target: ISSUE, comment: { number: 629, kind: 'issue', marker: MARKER, body: BODY } });
    expect(Object.keys(trial.payload)).toEqual(['number', 'marker', 'body', 'author']);
    expect(trial.payload).toEqual({ number: 629, marker: MARKER, body: BODY, author: BOT.login });
});

test('the approved entry is exactly the pending entry start-up parses from the same values', () => {
    expect(approvedEntry(parsed(PACKET), ISSUE)).toEqual(ENTRY);
    expect(approvedEntry(parsed(PACKET), ISSUE)).toEqual(appBlock({ comment: ENTRY })!.writes['the-office'].comment);
});

test.each([
    ['a harness id', { effectId: 'harness:job-1:proof-comment' }],
    ['a retry successor', { effectId: `${PACKET.effectId}:retry-1` }],
    ['a writer-refusal successor', { effectId: `${PACKET.effectId}:writer-2` }],
    ['an unknown field', { token: 'x' }],
    ['a non-integer id', { botId: 1.5 }],
    ['a malformed digest', { expectedDigest: 'abc' }],
    ['a non-bot login', { botLogin: 'JFusco' }],
])('the schema refuses %s', (_name, change) => {
    expect(() => parsed({ ...PACKET, ...change })).toThrow();
});

test.each([
    ['another project id', { projectId: 'brain' }],
    ['another repository', { repository: 'JFusco/brain' }],
    ['a body without its marker first', { body: `x${BODY}` }],
    ['a body with the marker twice', { body: `${BODY}\n${MARKER}` }],
    ['a pre-state other than the absent marker', { beforeDigest: 'a'.repeat(64) }],
    ['a changed body', { body: `${BODY}.` }],
    ['another author', { botLogin: 'other-app[bot]' }],
    ['another issue number', { issue: { ...PACKET.issue, number: 630 } }],
])('binding refuses %s', (_name, change) => {
    expect(() => bindPacket(PROJECT, parsed({ ...PACKET, ...change }))).toThrow(/refused before dispatch/);
});

test('only the whole retry or writer suffix makes a successor of the trial id', () => {
    const id = PACKET.effectId;
    for (const suffix of [':retry-1', ':writer-2', ':retry-1:writer-1']) expect(isSuccessorOf(id, `${id}${suffix}`), suffix).toBe(true);
    for (const other of [`${id}:followup`, `${id}:followup:retry-1`, `${id}:retry-`, `${id}retry-1`, id, `${id}x:retry-1`]) expect(isSuccessorOf(id, other), other).toBe(false);
});

test('binding refuses a project that is not on GitHub', () => {
    expect(() => bindPacket({ ...PROJECT, provider: 'azure' }, parsed(PACKET))).toThrow(/project or repository/);
});
