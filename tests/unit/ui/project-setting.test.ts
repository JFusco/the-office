import { expect, test, vi } from 'vitest';
import { saveProjectSetting } from '../../../src/office/settings/useProjectSetting';

const reply = (status: number, body: string) => vi.fn(async () => new Response(body, { status })) as unknown as typeof fetch;

test('binds the captured project and keeps the existing action/payload shape', async () => {
    const cec = reply(202, '{"accepted":true}'), brain = reply(202, '{"accepted":true}');
    await saveProjectSetting(cec, 'cec', 'configure-pickup', { pickup: { enabled: true, status: 'To Do' } });
    await saveProjectSetting(brain, 'brain', 'configure-merges', { merges: { enabled: false } });
    expect(cec).toHaveBeenCalledWith('/api/commands', expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'configure-pickup', pickup: { enabled: true, status: 'To Do' } }) }));
    expect(brain).toHaveBeenCalledWith('/api/commands?project=brain', expect.objectContaining({ body: JSON.stringify({ action: 'configure-merges', merges: { enabled: false } }) }));
});
test('reports rejected, unreadable and network-failed saves and refuses an unknown project', async () => {
    await expect(saveProjectSetting(reply(409, '{"error":"Invalid time settings"}'), 'cec', 'configure-time', {})).rejects.toThrow('Invalid time settings');
    await expect(saveProjectSetting(reply(502, '<html>'), 'cec', 'configure-time', {})).rejects.toThrow('The Office returned 502');
    await expect(saveProjectSetting(reply(202, '<html>'), 'cec', 'configure-time', {})).rejects.toThrow('unreadable');
    await expect(saveProjectSetting(vi.fn(async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch, 'cec', 'configure-time', {})).rejects.toThrow('Failed to fetch');
    const unused = reply(202, '{}');
    await expect(saveProjectSetting(unused, '', 'configure-time', {})).rejects.toThrow('Wait for the selected project');
    expect(unused).not.toHaveBeenCalled();
});
