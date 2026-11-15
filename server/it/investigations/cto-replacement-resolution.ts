import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ctoInputRecovered } from '../../conversations/cto-input-resolution';
import { rootArtifact } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import type { Store } from '../../store/store';
import type { ITInvestigation } from '../../../src/contracts/it-investigations';

/** A verified linked reply supersedes its exact pre-turn warning; the failed request stays failed. */
export function ctoReplacementResolution(store: Store, entry: ITInvestigation) {
    if (entry.source.kind !== 'worker' || entry.source.failureKind !== 'other') return;
    const original = store.state.messages.find(m => m.id === entry.source.requestId);
    if (!original || !ctoInputRecovered(store.state, original)) return;
    const request = store.state.messages.find(m => m.from === 'human' && m.inputRecovery?.originalMessageId === original.id);
    const binding = request?.inputRecovery;
    if (!request || !binding || binding.workerId !== entry.source.id || request.id !== `cto-input-recovery:${original.id}` ||
        binding.artifacts.length !== 3) return;
    const old = store.state.workLog?.find(w => w.id === entry.source.id && w.requestId === original.id && w.role === 'cto' && w.stage === 'conversation' && w.status === 'failed');
    const workers = store.state.workLog?.filter(w => w.requestId === request.id && w.role === 'cto' && w.stage === 'conversation' &&
        w.status === 'completed' && !w.failure && completedExecution(store,w)) || [];
    if (!old || workers.length !== 1) return;
    const worker = workers[0];
    const reply = store.state.messages.find(m => m.requestId === request.id && m.from === 'cto' && m.to === 'cto' && m.status === 'answered');
    if (!reply || reply.sessionId !== worker.sessionId) return;
    try {
        for (const name of ['assignment.json','capabilities.json','error.json']) {
            const path = resolve(store.dataRoot,'sessions',old.id,name), saved = binding.artifacts.find(a => a.path === path);
            if (!saved || rootArtifact(store.dataRoot,path).sha256 !== saved.sha256) return;
        }
        const path = resolve(store.dataRoot,'sessions',worker.id,'assignment.json'); rootArtifact(store.dataRoot,path);
        const assignment = JSON.parse(readFileSync(path,'utf8'));
        if (assignment.id !== worker.id || assignment.claimId !== worker.claimId || assignment.work?.projectId !== store.project.id ||
            assignment.work?.kind !== 'conversation' || assignment.work?.id !== request.id || assignment.role !== 'cto' || assignment.stage !== 'conversation') return;
    } catch { return; }
    return {kind:'superseded' as const,sourceId:worker.id,receipt:`sessions/${worker.id}/execution-completion.json`};
}
