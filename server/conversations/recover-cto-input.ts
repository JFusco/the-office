import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { Store } from '../store/store';
import { rootArtifact, digest } from '../store/readback-evidence';
import { processGroupAlive } from '../workers/process';
import type { TeamMessage, EffectIntent } from '../../src/shared';

/** One linked continuation only for a positively rejected pre-turn CTO input. No generic retry. */
export function recoverCTOInput(store: Store, messageId: unknown, root: string, groupAlive = processGroupAlive) {
    if (typeof messageId !== 'string' || !messageId || messageId.length > 200) throw new Error('Original CTO message required');
    return store.transaction(() => {
        const source = store.state.messages.find(message => message.id === messageId);
        if (!source || source.inputRecovery || source.from !== 'human' || source.to !== 'cto' || source.requestId !== source.id || source.status !== 'failed' || source.receipts.length ||
            !/turn\/start failed: Input exceeds the maximum length/.test(source.error) || !source.error.includes('"input_error_code":"input_too_large"')) throw new Error('Original pre-turn input rejection required');
        const id = `cto-input-recovery:${source.id}`, old = store.state.messages.find(message => message.id === id);
        if (old) {
            if (old.inputRecovery?.originalMessageId !== source.id || old.body !== source.body || old.to !== 'cto') throw new Error('CTO continuation identity changed');
            return { accepted: true, id, status: old.status };
        }
        if (source.resolvedBy || store.state.messages.some(message => message.id !== source.id && message.to === 'cto' && ['queued', 'working'].includes(message.status) && message.body === source.body)) throw new Error('Another reply already owns this original CTO request');
        const work = store.state.workLog?.filter(item => item.requestId === source.id && item.role === 'cto' && item.stage === 'conversation').at(-1);
        if (store.state.paused || !work || work.status !== 'failed' || work.executionStatus === 'completed' || !work.claimId || !work.endedAt || !work.processId || groupAlive(work.processId) ||
            store.activeClaims().some(claim => claim.lane === 'cto') || store.state.workLog?.some(item => item.role === 'cto' && ['running', 'stopping'].includes(item.status)) ||
            store.state.messages.some(message => message.requestId === source.id && message.id !== source.id) || store.state.goals?.some(goal => goal.requestId === source.id)) throw new Error('Original CTO worker must be ended without an accepted answer or goal change');
        const dir = resolve(root, 'sessions', work.id);
        const files = ['assignment.json', 'capabilities.json', 'error.json'].map(name => rootArtifact(root, resolve(dir, name)));
        const read = (name: string) => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
        const assignment = read('assignment.json'), capability = read('capabilities.json'), error = read('error.json');
        const claimRow = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(work.claimId) as { body: string } | undefined;
        const claim = claimRow && JSON.parse(claimRow.body);
        if (!claim?.endedAt || ['running', 'stopping'].includes(claim.status) || claim.lane !== 'cto' || claim.stage !== 'conversation:cto' || claim.work?.kind !== 'conversation' || claim.work?.projectId !== store.project.id || claim.work?.id !== source.id ||
            assignment.id !== work.id || assignment.claimId !== work.claimId || assignment.lane !== 'cto' || assignment.work?.kind !== 'conversation' || assignment.work?.id !== source.id || assignment.work?.projectId !== store.project.id || assignment.role !== 'cto' || assignment.stage !== 'conversation' || assignment.profile !== 'reader' || assignment.scope?.repository !== store.project.repository || assignment.scope?.artifacts !== dir ||
            capability.name !== 'reader' || capability.readOnly !== true || capability.cutover !== 'verified' || error.provider !== 'codex' || error.session !== work.sessionId || error.error !== source.error ||
            existsSync(resolve(dir, 'result.json')) || existsSync(resolve(dir, 'execution-completion.json'))) throw new Error('Native pre-turn CTO rejection binding is incomplete');
        const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent);
        if (effects.some(effect => effect.work.id === source.id || effect.attemptId === work.id)) throw new Error('Original CTO effects require independent reconciliation');
        const original = structuredClone(source);
        const message: TeamMessage = { ...source, id, requestId: id, status: 'queued', createdAt: store.clock.now().toISOString(), sessionId: '', error: '', recheck: false, receipts: [], recipients: [],
            inputRecovery: { originalMessageId: source.id, workerId: work.id, originalSha256: digest(source), artifacts: files.map(({ path, sha256 }) => ({ path, sha256 })) } };
        store.state.messages.push(message);
        if (!isDeepStrictEqual(source, original)) throw new Error('Original CTO failure changed');
        store.emit('cto-input-recovery-queued', 'Original input was rejected before a model turn. One linked CTO reply is queued with bounded context; original failure retained.', 'cto');
        return { accepted: true, id, status: message.status };
    });
}
