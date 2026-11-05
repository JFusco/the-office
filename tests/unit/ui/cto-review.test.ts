import { createElement } from 'react';
import { expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewText, reviewExcerpt } from '../../../src/leadership/ReviewText';
import { CTOReview } from '../../../src/leadership/CTOReview';

test('review copy renders separate bullets and safe readable links, never source HTML', () => {
  const html = renderToStaticMarkup(createElement(ReviewText, { text: '- **Brain:** Maintenance complete.\n- CMS: Read [PR 12](https://github.com/example/repo/pull/12).\n\n<script>alert(1)</script> [unsafe](javascript:alert)' }));
  expect(html).toContain('<ul'); expect(html.match(/<li>/g)).toHaveLength(2);
  expect(html).toContain('<strong>Brain:</strong>');
  expect(html).toContain('href="https://github.com/example/repo/pull/12"');
  expect(html).not.toContain('<script>'); expect(html).not.toContain('href="javascript:');
});
test('previews are bounded without mutating original technical evidence', () => {
  const text = 'Read [PR 12](https://github.com/example/repo/pull/12). ' + 'Retained evidence. '.repeat(60);
  expect(reviewExcerpt(text).length).toBeLessThanOrEqual(281);
  expect(reviewExcerpt(text)).toContain('Read PR 12.'); expect(reviewExcerpt(text)).toMatch(/…$/);
});
test('legacy reports show named goal updates and preserve technical detail in closed disclosures', () => {
  const report: any = { detail: '', collectedAt: '2026-11-03T22:00:00Z', conflicts: [], facts: { projects: [{ projectId: 'cec', project: 'CEC', goals: [{ id: 'g', title: 'Content gap scan' }] }] }, result: { summary: 'Long historical evidence. '.repeat(100), updates: [{ projectId: 'cec', goalId: 'g', status: null, progress: 'The comparison is ready for review.', rationale: 'Exact commit and acceptance evidence retained.', blockers: ['Need the approved design.'] }], unmapped: [] } };
  const html = renderToStaticMarkup(createElement(CTOReview, { report }));
  expect(html).toContain('Content gap scan'); expect(html).toContain('Need the approved design.');
  expect(html).toContain('Original detailed assessment'); expect(html).toContain('Exact commit and acceptance evidence retained.');
  expect(html).not.toContain('<details open');
});

test('rewritten historical reviews show concise named goals and distinguish current completion', () => {
  const report: any = { detail: 'Original evidence', collectedAt: '2026-11-01T22:00:00Z', conflicts: [], facts: { projects: [{ projectId: 'cec', project: 'CEC', goals: [{ id: 'g', title: 'Create Figma frames from Conductor', status: 'active' }] }] }, result: { summary: 'Original evidence', updates: [{ projectId: 'cec', goalId: 'g', status: 'active', progress: 'Original long progress', rationale: 'Original proof', blockers: ['Original blocker'] }], unmapped: [] }, briefing: { summary: '- No goal completed in this review.', goals: [{ projectId: 'cec', goalId: 'g', progress: 'Hosted frame creation worked.', blockers: ['Recovery cases still needed acceptance.'] }] } };
  const html = renderToStaticMarkup(createElement(CTOReview, { report, currentGoals: [{ id: 'g', projectId: 'cec', status: 'done', requestId: 'human' } as any] }));
  expect(html).toContain('Create Figma frames from Conductor');
  expect(html).toContain('At this review: In progress');
  expect(html).toContain('Now: Goal complete · Accepted by Joe');
  expect(html).toContain('Hosted frame creation worked.');
  expect(html).toContain('Recovery cases still needed acceptance.');
  expect(html).toMatch(/<details[^>]*>.*Original long progress/);
});

test.each([{ applied: undefined }, { applied: [] }, { applied: ['brain:g'] }, { applied: ['cec:g'] }])('historical completion requires the owning goal in applied: $applied', ({ applied }) => {
  const accepted = applied?.includes('cec:g');
  const conflict = 'cec:g: Proposed status lacks scope acceptance, started work or blocker evidence';
  const report: any = { status: accepted ? 'completed' : 'conflicted', applied, detail: '', collectedAt: '2026-11-03T22:00:00Z', conflicts: accepted ? [] : [conflict], facts: { projects: [{ projectId: 'cec', project: 'CEC', goals: [{ id: 'g', title: 'Deliver the integration', status: 'active' }] }] }, result: { summary: 'Scope reviewed.', updates: [{ projectId: 'cec', goalId: 'g', status: 'done', progress: 'Proposed completion.', rationale: 'Original proposal evidence.', blockers: [] }], unmapped: [] } };
  const before = structuredClone(report);
  const html = renderToStaticMarkup(createElement(CTOReview, { report, currentGoals: [{ id: 'g', projectId: 'cec', status: accepted ? 'done' : 'active' } as any] }));
  expect(html).toContain(`At this review: ${accepted ? 'Goal complete' : 'In progress'}`);
  if (!accepted) {
    expect(html).not.toContain('Goal complete');
    expect(html).toContain(conflict);
  }
  expect(html).toContain('Proposed completion.');
  expect(html).toContain('Original proposal evidence.');
  expect(report).toEqual(before);
});
