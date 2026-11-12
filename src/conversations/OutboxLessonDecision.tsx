import { useEffect, useRef, useState } from 'react';
import { LessonCard, LessonShape } from '../knowledge/LessonCard';
import { saveProjectSetting } from '../office/settings/useProjectSetting';
import type { OfficeSnapshot } from '../shared';
import { Button, TextLink, mutedCopy, errorText } from '../ui';
import { ExternalLink } from '../ui/icons';
import { lessonDecisionState, readLessonDecision, type LessonDecisionAction } from './lesson-decision-state';

/** Decisions use the existing lesson commands, never a model conversation. A 202 is not a filed issue. */
export function OutboxLessonDecision({ snapshot, actionId, refresh }: { snapshot: OfficeSnapshot; actionId: string; refresh?: () => Promise<void> }) {
    const [readback, setReadback] = useState<ReturnType<typeof lessonDecisionState>>(null);
    useEffect(() => setReadback(null), [snapshot]);
    const decision = readback || lessonDecisionState(snapshot, actionId);
    const [sending, setSending] = useState(false), [submitted, setSubmitted] = useState(false);
    const [notice, setNotice] = useState(''), [error, setError] = useState('');
    const busy = useRef(false);
    if (!decision) return null;
    const item = decision.kind === 'repository' ? decision.lesson : decision.proposal;
    if (!item) return <p className={mutedCopy}>This lesson is not available in the selected project. Refresh the Outbox before deciding.</p>;
    const request = decision.kind === 'repository' ? decision.request : undefined;
    const waiting = decision.proposed && (submitted || !!request);
    const disabled = snapshot.mode === 'demo' || !snapshot.project?.id || sending || waiting;
    async function act(action: LessonDecisionAction) {
        if (busy.current || disabled || !decision?.proposed) return;
        busy.current = true; setSending(true); setSubmitted(true); setError('');
        try {
            await saveProjectSetting(fetch, snapshot.project!.id, action, { lessonId: decision.id });
            setNotice(action === 'file-lesson-issue' ? 'Approval received. Waiting for Office to file and verify the issue.' : 'Decision received. Waiting for the updated lesson record.');
            await refresh?.();
        } catch (e) {
            // A response may be lost after admission. Keep both choices locked until a deliberate read-back.
            setError(`Decision not confirmed. ${String(e).replace(/^Error: /, '')} Refresh the decision status before another action.`);
        } finally { busy.current = false; setSending(false); }
    }
    async function readStatus() {
        if (!refresh || busy.current) return;
        busy.current = true; setSending(true);
        try {
            const current = await readLessonDecision(fetch, snapshot.project!.id, actionId);
            setReadback(current); setSubmitted(false); setError(''); setNotice('Latest decision status loaded.');
            void refresh();
        }
        catch { setError('Could not refresh the decision status. No decision was resent.'); }
        finally { busy.current = false; setSending(false); }
    }
    const actions = decision.proposed ? <>
        {decision.kind === 'office' || snapshot.project?.provider === 'github' ? <Button variant="primary" disabled={disabled} onClick={() => void act(decision.approve)}>{decision.kind === 'repository' ? 'Approve — file issue' : 'Accept for all projects'}</Button> : null}
        <Button disabled={disabled} onClick={() => void act(decision.decline)}>Decline</Button>
    </> : undefined;
    return <div className="grid gap-3" data-outbox-lesson-decision>
        <p className={mutedCopy}>{decision.kind === 'repository' ? 'Approval files an improvement issue; it does not apply a repository change. Declining keeps the saved lesson.' : 'Your decision: accept this guidance for every Office project, or decline the proposal.'}</p>
        {decision.kind === 'repository' ? <LessonCard lesson={decision.lesson!} actions={actions} /> : <article className="grid gap-3"><LessonShape lesson={decision.proposal!} />{item.detail ? <p className={mutedCopy}>{item.detail}</p> : null}<p className={mutedCopy}>Proposed from {decision.proposal!.projectId}</p><div className="flex flex-wrap gap-2">{actions}</div></article>}
        <div role="status" aria-live="polite">
            {decision.status === 'filed' && decision.kind === 'repository' ? <p>Issue filed and verified. {decision.lesson?.repositoryInstruction?.issueUrl?.startsWith('https://github.com/') ? <TextLink href={decision.lesson.repositoryInstruction.issueUrl} target="_blank" rel="noreferrer">Open issue <ExternalLink size={12} /></TextLink> : null}</p>
            : decision.status === 'declined' ? <p>Suggestion declined. No new issue or shared guidance was requested by this decision.</p>
            : decision.status === 'accepted' ? <p>Accepted for all projects.</p>
            : request && decision.proposed ? <p>{request.status === 'queued' ? 'Approval queued. Office will file and verify the issue.' : request.status === 'working' ? 'Office is filing and verifying the issue.' : request.status === 'completed' ? 'Office finished the request; waiting for the verified lesson record.' : 'Issue filing needs follow-up. Do not approve it again.'} {request.status === 'blocked' || request.status === 'interrupted' ? request.detail : ''}</p>
            : notice ? <p>{notice}</p> : !decision.proposed ? <p>This suggestion is no longer awaiting a decision.</p> : null}
        </div>
        {error ? <p role="alert" className={errorText}>{error}</p> : null}
        {(waiting || error) && refresh ? <Button disabled={sending} onClick={() => void readStatus()}>Refresh decision status</Button> : null}
    </div>;
}
