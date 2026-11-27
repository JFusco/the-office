import { expect, test } from 'vitest';
import { LESSON_KINDS } from '../../../../src/contracts/knowledge';
import { parseEntry, PLAYBOOK_KINDS, PLAYBOOK_STAGES } from '../../../../server/overseer/playbook/entry';
import { entryText, FIELDS } from './playbook-world';

const refused = (name: string, text: string) => {
    const read = parseEntry(name, text);
    expect(read.ok, text).toBe(false);
    return read.ok ? '' : read.reason;
};

test('an honest entry parses into exactly its fields', () => {
    const read = parseEntry('cite-decisive-line.md', entryText());
    expect(read).toEqual({ ok: true, entry: { ...FIELDS, stages: ['triage'], paths: ['server/overseer/stages/triage.ts'] } });
    expect(parseEntry('cite-decisive-line.md', entryText().replace(/\n$/, '')).ok).toBe(true);
});

test('the kinds are the knowledge lesson kinds, and every one parses', () => {
    expect([...PLAYBOOK_KINDS]).toEqual([...LESSON_KINDS]);
    for (const kind of LESSON_KINDS) expect(parseEntry('cite-decisive-line.md', entryText({ kind })).ok, kind).toBe(true);
    expect([...PLAYBOOK_STAGES]).toEqual(['triage']);
});

test('the three YAML hazards each refuse on their own, and the untagged control parses', () => {
    const lines = entryText().split('\n');
    const withLine = (index: number, line: string) => [...lines.slice(0, index), line, ...lines.slice(index)].join('\n');
    // A repeated known key, each value valid on its own.
    expect(refused('cite-decisive-line.md', withLine(3, 'revision: 2'))).toContain('not plain YAML');
    // A key that is not a string is refused by the parser, before the field check could see its stringified name.
    expect(refused('cite-decisive-line.md', withLine(3, '? [id]\n: x'))).toContain('not plain YAML');
    // An alias to an anchored scalar whose value would satisfy the field.
    expect(refused('cite-decisive-line.md', entryText({}, { when: '&w Citing a refusal site.', statement: '*w' }))).toContain('alias');
    // An unresolved tag on a valid text field: yaml reports it as a warning and still yields the string.
    expect(refused('cite-decisive-line.md', entryText({}, { statement: '!foo Check the frozen evidence.' }))).toContain('not plain YAML');
    expect(parseEntry('cite-decisive-line.md', entryText({}, { statement: 'Check the frozen evidence.' })).ok).toBe(true);
});

test('framing is exact: no body, no missing lines, no second document, no BOM, no CRLF', () => {
    const text = entryText();
    for (const broken of [
        `${text}A body.\n`, text.replace(/^---\n/, ''), text.replace(/---\n$/, ''), `${text}\n`, `\uFEFF${text}`,
        text.replace(/\n/g, '\r\n'), text.replace(/^(when: .*)$/m, '---\n$1'), '---\n---\n',
    ]) expect(refused('cite-decisive-line.md', broken)).toBeTruthy();
    expect(refused('cite-decisive-line.md', text.replace(/^(when: .*)$/m, '$1\n  : [unclosed'))).toContain('not plain YAML');
});

test('each field refuses a wrong value on its own', () => {
    const name = 'cite-decisive-line.md';
    const cases: Record<string, unknown>[] = [
        { unknown: 'x' }, { id: undefined }, { revision: undefined }, { kind: undefined }, { stages: undefined },
        { when: undefined }, { statement: undefined }, { check: undefined }, { paths: undefined }, { source: undefined },
        { revision: 0 }, { revision: 1.5 }, { revision: '1' }, { revision: 2 ** 53 },
        { kind: 'any' }, { kind: 'lesson' }, { stages: [] }, { stages: ['review'] }, { stages: ['triage', 'triage'] }, { stages: 'triage' },
        { when: '' }, { when: '   ' }, { when: ' padded' }, { when: 'a\u0007b' }, { when: 'x'.repeat(241) }, { check: 'a\u2028b' }, { statement: 7 },
        { paths: ['/abs/file.ts'] }, { paths: ['C:/file.ts'] }, { paths: ['server\\file.ts'] }, { paths: ['server/../x.ts'] }, { paths: ['./x.ts'] },
        { paths: ['server//x.ts'] }, { paths: ['server/x/'] }, { paths: [''] }, { paths: ['x'.repeat(121)] }, { paths: ['a.ts', 'a.ts'] },
        { paths: ['a', 'b', 'c', 'd', 'e'] }, { paths: ['a\u0085b'] }, { paths: [' server/x.ts'] }, { paths: ['server/x.ts '] },
        { source: 'docs/office-process.md#x' }, { source: 'docs/overseer.md' }, { source: 'docs/overseer.md#Triage' },
    ];
    for (const change of cases) expect(refused(name, entryText(change)), JSON.stringify(change)).toBeTruthy();
    expect(refused(name, entryText({ when: 'Two\nlines' }))).toBeTruthy();
    // An id is checked on its own, under a file name that matches it.
    for (const id of ['Cite-Decisive-Line', 'cite--decisive', '-cite', 'cite_line', 'x'.repeat(65)]) expect(refused(`${id}.md`, entryText({ id })), id).toMatch(/: id /);
    expect(parseEntry(`${'x'.repeat(64)}.md`, entryText({ id: 'x'.repeat(64) })).ok).toBe(true);
    expect(refused('other-name.md', entryText())).toContain('the id must equal the file name');
    expect(refused('cite-decisive-line.txt', entryText())).toContain('<id>.md');
    expect(parseEntry(name, entryText({ when: 'x'.repeat(240), paths: ['p'.repeat(120)], revision: Number.MAX_SAFE_INTEGER })).ok).toBe(true);
});

test('length is counted in UTF-16 units, so supplementary characters that fit by code point still refuse', () => {
    const wide = '\u{1F600}'.repeat(121); // 121 code points, 242 UTF-16 units
    expect([...wide]).toHaveLength(121);
    expect(refused('cite-decisive-line.md', entryText({ when: wide }))).toBeTruthy();
    expect(refused('cite-decisive-line.md', entryText({ paths: ['\u{1F600}'.repeat(61)] }))).toBeTruthy();
    expect(parseEntry('cite-decisive-line.md', entryText({ when: '\u{1F600}'.repeat(120) })).ok).toBe(true);
});
