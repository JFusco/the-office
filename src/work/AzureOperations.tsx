import { pipelineHeadline, pipelineRows } from './pipeline-view';
import { PanelHeader } from '../ui/PanelHeader';
import { ExternalLink, GitPullRequest, AlertCircle } from '../ui/icons';
import {
  Button,
  Card,
  Count,
  Notice,
  Section,
  SectionTitle,
  StatusDot,
  Tag,
  TextLink,
  cx,
  mutedCopy,
  noticeIcon,
} from '../ui';
import { PipelineList } from './PipelineList';
import { PipelineTiming } from '../timing/TimeBook';
import { DrawerTopic } from '../office/drawer/DrawerTopic';
import type { InspectorProps } from '../office/drawer/inspector-props';
const pipelineHeader = 'flex flex-wrap items-start justify-between gap-2.5';
function Link({ url, children }: { url: string; children: React.ReactNode }) {
  return /^https:\/\//.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url) ? (
    <TextLink href={url} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={12} />
    </TextLink>
  ) : (
    <span>{children}</span>
  );
}
export function AzureOperations({ snapshot, act, busy }: InspectorProps) {
  return (
    <>
      <PanelHeader icon={<GitPullRequest size={26} />} tone="azure">
        Azure pipelines
      </PanelHeader>
      <p className={mutedCopy}>
        Pull requests, builds and deployments.
      </p>
      <Button disabled={busy || snapshot.mode === 'demo'} onClick={() => act('refresh-azure')}>
        Refresh Azure
      </Button>
      <Tag tone={snapshot.azure.error ? 'blocked' : 'waiting'}>
        {snapshot.azure.observedAt
          ? `Observed ${new Date(snapshot.azure.observedAt).toLocaleTimeString()}`
          : 'Waiting for the first observation'}
      </Tag>
      {snapshot.azure.observedAt && Date.now() - Date.parse(snapshot.azure.observedAt) > 150000 ? (
        <Notice className="mt-5">
          These results may be out of date. Refresh Azure for the latest status.
        </Notice>
      ) : null}
      {snapshot.azure.error ? (
        <Notice className="mt-5">
          <AlertCircle className={noticeIcon} size={16} />
          <span>{snapshot.azure.error}</span>
        </Notice>
      ) : null}
      <DrawerTopic
        title="Pipelines and runs"
        detail={pipelineHeadline(pipelineRows(snapshot.pipelines?.items || [], Date.now()))}
      >
        <PipelineList pipelines={snapshot.pipelines} />
        <Section>
          <SectionTitle className="mb-4">
            Recent pipelines <Count>{snapshot.azure.builds.length}</Count>
          </SectionTitle>
          {snapshot.azure.builds.slice(0, 8).map((b) => (
            <Card key={b.id}>
              <div className={pipelineHeader}>
                <strong className="text-11 leading-relaxed">{b.name}</strong>
                <Tag tone={b.result === 'failed' ? 'blocked' : b.result === 'succeeded' ? 'passed' : 'working'}>
                  {b.result || b.status}
                </Tag>
              </div>
              <div className="self-start text-10">
                <Link url={b.url}>Build {b.id}</Link>
              </div>
              <small className="block text-8 leading-relaxed text-card-detail">
                {b.branch.replace('refs/heads/', '')}
              </small>
              <PipelineTiming build={b} anchor={snapshot.liveAnchor} />
            </Card>
          ))}
          {!snapshot.azure.builds.length ? <p className={mutedCopy}>Builds appear after Azure is connected.</p> : null}
        </Section>
      </DrawerTopic>
      <DrawerTopic title="Pull requests" detail={snapshot.azure.prs.length}>
        <Section>
          <SectionTitle className="mb-4">Pull requests</SectionTitle>
          {snapshot.azure.prs.slice(0, 10).map((p) => (
            <Card key={p.id}>
              <div className={pipelineHeader}>
                <Link url={p.url}>PR {p.id}</Link>
                <Tag>{p.draft ? 'Draft' : p.status}</Tag>
              </div>
              <h4 className="text-11 leading-relaxed font-semibold">{p.title}</h4>
              <small className="block text-8 leading-relaxed text-card-detail">
                {p.source.replace('refs/heads/', '')} → {p.target.replace('refs/heads/', '')}
              </small>
              {p.policies.map((x, i) => (
                <div className="flex items-start gap-2 text-9 text-pipeline-stage" key={i}>
                  <StatusDot
                    status={x.status === 'rejected' ? 'blocked' : x.status === 'approved' ? 'idle' : 'waiting'}
                    className="mt-0.75"
                  />
                  {x.name}: {x.status}
                </div>
              ))}
            </Card>
          ))}
        </Section>
      </DrawerTopic>
      <DrawerTopic title="Environments" detail={snapshot.azure.deployed.length}>
        <Section>
          <SectionTitle className="mb-4">Running environments</SectionTitle>
          {snapshot.azure.deployed.length ? (
            snapshot.azure.deployed.map((d) => (
              <Card key={d.environment}>
                <strong className="text-11 leading-relaxed">{d.environment}</strong>
                <div className="self-start text-10">
                  <Link url={d.url}>Open application</Link>
                </div>
              </Card>
            ))
          ) : (
            <p className={mutedCopy}>
              Running versions have not been verified. A successful pipeline alone does not establish the deployed
              version.
            </p>
          )}
        </Section>
      </DrawerTopic>
      <p className={cx(mutedCopy, 'mt-4')}>
        The team monitors merges and deployments. Human release controls remain in Azure.
      </p>
    </>
  );
}
