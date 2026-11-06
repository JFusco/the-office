import { useState } from 'react';
import { Button, CheckField, Select, fieldLabel, mutedCopy, selectField } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

/** Avery's goal completion DMs, separate from merge notices. */
export function GoalNoticeForm({ snapshot, refresh }: ProjectFormProps) {
  const policy = snapshot.coordination?.notices?.policy.goals;
  const recipients = [...new Map([...(policy ? [policy] : []), ...(snapshot.slackDeliveries || []).filter(delivery => delivery.status === 'confirmed' && delivery.targetType === 'person')].map(target => [`${target.workspaceId}:${target.targetId}`, target])).values()];
  const [enabled, setEnabled] = useState(policy?.enabled || false), [selected, setSelected] = useState(policy ? `${policy.workspaceId}:${policy.targetId}` : recipients[0] ? `${recipients[0].workspaceId}:${recipients[0].targetId}` : '');
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Goal notifications saved for this project.' });
  const target = recipients.find(target => `${target.workspaceId}:${target.targetId}` === selected);
  return <form className="grid gap-3" onSubmit={event => { event.preventDefault(); if (target) void save('configure-goal-notifications', { notifications: { enabled, targetId: target.targetId, targetName: target.targetName, workspaceId: target.workspaceId } }); }}>
    <h4 className="text-13 font-semibold">Goal completion messages</h4>
    <CheckField checked={enabled} disabled={disabled} onChange={event => setEnabled(event.target.checked)}>Send Avery’s Slack DM when a goal is completed</CheckField>
    <label className={fieldLabel}>Send goal updates to<Select aria-label="Goal completion recipient" className={selectField} value={selected} disabled={disabled || !recipients.length} onChange={event => setSelected(event.target.value)}>{!recipients.length ? <option value="">No verified Slack recipient yet</option> : recipients.map(recipient => <option key={`${recipient.workspaceId}:${recipient.targetId}`} value={`${recipient.workspaceId}:${recipient.targetId}`}>{recipient.targetName}</option>)}</Select></label>
    <p className={mutedCopy}>One short DM for each future completion, including goals you accept yourself. Earlier completions are not sent. Pausing this project also pauses delivery of its messages.</p>
    {!recipients.length ? <p className={mutedCopy}>Ask Morgan to verify your Slack DM destination first.</p> : null}
    <Button type="submit" className="justify-self-start" disabled={disabled || !target}>Save goal notifications</Button>
    <SaveFeedback message={message} error={error} pending={pending} />
  </form>;
}
