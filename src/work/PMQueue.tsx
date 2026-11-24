import { motion } from 'motion/react';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { withoutIdentifiers } from '../office/without-identifiers';
import type { OfficeSnapshot } from '../shared';
import { Button, Card, Count, Section, SectionTitle, Tag, TextLink, mutedCopy } from '../ui';
import { Inbox } from '../ui/icons';
import { PanelHeader } from '../ui/PanelHeader';
import { DependencyNotice } from './DependencyNotice';
import { pmQueueItems, waitingOnlyOnPrerequisites } from './pm-queue';
import { ticketProgress } from './timeline/ticket-progress';
import { transitionKey, useTransitions } from './timeline/use-transitions';

type OpenFocus = {identity: string; scroll: HTMLElement | null; top: number};

function OpenTicketButton({identity, projectName, onClick, focusToRestore}: {
    identity: string;
    projectName: string;
    onClick: () => void;
    focusToRestore: RefObject<OpenFocus | null>;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    useLayoutEffect(() => {
        const button = ref.current;
        const saved = focusToRestore.current;
        if (saved?.identity === identity && document.activeElement === document.body) {
            button?.focus({preventScroll: true});
            if (saved.scroll) saved.scroll.scrollTop = saved.top;
        }
        // Cleanup runs before React removes the focused button from its old group.
        return () => {
            if (!button || document.activeElement !== button) return;
            const scroll = button.closest<HTMLElement>('[data-inspector-scroll]');
            focusToRestore.current = {identity, scroll, top: scroll?.scrollTop || 0};
        };
    }, [identity, focusToRestore]);
    return <Button ref={ref} className="self-start" onClick={onClick}>Open {projectName} ticket</Button>;
}

export function PMQueue({snapshot, onOpen, reduced = true}: {
    snapshot: OfficeSnapshot;
    onOpen: (project: string, key: string) => void;
    reduced?: boolean;
}) {
    const rows = pmQueueItems(snapshot).map(row => {
        const progress = ticketProgress(snapshot, row.project, row.key, row);
        return {...row, progress, identity: row.project + ':' + row.key, signature: transitionKey(progress)};
    });
    const changes = useTransitions(snapshot, new Map(rows.map(r => [r.identity,r.signature])), reduced);
    const waiting = rows.filter(r => r.group === 'waiting');
    const dependencyOnly = waitingOnlyOnPrerequisites(waiting);
    const titles = {active:'With the team now', queued:'Queued next',
        waiting:dependencyOnly ? 'Waiting on prerequisites' : 'Waiting for the next step', stopped:'Stopped · needs follow-up'};
    const focusToRestore = useRef<OpenFocus | null>(null);
    useLayoutEffect(() => { focusToRestore.current = null; });
    const live = snapshot.liveAnchor?.connected && snapshot.liveAnchor.visible;
    const time = snapshot.liveAnchor?.serverTime || snapshot.serverTime;
    return <>
        <span role="status" aria-atomic="true" className="sr-only">{rows.filter(row => changes.get(row.identity) === row.signature)
            .map(row => [row.projectName,row.key,row.progress.phase,row.progress.owner,row.progress.next].filter(Boolean).join(' · ')).join('. ')}</span>
        <PanelHeader icon={<Inbox size={26}/>}>PM queue</PanelHeader>
        {snapshot.mode === 'live' && !live && <p className={mutedCopy}>Last confirmed{time &&
            <> · <time dateTime={time}>{new Date(time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</time></>}</p>}
        <p className={mutedCopy}>Remaining work across all projects, including stopped deliveries and prerequisite waits. Automatic pickup follows each project’s status rule; an explicit Start can queue another assignment.</p>
        {(['active','queued','waiting','stopped'] as const).map(group => {
            const items = rows.filter(r => r.group === group);
            if (!items.length) return null;
            return <Section key={group} aria-label={titles[group]}>
                <SectionTitle className="mb-4">{titles[group]} <Count>{items.length}</Count></SectionTitle>
                {group === 'waiting' && dependencyOnly && <p className={mutedCopy}>These tickets are waiting on linked work. Morgan rechecks them when their prerequisites complete.</p>}
                {group === 'stopped' && <p className={mutedCopy}>These tickets are stopped, not queued for new work. Read the blocker before continuing.</p>}
                {items.map(row => {
                    const pulse = !reduced && changes.get(row.identity) === row.signature;
                    return <Card as="article" key={row.identity}>
                        <strong className="text-11 leading-relaxed">{row.projectName} · {row.key}</strong>
                        <Tag className="max-w-full self-start whitespace-normal!" tone={row.progress.state}>
                            <motion.span aria-hidden="true" key={row.signature + String(pulse)}
                                className="mr-1.5 inline-block size-1.5 shrink-0 rounded-full bg-current"
                                initial={pulse ? {scale:.65} : false} animate={{scale:1}} transition={{type:'spring',stiffness:440,damping:12}}/>
                            {row.progress.phase}
                        </Tag>
                        <h4 className="text-13 leading-relaxed font-semibold">{row.title}</h4>
                        <p className="text-12 leading-body">{[row.progress.owner,row.progress.next].filter(Boolean).join(' · ')}</p>
                        {row.paused && <p className={mutedCopy}>Project paused · dispatch waits until resumed.</p>}
                        {row.detail !== row.progress.next && <p className="text-12 leading-relaxed">{withoutIdentifiers(row.detail)}</p>}
                        <DependencyNotice keys={row.blockedBy || []} snapshot={snapshot} project={row.project} onOpen={onOpen}/>
                        {row.prUrl && <div className="self-start text-10"><TextLink href={row.prUrl} target="_blank" rel="noreferrer">PR #{row.pr} ↗</TextLink></div>}
                        <OpenTicketButton identity={row.identity} projectName={row.projectName} onClick={() => onOpen(row.project,row.key)} focusToRestore={focusToRestore}/>
                    </Card>;
                })}
            </Section>;
        })}
        {!rows.length ? <p className={mutedCopy}>No remaining Office work is recorded. Check project lanes for assignments and GitHub operations for open PRs.</p> :
            !rows.some(r => r.group === 'active' || r.group === 'queued') && <p className={mutedCopy}>Nothing can run yet: {waiting.length} waiting{dependencyOnly ? ' on prerequisites' : ''} · {rows.filter(r => r.group === 'stopped').length} stopped for follow-up. Work remains open.</p>}
    </>;
}
