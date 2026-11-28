import { createHash } from 'node:crypto';
import { isSha, type Git } from './original-git';
import { indeterminate } from './release-marker-stop';

/** One commit object exactly as read: its header block, tree, parents and message. */
export interface CommitObject { sha: string; raw: string; headers: string; tree: string; parents: string[]; message: string; signed: boolean }

/** Git's SHA-1 commit identity of these bytes: `commit <length>\0<bytes>`, as blobs are framed (`local-worktree-removal.ts`). */
export const commitOid = (raw: string) => { const bytes = Buffer.from(raw, 'utf8'); return createHash('sha1').update(`commit ${bytes.length}\0`).update(bytes).digest('hex'); };

/** Split a raw commit object without trimming anything. */
export function parseCommit(sha: string, raw: string): CommitObject {
    const split = raw.indexOf('\n\n');
    if (split < 0) throw indeterminate(`incompatible history: commit ${sha} has no message separator`, sha);
    const headers = raw.slice(0, split), tree = /^tree ([a-f0-9]{40})$/m.exec(headers)?.[1] ?? '';
    const parents = [...headers.matchAll(/^parent ([a-f0-9]{40})$/gm)].map(match => match[1]);
    return { sha, raw, headers, tree, parents, message: raw.slice(split + 2), signed: /^(?:gpgsig|gpgsig-sha256|mergetag) /m.test(headers) };
}

/**
 * Read a commit once, untrimmed, and prove the bytes are the object: the read is encoded back to UTF-8 and hashed in
 * memory. A lossy read (a non-UTF-8 author, say) cannot pass, so history the Office cannot reproduce exactly stops.
 */
export async function readCommit(git: Git, sha: string): Promise<CommitObject> {
    if (!isSha(sha)) throw indeterminate('incompatible history: an exact commit identity is required', sha);
    let raw: string;
    try { raw = await git(['cat-file', 'commit', sha]); }
    catch { throw indeterminate(`incompatible history: commit ${sha} is unreadable`, sha); }
    if (commitOid(raw) !== sha) throw indeterminate(`incompatible history: commit ${sha} does not read back as its own bytes`, sha);
    const commit = parseCommit(sha, raw);
    if (!isSha(commit.tree)) throw indeterminate(`incompatible history: commit ${sha} names no tree`, sha);
    return commit;
}

/** The helper's single final-LF convention (`rewordCommits`). */
export const withFinalLF = (message: string) => message.endsWith('\n') ? message : `${message}\n`;

/** The most commits one return or correction covers. */
export const MAX_SUFFIX = 100;

/**
 * The writer's suffix from `boundary` to `head`, oldest first: 1 to 100 commits in one complete single-parent chain
 * that starts at that exact boundary and ends at that exact head, each read and proven once, none signed. Signed,
 * merged or otherwise incompatible history stops; it is never rewritten.
 */
export async function readSuffix(git: Git, boundary: string, head: string): Promise<CommitObject[]> {
    if (!isSha(boundary) || !isSha(head)) throw indeterminate('incompatible history: an exact suffix boundary and head are required', head);
    let listed: string[];
    try { listed = (await git(['rev-list', '--reverse', '--topo-order', head, `^${boundary}`])).split('\n').filter(Boolean); }
    catch { throw indeterminate(`incompatible history: the suffix ${boundary}..${head} is unreadable`, head); }
    if (!listed.length || listed.length > MAX_SUFFIX || !listed.every(isSha)) throw indeterminate(`incompatible history: the suffix holds ${listed.length} commits; 1 to ${MAX_SUFFIX} are supported`, head);
    const commits: CommitObject[] = [];
    let previous = boundary;
    for (const sha of listed) {
        const commit = await readCommit(git, sha);
        if (commit.parents.length !== 1 || commit.parents[0] !== previous) throw indeterminate(`incompatible history: ${sha} is not a single-parent child of ${previous}`, sha);
        if (commit.signed) throw indeterminate(`incompatible history: ${sha} is signed`, sha);
        commits.push(commit);
        previous = sha;
    }
    if (previous !== head) throw indeterminate(`incompatible history: the suffix does not end at ${head}`, head);
    return commits;
}
