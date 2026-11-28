import { describe, expect, test } from 'vitest';
import { AppTrialPacket, approvedEntry, bindPacket, isSuccessorOf } from '../../../../../server/github/identity/app-trial/trial-packet';
import { canonicalDigest } from '../../../../../server/github/identity/route-entry';
import { changeDigest } from '../../../../../server/github/identity/write-boundary';
import { appBlock, BODY, BOT, ENTRY, ISSUE, MARKER, PACKET, PR_BODY, PR_ENTRY, PR_MARKER, PR_PACKET, prPayload, PROJECT, PULL } from './support/trial-fixture';

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

describe('a pull request conversation trial', () => {
    test('binds the github-pr-comment adapter on the PR URL, with the PR ids, head and base in the approved payload', () => {
        const trial = bindPacket(PROJECT, parsed(PR_PACKET));
        expect(trial).toMatchObject({ operation: 'github-pr-comment', target: PULL, entry: PR_ENTRY, comment: { number: 9001, kind: 'pull', marker: PR_MARKER, body: PR_BODY } });
        expect(Object.keys(trial.payload)).toEqual(['number', 'marker', 'body', 'author', 'pull']);
        expect(trial.payload).toEqual(prPayload());
        expect(approvedEntry(parsed(PR_PACKET), PULL)).toEqual(appBlock({ comment: PR_ENTRY })!.writes['the-office'].comment);
    });

    test('an issue packet parses and binds exactly as before: same keys, same packet digest, no pull facts in its payload', () => {
        expect(canonicalDigest(parsed(PACKET))).toBe(canonicalDigest(PACKET));
        expect(Object.keys(bindPacket(PROJECT, parsed(PACKET)).payload)).toEqual(['number', 'marker', 'body', 'author']);
    });

    test.each([
        ['both an issue and a pull request', { ...PR_PACKET, issue: PACKET.issue }],
        ['a short head sha', { ...PR_PACKET, pull: { ...PR_PACKET.pull, head: { ...PR_PACKET.pull.head, sha: 'abc' } } }],
        ['an unknown pull field', { ...PR_PACKET, pull: { ...PR_PACKET.pull, draft: true } }],
        ['no base', { ...PR_PACKET, pull: { ...PR_PACKET.pull, base: undefined } }],
    ])('the schema refuses %s', (_name, packet) => {
        expect(() => parsed(packet)).toThrow();
    });

    test.each([
        ['another head sha', { head: { sha: 'b'.repeat(40), ref: 'office-app-trial-fixture' } }],
        ['another head ref', { head: { sha: 'a'.repeat(40), ref: 'other' } }],
        ['another base', { base: { ref: 'release' } }],
        ['another PR id', { id: 3000000002 }],
        ['another PR node id', { nodeId: 'PR_other' }],
    ])('a packet substituting %s under the approved digest refuses', (_name, change) => {
        expect(() => bindPacket(PROJECT, parsed({ ...PR_PACKET, pull: { ...PR_PACKET.pull, ...change } }))).toThrow(/does not match the approved change/);
    });

    test('the same comment approved as an issue comment digest is not a PR comment approval', () => {
        const relabeled = changeDigest({ id: PR_PACKET.effectId, operation: 'github-issue-comment', target: PULL, payload: prPayload() });
        expect(() => bindPacket(PROJECT, parsed({ ...PR_PACKET, expectedDigest: relabeled }))).toThrow(/does not match the approved change/);
    });
});
