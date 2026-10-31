import { useState } from 'react';
import type { DailyCTOReport, OfficeSnapshot } from '../shared';
import { officeUrl } from '../shared';
import { Button, Section, SectionTitle, mutedCopy } from '../ui';

export function DailyCTO({ snapshot }: { snapshot: OfficeSnapshot }) {
  const [report, setReport] = useState<DailyCTOReport | null>(null), [error, setError] = useState('');
  async function load(id: string) {
    try { const response = await fetch(`/api/daily-cto?id=${encodeURIComponent(id)}`); if (!response.ok) throw new Error('Could not load daily review'); setReport((await response.json()).report); setError(''); }
    catch (error) { setError(String(error)); }
  }
  return <Section><SectionTitle className="mb-4">Daily CTO review</SectionTitle><p className={mutedCopy}>Avery reviews every project at 5 PM Eastern, including weekends. Reports include paused projects and evidence gaps.</p>
    {(snapshot.dailyCTO || []).map(item => <article className="my-3 rounded-8 bg-report p-4" key={item.id}><strong>{item.date} · {item.status}</strong><p className="my-2 text-12">{item.detail}</p><small>Collected {new Date(item.collectedAt).toLocaleString()}</small><Button onClick={() => void load(item.id)}>Read full report</Button></article>)}
    {error ? <p role="alert">{error}</p> : null}{report ? <details open><summary>{report.date} · complete report</summary><p className="my-2 whitespace-pre-wrap">{report.result?.summary || report.detail}</p>{report.conflicts.map(conflict => <p key={conflict}>{conflict}</p>)}{report.result?.updates.map(update=><article className="my-3" key={`${update.projectId}:${update.goalId}`}><strong>{update.projectId} · {update.status||'Progress update'}</strong><p>{update.progress}</p><p>{update.rationale}</p>{update.blockers.map(blocker=><p key={blocker}>Blocked: {blocker}</p>)}</article>)}{report.result?.unmapped.map(item=><p key={item}>Unmapped: {item}</p>)}</details> : null}
  </Section>;
}

export function GoalHistory({ projectId, goalId }: { projectId: string; goalId: string }) {
  const [rows, setRows] = useState<{ at: string; cursor: string; proposal: { progress: string; rationale: string } }[]>([]), [error, setError] = useState('');
  async function load() { try { const response = await fetch(officeUrl(`/api/goals/history?goalId=${encodeURIComponent(goalId)}&limit=50${rows.length ? `&before=${encodeURIComponent(rows.at(-1)!.cursor)}` : ''}`, projectId)); if (!response.ok) throw new Error('Could not load goal history'); setRows([...rows, ...(await response.json()).applications]); } catch (error) { setError(String(error)); } }
  return <div className="my-3"><Button onClick={() => void load()}>{rows.length ? 'Load earlier goal history' : 'Load goal review history'}</Button>{error ? <p role="alert">{error}</p> : null}{rows.map((row, index) => <article key={`${row.at}:${index}`} className="my-3"><small>{new Date(row.at).toLocaleString()}</small><p>{row.proposal.progress}</p><p>{row.proposal.rationale}</p></article>)}</div>;
}
