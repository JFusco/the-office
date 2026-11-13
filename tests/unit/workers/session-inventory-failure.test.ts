import { expect, test } from 'vitest';
import { sessionInventoryFailureDetail } from '../../../server/workers/session-inventory-failure';
import { ContextReadChanged } from '../../../server/workers/session-context-lines';
import { SessionBridge } from '../../../server/workers/session-bridge';

test.each([
    [new ContextReadChanged('private transcript text'), 'context-changing'],
    [new Error('Codex session context contains an incomplete record'), 'context-record'],
    [new Error('Session context scan exceeded its read deadline'), 'context-deadline'],
    [new Error('A live Codex session has no metadata'), 'session-metadata'],
    [new Error('Session context file identity changed during its read'), 'context-identity'],
    [new Error('Session context record coverage is unavailable'), 'context-record-limit'],
    [Object.assign(new Error('/private/context.jsonl'), { code: 'ENOENT' }), 'inventory-missing'],
    [Object.assign(new Error('Bearer private-token'), { code: 'EPERM' }), 'inventory-permission'],
    [Object.assign(new Error('private database contents'), { code: 'ERR_SQLITE_ERROR' }), 'metadata-database'],
    [new Error('lsof exited 1: private stderr /Users/private'), 'descriptor-read'],
])('known failure exposes a fixed safe category and keeps ownership unverified (%s)', (error, category) => {
    const detail = sessionInventoryFailureDetail(error);
    expect(detail).toContain(`[${category}]`); expect(detail).toContain('Ownership remains unverified');
    expect(detail).not.toMatch(/private|Bearer|\/Users|\/context\.jsonl/);
});
test('unrecognized failures reveal no raw context, stderr or credentials', () => {
    expect(sessionInventoryFailureDetail(new Error('private secret=anything /Users/private'))).toBe('Session inventory could not complete. Ownership remains unverified; this does not establish a login failure.');
});
test('the real bridge projection reports the safe cause while failed coverage remains unavailable', async () => {
    const store: any = { project: { id: 'cec', repo: '/cec', repository: 'fixture' }, state: { workLog: [], coordination: { jobs: [] } } };
    const bridge = new SessionBridge(() => [store], async program => program === 'claude' ? '[]' : '/cec/.git',
        async () => [], async () => { throw new Error('A live Codex session has no metadata'); });
    await bridge.refresh(); const view = bridge.forProject(store, 'CEC-900');
    expect(view.complete).toBe(false); expect(view.ownership.status).toBe('unavailable');
    expect(view.sources[2]).toMatchObject({ ok: false, detail: expect.stringContaining('[session-metadata]') });
});
