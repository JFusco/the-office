import { knowledgePage } from './presentation';
import { KnowledgeMotion } from './KnowledgeReveal';
import type { OfficeSnapshot } from '../shared';
import { Library } from './Library';
import { MapView } from './map/MapView';
import { Activity } from './Activity';
import { LessonsView } from './LessonsView';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';
import { ArrowRight } from '../ui/icons';
/** A view within the Office shell; the shell retains project, room and camera state. */
export default function BrainWorkspace({ project, onClose, reduced = true,snapshot,refresh }: { snapshot?:OfficeSnapshot;refresh?:()=>Promise<void>;project: string; onClose: () => void; reduced?: boolean }) {
    const [view,setView] = useState('Lessons');
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => { heading.current?.focus(); }, []);
    return <KnowledgeMotion.Provider value={reduced}><div className="flex h-full min-h-0 flex-col bg-drawer text-ink">
        <h1 ref={heading} tabIndex={-1} className="sr-only">Office Brain</h1>
        <div className="shrink-0 border-b border-drawer-rule bg-paper"><div className="mx-auto flex w-full max-w-brain-content flex-wrap items-center justify-between gap-control-gap px-panel-padding py-3" data-brain-navigation>
            <nav className="flex flex-wrap gap-control-gap" aria-label="Brain views">{['Lessons','Library','Map','Activity'].map(name => <Button key={name} aria-current={view === name ? 'page' : undefined} onClick={() => setView(name)}>{name}</Button>)}</nav>
            <Button onClick={onClose}>Return to office <ArrowRight size={14}/></Button>
        </div></div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" data-office-brain><div className={"mx-auto w-full max-w-brain-content p-panel-padding " + knowledgePage} data-brain-content>{view === 'Lessons' ? <LessonsView key={project} project={project} snapshot={snapshot} refresh={refresh}/> : view === 'Library' ? <Library key={project} project={project}/> : view === 'Map' ? <MapView key={project} project={project} reduced={reduced}/> : <Activity key={project} project={project}/>}</div></div>
    </div></KnowledgeMotion.Provider>;
}
