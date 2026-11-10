import { PanelHeader } from '../ui/PanelHeader';
import { useEffect, useState } from 'react';
import type { TelemetryReport } from '../contracts/telemetry';
import { ChartColumn, RefreshCw } from '../ui/icons';
import { Button, Notice, PanelIcon, PanelTitle, Select, cx, fieldLabel, mutedCopy, selectField } from '../ui';
import { BreakdownTable } from './BreakdownTable';
import { KpiTiles } from './KpiTiles';
import { SyncStatus } from './SyncStatus';
import { coverage, pricedLabel } from './format';

type Days = '7' | '30' | 'all';
interface Scope { project: string; ticket: string; days: Days }
const query = ({ project, ticket, days }: Scope) => `/api/telemetry?${new URLSearchParams({ scope: project ? 'project' : 'office', ...(project ? { projectId: project } : {}), ...(ticket ? { ticket } : {}), days })}`;
const SCOPE_ID = 'telemetry-scope';

/**
 * Office-wide time and estimated cost. Fetches its own report; a newer scope always wins, so a slow
 * response for another scope can never replace the selected one. The previous report stays on
 * screen (marked busy) while the next loads, so drilling in never drops keyboard focus to the page.
 */
export function TelemetryPanel({ projects, defaultProject = '' }: { projects: { id: string; name: string }[]; defaultProject?: string }) {
  const [scope, setScope] = useState<Scope>({ project: '', ticket: '', days: '30' });
  const [result, setResult] = useState<{ key: string; report: TelemetryReport } | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [refresh, setRefresh] = useState(0);
  // Ticket choices come from the project's unfiltered report, so picking one never narrows the list.
  const [tickets, setTickets] = useState<{ project: string; keys: string[] }>({ project: '', keys: [] });
  const key = query(scope), report = result?.report ?? null, current = result?.key === key;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    void fetch(key, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Telemetry is unavailable. The Office server may need the latest update.');
      return response.json() as Promise<TelemetryReport>;
    }).then(value => {
      if (controller.signal.aborted) return;
      setResult({ key, report: value });
      if (value.scope.kind === 'project' && !value.scope.ticket) setTickets({ project: value.scope.projectId || '', keys: value.byTicket.map(row => row.label).sort() });
    }).catch(e => { if (!controller.signal.aborted) setError(String(e instanceof Error ? e.message : e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, refresh]);
  const drill = (next: Scope) => { setScope(next); requestAnimationFrame(() => document.getElementById(SCOPE_ID)?.focus()); };
  const ticketKeys = tickets.project === scope.project ? tickets.keys : [];
  return <>
    <PanelHeader icon={<ChartColumn size={26}/>}>Telemetry</PanelHeader>
    <p className={mutedCopy}>Model time and estimated cost at API list price, for every model run in every project. Estimates, not a bill. Runs that could not be priced are counted, never shown as free.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className={fieldLabel}>Scope<Select id={SCOPE_ID} className={selectField} aria-label="Telemetry scope" value={scope.project} onChange={e => setScope({ ...scope, project: e.target.value, ticket: '' })}>
        <option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </Select></label>
      {scope.project ? <label className={fieldLabel}>Ticket<Select className={selectField} aria-label="Telemetry ticket" value={scope.ticket} onChange={e => setScope({ ...scope, ticket: e.target.value })}>
        <option value="">All tickets</option>{[...new Set([...ticketKeys, ...(scope.ticket ? [scope.ticket] : [])])].map(ticket => <option key={ticket} value={ticket}>{ticket}</option>)}
      </Select></label> : null}
      <label className={fieldLabel}>Started<Select className={selectField} aria-label="Telemetry date range" value={scope.days} onChange={e => setScope({ ...scope, days: e.target.value as Days })}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option>
      </Select></label>
      <Button disabled={loading} onClick={() => setRefresh(n => n + 1)}><RefreshCw size={14} className={cx(loading && 'animate-spin reduce-motion:animate-none')} />Refresh</Button>
      {defaultProject ? <Button disabled={scope.project === defaultProject} onClick={() => drill({ ...scope, project: defaultProject, ticket: '' })}>This project</Button> : null}
    </div>
    {error ? <Notice className="mt-4" role="alert">{error}</Notice> : null}
    {loading ? <p className={cx(mutedCopy, 'mt-4')} role="status">{report ? 'Updating…' : 'Loading telemetry…'}</p> : null}
    {report ? <div className={cx('mt-5', !current && 'opacity-60')} aria-busy={!current}>
      <KpiTiles totals={report.totals} />
      {report.totals.runs === 0 ? <p className={cx(mutedCopy, 'mt-4')}>{report.totals.inProgressRuns ? 'Only in-progress runs so far; they appear here when they finish.' : 'No model runs started in this range.'}</p> : <>
        {report.scope.kind === 'office' ? <BreakdownTable caption="By project" rows={report.byProject} onSelect={row => drill({ ...scope, project: row.projectId || '', ticket: '' })} /> : null}
        {!report.scope.ticket ? <BreakdownTable caption={report.scope.kind === 'office' ? 'By ticket (all projects)' : 'By ticket'} rows={report.byTicket.map(row => report.scope.kind === 'office' ? { ...row, label: `${projects.find(p => p.id === row.projectId)?.name ?? row.projectId} · ${row.label}` } : row)} onSelect={row => drill({ ...scope, project: row.projectId || '', ticket: row.id.split(':').at(-1) || '' })} /> : null}
        {report.overhead.runs ? <p className={cx(mutedCopy, 'mt-2')}>Overhead with no ticket (maintenance, Slack, CTO and helper work): {report.overhead.runs} {report.overhead.runs === 1 ? 'run' : 'runs'} · {pricedLabel(report.overhead)}{coverage(report.overhead.partialRuns, report.overhead.unpricedRuns) ? ` (${coverage(report.overhead.partialRuns, report.overhead.unpricedRuns)})` : ''}.</p> : null}
        <BreakdownTable caption="By model and requested effort" rows={report.byModel} />
        <BreakdownTable caption="By effort kind" rows={report.byEffortKind} />
        <BreakdownTable caption="By stage" rows={report.byStage} limit={10} />
        <BreakdownTable caption="By role" rows={report.byRole} />
        <BreakdownTable caption="By day started (Eastern)" rows={[...report.byDay].reverse()} limit={14} />
      </>}
      <SyncStatus sync={report.sync} observedAt={report.scope.observedAt} onChanged={() => setRefresh(n => n + 1)} />
      <p className={cx(mutedCopy, 'mt-4')}>Observed {new Date(report.scope.observedAt).toLocaleString()}. Model time is summed per run; accounted hours merge overlapping work and are usually lower.</p>
    </div> : null}
  </>;
}
