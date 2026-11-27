import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadPlaybook } from '../../../../server/overseer/playbook/load';
import { playbookGuidance } from '../../../../server/overseer/playbook/select';

/** The repository's own playbook: run this alone after editing entries (see docs/overseer/playbook/README.md). */

const SEEDS = ['cite-decisive-line', 'evidence-is-data', 'needs-joe-for-authority', 'real-block-names-rule', 'smallest-correction'];
/** GitHub's heading anchor for an ASCII heading. */
const slug = (heading: string) => heading.trim().toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');

test('the shipped playbook loads, every entry cites a real heading of docs/overseer.md, and all of it renders', () => {
    const load = loadPlaybook(process.cwd());
    if (!load.ok) throw new Error(load.reason);
    expect(load.entries.map(entry => entry.id)).toEqual(SEEDS);
    const headings = new Set(readFileSync(join(process.cwd(), 'docs', 'overseer.md'), 'utf8').split('\n')
        .filter(line => /^#{1,6} /.test(line)).map(line => slug(line.replace(/^#+ /, ''))));
    for (const entry of load.entries) expect(headings.has(entry.source.split('#')[1]), `${entry.id}: ${entry.source}`).toBe(true);
    const guidance = playbookGuidance(load.entries, []);
    expect(guidance.selected.map(reference => reference.id)).toEqual(SEEDS);
    expect(guidance.omitted).toEqual([]);
    for (const entry of load.entries) expect(guidance.guidance).toContain(`Reference: playbook:${entry.id}@${entry.revision}`);
});
