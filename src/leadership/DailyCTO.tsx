import { useState } from 'react';
import type { DailyCTOReport, OfficeSnapshot } from '../shared';
import { officeUrl } from '../shared';
import { Button, Section, SectionTitle, mutedCopy } from '../ui';
import { CTOReview } from './CTOReview';
import { ReviewText } from './ReviewText';

const reportDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const reviewStatus = { completed: 'Review finished', conflicted: 'Needs a fresh look', blocked: 'Review stopped', interrupted: 'Review interrupted', working: 'Avery is reviewing', queued: 'Waiting for Avery', 'recovery-queued': 'Readback queued', assessed: 'Applying review', coalesced: 'Included in a newer review' };

export function DailyCTO({ snapshot }: { snapshot: OfficeSnapshot }) {
  const [report, setReport] = useState<DailyCTOReport | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState('');
  async function load(id: string) {
    setLoading(id); setReport(null); setError('');
    try { const response = await fetch(`/api/daily-cto?id=${encodeURIComponent(id)}`); if (!response.ok) throw new Error('Could not load daily review'); setReport((await response.json()).report); setError(''); }
    catch (error) { setError(String(error)); }
    finally { setLoading(''); }
  }
  const cards = (snapshot.dailyCTO || []).map(item => <article className="my-3 rounded-8 bg-report p-4" key={item.id}>
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>Project review · {reportDate(item.date)}</strong><span className="text-12">{reviewStatus[item.status]}</span></div>
    {report?.id === item.id ? <div className="mt-4"><CTOReview report={report} currentGoals={snapshot.ctoGoals || snapshot.goals} /><Button className="mt-3" onClick={() => setReport(null)}>Close recap</Button></div> : <>
      {item.detail.length <= 1500 ? <ReviewText text={item.detail} /> : null}
      <Button disabled={!!loading} aria-expanded={false} onClick={() => void load(item.id)}>{loading === item.id ? 'Loading recap…' : 'Read recap'}</Button>
    </>}
  </article>);
  return <Section><SectionTitle className="mb-4">Daily CTO review</SectionTitle><p className={mutedCopy}>Avery reviews every project Monday–Friday at 5 PM Eastern. Weekends are off.</p>
    {cards[0] || <p className="my-3 text-13">No reviews yet. Avery’s next weekday review will appear here.</p>}
    {cards.length > 1 ? <details className="my-3"><summary className="cursor-pointer text-13">Earlier reviews ({cards.length - 1})</summary>{cards.slice(1)}</details> : null}
    {error ? <p role="alert">{error}</p> : null}
  </Section>;
}

export function GoalHistory({ projectId, goalId }: { projectId: string; goalId: string }) {
  const [rows, setRows] = useState<{ at: string; cursor: string; proposal: { progress: string; rationale: string } }[]>([]), [error, setError] = useState('');
  async function load() { try { const response = await fetch(officeUrl(`/api/goals/history?goalId=${encodeURIComponent(goalId)}&limit=50${rows.length ? `&before=${encodeURIComponent(rows.at(-1)!.cursor)}` : ''}`, projectId)); if (!response.ok) throw new Error('Could not load goal history'); setRows([...rows, ...(await response.json()).applications]); } catch (error) { setError(String(error)); } }
  return <div className="my-3"><Button onClick={() => void load()}>{rows.length ? 'Load earlier goal history' : 'Load goal review history'}</Button>{error ? <p role="alert">{error}</p> : null}{rows.map((row, index) => <article key={`${row.at}:${index}`} className="my-3"><small>{new Date(row.at).toLocaleString()}</small><p>{row.proposal.progress}</p><p>{row.proposal.rationale}</p></article>)}</div>;
}
