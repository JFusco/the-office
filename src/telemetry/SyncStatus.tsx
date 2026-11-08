import { useEffect, useState } from 'react';
import type { TelemetrySync } from '../contracts/telemetry';
import { durationLabel } from '../timing/timing';
import { Button, Notice, Tag, cx, mutedCopy } from '../ui';
import { usd } from './format';

interface ScopePreview { applicable: boolean; applied: boolean; expectedSha256: string | null; rows: unknown[]; tickets: { key: string }[]; blockers: { disabled: boolean; liveWork: { ticket: string }[]; publications: string[]; manual: string[] } }

async function command(projectId: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/commands?project=${encodeURIComponent(projectId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'The Office did not accept that request.');
}

/**
 * The previewed hours-scope correction for a ledger still on the legacy scope. It is re-read with
 * every report refresh, so a cleared blocker yields a fresh applicable preview; applying needs a
 * second, explicit confirmation.
 */
function ScopeCorrection({ projectId, observedAt, onDone }: { projectId: string; observedAt: string; onDone: () => void }) {
  const [preview, setPreview] = useState<ScopePreview | null>(null), [confirming, setConfirming] = useState(false), [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/time/scope-preview?project=${encodeURIComponent(projectId)}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('The scope preview is unavailable right now.'); return r.json(); })
      .then(value => { if (!controller.signal.aborted) setPreview(value); })
      .catch(e => { if (!controller.signal.aborted) setMessage(String(e instanceof Error ? e.message : e)); });
    return () => controller.abort();
  }, [projectId, observedAt]);
  if (!preview || preview.applied) return message ? <p className={cx(mutedCopy, 'mt-1')} role="status">{message}</p> : null;
  const blockers = [...(preview.blockers.disabled ? ['time accounting is off'] : []), ...preview.blockers.liveWork.map(item => `live work on ${item.ticket}`), ...preview.blockers.publications.map(key => `${key} needs reconciliation`), ...preview.blockers.manual.map(id => `${id} needs a manual Jira fix`)];
  if (!preview.rows.length && !blockers.length) return null; // nothing would change
  const apply = async () => { try { await command(projectId, { action: 'apply-time-scope', timeScope: { policy: 'model-work-v1', expectedSha256: preview.expectedSha256 } }); setMessage('Correction queued; it re-checks the preview before applying.'); setConfirming(false); onDone(); } catch (e) { setMessage(String(e)); } };
  return <div className="mt-2 rounded-7 border border-telemetry-tile-line p-3 text-12">
    <p><strong>Hours scope correction available.</strong> {preview.rows.length} ticket-days across {preview.tickets.length} tickets would count all model work.</p>
    {blockers.length ? <p className={cx(mutedCopy, 'mt-1')}>Not applicable yet: {blockers.join(' · ')}.</p> : null}
    {preview.applicable && !confirming ? <Button className="mt-2" onClick={() => setConfirming(true)}>Review and apply…</Button> : null}
    {confirming ? <div className="mt-2" role="group" aria-label="Confirm scope correction"><p className="leading-body">This rewrites published hours: GitHub board totals and existing Jira worklogs for these tickets. It applies exactly this preview.</p><div className="mt-2 flex gap-2"><Button variant="primary" onClick={() => void apply()}>Apply correction</Button><Button onClick={() => setConfirming(false)}>Cancel</Button></div></div> : null}
    {message ? <p className={cx(mutedCopy, 'mt-1')} role="status">{message}</p> : null}
  </div>;
}

/** Publication state is cumulative since activation, independent of the report's date range. */
export function SyncStatus({ sync, observedAt, onChanged }: { sync: TelemetrySync[]; observedAt: string; onChanged: () => void }) {
  const [message, setMessage] = useState(''), [abandoning, setAbandoning] = useState('');
  const decide = async (projectId: string, key: string, head: '' | 'accept-board' | 'abandon') => {
    try { await command(projectId, { action: 'reconcile-cost', key, head }); setMessage(`${key}: reconciliation queued.`); setAbandoning(''); onChanged(); } catch (e) { setMessage(String(e)); }
  };
  return <section className="mt-6 border-t border-section-rule pt-5" aria-labelledby="telemetry-sync">
    <h3 id="telemetry-sync" className="text-13 font-semibold">Publication status</h3>
    <p className={mutedCopy}>Cumulative since activation, whatever date range is selected above.</p>
    {message ? <Notice tone="tour" className="mt-2" role="status">{message}</Notice> : null}
    {sync.map(project => <article key={project.projectId} className="mt-3.5 text-12">
      <h4 className="flex flex-wrap items-center gap-2 font-semibold">{project.projectName}
        <Tag>{project.scopePolicy === 'model-work-v1' ? 'All model work' : 'Original hours scope'}</Tag></h4>
      <p className="mt-1 leading-body">Hours: {durationLabel(project.hours.accountedSeconds * 1000)} accounted · {durationLabel(project.hours.postedSeconds * 1000)} posted · {project.hours.pending} pending · {project.hours.uncertain} uncertain{project.hours.publishing ? '' : ' · publishing off'}</p>
      <p className="leading-body">{project.provider === 'github'
        ? `Est. cost: ${project.cost.counts.posted} posted · ${project.cost.counts.pending} pending · ${project.cost.counts.uncertain} uncertain · ${project.cost.counts.blocked} blocked${project.cost.publishing ? '' : ' · board sync off'}`
        : 'Est. cost is tracked in the Office; Jira sync is not enabled yet.'}</p>
      {project.scopePolicy === 'legacy' ? <ScopeCorrection projectId={project.projectId} observedAt={observedAt} onDone={onChanged} /> : null}
      {project.cost.attention.map(entry => <div key={entry.key} className="mt-2 rounded-7 border border-telemetry-tile-line p-3">
        <p><strong>{entry.key}</strong> · {entry.status}{entry.intendedUsd !== null ? ` · attempted ${usd(Math.round(entry.intendedUsd * 1_000_000))}` : ''}</p>
        <p className={mutedCopy}>{entry.detail}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {entry.status === 'uncertain' && abandoning !== entry.key ? <><Button onClick={() => void decide(project.projectId, entry.key, '')}>Read back</Button><Button onClick={() => setAbandoning(entry.key)}>Abandon attempt…</Button></> : null}
          {abandoning === entry.key ? <div role="group" aria-label={`Confirm abandoning ${entry.key}`}><p className="leading-body">The attempted value may or may not be on the board. A fresh verified write follows; if the old value landed, it is recognised as the Office's.</p><div className="mt-2 flex gap-2"><Button variant="primary" onClick={() => void decide(project.projectId, entry.key, 'abandon')}>Abandon and rewrite</Button><Button onClick={() => setAbandoning('')}>Cancel</Button></div></div> : null}
          {entry.needsDecision === 'outside-edit' ? <Button onClick={() => void decide(project.projectId, entry.key, 'accept-board')}>Keep board edit</Button> : null}
          {entry.status === 'blocked' && !entry.needsDecision ? <Button onClick={() => void decide(project.projectId, entry.key, '')}>Retry now</Button> : null}
        </div>
      </div>)}
    </article>)}
  </section>;
}
