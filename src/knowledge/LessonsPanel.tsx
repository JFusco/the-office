import { useId, useState } from 'react';
import type { Lesson, OfficeSnapshot } from '../shared';
import { ExternalLink } from '../ui/icons';
import { Button, Card, CheckField, Count, Section, SectionTitle, Tag, TextLink, cx, eyebrow, interactive, mutedCopy } from '../ui';
import { SaveFeedback } from '../office/SaveFeedback';
import { useProjectSetting } from '../office/settings/useProjectSetting';
import { lessonsView, TRIGGER_LABEL } from './lessons-view';

const when = (at: string) => at ? new Date(at).toLocaleString() : '';

function LessonCard({ lesson, onRetire, disabled }: { lesson: Lesson; onRetire?: () => void; disabled: boolean }) {
  return <Card as="article">
    <div className="flex flex-wrap items-center gap-1.5"><Tag>{lesson.kind}</Tag>{lesson.stages.map(stage => <Tag key={stage}>{stage}</Tag>)}</div>
    <strong className="text-12 leading-relaxed">{lesson.statement}</strong>
    {lesson.detail ? <p className={mutedCopy}>{lesson.detail}</p> : null}
    {lesson.paths.length ? <p className="text-10 leading-relaxed text-card-detail">Paths: {lesson.paths.join(', ')}</p> : null}
    {lesson.evidence.length ? <ul className="flex flex-col gap-1 text-10">{lesson.evidence.map(item => <li key={item.ref}>{/^https:\/\//.test(item.url) ? <TextLink href={item.url} target="_blank" rel="noreferrer">{item.detail}<ExternalLink size={11} /></TextLink> : <span>{item.detail}</span>}</li>)}</ul> : null}
    {onRetire ? <Button className="self-start" disabled={disabled} onClick={onRetire} aria-label={`Retire lesson: ${lesson.statement}`}>Retire</Button> : <small className="text-10 text-card-detail">Retired {when(lesson.retiredAt || lesson.updatedAt)}</small>}
  </Card>;
}

/** Harper's lessons for the selected project. Lessons are advisory history; retiring removes one from future prompts. */
export function LessonsPanel({ snapshot, refresh }: { snapshot: OfficeSnapshot; refresh?: () => Promise<void> }) {
  const view = lessonsView(snapshot.knowledge), github = snapshot.project?.provider === 'github', harper = snapshot.agents.find(agent => agent.id === 'knowledge')?.name || 'Harper';
  // A draft only while editing, so a change saved elsewhere is never silently reverted.
  const [draft, setDraft] = useState<boolean | null>(null), enabled = draft ?? view.enabled, headingId = useId();
  const { save, pending, message, error, disabled } = useProjectSetting({ projectId: snapshot.project?.id || '', demo: snapshot.mode === 'demo' || !github || !snapshot.knowledge, refresh, success: 'Saved for this project.' });
  return <Section data-lessons-panel>
    <SectionTitle className="mb-2">Lessons</SectionTitle>
    <p className={mutedCopy}>{harper} reviews each ticket that finishes, is parked in Block, is retired, or uses up a repair budget, and keeps short lessons with links to the evidence. The team sees the relevant ones before each delivery stage. Lessons are advice, never a gate.</p>
    {!github ? <p className={cx(mutedCopy, 'mt-4')}>Lessons are available for GitHub projects.</p> : <>
      <form className="mt-5 grid gap-3" onSubmit={event => { event.preventDefault(); void save('configure-knowledge', { knowledge: { enabled } }).then(() => setDraft(null)); }}>
        <CheckField checked={enabled} disabled={disabled} onChange={event => setDraft(event.target.checked)}>Let {harper} write retrospectives for this project</CheckField>
        <Button type="submit" className="justify-self-start" disabled={disabled || draft === null || draft === view.enabled}>Save</Button>
      </form>
      <SaveFeedback message={message} error={error} pending={pending} />
      <Section>
        <SectionTitle id={headingId} tabIndex={-1} className="mb-2">Active lessons <Count>{view.active.length}</Count></SectionTitle>
        <p className={cx(mutedCopy, 'mb-2')}>Each stage sees up to 20 of the newest matching lessons. Retire any that no longer hold.</p>
        {view.active.length ? view.active.map(lesson => <LessonCard key={lesson.id} lesson={lesson} disabled={disabled} onRetire={() => void save('retire-lesson', { lessonId: lesson.id }).then(() => document.getElementById(headingId)?.focus())} />) : <p className={mutedCopy}>No lessons yet. They appear after {harper}'s first retrospective.</p>}
        {view.retired.length ? <details className="my-4"><summary className={cx('cursor-pointer text-13 font-semibold', interactive)}>Retired ({view.retired.length})</summary>{view.retired.map(lesson => <LessonCard key={lesson.id} lesson={lesson} disabled />)}</details> : null}
      </Section>
      {view.pending.length ? <Section>
        <SectionTitle className="mb-2">Queued retrospectives <Count>{view.pending.length}</Count></SectionTitle>
        {view.pending.map(entry => <p key={entry.id} className="border-b border-row-rule py-2 text-11 leading-relaxed"><span className={cx(eyebrow, 'block text-9')}>{entry.key} · {TRIGGER_LABEL[entry.trigger]}</span>{entry.attempts ? `Attempt ${entry.attempts}${entry.nextAt ? ` · next try ${when(entry.nextAt)}` : ''}` : `Waiting for ${harper}`}{entry.lastError ? <small className="block text-10 text-card-detail wrap-anywhere">Last attempt: {entry.lastError}</small> : null}</p>)}
      </Section> : null}
      <Section>
        <SectionTitle className="mb-2">Recent retrospectives</SectionTitle>
        {view.recent.length ? view.recent.map(record => <p key={record.id} className="border-b border-row-rule py-2 text-11 leading-relaxed"><span className={cx(eyebrow, 'block text-9')}>{record.key} · {TRIGGER_LABEL[record.trigger]} · {when(record.at)}</span>{record.summary}<small className="block text-10 text-card-detail">{record.lessonIds.length} new {record.lessonIds.length === 1 ? 'lesson' : 'lessons'}</small></p>) : <p className={mutedCopy}>None yet.</p>}
      </Section>
    </>}
  </Section>;
}
