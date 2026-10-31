import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

async function open(page: Page, request: APIRequestContext, reduced = false, floor = 'delivery') {
    await request.get('/__fixture/reset');
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.addInitScript(({ reduced, floor }) => {
        localStorage.setItem('office.motion', reduced ? 'reduced' : 'full');
        localStorage.setItem('office.quality', 'low'); localStorage.setItem('office.floor', floor);
    }, { reduced, floor });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('button', { name: floor === 'cto' ? /^Avery, idle,/ : /^Sam, idle,/ })).toBeVisible();
}
async function handoff(request: APIRequestContext) {
    const state = await (await request.get('/api/office')).json(), now = Date.now(), at = (delta: number) => new Date(now + delta).toISOString();
    const first = { ...state.workLog[0], id: 'motion-first', role: 'developer', startedAt: at(-20000), endedAt: at(-1000), lastHeartbeatAt: at(-1000), ticket: 'CEC-102', status: 'completed', stage: 'implement', lane: 'delivery' };
    const next = { ...first, id: 'motion-next', role: 'lead', startedAt: at(0), endedAt: '', lastHeartbeatAt: at(0), status: 'running', stage: 'code-review' };
    state.agents.find((agent: any) => agent.id === 'lead').activity = 'working';
    state.agents.find((agent: any) => agent.id === 'lead').ticket = 'CEC-102';
    await request.post('/__fixture/snapshot', { data: { agents: state.agents, workLog: [first, next] } });
}
const point = async (page: Page, name: RegExp) => {
    const box = await page.getByRole('button', { name }).boundingBox();
    if (!box) throw new Error('Avatar label is not visible');
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test('a real worker-stage handoff walks without another SSE snapshot or a provider write', async ({ page, request }) => {
    await open(page, request);
    const initial = await point(page, /^Sam, idle,/);
    await handoff(request);
    await expect.poll(async () => {
        const next = await point(page, /^Sam, CEC-102, working,/);
        return Math.hypot(next.x - initial.x, next.y - initial.y);
    }, { timeout: 6000 }).toBeGreaterThan(12);
    const first = await point(page, /^Sam, CEC-102, working,/);
    await page.waitForTimeout(800);
    const later = await point(page, /^Sam, CEC-102, working,/);
    expect(Math.hypot(first.x - later.x, first.y - later.y)).toBeGreaterThan(3);
    expect(await (await request.get('/__fixture/writes')).json()).toEqual([]);
});

test('reduced motion keeps workers at their desks during a real handoff', async ({ page, request }) => {
    await open(page, request, true);
    const initial = await point(page, /^Sam, idle,/);
    await handoff(request); await expect(page.getByRole('button', { name: /^Sam, CEC-102, working,/ })).toBeVisible();
    await page.waitForTimeout(1000);
    const later = await point(page, /^Sam, CEC-102, working,/);
    expect(Math.hypot(initial.x - later.x, initial.y - later.y)).toBeLessThan(1);
});

for (const reduced of [false, true]) {
    test(`working Sam ${reduced ? 'stays still with reduced motion' : 'keeps moving'} after the handoff settles without another snapshot`, async ({ page, request }) => {
        await open(page, request, reduced);
        const home = await point(page, /^Sam, idle,/);
        await handoff(request);
        await expect(page.getByRole('button', { name: /^Sam, CEC-102, working,/ })).toBeVisible();
        // The complete out-and-back handoff takes 4.8 seconds; sample only desk work.
        await page.waitForTimeout(6000);
        const samples = [await point(page, /^Sam, CEC-102, working,/)];
        expect(Math.hypot(samples[0].x - home.x, samples[0].y - home.y)).toBeLessThan(4);
        for (let i = 0; i < 6; i++) {
            await page.waitForTimeout(250);
            samples.push(await point(page, /^Sam, CEC-102, working,/));
        }
        const displacement = Math.max(...samples.flatMap(a => samples.map(b => Math.hypot(a.x - b.x, a.y - b.y))));
        if (reduced) expect(displacement).toBeLessThan(1);
        else expect(displacement).toBeGreaterThan(1.2);
        expect(await (await request.get('/__fixture/writes')).json()).toEqual([]);
    });
}

test('Avery occasionally paces on the CTO floor while remaining idle', async ({ page, request }) => {
    await open(page, request, false, 'cto');
    const initial = await point(page, /^Avery, idle,/);
    await expect.poll(async () => {
        const next = await point(page, /^Avery, idle,/);
        return Math.hypot(next.x - initial.x, next.y - initial.y);
    }, { timeout: 25000, intervals: [500] }).toBeGreaterThan(15);
    expect(await (await request.get('/__fixture/writes')).json()).toEqual([]);
});
