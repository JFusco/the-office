import type { OfficeSnapshot } from '../shared';
import { PanelHeader } from '../ui/PanelHeader';
import { CheckCircle2 } from '../ui/icons';
import { mutedCopy } from '../ui';
import { LessonsPanel } from './LessonsPanel';

/** The Knowledge workspace's first view: Harper's curated lessons for the selected project. */
export function LessonsView({ project, snapshot, refresh }: { project: string; snapshot?: OfficeSnapshot; refresh?: () => Promise<void> }) {
    const current = snapshot?.project?.id === project ? snapshot : undefined;
    return <section aria-labelledby="lessons-heading">
        <PanelHeader id="lessons-heading" icon={<CheckCircle2 size={26}/>}>Lessons</PanelHeader>
        <p className={mutedCopy}>What this Office has learned from its own work. Harper reflects on finished and blocked work, curates lessons, and supplies the relevant ones when a teammate starts a stage. General framework and platform guidance stays in Brain.</p>
        {current ? <LessonsPanel titled={false} snapshot={current} refresh={refresh}/> : <p role="status" className={mutedCopy}>Loading this project's lessons…</p>}
    </section>;
}
