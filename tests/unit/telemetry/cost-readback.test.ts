import { afterEach, expect, test } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { Store } from '../../../server/store/store';
import { costLedger } from '../../../server/telemetry/cost-entries';
import { dueCostReadback } from '../../../server/telemetry/cost-readback';
import { timeLedger } from '../../../server/time/time-accounting';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store() { const s = new Store(':memory:', projectById('cms-field-vocabulary')); s.state.coordination ??= coordination(); stores.push(s); return s; }
const NOW = new Date('2026-11-20T12:00:00.000Z');

test('asking what is due changes nothing: a time ledger without a cost ledger stays without one', () => {
    const s = store();
    timeLedger(s);
    const before = JSON.stringify(s.state);
    expect(dueCostReadback(s, NOW)).toBeNull();
    expect(JSON.stringify(s.state)).toBe(before);
    expect('cost' in s.state.coordination!.time!).toBe(false);
});

test('an entry left posting, or uncertain past the read-back interval, is still found', () => {
    const s = store();
    timeLedger(s);
    const ledger = costLedger(s)!;
    ledger.entries.push({ key: 'GH-1', status: 'posting', updatedAt: NOW.toISOString() } as any);
    expect(dueCostReadback(s, NOW)?.key).toBe('GH-1');
    ledger.entries[0] = { key: 'GH-2', status: 'uncertain', updatedAt: NOW.toISOString(), readbackAt: NOW.toISOString() } as any;
    expect(dueCostReadback(s, NOW)).toBeNull();
    expect(dueCostReadback(s, new Date(NOW.getTime() + 24 * 60 * 60 * 1000))?.key).toBe('GH-2');
});

test('with no time ledger there is nothing to settle', () => {
    expect(dueCostReadback(store(), NOW)).toBeNull();
});
