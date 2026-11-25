import { officeUrl, type OfficeSnapshot, type TicketJob } from '../shared';
import { Section, SectionTitle, TextLink } from '../ui';
import { currentJob } from './timeline/ticket-progress';
import { Link } from './TicketDetail';
import { pmQueueItems } from './pm-queue';

export function queueTicketRecord(snapshot: OfficeSnapshot, key: string) {
  const project = snapshot.project?.id;
  const row = pmQueueItems(snapshot).find(row => row.project === project && row.key === key);
  const job = currentJob((snapshot.teamQueue || []).filter(row => row.project === project).map(row => row.job), key);
  if (!row && !job) return undefined;

  const issue = snapshot.github?.issues.find(item => item.key === key);
  const title = row?.title || issue?.title ||
    snapshot.coordination?.listener.reviews.filter(review => review.key === key).at(-1)?.summary ||
    (job?.pr ? 'PR #' + job.pr + ' delivery' : key);
  return { title, issue, job };
}

export function queueValidationArtifacts(job: TicketJob, project?: string) {
  const artifacts = new Map<string, string>();
  const artifactUrl = (path: string) => officeUrl('/api/artifact?path=' + encodeURIComponent(path), project);
  for (const step of job.steps || []) {
    if (step.stage !== 'validate') continue;
    for (const evidence of step.result.evidence) {
      if (evidence.path) artifacts.set(artifactUrl(evidence.path), evidence.summary);
      else if (/^https:\/\//.test(evidence.url || '')) artifacts.set(evidence.url, evidence.summary);
    }
    if (step.result.qaRunDir) artifacts.set(artifactUrl(step.result.qaRunDir + '/report.json'), 'View full QA report');
  }
  return artifacts;
}

export function QueueEvidenceLinks({ artifacts }: { artifacts: Map<string, string> }) {
  return <ul className="space-y-2 text-11">{[...artifacts].map(([url, label]) =>
    <li key={url}><TextLink href={url} target="_blank" rel="noreferrer">{label}</TextLink></li>
  )}</ul>;
}

export function QueueTicketDetail({ job }: { job?: TicketJob }) {
  if (!job?.prUrl) return null;
  return <Section>
    <SectionTitle className="mb-3">Pull request</SectionTitle>
    <Link url={job.prUrl}>PR #{job.pr}</Link>
  </Section>;
}
