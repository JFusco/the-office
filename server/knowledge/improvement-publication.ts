import type { KnowledgeImprovement } from '../../src/contracts/knowledge';
import type { FeatureManifest, FeatureManifestItem } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { GitHubIssuePublisher } from '../github/issue-publication';
import { JiraIssuePublisher } from '../cec/issue-publication';
export const improvementMarker = (id: string) => `office-improvement-${id}`;
export function improvementProvider(store: Store, id: string, execute: typeof command = command) {
    const provenance = { id, marker: () => improvementMarker(id) };
    return store.project.provider === 'github' ? new GitHubIssuePublisher(store, provenance, execute) : new JiraIssuePublisher(store, provenance, execute);
}
/** Payloads are fixed harness operations; the model cannot choose commands or provider fields. */
export async function improvementManifest(store: Store, item: KnowledgeImprovement, provider: Pick<import('../features/publication').FeaturePublisher, 'context'>): Promise<FeatureManifest> {
    const context = JSON.parse(await provider.context()), marker = improvementMarker(item.id);
    const body = `${marker}\nOffice problem ${item.problemKey}\n\nObserved cause: ${item.cause}\n\nProposed change: ${item.change}\n\nRegression scenario: ${item.regression}\n\nAcceptance:\n${item.acceptance.map(value => '- ' + value).join('\n')}\n\nEvidence:\n${item.evidence.map(value => '- ' + value.ref + ': ' + value.detail).join('\n')}`;
    const row: FeatureManifestItem = { id: item.id, title: item.change.slice(0, 200), key: '', action: 'create', predecessor: '', criteria: item.acceptance, operations: [] };
    if (store.project.provider === 'github') {
        row.operations.push({ id: 'create', kind: 'create', payload: { title: row.title, body, labels: [], assignees: [] }, expected: {} }, { id: 'assign', kind: 'assign', payload: { assignees: [context.assignee] }, expected: {} });
        if (store.project.githubProject) {
            const board = context.board, option = board?.options?.find((entry: { name: string }) => entry.name === context.pickupStatus);
            if (!option) throw new Error('Configured pickup lane is unavailable');
            row.operations.push({ id: 'board-add', kind: 'board', payload: { action: 'add', projectId: board.projectId, fieldId: board.fieldId, optionId: '', name: '' }, expected: {} }, { id: 'board-status', kind: 'board', payload: { action: 'status', projectId: board.projectId, fieldId: board.fieldId, optionId: option.id, name: option.name }, expected: {} });
        }
    } else row.operations.push({ id: 'create', kind: 'create', payload: { space: 'CEC', type: context.recommendedType, summary: row.title, description: body, labels: [marker] }, expected: {} }, { id: 'assign', kind: 'assign', payload: { assignee: context.assignee }, expected: {} });
    return { provider: store.project.provider, destination: store.project.repository, items: [row] };
}
