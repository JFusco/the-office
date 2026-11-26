/**
 * The closed set of Office GitHub write routes. A route is keyed by project and one of these labels; each label
 * groups the distinct mutations (transports) that send it, and each mutation names the installation permission
 * subset an App token for it may carry. Fixed labels only: nothing here is read from a call or a payload.
 */
export const WRITE_OPERATIONS = [
    'push', 'force-push', 'branch-delete',
    'pr-create', 'pr-edit', 'pr-ready', 'pr-close', 'merge',
    'issue-create', 'issue-edit', 'issue-assign', 'issue-close', 'comment',
    'workflow-dispatch', 'workflow-rerun',
    'board-add', 'board-status', 'board-field',
] as const;
export type WriteOperation = typeof WRITE_OPERATIONS[number];

export const isWriteOperation = (value: unknown): value is WriteOperation =>
    typeof value === 'string' && (WRITE_OPERATIONS as readonly string[]).includes(value);

/** A board route binds the board, and every board route but `board-add` also binds the field it changes. */
export const boardOperation = (operation: WriteOperation) => operation.startsWith('board-');
export const fieldOperation = (operation: WriteOperation) => operation === 'board-status' || operation === 'board-field';

/** Installation permissions, as GitHub names them in an access-token request. */
export type InstallationPermissions = Partial<Record<'contents' | 'pull_requests' | 'issues' | 'actions' | 'metadata', 'read' | 'write'>>;

/**
 * Each distinct mutation and the installation grant it needs. `null` means no installation grant is established for
 * it (user-owned Projects v2 boards, G2): an App token is never requested, so such a route stays on the operator.
 */
export const MUTATIONS = {
    'git-push': { operation: 'push', permissions: { contents: 'write' } },
    'git-force-push': { operation: 'force-push', permissions: { contents: 'write' } },
    'rest-delete-ref': { operation: 'branch-delete', permissions: { contents: 'write' } },
    'graphql-update-refs': { operation: 'branch-delete', permissions: { contents: 'write' } },
    'rest-create-pull': { operation: 'pr-create', permissions: { pull_requests: 'write' } },
    'rest-update-pull': { operation: 'pr-edit', permissions: { pull_requests: 'write' } },
    'cli-pr-ready': { operation: 'pr-ready', permissions: { pull_requests: 'write' } },
    'rest-close-pull': { operation: 'pr-close', permissions: { pull_requests: 'write' } },
    'rest-merge-pull': { operation: 'merge', permissions: { contents: 'write' } },
    'rest-create-issue': { operation: 'issue-create', permissions: { issues: 'write' } },
    'rest-update-issue': { operation: 'issue-edit', permissions: { issues: 'write' } },
    'rest-add-assignees': { operation: 'issue-assign', permissions: { issues: 'write' } },
    'rest-close-issue': { operation: 'issue-close', permissions: { issues: 'write' } },
    'rest-issue-comment': { operation: 'comment', permissions: { issues: 'write' } },
    'rest-pr-comment': { operation: 'comment', permissions: { pull_requests: 'write' } },
    'rest-workflow-dispatch': { operation: 'workflow-dispatch', permissions: { actions: 'write' } },
    'rest-rerun-failed-jobs': { operation: 'workflow-rerun', permissions: { actions: 'write' } },
    'graphql-add-project-item': { operation: 'board-add', permissions: null },
    'graphql-update-single-select': { operation: 'board-status', permissions: null },
    'graphql-update-number': { operation: 'board-field', permissions: null },
} as const satisfies Record<string, { operation: WriteOperation; permissions: InstallationPermissions | null }>;
export type WriteMutation = keyof typeof MUTATIONS;

/** The distinct mutations a route's activation must prove, sorted. */
export function routeMutations(operation: WriteOperation): WriteMutation[] {
    return (Object.keys(MUTATIONS) as WriteMutation[]).filter(mutation => MUTATIONS[mutation].operation === operation).sort();
}

/** The permission subset an App token for one mutation requests, without Metadata: GitHub always adds `metadata: read`. */
export function mutationPermissions(mutation: WriteMutation): InstallationPermissions | null {
    const permissions = MUTATIONS[mutation].permissions;
    return permissions && { ...permissions };
}
