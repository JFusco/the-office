import { useId, useState } from 'react';
import type { Lesson, OfficeSnapshot } from '../shared';
import { ExternalLink } from '../ui/icons';
import { Button, Card, CheckField, Count, Section, SectionTitle, Tag, TextLink, cx, eyebrow, interactive, mutedCopy } from '../ui';
import { SaveFeedback } from '../office/SaveFeedback';
import { useProjectSetting } from '../office/settings/useProjectSetting';
import { lessonsView, ROLLUP_ROWS, TRIGGER_LABEL } from './lessons-view';

const when = (at: string) => at ? new Date(at).toLocaleString() : '';
const row = 'border-b border-row-rule py-2 text-11 leading-relaxed';

function Evidence({ lesson }: { lesson: Lesson }) {
  return lesson.evidence.length ? <ul className="flex flex-col gap-1 text-10">{lesson.evidence.map(item => <li key={item.ref}>{/^https:\/\//.test(item.url) ? <TextLink href={item.url} target="_blank" rel="noreferrer">{item.detail}<ExternalLink size={11} /></TextLink> : <span>{item.detail}</span>}</li>)}</ul> : null;
}

function LessonCard({ lesson, actions, footer }: { lesson: Lesson; actions?: React.ReactNode; footer?: React.ReactNode }) {
  return <Card as="article">
    <div className="flex flex-wrap items-center gap-1.5"><Tag>{lesson.kind}</Tag>{lesson.stages.map(stage => <Tag key={stage}>{stage}</Tag>)}{lesson.scope === 'office' ? <Tag>office-wide</Tag> : null}</div>
    <strong className="text-12 leading-relaxed">{lesson.statement}</strong>
    {lesson.detail ? <p className={mutedCopy}>{lesson.detail}</p> : null}
    {lesson.paths.length ? <p className="text-10 leading-relaxed text-card-detail">Paths: {lesson.paths.join(', ')}</p> : null}
    <Evidence lesson={lesson} />
    {lesson.recurrences?.length ? <p className="text-10 leading-relaxed text-card-detail">Recurred {lesson.recurrences.length} {lesson.recurrences.length === 1 ? 'time' : 'times'}: {lesson.recurrences.map(item => item.detail).filter(Boolean).join(' · ')}</p> : null}
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    {footer ? <small className="text-10 text-card-detail">{footer}</small> : null}
  </Card>;
}

/** Harper's lessons for the selected project. Lessons are advisory history; retiring removes one from future prompts. */
export function LessonsPanel({ snapshot, refresh }: { snapshot: OfficeSnapshot; refresh?: () => Promise<void> }) {
  const view = lessonsView(snapshot.knowledge, snapshot.officeKnowledge), github = snapshot.project?.provider === 'github', harper = snapshot.agents.find(agent => agent.id === 'knowledge')?.name || 'Harper';
  // A draft only while editing, so a change saved elsewhere is never silently reverted.
  const [draft, setDraft] = useState<boolean | null>(null), enabled = draft ?? view.enabled, headingId = useId();
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo' || !snapshot.knowledge, refresh, success: 'Saved.' });
  const act = (action: string, lessonId: string) => void save(action, { lessonId }).then(saved => { if (saved) document.getElementById(headingId)?.focus(); });
  return <Section data-lessons-panel>
    <SectionTitle className="mb-2">Lessons</SectionTitle>
    <p className={mutedCopy}>{harper} reviews each ticket that finishes, is parked, is retired, or uses up a repair budget, and each CMS maintenance run that finishes or blocks, and keeps short lessons with links to the evidence. The team sees the relevant ones before each delivery stage. Lessons are advice, never a gate. Every Friday {harper} writes a roll-up of the week.</p>
    <form className="mt-5 grid gap-3" onSubmit={event => { event.preventDefault(); void save('configure-knowledge', { knowledge: { enabled } }).then(saved => { if (saved) setDraft(null); }); }}>
      <CheckField checked={enabled} disabled={disabled} onChange={event => setDraft(event.target.checked)}>Let {harper} write retrospectives for this project</CheckField>
      <Button type="submit" className="justify-self-start" disabled={disabled || draft === null || draft === view.enabled}>Save</Button>
    </form>
    <SaveFeedback message={message} error={error} pending={pending} />
    <Section>
      <SectionTitle id={headingId} tabIndex={-1} className="mb-2">Active lessons <Count>{view.active.length}</Count></SectionTitle>
      <p className={cx(mutedCopy, 'mb-2')}>Each stage sees up to 20 of the newest matching lessons, then office-wide ones. Retire any that no longer hold.</p>
      {view.active.length ? view.active.map(lesson => <LessonCard key={lesson.id} lesson={lesson} actions={<Button disabled={disabled} onClick={() => act('retire-lesson', lesson.id)} aria-label={`Retire lesson: ${lesson.statement}`}>Retire</Button>} />) : <p className={mutedCopy}>No lessons yet. They appear after {harper}'s first retrospective.</p>}
    </Section>
    {view.ineffective.length ? <Section data-lessons-ineffective>
      <SectionTitle className="mb-2">Not working <Count>{view.ineffective.length}</Count></SectionTitle>
      <p className={cx(mutedCopy, 'mb-2')}>These recurred at least twice after {harper} learned them, so they are out of the prompts. Reword the idea in chat with {harper}, reactivate it, or retire it.</p>
      {view.ineffective.map(lesson => <LessonCard key={lesson.id} lesson={lesson} actions={<><Button disabled={disabled} onClick={() => act('reactivate-lesson', lesson.id)} aria-label={`Reactivate lesson: ${lesson.statement}`}>Reactivate</Button><Button disabled={disabled} onClick={() => act('retire-lesson', lesson.id)} aria-label={`Retire lesson: ${lesson.statement}`}>Retire</Button></>} />)}
    </Section> : null}
    {view.agentsSuggestions.length ? <Section data-lessons-agents>
      <SectionTitle className="mb-2">AGENTS.md suggestions <Count>{view.agentsSuggestions.filter(lesson => lesson.repositoryInstruction?.status === 'proposed').length}</Count></SectionTitle>
      <p className={cx(mutedCopy, 'mb-2')}>{harper} thinks these belong in the repository's AGENTS.md. Filing opens a normal GitHub issue, so the change goes through ordinary delivery and review.</p>
      {view.agentsSuggestions.map(lesson => <LessonCard key={lesson.id} lesson={lesson}
        actions={lesson.repositoryInstruction?.status === 'proposed' ? <>{github ? <Button variant="primary" disabled={disabled} onClick={() => act('file-lesson-issue', lesson.id)} aria-label={`File AGENTS.md issue: ${lesson.statement}`}>File issue</Button> : null}<Button disabled={disabled} onClick={() => act('decline-lesson-issue', lesson.id)} aria-label={`Decline AGENTS.md suggestion: ${lesson.statement}`}>Decline</Button></> : undefined}
        footer={lesson.repositoryInstruction?.status === 'filed' && lesson.repositoryInstruction.issueUrl ? <TextLink href={lesson.repositoryInstruction.issueUrl} target="_blank" rel="noreferrer">Issue filed<ExternalLink size={11} /></TextLink> : !github ? 'Add it to the repository instructions yourself; issues are filed for GitHub projects only.' : undefined} />)}
    </Section> : null}
    <Section data-lessons-office>
      <SectionTitle className="mb-2">Office-wide lessons <Count>{view.officeLessons.length}</Count></SectionTitle>
      <p className={cx(mutedCopy, 'mb-2')}>Shared by every project. {harper} proposes them from the weekly roll-ups; nothing becomes office-wide until you accept it.</p>
      {view.officeProposals.map(proposal => <Card as="article" key={proposal.id}>
        <div className="flex flex-wrap items-center gap-1.5"><Tag>proposed</Tag><Tag>{proposal.kind}</Tag><span className={cx(eyebrow, 'text-9')}>from {proposal.projectId}</span></div>
        <strong className="text-12 leading-relaxed">{proposal.statement}</strong>
        {proposal.detail ? <p className={mutedCopy}>{proposal.detail}</p> : null}
        <div className="flex flex-wrap gap-2"><Button variant="primary" disabled={disabled} onClick={() => act('accept-office-lesson', proposal.id)} aria-label={`Accept office-wide lesson: ${proposal.statement}`}>Accept</Button><Button disabled={disabled} onClick={() => act('decline-office-lesson', proposal.id)} aria-label={`Decline office-wide lesson: ${proposal.statement}`}>Decline</Button></div>
      </Card>)}
      {view.officeLessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} actions={<Button disabled={disabled} onClick={() => act('retire-office-lesson', lesson.id)} aria-label={`Retire office-wide lesson: ${lesson.statement}`}>Retire</Button>} />)}
      {!view.officeProposals.length && !view.officeLessons.length ? <p className={mutedCopy}>None yet.</p> : null}
    </Section>
    <Section data-lessons-rollup>
      <SectionTitle className="mb-2">Weekly roll-up</SectionTitle>
      {view.rollups.length ? <>
        <p className="text-11 leading-relaxed">{view.rollups[0].summary}</p>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-10">
          <caption className="sr-only">Delivery metrics for the last {view.rollups.length} weeks</caption>
          <thead><tr><th scope="col" className="border-b border-row-rule py-1.5 pr-2 text-left font-semibold">Week ending</th>{view.rollups.map(rollup => <th key={rollup.id} scope="col" className="border-b border-row-rule py-1.5 pl-2 text-right font-semibold">{rollup.weekEnding.slice(5)}</th>)}</tr></thead>
          <tbody>{ROLLUP_ROWS.map(([label, value]) => <tr key={label}><th scope="row" className="border-b border-row-rule py-1.5 pr-2 text-left font-regular">{label}</th>{view.rollups.map(rollup => <td key={rollup.id} className="border-b border-row-rule py-1.5 pl-2 text-right">{value(rollup)}</td>)}</tr>)}</tbody>
        </table></div>
      </> : <p className={mutedCopy}>The first roll-up arrives on Friday after Avery's review.</p>}
      {view.rollupError ? <p className="mt-2 text-10 text-card-detail wrap-anywhere">Last roll-up attempt: {view.rollupError}. {harper} tries again automatically.</p> : null}
    </Section>
    {view.pending.length ? <Section>
      <SectionTitle className="mb-2">Queued retrospectives <Count>{view.pending.length}</Count></SectionTitle>
      {view.pending.map(entry => <p key={entry.id} className={row}><span className={cx(eyebrow, 'block text-9')}>{entry.key} · {TRIGGER_LABEL[entry.trigger]}</span>{entry.attempts ? `Attempt ${entry.attempts}${entry.nextAt ? ` · next try ${when(entry.nextAt)}` : ''}` : `Waiting for ${harper}`}{entry.lastError ? <small className="block text-10 text-card-detail wrap-anywhere">Last attempt: {entry.lastError}</small> : null}</p>)}
    </Section> : null}
    <Section>
      <SectionTitle className="mb-2">Recent retrospectives</SectionTitle>
      {view.recent.length ? view.recent.map(record => <p key={record.id} className={row}><span className={cx(eyebrow, 'block text-9')}>{record.key} · {TRIGGER_LABEL[record.trigger]} · {when(record.at)}</span>{record.summary}<small className="block text-10 text-card-detail">{record.lessonIds.length} new {record.lessonIds.length === 1 ? 'lesson' : 'lessons'}</small></p>) : <p className={mutedCopy}>None yet.</p>}
      {view.retired.length ? <details className="my-4"><summary className={cx('cursor-pointer text-13 font-semibold', interactive)}>Retired lessons ({view.retired.length})</summary>{view.retired.map(lesson => <LessonCard key={lesson.id} lesson={lesson} footer={`Retired ${when(lesson.retiredAt || lesson.updatedAt)}`} />)}</details> : null}
    </Section>
  </Section>;
}
