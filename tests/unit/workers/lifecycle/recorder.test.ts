import { expect, test } from 'vitest';
import { lifecycleRecorder } from '../../../../server/workers/lifecycle/recorder';
import { at, row } from './fixture';
test('records terminal observation and cleanup facts without provider content or relaxed disposition', async () => {
    const r = lifecycleRecorder(100, async () => row(), () => at); let sent = false;
    r.line('{"type":"turn.completed","text":"PRIVATE"}'); r.exit(0, null); r.close(0, null);
    r.probe({ state: 'unknown', errno: 'EPERM' }); r.probe({ state: 'unknown', errno: 'EPERM' });
    r.signal('term', () => { sent = true; throw { code: 'EPERM', message: 'PRIVATE' }; });
    expect(sent).toBe(true); r.signal('kill', () => {}); r.probe({ state: 'absent', errno: 'ESRCH' });
    const d = (await r.finish('uncertain-effect'))!;
    expect(d).toMatchObject({ providerTerminalObserved: true, outcome: 'failed', failureCategory: 'uncertain-effect', probeCount: 3 });
    expect(d.events.filter(e => e.phase === 'probe')).toHaveLength(2);
    expect(d.events).toContainEqual({ at, phase: 'term', errno: 'EPERM' });
    expect(d.snapshots).toHaveLength(5); expect(JSON.stringify(d)).not.toContain('PRIVATE');
});
test('normal completion creates no artifact; failed observation remains bounded and cannot delay signaling', async () => {
    const clean = lifecycleRecorder(100, async () => '', () => at); clean.exit(0, null); expect(await clean.finish()).toBeUndefined();
    const r = lifecycleRecorder(100, () => new Promise(() => {}), () => at); let sent = false;
    for (let i = 0; i < 100; i++) r.probe({ state: i % 2 ? 'alive' : 'unknown' });
    r.signal('kill', () => { sent = true; }); expect(sent).toBe(true);
    const d = (await r.finish('other'))!; expect(d.events).toHaveLength(24); expect(d.omittedEvents).toBeGreaterThan(0);
    expect(d.snapshots.every(s => s.status === 'unavailable')).toBe(true);
});
