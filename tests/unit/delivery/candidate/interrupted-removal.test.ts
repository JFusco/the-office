import { expect, test } from 'vitest';
import { interruptedRemoval } from '../../../../server/delivery/candidate/interrupted-removal';

test('only deletions of tracked files count as an interrupted removal', () => {
    expect(interruptedRemoval(' D .husky/pre-commit\n D catalog/catalog.json\nD  LICENSE\n')).toBe(true);
    expect(interruptedRemoval('')).toBe(false);
    for (const work of [' M src/index.ts', '?? notes.md', 'A  added.ts', 'R  old.ts -> new.ts', 'MD file.ts'])
        expect(interruptedRemoval(` D catalog/catalog.json\n${work}`), work).toBe(false);
});
