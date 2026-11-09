import { createElement } from 'react';
import { test, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BlockerFollowups } from '../../../src/knowledge/BlockerFollowups';
import { ResearchSummary } from '../../../src/knowledge/ResearchSummary';
import { LessonsPanel } from '../../../src/knowledge/LessonsPanel';
import { knowledgeStore, learningLesson } from '../knowledge/knowledge-fixture';
import { learningMetrics } from '../../../server/knowledge/learning-metrics';
test('weekly status labels partial coverage and never displays unavailable zeros as measured absence', () => {
    const f = knowledgeStore();
    try {
        const k = f.store.state.knowledge!; k.learningStartedAt = '2026-11-03T12:00:00Z';
        const render = (from: string, to: string) => renderToStaticMarkup(createElement(ResearchSummary, { rollup: { learning: learningMetrics(k, from, to) } as never }));
        const unavailable = render('2026-10-23', '2026-10-30');
        expect(unavailable).toContain('Learning coverage unavailable'); expect(unavailable).not.toContain('Recorded assignments:');
        const partial = render('2026-10-30', '2026-11-06');
        expect(partial).toContain('Partial learning coverage'); expect(partial).toContain(k.learningStartedAt); expect(partial).toContain('Recorded assignments:');
        expect(render('2026-11-06', '2026-11-13')).not.toContain('Partial learning coverage');
    } finally { f.close(); }
});
test('needs-review guidance offers keep, demote and retire; ordinary active guidance offers only retire', () => {
    const f = knowledgeStore();
    try {
        f.store.state.knowledge!.lessons = [learningLesson('L1', { statement: 'Flagged guidance', needsReview: true }), learningLesson('L2', { statement: 'Steady guidance' })];
        const snapshot = { knowledge: f.store.state.knowledge, project: { id: 'brain', provider: 'github' }, agents: [], mode: 'live' } as never;
        const html = renderToStaticMarkup(createElement(LessonsPanel, { snapshot }));
        expect(html).toContain('aria-label="Keep lesson and start a new review interval: Flagged guidance"');
        expect(html).toContain('aria-label="Demote lesson to hypothesis: Flagged guidance"');
        expect(html).toContain('aria-label="Retire lesson: Flagged guidance"');
        expect(html).toContain('aria-label="Retire lesson: Steady guidance"');
        expect(html).not.toContain('Keep lesson and start a new review interval: Steady guidance');
        expect(html).not.toContain('Demote lesson to hypothesis: Steady guidance');
    } finally { f.close(); }
});
test('a demoted hypothesis leaves the active count and is listed as report-only with its retire action', () => {
    const f = knowledgeStore();
    try {
        f.store.state.knowledge!.lessons = [learningLesson('L1', { statement: 'Demoted idea', tier: 'hypothesis', revision: 2 }), learningLesson('L2', { statement: 'Steady guidance' })];
        const snapshot = { knowledge: f.store.state.knowledge, project: { id: 'brain', provider: 'github' }, agents: [], mode: 'live' } as never;
        const html = renderToStaticMarkup(createElement(LessonsPanel, { snapshot }));
        const active = html.indexOf('Active lessons'), hypotheses = html.indexOf('Hypotheses (reports only; not supplied to prompts)');
        expect(html.slice(active, active + 200)).toMatch(/Active lessons <[^>]*>1</);
        expect(hypotheses).toBeGreaterThan(active);
        expect(html.slice(active, hypotheses)).not.toContain('Demoted idea');
        expect(html.slice(hypotheses)).toContain('aria-label="Retire lesson: Demoted idea"');
    } finally { f.close(); }
});
test('blockers preserve source disposition and uncertain publication; legacy reports do not claim exposure', () => {
    const f = knowledgeStore();
    try {
        f.store.state.knowledge!.followups = [{ id: 'incident', source: { kind: 'message', id: 'original' }, key: '', owner: 'Morgan', nextAction: 'Read the original receipt', disposition: 'unknown', history: [{ at: '2026-11-01', disposition: 'unresolved', fingerprint: '' }], evidence: [{ kind: 'learning', ref: 'proof', url: '', detail: 'Original response lost' }] } as never];
        f.store.state.knowledge!.improvements = [{ id: 'fix', change: 'Fix marker', status: 'uncertain', detail: 'No resend' } as never];
        const html = renderToStaticMarkup(createElement(BlockerFollowups, { knowledge: f.store.state.knowledge }));
        expect(html).toContain('Original response lost'); expect(html).toContain('unknown'); expect(html).toContain('uncertain'); expect(html).not.toContain('<button');
        expect(renderToStaticMarkup(createElement(ResearchSummary, { rollup: {} as never }))).toContain('Legacy report: exposure coverage unavailable');
    } finally { f.close(); }
});
