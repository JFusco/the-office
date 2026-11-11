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

it('leads with the advice of a real note shape and falls back when the heading is absent', () => {
    const note = `---\ntitle: Await dynamic parameters\n---\n# Await dynamic parameters\n\n## When to use this\n\n${'Applies to App Router route handlers. '.repeat(20)}\n\n## What to do\n\nAwait params before reading a segment.\n\n## Evidence and limits\n\nChecked against the installed release.`;
    const excerpt = guidanceExcerpt(note);
    expect(excerpt).toBe('Await params before reading a segment.');
    expect(boundEvidence({ office: [], technical: [{ reference: { kind: 'brain', id: 'note', contentSha256: 'a'.repeat(64) }, scope: 'technical', title: 'Await dynamic parameters', excerpt, citation: 'knowledge/nextjs/async-route-parameters.md', limitations: [] }], snapshot: 'b'.repeat(40), technicalStatus: 'available', truncated: false }).text).toContain('Await params before reading a segment.');
    expect(guidanceExcerpt('# Title\n\n## When to use this\n\nOnly applicability.')).toBe('## When to use this\n\nOnly applicability.');
    expect(guidanceExcerpt('# Title\n\n## What to do\n\n## Evidence and limits\n\nEmpty advice keeps the whole body.')).toContain('Empty advice keeps the whole body.');
    expect(guidanceExcerpt('# Title\n\n## What to do\n\nLast section runs to the end.')).toBe('Last section runs to the end.');
});
