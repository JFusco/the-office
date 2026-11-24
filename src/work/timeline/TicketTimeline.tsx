import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';
import type { OfficeSnapshot, Ticket, TicketJob } from '../../shared';
import { Button, Section, SectionTitle, TextLink, cx } from '../../ui';
import { pmQueueItems } from '../pm-queue';
import { MergeApproval } from '../MergeApproval';
import { ticketProgress } from './ticket-progress';
import { ticketHistory } from './ticket-history';
import { transitionKey, useTransitions } from './use-transitions';

const marks = {start: '●', passed: '✓', repair: '↩', blocked: '!', skipped: '–'};
const marker = 'relative z-1 grid size-6 shrink-0 place-items-center rounded-full border border-step-line bg-step text-12';
const clock = (at: string) => new Date(at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

function CurrentMark({animate, complete, repair}: {animate: boolean; complete: boolean; repair: boolean}) {
    if (complete) return <span aria-hidden="true" className={cx(marker, 'border-step-passed-line bg-step-passed text-step-passed-ink')}>
        {animate && <motion.i className="absolute inset-0 rounded-full border-2 border-step-passed-mark" initial={{scale:1,opacity:1}} animate={{scale:1.8,opacity:0}} transition={{duration:.5}}/>}
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><motion.path d="m2 8 4 4 8-9" initial={animate ? {pathLength:0} : false} animate={{pathLength:1}} transition={{duration:.32}}/></svg>
    </span>;
    return <span aria-hidden="true" className={cx(marker,'border-step-current-line bg-step-current-ring text-step-current-ink')}>
        {animate && <motion.i className="absolute bottom-full h-6 w-px origin-top bg-step-current" initial={{scaleY:0}} animate={{scaleY:1}} transition={{duration:.28}}/>}
        {animate ? <motion.span initial={{y:-24,rotate:-14}} animate={{y:[-24,2,-1,0],rotate:[-14,5,0,0]}} transition={{duration:.52}}><Mail size={14}/></motion.span> : repair ? '↩' : '●'}
    </span>;
}

export function TicketTimeline({snapshot, ticket, job, reduced}: {snapshot: OfficeSnapshot; ticket: Pick<Ticket,'key'> & Partial<Ticket>; job?: TicketJob; reduced: boolean}) {
    const [expanded, setExpanded] = useState(false);
    const project = snapshot.project?.id || 'cec';
    const row = pmQueueItems(snapshot).find(r => r.project === project && r.key === ticket.key);
    const progress = ticketProgress(snapshot, project, ticket.key, row);
    const signature = transitionKey(progress);
    const changes = useTransitions(snapshot, new Map([[ticket.key, signature]]), reduced);
    const live = snapshot.liveAnchor?.connected && snapshot.liveAnchor.visible;
    const animate = !reduced && changes.get(ticket.key) === signature && ['working','passed'].includes(progress.state);
    const history = ticketHistory(snapshot, ticket, job);
    const recent = expanded ? history : history.slice(-5);
    const time = snapshot.liveAnchor?.serverTime || snapshot.serverTime;
    return <Section aria-label="Ticket timeline">
        <div className="flex items-center justify-between gap-3"><SectionTitle>Ticket timeline</SectionTitle>
            <small className="text-10 text-muted">{snapshot.mode === 'demo' ? 'Office tour' : live ? 'Live' :
                <>Last confirmed{time && <> · <time dateTime={time}>{clock(time)}</time></>}</>}</small></div>
        <div role="status" aria-atomic="true" className="my-3 rounded-8 border border-step-current-line bg-step-current-ring p-3">
            <strong className="block text-13 text-ink">{progress.phase}</strong>
            {progress.owner && <span className="block text-11">Owner · {progress.owner}</span>}
            {progress.next && <p className="mt-1 text-12 leading-body">Next up · {progress.next}</p>}
        </div>
        {job?.mergeApprovalRequired ? <MergeApproval snapshot={snapshot} job={job}/> : job?.prUrl && progress.state === 'waiting' ? <TextLink href={job.prUrl} target="_blank" rel="noreferrer">View PR #{job.pr}</TextLink> : null}
        {history.length > 5 && <Button className="mb-3" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show recent activity' : 'Show earlier activity'}</Button>}
        <ol className="text-12">
            {recent.map(entry => <li key={entry.id} data-stage-state={entry.mark} className="relative flex items-start gap-3 pb-4">
                <span aria-hidden="true" className="absolute inset-y-0 left-3 w-px bg-step-rule"/>
                <span aria-hidden="true" className={cx(marker, entry.mark === 'passed' && 'bg-step-passed text-step-passed-ink')}>{marks[entry.mark]}</span>
                <div className="min-w-0"><span>{entry.label}</span>{entry.at && <time dateTime={entry.at} title={new Date(entry.at).toLocaleString()} className="ml-2 text-10 text-muted">{clock(entry.at)}</time>}
                {entry.detail && <p className="mt-1 text-11 leading-body text-muted">{entry.detail}</p>}</div>
            </li>)}
            <li aria-current="step" data-transition={animate ? signature : undefined} className="relative flex items-center gap-3 font-semibold">
                <CurrentMark key={signature + String(animate)} animate={animate} complete={progress.state === 'passed'} repair={ticket.stage === 'repair' || job?.stage === 'scope-repair'}/>
                {progress.phase}{progress.owner && ' · ' + progress.owner}
            </li>
            {progress.next && <li className="relative flex items-center gap-3 pt-4 text-muted"><span aria-hidden="true" className="absolute top-0 bottom-3 left-3 border-l border-dashed border-step-line"/><span aria-hidden="true" className={marker}>○</span>{progress.next}</li>}
        </ol>
    </Section>;
}
