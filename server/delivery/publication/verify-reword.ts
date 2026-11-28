import { commitOid, readCommit, withFinalLF, type CommitObject } from './commit-object';
import { isSha, type Git } from './original-git';
import { indeterminate } from './release-marker-stop';

/** A mapping the harness verified commit by commit before it may move a branch. */
export interface VerifiedMapping { boundary: string; refusedHead: string; newHead: string; mapping: { oldHead: string; newHead: string; tree: string }[] }

/** The original header block with only its one parent line replaced. */
function withParent(headers: string, from: string, to: string): string {
    const lines = headers.split('\n'), index = lines.findIndex(line => line === `parent ${from}`);
    if (index < 0 || lines.filter(line => line.startsWith('parent ')).length !== 1) throw indeterminate('incompatible history: a rewritten commit has no single parent line');
    lines[index] = `parent ${to}`;
    return lines.join('\n');
}

/**
 * Verify what `rewordCommits` offered, independently of it. Both sequences are walked in order: the mapping must be
 * complete and one-to-one, each commit's first parent the saved boundary or the verified mapped predecessor, and every
 * other header byte (order, continuation lines, tree, author, committer, dates, encoding) identical, with no signature
 * or mergetag. A submitted message must equal the developer's approved message with its one final LF; every other
 * message keeps its exact bytes. The expected object is hashed and compared with the mapped OID and with the object
 * read back, so a second lossy read, a changed committer, a changed intermediate tree or a newline the helper added
 * to an unauthorized message all stop here, before any ref moves.
 */
export async function verifyReword(git: Git, boundary: string, originals: CommitObject[], approved: Map<string, string>,
    offered: { head: string; mapping: { oldHead: string; newHead: string }[] }): Promise<VerifiedMapping> {
    const stop = (diagnostic: string, sha?: string) => indeterminate(`unverified correction: ${diagnostic}`, sha);
    if (offered.mapping.length !== originals.length) throw stop(`the helper mapped ${offered.mapping.length} commits for ${originals.length}`);
    const mapping: VerifiedMapping['mapping'] = [];
    let previous = boundary, changed = false;
    for (const [index, original] of originals.entries()) {
        const offer = offered.mapping[index];
        if (offer?.oldHead !== original.sha || !isSha(offer.newHead)) throw stop(`mapping ${index + 1} does not name ${original.sha} in order`, original.sha);
        const message = approved.has(original.sha) ? withFinalLF(approved.get(original.sha)!) : original.message;
        const expected = `${withParent(original.headers, original.parents[0], previous)}\n\n${message}`;
        if (commitOid(expected) !== offer.newHead) throw stop(`${offer.newHead} is not the expected rewrite of ${original.sha}`, original.sha);
        const actual = await readCommit(git, offer.newHead);
        if (actual.raw !== expected || actual.signed || actual.tree !== original.tree) throw stop(`${offer.newHead} does not read back as the expected rewrite of ${original.sha}`, original.sha);
        if (!changed && expected === original.raw && offer.newHead !== original.sha) throw stop(`the unaffected prefix commit ${original.sha} was rewritten`, original.sha);
        changed ||= expected !== original.raw;
        mapping.push({ oldHead: original.sha, newHead: offer.newHead, tree: actual.tree });
        previous = offer.newHead;
    }
    if (previous !== offered.head) throw stop(`the offered tip ${offered.head} is not the last verified rewrite ${previous}`);
    return { boundary, refusedHead: originals.at(-1)!.sha, newHead: previous, mapping };
}
