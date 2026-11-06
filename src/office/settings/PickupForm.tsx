import { useState } from 'react';
import { Button, CheckField, fieldLabel, inputField, mutedCopy } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

export function PickupForm({ snapshot, refresh }: ProjectFormProps) {
  const saved = snapshot.coordination?.pickup, defaultStatus = snapshot.project?.provider === 'github' ? 'Ready' : 'To Do';
  const [status, setStatus] = useState(saved?.status || defaultStatus), [enabled, setEnabled] = useState(saved?.enabled ?? true);
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Pickup rule saved.' });
  const lanes = snapshot.github?.board?.lanes || [];
  return <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void save('configure-pickup', { pickup: { enabled, status } }); }}>
    <h4 className="text-13 font-semibold">Morgan’s automatic pickup · {snapshot.project?.name}</h4>
    <CheckField checked={enabled} disabled={disabled} onChange={e => setEnabled(e.target.checked)}>Automatically queue work assigned to me</CheckField>
    <label className={fieldLabel}>Pickup status<input aria-label="Pickup status" list="pickup-statuses" className={inputField} value={status} maxLength={100} required disabled={disabled} onChange={e => setStatus(e.target.value)} /></label>
    <datalist id="pickup-statuses">{[...new Set([defaultStatus, ...lanes])].map(lane => <option key={lane} value={lane} />)}</datalist>
    <p className={mutedCopy}>Exact project status name. Assignment to you is always required. Default: {defaultStatus}. Other assigned tickets remain available for a manual Start.</p>
    <Button type="submit" className="justify-self-start" disabled={disabled}>{pending ? 'Saving…' : 'Save pickup rule'}</Button><SaveFeedback message={message} error={error} pending={pending} />
  </form>;
}
