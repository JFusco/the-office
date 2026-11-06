import { useState } from 'react';
import { Button, CheckField, Select, cx, fieldLabel, inputField, mutedCopy, selectField } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

/** Slack merge notices; the workspace belongs to this project's policy. */
export function SlackNoticesForm({ snapshot, refresh }: ProjectFormProps) {
  const policy = snapshot.coordination?.notices?.policy;
  const [enabled, setEnabled] = useState(policy?.enabled ?? false), [recipients, setRecipients] = useState(policy?.recipients || 'both'), [workspace, setWorkspace] = useState(policy?.workspace || 'Verndale'), [mappings, setMappings] = useState(policy?.mappings || '');
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Settings saved for this project.' });
  return <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void save('configure-notifications', { notifications: { enabled, recipients, workspace, mappings } }); }}>
    <h4 className="text-13 font-semibold">Slack merge notifications</h4>
    <CheckField checked={enabled} disabled={disabled} onChange={e => setEnabled(e.target.checked)}>Notify people when a watched PR merges</CheckField>
    <label className={fieldLabel}>Notify<Select value={recipients} disabled={disabled} className={selectField} onChange={e => setRecipients(e.target.value as typeof recipients)}><option value="both">Assignee and issue creator</option><option value="assignee">Assignee</option><option value="reporter">Issue creator</option></Select></label>
    <label className={fieldLabel}>Slack workspace<input className={inputField} required maxLength={100} value={workspace} disabled={disabled} onChange={e => setWorkspace(e.target.value)} /></label>
    <label className={fieldLabel}>People mappings (optional)<textarea className={cx(inputField, 'min-h-17.5')} value={mappings} disabled={disabled} maxLength={6000} placeholder="JFusco = Joe Fusco" onChange={e => setMappings(e.target.value)} /></label>
    <p className={mutedCopy}>One provider login or Jira account ID = Slack name/email per line. Without a mapping Morgan requires matching verified email addresses. Ambiguous recipients go to your outbox. Enabling this authorizes future merge notices for this project. No historical messages are sent.</p>
    <Button type="submit" className="justify-self-start" disabled={disabled}>Save Slack notifications</Button><SaveFeedback message={message} error={error} pending={pending} />
  </form>;
}
