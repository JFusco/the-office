import { expect, test } from 'vitest';
import type { EffectIntent } from '../../../../../src/shared';
import { trialResult } from '../../../../../server/github/identity/app-trial/trial-result';
import { AppTrialPacket, bindPacket } from '../../../../../server/github/identity/app-trial/trial-packet';
import { BOT, ISSUE, PACKET, PROJECT } from './support/trial-fixture';

const trial = bindPacket(PROJECT, AppTrialPacket.parse(PACKET));
const receipt = { id: 900, url: `${ISSUE}#issuecomment-900` };
const evidence = { record: receipt.url, target: ISSUE, transition: 'issue comment created', actor: { ...BOT }, observedAt: '2026-11-28T06:00:00.000Z' };
const intent = (change: Partial<EffectIntent>) => ({ status: 'verified', dispatchedAt: '2026-11-28T06:00:00.000Z', receipt,
    writer: { principal: 'app', login: BOT.login, botId: BOT.id, grant: { kind: 'trial', entryDigest: 'x' } }, ...change }) as unknown as EffectIntent;

test('before an intent exists nothing was created or sent', () => {
    expect(trialResult(undefined, trial, 'check')).toMatchObject({ status: 'none', dispatched: false, receipt: null, qualification: null, qualified: false, writer: null, next: expect.stringMatching(/^Bound;/) });
    expect(trialResult(undefined, trial, 'run').next).toBe('Nothing was created or sent.');
});

test('qualified needs a verified intent whose evidence names the approved bot by login and id on the bound issue', () => {
    expect(trialResult(intent({ qualification: evidence }), trial, 'run')).toMatchObject({ qualified: true, receipt, writer: { principal: 'app', login: BOT.login, botId: BOT.id, grant: 'trial' } });
    for (const qualification of [undefined, { ...evidence, actor: { login: BOT.login } }, { ...evidence, actor: { login: 'JFusco', id: BOT.id } }, { ...evidence, target: `${ISSUE}0` }])
        expect(trialResult(intent({ qualification }), trial, 'run'), JSON.stringify(qualification)).toMatchObject({ qualified: false });
    expect(trialResult(intent({ status: 'uncertain', qualification: evidence }), trial, 'run').qualified).toBe(false);
});

test('each saved state says what may happen next, and never offers a resend', () => {
    expect(trialResult(intent({}), trial, 'run').next).toMatch(/not qualified: the trial is spent/);
    expect(trialResult(intent({ status: 'rejected', dispatchedAt: '' }), trial, 'run')).toMatchObject({ dispatched: false, next: expect.stringMatching(/spent/) });
    expect(trialResult(intent({ status: 'prepared', dispatchedAt: '' }), trial, 'run').next).toMatch(/never sent: run again/);
    expect(trialResult(intent({ status: 'uncertain', receipt: null }), trial, 'run')).toMatchObject({ dispatched: true, receipt: null, next: expect.stringMatching(/never resent/) });
});

test('the answer carries the saved sanitized error, or this run\'s failed read-back in its place', () => {
    expect(trialResult(intent({}), trial, 'run').error).toBeNull();
    expect(trialResult(intent({ status: 'rejected', dispatchedAt: '', error: 'GH-629 is held' }), trial, 'run')).toMatchObject({ status: 'rejected', error: 'GH-629 is held', next: expect.stringMatching(/spent/) });
    expect(trialResult(intent({ status: 'uncertain', error: 'gh timed out' }), trial, 'run', 'listing lags')).toMatchObject({ status: 'uncertain', receipt, error: 'listing lags', next: expect.stringMatching(/same packet/) });
});
