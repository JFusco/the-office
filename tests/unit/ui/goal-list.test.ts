import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { GoalList } from '../../../src/leadership/GoalList';
import type { ProjectGoal } from '../../../src/shared';

test('completed goals are retained in a closed section separate from current priorities', () => {
  const goals = [{ id: 'a', projectId: 'cec', project: 'CEC', title: 'Record videos', detail: 'Record the walkthrough.', priority: 2, status: 'planned' }, { id: 'b', projectId: 'cec', project: 'CEC', title: 'Ship integration', detail: 'Full scope. '.repeat(100), priority: 2, status: 'done' }] as ProjectGoal[];
  const html = renderToStaticMarkup(createElement(GoalList, { goals, disabled: false, onEdit: () => {} }));
  expect(html.indexOf('Record videos')).toBeLessThan(html.indexOf('<details'));
  expect(html.indexOf('Ship integration')).toBeGreaterThan(html.indexOf('<details'));
  expect(html).toContain('Completed (1)'); expect(html).not.toContain('<details open');
  expect(html).not.toContain(goals[1].detail);
  expect(goals[1].detail).toBe('Full scope. '.repeat(100));
});

test('human acceptance supersedes an older Avery progress note in the completed card', () => {
  const goal = { id: 'a', projectId: 'cec', project: 'CEC', title: 'Ship integration', detail: 'Accepted in production.', priority: 2, status: 'done', requestId: 'human', progress: { note: 'Retain active; no acceptance collected.' } } as ProjectGoal;
  const html = renderToStaticMarkup(createElement(GoalList, { goals: [goal], disabled: false, onEdit: () => {} }));
  expect(html).toContain('Accepted by Joe.');
  expect(html).not.toContain('Retain active');
});
