import { resolve, sep } from 'node:path';
import { digest } from '../../store/readback-evidence';
import type { LiveSession } from '../../workers/session-bridge';

export interface ReadOwnershipView {
    complete: boolean; fresh: boolean; observedAt?: string; project?: string; key?: string;
    sessions?: LiveSession[]; ownership?: { status: string; matches?: { id: string }[] };
}
export type ReadOwnershipCandidate = { kind: 'clear'; observedAt: string } |
    { kind: 'coordinator-reference'; observedAt: string; sessionId: string; contextSha256: string };

/** Qualify a native observation for a reader. This never authorizes QA execution. */
export function readOwnershipCandidate(project: { id: string; repo: string }, key: string,
    view: ReadOwnershipView, coordinatorId?: string): ReadOwnershipCandidate | undefined {
    if (!view.complete || !view.fresh) return;
    if (view.ownership?.status === 'clear') return { kind: 'clear', observedAt: view.observedAt || '' };
    if (!coordinatorId || view.ownership?.status !== 'uncertain' || view.project !== project.id || view.key !== key ||
        !Number.isFinite(Date.parse(view.observedAt || '')) || view.ownership.matches?.length !== 1 ||
        view.ownership.matches[0].id !== coordinatorId) return;
    const rows = view.sessions?.filter(s => s.id === coordinatorId) || [];
    if (rows.length !== 1) return;
    const session = rows[0], repo = resolve(project.repo), cwd = resolve(session.cwd || '');
    const number = Number(key.match(/^[A-Z][A-Z0-9]*-([1-9]\d*)$/)?.[1]);
    const scopes = session.context?.scopes.filter(s => s.project === project.id) || [];
    if (!['codex', 'claude'].includes(session.provider) || !['active', 'waiting'].includes(session.status) ||
        session.ticket || session.requestId || session.project === project.id || !session.cwd || cwd === repo || cwd.startsWith(repo + sep) ||
        session.context?.activity !== 'active' || !Number.isSafeInteger(number) || scopes.length !== 1) return;
    const scope = scopes[0];
    if (scope.issues.length !== 1 || scope.issues[0] !== number || scope.prs.length || !scope.evidence.length ||
        scope.evidence.some(e => e.kind !== 'reference' || e.issue !== number || e.pr)) return;
    return { kind: 'coordinator-reference', observedAt: view.observedAt!, sessionId: coordinatorId,
        contextSha256: digest({ key, project: project.id, id: session.id, provider: session.provider, cwd,
            projectScope: session.project || null, status: session.status, activity: session.context.activity, scope }) };
}
