import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { investigationEvidence } from '../../../../server/it/investigations/evidence';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';
import { diagnostic } from '../../workers/lifecycle/fixture';

test('packet includes bounded whitelisted artifacts and drops transcript, private extra fields and symlinks', () => {
    const f = investigationFixture(); try {
        const dir = resolve(f.root, 'sessions/sender'); mkdirSync(dir, { recursive: true });
        writeFileSync(resolve(dir, 'error.json'), JSON.stringify({ at: 'now', error: 'Synthetic error', secretExtra: 'PRIVATE_EXTRA' }));
        writeFileSync(resolve(dir, 'provider-turns.jsonl'), 'PRIVATE_TRANSCRIPT');
        symlinkSync(resolve(dir, 'error.json'), resolve(dir, 'execution-completion.json'));
        syncInvestigations(f.store); const packet = investigationEvidence(f.store, f.store.state.it!.investigations![0]);
        expect(packet.evidence.map(e => e.ref)).toContain('artifact:sender/error.json');
        expect(JSON.stringify(packet)).not.toMatch(/PRIVATE_EXTRA|PRIVATE_TRANSCRIPT|execution-completion/);
        writeFileSync(resolve(dir, 'error.json'), 'x'.repeat(17000));
        expect(investigationEvidence(f.store, f.store.state.it!.investigations![0]).evidence.map(e => e.ref)).not.toContain('artifact:sender/error.json');
    } finally { f.close(); }
});

test('Ellis receives validated lifecycle facts with artifact hash, never private additions or malformed data', () => {
    const f = investigationFixture(); try {
        const dir = resolve(f.root, 'sessions/sender'); mkdirSync(dir, { recursive: true });
        const path = resolve(dir, 'process-lifecycle.json'); writeFileSync(path, JSON.stringify({ ...diagnostic(), env: 'PRIVATE_ENV' }));
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0];
        const packet = investigationEvidence(f.store, entry), artifact = packet.evidence.find(e => e.ref === 'artifact:sender/process-lifecycle.json');
        expect(artifact?.facts).toMatchObject({ sha256: expect.stringMatching(/^[a-f0-9]{64}$/), providerTerminalObserved: true, failureCategory: 'uncertain-effect' });
        expect(JSON.stringify(packet)).not.toContain('PRIVATE_ENV');
        writeFileSync(path, '{"version":1}'); expect(investigationEvidence(f.store, entry).evidence.map(e => e.ref)).not.toContain('artifact:sender/process-lifecycle.json');
    } finally { f.close(); }
});
