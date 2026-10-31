import { isDeepStrictEqual } from 'node:util';

function assert(condition: unknown, detail: string): asserts condition { if (!condition) throw new Error(detail); }

/** Merge frozen approved edits; only distinct list insertions in the approved topic may share an anchor. */
export function approvedText(original: string, proposal: string, base: string, documentationPath?: string): string {
    if (base === original || base === proposal) return proposal;
    if (proposal === original) return base;
    const lines = original.split('\n');
    type Edit = { start: number; end: number; added: string[] };
    const edits = (value: string): Edit[] => {
        const next = value.split('\n');
        let prefix = 0, end = lines.length, nextEnd = next.length;
        while (prefix < end && prefix < nextEnd && lines[prefix] === next[prefix]) prefix++;
        while (end > prefix && nextEnd > prefix && lines[end - 1] === next[nextEnd - 1]) { end--; nextEnd--; }
        const a = lines.slice(prefix, end), b = next.slice(prefix, nextEnd), width = b.length + 1;
        assert((a.length + 1) * width <= 8000000, 'Approved text delta exceeds its comparison bound');
        const lengths = new Uint32Array((a.length + 1) * width);
        for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
            lengths[i * width + j] = a[i] === b[j] ? 1 + lengths[(i + 1) * width + j + 1] : Math.max(lengths[(i + 1) * width + j], lengths[i * width + j + 1]);
        const result: Edit[] = [];
        let i = 0, j = 0, edit: Edit | undefined;
        while (i < a.length || j < b.length) {
            if (i < a.length && j < b.length && a[i] === b[j]) { if (edit) result.push(edit); edit = undefined; i++; j++; }
            else {
                edit ??= { start: prefix + i, end: prefix + i, added: [] };
                if (j < b.length && (i === a.length || lengths[i * width + j + 1] >= lengths[(i + 1) * width + j])) edit.added.push(b[j++]);
                else { i++; edit.end++; }
            }
        }
        if (edit) result.push(edit);
        return result;
    };
    const current = edits(base), approved = edits(proposal);
    const overlaps = (a: Edit, b: Edit) => a.start < b.end && b.start < a.end ||
        a.start === a.end && a.start >= b.start && a.start <= b.end ||
        b.start === b.end && b.start >= a.start && b.start <= a.end;
    // Only this already-approved documentation input admits distinct additive list entries.
    // A shared line position is insufficient for code, policy, source claims or a journal.
    const composeBullets = (a: Edit, b: Edit) => {
        if (documentationPath !== 'wiki/topics/official-source-freshness.md' ||
            a.start !== a.end || b.start !== b.end || a.start !== b.start ||
            ![original, proposal, base].every(text => text.endsWith('\n') && !text.includes('\r') && !/^[ \t]*(?:`{3,}|~{3,})/m.test(text))) return false;
        const before = lines[a.start - 1], after = lines[a.start];
        if (!before?.trim() || !after?.trim() ||
            lines.filter(line => line === before).length !== 1 || lines.filter(line => line === after).length !== 1) return false;
        const additions = [...a.added, ...b.added];
        return a.added.length > 0 && b.added.length > 0 && new Set(additions).size === additions.length &&
            additions.every(line => /^- \S.*$/.test(line) && !line.includes('```') && !line.includes('~~~') && !lines.includes(line));
    };
    for (const edit of approved) {
        if (current.some(other => isDeepStrictEqual(other, edit))) continue;
        const conflicts = current.filter(other => overlaps(edit, other));
        if (conflicts.length === 1 && composeBullets(conflicts[0], edit)) {
            // One splice keeps the current base's exact insertion before the approved one.
            conflicts[0].added.push(...edit.added);
        } else {
            assert(conflicts.length === 0, 'Approved text delta conflicts with the current base');
            current.push(edit);
        }
    }
    for (const edit of current.sort((a, b) => b.start - a.start)) lines.splice(edit.start, edit.end - edit.start, ...edit.added);
    return lines.join('\n');
}
