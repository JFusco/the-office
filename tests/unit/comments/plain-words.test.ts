import { expect, test } from 'vitest';
import { plainWords } from '../../../server/comments/plain-words';

test('model text loses sentences about local files and previews, run ids, long hashes and markup, and keeps only the first sentences', () => {
    const text = 'I **verified** candidate 7d6ce8896da1102af6972afe594e313e36cebbec in run 410bc6e6-c837-4f86-bd48-442e6f0f6551. Evidence is at /Users/someone/Projects/x/.local/runs/a/report.json and [the preview](http://localhost:3000/x). Third sentence. Fourth sentence.';
    expect(plainWords(text, 3)).toBe('I verified candidate 7d6ce88 in run. Third sentence. Fourth sentence.');
    expect(plainWords('See [the build](https://ci.example.test/9) for details.', 1)).toBe('See the build for details.');
    expect(plainWords(text, 1)).toBe('I verified candidate 7d6ce88 in run.');
    expect(plainWords('', 3)).toBe('');
});

test('a long sentence is cut at a word with an ellipsis, and the same text always gives the same result', () => {
    const long = `${'word '.repeat(200)}end.`;
    const cut = plainWords(long, 2, 60);
    expect(cut.length).toBeLessThanOrEqual(60);
    expect(cut.endsWith('…')).toBe(true);
    expect(plainWords(long, 2, 60)).toBe(cut);
});

test('when every sentence points at a local file the meaning is kept and the place is named generically', () => {
    expect(plainWords('Joe must confirm the copy in /Users/joe/x/spec.md before QA can proceed.', 3)).toBe('Joe must confirm the copy in a local file before QA can proceed.');
    expect(plainWords('See "/Users/joe/x/spec.md".', 3)).not.toContain('/Users');
});

test('local places are recognised in their usual forms, and ordinary text is not mangled', () => {
    for (const local of ['file:///Users/x/a.json', 'path=/tmp/x', '/Volumes/disk/a', '.local/runs/r/final.json', 'localhost:3000/x', 'http://0.0.0.0:5173'])
        expect(plainWords(`Kept sentence. Dropped because of ${local} here.`, 3), local).toBe('Kept sentence.');
    expect(plainWords('The feature_flag for C# issue #12 shows a > b in https://dev.azure.com/org/_build/results?id=410bc6e6-c837-4f86-bd48-442e6f0f6551 today.', 1))
        .toBe('The feature_flag for C# issue #12 shows a > b in https://dev.azure.com/org/_build/results?id=410bc6e6-c837-4f86-bd48-442e6f0f6551 today.');
    expect(plainWords('Digest ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789 noted.', 1)).toBe('Digest ABCDEF0 noted.');
    expect(plainWords('Checked e.g. the header. Then iOS vs. Android. Third.', 2)).toBe('Checked e.g. the header. Then iOS vs. Android.');
    expect(plainWords('1. Ran the suite. 2. All passed.', 1)).toBe('1. Ran the suite.');
});
