import { expect, test } from 'vitest';
import { ControlStore } from '../../../server/store/control-store';
import { saveReviewBriefing } from '../../../server/leadership/save-review-briefing';

function fixture() {
    const store = new ControlStore(':memory:');
    const queued = store.enqueue('2026-11-01', '2026-11-01T22:00:00Z', { projects: [{ projectId: 'cec', goals: [{ id: 'frame', title: 'Create Figma frames', status: 'active', mapping: 'mapped' }] }] });
    const report = store.update(queued.id, queued.revision, item => { item.status = 'completed'; item.detail = 'Original technical assessment'; item.result = { summary: item.detail, updates: [], unmapped: [] }; });
    const briefing = { summary: '- Create Figma frames: still active; hosted acceptance missing. No goal completed.', goals: [{ projectId: 'cec', goalId: 'frame', progress: 'Frame creation works locally.', blockers: ['Next: verify hosted acceptance.'] }] };
    return { store, report, briefing };
}
test('reformats the visible summary while retaining original assessment and goal evidence', () => {
    const { store, report, briefing } = fixture();
    try {
        const updated = saveReviewBriefing(store, report.id, report.revision, briefing);
        expect(updated.briefing).toEqual(briefing);
        expect({ ...updated, revision: report.revision, briefing: undefined }).toEqual({ ...report, briefing: undefined });
        expect(store.summaries()[0].detail).toBe(briefing.summary);
        expect(store.get(report.id)?.result?.summary).toBe('Original technical assessment');
    } finally { store.close(); }
});
test('rejects omitted, duplicated, foreign, verbose or stale rewrites without changing saved data', () => {
    const { store, report, briefing } = fixture();
    try {
        for (const goals of [[], [...briefing.goals, ...briefing.goals], [{ ...briefing.goals[0], projectId: 'brain' }], [{ ...briefing.goals[0], progress: 'x'.repeat(351) }]]) {
            expect(() => saveReviewBriefing(store, report.id, report.revision, { ...briefing, goals })).toThrow();
            expect(store.get(report.id)).toEqual(report);
        }
        expect(() => saveReviewBriefing(store, report.id, report.revision - 1, briefing)).toThrow(/changed/);
    } finally { store.close(); }
});
test('does not rewrite a review that is still running', () => {
    const { store, report, briefing } = fixture();
    try {
        const running = store.update(report.id, report.revision, item => { item.status = 'working'; });
        expect(() => saveReviewBriefing(store, running.id, running.revision, briefing)).toThrow(/finished/);
    } finally { store.close(); }
});
