import { useState } from 'react';
import { officeUrl, type OfficeSnapshot } from '../shared';
import { Button, SectionTitle, Select, checkLabel, checkbox, cx, mutedCopy } from '../ui';
import { SaveFeedback } from '../office/SaveFeedback';

export function GoalNoticeSettings({ snapshot }: { snapshot: OfficeSnapshot }) {
    const policy = snapshot.coordination?.notices?.policy.goals;
    const recipients = [...new Map([...(policy ? [policy] : []), ...(snapshot.slackDeliveries || []).filter(delivery => delivery.status === 'confirmed' && delivery.targetType === 'person')].map(target => [`${target.workspaceId}:${target.targetId}`, target])).values()];
    const [enabled, setEnabled] = useState(policy?.enabled || false), [selected, setSelected] = useState(policy ? `${policy.workspaceId}:${policy.targetId}` : recipients[0] ? `${recipients[0].workspaceId}:${recipients[0].targetId}` : '');
    const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(false);
    const target = recipients.find(target => `${target.workspaceId}:${target.targetId}` === selected);
    async function save() {
        if (!target) return;
        setBusy(true); setError(false); setMessage('');
        try {
            const response = await fetch(officeUrl('/api/commands', snapshot.project?.id), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'configure-goal-notifications', notifications: { enabled, targetId: target.targetId, targetName: target.targetName, workspaceId: target.workspaceId } }) });
            const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not save goal notifications');
            setMessage('Goal notifications saved for this project.');
        } catch (error) { setError(true); setMessage(String(error)); } finally { setBusy(false); }
    }
    const disabled = busy || snapshot.mode === 'demo';
    return <form className="grid gap-3" onSubmit={event => { event.preventDefault(); void save(); }}>
        <SectionTitle>Goal completion messages</SectionTitle>
        <label className={cx(checkLabel, 'text-12')}><input type="checkbox" className={checkbox} checked={enabled} disabled={disabled} onChange={event => setEnabled(event.target.checked)} />Send Avery’s Slack DM when a goal is completed</label>
        <label className="grid gap-1.5 text-12">Send goal updates to<Select aria-label="Goal completion recipient" value={selected} disabled={disabled || !recipients.length} onChange={event => setSelected(event.target.value)}>{!recipients.length ? <option value="">No verified Slack recipient yet</option> : recipients.map(recipient => <option key={`${recipient.workspaceId}:${recipient.targetId}`} value={`${recipient.workspaceId}:${recipient.targetId}`}>{recipient.targetName}</option>)}</Select></label>
        <p className={mutedCopy}>One short DM for each future completion, including goals you accept yourself. Earlier completions are not sent. Pausing this project also pauses delivery of its messages.</p>
        {!recipients.length ? <p className={mutedCopy}>Ask Morgan to verify your Slack DM destination first.</p> : null}
        <Button type="submit" className="justify-self-start" disabled={disabled || !target}>Save goal notifications</Button>
        <SaveFeedback message={message} error={error} pending={busy} />
    </form>;
}
