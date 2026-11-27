import { expect, test } from 'vitest';
import { MAX_LESSONS, SECTION_LIMIT, selectLessons, type LessonSelection } from '../../../../server/knowledge/lesson-selection';
import type { PlaybookEntry } from '../../../../server/overseer/playbook/entry';
import { playbookGuidance, RUNNER_HEADING } from '../../../../server/overseer/playbook/select';
import { entry } from './playbook-world';

const ids = (references: { id: string }[]) => references.map(reference => reference.id);
/** The real selector, keeping what it returned so the relabelled text can be compared with it. */
function recording() {
    const seen: LessonSelection[] = [];
    const select: typeof selectLessons = (store, input) => { const selection = selectLessons(store, input); seen.push(selection); return selection; };
    return { select, seen };
}
const injected = (text: string, selected: PlaybookEntry[], omitted: LessonSelection['omitted'] = []) => (): LessonSelection => ({
    text, eligible: [], omitted, selected: selected.map(({ id, revision }) => ({ scope: 'project', id, revision })),
});

test('the real selector ranks path matches first, at directory boundaries, then by id, for normalized caller paths', () => {
    const entries = [entry('c-plain', { paths: [] }), entry('a-plain', { paths: [] }), entry('d-folder', { paths: ['server/x'] }), entry('b-prefix', { paths: ['server/xy.ts'] })];
    for (const paths of [['server/x/file.ts'], ['./server/x/file.ts'], ['server\\x\\file.ts']]) {
        expect(ids(playbookGuidance(entries, paths).selected), paths[0]).toEqual(['d-folder', 'a-plain', 'b-prefix', 'c-plain']);
    }
    expect(ids(playbookGuidance(entries, ['server/xy.ts']).selected)).toEqual(['b-prefix', 'a-plain', 'c-plain', 'd-folder']);
    expect(ids(playbookGuidance(entries, []).selected)).toEqual(['a-plain', 'b-prefix', 'c-plain', 'd-folder']);
});

test('the same entries and paths give the same guidance, in any order and on every call', () => {
    const entries = Array.from({ length: 6 }, (_, i) => entry(`e${i}`, { paths: i % 2 ? ['server/a.ts'] : [] }));
    const first = playbookGuidance(entries, ['server/a.ts']);
    for (const order of [[...entries].reverse(), [entries[3], entries[0], entries[5], entries[1], entries[4], entries[2]], entries]) {
        expect(playbookGuidance(order, ['server/a.ts'])).toEqual(first);
    }
});

test('no entries is the explicit absence; a repeated id refuses before selection', () => {
    expect(playbookGuidance([], ['server/a.ts'])).toEqual({ guidance: null, selected: [], omitted: [] });
    let called = false;
    expect(() => playbookGuidance([entry('a'), entry('b'), entry('a', { revision: 2 })], [], () => { called = true; return selectLessons as never; })).toThrow('The playbook lists a twice');
    expect(called).toBe(false);
});

test('the count and character limits omit entries by reference and reason, exactly as the selector does', () => {
    const many = Array.from({ length: 12 }, (_, i) => entry(`e${String(i).padStart(2, '0')}`, { revision: i + 1 }));
    const counted = playbookGuidance(many, []);
    expect(MAX_LESSONS).toBe(10);
    expect(ids(counted.selected)).toEqual(ids(many.slice(0, 10)));
    expect(counted.omitted).toEqual([{ id: 'e10', revision: 11, reason: 'count-limit' }, { id: 'e11', revision: 12, reason: 'count-limit' }]);
    const long = Array.from({ length: 6 }, (_, i) => entry(`l${i}`, { when: 'w'.repeat(240), statement: 's'.repeat(240), check: 'c'.repeat(240), paths: ['p'.repeat(120)] }));
    const { select, seen } = recording();
    const sized = playbookGuidance(long, [], select);
    expect(ids(sized.selected)).toEqual(['l0', 'l1', 'l2', 'l3', 'l4', 'l5'].slice(0, sized.selected.length));
    expect(sized.selected.length + sized.omitted.length).toBe(6);
    expect(sized.omitted.length).toBeGreaterThan(0);
    expect(sized.omitted.every(item => item.reason === 'character-limit')).toBe(true);
    expect(sized.omitted.map(item => item.revision)).toEqual(sized.omitted.map(() => 1));
    expect(seen[0].text.length).toBeLessThanOrEqual(SECTION_LIMIT);
    expect(sized.guidance!.length).toBeLessThanOrEqual(seen[0].text.length);
});

test('an entry the selector omitted stays omitted, even when the shorter labels would have made room for it', () => {
    const lineOf = (value: PlaybookEntry) => { const { select, seen } = recording(); playbookGuidance([value], [], select); return seen[0].text.split('\n')[1].length; };
    const prose = { when: 'w'.repeat(240), statement: 's'.repeat(240), check: 'c'.repeat(240) };
    const first = entry('f1', { ...prose, paths: [1, 2, 3, 4].map(n => `${n}`.padEnd(120, 'p')) }), last = entry('f3', { ...first, id: 'f3' });
    const { select: probe, seen: heading } = recording();
    playbookGuidance([first], [], probe);
    const headingLength = heading[0].text.split('\n')[0].length;
    // Lines joined after the heading: one more character than the section limit in total.
    const target = SECTION_LIMIT + 1 - headingLength - 3 - lineOf(first) - lineOf(last);
    const wide = entry('f2', { ...prose, paths: [1, 2, 3].map(n => `${n}`.padEnd(120, 'p')) });
    const check = 240 - (lineOf(wide) - target);
    expect(check).toBeGreaterThan(0);
    const middle = entry('f2', { ...wide, check: 'c'.repeat(check) });
    expect(lineOf(middle)).toBe(target);
    const result = playbookGuidance([last, middle, first], []);
    expect(result.selected).toEqual([{ id: 'f1', revision: 1 }, { id: 'f2', revision: 1 }]);
    expect(result.omitted).toEqual([{ id: 'f3', revision: 1, reason: 'character-limit' }]);
    const relabelledLast = lineOf(last) - 'lesson:project:'.length + 'playbook:'.length;
    expect(result.guidance!.length + 1 + relabelledLast).toBeLessThanOrEqual(SECTION_LIMIT);
});

test('a maximal entry renders whole, relabelled, in ASCII and in supplementary characters', () => {
    const revision = Number.MAX_SAFE_INTEGER, id = 'a'.repeat(64);
    for (const unit of ['x', '\u{1F600}']) {
        const text = unit.repeat(240 / unit.length), path = (n: number) => `${n}${unit.repeat((119) / unit.length | 0)}`.slice(0, 120);
        const paths = [1, 2, 3, 4].map(path);
        const maximal = entry(id, { revision, kind: 'convention', when: text, statement: text, check: text, paths });
        const { select, seen } = recording();
        const result = playbookGuidance([maximal], [], select);
        const line = `- [convention · triage] When: ${text} Do: ${text} Check: ${text} (paths: ${paths.join(', ')}) Reference: playbook:${id}@${revision}`;
        expect(result.guidance).toBe(`${RUNNER_HEADING}\n${line}`);
        const original = seen[0].text.split('\n')[1];
        expect(original).toBe(line.replace('· triage]', '· review]').replace(`playbook:${id}`, `lesson:project:${id}`));
        expect(original.length).toBeLessThanOrEqual(1367);
        expect(result.guidance!.length).toBeLessThan(seen[0].text.length);
    }
});

test('the guidance never reads as Office lessons: runner heading, triage stage and playbook references', () => {
    const { select, seen } = recording();
    const result = playbookGuidance([entry('one'), entry('two', { kind: 'pitfall', revision: 3 })], [], select);
    expect(result.guidance!.split('\n')).toEqual([
        RUNNER_HEADING,
        '- [process · triage] When: Citing a refusal site in a verdict. Do: Cite the decisive line of a file given in the evidence. Check: The excerpt digest matches the frozen bytes. (paths: server/overseer/stages/triage.ts) Reference: playbook:one@1',
        '- [pitfall · triage] When: Citing a refusal site in a verdict. Do: Cite the decisive line of a file given in the evidence. Check: The excerpt digest matches the frozen bytes. (paths: server/overseer/stages/triage.ts) Reference: playbook:two@3',
    ]);
    expect(seen[0].text.startsWith('PROJECT LESSONS (')).toBe(true);
    expect(result.guidance).not.toContain('PROJECT LESSONS');
    expect(result.guidance).not.toContain('lesson:project:');
    expect(result.selected).toEqual([{ id: 'one', revision: 1 }, { id: 'two', revision: 3 }]);
});

test('malformed selector output fails closed, each for its own reason', () => {
    const one = entry('one'), lines = playbookGuidance([one], []).guidance!.split('\n');
    const original = `PROJECT LESSONS (advisory):\n${lines[1].replace('· triage]', '· review]').replace('playbook:one@1', 'lesson:project:one@1')}`;
    const select = (text: string, chosen = [one]) => () => playbookGuidance([one], [], injected(text, chosen));
    expect(select(original.replace('PROJECT LESSONS', 'OFFICE LESSONS'))).toThrow('heading has changed');
    expect(select(`${original}\n- [process · review] extra Reference: lesson:project:one@1`)).toThrow('one line per selected entry');
    expect(select(`${original.slice(0, -10)}…`)).toThrow('clipped or does not cite it');
    expect(select(original.replace('· review]', '· implement]'))).toThrow('clipped or does not cite it');
    expect(select(original.replace('lesson:project:one@1', 'lesson:project:one@2'))).toThrow('clipped or does not cite it');
    // The prefix and the citation overlap on their shared space: too short to hold any text between them.
    expect(select('PROJECT LESSONS (x):\n- [process · review] Reference: lesson:project:one@1')).toThrow('clipped or does not cite it');
    expect(select(original, [entry('ghost')])).toThrow('ghost@1, which is not in the playbook');
    expect(select(original, [entry('one', { revision: 2 })])).toThrow('one@2, which is not in the playbook');
    expect(select(original, [])).toThrow('returned text with nothing selected');
    // A heading shorter than the runner heading would make the relabelled text longer than the selection.
    expect(select(original)).toThrow('longer than the selection');
    const full = `${'PROJECT LESSONS ('.padEnd(RUNNER_HEADING.length, 'x')}\n${original.split('\n')[1]}`;
    expect(playbookGuidance([one], [], injected(full, [one])).guidance).toBe(lines.join('\n'));
});
