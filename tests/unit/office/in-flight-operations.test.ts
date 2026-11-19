import { expect, test } from 'vitest';
import { InFlightOperations } from '../../../server/office/in-flight-operations';

test('overlapping operations are counted until each ends, once', () => {
    const operations = new InFlightOperations();
    const first = operations.begin(), second = operations.begin();
    expect(operations.count).toBe(2);
    first(); first();
    expect(operations.count).toBe(1);
    second();
    expect(operations.count).toBe(0);
});

test('run counts an async operation across its awaits and ends it on failure too', async () => {
    const operations = new InFlightOperations();
    let release!: () => void;
    const pending = operations.run(() => new Promise<void>(done => { release = done; }));
    expect(operations.count).toBe(1);
    release(); await pending;
    expect(operations.count).toBe(0);
    await expect(operations.run(async () => { throw new Error('failed'); })).rejects.toThrow('failed');
    expect(operations.count).toBe(0);
});
