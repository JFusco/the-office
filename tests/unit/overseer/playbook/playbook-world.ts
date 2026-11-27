import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PlaybookEntry } from '../../../../server/overseer/playbook/entry';
import { tempDir } from '../runner-world';

/** Test support for the runner playbook: entry text and temporary installations holding a playbook. */

export const FIELDS: PlaybookEntry = {
    id: 'cite-decisive-line', revision: 1, kind: 'process', stages: ['triage'],
    when: 'Citing a refusal site in a verdict.', statement: 'Cite the decisive line of a file given in the evidence.',
    check: 'The excerpt digest matches the frozen bytes.', paths: ['server/overseer/stages/triage.ts'],
    source: 'docs/overseer.md#triage-and-corroboration',
};

/**
 * An entry file: `change` replaces or (with `undefined`) removes fields, each written as JSON, which is
 * YAML; `raw` gives a field's literal YAML text instead, for anchors, aliases and tags.
 */
export function entryText(change: Record<string, unknown> = {}, raw: Record<string, string> = {}): string {
    const fields: Record<string, unknown> = { ...FIELDS, ...change };
    const lines = Object.entries(fields).filter(([key, value]) => value !== undefined || key in raw)
        .map(([key, value]) => `${key}: ${key in raw ? raw[key] : JSON.stringify(value)}`);
    return `---\n${lines.join('\n')}\n---\n`;
}

export const entry = (id: string, change: Partial<PlaybookEntry> = {}): PlaybookEntry => ({ ...FIELDS, id, ...change });

/** A temporary installation root whose `docs/overseer/playbook/` holds a README and these entry files. */
export function installation(files: Record<string, string> = { 'cite-decisive-line.md': entryText() }): { root: string; folder: string } {
    const root = tempDir('playbook-'), folder = join(root, 'docs', 'overseer', 'playbook');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'README.md'), '# Playbook\n');
    for (const [name, text] of Object.entries(files)) writeFileSync(join(folder, name), text);
    return { root, folder };
}
