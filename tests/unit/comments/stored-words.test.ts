import { expect, test } from 'vitest';
import { storedWords } from '../../../server/comments/stored-words';

test('a stored document reads as its words, however the provider split, marked or laid them out', () => {
    const plain = 'See https://x.test/a. It\'s "done" - really...';
    const stored = { type: 'doc', content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'See ' }, { type: 'text', text: 'https://x.test/a', marks: [{ type: 'link' }] }, { type: 'text', text: '.' }, { type: 'hardBreak' }] },
        { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'It\u2019s \u201cdone\u201d \u2014 really\u2026' }] }] }] }] };
    expect(storedWords(stored)).toBe(storedWords(plain));
    expect(storedWords('  plain\n\n text ')).toBe('plaintext');
});

test('a smart link, an emoji and a mention keep their words, and different words never match', () => {
    const card = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Build ' }, { type: 'inlineCard', attrs: { url: 'https://ci.test/9' } }, { type: 'emoji', attrs: { shortName: ':ok:' } }, { type: 'mention', attrs: { text: '@Riley' } }] }] };
    expect(storedWords(card)).toBe('Buildhttps://ci.test/9:ok:@Riley');
    expect(storedWords('QA passed')).not.toBe(storedWords('QA failed'));
});
