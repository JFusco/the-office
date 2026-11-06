import { expect, test, vi } from 'vitest';
import { loadOfficeConfig } from '../../../src/office/settings/OfficeConfigSection';

const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

test('reads the office-wide route and validates the projection', async () => {
    const fetchImpl = reply(200, { projects: [], cec: { site: '' }, holds: [] });
    expect(await loadOfficeConfig(fetchImpl)).toEqual({ projects: [], cec: { site: '' }, holds: [] });
    expect(fetchImpl).toHaveBeenCalledWith('/api/office-config', expect.anything());
    await expect(loadOfficeConfig(reply(503, { error: 'down' }))).rejects.toThrow('The Office returned 503');
    await expect(loadOfficeConfig(reply(200, { projects: [] }))).rejects.toThrow('incomplete');
});
