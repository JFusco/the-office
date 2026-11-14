import { afterEach, expect, test, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sessionContextFile } from '../../../server/workers/session-context-file';
import { SessionContextDeadline } from '../../../server/workers/session-context-deadline';
import { sessionInventoryFailureDetail } from '../../../server/workers/session-inventory-failure';
import { sessionScope, sessionScopeParser } from '../../../server/workers/session-scope';

vi.mock('../../../server/workers/session-context-snapshot', () => ({
    withSessionContextSnapshot: async () => { throw new Error('Session context scan exceeded its read deadline'); },
}));
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

test('a snapshot deadline identifies its exact session and phase while coverage still fails closed', async () => {
    const root = await mkdtemp(join(tmpdir(), 'office-context-deadline-')); roots.push(root);
    const file = join(root, 'private.jsonl'); await writeFile(file, 'private transcript material');
    const id = '12345678-1234-4abc-8def-123456789abc';
    const error = await sessionContextFile(root, sessionScope, sessionScopeParser)(file, id, []).catch(error => error);
    expect(error).toBeInstanceOf(SessionContextDeadline);
    const detail = sessionInventoryFailureDetail(error);
    expect(detail).toContain(`[context-deadline]`); expect(detail).toContain(`Session ${id}; phase snapshot; 27 bytes;`);
    expect(detail).toContain('Ownership remains unverified'); expect(detail).not.toContain(root); expect(detail).not.toContain('private transcript material');
});

test('diagnostics never echo a noncanonical session identity or arbitrary native error text', () => {
    const secret = '/private/transcript?token=not-for-output';
    expect(sessionInventoryFailureDetail(new SessionContextDeadline(secret, 'fold', 5010.2, 1024))).toContain('Session unavailable; phase fold; 1024 bytes; 5010 ms.');
    expect(sessionInventoryFailureDetail(new SessionContextDeadline(secret, 'fold', 5010.2, 1024))).not.toContain(secret);
    expect(sessionInventoryFailureDetail(new Error(secret))).not.toContain(secret);
    const invalid = sessionInventoryFailureDetail(new SessionContextDeadline(secret, secret as never, Infinity, NaN,
        { phaseMS: -1, activeMS: Infinity, idleMS: NaN }));
    expect(invalid).not.toContain(secret); expect(invalid).toContain('phase unavailable; 0 bytes; 0 ms. Phase 0 ms; event loop 0 active/0 idle ms.');
});
