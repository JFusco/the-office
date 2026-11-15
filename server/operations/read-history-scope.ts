import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { rootArtifact } from '../store/readback-evidence';
import type { Store } from '../store/store';
import type { ITInvestigation } from '../../src/contracts/it-investigations';

/** Scope one incomplete read by its native claim, not an empty request ID shared by unrelated work. */
export function readHistoryScope(store: Store, entry: ITInvestigation) {
    const fail = (): never => { throw Error('An inactive native read-only historical source and its exact closed request are required'); };
    const work = store.state.workLog?.find(w => w.id === entry.source.id);
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'transient-read' ||
        !['queued','blocked'].includes(entry.status) || !work || work.status !== 'failed' || work.role !== 'pm' ||
        !['readback','reconcile'].includes(work.stage) || work.failure?.category !== 'transient-read' ||
        work.requestId !== entry.source.requestId || work.ticket !== entry.source.ticket || !work.claimId) return fail();
    const claimFor = (id: string) => {
        const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(id) as {body:string}|undefined;
        return row && JSON.parse(row.body);
    };
    const claim = claimFor(work.claimId), root = resolve(store.dataRoot,'sessions',work.id);
    const read = (name:string) => { const path=resolve(root,name); rootArtifact(store.dataRoot,path); return JSON.parse(readFileSync(path,'utf8')); };
    const assignment=read('assignment.json'), capabilities=read('capabilities.json'), error=read('error.json');
    if (!claim || claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || !claim.work.id ||
        !['completed','blocked','interrupted'].includes(claim.status) || !claim.endedAt ||
        assignment.id !== work.id || assignment.claimId !== work.claimId || !isDeepStrictEqual(assignment.work,claim.work) ||
        assignment.lane !== 'delivery' || assignment.role !== 'pm' || assignment.stage !== work.stage || assignment.profile !== 'reader' ||
        assignment.scope?.repository !== store.project.repository || assignment.scope?.artifacts !== root ||
        capabilities.name !== 'reader' || capabilities.readOnly !== true || capabilities.cutover !== 'verified' ||
        error.provider !== work.provider || error.session !== work.sessionId) return fail();
    for (const name of ['result.json','execution-completion.json']) {
        try { lstatSync(resolve(root,name)); return fail(); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    const request = store.state.deliveryQueue?.find(r => r.id === claim.work.id && r.key === work.ticket && r.action === 'resume-ticket');
    if (!request || !['blocked','interrupted'].includes(request.status) ||
        !Number.isFinite(Date.parse(work.endedAt || '')) || !Number.isFinite(Date.parse(request.requestedAt)) ||
        Date.parse(work.endedAt!) < Date.parse(request.requestedAt)) return fail();
    const family = (store.state.workLog || []).filter(w => w.id === work.id || w.originalId === work.id || w.requestId === request.id ||
        !!w.claimId && isDeepStrictEqual(claimFor(w.claimId)?.work,claim.work));
    return { work:family, ids:new Set([entry.id,work.id,request.id,...family.map(w=>w.id)]) };
}
