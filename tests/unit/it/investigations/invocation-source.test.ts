import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ROOT } from '../../../../server/office/config';
import { invocationSource, INVOCATION_SOURCE_REFS } from '../../../../server/it/investigations/invocation-source';
import { officeSource } from '../../../../server/it/investigations/office-source';

test('loaded caller and actual option wiring fit the original source budget with exact provenance', () => {
    const rows = invocationSource();
    expect(rows.map(row => row.ref)).toEqual(INVOCATION_SOURCE_REFS);
    for (const row of rows) {
        const full = readFileSync(`${ROOT}/${row.facts.path}`, 'utf8');
        expect(createHash('sha256').update(full).digest('hex')).toBe(row.facts.sourceSha256);
        const lines = full.split('\n').slice(row.facts.firstLine - 1, row.facts.endLine);
        lines[lines.length - 1] = lines.at(-1)!.slice(0, row.facts.endColumn);
        expect(lines.join('\n')).toBe(row.facts.code);
        expect(row.facts.provenance).toBe('current-loaded-source-not-historical-launch');
    }
    expect(rows[0].facts.code).toContain('slackSend: true');
    expect(rows[2].facts.code).toContain('...launchPolicy');
    expect(rows[2].facts.code).toContain('env: environment');
    const combined = officeSource();
    expect(INVOCATION_SOURCE_REFS.every(ref => combined.some(row => row.ref === ref))).toBe(true);
    expect(combined.reduce((sum, row) => sum + Buffer.byteLength(row.facts.code), 0)).toBeLessThanOrEqual(24000);
});
test('unsafe, absent, ambiguous and excessive source excerpts never become evidence', () => {
    expect(invocationSource('/synthetic', () => ({ reason: 'symlink' }))).toEqual([]);
    const read = (text: string) => invocationSource('/synthetic', path => ({ path, sha256: 'a'.repeat(64), text }));
    expect(read('unrelated source')).toEqual([]);
    expect(read('    async sendSlack(\n    async sendSlack(\n    async verifySlack(')).toEqual([]);
    expect(read('    async sendSlack(' + 'x'.repeat(4100) + '    async verifySlack(')).toEqual([]);
});
