import { test, expect } from './fixture-test';

test('focus keeps the healthy live stream while sleep and network recovery still reconnect', async ({ page, context }) => {
    await page.addInitScript(() => {
        const Native = window.EventSource;
        const counts = { opened: 0, closed: 0 };
        Object.assign(window, { officeStreamCounts: counts });
        window.EventSource = class extends Native {
            constructor(url: string | URL, options?: EventSourceInit) { super(url, options); counts.opened++; }
            close() { counts.closed++; super.close(); }
        };
    });
    await page.goto('/');
    await expect(page.getByText('OFFICE LIVE', { exact: true })).toBeVisible();
    const counts = () => page.evaluate(() => (window as unknown as { officeStreamCounts: { opened: number; closed: number } }).officeStreamCounts);
    const initial = await counts();
    await page.evaluate(() => { for (let i = 0; i < 3; i++) window.dispatchEvent(new FocusEvent('focus')); });
    expect(await counts()).toEqual(initial);
    await expect(page.getByText('OFFICE LIVE', { exact: true })).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('office-clock-gap')));
    await expect(page.getByText('OFFICE LIVE', { exact: true })).toBeVisible();
    expect(await counts()).toEqual({ opened: initial.opened + 1, closed: initial.closed + 1 });
    await context.setOffline(true);
    await expect(page.getByText('RECONNECTING', { exact: true })).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByText('OFFICE LIVE', { exact: true })).toBeVisible();
});
