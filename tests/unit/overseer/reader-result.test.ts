import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { claudeReader, codexReader } from '../../../server/overseer/reader-profiles';
import { claudeOutcome, codexOutcome, ReaderStream } from '../../../server/overseer/reader-result';
import { createRunDirectories } from '../../../server/overseer/run-directories';
import { validateRunnerRoot } from '../../../server/overseer/runner-root';
import { rollout } from '../telemetry/support/rollout';
import { tempDir } from './runner-world';

const program = (version: string) => ({ path: '/fixture/provider', version, sha256: 'a'.repeat(64) });
const claude = claudeReader(program('2.1.328'), 'claude-opus-5-5', 'high'), codex = codexReader(program('0.167.0-alpha.4.1'), 'gpt-6-astra', 'high');
const lines = (...events: object[]) => events.map(event => `${JSON.stringify(event)}\n`).join('');
const usage = { total_cost_usd: 0.5, modelUsage: { 'claude-opus-5-5': { costUSD: 0.5, costBasis: 'list' } } };
const init = (session = 's1') => ({ type: 'system', subtype: 'init', session_id: session });
const assistant = (model = 'claude-opus-5-5') => ({ type: 'assistant', session_id: 's1', message: { model } });
const result = (extra: object = {}) => ({ type: 'result', subtype: 'success', is_error: false, session_id: 's1', structured_output: { verdict: 'x' }, ...usage, ...extra });

test('the stream binds the first start once, counts any output as activity, and keeps faults instead of throwing them', () => {
    const bind = vi.fn(), activity = vi.fn(), stream = new ReaderStream('claude', bind, activity);
    stream.push('');
    expect(activity).not.toHaveBeenCalled();
    const text = lines(init(), init(), assistant());
    for (let at = 0; at < text.length; at += 5) stream.push(text.slice(at, at + 5));
    expect(bind).toHaveBeenCalledTimes(1);
    expect(bind).toHaveBeenCalledWith('s1');
    expect(stream).toMatchObject({ session: 's1', fault: null });
    expect(activity.mock.calls.length).toBeGreaterThan(5);
    stream.push(lines(init('s2')));
    expect(stream.fault).toBe('the provider reported a second, different session');
    const failing = new ReaderStream('codex', () => { throw new Error('ledger'); }, () => {});
    expect(() => failing.push(lines({ type: 'thread.started', thread_id: 't1' }))).not.toThrow();
    expect(failing).toMatchObject({ session: null, fault: 'the launch session could not be bound' });
});

test('a Claude verdict needs one start, a successful terminal for the bound session, the selected model and structured output', () => {
    expect(claudeOutcome(lines(init(), assistant(), result()), 's1', claude)).toEqual({ ok: true, model: 'claude-opus-5-5', output: { verdict: 'x' }, receipt: { evidenceId: 's1', cost: expect.objectContaining({ completeness: 'complete' }) } });
    const failing: [string, string, string, boolean][] = [
        ['no terminal', lines(init(), assistant()), 'no terminal result for the bound session', false],
        ['a foreign terminal', lines(init(), assistant(), result({ session_id: 's9' })), 'no terminal result for the bound session', false],
        ['two starts', lines(init(), init('s2'), assistant(), result()), 'the provider reported more than one session', true],
        ['an error terminal', lines(init(), assistant(), result({ subtype: 'error_max_turns', is_error: true })), 'the reader ended in an error', true],
        ['another model', lines(init(), assistant('claude-other'), result()), 'the reader ran claude-other, claude-opus-5-5, not claude-opus-5-5', true],
        ['no structured output', lines(init(), assistant(), result({ structured_output: undefined })), 'the reader returned no structured output', true],
    ];
    for (const [name, stdout, reason, charged] of failing) {
        const outcome = claudeOutcome(stdout, 's1', claude);
        expect(outcome, name).toMatchObject({ ok: false, reason });
        expect(outcome.receipt !== null, name).toBe(charged);
    }
});

function codexRun(options: { rollouts?: string[]; last?: string | null; version?: string; model?: string; effort?: string } = {}) {
    const run = createRunDirectories(validateRunnerRoot(join(tempDir(), 'runner'), {}), randomUUID());
    const day = join(run.provider, 'sessions', '2026', '11', '27');
    mkdirSync(day, { recursive: true });
    for (const [index, thread] of (options.rollouts ?? ['t1']).entries())
        writeFileSync(join(day, `rollout-${index}-${thread}.jsonl`), rollout(thread, [{ input: 100, output: 10 }], { model: options.model ?? 'gpt-6-astra', effort: options.effort ?? 'high' })
            .replace('"cli_version":"0.163.0"', `"cli_version":"${options.version ?? '0.167.0-alpha.4.1'}"`));
    if (options.last !== null) writeFileSync(join(run.tmp, 'last-message.json'), options.last ?? '{"verdict":"x"}');
    return run;
}
const started = { type: 'thread.started', thread_id: 't1' }, completed = { type: 'turn.completed' };

test('a Codex verdict needs one start, a completed turn, exactly one matching rollout and its last message', () => {
    expect(codexOutcome(lines(started, completed), 't1', codexRun(), codex)).toMatchObject({ ok: true, output: { verdict: 'x' }, receipt: { evidenceId: 't1', cost: { completeness: 'complete' } } });
    const failing: [string, string, ReturnType<typeof codexRun>, string][] = [
        ['two starts', lines(started, { type: 'thread.started', thread_id: 't2' }, completed), codexRun(), 'the provider reported more than one session'],
        ['an unexplained thread', lines(started, completed), codexRun({ rollouts: ['t1', 't7'] }), 'the reader left activity on a thread it was not started for'],
        ['no completed turn', lines(started), codexRun(), 'the reader turn did not complete'],
        ['a failed turn', lines(started, completed, { type: 'turn.failed' }), codexRun(), 'the reader turn did not complete'],
        ['no rollout', lines(started, completed), codexRun({ rollouts: [] }), 'no single rollout accounts for the session'],
        ['another version', lines(started, completed), codexRun({ version: '0.171.0' }), 'the rollout was written by 0.171.0, not 0.167.0-alpha.4.1'],
        ['another model', lines(started, completed), codexRun({ model: 'gpt-other' }), 'the reader ran another model or effort than selected'],
        ['another effort', lines(started, completed), codexRun({ effort: 'low' }), 'the reader ran another model or effort than selected'],
        ['no last message', lines(started, completed), codexRun({ last: null }), 'the reader left no last message'],
        ['a last message that is not JSON', lines(started, completed), codexRun({ last: 'not json' }), 'the last message is not JSON'],
    ];
    for (const [name, stdout, run, reason] of failing) expect(codexOutcome(stdout, 't1', run, codex), name).toMatchObject({ ok: false, reason });
    // An extra thread is also a coverage gap, so its charge cannot be finalized from the parent alone.
    const extra = codexOutcome(lines(started, completed), 't1', codexRun({ rollouts: ['t1', 't7'] }), codex);
    expect(extra.receipt?.cost?.completeness).not.toBe('complete');
});
