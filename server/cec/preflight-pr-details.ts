import { CEC } from '../office/config';
import { sanitizeObject } from '../office/security';
import { prUrl } from './azure';

export type PRRead = (args: string[]) => Promise<any>;
function observation(row: any) {
    if (!row || !Number.isInteger(row.pullRequestId) || row.pullRequestId <= 0 || row.status !== 'active' ||
        row.repository?.id !== CEC.repositoryId || row.repository?.name !== CEC.repository ||
        typeof row.title !== 'string' || typeof row.isDraft !== 'boolean' ||
        typeof row.sourceRefName !== 'string' || !row.sourceRefName.startsWith('refs/heads/') ||
        typeof row.targetRefName !== 'string' || !row.targetRefName.startsWith('refs/heads/') ||
        !/^[a-f0-9]{40}$/.test(row.lastMergeSourceCommit?.commitId || '') ||
        row.description != null && typeof row.description !== 'string')
        throw new Error('CEC native PR identity or head coverage is incomplete; no absence or dispatch authorized');
    return sanitizeObject({ id: row.pullRequestId, title: row.title, draft: row.isDraft, source: row.sourceRefName,
        target: row.targetRefName, commit: row.lastMergeSourceCommit.commitId, description: row.description || '', url: prUrl(row.pullRequestId) });
}

/** Azure list descriptions can be abbreviated. Only the exact PR detail read supplies its body. */
export async function fullActivePRs(rows: any[], read: PRRead) {
    const out = [];
    for (const row of rows) {
        const listed = observation(row);
        const full = observation(await read(['repos', 'pr', 'show', '--id', String(listed.id), '--detect', 'false']));
        const identity = ({ description: _body, ...value }: typeof full) => value;
        if (JSON.stringify(identity(listed)) !== JSON.stringify(identity(full)))
            throw new Error('CEC active PR identity or head changed between list and detail reads; retain the observation and recheck');
        out.push(full);
    }
    return out.sort((a, b) => a.id - b.id);
}
