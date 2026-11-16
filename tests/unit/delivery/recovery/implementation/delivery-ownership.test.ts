import { expect, test } from 'vitest';
import { refreshDeliveryOwnership, withAmendmentOwnership } from '../../../../../server/delivery/recovery/implementation/delivery-ownership';

const clear = { complete: true, fresh: true, ownership: { status: 'clear' } };

test('the scheduler-supplied refresh is available only inside its own delivery run', async () => {
    expect(() => refreshDeliveryOwnership()).toThrow('Scheduler ownership refresh unavailable');
    const inside = await withAmendmentOwnership(async () => clear, async () => { await Promise.resolve(); return refreshDeliveryOwnership(); });
    expect(inside).toEqual(clear);
    expect(() => refreshDeliveryOwnership()).toThrow('Scheduler ownership refresh unavailable');
});

test('concurrent delivery runs each read their own refresh', async () => {
    const run = (status: string) => withAmendmentOwnership(async () => ({ ...clear, ownership: { status } }), async () => { await new Promise(resolve => setTimeout(resolve, 1)); return (await refreshDeliveryOwnership()).ownership?.status; });
    expect(await Promise.all([run('clear'), run('owned')])).toEqual(['clear', 'owned']);
});
