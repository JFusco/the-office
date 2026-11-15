import type { StageResult, Ticket, TicketJob } from '../shared';
import { Card, Section, SectionTitle, Tag, TextLink, mutedCopy, summary } from '../ui';
import { qaResults, qaStatus, QA_STAGES } from './qa-results';
const artifact = (path: string) => `/api/artifact?path=${encodeURIComponent(path)}`;
function Report({result,stage,head,blocker}:{result:StageResult;stage:string;head:string;blocker?:string}) {
    const qa=result.qa,status=qaStatus(result,head,blocker);
    return <Card tone="finding" className="mt-3" data-qa-result>
        <div className="flex flex-wrap items-center gap-2"><Tag tone={status==='Passed'?'passed':status==='Failed'||status==='Blocked'||status==='Setup needed'?'blocked':'waiting'}>{status}</Tag><span className="text-11">{stage}</span></div>
        <p className="text-11 leading-body">{result.summary}</p>
        <p className="text-11 break-all">Build tested: {result.commit||'Not verified'}</p>
        {blocker?<p className="text-11 leading-body">Acceptance blocked: {blocker}</p>:null}
        {qa?<><p className="text-11 leading-body"><b>Setup:</b> {qa.setup.summary}</p><p className="text-11"><b>Next:</b> {qa.setup.status==='blocked'?qa.setup.nextAction:qa.nextAction} <b>Owner:</b> {qa.setup.status==='blocked'?qa.setup.owner:qa.nextOwner}</p>
        <ul className="my-2 space-y-3" aria-label="QA checklist">{qa.cases.map(c=><li key={c.id} className="text-11 leading-body"><strong>{c.status==='not-tested'?'Not tested':c.status} · {c.check}</strong><p>Expected: {c.expected}</p><p>Observed: {c.observed}</p></li>)}</ul>
        {!qa.cases.length?<p className={mutedCopy}>Feature checks have not run.</p>:null}</>:<p className={mutedCopy}>Earlier QA format. Its saved result and evidence are retained; a detailed checklist was not recorded here. {result.blocker||'No additional next action recorded.'}</p>}
        {result.findings.length?<ul aria-label="QA findings">{result.findings.map(f=><li key={f.id} className="my-2 text-11"><b>{f.status} · {f.summary}</b><p>Expected: {f.expected}</p><p>Observed: {f.actual}</p></li>)}</ul>:null}
        {result.evidence.map(e=><div key={e.id} className="text-11">{e.path?<TextLink href={artifact(e.path)} target="_blank" rel="noreferrer">{e.kind==='screenshot'?'Screenshot':'Evidence'}: {e.summary}</TextLink>:<p>{e.summary}</p>}{e.kind==='screenshot'&&e.path?<img src={artifact(e.path)} alt={e.summary} loading="lazy" className="mt-2 max-w-full rounded-4"/>:null}</div>)}
        {result.qaRunDir?<TextLink href={artifact(`${result.qaRunDir}/report.json`)} target="_blank" rel="noreferrer">View full report</TextLink>:null}
    </Card>;
}
export function QAResultsCard({ticket,job}:{ticket:Ticket;job?:TicketJob}) {
    const results=qaResults(ticket,job), latest=results.at(-1), head=job?.head||ticket.commit;
    const running=job?job.stage==='validate'&&job.status==='working':QA_STAGES.includes(ticket.stage)&&ticket.activity==='working';
    const blocker=job?job.stage==='validate'&&['blocked','interrupted'].includes(job.status)?job.detail:'':QA_STAGES.includes(ticket.stage)&&ticket.activity==='blocked'?ticket.blocker:'';
    return <Section data-qa-results id="qa-results"><SectionTitle className="mb-3">QA Results</SectionTitle>
        {running?<p className={mutedCopy}>QA running · Riley is verifying the current build.</p>:null}
        {latest?<Report result={latest.result} stage={latest.stage} head={head} blocker={blocker}/>:<p className={mutedCopy}>{blocker?`Setup or QA blocked: ${blocker}`:'QA has not run. The team’s selected checks and reason appear in Team approach.'}</p>}
        {results.length>1?<details className="mt-3 text-11"><summary className={summary}>Earlier QA attempts ({results.length-1})</summary>{results.slice(0,-1).reverse().map((r,i)=><Report key={i} result={r.result} stage={r.stage} head={head}/>)}</details>:null}
    </Section>;
}
