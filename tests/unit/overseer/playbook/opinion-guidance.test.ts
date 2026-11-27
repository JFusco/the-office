import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadPlaybook } from '../../../../server/overseer/playbook/load';
import { playbookGuidance } from '../../../../server/overseer/playbook/select';
import { prepareOpinionInput } from '../../../../server/overseer/stages/triage';
import { sourcesFor } from '../triage-world';
import { entry, installation } from './playbook-world';

/** How selected guidance enters the one frozen input both opinions share. */

const frozenWith = (guidance: string | null) => {
    const prepared = prepareOpinionInput(sourcesFor(undefined, { guidance }));
    if (!prepared.ok) throw new Error(prepared.reason);
    return prepared.input;
};
const decoded = (serialized: string) => (JSON.parse(serialized) as { guidance: unknown }).guidance;

test('selected guidance is frozen as exactly its text, and no selection as its explicit absence', () => {
    const selection = playbookGuidance([entry('one'), entry('two')], []);
    expect(selection.guidance).toContain('\n');
    expect(decoded(frozenWith(selection.guidance).serialized)).toEqual({ text: selection.guidance });
    const empty = playbookGuidance([], []);
    expect(empty.guidance).toBeNull();
    expect(decoded(frozenWith(empty.guidance).serialized)).toEqual({ absent: true });
});

test('a change to the selected text changes the input identity; an edit to an entry that stays omitted does not', () => {
    const many = Array.from({ length: 11 }, (_, i) => entry(`e${String(i).padStart(2, '0')}`));
    const base = playbookGuidance(many, []);
    expect(base.omitted.map(item => item.id)).toEqual(['e10']);
    const identity = frozenWith(base.guidance).identity;
    const selectedEdit = many.map(item => item.id === 'e03' ? { ...item, statement: 'A different action.' } : item);
    expect(frozenWith(playbookGuidance(selectedEdit, []).guidance).identity).not.toBe(identity);
    const omittedEdit = many.map(item => item.id === 'e10' ? { ...item, statement: 'A different action.', revision: 9 } : item);
    const omitted = playbookGuidance(omittedEdit, []);
    expect(omitted.guidance).toBe(base.guidance);
    expect(frozenWith(omitted.guidance).identity).toBe(identity);
});

test('a playbook that fails to load is a refusal, never an absent guidance', () => {
    const { root, folder } = installation();
    rmSync(join(folder, 'README.md'));
    const load = loadPlaybook(root);
    expect(load).toEqual({ ok: false, code: 'malformed', reason: 'README.md is missing' });
    expect('entries' in load).toBe(false);
});
