import { parseDocument } from 'yaml';
import { z } from 'zod';
import type { LessonKind } from '../../../src/contracts/knowledge';

/**
 * One entry of the Overseer playbook (`docs/overseer/playbook/`): advisory runner guidance, never an
 * Office lesson and never authority. An entry file is YAML frontmatter only, so nothing in it lies
 * outside what this reader checks.
 */

/** The Overseer's reader stages. `triage` covers both opinions, which share one frozen input. */
export const PLAYBOOK_STAGES = ['triage'] as const;
export const PLAYBOOK_KINDS = ['convention', 'pitfall', 'process', 'tooling'] as const satisfies readonly LessonKind[];
/** In JavaScript string length (UTF-16 units): these bounds keep a rendered entry under the lesson selector's line limit. */
export const PROSE_MAX = 240, PATH_MAX = 120, PATHS_MAX = 4, ID_MAX = 64;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const unique = (values: readonly unknown[]) => new Set(values).size === values.length;

const prose = z.string().refine(value => value.length > 0 && value.length <= PROSE_MAX && value.trim() === value && !CONTROL.test(value),
    { message: `must be trimmed, non-blank, single-line text of at most ${PROSE_MAX} characters` });
/** Canonical repository-relative spelling: forward slashes, no root or drive, and no empty, `.` or `..` component. */
const repositoryPath = z.string().refine(value => value.length <= PATH_MAX && value.trim() === value && !CONTROL.test(value)
    && !value.includes('\\') && !/^[A-Za-z]:/.test(value) && value.split('/').every(part => part !== '' && part !== '.' && part !== '..'),
    { message: `must be a canonical repository-relative path of at most ${PATH_MAX} characters` });

const EntrySchema = z.strictObject({
    id: z.string().max(ID_MAX).regex(SLUG),
    // Zod's `int()` is a safe integer.
    revision: z.number().int().min(1),
    kind: z.enum(PLAYBOOK_KINDS),
    stages: z.array(z.enum(PLAYBOOK_STAGES)).min(1).refine(unique, { message: 'must not repeat a stage' }),
    when: prose,
    statement: prose,
    check: prose,
    paths: z.array(repositoryPath).max(PATHS_MAX).refine(unique, { message: 'must not repeat a path' }),
    source: z.string().regex(/^docs\/overseer\.md#[a-z0-9]+(-[a-z0-9]+)*$/),
});
export type PlaybookEntry = z.infer<typeof EntrySchema>;
export type EntryRead = { ok: true; entry: PlaybookEntry } | { ok: false; reason: string };

/** An opening `---` line, the mapping, a closing `---` line and at most one final newline. No body. */
const FRAME = /^---\n([\s\S]*)\n---\n?$/;

/** Reads one entry file named `name` (`<id>.md`). Any parser error or warning, alias, unknown field or bad value refuses it. */
export function parseEntry(name: string, text: string): EntryRead {
    const refuse = (reason: string): EntryRead => ({ ok: false, reason: `${name}: ${reason}` });
    if (!name.endsWith('.md')) return refuse('an entry file is named <id>.md');
    const framed = FRAME.exec(text);
    if (!framed) return refuse('an entry is frontmatter only: an opening --- line, the fields and a closing --- line');
    const document = parseDocument(framed[1], { strict: true, uniqueKeys: true, stringKeys: true, prettyErrors: false });
    if (document.errors.length || document.warnings.length) return refuse('the frontmatter is not plain YAML');
    let value: unknown;
    try { value = document.toJS({ maxAliasCount: 0 }); }
    catch { return refuse('the frontmatter uses an alias'); }
    const parsed = EntrySchema.safeParse(value);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return refuse(`${issue.path.join('.') || 'the frontmatter'} ${issue.message}`);
    }
    if (parsed.data.id !== name.slice(0, -'.md'.length)) return refuse('the id must equal the file name');
    return { ok: true, entry: parsed.data };
}
