import type { OfficePreferences, OfficePreferencesPatch } from '../../shared';
import { CheckField, Select, fieldLabel, mutedCopy, selectField } from '../../ui';
import { SaveFeedback } from '../SaveFeedback';
import type { PreferenceFeedback, PreferenceField } from './useOfficePreferences';

const SHORTCUTS = [['M', 'PM mailbox'], ['O', 'Outbox'], ['C', 'Chat'], ['P', 'People'], ['U', 'Usage & cost (Telemetry)'], ['0', 'Reset view'], ['Esc', 'Close details']] as const;
const detail = 'text-11 leading-body text-muted';

/** Office-wide preferences. Each control saves on change; feedback sits beside the changed control. */
export function OfficePreferencesForm({ preferences, osReduced, pending, feedback, writable, onChange }: { preferences: OfficePreferences; osReduced: boolean; pending: PreferenceField | ''; feedback: PreferenceFeedback | null; writable: boolean; onChange: (patch: OfficePreferencesPatch) => void }) {
  const disabled = !writable || !!pending;
  const status = (field: PreferenceField) => pending === field ? <SaveFeedback message="" pending /> : feedback?.field === field ? <SaveFeedback message={feedback.message} error={feedback.error} /> : null;
  return <div className="grid gap-4" data-office-preferences>
    <p className={mutedCopy}>Shared by this local Office across projects and browsers, including during the illustrative tour. Each change saves immediately.</p>
    {!writable ? <p className={mutedCopy} role="status">Reconnect to the Office to change these preferences.</p> : null}
    <div><label className={fieldLabel}>Graphics<Select value={preferences.quality} disabled={disabled} className={selectField} onChange={e => onChange({ quality: e.target.value as OfficePreferences['quality'] })}><option value="high">High · soft shadows</option><option value="low">Light · less GPU usage</option></Select></label>{status('quality')}</div>
    <div><CheckField checked={preferences.reducedMotion} disabled={disabled} onChange={e => onChange({ reducedMotion: e.target.checked })}>Reduced motion</CheckField><p className={detail}>Keep the office still.{osReduced ? ' Your system’s reduced-motion setting also keeps it still, whatever this toggle says.' : ''}</p>{status('reducedMotion')}</div>
    <div><CheckField checked={preferences.keyboardShortcuts} disabled={disabled} onChange={e => onChange({ keyboardShortcuts: e.target.checked })}>Keyboard shortcuts</CheckField>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-8 text-shortcut" data-shortcut-keys>{SHORTCUTS.map(([key, label]) => <span key={key} className="contents"><kbd className="rounded-3 border border-kbd-line bg-kbd px-1 py-0.5 font-mono text-ink">{key}</kbd> {label}</span>)}</div>
      <p className={detail}>Turns M, O, C, P, U and 0 on or off. Escape always closes details.</p>{status('keyboardShortcuts')}</div>
    <div><CheckField checked={preferences.deliveryToasts} disabled={disabled} onChange={e => onChange({ deliveryToasts: e.target.checked })}>Delivery toasts</CheckField><p className={detail}>Brief notifications when a ticket’s delivery state changes. Results of your own actions still appear.</p>{status('deliveryToasts')}</div>
    <div><CheckField checked={preferences.coffeeBreaks} disabled={disabled} onChange={e => onChange({ coffeeBreaks: e.target.checked })}>Coffee-break coworkers</CheckField><p className={detail}>Background coworkers take occasional coffee breaks. They have no tickets or work status.</p>{status('coffeeBreaks')}</div>
  </div>;
}
