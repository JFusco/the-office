import { expect, test, type Page } from './fixture-test';
import { setPreferences } from './support';

async function observeAudioReadiness(page: Page) {
    await page.addInitScript(() => {
        const decode = AudioContext.prototype.decodeAudioData;
        AudioContext.prototype.decodeAudioData = async function (...args) {
            this.addEventListener('statechange', () => {
                document.documentElement.dataset.audioState = this.state;
            }, { once: true });
            const buffer = await decode.apply(this, args);
            const data = document.documentElement.dataset;
            data.audioDecoded = String(Number(data.audioDecoded || 0) + 1);
            data.audioState = this.state;
            return buffer;
        };
    });
}

async function expectAudioReady(page: Page) {
    await expect(page.locator('html')).toHaveAttribute('data-audio-decoded', '4');
    await expect(page.locator('html')).toHaveAttribute('data-audio-state', 'running');
}

test('warm sounds play on interaction while a save is stalled, and previews follow volume', async ({ page, request }) => {
    await setPreferences(request, { quality: 'low', floorSound: true });
    await observeAudioReadiness(page);
    // Observe real Web Audio dispatch without replacing playback or loading.
    await page.addInitScript(() => {
        const original = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args) {
            document.documentElement.dataset.soundStarts = String(Number(document.documentElement.dataset.soundStarts || 0) + 1);
            return original.apply(this, args);
        };
    });
    const wavs: string[] = [];
    page.on('request', req => { if (/\.wav($|\?)/.test(req.url())) wavs.push(req.url()); });
    await page.goto('/');
    await page.getByRole('button', { name: 'Office settings' }).click();
    await page.getByRole('button', { name: 'Sound', exact: true }).click();
    await expectAudioReady(page);
    const volume = page.getByRole('slider', { name: 'Sound effects volume' });
    await expect(volume).toHaveValue('25');
    const count = async () => Number(await page.locator('html').getAttribute('data-sound-starts'));
    await page.getByRole('button', { name: 'Play doors' }).click();
    expect(await count()).toBe(1);
    const warmRequests = wavs.length;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/preferences', async route => { await gate; await route.continue(); }, { times: 1 });
    const setting = page.getByRole('checkbox', { name: 'Setting changes' });
    await setting.focus(); await setting.press('Space');
    try { expect(await count()).toBe(2); await expect(setting).toBeDisabled(); }
    finally { release(); }
    await expect(setting).toBeEnabled();
    await volume.focus(); await volume.press('Home');
    await expect.poll(async () => (await (await request.get('/api/preferences')).json()).soundVolume).toBe(0);
    await page.getByRole('button', { name: 'Play off' }).click(); expect(await count()).toBe(2);
    await volume.press('End');
    await expect.poll(async () => (await (await request.get('/api/preferences')).json()).soundVolume).toBe(100);
    await page.getByLabel('Panel navigation hover', { exact: true }).check();
    await page.keyboard.press('Escape');
    const floor = page.getByRole('button', { name: /^Go to Floor 2/ });
    const before = await count();
    await floor.hover();
    expect(await count()).toBe(before);
    await floor.click();
    await expect(page.getByRole('heading', { name: 'CTO Office', exact: true })).toBeVisible();
    expect(await count()).toBe(before + 1);
    expect(wavs).toHaveLength(warmRequests);
});

test('saves a slider drag once, syncs another browser, and restores a rejected edit', async ({ page, browser, baseURL }) => {
    const second = await browser.newContext({ baseURL, reducedMotion: 'reduce' });
    try {
        const other = await second.newPage();
        for (const tab of [page, other]) {
            await tab.goto('/');
            await tab.getByRole('button', { name: 'Office settings' }).click();
            await tab.getByRole('button', { name: 'Sound', exact: true }).click();
        }
        const slider = page.getByRole('slider'), remote = other.getByRole('slider');
        const box = (await slider.boundingBox())!;
        const posts: string[] = [];
        page.on('request', req => { if (req.method() === 'POST' && req.url().endsWith('/api/preferences')) posts.push(req.postData()!); });
        await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 5 });
        await expect(slider).toHaveValue('100'); expect(posts).toEqual([]);
        await page.mouse.up();
        await expect(remote).toHaveValue('100'); expect(posts.map(body => JSON.parse(body))).toEqual([{ soundVolume: 100 }]);
        await page.route('**/api/preferences', route => route.fulfill({ status: 500, json: { error: 'Fixture save failure' } }), { times: 1 });
        await slider.press('Home');
        await expect(page.getByRole('alert')).toContainText('Fixture save failure');
        await expect(slider).toHaveValue('100'); await expect(remote).toHaveValue('100');
    } finally { await second.close(); }
});

test('plays hover only on panel navigation rows and one doors recording per animated arrival', async ({ page, request }) => {
    await setPreferences(request, { quality: 'low', floorSound: true, hoverSound: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await observeAudioReadiness(page);
    await page.addInitScript(() => {
        let inPointerEvent = false;
        document.addEventListener('pointerover', () => { inPointerEvent = true; }, true);
        document.addEventListener('pointerover', () => { inPointerEvent = false; });
        const start = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args) {
            const data = document.documentElement.dataset;
            if (this.buffer && this.buffer.duration > .9) data.doors = String(Number(data.doors || 0) + 1);
            if (inPointerEvent && this.buffer && this.buffer.duration < .1) {
                data.hoverEvents = String(Number(data.hoverEvents || 0) + 1);
            }
            return start.apply(this, args);
        };
    });
    await page.goto('/');
    const gear = page.getByRole('button', { name: 'Office settings' });
    await gear.click();
    await expectAudioReady(page);
    const html = page.locator('html');
    expect(await html.getAttribute('data-hover-events')).toBeNull();

    const sound = page.getByRole('button', { name: 'Sound', exact: true });
    const preferences = page.getByRole('button', { name: 'Office preferences', exact: true });
    await sound.hover();
    await expect(html).toHaveAttribute('data-hover-events', '1');
    await sound.locator('svg').dispatchEvent('pointerover', { pointerType: 'mouse', relatedTarget: await sound.elementHandle() });
    await preferences.dispatchEvent('pointerover', { pointerType: 'touch' });
    await preferences.dispatchEvent('pointerover', { pointerType: 'mouse', buttons: 1 });
    await expect(html).toHaveAttribute('data-hover-events', '1');

    await preferences.hover();
    await expect(html).toHaveAttribute('data-hover-events', '2');
    await preferences.click();
    await page.getByLabel('Graphics').hover();
    await expect(html).toHaveAttribute('data-hover-events', '2');
    await page.keyboard.press('Escape');
    await gear.hover();
    await expect(html).toHaveAttribute('data-hover-events', '2');
    for (const [destination, count] of [[2, 1], [1, 2]] as const) {
        await page.getByRole('button', { name: new RegExp('^Go to Floor ' + destination) }).click();
        await expect(page.locator('html')).toHaveAttribute('data-doors', String(count));
        await expect(page.locator('[data-elevator-doors]')).toHaveAttribute('data-phase', 'idle');
    }
});
