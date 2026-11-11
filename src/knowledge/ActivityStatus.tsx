import { knowledgeSection } from './presentation';
import type { KnowledgeActivityPage } from '../contracts/knowledge-views';

export function ActivityStatus({data}:{data:KnowledgeActivityPage}) {
    return <section aria-label="Collection status" data-knowledge-section className={knowledgeSection+" grid gap-3"}>
        <h3 className="font-heading text-18">Current collection</h3>
        <p className="max-w-reading-copy text-12 text-muted">Current persisted status is separate from the dated activity below.</p>
        {data.intake?.length?<ul className="grid gap-3">{data.intake.map(record=><li key={record.id} className="rounded-7 border border-drawer-line bg-paper p-card-padding">
            <strong className="text-12">{record.source} · {record.kind} · {record.status}</strong>
            <p className="text-11 leading-body">{record.detail}</p>
            {record.queuedAt&&<p className="text-10 text-muted">Queued <time dateTime={record.queuedAt}>{new Date(record.queuedAt).toLocaleString()}</time></p>}
        </li>)}</ul>:<p className="text-12">No permitted collection tasks recorded.</p>}
    </section>;
}
