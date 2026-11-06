import { expect, test } from './fixture-test';
import { setPreferences } from './support';

const at = new Date().toISOString();
const lesson = (id: string, statement: string, status: 'active' | 'retired' = 'active') => ({ id, kind: 'pitfall', statement, detail: '', stages: ['implement'], paths: [], status, evidence: [{ kind: 'pr', ref: `pr:${id}`, url: 'https://github.com/JFusco/brain/pull/7', detail: 'PR #7' }], sourceRetrospectiveId: 'r1', createdAt: at, updatedAt: at });

test('Harper opens from the dock, retires a lesson with focus kept, and saves the retrospective setting', async ({ page, request }) => {
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  const brain = await (await request.get('/api/office?project=brain')).json();
  await request.post('/__fixture/snapshot?project=brain', { data: {
    agents: [...brain.agents, { id: 'knowledge', name: 'Harper', title: 'Knowledge engineer', activity: 'idle', task: 'Ready', ticket: '', sessionId: '', lastSeen: at }],
    knowledge: { enabled: true, consumed: [], pending: [], retrospectives: [], lessons: [lesson('l1', 'Regenerate the catalog before review'), lesson('l2', 'Retry the flaky link check once')] },
  } });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Visit Harper,/ })).toHaveCount(0); // CEC is not a GitHub project
  await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button', { name: 'Visit Harper, knowledge engineer, 2 lessons' }).click();
  const drawer = page.getByRole('complementary', { name: 'Knowledge engineer' });
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toContainText('2');

  await drawer.getByRole('button', { name: 'Retire lesson: Retry the flaky link check once' }).click();
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toContainText('1');
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toBeFocused();
  await expect(drawer.getByText('Retired (1)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Visit Harper, knowledge engineer, 1 lesson' })).toBeVisible();

  const save = drawer.getByRole('button', { name: 'Save', exact: true });
  await expect(save).toBeDisabled();
  await drawer.getByLabel('Let Harper write retrospectives for this project').uncheck();
  await save.click();
  await expect.poll(async () => (await (await request.get('/api/office?project=brain')).json()).knowledge.enabled).toBe(false);
  await expect(save).toBeDisabled();
});
