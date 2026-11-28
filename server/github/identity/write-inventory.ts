import type { OfficeProject } from '../../../src/shared';
import { MUTATIONS, type WriteMutation, type WriteOperation } from './write-operations';

/**
 * Every Office publisher of a GitHub write at the implementation base (9f7500b), refreshed from source. The fixed
 * adapter of a write is its Effect operation; one adapter sends one mutation. Publishers that share a project and
 * route operation are all listed, including the journal-only board writers and the model workers that still publish
 * directly, so promotion can refuse a route another unchecked publisher can still send (`sharedPublishers`).
 */
export type Publisher = 'harness' | 'direct' | 'journal' | 'worker';
export interface InventoryEntry {
    /** The Effect operation a checked publisher saves; empty for journal and worker publishers. */
    adapter: string;
    mutation: WriteMutation;
    module: string;
    publisher: Publisher;
    /** Where an unchecked publisher applies: every GitHub project, or only non-hands-off delivery projects. */
    scope?: 'all' | 'non-hands-off';
}

const harness = (adapter: string, mutation: WriteMutation, module: string): InventoryEntry => ({ adapter, mutation, module, publisher: 'harness' });
const direct = (adapter: string, mutation: WriteMutation, module: string): InventoryEntry => ({ adapter, mutation, module, publisher: 'direct' });
const journal = (mutation: WriteMutation, module: string): InventoryEntry => ({ adapter: '', mutation, module, publisher: 'journal', scope: 'all' });
const worker = (mutation: WriteMutation, module: string, scope: 'all' | 'non-hands-off'): InventoryEntry => ({ adapter: '', mutation, module, publisher: 'worker', scope });

export const WRITE_INVENTORY: readonly InventoryEntry[] = [
    harness('git-push', 'git-push', 'server/delivery/publication/publish-pr.ts'),
    harness('ci-commit-messages', 'git-force-push', 'server/delivery/repairs/ci-publication.ts'),
    harness('git-remote-branch-delete', 'rest-delete-ref', 'server/delivery/candidate/remove-candidate.ts'),
    direct('merged-candidate-cleanup-remote', 'graphql-update-refs', 'server/delivery/recovery/closeout/merged-candidate-cleanup.ts'),
    harness('github-pr-create', 'rest-create-pull', 'server/delivery/publication/publish-pr.ts'),
    harness('github-pr-metadata', 'rest-update-pull', 'server/delivery/publication/publish-metadata.ts'),
    harness('ci-pr-metadata', 'rest-update-pull', 'server/delivery/repairs/ci-publication.ts'),
    harness('github-pr-body', 'rest-update-pull', 'server/delivery/closeout/superseded-wiki-pr.ts'),
    harness('github-pr-body', 'rest-update-pull', 'server/delivery/intake/dependency-bots/relink-pin-courier.ts'),
    harness('github-pr-body', 'rest-update-pull', 'server/delivery/intake/dependabot/link-pr.ts'),
    direct('github-pr-body', 'rest-update-pull', 'server/delivery/repairs/bot-redo/request.ts'),
    harness('github-pr-ready', 'cli-pr-ready', 'server/delivery/publication/ready-pr.ts'),
    harness('github-pr-close', 'rest-close-pull', 'server/delivery/closeout/superseded-wiki-pr.ts'),
    direct('github-merge', 'rest-merge-pull', 'server/delivery/readiness/github-readiness.ts'),
    harness('github-issue-create', 'rest-create-issue', 'server/delivery/intake/dependabot/tracking-issue.ts'),
    harness('github-issue-create', 'rest-create-issue', 'server/delivery/intake/dependabot/alert-issue.ts'),
    direct('github-issue-create', 'rest-create-issue', 'server/knowledge/file-lesson-issue.ts'),
    direct('feature-create', 'rest-create-issue', 'server/features/publication.ts'),
    direct('improvement-create', 'rest-create-issue', 'server/knowledge/admit-improvement.ts'),
    direct('feature-update', 'rest-update-issue', 'server/features/publication.ts'),
    direct('improvement-update', 'rest-update-issue', 'server/knowledge/admit-improvement.ts'),
    direct('feature-assign', 'rest-add-assignees', 'server/features/publication.ts'),
    direct('improvement-assign', 'rest-add-assignees', 'server/knowledge/admit-improvement.ts'),
    direct('github-issue-assign', 'rest-add-assignees', 'server/maintenance/accessibility-sources.ts'),
    harness('github-issue-close', 'rest-close-issue', 'server/delivery/closeout/closeout.ts'),
    harness('github-issue-close', 'rest-close-issue', 'server/delivery/closeout/superseded-wiki-pr.ts'),
    harness('github-issue-close', 'rest-close-issue', 'server/delivery/intake/dependabot/alert-issue.ts'),
    direct('github-native-closeout-state', 'rest-close-issue', 'server/github/github-operations.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/closeout/closeout.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/closeout/proof-comment.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/publication/link-draft-issue.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/parking/park-comment.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/parking/park.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/parking/return-to-pickup.ts'),
    harness('github-issue-comment', 'rest-issue-comment', 'server/delivery/intake/dependabot/alert-issue.ts'),
    direct('github-native-closeout-comment', 'rest-issue-comment', 'server/github/github-operations.ts'),
    // The App trial command's fixed adapters, declared where its packet binds them and sent by `app-trial/trial-comment.ts`.
    direct('github-issue-comment', 'rest-issue-comment', 'server/github/identity/app-trial/trial-packet.ts'),
    direct('github-pr-comment', 'rest-pr-comment', 'server/delivery/repairs/bot-redo/request.ts'),
    direct('github-pr-comment', 'rest-pr-comment', 'server/github/identity/app-trial/trial-packet.ts'),
    direct('github-workflow-dispatch', 'rest-workflow-dispatch', 'server/delivery/repairs/bot-redo/request.ts'),
    harness('ci-retry', 'rest-rerun-failed-jobs', 'server/delivery/repairs/ci-publication.ts'),
    harness('github-merge-scanner-retry', 'rest-rerun-failed-jobs', 'server/delivery/repairs/merge-scanner-retry.ts'),
    harness('github-project-add', 'graphql-add-project-item', 'server/delivery/intake/dependabot/tracking-issue.ts'),
    harness('github-project-add', 'graphql-add-project-item', 'server/delivery/intake/dependabot/alert-issue.ts'),
    direct('feature-board', 'graphql-add-project-item', 'server/features/publication.ts'),
    direct('improvement-board', 'graphql-add-project-item', 'server/knowledge/admit-improvement.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/board/lane-effect.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/recovery/pr-metadata-park.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/intake/dependabot/tracking-issue.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/intake/dependabot/alert-issue.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/parking/return-to-pickup.ts'),
    harness('github-project-status', 'graphql-update-single-select', 'server/delivery/parking/resume-provider-review.ts'),
    direct('github-native-closeout-board', 'graphql-update-single-select', 'server/github/github-operations.ts'),
    direct('lesson-issue-lane', 'graphql-update-single-select', 'server/knowledge/lesson-issue-ready.ts'),
    direct('github-cost-field', 'graphql-update-number', 'server/telemetry/cost-ledger.ts'),
    // Board writes outside Effects until G2 routes them through it.
    journal('graphql-update-single-select', 'server/delivery/board/move-lane.ts'),
    journal('graphql-update-single-select', 'server/delivery/board/project-progress.ts'),
    journal('graphql-update-number', 'server/time/time-ledger.ts'),
    // Model workers that still publish directly with the operator's login until D4 transfers them.
    worker('rest-create-issue', 'server/maintenance/maintenance.ts', 'all'),
    worker('git-push', 'server/maintenance/maintenance.ts', 'all'),
    worker('rest-create-pull', 'server/maintenance/maintenance.ts', 'all'),
    worker('rest-issue-comment', 'server/maintenance/maintenance.ts', 'all'),
    worker('rest-create-issue', 'server/maintenance/brain/brain-maintenance.ts', 'all'),
    worker('git-push', 'server/maintenance/brain/brain-maintenance.ts', 'all'),
    worker('rest-create-pull', 'server/maintenance/brain/brain-maintenance.ts', 'all'),
    worker('rest-create-issue', 'server/delivery/repairs/queue-repairs.ts', 'all'),
    worker('graphql-add-project-item', 'server/delivery/repairs/queue-repairs.ts', 'all'),
    worker('graphql-update-single-select', 'server/delivery/repairs/queue-repairs.ts', 'all'),
    worker('git-push', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
    worker('rest-create-pull', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
    worker('cli-pr-ready', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
    worker('rest-close-issue', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
    worker('rest-issue-comment', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
    worker('graphql-update-single-select', 'server/delivery/pipeline/stage-prompts.ts', 'non-hands-off'),
];

/** Feature and improvement board operations send either mutation; the payload's action says which. */
const boardAction = (payload: unknown) => (payload as { operation?: { payload?: { action?: unknown } } } | undefined)?.operation?.payload?.action;

/**
 * The route and mutation an Effect operation sends, or undefined for anything that is not a GitHub write of a GitHub
 * project. Feature and improvement publication is generic: it is a GitHub write only on a GitHub project.
 */
export function routeOf(project: Pick<OfficeProject, 'provider'>, adapter: string, payload?: unknown): { operation: WriteOperation; mutation: WriteMutation } | undefined {
    if (project.provider !== 'github') return;
    let mutation = WRITE_INVENTORY.find(entry => entry.adapter === adapter && entry.publisher !== 'journal' && entry.publisher !== 'worker')?.mutation;
    if ((adapter === 'feature-board' || adapter === 'improvement-board') && boardAction(payload) !== 'add') mutation = 'graphql-update-single-select';
    return mutation && { operation: MUTATIONS[mutation].operation, mutation };
}

/**
 * Publishers of the project's route that do not go through the checked dispatch claim: journal-only board writers and
 * direct model-worker publication. Promotion refuses a route while any of them can still send it.
 */
export function sharedPublishers(project: Pick<OfficeProject, 'provider'>, handsOff: boolean, operation: WriteOperation): InventoryEntry[] {
    if (project.provider !== 'github') return [];
    return WRITE_INVENTORY.filter(entry => (entry.publisher === 'journal' || entry.publisher === 'worker') && MUTATIONS[entry.mutation].operation === operation &&
        (entry.scope === 'all' || entry.scope === 'non-hands-off' && !handsOff));
}
