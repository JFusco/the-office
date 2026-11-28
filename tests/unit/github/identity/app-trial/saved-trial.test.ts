import { expect, test } from 'vitest';
import type { EffectIntent } from '../../../../../src/shared';
import { assertSavedTrial, isTrialWriter, TRIAL_AUTHORIZATION, trialExpectedState, trialWork } from '../../../../../server/github/identity/app-trial/saved-trial';
import { AppTrialPacket, bindPacket } from '../../../../../server/github/identity/app-trial/trial-packet';
import { entryDigest } from '../../../../../server/github/identity/route-entry';
import { ENTRY, ISSUE, PACKET, PR_ENTRY, PR_PACKET, PROJECT, PULL } from './support/trial-fixture';

const trial = bindPacket(PROJECT, AppTrialPacket.parse(PACKET));
const writer = () => ({
    principal: 'app' as const, projectId: 'the-office', repository: 'JFusco/the-office', operation: 'comment', login: PACKET.botLogin,
    appId: PACKET.appId, installationId: PACKET.installationId, botId: PACKET.botId, repositoryId: PACKET.repositoryId,
    grant: { kind: 'trial' as const, entryDigest: entryDigest(ENTRY) },
    binding: { adapter: 'github-issue-comment', target: ISSUE, expectedDigest: PACKET.expectedDigest, beforeDigest: PACKET.beforeDigest },
});
const intent = (change: Partial<EffectIntent> = {}): EffectIntent => ({
    id: PACKET.effectId, work: { projectId: 'the-office', kind: 'issue', id: '629' }, attemptId: PACKET.effectId, operation: 'github-issue-comment', target: ISSUE,
    authorization: TRIAL_AUTHORIZATION, payload: { ...trial.payload }, expectedState: trialExpectedState(trial), status: 'uncertain', createdAt: '', dispatchedAt: 'x',
    verifiedAt: '', receipt: null, error: '', elapsedMs: null, writer: writer(), ...change,
});

test('the trial writer is the approved App, bot, grant and binding, field for field', () => {
    expect(isTrialWriter(writer(), trial)).toBe(true);
    for (const change of [{ principal: 'operator' }, { appId: 1 }, { installationId: 1 }, { botId: 1 }, { login: 'JFusco' }, { repositoryId: 1 }, { projectId: 'brain' },
        { repository: 'JFusco/brain' }, { operation: 'issue-close' }, { grant: { kind: 'trial', entryDigest: 'x' } }, { grant: { kind: 'activation', activationEffectId: 'x' } },
        { grant: { kind: 'trial', entryDigest: entryDigest(ENTRY), revokes: 'x' } }, { binding: { ...writer().binding, beforeDigest: 'x' } },
        { binding: { ...writer().binding, board: 'b' } }])
        expect(isTrialWriter({ ...writer(), ...change } as never, trial), JSON.stringify(change)).toBe(false);
    expect(isTrialWriter(undefined, trial)).toBe(false);
});

test('a saved intent must be this trial in every field the approval binds', () => {
    expect(() => assertSavedTrial(intent(), trial)).not.toThrow();
    for (const change of [{ operation: 'github-issue-close' }, { target: `${ISSUE}0` }, { authorization: 'office-harness' }, { attemptId: 'x' },
        { work: { projectId: 'the-office', kind: 'delivery' as const, id: '629' } }, { payload: { ...trial.payload, author: 'JFusco' } },
        { payload: { author: trial.payload.author, number: 629, marker: trial.payload.marker, body: trial.payload.body } },
        { expectedState: { ...trialExpectedState(trial), packetDigest: 'x' } }, { writer: undefined }, { writer: { ...writer(), principal: 'operator' as const } }])
        expect(() => assertSavedTrial(intent(change as Partial<EffectIntent>), trial), JSON.stringify(change)).toThrow(/not the approved App trial/);
});

test('the packet digest binds the remote issue identity: a packet naming another issue id or node id is another trial', () => {
    for (const issue of [{ ...PACKET.issue, id: 1 }, { ...PACKET.issue, nodeId: 'I_other' }]) {
        const other = bindPacket(PROJECT, AppTrialPacket.parse({ ...PACKET, issue }));
        expect(() => assertSavedTrial(intent(), other)).toThrow(/not the approved App trial/);
    }
});

test('a PR trial pins the github-pr-comment writer on its PR URL and is saved under the pull request', () => {
    const pr = bindPacket(PROJECT, AppTrialPacket.parse(PR_PACKET));
    const prWriter = { ...writer(), grant: { kind: 'trial' as const, entryDigest: entryDigest(PR_ENTRY) },
        binding: { adapter: 'github-pr-comment', target: PULL, expectedDigest: PR_PACKET.expectedDigest, beforeDigest: PR_PACKET.beforeDigest } };
    expect(trialWork(pr)).toEqual({ projectId: 'the-office', kind: 'pr', id: '9001' });
    expect(isTrialWriter(prWriter, pr)).toBe(true);
    expect(isTrialWriter({ ...prWriter, binding: { ...prWriter.binding, adapter: 'github-issue-comment' } }, pr)).toBe(false);
    const saved = intent({ id: PR_PACKET.effectId, attemptId: PR_PACKET.effectId, work: trialWork(pr), operation: 'github-pr-comment', target: PULL,
        payload: { ...pr.payload }, expectedState: trialExpectedState(pr), writer: prWriter });
    expect(() => assertSavedTrial(saved, pr)).not.toThrow();
    for (const change of [{ operation: 'github-issue-comment' }, { work: { projectId: 'the-office', kind: 'issue' as const, id: '9001' } },
        { payload: { ...pr.payload, pull: { ...pr.payload.pull!, head: { sha: 'b'.repeat(40), ref: 'x' } } } }])
        expect(() => assertSavedTrial({ ...saved, ...change } as EffectIntent, pr), JSON.stringify(change)).toThrow(/not the approved App trial/);
});
