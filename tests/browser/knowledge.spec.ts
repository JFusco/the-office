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
  await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button', { name: 'Visit Harper, 2 lessons, knowledge engineer' }).click();
  const drawer = page.getByRole('complementary', { name: 'Knowledge engineer' });
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toContainText('2');

  await drawer.getByRole('button', { name: 'Retire lesson: Retry the flaky link check once' }).click();
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toContainText('1');
  await expect(drawer.getByRole('heading', { name: /Active lessons/ })).toBeFocused();
  await expect(drawer.getByText('Retired lessons (1)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Visit Harper, 1 lesson, knowledge engineer' })).toBeVisible();

  const save = drawer.getByRole('button', { name: 'Save', exact: true });
  await expect(save).toBeDisabled();
  await drawer.getByLabel('Let Harper write retrospectives for this project').uncheck();
  await save.click();
  await expect.poll(async () => (await (await request.get('/api/office?project=brain')).json()).knowledge.enabled).toBe(false);
  await expect(save).toBeDisabled();
});

test('Harper works on CEC too: office proposals, AGENTS.md filing and the weekly roll-up', async ({ page, request }) => {
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  const cec = await (await request.get('/api/office')).json();
  const proposal = { id: 'p1', projectId: 'cec', rollupId: 'rollup:2026-11-06', kind: 'process', statement: 'Run the wiki build before every review', detail: 'Two projects drifted.', stages: ['review'], status: 'proposed', createdAt: at };
  await request.post('/__fixture/snapshot?project=cec', { data: {
    agents: [...cec.agents, { id: 'knowledge', name: 'Harper', title: 'Knowledge engineer', activity: 'idle', task: 'Ready', ticket: '', sessionId: '', lastSeen: at }],
    officeKnowledge: { proposals: [proposal], lessons: [] },
    knowledge: { enabled: true, consumed: [], pending: [], retrospectives: [], officeProposals: [proposal],
      lessons: [lesson('n1', 'Commit generated artifacts'), { ...lesson('s1', 'Use the shared fixture data'), repositoryInstruction: { status: 'proposed' } }],
      rollups: [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', summary: 'Two runs shipped; one park waited a day.', officeProposalIds: ['p1'], at, metrics: { from: at, to: at, completed: 2, retired: 0, parked: 1, repairBudgets: 0, repairAttempts: 3, reroutes: 1, ciRepairs: 0, medianQueueMinutes: 4, medianBlockHours: 26, stillParked: 0, retrospectives: 3, lessonsAdded: 2, lessonsRetired: 0 } }] },
  } });
  await page.goto('/');
  await page.getByRole('button', { name: /^Visit Harper, .*knowledge engineer$/ }).click();
  const drawer = page.getByRole('complementary', { name: 'Knowledge engineer' });
  await expect(drawer.getByRole('textbox', { name: /Message Harper/ })).toBeVisible();
  await expect(drawer.getByRole('table', { name: /Delivery metrics/ })).toContainText('26');
  await expect(drawer.getByText('Two runs shipped; one park waited a day.')).toBeVisible();

  await drawer.getByRole('button', { name: 'Accept office-wide lesson: Run the wiki build before every review' }).click();
  await expect(drawer.getByRole('button', { name: 'Retire office-wide lesson: Run the wiki build before every review' })).toBeVisible();
  const brain = await (await request.get('/api/office?project=brain')).json();
  expect(brain.officeKnowledge.lessons.map((l: { statement: string }) => l.statement)).toContain('Run the wiki build before every review');

  // CEC is not a GitHub project: the suggestion can be declined but not filed.
  await expect(drawer.getByRole('button', { name: /^File AGENTS.md issue/ })).toHaveCount(0);
  await drawer.getByRole('button', { name: 'Decline AGENTS.md suggestion: Use the shared fixture data' }).click();
  await expect(drawer.getByRole('button', { name: /^Decline AGENTS.md suggestion/ })).toHaveCount(0);

  await expect(drawer.getByRole('button', { name: 'Retire lesson: Commit generated artifacts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Visit Harper, 2 lessons, knowledge engineer' })).toBeVisible();
});

test('a GitHub AGENTS.md suggestion files with one click and links the issue', async ({ page, request }) => {
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  const brain = await (await request.get('/api/office?project=brain')).json();
  await request.post('/__fixture/snapshot?project=brain', { data: {
    agents: [...brain.agents, { id: 'knowledge', name: 'Harper', title: 'Knowledge engineer', activity: 'idle', task: 'Ready', ticket: '', sessionId: '', lastSeen: at }],
    knowledge: { enabled: true, consumed: [], pending: [], retrospectives: [], lessons: [{ ...lesson('s2', 'Regenerate the catalog before committing'), repositoryInstruction: { status: 'proposed' } }] },
  } });
  await page.goto('/');
  await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button', { name: /^Visit Harper, / }).click();
  const drawer = page.getByRole('complementary', { name: 'Knowledge engineer' });
  await drawer.getByRole('button', { name: 'File AGENTS.md issue: Regenerate the catalog before committing' }).click();
  await expect(drawer.getByRole('link', { name: /Issue filed/ })).toHaveAttribute('href', 'https://github.com/JFusco/brain/issues/999');
});

test('merge posts can go to a Slack channel and tag people by member ID', async ({ page, request }) => {
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Office settings' }).click();
  await page.getByLabel('Post to a channel when a watched PR merges').check();
  await page.getByLabel('Channel ID').fill('c0deliver');
  await page.getByLabel('Channel name').fill('#delivery');
  await page.getByLabel('Workspace ID').fill('T09KF5BJR');
  await page.getByLabel('People to tag (optional)').fill('U111AAA\nu222bbb, U111AAA');
  await page.getByRole('button', { name: 'Save merge channel' }).click();
  await expect.poll(async () => (await (await request.get('/api/office')).json()).coordination.notices.policy.channel).toMatchObject({ enabled: true, channelId: 'C0DELIVER', channelName: 'delivery', workspaceId: 'T09KF5BJR', mentionIds: ['U111AAA', 'U222BBB'] });
});

test('Harper shows active guidance, original failure history, uncertain publication and learning coverage', async ({ page, request }) => {
  await setPreferences(request, { reducedMotion: true, quality: 'low' });
  const brain = await (await request.get('/api/office?project=brain')).json();
  await request.post('/__fixture/snapshot?project=brain', { data: { agents: [...brain.agents, { id: 'knowledge', name: 'Harper', title: 'Knowledge engineer', activity: 'idle', task: 'Ready', ticket: '', sessionId: '', lastSeen: at }], knowledge: {
    enabled: true, consumed: [], pending: [], retrospectives: [], lessons: [{ ...lesson('active-review', 'Keep the exact source receipt'), tier: 'guidance', revision: 3 }],
    followups: [{ id: 'incident', source: { kind: 'message', id: 'original' }, key: 'GH-9', owner: 'Morgan', nextAction: 'Verify the original effect', disposition: 'unknown', history: [{ at, disposition: 'unresolved', fingerprint: 'old' }], evidence: [{ kind: 'learning', ref: 'source', url: '', detail: 'Original failure: response lost' }] }],
    improvements: [{ id: 'fix', change: 'Check the marker', status: 'uncertain', detail: 'The original create must not be resent' }],
    rollups: [{ id: 'rollup:2026-11-06', weekEnding: '2026-11-06', summary: 'Observed activity; application unknown.', learning: { coverage: { status: 'partial', startedAt: '2026-11-03T12:00:00Z' }, assignments: 1, eligibleAssignments: 1, exposedAssignments: 1, eligiblePairs: 1, exposedPairs: 1, omittedPairs: 0, resolved: 0, unresolved: 0, unknown: 1 }, officeProposalIds: [], at, metrics: { completed: 0, parked: 0, repairAttempts: 0, reroutes: 0, ciRepairs: 0, medianBlockHours: null, lessonsAdded: 1 } }],
  } } });
  await page.goto('/'); await page.getByLabel('Office project').selectOption('brain');
  await page.getByRole('button', { name: /^Visit Harper, / }).click();
  const drawer = page.getByRole('complementary', { name: 'Knowledge engineer' });
  await expect(drawer.getByText('guidance · revision 3')).toBeVisible();
  await expect(drawer.getByText('Partial learning coverage: recorded since 2026-11-03T12:00:00Z.')).toBeVisible();
  await expect(drawer.getByText('The original create must not be resent')).toBeVisible();
  await drawer.getByText('Original history (1)').click();
  await expect(drawer.getByText('Original failure: response lost')).toBeVisible();
});
