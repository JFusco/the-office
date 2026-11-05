import type { DailyCTOReport, ProjectGoal } from '../shared';
import { ReviewText } from './ReviewText';

const goalState = { idea: 'Idea', planned: 'Planned', active: 'In progress', blocked: 'Blocked', done: 'Goal complete' };

/** Historical summaries stay readable without changing the underlying assessment or evidence. */
export function CTOReview({ report, currentGoals = [] }: { report: DailyCTOReport; currentGoals?: ProjectGoal[] }) {
  const original = report.result?.summary || report.detail, summary = report.briefing?.summary || original;
  const projects = (report.facts as { projects?: { projectId: string; project: string; goals: { id: string; title: string; status?: keyof typeof goalState }[] }[] } | null)?.projects || [];
  const updates = report.briefing?.goals || report.result?.updates || [];
  return <div className="space-y-4">
    {summary.length <= 1500 ? <ReviewText text={summary} /> : null}
    {report.conflicts.length ? <div><h4 className="font-semibold">Needs a fresh look</h4><ul className="list-disc space-y-2 pl-5 text-13">{report.conflicts.map((conflict, i) => <li key={i}>{conflict}</li>)}</ul></div> : null}
    {updates.length ? <div className="space-y-3"><h4 className="font-semibold">Goals reviewed</h4>{updates.map(update => {
      const project = projects.find(project => project.projectId === update.projectId), goal = project?.goals.find(goal => goal.id === update.goalId);
      const assessment = report.result?.updates.find(item => item.projectId === update.projectId && item.goalId === update.goalId);
      const status = (report.applied?.includes(`${update.projectId}:${update.goalId}`) ? assessment?.status : null) || goal?.status;
      const current = currentGoals.find(item => item.projectId === update.projectId && item.id === update.goalId);
      return <article className="rounded-8 border border-current/15 p-3" key={`${update.projectId}:${update.goalId}`}>
        <p className="text-12 opacity-70">{project?.project || update.projectId}{status ? ` · At this review: ${goalState[status]}` : ''}</p>
        <h5 className="mt-1 font-semibold">{goal?.title || 'Goal progress'}</h5>
        {current && current.status !== status ? <p className="my-2 text-13 font-semibold">Now: {goalState[current.status]}{current.status === 'done' && current.requestId === 'human' ? ' · Accepted by Joe' : ''}</p> : null}
        <ReviewText text={update.progress} />
        {update.blockers.length ? <div className="my-2"><strong className="text-13">Outstanding at this review</strong><ul className="list-disc space-y-1 pl-5 text-13">{update.blockers.map((blocker, i) => <li key={i}>{blocker}</li>)}</ul></div> : null}
        {assessment ? <details className="mt-3 text-12"><summary className="cursor-pointer">Supporting notes</summary><div className="mt-3 space-y-3"><ReviewText text={assessment.progress} /><ReviewText text={assessment.rationale} />{report.briefing && assessment.blockers.length ? <ReviewText text={assessment.blockers.map(item => `- ${item}`).join('\n')} /> : null}</div></details> : null}
      </article>;
    })}</div> : null}
    {report.briefing || original.length > 1500 ? <details className="text-13"><summary className="cursor-pointer">Original detailed assessment</summary><div className="mt-3"><ReviewText text={original} /></div></details> : null}
    {report.result?.unmapped.length ? <details className="text-13"><summary className="cursor-pointer">Goals needing project mapping ({report.result.unmapped.length})</summary><ul className="mt-3 list-disc pl-5">{report.result.unmapped.map((item, i) => <li key={i}>{item}</li>)}</ul></details> : null}
    <p className="text-12 opacity-70">Historical review based on information collected {new Date(report.collectedAt).toLocaleString()}.</p>
  </div>;
}
