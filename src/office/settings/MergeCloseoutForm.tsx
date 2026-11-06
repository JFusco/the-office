import { useState } from 'react';
import { Button, CheckField, mutedCopy } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import { useProjectSetting, type ProjectFormProps } from './useProjectSetting';

/** GitHub projects only: whether Sam may merge completed issue PRs. */
export function MergeCloseoutForm({ snapshot, refresh }: ProjectFormProps) {
  const [enabled, setEnabled] = useState(snapshot.coordination?.merges?.enabled ?? false);
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo', refresh, success: 'Settings saved for this project.' });
  return <form className="grid gap-3" onSubmit={e => { e.preventDefault(); void save('configure-merges', { merges: { enabled } }); }}>
    <h4 className="text-13 font-semibold">Office PR closeout</h4>
    <CheckField checked={enabled} disabled={disabled} onChange={e => setEnabled(e.target.checked)}>Let Sam merge completed issue PRs</CheckField>
    <p className={mutedCopy}>Requires independent current-head review, successful checks and GitHub merge rules. Stacked PRs wait for their parent. Morgan verifies issue closure and Done after merge Actions pass. No release or deployment is authorized.</p>
    <Button type="submit" className="justify-self-start" disabled={disabled}>Save PR closeout</Button><SaveFeedback message={message} error={error} pending={pending} />
  </form>;
}
