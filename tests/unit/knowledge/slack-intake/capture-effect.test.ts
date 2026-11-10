import { expect, test } from 'vitest';
import { cleanScan, config, intakeFixture } from './fixture';
import { configDigest, digest } from '../../../../server/knowledge/slack-intake/config';
import { captureProposal } from '../../../../server/knowledge/slack-intake/capture-effect';
import type { Proposal } from '../../../../server/knowledge/slack-intake/contracts';
import type { command } from '../../../../server/workers/process';
function proposal(f: ReturnType<typeof intakeFixture>): Proposal {
    const p: Proposal = { id: f.ledger.id(), task: f.task.id, domain: 'tooling', body: 'Private source body', hash: digest('Private source body'), units: [], sourceVersions: [], status: 'pending', configHash: '', sourceId: f.source.id, sourceDigest: f.policy.sourceDigest };
    f.ledger.put('proposal', p.id, p); return p;
}
test('successful capture is read back and a repeated handoff never dispatches twice', async () => {
    const f = intakeFixture();
    try {
        const p = proposal(f); let dispatches = 0, reads = 0;
        const execute = (async (_, args, options) => {
            if (args.includes('--stdin')) { dispatches++; expect(options?.input).toBe(p.body); } else reads++;
            return JSON.stringify({ found: true, requestId: p.id, id: 'candidate', domain: p.domain, inputSha256: p.hash, status: 'pending' });
        }) as typeof command;
        await captureProposal(f.store, f.policy, p.id, f.registry, execute); await captureProposal(f.store, f.policy, p.id, f.registry, execute);
        expect(dispatches).toBe(1); expect(reads).toBe(2); expect(f.ledger.get<Proposal>('proposal', p.id)?.status).toBe('captured');
        expect(JSON.stringify(f.store.state)).not.toContain(p.body);
        expect(JSON.stringify(f.store.getEffect(`slack-capture:${p.id}`))).not.toContain(p.body);
    } finally { f.close(); }
});
test('response loss reconciles only by a matching receipt, absent receipts never permit resend', async () => {
    const f = intakeFixture();
    try {
        const p = proposal(f); let writes = 0, exists = false;
        const execute = (async (_, args) => {
            if (args.includes('--stdin')) { writes++; throw Error('lost response'); }
            return JSON.stringify(exists ? { found: true, requestId: p.id, id: 'candidate', domain: p.domain, inputSha256: p.hash } : { found: false, requestId: p.id });
        }) as typeof command;
        await captureProposal(f.store, f.policy, p.id, f.registry, execute); await captureProposal(f.store, f.policy, p.id, f.registry, execute);
        expect(writes).toBe(1); expect(f.ledger.get<Proposal>('proposal', p.id)?.status).toBe('unresolved');
        exists = true; await captureProposal(f.store, f.policy, p.id, f.registry, execute);
        expect(writes).toBe(1); expect(f.ledger.get<Proposal>('proposal', p.id)?.status).toBe('captured');
    } finally { f.close(); }
});
test('only the independent read-back settles a capture, and a verified effect recovers without redispatch', async () => {
    const f = intakeFixture();
    try {
        const p = proposal(f); let dispatches = 0;
        const execute = (async (_, args) => {
            if (args.includes('--stdin')) { dispatches++; return JSON.stringify({ id: 'x' }); }
            return JSON.stringify({ found: true, requestId: p.id, id: 'candidate', domain: p.domain, inputSha256: p.hash, status: 'pending' });
        }) as typeof command;
        await captureProposal(f.store, f.policy, p.id, f.registry, execute);
        expect(f.ledger.get<Proposal>('proposal', p.id)?.status).toBe('captured'); expect(dispatches).toBe(1);
        await captureProposal(f.store, f.policy, p.id, f.registry, execute); expect(dispatches).toBe(1);

        const q = proposal(f); let reads = 0;
        const flaky = (async (_, args) => {
            if (args.includes('--stdin')) { dispatches++; return JSON.stringify({ id: 'y' }); }
            // The verify read-back succeeds; the settling read-back is lost.
            if (++reads === 2) throw Error('receipt store unavailable');
            return JSON.stringify({ found: true, requestId: q.id, id: 'candidate-2', domain: q.domain, inputSha256: q.hash });
        }) as typeof command;
        await captureProposal(f.store, f.policy, q.id, f.registry, flaky);
        const waiting = f.ledger.get<Proposal>('proposal', q.id)!;
        expect(f.store.getEffect(`slack-capture:${q.id}`)?.status).toBe('verified');
        expect(waiting.status).toBe('unresolved'); expect(Date.parse(waiting.nextAt!)).toBeGreaterThan(f.store.clock.now().getTime());
        f.advance(3600001);
        await captureProposal(f.store, f.policy, q.id, f.registry, flaky);
        expect(f.ledger.get<Proposal>('proposal', q.id)?.status).toBe('captured'); expect(dispatches).toBe(2);
    } finally { f.close(); }
});
test('paused submissions stay queued without creating a rejected effect', async () => {
    const f = intakeFixture();
    try {
        const p = proposal(f); f.store.state.paused = true;
        await captureProposal(f.store, f.policy, p.id, f.registry, (async () => { throw Error('must not run'); }) as typeof command);
        expect(f.store.getEffect(`slack-capture:${p.id}`)).toBeUndefined(); expect(f.ledger.get<Proposal>('proposal', p.id)?.status).toBe('pending');
    } finally { f.close(); }
});
