import { test, expect } from './fixture-test';
import { evidence, setPreferences } from './support';

test.beforeEach(async ({ page, request }) => {

    await setPreferences(request, { reducedMotion: true }); await page.addInitScript(() => { localStorage.setItem('office.floor', 'delivery'); });
});
test('discovery drafts survive reload and approval submits the displayed plan and ticket manifest', async ({ page, request }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Features', exact: true }).click();
    await page.getByRole('button', { name: 'New feature', exact: true }).click();
    await page.getByLabel('Feature name', { exact: true }).fill('Editor search');
    await page.getByLabel('What should this accomplish?').fill('Help editors find content.');
    await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Editor search', exact: true }).first()).toBeFocused();
    await expect(page.getByRole('button', { name: 'Back to Features' })).toBeVisible();
    await page.getByLabel('Your answer', { exact: true }).fill('Editors only, with keyboard access.');
    await page.reload();
    await page.getByRole('button', { name: 'Features', exact: true }).click();
    await page.getByRole('button', { name: /Editor search.*discovery/ }).click();
    await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue('Editors only, with keyboard access.');
    await page.getByRole('button', { name: 'Send answers' }).click();
    await page.getByRole('button', { name: 'Confirm brief & create plan' }).click();
    await page.getByRole('tab', { name: 'Delivery', exact: true }).click();
    await expect(page.getByText('Implement editor search', { exact: true })).toBeVisible();
    await page.getByText('Exact provider changes').click();
    await expect(page.getByText(/Exact fixture ticket content/)).toBeVisible();
    await page.getByRole('button', { name: 'Approve & start delivery' }).click();
    await expect(page.getByRole('link', { name: 'GH-999', exact: true })).toBeVisible();
    const writes = await (await request.get('/__fixture/writes')).json();
    const approval = writes.find((w: any) => w.body.action === 'approve');
    expect(approval.body.planDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(approval.body.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(approval.body.expectedRevision).toBe(2);
});
test('document tabs support keyboard navigation and revision returns to discovery', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Features', exact: true }).click();
    await page.getByRole('button', { name: 'New feature', exact: true }).click();
    await page.getByLabel('Feature name', { exact: true }).fill('Search');
    await page.getByLabel('What should this accomplish?').fill('Find content');
    await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
    await page.getByRole('tab', { name: 'Brief', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Plan', exact: true })).toBeFocused();
    await page.getByLabel('Correct or add a decision').fill('Include archived content.');
    await page.getByRole('button', { name: 'Save decision & revise' }).click();
    await expect(page.getByText('Include archived content.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve & start delivery' })).toHaveCount(0);

    const drawer = page.getByRole('complementary', { name: 'Features', exact: true });
    const directory = drawer.getByRole('navigation', { name: 'Features' });
    const back = drawer.getByRole('button', { name: 'Back to Features' });
    await expect(directory).toBeHidden();
    await back.click();
    const search = directory.getByRole('button', { name: /^Search/ });
    await search.click();
    await expect(directory).toBeHidden();
    const conversation = await drawer.getByRole('region', { name: 'Feature conversation' }).boundingBox();
    const documents = await drawer.getByRole('tablist').boundingBox();
    expect(documents!.x).toBeGreaterThan(conversation!.x + conversation!.width);
    await back.click();
    await expect(search).toBeFocused();
    await directory.getByRole('button', { name: 'New feature' }).click();
    await page.getByLabel('Feature name', { exact: true }).fill('Saved filters');
    await page.getByLabel('What should this accomplish?').fill('Store a default query.');
    await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
    await expect(drawer.getByRole('heading', { name: 'Saved filters', exact: true }).first()).toBeFocused();
    await back.click();
    await directory.getByRole('button', { name: /^Saved filters/ }).click();
    await expect(back).toBeVisible();
    await expect(drawer.locator('[data-drawer-page]')).toHaveCount(2);
});

test('narrow workspace uses topic pages and keeps inactive answers out of navigation', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    await page.getByRole('button',{name:'Features',exact:true}).click();
    await page.getByRole('button',{name:'New feature',exact:true}).click();
    await page.getByLabel('Feature name',{exact:true}).fill('Mobile planning');
    await page.getByLabel('What should this accomplish?').fill('Plan with a keyboard on a narrow screen.');
    await page.getByRole('button',{name:'Start discovery',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Mobile planning',exact:true}).first()).toBeFocused();
    await page.getByRole('button',{name:'Back to Features'}).click();
    await page.getByRole('button',{name:/^Mobile planning/}).click();
    await expect(page.getByRole('button',{name:'Back to Features'})).toBeVisible();
    const conversation=page.getByRole('button',{name:/^Conversation/});
    await conversation.focus();await conversation.press('Enter');
    await expect(page.getByLabel('Your answer',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:/^Back to /}).click();await expect(conversation).toBeFocused();
    await page.getByRole('button',{name:'Documents and delivery'}).click();
    await expect(page.getByLabel('Your answer',{exact:true})).toBeHidden();
    const panel=page.getByRole('complementary',{name:'Features',exact:true});
    expect(await panel.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    await page.screenshot({path:evidence('feature-mobile.png')});
});

test('a create response arriving after Back leaves the ticket and its focus in place', async ({page,request}) => {
    await request.post('/__fixture/snapshot',{data:{featurePlanning:{assessment:false}}});
    let release!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/features*', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        const response = await route.fetch();
        await hold;
        await route.fulfill({response});
    });
    await page.goto('/');
    await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
    const active = page.locator('[data-inspector-scroll]');
    await active.getByRole('button',{name:/^CEC-\d+ · /}).first().click();
    const plan = active.getByRole('button',{name:'Plan a feature from this ticket'});
    await plan.click();
    await page.getByLabel('Feature name').fill('Delayed fixture feature');
    await page.getByLabel('What should this accomplish?').fill('Record the plan without moving the user.');
    const sent = page.waitForRequest(req => req.method() === 'POST' && req.url().includes('/api/features'));
    try {
        await page.getByRole('button',{name:'Start discovery'}).click();
        await sent;
        await page.getByRole('button',{name:/^Back to CEC-/}).click();
        await expect(plan).toBeFocused();
        await expect(page.getByText('Plan a feature with Casey',{exact:true})).toHaveCount(0);
        const received = page.waitForResponse(res => res.request().method() === 'POST' && res.url().includes('/api/features'));
        release();
        const response = await received;
        expect(response.ok()).toBe(true);
        expect(await response.finished()).toBeNull();
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await expect(plan).toBeFocused();
        await expect(active.getByRole('heading',{name:'Delayed fixture feature',exact:true})).toHaveCount(0);
        await page.getByRole('button',{name:'Features',exact:true}).click();
        await expect(active.getByRole('navigation',{name:'Features'}).getByRole('button',{name:/^Delayed fixture feature/})).toBeVisible();
    } finally {
        release();
    }
});
