import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { sanitizeObject } from '../../../server/office/security';
import { savedState, savedStateText } from './saved-state-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });

test('a store\'s saved state is what a restart reads: the redacted text of its state', () => {
    const store = new Store(':memory:', projectById('brain')); stores.push(store);
    store.state.pilotKey = 'GH-7';
    (store.state as unknown as Record<string, unknown>).probe = { note: 'password=hunter2 and more' };
    store.save();
    expect(savedStateText(store)).toBe(JSON.stringify(sanitizeObject(store.state)));
    expect(savedState(store).pilotKey).toBe('GH-7');
    expect(JSON.stringify(savedState(store))).not.toContain('hunter2');
    const empty = new DatabaseSync(':memory:'); dbs.push(empty);
    empty.exec('CREATE TABLE state(id INTEGER PRIMARY KEY, body TEXT NOT NULL)');
    expect(() => savedState({ db: empty })).toThrow('Nothing is saved');
    expect(() => savedStateText({ db: empty })).toThrow('Nothing is saved');
});
