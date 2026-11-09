import { test, expect } from 'vitest';
import { installedLesson } from '../../../server/knowledge/lesson-procedures';
import { learningLesson } from './knowledge-fixture';
test('only reviewed registrations can describe installed procedure or rule authority', () => {
    expect(installedLesson(learningLesson('p', { tier: 'procedure', implementationRef: 'model-invented-command' }))).toBe(false);
    expect(installedLesson(learningLesson('p', { tier: 'procedure', implementationRef: 'server/knowledge/blocker-followups.ts#check-it' }))).toBe(true);
    expect(installedLesson(learningLesson('p', { tier: 'rule', implementationRef: 'server/knowledge/blocker-followups.ts#check-it' }))).toBe(false);
});
