import { useRef, useState } from 'react';
import type { FeatureQuestionProjection } from '../contracts/features';
import { questionUrl } from '../features/questions/question-url';
import { QuestionStepper } from '../features/questions/QuestionStepper';

/** Same saved round and submission contract as Questions for you; no parallel question workflow. */
export function OutboxQuestionRound({ round, disabled, refresh }: { round: FeatureQuestionProjection; disabled: boolean; refresh?: () => Promise<void> }) {
    const lock = useRef(false), pending = useRef<{ content: string; id: string } | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function send(action: 'answer' | 'harness-action', values: Record<string, unknown>) {
        if (lock.current || disabled) return false;
        lock.current = true; setBusy(true); setError('');
        try {
            const payload = { action, expectedRevision: round.revision, roundId: round.roundId, ...(action === 'answer' && round.reviewRun ? { reviewRun: round.reviewRun, reviewRevision: round.reviewRevision } : {}), ...values }, content = JSON.stringify(payload);
            if (pending.current?.content !== content) pending.current = { content, id: crypto.randomUUID() };
            const response = await fetch(questionUrl(round), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, requestId: pending.current.id }) });
            const body = await response.json();
            if (!response.ok) {
                if (['stale-round', 'revision-change', 'changed-precondition', 'source-unavailable'].includes(body.code)) await refresh?.();
                throw new Error(body.error || 'Answer not confirmed');
            }
            pending.current = null; await refresh?.(); return true;
        } catch (error) { setError(String(error)); return false; }
        finally { lock.current = false; setBusy(false); }
    }
    return <><QuestionStepper project={round.projectId} feature={round.featureId} round={round} busy={busy || disabled} submit={answers => send('answer', { answers })} act={input => send('harness-action', input)}/>{error ? <p role="alert">{error}</p> : null}</>;
}
