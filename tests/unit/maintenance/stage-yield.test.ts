import { expect, test } from 'vitest';
import { StageYield } from '../../../server/maintenance/stage-yield';
import { maintenanceStopOf } from '../../../server/maintenance/publication/maintenance-stop';

test('a stage yield is an ordinary error carrying its reason, and never a typed stop', () => {
    const yielded = new StageYield('Stage persisted; waiting for the next scheduler claim');
    expect(yielded).toBeInstanceOf(Error);
    expect(yielded).toBeInstanceOf(StageYield);
    expect(yielded.message).toBe('Stage persisted; waiting for the next scheduler claim');
    expect(maintenanceStopOf(yielded, 'now')).toBeUndefined();
    expect(new Error('other')).not.toBeInstanceOf(StageYield);
});
