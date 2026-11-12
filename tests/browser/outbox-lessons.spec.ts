import { test, expect, type Page, type APIRequestContext } from './fixture-test';

const lesson = { id: 'outbox-lesson', scope: 'project', kind: 'tooling', tier: 'guidance', revision: 1, status: 'active', statement: 'Use the repository package manager.', when: 'Before preparing a consumer', check: 'The generated version matches the manifest', detail: 'An independent fixture version drifted.', paths: ['package.json'], stages: ['repair'], evidence: [{ kind: 'pr', ref: 'pr:168', url: 'https://github.com/fixture/project/pull/168', detail: 'Original repair evidence' }], sourceRetrospectiveId: 'retro', repositoryInstruction: { status: 'proposed' }, createdAt: '2026-11-12', updatedAt: '2026-11-12' };
async function seed(request: APIRequestContext) {
    const snapshot = await (await request.get('/api/office?project=brain')).json();
    snapshot.knowledge = { enabled: true, lessons: [structuredClone(lesson)], pending: [], consumed: [], retrospectives: [] };
    snapshot.outbox = [{ id: 'lesson-issue:outbox-lesson', title: 'Harper suggests a durable team improvement', detail: lesson.statement, role: 'knowledge', ticket: '', url: '', status: 'open', createdAt: '', updatedAt: '' }];
    await request.post('/__fixture/snapshot?project=brain', { data: snapshot }); return snapshot;
}
async function open(page: Page) {
    await page.goto('/'); await page.getByLabel('Office project').selectOption('brain');
    await page.getByRole('button', { name: /^Open your outbox,/ }).click();
    await page.locator('[data-outbox-item]').click();
    return page.locator('[data-outbox-lesson-decision]');
}
test('decline from the selected outbox item saves a project-bound decision without sending a chat', async ({ page, request }, testInfo) => {
    await seed(request); const decision = await open(page);
    await expect(decision).toContainText(lesson.detail); await expect(decision).toContainText(lesson.check);
    await expect(decision.getByRole('link', { name: 'Original repair evidence' })).toHaveAttribute('href', lesson.evidence[0].url);
    await expect(page.getByRole('textbox', { name: 'Message Morgan' })).toHaveCount(0);
    await expect(decision.getByRole('button', { name: 'Approve — file issue', exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('outbox-lesson-decision.png') });
    await decision.getByRole('button', { name: 'Decline', exact: true }).click();
    await expect(decision).toContainText('Suggestion declined.');
    const writes = await (await request.get('/__fixture/writes')).json();
    expect(writes).toHaveLength(1); expect(writes[0]).toMatchObject({ path: '/api/commands?project=brain', body: { action: 'decline-lesson-issue', lessonId: lesson.id } });
});
test('approval stays pending across reopening and shows success only after the filed record arrives', async ({ page, request }) => {
    const snapshot = await seed(request);
    await page.route('**/api/commands?project=brain', async route => {
        expect(route.request().postDataJSON()).toEqual({ action: 'file-lesson-issue', lessonId: lesson.id });
        snapshot.coordination.requests = [{ id: 'one-request', action: 'file-lesson-issue', head: lesson.id, key: '', status: 'queued', lane: 'operations', detail: 'Waiting for scheduler ownership.', requestedAt: new Date().toISOString() }];
        await request.post('/__fixture/snapshot?project=brain', { data: snapshot });
        await route.fulfill({ status: 202, json: { accepted: true, id: 'one-request' } });
    });
    let decision = await open(page); await decision.getByRole('button', { name: 'Approve — file issue', exact: true }).click();
    await expect(decision).toContainText('Approval queued.'); await expect(decision.getByRole('button', { name: 'Approve — file issue', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Back to all items' }).click(); await page.locator('[data-outbox-item]').click();
    decision = page.locator('[data-outbox-lesson-decision]'); await expect(decision.getByRole('button', { name: 'Decline', exact: true })).toBeDisabled();
    snapshot.knowledge.lessons[0].repositoryInstruction = { status: 'filed', issueUrl: 'https://github.com/fixture/brain/issues/99' };
    await request.post('/__fixture/snapshot?project=brain', { data: snapshot });
    await expect(decision.getByRole('link', { name: 'Open issue' })).toHaveAttribute('href', 'https://github.com/fixture/brain/issues/99');
    await expect(decision).toContainText('Issue filed and verified.');
});
test('a lost approval response locks decisions until a read-back and does not post again', async ({ page, request }) => {
    const snapshot = await seed(request); let posts = 0;
    await page.route('**/api/commands?project=brain', async route => {
        posts++; snapshot.coordination.requests = [{ id: 'retained-request', action: 'file-lesson-issue', head: lesson.id, status: 'blocked', detail: 'Earlier provider outcome uncertain.' }];
        await request.post('/__fixture/snapshot?project=brain', { data: snapshot }); await route.abort('failed');
    });
    const decision = await open(page); await decision.getByRole('button', { name: 'Approve — file issue', exact: true }).click();
    await expect(decision.getByRole('alert')).toContainText('Decision not confirmed.');
    await decision.getByRole('button', { name: 'Refresh decision status' }).click();
    await expect(decision).toContainText('Issue filing needs follow-up.'); await expect(decision.getByRole('button', { name: 'Approve — file issue', exact: true })).toBeDisabled(); expect(posts).toBe(1);
});

test('a failed status refresh cannot unlock an unconfirmed decision even when no queued request is visible', async ({ page, request }) => {
    await seed(request); let posts = 0;
    await page.route('**/api/commands?project=brain', async route => { posts++; await route.abort('failed'); });
    const decision = await open(page); await decision.getByRole('button', { name: 'Approve — file issue', exact: true }).click();
    await expect(decision.getByRole('alert')).toContainText('Decision not confirmed.');
    await page.route('**/api/office?project=brain', async route => { await route.fulfill({ status: 503, json: { error: 'temporarily unavailable' } }); });
    await decision.getByRole('button', { name: 'Refresh decision status' }).click();
    await expect(decision.getByRole('alert')).toContainText('Could not refresh the decision status.');
    await expect(decision.getByRole('button', { name: 'Approve — file issue', exact: true })).toBeDisabled(); expect(posts).toBe(1);
    await page.unroute('**/api/office?project=brain'); await decision.getByRole('button', { name: 'Refresh decision status' }).click();
    await expect(decision.getByRole('button', { name: 'Approve — file issue', exact: true })).toBeEnabled(); expect(posts).toBe(1);
});
