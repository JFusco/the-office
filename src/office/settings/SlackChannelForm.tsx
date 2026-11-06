import { useState } from 'react';
import { Button, CheckField, cx, fieldLabel, inputField, mutedCopy } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

const ids = (text: string) => [...new Set(text.split(/[\s,]+/).map(id => id.trim().toUpperCase()).filter(Boolean))];

/** Same rules as the server; checked here so a typo gets a plain message. */
export function channelSettingsProblem(input: { channelId: string; channelName: string; workspaceId: string; mentionIds: string[] }): string {
  if (!/^[CG][A-Z0-9]+$/.test(input.channelId)) return 'The channel ID starts with C or G, for example C0123ABCD.';
  if (!input.channelName) return 'Add the channel name.';
  if (!/^T[A-Z0-9]+$/.test(input.workspaceId)) return 'The workspace ID starts with T, for example T0123ABCD.';
  const bad = input.mentionIds.filter(id => !/^[UW][A-Z0-9]+$/.test(id));
  if (bad.length) return `These are not Slack member IDs: ${bad.join(', ')}. Member IDs start with U or W.`;
  if (input.mentionIds.length > 20) return 'Tag at most 20 people.';
  return '';
}

/** One channel post per merge, tagging a fixed set of people by Slack member ID. */
export function SlackChannelForm({ snapshot, refresh }: ProjectFormProps) {
  const policy = snapshot.coordination?.notices?.policy, channel = policy?.channel;
  const [enabled, setEnabled] = useState(channel?.enabled ?? false), [channelId, setChannelId] = useState(channel?.channelId || ''), [channelName, setChannelName] = useState(channel?.channelName || '');
  const [workspaceId, setWorkspaceId] = useState(channel?.workspaceId || policy?.goals?.workspaceId || ''), [mentions, setMentions] = useState((channel?.mentionIds || []).join('\n')), [problem, setProblem] = useState('');
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Channel posts saved for this project.' });
  return <form className="grid gap-3" noValidate onSubmit={event => {
    event.preventDefault();
    const settings = { enabled, channelId: channelId.trim().toUpperCase(), channelName: channelName.trim().replace(/^#+/, '').trim(), workspaceId: workspaceId.trim().toUpperCase(), mentionIds: ids(mentions) };
    const found = channelSettingsProblem(settings);
    setProblem(found);
    if (!found) void save('configure-channel-notifications', { channel: settings });
  }}>
    <h4 className="text-13 font-semibold">Slack merge channel</h4>
    <CheckField checked={enabled} disabled={disabled} onChange={event => setEnabled(event.target.checked)}>Post to a channel when a watched PR merges</CheckField>
    <label className={fieldLabel}>Channel ID<input className={cx(inputField, 'uppercase')} maxLength={30} value={channelId} disabled={disabled} placeholder="C0123ABCD" onChange={event => setChannelId(event.target.value)} /></label>
    <label className={fieldLabel}>Channel name<input className={inputField} maxLength={100} value={channelName} disabled={disabled} placeholder="delivery-updates" onChange={event => setChannelName(event.target.value)} /></label>
    <label className={fieldLabel}>Workspace ID<input className={cx(inputField, 'uppercase')} maxLength={30} value={workspaceId} disabled={disabled} placeholder="T0123ABCD" onChange={event => setWorkspaceId(event.target.value)} /></label>
    <label className={fieldLabel}>People to tag (optional)<textarea className={cx(inputField, 'min-h-17.5 uppercase')} value={mentions} disabled={disabled} maxLength={600} placeholder={'U0123ABCD\nU0456EFGH'} onChange={event => setMentions(event.target.value)} /></label>
    <p className={mutedCopy}>One Slack member ID per line, up to 20 (profile → More → Copy member ID). The channel ID is under the channel’s details. Morgan checks the channel before each post; posts never use @here or @channel. This runs beside the direct messages above and never backfills earlier merges.</p>
    <Button type="submit" className="justify-self-start" disabled={disabled}>Save merge channel</Button>
    {problem ? <SaveFeedback message={problem} error /> : <SaveFeedback message={message} error={error} pending={pending} />}
  </form>;
}
