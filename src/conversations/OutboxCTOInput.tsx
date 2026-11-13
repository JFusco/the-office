import { useRef, useState } from 'react';
import { officeUrl, type OfficeSnapshot } from '../shared';
import { Button, mutedCopy } from '../ui';

export function ctoInputFailure(snapshot: OfficeSnapshot, actionId: string) {
    return snapshot.messages.find(message => actionId === `message:${message.id}` && !message.inputRecovery && message.from === 'human' && message.to === 'cto' && message.status === 'failed' && message.error.includes('"input_error_code":"input_too_large"'));
}
export function OutboxCTOInput({ snapshot, actionId, refresh }: { snapshot: OfficeSnapshot; actionId: string; refresh?: () => Promise<void> }) {
    const source = ctoInputFailure(snapshot, actionId), lock = useRef(false), [submitted, setSubmitted] = useState(false), [error, setError] = useState('');
    if (!source) return null;
    const continuation = snapshot.messages.find(message => message.inputRecovery?.originalMessageId === source.id);
    async function recover() {
        if (lock.current || submitted || continuation || !source) return;
        lock.current = true; setSubmitted(true);
        try {
            const response = await fetch(officeUrl('/api/commands', snapshot.project?.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'recover-cto-input', messageId: source.id }) });
            const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Not confirmed');
            await refresh?.();
        } catch { setError('Recovery not confirmed. Refresh status; do not send your original message again.'); }
    }
    return <div className="grid gap-3" data-cto-input-followup><p className="font-semibold">Avery’s context exceeded the input limit</p><p className={mutedCopy}>Your message was retained. Office must verify the original pre-turn rejection before queuing one linked reply with bounded context.</p><details><summary>Your original message</summary><p className="whitespace-pre-wrap">{source.body}</p></details><Button variant="primary" disabled={submitted || !!continuation || snapshot.paused || snapshot.mode === 'demo'} onClick={() => void recover()}>{continuation ? continuation.status === 'answered' ? 'Avery answered the linked message' : 'Original recovery already recorded' : submitted ? 'Recovery requested — check status' : 'Recover original message'}</Button>{error ? <p role="alert">{error}</p> : null}{(submitted || continuation) && refresh ? <Button onClick={() => void refresh()}>Refresh status</Button> : null}</div>;
}
