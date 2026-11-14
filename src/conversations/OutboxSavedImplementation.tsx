import { useRef, useState } from 'react';
import { officeUrl, type OfficeSnapshot, type Ticket } from '../shared';
import type { SavedImplementationProof } from '../contracts/cec-implementation-continuation';
import { Button, mutedCopy } from '../ui';

export function OutboxSavedImplementation({ snapshot, ticket, refresh }: { snapshot: OfficeSnapshot; ticket: Ticket; refresh?: () => Promise<void> }) {
    const lock = useRef(false);
    const [proof, setProof] = useState<SavedImplementationProof>();
    const [reviewed, setReviewed] = useState(false), [busy, setBusy] = useState(false), [submitted, setSubmitted] = useState(false);
    const [decision, setDecision] = useState<'continue' | 'hold'>('continue'), [note, setNote] = useState(''), [message, setMessage] = useState('');
    const request = snapshot.deliveryQueue?.find(r => r.key === ticket.key && r.action === 'continue-saved-implementation');
    const disabled = snapshot.mode === 'demo' || snapshot.paused || snapshot.draining || !!request || submitted;
    async function review() {
        if (lock.current || reviewed || disabled) return;
        lock.current = true; setBusy(true); setReviewed(true);
        try {
            const response = await fetch(officeUrl(`/api/cec/saved-implementation?ticket=${encodeURIComponent(ticket.key)}`, snapshot.project?.id));
            const result = await response.json();
            if (!response.ok || !result.available) throw new Error(result.reason || result.error || 'Office must reconcile the saved draft before it can continue.');
            setProof(result.proof);
        } catch (error) { setMessage(error instanceof Error ? error.message : 'Saved work could not be checked.'); }
        finally { lock.current = false; setBusy(false); }
    }
    async function apply() {
        if (lock.current || !proof || disabled) return;
        lock.current = true; setBusy(true); setSubmitted(true);
        try {
            const response = await fetch(officeUrl('/api/commands', snapshot.project?.id), { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'continue-saved-implementation', key: ticket.key, implementationContinuation: {
                    workerId: proof.workerId, fingerprint: proof.fingerprint, decision, acknowledgeUncertainHistory: decision === 'continue', note } }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Decision was not confirmed');
            setMessage(result.held ? 'Kept paused. Your guidance is saved; no worker was started.' : 'Continuation requested. Office will recheck safety before copying the draft and starting work.');
            await refresh?.();
        } catch { setMessage('Decision not confirmed. Refresh status before taking another action; no retry was sent.'); }
        finally { setBusy(false); }
    }
    return <div className="grid gap-3" data-saved-implementation-followup>
        <p className="font-semibold">Continue the saved implementation?</p>
        <p className={mutedCopy}>Alex’s implementation timed out. The partial draft and failed checks remain saved. The old attempt stays unresolved in history.</p>
        {!reviewed ? <Button disabled={disabled || busy} onClick={() => void review()}>Review saved work</Button> : null}
        {proof ? <>
            <p>{proof.fileCount} changed files saved. Office will copy this draft to a fresh linked worktree, finish required checks and commit, then use normal independent review and QA.</p>
            <details><summary>Saved draft details</summary><p className="break-all text-12">{proof.branch}<br />Base: {proof.head}<br />Draft fingerprint: {proof.fingerprint}</p></details>
            <fieldset disabled={disabled || busy} className="grid gap-3"><legend className="mb-2 font-semibold">What should Office do?</legend>
                <label className="flex gap-2"><input type="radio" name={`saved-${ticket.key}`} checked={decision === 'continue'} onChange={() => setDecision('continue')} />Continue saved work (Recommended)</label>
                <label className="flex gap-2"><input type="radio" name={`saved-${ticket.key}`} checked={decision === 'hold'} onChange={() => setDecision('hold')} />Keep paused</label>
                <label className="grid gap-2">Guidance (optional)<textarea maxLength={1000} rows={3} value={note} onChange={e => setNote(e.target.value)} /></label>
            </fieldset>
            <Button variant="primary" disabled={disabled || busy} onClick={() => void apply()}>Apply decision</Button>
        </> : null}
        {busy ? <p role="status">Checking saved work…</p> : null}
        {request ? <p role="status">Existing continuation: {request.status}. {request.error}</p> : null}
        {message ? <p role="status">{message}</p> : null}
        {refresh ? <Button onClick={() => void refresh()}>Refresh status</Button> : null}
    </div>;
}
