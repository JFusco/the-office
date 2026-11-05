import type { ProjectGoal } from '../shared';
import { Count, Section, SectionTitle, cx, eyebrow, interactive, mutedCopy } from '../ui';
import { reviewExcerpt } from './ReviewText';

export function GoalList({ goals, disabled, onEdit }: { goals: ProjectGoal[]; disabled: boolean; onEdit: (goal: ProjectGoal) => void }) {
  const current = goals.filter(goal => goal.status !== 'done');
  const completed = goals.filter(goal => goal.status === 'done');
  function card(goal: ProjectGoal) {
    return <button type="button" key={`${goal.projectId}:${goal.id}`} disabled={disabled} onClick={() => onEdit(goal)} className={cx('my-2.5 flex w-full flex-col gap-2 rounded-8 border border-l-3 border-goal-line bg-goal p-4 text-left enabled:hover:border-goal-hover-line enabled:hover:bg-goal-hover', goal.priority === 1 ? 'border-l-goal-first' : 'border-l-goal-rank', interactive)}>
      <span className={cx(eyebrow, 'text-9')}>{goal.project} · {goal.status === 'done' ? 'Completed' : `${['', 'First', 'Next', 'Later', 'Someday'][goal.priority]} · ${goal.status}`}</span>
      <strong className="text-14">{goal.title}</strong>
      <span className="text-12 leading-relaxed">{reviewExcerpt(goal.detail, 180)}</span>
      {goal.status === 'done' && goal.requestId === 'human' ? <span className="text-12 leading-relaxed">Accepted by Joe.</span> : goal.progress?.note ? <span className="text-12 leading-relaxed">Avery: {reviewExcerpt(goal.progress.note, 220)}</span> : null}
      {goal.mapping === 'unmapped' ? <small>Project mapping needs review · owned by {goal.projectId}</small> : null}
      <small className="block text-10 leading-relaxed text-goal-detail">Select for full details, history, and editing</small>
    </button>;
  }
  return <Section>
    <SectionTitle className="mb-4">Project priorities <Count>{current.length}</Count></SectionTitle>
    {current.length ? current.map(card) : <p className={mutedCopy}>{completed.length ? 'All recorded goals are complete.' : 'No goals recorded yet. Start with an idea or a project outcome you want the team to work toward.'}</p>}
    {completed.length ? <details className="my-4"><summary className={cx('cursor-pointer text-13 font-semibold', interactive)}>Completed ({completed.length})</summary>{completed.map(card)}</details> : null}
  </Section>;
}
