import { expect, test } from 'vitest';
import { staleRefreshRefusal, validStaleProof } from '../../../../server/delivery/publication/stale-description-proof';
import { digest } from '../../../../server/store/readback-evidence';
import { INCIDENTS, RUN } from '../../../fixtures/stale-description';

const i = INCIDENTS['GH-193'], before = { title: i.title, body: '## Summary\nOld.\nCloses #193\n' };
const proof = { route: 'stale-own-description' as const, head: i.published, source: { kind: 'maintenance' as const, runId: RUN, step: 5, workerId: i.draft.worker },
    contentSha256: digest(before), revision: { sha256: 'a'.repeat(64), edits: 0, lastEditId: null, lastEditedAt: null } };
const binding = (staleDescription?: unknown): any => ({ head: i.head, before, beforeSha256: digest(before), ...(staleDescription === undefined ? {} : { staleDescription }) });

test('a binding without the proof keeps its earlier shape; a saved proof must be exactly the takeover\'s', () => {
    expect(validStaleProof(binding())).toBe(true);
    expect(validStaleProof({ ...binding(), staleDescription: undefined })).toBe(false);
    expect(validStaleProof(binding(proof))).toBe(true);
    expect(validStaleProof(binding({ ...proof, source: { kind: 'effect', effectId: 'harness:j:pr-create:x', operation: 'github-pr-create' } }))).toBe(true);
    for (const [name, change] of [
        ['the current head', { head: i.head }], ['a short head', { head: i.published.slice(0, 7) }], ['another route', { route: 'content' }],
        ['other bytes', { contentSha256: 'b'.repeat(64) }], ['an extra field', { note: 'x' }], ['a malformed revision', { revision: { sha256: 'x', edits: 0, lastEditId: null, lastEditedAt: null } }],
        ['an unknown source', { source: { kind: 'receipt', target: 'https://github.com/JFusco/cms-field-vocabulary/pull/194' } }],
        ['a source operation that writes no description', { source: { kind: 'effect', effectId: 'e', operation: 'github-pr-ready' } }],
    ] as const) expect(validStaleProof(binding({ ...proof, ...change })), name).toBe(false);
});

test('the refresh must select a changed body under the captured title', () => {
    expect(staleRefreshRefusal(binding(), null)).toBe('');
    expect(staleRefreshRefusal(binding(proof), { title: i.title, body: '## Summary\nNew.\nCloses #193\n' })).toBe('');
    expect(staleRefreshRefusal(binding(proof), null)).toMatch('selected no description');
    expect(staleRefreshRefusal(binding(proof), { ...before })).toMatch('left the body unchanged');
    expect(staleRefreshRefusal(binding(proof), { title: 'feat: retitled', body: '## Summary\nNew.\nCloses #193\n' })).toMatch('changed the title');
    expect(staleRefreshRefusal(binding(proof), { title: 'feat: retitled', body: before.body })).toMatch('changed the title');
});
