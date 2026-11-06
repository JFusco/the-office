import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import { PreferencesStore } from '../../../server/office/preferences-store';
import { ControlStore } from '../../../server/store/control-store';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../src/shared';

test('starts from defaults and merges partial patches with one revision step each', () => {
    const db = new DatabaseSync(':memory:'), store = new PreferencesStore(db);
    expect(store.read()).toEqual(OFFICE_PREFERENCE_DEFAULTS);
    expect(store.patch({ quality: 'low' })).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, quality: 'low', revision: 1 });
    expect(store.patch({ coffeeBreaks: false, reducedMotion: true })).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, quality: 'low', coffeeBreaks: false, reducedMotion: true, revision: 2 });
    expect(store.read().revision).toBe(2);
});
test('rejects unknown, client-owned, mistyped and empty patches without changing the row', () => {
    const store = new PreferencesStore(new DatabaseSync(':memory:'));
    for (const patch of [{}, { revision: 9 }, { serviceInstanceId: 'x' }, { quality: 'ultra' }, { keyboardShortcuts: 'yes' }, null, [], 'low'])
        expect(() => store.patch(patch), JSON.stringify(patch)).toThrow();
    expect(store.read()).toEqual(OFFICE_PREFERENCE_DEFAULTS);
});
test('surfaces invalid stored data instead of silently resetting it', () => {
    const db = new DatabaseSync(':memory:'), store = new PreferencesStore(db);
    db.prepare('UPDATE office_preferences SET body=? WHERE id=1').run(JSON.stringify({ quality: 'ultra' }));
    expect(() => store.read()).toThrow('Stored office preferences are invalid');
});
test('persists across reopening and leaves the CTO configuration row untouched', () => {
    const root = mkdtempSync(join(process.env.OFFICE_DATA_ROOT!, 'office-preferences-'));
    try {
        const path = join(root, 'office-control.sqlite');
        const first = new ControlStore(path), before = first.configuration();
        new PreferencesStore(first.db).patch({ deliveryToasts: false });
        first.close();
        const second = new ControlStore(path);
        expect(new PreferencesStore(second.db).read()).toEqual({ ...OFFICE_PREFERENCE_DEFAULTS, deliveryToasts: false, revision: 1 });
        expect(second.configuration()).toEqual(before);
        second.close();
    } finally { rmSync(root, { recursive: true, force: true }); }
});
test('notifies subscribers after commit, isolates failures and unsubscribes', () => {
    const store = new PreferencesStore(new DatabaseSync(':memory:'));
    const seen = vi.fn(), failing = vi.fn(() => { throw new Error('subscriber failed'); });
    const stop = store.subscribe(seen); store.subscribe(failing);
    expect(store.patch({ quality: 'low' }).revision).toBe(1);
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ quality: 'low', revision: 1 }));
    stop(); store.patch({ quality: 'high' });
    expect(seen).toHaveBeenCalledTimes(1); expect(failing).toHaveBeenCalledTimes(2);
});
