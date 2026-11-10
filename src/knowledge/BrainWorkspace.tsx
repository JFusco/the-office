import type { OfficeSnapshot } from '../shared';
import { Library } from './Library';
import { MapView } from './map/MapView';
import { Activity } from './Activity';
import { useEffect, useRef, useState } from 'react';
import { Button, cx, interactive } from '../ui';
import { ArrowRight } from '../ui/icons';
import { Sources } from './sources/Sources';
/** A view within the Office shell; the shell retains project, room and camera state. */
export default function BrainWorkspace({ project, projects, onClose, reduced = true,snapshot,refresh }: { snapshot?:OfficeSnapshot;refresh?:()=>Promise<void>;project: string; projects: { id: string; name: string }[]; onClose: () => void; reduced?: boolean }) {
    const [view,setView] = useState('Sources');
    const heading = useRef<HTMLHeadingElement>(null);
    useEffect(() => { heading.current?.focus(); }, []);
    return <div className="h-full overflow-auto bg-drawer text-ink" data-office-brain>
        <h1 ref={heading} tabIndex={-1} className="sr-only">Office Brain</h1>
        <div className="flex items-center justify-between gap-4 border-b border-drawer-line px-9 py-3 max-compact:px-4">
            <nav className="flex flex-wrap gap-2" aria-label="Brain views">{['Sources','Library','Map','Activity'].map(name => <button key={name} className={cx(interactive, 'rounded-6 px-3 py-2 text-11 font-emphasis', view === name && 'bg-roster-hover')} aria-current={view === name ? 'page' : undefined} onClick={() => setView(name)}>{name}</button>)}</nav>
            <Button onClick={onClose}>Return to office <ArrowRight size={14}/></Button>
        </div>
        <div className="mx-auto max-w-6xl px-9 py-8 max-compact:px-4 max-compact:py-5">{view === 'Sources' ? <Sources key={project} project={project} projects={projects}/> : view === 'Library' ? <Library key={project} project={project} snapshot={snapshot} refresh={refresh}/> : view === 'Map' ? <MapView key={project} project={project} reduced={reduced}/> : <Activity key={project} project={project}/>}</div>
    </div>;
}
