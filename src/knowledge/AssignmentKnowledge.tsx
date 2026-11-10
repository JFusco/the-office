import { useEffect, useRef, useState } from 'react';
import type { KnowledgeLookupResponse } from '../contracts/knowledge-lookups';
import { useKnowledgeView } from './useKnowledgeView';
import type { KnowledgeAssignment } from '../contracts/knowledge-assignment';
import { Button, summary } from '../ui';
import { EvidencePacket } from './content/EvidencePacket';
import { MarkdownBody } from './content/MarkdownBody';
import { OriginalText } from './content/KnowledgeDocument';
import { RecordedEvidence } from './content/RecordedEvidence';

function Lookup({ query, response }: { query: string; response: KnowledgeLookupResponse }) {
    return <section aria-label="Selected lookup" className="border-t border-drawer-line pt-4">
        <h5 className="font-heading text-15">Lookup {response.index}</h5>
        <p className="my-2 text-11 text-muted">{response.outcome} · <time dateTime={response.at}>{new Date(response.at).toLocaleString()}</time></p>
        <p className="my-3 break-words text-12">Query: {query}</p>
        <EvidencePacket text={response.text} selected={response.selected}/>
        <OriginalText text={response.text || 'No evidence available.'} label="Exact lookup response"/>
        <details className="mt-3"><summary className={summary}>Lookup receipt</summary><p className="mt-3 break-all text-10 text-muted">Response text SHA-256 {response.textSha256}</p><RecordedEvidence entries={response.selected}/></details>
    </section>;
}

export function AssignmentKnowledge({ project, id }: { project: string; id: string }) {
    const heading = useRef<HTMLHeadingElement>(null), [index, setIndex] = useState(0);
    useEffect(() => heading.current?.focus(), [id]);
    const { data, error } = useKnowledgeView<KnowledgeAssignment>(project, `assignment?id=${encodeURIComponent(id)}${index ? `&lookup=${index}` : ''}`);
    const suppliedText = data ? [data.supplied.lessonText, data.supplied.sourceEvidenceText].filter(Boolean).join('\n') : '';
    return <section aria-label="Assignment knowledge" className="my-5 rounded-7 border border-drawer-line bg-paper p-card-padding">
        <h3 ref={heading} tabIndex={-1} className="font-heading text-18">Assignment knowledge</h3>
        {error ? <p role="alert">{error}</p> : !data ? <p role="status">Loading exact knowledge records…</p> : <>
            <p className="my-3 text-11 text-muted">{data.stage}</p>
            <h4 className="my-3 font-heading text-15">Supplied at dispatch</h4>
            <p className="text-12 leading-relaxed text-muted">A formatted view of the recorded text. Inclusion does not establish application.</p>
            {data.supplied.lessonText && <div className="my-4"><h5 className="font-heading text-15">Advisory lessons</h5><MarkdownBody text={data.supplied.lessonText}/></div>}
            <h5 className="mt-5 font-heading text-15">Source evidence supplied</h5>
            <EvidencePacket text={data.supplied.sourceEvidenceText} selected={data.supplied.evidence}/>
            <OriginalText text={suppliedText || 'No matching lessons or source evidence supplied.'} label="Exact supplied text"/>
            <details className="mt-3"><summary className={summary}>Assignment receipt</summary><div className="mt-3 grid gap-2 break-all text-10 text-muted"><p>Assignment {data.id}</p><p>Supplied SHA-256 {data.supplied.suppliedTextSha256}</p></div><RecordedEvidence entries={data.supplied.evidence}/></details>
            <h4 className="my-5 font-heading text-15">Recorded lookups</h4>
            {data.lookupRecordingUnavailable && <p role="status" className="my-3 text-12 text-muted">Exact lookup recording is unavailable or incomplete. The original supplied record above is unchanged.</p>}
            {!data.lookups.length && <p className="text-12">No recorded lookups for this assignment.</p>}
            {data.lookups.length > 0 && <div role="group" className="mb-4 flex flex-wrap gap-2" aria-label="Recorded lookup pages">{data.lookups.map(record => <Button key={record.index} aria-pressed={record.index === index} onClick={() => setIndex(record.index)}>Lookup {record.index} · {record.outcome}</Button>)}</div>}
            {data.lookup && <Lookup {...data.lookup}/>}
            <h4 className="my-5 font-heading text-15">Accepted outcome citations</h4>
            {!data.outcomes.length && <p className="text-12">No accepted outcome citation is recorded. Application remains unknown.</p>}
            {data.outcomes.map(record => <div key={record.id} className="mb-3 text-12"><p>{record.stage} · {record.lessons.length} lesson revisions and {record.evidence.length} evidence identities cited by an accepted outcome.</p><details className="mt-3"><summary className={summary}>Accepted result receipt</summary><p className="my-2 break-all text-10 text-muted">Accepted result SHA-256 {record.resultSha256}</p></details></div>)}
        </>}
    </section>;
}
