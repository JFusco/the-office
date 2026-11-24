import {officeUrl,type OfficeSnapshot,type TicketJob} from '../shared';
import {Button,PanelTitle,Section,SectionTitle,TextLink,mutedCopy} from '../ui';
import {DrawerTopic} from '../office/drawer/DrawerTopic';
import {currentJob} from './timeline/ticket-progress';
import {TicketTimeline} from './timeline/TicketTimeline';
import {TicketHeading} from './TicketDetail';
import {pmQueueItems} from './pm-queue';
import {TimeBook} from '../timing/TimeBook';
function JobRecords({job, snapshot}: {job: TicketJob; snapshot: OfficeSnapshot}) {
  const artifacts = new Map<string, string>();
  const artifactUrl = (path: string) => officeUrl('/api/artifact?path=' + encodeURIComponent(path), snapshot.project?.id);
  for (const step of job.steps || []) {
    if (step.stage !== 'validate') continue;
    for (const evidence of step.result.evidence) {
      if (evidence.path) artifacts.set(artifactUrl(evidence.path), evidence.summary);
      else if (/^https:\/\//.test(evidence.url || '')) artifacts.set(evidence.url, evidence.summary);
    }
    if (step.result.qaRunDir) artifacts.set(artifactUrl(step.result.qaRunDir + '/report.json'), 'View full QA report');
  }
  return <>
    {job.prUrl && <Section><SectionTitle className="mb-3">Pull request</SectionTitle><TextLink href={job.prUrl} target="_blank" rel="noreferrer">PR #{job.pr}</TextLink></Section>}
    {artifacts.size > 0 && <Section><SectionTitle className="mb-3">Verification evidence</SectionTitle>
      <DrawerTopic title="Evidence"><ul className="space-y-2 text-11">{[...artifacts].map(([url, label]) =>
        <li key={url}><TextLink href={url} target="_blank" rel="noreferrer">{label}</TextLink></li>)}</ul></DrawerTopic>
    </Section>}
    <DrawerTopic title="Time"><TimeBook snapshot={snapshot} ticket={job.key}/></DrawerTopic>
  </>;
}
export function QueueTicketDetail({ticketKey,snapshot,reduced,onDiscuss}:{ticketKey:string;snapshot:OfficeSnapshot;reduced:boolean;onDiscuss:(key:string)=>void}){
  const queueTicket = pmQueueItems(snapshot).find(r=>r.project===snapshot.project?.id && r.key===ticketKey);
  const queueJob = currentJob(
    (snapshot.teamQueue || []).filter(row=>row.project===snapshot.project?.id).map(row=>row.job), ticketKey);
  const fallbackKey = queueJob?.key || queueTicket?.key;
  const issue = fallbackKey ? snapshot.github?.issues.find(item=>item.key===fallbackKey) : undefined;
  const fallbackTitle = queueTicket?.title || issue?.title ||
    snapshot.coordination?.listener.reviews.filter(review=>review.key===fallbackKey).at(-1)?.summary ||
    (queueJob?.pr ? 'PR #' + queueJob.pr + ' delivery' : fallbackKey);
  if(!fallbackKey) return <p className={mutedCopy}>This ticket is no longer in the queue.</p>;
  return <><TicketHeading ticket={fallbackKey} url={issue?.url || ''} label={issue ? 'View GitHub issue' : ''}/><PanelTitle>{fallbackTitle}</PanelTitle>
    <TicketTimeline reduced={reduced} snapshot={snapshot} ticket={{key:fallbackKey}} job={queueJob}/>
    {queueJob && <><JobRecords job={queueJob} snapshot={snapshot}/><Button full onClick={()=>onDiscuss(fallbackKey)}>Discuss {fallbackKey}</Button></>}</>;
}
