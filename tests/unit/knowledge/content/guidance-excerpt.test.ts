import { expect, it } from 'vitest';
import { guidanceExcerpt } from '../../../../server/knowledge/content/guidance-excerpt';
import { boundEvidence } from '../../../../server/knowledge/task-briefing';

it('spends future briefing space on committed guidance instead of long metadata', () => {
    const raw = `---\ntitle: Schema guide\nprovenance: "${'metadata '.repeat(180)}"\n---\n# Schema guide\n\n## What to do\n\nVerify the installed schema before changing mappings.\n${'More guidance. '.repeat(100)}`;
    const excerpt = guidanceExcerpt(raw);
    expect(excerpt).toContain('Verify the installed schema'); expect(excerpt).not.toContain('provenance:'); expect(excerpt.length).toBeLessThanOrEqual(1000);
    const briefing = boundEvidence({ office: [], technical: [{ reference: { kind: 'brain', id: 'committed-note', contentSha256: 'a'.repeat(64) }, scope: 'technical', title: 'Schema guide', excerpt, citation: 'knowledge/schema.md', limitations: [] }], snapshot: 'b'.repeat(40), technicalStatus: 'available', truncated: false });
    expect(briefing.text).toContain('Verify the installed schema'); expect(briefing.text.length).toBeLessThanOrEqual(3000);
    expect(guidanceExcerpt('---\ntitle: only metadata\n---')).toBe(''); expect(guidanceExcerpt('---\ntitle: "unfinished')).toBe('');
});
