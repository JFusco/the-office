import type { ReactNode } from 'react';
import { Tag, summary } from '../../ui';
import { documentText } from './document';
import { MarkdownBody } from './MarkdownBody';

export function OriginalText({ text, label = 'View original Markdown' }: { text: string; label?: string }) {
    return <details className="mt-4 border-t border-drawer-line pt-3"><summary className={summary}>{label}</summary><pre className="mt-3 whitespace-pre-wrap break-words font-mono text-11 leading-relaxed">{text}</pre></details>;
}

export function KnowledgeDocument({ text, baseUrl, details, original = true }: { text: string; baseUrl?: string; details?: ReactNode; original?: boolean }) {
    const { body, metadata, frontmatter } = documentText(text);
    return <div>
        <dl className="my-3 flex flex-wrap gap-x-5 gap-y-2 text-11 text-muted">{[
            ['Domain', metadata.domain], ['Reviewed', metadata.reviewed_at || metadata.evidence_date],
            ['Status', metadata.status], ['Versions', metadata.versions?.join(', ')],
        ].map(([label, value]) => value && <div key={label} className="flex items-center gap-2"><dt>{label}</dt><dd><Tag>{value}</Tag></dd></div>)}</dl>
        {metadata.applicability && <p className="my-3 text-12 leading-relaxed text-muted">{metadata.applicability}</p>}
        {frontmatter === 'incomplete' && <p className="my-3 text-12 text-muted">This excerpt ends inside document metadata. Guidance text was not included in this recorded section.</p>}
        {frontmatter === 'invalid' && <p className="my-3 text-12 text-muted">Document metadata could not be separated. The supplied content remains available below.</p>}
        {body && <MarkdownBody text={metadata.title && body.startsWith(`# ${metadata.title}\n`) ? body.slice(metadata.title.length + 3).trimStart() : body} baseUrl={baseUrl}/>}
        {!body && frontmatter === 'parsed' && <p className="my-3 text-12 text-muted">This section contains metadata only.</p>}
        {(details || metadata.provenance) && <details className="mt-4 border-t border-drawer-line pt-3"><summary className={summary}>Source details</summary><div className="mt-3 grid gap-3 break-words text-11 text-muted">{details}{metadata.provenance && <p>Provenance: {metadata.provenance}</p>}</div></details>}
        {original && <OriginalText text={text}/>}
    </div>;
}
