import { isDeepStrictEqual } from 'node:util';
import { optionalDescriptionHistory, readDescriptionHistory, type DescriptionHistory } from './description-history';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { DescriptionRevision, PRMetadataRepair } from '../../../src/contracts/pr-metadata';

interface Written { head: string; title: string; body: string }

/** The pull request GitHub returned for the PATCH, when it is this pull request on this head with these exact bytes. */
function acknowledged(response: string, after: DescriptionHistory, written: Written): boolean {
    try {
        const pr = JSON.parse(response);
        return pr?.number === after.number && pr.html_url === after.url && pr.head?.sha === written.head && pr.title === written.title && pr.body === written.body;
    } catch { return false; }
}

/**
 * The revision one description PATCH produced, when the histories read before and after it show that write and
 * nothing else: the acknowledged response and the read-back carry the exact bytes on the intended head, every
 * earlier edit is kept unchanged, nothing is deleted, and exactly one new edit carries the last edit time. On a
 * description's first edit GitHub also lists the original text as an edit dated at the pull request's creation,
 * so that first write adds two. Null when anything else could have produced the revision.
 */
export function certifiedEdit(before: DescriptionHistory, after: DescriptionHistory, written: Written, response: string): DescriptionRevision | null {
    if (before.repository !== after.repository || before.number !== after.number || before.url !== after.url || before.createdAt !== after.createdAt ||
        after.state !== 'OPEN' || after.head !== written.head || after.title !== written.title || after.body !== written.body || before.body === written.body ||
        !acknowledged(response, after, written) || after.edits.some(e => e.deletedAt !== null) ||
        !before.edits.every(e => isDeepStrictEqual(after.edits.find(a => a.id === e.id), e)))
        return null;
    const added = after.edits.filter(e => !before.edits.some(b => b.id === e.id));
    const first = before.edits.length === 0 && before.lastEditedAt === null && !before.includesCreatedEdit;
    const original = first ? added.filter(e => e.editedAt === after.createdAt) : [];
    const edit = added.filter(e => !original.includes(e));
    if (first ? !after.includesCreatedEdit || added.length !== 2 || original.length !== 1 : !before.includesCreatedEdit || !after.includesCreatedEdit || added.length !== 1)
        return null;
    if (edit.length !== 1 || after.revision.lastEditId !== edit[0].id || after.lastEditedAt !== edit[0].editedAt ||
        before.lastEditedAt !== null && Date.parse(edit[0].editedAt) <= Date.parse(before.lastEditedAt))
        return null;
    return after.revision;
}

/**
 * The history just before a metadata PATCH. On a stale-description refresh it must still be the revision and bytes
 * the proof bound: a description edited and then restored has a new revision, so the write stops. Elsewhere it is
 * only collected, and a failed read leaves the write without provenance.
 */
export async function historyBeforeWrite(store: Store, execute: Execute, b: PRMetadataRepair['binding']): Promise<DescriptionHistory | undefined> {
    if (!b.staleDescription) return optionalDescriptionHistory(store, execute, b.pr);
    const h = await readDescriptionHistory(store, execute, b.pr);
    if (h.revision.sha256 !== b.staleDescription.revision.sha256 || h.url !== b.url || h.state !== 'OPEN' || h.head !== b.head || h.branch !== b.branch ||
        h.title !== b.before.title || h.body !== b.before.body)
        throw new Error('The pull request description changed after its stale-description proof; it will not be refreshed');
    return h;
}

/** Reads the history after a write and certifies it; a missing read or an uncertifiable write leaves no provenance. */
export async function certifyDescriptionWrite(store: Store, execute: Execute, before: DescriptionHistory | undefined, written: Written, response: string): Promise<DescriptionRevision | undefined> {
    if (!before) return undefined;
    const after = await optionalDescriptionHistory(store, execute, before.number);
    return after && certifiedEdit(before, after, written, response) || undefined;
}
