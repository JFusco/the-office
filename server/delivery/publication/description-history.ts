import { projectGraphql, type Execute } from '../board/project-graphql';
import { digest } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import type { DescriptionRevision } from '../../../src/contracts/pr-metadata';

/**
 * One saved edit of a pull request's description, as GitHub's `userContentEdits` lists it. `editor` is the account
 * GitHub records for the edit (null when it shows none), read for #531's attribution; it never enters the revision
 * digest, so every saved stale-description revision keeps matching. Certification on it stays disabled until D5.
 */
export interface DescriptionEdit { id: string; createdAt: string; editedAt: string; deletedAt: string | null; editor?: { login: string; id: string | null } | null }
/** A pull request's identity, live title and body, and its complete description edit history. */
export interface DescriptionHistory {
    repository: string; number: number; url: string; state: string; base: string; branch: string; head: string;
    title: string; body: string; createdAt: string;
    lastEditedAt: string | null; includesCreatedEdit: boolean; edits: DescriptionEdit[]; revision: DescriptionRevision;
}
/** The provider's answer was missing, partial or malformed. Never a negative result. */
export class DescriptionHistoryUnavailable extends Error {}

/** More edits than one page holds is not a history the harness reads. */
const EDITS = 100;
const QUERY = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){nameWithOwner pullRequest(number:$number){number url state baseRefName headRefName headRefOid title body createdAt lastEditedAt includesCreatedEdit userContentEdits(first:${EDITS}){totalCount nodes{id createdAt editedAt deletedAt editor{login ... on Node{id}}} pageInfo{hasNextPage}}}}}`;

const text = (value: unknown): value is string => typeof value === 'string';
const time = (value: unknown): value is string => text(value) && Number.isFinite(Date.parse(value));

/** The edit history alone, as one reproducible fingerprint. The last edit is the one GitHub dates `lastEditedAt`. */
export function descriptionRevision(history: Pick<DescriptionHistory, 'lastEditedAt' | 'includesCreatedEdit' | 'edits'>): DescriptionRevision {
    // The digest's own projection, in its original serialization order: the editor read is not part of it.
    const edits = [...history.edits].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(({ id, createdAt, editedAt, deletedAt }) => ({ id, createdAt, editedAt, deletedAt }));
    const last = edits.filter(e => e.editedAt === history.lastEditedAt);
    return { sha256: digest({ lastEditedAt: history.lastEditedAt, includesCreatedEdit: history.includesCreatedEdit, edits }),
        edits: edits.length, lastEditId: last.length === 1 ? last[0].id : null, lastEditedAt: history.lastEditedAt };
}

/** Reads one pull request and its complete description edit history. Any gap in the answer is a read error. */
export async function readDescriptionHistory(store: Store, execute: Execute, number: number): Promise<DescriptionHistory> {
    const repository = store.project.repository, [owner, name] = repository.split('/');
    const data = await projectGraphql(store, execute, QUERY, { owner, name, number });
    const pr = data?.repository?.pullRequest, connection = pr?.userContentEdits, nodes = connection?.nodes;
    if (data?.repository?.nameWithOwner !== repository || pr?.number !== number || pr.url !== `https://github.com/${repository}/pull/${number}` ||
        ![pr.state, pr.baseRefName, pr.headRefName, pr.title, pr.body].every(text) || !/^[a-f0-9]{40}$/.test(pr.headRefOid) || !time(pr.createdAt) ||
        pr.lastEditedAt !== null && !time(pr.lastEditedAt) || typeof pr.includesCreatedEdit !== 'boolean' ||
        !Array.isArray(nodes) || !Number.isSafeInteger(connection.totalCount) || connection.totalCount !== nodes.length || connection.totalCount > EDITS ||
        connection.pageInfo?.hasNextPage !== false)
        throw new DescriptionHistoryUnavailable(`PR #${number} description history is incomplete or malformed`);
    const edits: DescriptionEdit[] = nodes.map((node: any) => {
        if (!text(node?.id) || !node.id || !time(node.createdAt) || !time(node.editedAt) || node.deletedAt !== null && !time(node.deletedAt) ||
            node.editor != null && (!text(node.editor.login) || !node.editor.login || node.editor.id !== undefined && node.editor.id !== null && !text(node.editor.id)))
            throw new DescriptionHistoryUnavailable(`PR #${number} description history has a malformed edit`);
        const editor = node.editor == null ? null : { login: node.editor.login as string, id: text(node.editor.id) ? node.editor.id : null };
        return { id: node.id, createdAt: node.createdAt, editedAt: node.editedAt, deletedAt: node.deletedAt, editor };
    });
    if (new Set(edits.map(e => e.id)).size !== edits.length) throw new DescriptionHistoryUnavailable(`PR #${number} description history repeats an edit`);
    const history = { repository, number, url: pr.url, state: pr.state, base: pr.baseRefName, branch: pr.headRefName, head: pr.headRefOid,
        title: pr.title, body: pr.body, createdAt: pr.createdAt, lastEditedAt: pr.lastEditedAt, includesCreatedEdit: pr.includesCreatedEdit, edits };
    return { ...history, revision: descriptionRevision(history) };
}

/** True when the history shows the description exactly as it was created: no edit, and no edit time. */
export function uneditedDescription(history: DescriptionHistory): boolean {
    return history.lastEditedAt === null && !history.includesCreatedEdit && history.edits.length === 0;
}
