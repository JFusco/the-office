import { expect, test } from 'vitest';
import { draftKey, readDraft, saveDraft } from '../../../src/features/question-drafts';
test('answer drafts are isolated by project, feature, round and question across reloads', () => {
    const data = new Map<string, string>(), storage = { getItem: (k: string) => data.get(k) || null, setItem: (k: string, v: string) => { data.set(k, v); } };
    const key = draftKey('brain', 'one', 'round', 'q'); saveDraft(key, 'Editors', storage);
    expect(readDraft(key, storage)).toBe('Editors');
    for (const other of [draftKey('cec', 'one', 'round', 'q'), draftKey('brain', 'two', 'round', 'q'), draftKey('brain', 'one', 'next', 'q'), draftKey('brain', 'one', 'round', 'different')]) expect(readDraft(other, storage)).toBe('');
});
