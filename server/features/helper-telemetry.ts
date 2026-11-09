import { dispatchExposure } from '../knowledge/lesson-exposure';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import type { Feature } from '../../src/contracts/features';
import type { Store } from '../store/store';
import { processGroupAlive } from '../workers/process';
import { helperAccounting } from '../telemetry/helper-usage';
export function helperTelemetry(store: Store, feature: Feature, alive = processGroupAlive) {
    if (!feature.review?.run) return;
    const calls = resolve(feature.review.run, 'calls');
    if (!existsSync(calls)) return;
    for (const call of readdirSync(calls)) {
        const folder = resolve(calls, call), started = resolve(folder, 'started.json'), agentPath = resolve(folder, 'agent.json'), finished = resolve(folder, 'process.json');
        if (!existsSync(started) || !existsSync(agentPath)) continue;
        const id = feature.id + ':' + basename(feature.review.run) + ':' + call, agent = JSON.parse(readFileSync(agentPath, 'utf8')), process = JSON.parse(readFileSync(started, 'utf8'));
        const receipt = existsSync(finished) ? JSON.parse(readFileSync(finished, 'utf8')) : undefined;
        const at = statSync(started).mtime.toISOString(), now = store.clock.now().toISOString(), elapsed = receipt ? Math.max(0, receipt.elapsed_seconds * 1000) : Math.max(0, Date.parse(now) - Date.parse(at));
        const role = call.includes('research') ? 'analyst' : /adjudicate|refine|finalize/.test(call) ? 'pm' : 'lead';
        if (!store.state.workLog?.some(w => w.id === id)) {
            const claim = store.activeClaims().find(c => c.work.id === feature.id);
            store.beginWork({ id, role, task: feature.title + ' · independent plan ' + call, ticket: '', stage: 'feature-review:' + call, requestId: feature.id, claimId: claim?.id, lane: 'delivery', processId: process.process_group,
                sessionId: '', provider: agent.provider, model: agent.model, effort: agent.effort, requestedModel: agent.model, requestedEffort: agent.effort, observedModel: null, observedEffort: null,
                status: 'running', startedAt: at, lastHeartbeatAt: at, endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
        }
        const stdout = resolve(folder, 'stdout.log');
        if (existsSync(stdout)) {
            let session = '', model: string | null = null;
            for (const line of readFileSync(stdout, 'utf8').split('\n')) {
                try {
                    const event = JSON.parse(line);
                    // Claude's helper uses final JSON, not streaming assistant events. Native
                    // input/cache usage proves dispatch; a wrapper start or empty error does not.
                    const claudeResult = agent.provider === 'claude' && event.type === 'result' && typeof event.session_id === 'string' && event.session_id.length > 0 &&
                        [event.usage?.input_tokens, event.usage?.cache_creation_input_tokens, event.usage?.cache_read_input_tokens].some(value => Number.isSafeInteger(value) && value > 0);
                    if (event.type === 'turn.started' || event.type === 'assistant' || claudeResult) dispatchExposure(store, feature.review.attemptDir);
                    if (event.type === 'thread.started' && typeof event.thread_id === 'string') session = event.thread_id;
                    if (event.session_id && typeof event.session_id === 'string') session = event.session_id;
                    const models = Object.keys(event.modelUsage || {});
                    if (models.length === 1) model = models[0];
                } catch { /* An unfinished stdout line is not evidence. */ }
            }
            const work = store.state.workLog?.find(w => w.id === id);
            if (work && (session && work.sessionId !== session || model && work.observedModel !== model)) store.transaction(() => { if (session) work.sessionId = session; if (model) work.observedModel = model; });
        }
        if (receipt && !alive(process.process_group)) {
            const work = store.state.workLog?.find(w => w.id === id);
            // Attach usage once, at the transition to finished; calls that finished before capture existed stay uncaptured.
            if (work && ['running', 'stopping'].includes(work.status)) {
                // Async, off the polling path; evidence attaches to the finished row when it resolves.
                void helperAccounting(folder, agent.provider, work.sessionId, at, now).then(accounting => { if (accounting) store.recordRunEvidence(id, accounting); }).catch(() => { /* accounting never blocks helper bookkeeping */ });
            }
            store.finishWork(id, receipt.exit_code === 0 ? 'completed' : 'interrupted', elapsed);
        }
        else store.checkpointWork(id, elapsed);
    }
}
