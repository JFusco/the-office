import { expect, test, vi } from 'vitest';
import { TriageResultSchema } from '../../../../src/contracts/overseer';
import { runBudgeted } from '../../../../server/overseer/budgeted-run';
import type { RunnerPaths } from '../../../../server/overseer/config';
import { collectSecondOpinion } from '../../../../server/overseer/stages/second-opinion';
import { collectTriage, type Budgeted } from '../../../../server/overseer/stages/triage';
import { runnerRoot } from '../runner-world';
import { MANIFEST, frozen, sourcesFor, syntheticProvider } from '../triage-world';

const now = () => new Date('2026-11-26T17:00:00.000Z');
const budgetedFor = (paths: RunnerPaths): Budgeted => (request, invoke) => runBudgeted(paths, request, invoke, { now });
test('the blind opinion goes to the other provider, on byte-identical evidence, never seeing the triage', async () => {
    const paths = runnerRoot(), input = frozen(), fake = syntheticProvider(), before = structuredClone(fake.state);
    const first = await collectTriage({ budgeted: budgetedFor(paths), round: 1, provider: 'claude', input, invoke: fake.invoke });
    const second = await collectSecondOpinion({ budgeted: budgetedFor(paths), input, invoke: fake.invoke, first: { provider: first.envelope.provider, inputIdentity: first.envelope.inputIdentity } });
    expect(second).toMatchObject({ status: 'valid', envelope: { stage: 'second-opinion', round: 1, provider: 'codex', session: 'session-2', inputIdentity: input.identity } });
    expect(fake.calls.map(call => call.provider)).toEqual(['claude', 'codex']);
    expect(fake.calls[1].prompt).toBe(fake.calls[0].prompt);
    const schema = fake.calls[1].prompt.split('<verdict-schema>\n')[1].split('\n</verdict-schema>')[0];
    expect(JSON.parse(schema)).toEqual(TriageResultSchema.toJSONSchema());
    expect(Object.keys(fake.calls[1]).sort()).toEqual(['activity', 'onSession', 'prompt', 'provider', 'signal']);
    // The second stage is given only the first launch's provider and input identity: nothing of its verdict.
    expect(fake.calls[1].prompt).not.toContain('session-');
    expect(second.envelope.reservation).not.toBe(first.envelope.reservation);
    expect(fake.remote.closePull).not.toHaveBeenCalled();
    expect(fake.provider.clearHistory).not.toHaveBeenCalled();
    expect(fake.state).toEqual(before);
});

test('the blind stage refuses different evidence before admission and a rejected verdict still spends its slot', async () => {
    const paths = runnerRoot(), input = frozen();
    const fake = syntheticProvider(answer => answer.provider === 'claude' ? { ...answer, output: { verdict: 'unknown' } } : answer);
    const before = structuredClone(fake.state);
    const budgeted = vi.fn(budgetedFor(paths));
    const triage = await collectTriage({ budgeted, round: 1, provider: 'codex', input, invoke: fake.invoke });
    expect(triage.status).toBe('valid');
    const first = { provider: triage.envelope.provider, inputIdentity: triage.envelope.inputIdentity };
    const changedGuidance = frozen(sourcesFor(undefined, { guidance: 'different guidance' }));
    const changedManifest = frozen(sourcesFor(undefined, { manifest: [MANIFEST[0], { ...MANIFEST[1], hash: 'a'.repeat(64) }] }));
    for (const changed of [changedGuidance, changedManifest]) {
        expect(await collectSecondOpinion({ budgeted, input: changed, invoke: fake.invoke, first }))
            .toMatchObject({ status: 'unavailable', reason: 'the evidence is not the input the triage saw' });
    }
    expect(await collectSecondOpinion({ budgeted, input: { ...input, serialized: changedGuidance.serialized }, invoke: fake.invoke, first }))
        .toMatchObject({ status: 'unavailable', reason: 'the frozen evidence does not match its identity' });
    expect(budgeted).toHaveBeenCalledTimes(1);
    expect(fake.calls).toHaveLength(1);
    expect(await collectSecondOpinion({ budgeted, input, invoke: fake.invoke, first }))
        .toMatchObject({ status: 'invalid', reason: expect.stringContaining('not a valid verdict'), envelope: { provider: 'claude' } });
    expect(await collectSecondOpinion({ budgeted, input, invoke: fake.invoke, first }))
        .toMatchObject({ status: 'unavailable', reason: 'admission refused: stage-repeated' });
    expect(fake.calls).toHaveLength(2);
    expect(fake.remote.closePull).not.toHaveBeenCalled();
    expect(fake.provider.clearHistory).not.toHaveBeenCalled();
    expect(fake.state).toEqual(before);
});
