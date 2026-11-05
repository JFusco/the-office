import { expect, test } from 'vitest';
import { dailyReviewPrompt } from '../../../server/leadership/daily-review-prompt';
import { DailyResultSchema, FreshDailyResultSchema } from '../../../server/leadership/goal-reviews';

test('brief writing preserves immutable facts and the full acceptance contract', () => {
  const facts = { projects: [{ projectId: 'cec', goals: [{ id: 'human-goal' }] }] };
  const prompt = dailyReviewPrompt({ date: '2026-11-04', collectedAt: '2026-11-04T22:00:00Z', facts } as any);
  expect(prompt).toContain('at most 120 words and 1500 characters');
  expect(prompt).toContain('Treat open and draft PRs as pending implementation evidence');
  expect(prompt).toContain('Decision needed bullet only when Joe actually needs to decide');
  expect(prompt).toContain('ENTIRE human goal scope');
  expect(prompt).toContain(`Facts: ${JSON.stringify(facts)}`);
});
test('new assessments are bounded while historical detailed reviews remain readable', () => {
  const result = { summary: 'A'.repeat(1501), updates: [], unmapped: [], evidenceRequests: [] };
  expect(FreshDailyResultSchema.safeParse(result).success).toBe(false);
  expect(DailyResultSchema.safeParse(result).success).toBe(true);
  expect(FreshDailyResultSchema.safeParse({ ...result, summary: '- Brain: Maintenance completed.\n- CMS: One upstream dependency remains blocked.' }).success).toBe(true);
});
