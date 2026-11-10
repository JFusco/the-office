import { useState } from 'react';
import type { KnowledgeCapturePage } from '../contracts/knowledge-captures';
import { Button,Tag,TextLink } from '../ui';
import { useKnowledgeView } from './useKnowledgeView';
import { CaptureReviewDetail } from './CaptureReviewDetail';

export function CaptureReviews({project}:{project:string}) {
    const [after,setAfter]=useState(''),[history,setHistory]=useState<string[]>([]),[selected,setSelected]=useState('');
    const {data,error,refresh}=useKnowledgeView<KnowledgeCapturePage>(project,`captures?after=${encodeURIComponent(after)}`);
    return <section aria-label="Brain capture reviews" className="my-6 grid gap-3">
        <h3 className="font-heading text-18">Brain capture reviews</h3>
        <p className="text-11 leading-body text-muted">Follow private inbox captures through Brain’s review. Inbox capture, acceptance and verified note content are separate steps.</p>
        <Button className="justify-self-start" onClick={()=>{setAfter('');setHistory([]);setSelected('');refresh();}}>Refresh capture reviews</Button>
        {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Loading current Brain receipts…</p>}
        {data?.captures.map(capture=><article key={capture.detailCursor} aria-label={`Capture ${capture.requestId}`} className="rounded-7 border border-drawer-line bg-paper p-5">
            <div className="flex flex-wrap items-center gap-3"><h4 className="font-heading text-15">{capture.source}</h4><Tag tone={capture.reviewStatus==='accepted'?'passed':capture.reviewStatus==='pending'?'waiting':'neutral'}>{capture.reviewStatus}</Tag></div>
            <p className="mt-2 text-11 break-all">Request {capture.requestId}</p><p className="text-11 text-muted">Office intake: {capture.intakeStatus}</p>
            {capture.acceptance&&<p className="my-2 text-11"><TextLink href={capture.acceptance.url} target="_blank" rel="noreferrer">Brain acceptance PR #{capture.acceptance.pr}</TextLink></p>}
            {capture.reviewStatus==='accepted'&&(capture.lineage==='mapped'?<Button className="mt-2" onClick={()=>setSelected(capture.detailCursor)}>Inspect {capture.noteCount} recorded note mappings</Button>:<p className="mt-2 text-11">Historical note mappings unknown. Acceptance does not identify individual published notes.</p>)}
            {capture.reviewStatus==='unavailable'&&<p className="mt-2 text-11">Current review unavailable; no outcome is inferred.</p>}
        </article>)}
        {data&&!data.captures.length&&<p className="text-12">No permitted capture requests on this page.</p>}
        <div className="flex gap-3">{history.length>0&&<Button onClick={()=>{setAfter(history.at(-1)!);setHistory(history.slice(0,-1));setSelected('');}}>Previous captures</Button>}{data?.next&&<Button onClick={()=>{setHistory([...history,after]);setAfter(data.next!);setSelected('');}}>Next captures</Button>}</div>
        {data&&<div className="text-11 leading-body text-muted">{data.limitations.map(text=><p key={text}>{text}</p>)}</div>}
        {selected&&<CaptureReviewDetail key={selected} project={project} cursor={selected}/>}
    </section>;
}
