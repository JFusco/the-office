import { useRef, useState } from 'react';
import { officeUrl, type OfficeSnapshot, type Ticket } from '../shared';
import { Button, mutedCopy } from '../ui';

export function OutboxSavedPlan({ snapshot, ticket, refresh }: { snapshot: OfficeSnapshot; ticket: Ticket; refresh?: () => Promise<void> }) {
    const lock = useRef(false), [submitted, setSubmitted] = useState(false), [error, setError] = useState('');
    const request = snapshot.deliveryQueue?.find(item => item.key === ticket.key && item.action === 'resume-ticket' && ['queued', 'working'].includes(item.status));
    async function reconcile() {
        if (lock.current || submitted || request) return;
        lock.current = true; setSubmitted(true);
        try {
            const response = await fetch(officeUrl('/api/commands', snapshot.project?.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resume-ticket', key: ticket.key }) });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Request was not confirmed');
            await refresh?.();
        } catch { setError('Request not confirmed. Refresh its status before taking another action; no retry was sent.'); }
    }
    return <div className="grid gap-3" data-saved-plan-followup>
        <p className="font-semibold">Office needs to reconnect the saved plan</p>
        <p className={mutedCopy}>Alex returned the plan. The Office could not attach its saved evidence to this ticket. No product answer or approval is needed from you.</p>
        <details><summary>Read Alex’s saved plan</summary><p className="whitespace-pre-wrap text-13">{ticket.results.plan?.summary}</p></details>
        <p className={mutedCopy}>Reconciliation checks the original worker and saved plan, then continues through the selected delivery gates, including independent review when required. It does not rerun Alex’s planning or mark the ticket complete.</p>
        {ticket.savedPlanRecoveryFailure ? <p role="status">{ticket.savedPlanRecoveryFailure.detail}</p> : null}
        <Button variant="primary" disabled={!!ticket.savedPlanRecoveryFailure || !!request || submitted || snapshot.paused || snapshot.mode === 'demo'} onClick={() => void reconcile()}>{request || submitted ? 'Reconciliation requested — check status' : 'Reconcile saved plan'}</Button>
        {error ? <p role="alert">{error}</p> : null}
        {submitted && refresh ? <Button onClick={() => void refresh()}>Refresh status</Button> : null}
    </div>;
}
