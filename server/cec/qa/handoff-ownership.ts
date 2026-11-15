import { resolve, sep } from 'node:path';
import { digest } from '../../store/readback-evidence';
import type { Store } from '../../store/store';
import type { LiveSession } from '../../workers/session-bridge';
import type { OwnershipRead } from '../implementation-continuation/intent';
import type { QAOwnershipProof } from '../../../src/contracts/office-qa-handoff';

export interface ReadbackOwnerDecision { key: string; existingOwner: string; blocker: string }
interface View { complete: boolean; fresh: boolean; observedAt?: string; project?: string; key?: string;
    sessions?: LiveSession[]; ownership?: {status:string;matches?:{id:string}[]} }

/** Focused coordination under READBACK_OWNER_SCOPE, never a global ownership override. */
export async function handoffOwnership(store: Store, key: string, read: OwnershipRead,
    coordinatorId?: string, decision?: ReadbackOwnerDecision): Promise<QAOwnershipProof> {
    const view: View = await read(key);
    const fail = (): never => { throw new Error('Complete fresh ownership and positively verified coordination are required; unknown or competing actors remain blocked'); };
    if (!view.complete || !view.fresh) return fail();
    if (view.ownership?.status === 'clear') return {kind:'clear',observedAt:view.observedAt || ''};
    if (!coordinatorId || view.ownership?.status !== 'uncertain' || view.project !== store.project.id || view.key !== key ||
        decision?.key !== key || decision.existingOwner !== '' || decision.blocker !== '' || !Number.isFinite(Date.parse(view.observedAt || '')) ||
        view.ownership.matches?.length !== 1 || view.ownership.matches[0].id !== coordinatorId) return fail();
    const rows = view.sessions?.filter(s => s.id === coordinatorId) || [];
    if (rows.length !== 1) return fail();
    const session = rows[0], repo = resolve(store.project.repo), cwd = resolve(session.cwd || '');
    const number = Number(key.match(/^[A-Z][A-Z0-9]*-([1-9]\d*)$/)?.[1]);
    const scopes = session.context?.scopes.filter(s => s.project === store.project.id) || [];
    if (!['codex','claude'].includes(session.provider) || !['active','waiting'].includes(session.status) ||
        session.ticket || session.requestId || session.project === store.project.id || !session.cwd || cwd === repo || cwd.startsWith(repo + sep) ||
        session.context?.activity !== 'active' || !Number.isSafeInteger(number) || scopes.length !== 1) return fail();
    const scope = scopes[0];
    if (scope.issues.length !== 1 || scope.issues[0] !== number || scope.prs.length || !scope.evidence.length ||
        scope.evidence.some(e => e.kind !== 'reference' || e.issue !== number || e.pr)) return fail();
    return {kind:'coordinated',observedAt:view.observedAt!,sessionId:coordinatorId,
        contextSha256:digest({key,project:store.project.id,id:session.id,provider:session.provider,cwd,projectScope:session.project || null,
            status:session.status,activity:session.context.activity,scope})};
}
