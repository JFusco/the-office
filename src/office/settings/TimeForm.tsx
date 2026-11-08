import { useState } from 'react';
import { Button, CheckField, mutedCopy } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

/** Time attributed to Joe, with provider-specific publication. */
export function TimeForm({ snapshot, refresh }: ProjectFormProps) {
  const time = snapshot.coordination?.time, azure = snapshot.project?.provider === 'azure', github = snapshot.project?.provider === 'github';
  const [trackTime, setTrackTime] = useState(time?.enabled ?? true), [publishTime, setPublishTime] = useState(time?.githubField ?? true), [publishCost, setPublishCost] = useState(!!time?.cost?.githubField), [publishJira, setPublishJira] = useState(!!time?.jiraActivatedAt && time.jiraEnabled !== false);
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Settings saved for this project.' });
  return <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void save('configure-time', { time: { enabled: trackTime, githubField: publishTime, ...(azure ? { jira: publishJira } : { cost: { githubField: publishCost } }) } }); }}>
    <h4 className="text-13 font-semibold">Time attributed to Joe</h4>
    <CheckField checked={trackTime} disabled={disabled} onChange={e => setTrackTime(e.target.checked)}>Log measured Office work as my time</CheckField>
    {github ? <CheckField checked={publishTime} disabled={disabled} onChange={e => setPublishTime(e.target.checked)}>Update Time Spent (Hours) on this board</CheckField> : <CheckField checked={publishJira} disabled={disabled} onChange={e => setPublishJira(e.target.checked)}>Publish confirmed Jira effort after each Eastern date closes</CheckField>}
    {github ? <CheckField checked={publishCost} disabled={disabled} onChange={e => setPublishCost(e.target.checked)}>Update Est. Cost (USD) on this board</CheckField> : null}
    <p className={mutedCopy}>Tracks completed work from activation onward, excluding CI, queue waits and overlapping worker time. Uncertain durations stay in session history. Existing GitHub hours are preserved; outside edits require reconciliation. Jira publication starts when enabled, uses one identified worklog per ticket and date, and preserves estimates.</p>
    {azure ? <p className={mutedCopy}>Estimated model cost is tracked in the Office for every run on this project and shown in Telemetry. Syncing it to Jira is not enabled yet.</p> : null}
    {github ? <p className={mutedCopy}>Hours and cost count all model work on a ticket. Est. Cost is the API list-price estimate of runs that started inside the time window, not a bill; runs that cannot be priced are left out and the ticket is marked as a subtotal. Requires a Number field named Est. Cost (USD) on the board.</p> : null}
    <Button type="submit" className="justify-self-start" disabled={disabled}>Save time settings</Button><SaveFeedback message={message} error={error} pending={pending} />
  </form>;
}
