import { expect, test } from 'vitest';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { intakeFixture } from './fixture';
import { readLocalIntakeReport } from '../../../../server/knowledge/slack-intake/local-report';
test('local private report reads reject other projects, traversal and symlinked reports', () => {
    const f = intakeFixture();
    try {
        const folder = resolve(f.store.dataRoot, 'slack-intake/reports'); mkdirSync(folder);
        writeFileSync(resolve(folder, 'intake-2026-11-06.json'), '{"private":"report"}', { mode: 0o600 });
        expect(readLocalIntakeReport('brain', 'intake-2026-11-06', f.store.dataRoot)).toContain('report');
        expect(() => readLocalIntakeReport('other', 'intake-2026-11-06', f.store.dataRoot)).toThrow();
        expect(() => readLocalIntakeReport('brain', '../report', f.store.dataRoot)).toThrow();
        symlinkSync(resolve(folder, 'intake-2026-11-06.json'), resolve(folder, 'intake-2026-11-13.json'));
        expect(() => readLocalIntakeReport('brain', 'intake-2026-11-13', f.store.dataRoot)).toThrow(/symlink/);
    } finally { f.close(); }
});
