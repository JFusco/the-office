import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request, page }) => {
    await request.get('/__fixture/reset');
    await page.addInitScript(() => { localStorage.setItem('office.motion', 'reduced'); localStorage.setItem('office.floor', 'delivery'); });
});
test('discovery drafts survive reload and approval submits the displayed plan and ticket manifest', async ({ page, request }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Features', exact: true }).click();
    await page.getByRole('button', { name: 'New feature', exact: true }).click();
    await page.getByLabel('Feature name', { exact: true }).fill('Editor search');
    await page.getByLabel('What should this accomplish?').fill('Help editors find content.');
    await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
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
});

test('narrow workspace uses manual keyboard tabs and keeps inactive answers out of navigation', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await page.goto('/');
    await page.getByRole('button',{name:'Features',exact:true}).click();
    await page.getByRole('button',{name:'New feature',exact:true}).click();
    await page.getByLabel('Feature name',{exact:true}).fill('Mobile planning');
    await page.getByLabel('What should this accomplish?').fill('Plan with a keyboard on a narrow screen.');
    await page.getByRole('button',{name:'Start discovery',exact:true}).click();
    const conversation=page.getByRole('tab',{name:'Conversation',exact:true}), document=page.getByRole('tab',{name:'Document',exact:true});
    await conversation.focus();await page.keyboard.press('End');
    await expect(document).toBeFocused();await expect(conversation).toHaveAttribute('aria-selected','true');
    await page.keyboard.press('Enter');await expect(page.getByLabel('Your answer',{exact:true})).toBeHidden();
    await expect(document).toHaveAttribute('aria-selected','true');
    const panel=page.getByRole('complementary',{name:'Features',exact:true});
    expect(await panel.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
    await page.screenshot({path:'/private/tmp/office-feature-planning-review-20261104/feature-mobile.png'});
});
