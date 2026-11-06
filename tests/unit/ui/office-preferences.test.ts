import { expect, test, vi } from 'vitest';
import { requestPreferences } from '../../../src/office/settings/useOfficePreferences';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../src/shared';

const reply = (status: number, body: unknown) => vi.fn(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;

test('POSTs only the changed field to the office-wide route and returns the identified response', async () => {
    const fetchImpl = reply(200, { ...OFFICE_PREFERENCE_DEFAULTS, quality: 'low', revision: 4, serviceInstanceId: 'svc' });
    expect(await requestPreferences(fetchImpl, { quality: 'low' })).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, quality: 'low', revision: 4, serviceInstanceId: 'svc' });
    expect(fetchImpl).toHaveBeenCalledWith('/api/preferences', expect.objectContaining({ method: 'POST', body: JSON.stringify({ quality: 'low' }) }));
});
test('surfaces server errors, unreadable bodies and responses without identity', async () => {
    await expect(requestPreferences(reply(400, { error: 'Invalid preferences' }), { quality: 'low' })).rejects.toThrow('Invalid preferences');
    await expect(requestPreferences(reply(500, 'not json'), { quality: 'low' })).rejects.toThrow('The Office returned 500');
    await expect(requestPreferences(reply(200, 'not json'), { quality: 'low' })).rejects.toThrow('unreadable');
    await expect(requestPreferences(reply(200, { ...OFFICE_PREFERENCE_DEFAULTS }), { quality: 'low' })).rejects.toThrow('incomplete');
    await expect(requestPreferences(vi.fn(async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch, { quality: 'low' })).rejects.toThrow('Failed to fetch');
});
