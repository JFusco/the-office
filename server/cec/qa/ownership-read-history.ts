import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DeliveryRequest } from '../../../src/shared';
import type { Store } from '../../store/store';
import { artifact, digest } from '../../store/readback-evidence';
import { processGroupAlive } from '../../workers/process';

/** Bind a completed reader's blocking observation. It is never treated as a positive read-back. */
export function ownershipReadHistory(store: Store, request: DeliveryRequest, alive = processGroupAlive) {
    const fail = (): never => { throw new Error('The original completed ownership reader and closed claim must remain verifiable'); };
    const rows = store.state.workLog?.filter(w => w.requestId === request.id) || [];
    const work = rows[0];
    if (rows.length !== 1 || !work || work.ticket !== request.key || work.role !== 'pm' || work.stage !== 'readback' ||
        work.status !== 'completed' || work.executionStatus !== 'completed' || work.failure || !work.sessionId ||
        !work.claimId || !Number.isSafeInteger(work.processId) || work.processId! < 1 || alive(work.processId!) ||
        !Number.isFinite(Date.parse(work.endedAt || '')) || store.activeClaims().some(c => c.id === work.claimId)) return fail();
    const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work.claimId) as { body: string } | undefined;
    const claim = row && JSON.parse(row.body);
    if (!claim || claim.status !== 'completed' || claim.lane !== 'delivery' || claim.stage !== 'resume-ticket' ||
        claim.work?.projectId !== store.project.id || claim.work?.kind !== 'delivery' || claim.work?.id !== request.id ||
        !Number.isFinite(Date.parse(claim.endedAt)) || Date.parse(claim.endedAt) < Date.parse(work.endedAt!)) return fail();
    const files: { path: string; sha256: string }[] = [];
    const directory = resolve(store.dataRoot, 'sessions', work.id);
    const read = (name: string) => {
        const path = resolve(directory, name), proof = artifact(store, path);
        files.push({ path, sha256: proof.sha256 });
        return JSON.parse(readFileSync(path, 'utf8'));
    };
    const assignment = read('assignment.json'), capabilities = read('capabilities.json');
    const saved = read('result.json'), completion = read('execution-completion.json');
    if (assignment.id !== work.id || assignment.claimId !== claim.id || assignment.lane !== 'delivery' ||
        assignment.work?.projectId !== store.project.id || assignment.work?.kind !== 'delivery' || assignment.work?.id !== request.id ||
        assignment.role !== 'pm' || assignment.stage !== 'readback' || assignment.profile !== 'reader' ||
        capabilities.name !== 'reader' || capabilities.cutover !== 'verified' || capabilities.readOnly !== true ||
        saved.error || saved.provider !== work.provider || saved.session !== work.sessionId ||
        completion.workerId !== work.id || completion.provider !== work.provider || completion.session !== work.sessionId ||
        completion.resultSha256 !== files.find(f => f.path === resolve(directory, 'result.json'))?.sha256 ||
        saved.result?.key !== request.key || saved.result?.existingPrId !== 0 ||
        typeof saved.result?.existingOwner !== 'string' || !saved.result.existingOwner ||
        typeof saved.result?.blocker !== 'string' || !saved.result.blocker ||
        ![saved.result.blocker, `Error: ${saved.result.blocker}`].includes(request.error)) return fail();
    return { workerId: work.id, claimId: claim.id, endedAt: claim.endedAt as string, artifacts: files,
        fingerprint: digest({ work, claim, files }), blocker: saved.result.blocker as string };
}
