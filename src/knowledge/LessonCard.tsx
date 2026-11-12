import type { ReactNode } from 'react';
import type { Lesson } from '../shared';
import { ExternalLink } from '../ui/icons';
import { Card, Tag, TextLink, mutedCopy } from '../ui';

function Evidence({ lesson }: { lesson: Lesson }) {
  return lesson.evidence.length ? <ul className="flex flex-col gap-1 text-10">{lesson.evidence.map(item => <li key={item.ref}>{/^https:\/\//.test(item.url) ? <TextLink href={item.url} target="_blank" rel="noreferrer">{item.detail}<ExternalLink size={11} /></TextLink> : <span>{item.detail}</span>}</li>)}</ul> : null;
}

/** The situation, the action and its check, in the order a teammate needs them. Older lessons may carry only the action. */
export function LessonShape({ lesson }: { lesson: Pick<Lesson, 'when' | 'statement' | 'check'> }) {
  return <dl className="grid gap-1 text-12 leading-relaxed" data-lesson-shape>
    {lesson.when ? <div><dt className="inline font-emphasis text-card-detail">When </dt><dd className="inline">{lesson.when}</dd></div> : null}
    <div><dt className="inline font-emphasis text-card-detail">Do </dt><dd className="inline font-emphasis">{lesson.statement}</dd></div>
    {lesson.check ? <div><dt className="inline font-emphasis text-card-detail">Check </dt><dd className="inline">{lesson.check}</dd></div> : null}
  </dl>;
}

export function LessonCard({ lesson, actions, footer }: { lesson: Lesson; actions?: ReactNode; footer?: ReactNode }) {
  return <Card as="article">
    <div className="flex flex-wrap items-center gap-1.5"><Tag>{lesson.kind}</Tag><Tag>{lesson.tier} · revision {lesson.revision}</Tag>{lesson.stages.map(stage => <Tag key={stage}>{stage}</Tag>)}{lesson.scope === 'office' ? <Tag>office-wide</Tag> : null}{lesson.supersedes ? <Tag>replaces an earlier lesson</Tag> : null}{lesson.supersededBy ? <Tag>replaced by a newer lesson</Tag> : null}{lesson.retiredBy === 'graduated' ? <Tag>graduated into the repository</Tag> : null}{lesson.retiredBy === 'expired' ? <Tag>expired</Tag> : null}{lesson.status === 'active' && lesson.validUntil ? <Tag>valid until {lesson.validUntil}</Tag> : null}</div>
    <LessonShape lesson={lesson} />
    {lesson.detail ? <p className={mutedCopy}>{lesson.detail}</p> : null}
    {lesson.paths.length ? <p className="text-10 leading-relaxed text-card-detail">Paths: {lesson.paths.join(', ')}</p> : null}
    <Evidence lesson={lesson} />
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    {footer ? <small className="text-10 text-card-detail">{footer}</small> : null}
  </Card>;
}

