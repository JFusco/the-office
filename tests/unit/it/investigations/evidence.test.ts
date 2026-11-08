import { expect, test } from 'vitest';
import { mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { investigationEvidence } from '../../../../server/it/investigations/evidence';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { investigationFixture } from './fixture';

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
