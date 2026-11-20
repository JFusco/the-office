import type { PipelineWatch } from '../contracts/pipelines';
import { Count, Notice, Section, SectionTitle, StatusDot, Tag, TextLink, mutedCopy } from '../ui';
import { pipelineHeadline, pipelineRows } from './pipeline-view';

/** Every pipeline or workflow on one line each: name, how its newest run ended, where and when. */
export function PipelineList({ pipelines, title = 'Pipelines', now = Date.now() }: { pipelines?: PipelineWatch; title?: string; now?: number }) {
    const rows = pipelineRows(pipelines?.items || [], now);
    return <Section data-pipelines>
        <SectionTitle className="mb-2">{title} <Count>{rows.length}</Count></SectionTitle>
        {pipelines?.error ? <Notice className="mb-3">{pipelines.error}</Notice> : null}
        {rows.length ? <p className={mutedCopy}>{pipelineHeadline(rows)}</p> : <p className={mutedCopy}>Pipelines appear after the first read.</p>}
        {rows.length ? <ul className="mt-3 flex flex-col">{rows.map(row => <li key={row.id} className="flex items-center justify-between gap-3 border-b border-row-rule py-2.5">
            <span className="flex min-w-0 items-start gap-2"><StatusDot status={row.tone === 'neutral' ? undefined : row.tone} className="mt-1.5" />
                <span className="min-w-0"><TextLink className="text-11" href={row.url} target="_blank" rel="noreferrer">{row.name}</TextLink>
                    {row.detail ? <small className="block text-8 leading-relaxed text-card-detail">{row.detail}</small> : null}</span></span>
            <Tag tone={row.tone}>{row.label}</Tag>
        </li>)}</ul> : null}
    </Section>;
}
