import { DatabaseSync } from 'node:sqlite';
import { expect, test } from 'vitest';
import { PreferencesStore } from '../../../../server/office/preferences-store';
import { preferencesRoute } from '../../../../server/office/http/preferences';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../../src/shared';

const context = () => ({ preferences: new PreferencesStore(new DatabaseSync(':memory:')), serviceInstanceId: 'fixture-instance' });
const call = (ctx: ReturnType<typeof context>, init?: RequestInit, path = '/api/preferences') => preferencesRoute(new Request('http://local' + path, init), new URL('http://local' + path), ctx);
const post = (ctx: ReturnType<typeof context>, body: string, headers: Record<string, string> = { 'Content-Type': 'application/json' }) => call(ctx, { method: 'POST', body, headers });

test('ignores other paths and returns preferences with the service identity', async () => {
    const ctx = context();
    expect(await call(ctx, undefined, '/api/office')).toBeUndefined();
    const response = (await call(ctx))!;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, serviceInstanceId: 'fixture-instance' });
});
test('POST commits a partial patch and returns the complete preferences with the next revision', async () => {
    const ctx = context(), response = (await post(ctx, JSON.stringify({ coffeeBreaks: false })))!;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, coffeeBreaks: false, revision: 1, serviceInstanceId: 'fixture-instance' });
});
test('rejects malformed, unknown, client-owned and empty input with 400', async () => {
    const ctx = context();
    for (const body of ['{', '{}', '{"revision":3}', '{"serviceInstanceId":"x"}', '{"quality":"ultra"}', '{"theme":"dark"}']) {
        const response = (await post(ctx, body))!;
        expect(response.status, body).toBe(400);
        expect(typeof (await response.json()).error).toBe('string');
    }
    expect(ctx.preferences.read().revision).toBe(0);
});
test('enforces the 4096-byte limit from Content-Length and from the actual body', async () => {
    const ctx = context(), large = JSON.stringify({ quality: 'low', pad: 'x'.repeat(5000) });
    expect((await post(ctx, '{"quality":"low"}', { 'Content-Length': '5000' }))!.status).toBe(413);
    expect((await post(ctx, large, {}))!.status).toBe(413);
    expect(ctx.preferences.read().revision).toBe(0);
});
test('rejects unsupported methods and lets storage failures reach the service error boundary', async () => {
    const ctx = context();
    expect((await call(ctx, { method: 'DELETE' }))!.status).toBe(405);
    const broken = { ...ctx, preferences: { read: () => { throw new Error('disk unavailable'); }, patch: () => { throw new Error('disk unavailable'); } } as unknown as PreferencesStore };
    await expect(call(broken)).rejects.toThrow('disk unavailable');
});
