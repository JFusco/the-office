import type { DatabaseSync } from 'node:sqlite';
import type { OfficeSnapshot } from '../../../src/shared';
import { readSaved, savedText } from '../../../server/store/saved-state';

type Saved = { db: DatabaseSync };

/** The saved state of a store's own connection as text. Throws when nothing was ever saved, so two missing states never compare equal. */
export function savedStateText(store: Saved): string {
    const text = savedText(readSaved(store.db));
    if (text === null) throw new Error('Nothing is saved in this store');
    return text;
}

/** The saved state as a restarted service would read it: parsed from what is stored, so redacted. Throws when nothing was saved. */
export function savedState<T = OfficeSnapshot>(store: Saved): T {
    return JSON.parse(savedStateText(store)) as T;
}
