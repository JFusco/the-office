import { createHash } from 'node:crypto';
import type { AzureGoalDocument, AzurePR } from '../src/shared';
import type { Store } from './store';
type EvidenceStore = Pick<Store, 'project' | 'state' | 'clock'>;
import { sanitize } from './security';

export const GOAL_EVIDENCE_LIMITS = { bodyBytes: 8192, paths: 2, commits: 2, documentBytes: 32768, retryMs: 30000 } as const;
export function boundedEvidence(value: string, bytes: number) {
    const raw = Buffer.from(sanitize(value)), clipped = raw.subarray(0, bytes);
    // Do not leave a replacement character when the last UTF-8 character was split.
    let text = clipped.toString('utf8');
    while (Buffer.byteLength(text) > clipped.length) text = text.slice(0, -1);
    return { text, bytes: raw.length, truncated: raw.length > bytes };
}
export function goalEvidencePath(value: unknown): value is string {
    return typeof value === 'string' && value.length <= 240 && /^\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.md$/.test(value) && !value.split('/').some(part => part === '.' || part === '..');
}
export function azurePRDescription(value: unknown): Pick<AzurePR, 'description' | 'descriptionTruncated'> {
    const body = boundedEvidence(typeof value === 'string' ? value : '', GOAL_EVIDENCE_LIMITS.bodyBytes);
    return { description: body.text, descriptionTruncated: body.truncated };
}
/** Called only by the existing asynchronous Azure observation operation, never a snapshot collector. */
export async function collectAzureGoalDocuments(store: EvidenceStore, binding: { projectId: string; repository: string; repositoryId: string; project: string }, read: (args: string[]) => Promise<unknown>, now: string) {
    const { repositoryId } = binding;
    if (store.project.id !== binding.projectId || store.project.provider !== 'azure' || store.project.repository !== binding.repository || !repositoryId || !binding.project) throw new Error('Goal evidence provider does not match the owning project');
    const paths = store.project.goalEvidencePaths || [], gaps: string[] = [];
    if (!paths.length) gaps.push('No acceptance document paths configured; request goal-specific evidence from the owning delivery team.');
    if (paths.length > GOAL_EVIDENCE_LIMITS.paths || paths.some(path => !goalEvidencePath(path)) || new Set(paths).size !== paths.length)
        return { documents: [] as AzureGoalDocument[], gaps: ['Configured acceptance document paths are invalid or exceed the bounded allowlist.'] };
    const targets: { commit: string; context: AzureGoalDocument['context'] }[] = [];
    for (const deployed of store.state.azure.deployed)
        if (deployed.commit && /^[a-f0-9]{40}$/.test(deployed.commit)) targets.push({ commit: deployed.commit, context: 'deployed' });
    for (const pr of store.state.azure.prs)
        if (/^[a-f0-9]{40}$/.test(pr.mergeCommit || pr.commit)) targets.push({ commit: pr.mergeCommit || pr.commit, context: 'pr' });
    const unique = targets.filter((target, index) => targets.findIndex(other => other.commit === target.commit) === index).slice(0, GOAL_EVIDENCE_LIMITS.commits);
    const documents: AzureGoalDocument[] = [];
    for (const target of unique) for (const path of paths) {
        const previous = store.state.azure.goalDocuments?.find(doc => doc.projectId === store.project.id && doc.repository === store.project.repository && doc.repositoryId === repositoryId && doc.commit === target.commit && doc.path === path);
        if (previous && ((!previous.error && typeof previous.text === 'string' && Buffer.byteLength(previous.text) <= GOAL_EVIDENCE_LIMITS.documentBytes && /^[a-f0-9]{40}$/.test(previous.blob) && previous.sha256 === createHash('sha256').update(previous.text).digest('hex')) || (previous.error && Date.parse(now) - Date.parse(previous.observedAt) < GOAL_EVIDENCE_LIMITS.retryMs))) {
            documents.push({ ...previous, context: target.context }); continue;
        }
        const document: AzureGoalDocument = { projectId: store.project.id, repository: store.project.repository, repositoryId, ...target, path, blob: '', sha256: '', observedAt: now, text: '', bytes: 0, truncated: false, error: '' };
        try {
            const value = await read(['devops', 'invoke', '--area', 'git', '--resource', 'items', '--route-parameters', `project=${binding.project}`, `repositoryId=${repositoryId}`, '--query-parameters', `path=${path}`, `versionDescriptor.version=${target.commit}`, 'versionDescriptor.versionType=commit', 'includeContent=true', '--http-method', 'GET', '--api-version', '7.1']) as { path?: unknown; commitId?: unknown; objectId?: unknown; content?: unknown };
            if (!value || value.path !== path || value.commitId !== target.commit || typeof value.objectId !== 'string' || !/^[a-f0-9]{40}$/.test(value.objectId) || typeof value.content !== 'string') throw new Error('Acceptance document identity/content did not match the configured repository path and observed commit.');
            const body = boundedEvidence(value.content, GOAL_EVIDENCE_LIMITS.documentBytes);
            Object.assign(document, body, { blob: value.objectId, sha256: createHash('sha256').update(body.text).digest('hex') });
        } catch (error) { document.error = boundedEvidence(String(error), 500).text; }
        documents.push(document);
    }
    return { documents, gaps };
}
/** Cached evidence is informational; matching a deployment does not repeat functional acceptance. */
export function azureGoalFacts(store: EvidenceStore) {
    const azure = store.state.azure, now = store.clock.now().getTime();
    const stale = (at: string | undefined) => !at || !Number.isFinite(Date.parse(at)) || now - Date.parse(at) > 150000;
    return {
        builds: azure.builds.slice(0, 16).map(({ id, name, status, result, commit, branch, url, finishedAt, timingError }) => ({ id, name, status, result, commit, branch, url, finishedAt, timingError })),
        deployed: azure.deployed.slice(0, 4).map(value => ({ ...value, stale: stale(value.observedAt) })),
        documents: (azure.goalDocuments || []).slice(0, GOAL_EVIDENCE_LIMITS.paths * GOAL_EVIDENCE_LIMITS.commits).filter(doc => doc.projectId === store.project.id && doc.repository === store.project.repository && store.project.goalEvidencePaths?.includes(doc.path) && /^[a-f0-9]{40}$/.test(doc.commit)).map(doc => ({ ...doc, text: boundedEvidence(doc.text || '', GOAL_EVIDENCE_LIMITS.documentBytes).text, truncated: doc.truncated || Buffer.byteLength(doc.text || '') > GOAL_EVIDENCE_LIMITS.documentBytes, stale: stale(azure.observedAt), matchesDeployedCommit: azure.deployed.some(value => value.commit === doc.commit), authority: 'Attributed repository record; not independent whole-goal acceptance.' })),
        gaps: [...(azure.goalEvidenceGaps || []), ...(!store.project.goalEvidencePaths?.length && !azure.goalEvidenceGaps?.some(gap => gap.startsWith('No acceptance document')) ? ['No acceptance document paths configured; request goal-specific evidence from the owning delivery team.'] : []), ...(stale(azure.observedAt) ? ['Azure observation is stale.'] : [])],
    };
}
