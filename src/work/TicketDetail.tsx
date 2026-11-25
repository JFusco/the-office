import { QAResultsCard } from './QAResultsCard';
import { withoutIdentifiers } from '../office/without-identifiers';
import { prerequisiteKeys } from './pm-queue';
import { DependencyNotice } from './DependencyNotice';
import { WorkSummary } from './WorkSummary';
import { Check, ChevronRight, ExternalLink, FileText, GitPullRequest, AlertCircle, Camera } from '../ui/icons';
import {
  Button,
  Card,
  Notice,
  Section,
  SectionTitle,
  Tag,
  TextLink,
  cx,
  eyebrow,
  interactive,
  mutedCopy,
  noticeIcon,
} from '../ui';
import { STAGES, STAGE_LABELS, type OfficeSnapshot, type Ticket, type Evidence, type TicketJob } from '../shared';
import { ApproachSummary } from './ApproachSummary';
import { DrawerTopic } from '../office/drawer/DrawerTopic';

const STEP = {
  current: 'font-semibold text-step-current-ink',
  passed: 'text-step-passed-ink',
  skipped: 'text-step-skipped-ink',
  pending: 'text-step-ink',
};
const STEP_MARK = {
  current: 'border-step-current-line bg-step-current inset-ring-4 inset-ring-step-current-ring',
  passed: 'border-step-passed-line bg-step-passed text-step-passed-mark',
  skipped: 'border-dashed border-step-line bg-step',
  pending: 'border-step-line bg-step',
};
export function Link({ url, children }: { url: string; children: React.ReactNode }) {
  return /^https:\/\//.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(url) ? (
    <TextLink href={url} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={12} />
    </TextLink>
  ) : (
    <span>{children}</span>
  );
}
function EvidenceCard({ e }: { e: Evidence }) {
  return (
    <Card tone="finding" className="mt-2.5">
      <div className={cx(eyebrow, 'text-9')}>
        {e.kind} · {e.environment || 'environment unrecorded'}
      </div>
      <p className="text-11 leading-body text-card-copy">{e.summary}</p>
      {e.kind === 'screenshot' && e.path ? (
        <a
          className={cx('block self-start rounded-4', interactive)}
          href={`/api/artifact?path=${encodeURIComponent(e.path)}`}
          target="_blank"
          rel="noreferrer"
        >
          <img
            className="max-w-full rounded-4"
            alt={e.summary}
            src={`/api/artifact?path=${encodeURIComponent(e.path)}`}
            loading="lazy"
          />
        </a>
      ) : null}
      <small className="block text-11 leading-relaxed text-evidence-detail">
        {e.observedAt ? new Date(e.observedAt).toLocaleString() : 'Time unavailable'}
      </small>
    </Card>
  );
}
export function TicketHeading({
  ticket,
  url,
  label,
  className,
}: {
  ticket: string;
  url: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center justify-between text-10 text-ticket-heading', className)} data-ticket-heading>
      <span>{ticket}</span>
      <span className="text-9">
        <Link url={url}>{label}</Link>
      </span>
    </div>
  );
}
export function GitHubJobTopics({ job }: { job: TicketJob }) {
  const steps = job.steps ?? [];
  return <>
    {job.approach && (
      <DrawerTopic title="Approach and decisions">
        <ApproachSummary approach={job.approach} decisions={job.decisions} />
      </DrawerTopic>
    )}
    <DrawerTopic title="Delivery history" detail={steps.length}>
      {steps.map((step, i) => (
        <Card as="article" key={i}>
          <strong className="text-11 leading-relaxed">
            {step.stage} · {step.stage === 'validate' && job.qaGateRefusal?.step === i ? 'QA evidence gate refused' : step.result.outcome}
          </strong>
          <p className="leading-relaxed">{step.result.summary}</p>
        </Card>
      ))}
    </DrawerTopic>
  </>;
}

export function TicketDetail({
  ticket: t,
  snapshot,
  act,
  onOpen,
  job,
}: {
  ticket: Ticket;
  job?: TicketJob;
  snapshot: OfficeSnapshot;
  act: (action: string, key?: string) => void;
  onOpen: (key: string) => void;
}) {
  const queued = snapshot.deliveryQueue?.find((r) => r.key === t.key && ['queued', 'working'].includes(r.status));
  const review = snapshot.coordination?.listener.reviews
    .slice()
    .reverse()
    .find((r) => r.key === t.key);
  const dependency = (
    <DependencyNotice
      keys={review ? prerequisiteKeys(review) : []}
      snapshot={snapshot}
      onOpen={(_project, key) => onOpen(key)}
    />
  );
  const assigned = snapshot.coordination?.listener.assigned.some((i) => i.key === t.key);
  const startAssigned = (
    <Button
      variant="primary"
      disabled={
        snapshot.mode === 'demo' ||
        snapshot.paused ||
        !assigned ||
        !!queued ||
        !!job ||
        (!!review && prerequisiteKeys(review).length > 0) ||
        (!!review && ['owned', 'blocked', 'interrupted'].includes(review.status)) ||
        (!!review?.workRequested && ['queued', 'working'].includes(review.status))
      }
      onClick={() => act('start-assigned', t.key)}
    >
      Start ticket <ChevronRight size={15} />
    </Button>
  );
  if (snapshot.project?.provider === 'github')
    return (
      <>
        <Tag className="self-start">{t.status}</Tag>
        {snapshot.github?.board ? (
          <p className={mutedCopy}>
            Project lane:{' '}
            {snapshot.github.board.items.find(
              (i) => i.number === Number(t.key.slice(3)) && i.repository === snapshot.project?.repository,
            )?.status || 'Not on board'}
            {snapshot.github.board.error ? ' · last observation unavailable or stale' : ''}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">{startAssigned}</div>
        {dependency}
        {review ? (
          <>
            <Tag className="self-start">{review.status}</Tag>
            <WorkSummary detail={withoutIdentifiers(review.detail)} flush />
          </>
        ) : null}
        {job ? (
          <Section>
            <SectionTitle className="mb-4">Office delivery · {job.status}</SectionTitle>
            
            <WorkSummary detail={withoutIdentifiers(job.detail)} flush />
            {job.prUrl ? <Link url={job.prUrl}>PR #{job.pr}</Link> : null}
            {job.stage === 'lead-pr' && ['blocked', 'interrupted', 'watching'].includes(job.status) ? (
              <Button className="mt-5" onClick={() => act('review-pr', t.key)}>
                Recheck PR
              </Button>
            ) : null}

          </Section>
        ) : null}
      </>
    );
  const steps = STAGES.filter((s) => !['repair', 'repair-review', 'retest', 'staging-qa', 'complete'].includes(s));
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Tag>{t.type}</Tag>
        <Tag tone={t.activity}>Jira status · {t.status}</Tag>
        <Tag>{STAGE_LABELS[t.stage]}</Tag>
      </div>
      {t.blocker ? (
        <Notice className="mt-5">
          <AlertCircle className={noticeIcon} size={16} />
          <span>{t.blocker}</span>
        </Notice>
      ) : null}
      {snapshot.mode === 'demo' ? (
        <Notice tone="tour" className="mt-5">
          This is an illustrative ticket. No Jira, code, browser or Azure action is running.
        </Notice>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-2 empty:hidden">
          {queued ? <Tag>{queued.status === 'queued' ? 'Implementation queued' : 'Delivery in progress'}</Tag> : null}
          {t.stage === 'mailbox' ? startAssigned : null}
          {t.activity === 'blocked' && t.pilot ? (
            <Button disabled={!!queued} onClick={() => act('resume-ticket', t.key)}>
              Check & resume
            </Button>
          ) : null}
        </div>
      )}
      {dependency}
      {t.approach && (
        <DrawerTopic title="Approach and decisions">
          <ApproachSummary approach={t.approach} decisions={t.decisions} />
        </DrawerTopic>
      )}
      <DrawerTopic title="Delivery history">
        <Section>
          <SectionTitle className="mb-4">Delivery path</SectionTitle>
          <ol>
            {steps.map((stage, i) => {
              const state =
                t.stage === stage
                  ? 'current'
                  : t.results[stage]?.outcome === 'passed'
                    ? 'passed'
                    : t.skippedStages?.[stage]
                      ? 'skipped'
                      : 'pending';
              const mark =
                t.results[stage]?.outcome === 'passed' ? 'passed' : t.skippedStages?.[stage] ? 'skipped' : null;
              return (
                <li
                  key={stage}
                  aria-current={t.stage === stage ? 'step' : undefined}
                  data-stage-state={state}
                  className={cx('relative flex gap-3 pb-4 text-10 leading-normal', STEP[state])}
                >
                  {i < steps.length - 1 ? (
                    <span aria-hidden="true" className="absolute top-3.75 bottom-0 left-1.75 w-px bg-step-rule" />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={cx(
                      'z-1 grid size-4 shrink-0 place-items-center rounded-full border',
                      STEP_MARK[state === 'current' ? 'current' : mark || 'pending'],
                    )}
                  >
                    {mark === 'passed' ? <Check size={11} /> : mark === 'skipped' ? '–' : null}
                  </span>
                  <div>
                    {STAGE_LABELS[stage]}
                    {state === 'current' ? (
                      <span className="sr-only"> (current stage)</span>
                    ) : mark === 'passed' ? (
                      <span className="sr-only"> (passed)</span>
                    ) : null}
                    {t.results[stage] ? (
                      <small className="mt-1 block text-9 leading-relaxed font-regular text-step-detail">
                        {t.results[stage]?.summary}
                      </small>
                    ) : t.skippedStages?.[stage] ? (
                      <small
                        className="mt-1 block text-9 leading-relaxed font-regular text-step-detail"
                        title={t.skippedStages[stage]}
                      >
                        Not needed for this task
                      </small>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>
      </DrawerTopic>
      {t.commit || t.prId || t.previewUrl ? (
        <DrawerTopic title="Candidate">
          <Section>
            <SectionTitle className="mb-4">Candidate</SectionTitle>
            <dl className="my-2.5 grid grid-cols-[90px_1fr] gap-2.5 text-10 leading-relaxed">
              <dt className="text-dl-term">Branch</dt>
              <dd className="break-all">{t.branch || 'Not created'}</dd>
              <dt className="text-dl-term">Fix cycles</dt>
              <dd className="break-all">{t.attempt} · maximum 2 per finding</dd>
              {t.previewUrl ? (
                <>
                  <dt className="text-dl-term">Application</dt>
                  <dd className="break-all">
                    <Link url={t.previewUrl}>Open candidate</Link>
                  </dd>
                </>
              ) : null}
            </dl>
            {t.prId ? (
              <Link
                url={
                  snapshot.azure.prs.find((pr) => pr.id === t.prId)?.url ||
                  t.results['draft-pr']?.evidence.find((e) => e.kind === 'pr')?.url ||
                  '#'
                }
              >
                <GitPullRequest size={14} /> PR {t.prId}
              </Link>
            ) : null}
          </Section>
        </DrawerTopic>
      ) : null}
      {t.findings.length ? (
        <DrawerTopic title="Review findings" detail={t.findings.length}>
          <Section>
            <SectionTitle className="mb-4">QA & review findings</SectionTitle>
            {t.findings.map((f) => (
              <Card key={f.id} tone="finding" className="mt-2.5">
                <Tag className="self-start" tone={f.status === 'verified' ? 'passed' : 'blocked'}>
                  {f.id} · {f.status}
                </Tag>
                <h4 className="text-13 leading-relaxed font-semibold">{f.summary}</h4>
                <p className="text-11 leading-body text-card-copy">
                  <b className="font-medium">Expected:</b> {f.expected}
                </p>
                <p className="text-11 leading-body text-card-copy">
                  <b className="font-medium">Observed:</b> {f.actual}
                </p>
              </Card>
            ))}
          </Section>
        </DrawerTopic>
      ) : null}
    </>
  );
}

export function TicketEvidence({ ticket, job, github }: { ticket: Ticket; job?: TicketJob; github: boolean }) {
  return <>
    <QAResultsCard ticket={ticket} job={github ? job : undefined} />
    {!github && (ticket.evidence.length ? (
      <Section>
        <SectionTitle className="mb-4">
          <Camera size={14} /> Verification evidence
        </SectionTitle>
        {ticket.evidence.map((e, i) => (
          <EvidenceCard key={`${e.id}-${i}`} e={e} />
        ))}
      </Section>
    ) : (
      <Section className="flex gap-3 text-11 text-empty">
        <FileText className="shrink-0" size={22} />
        <p className="leading-body">
          Evidence will arrive here as the team works. A passed stage needs saved, current-candidate proof.
        </p>
      </Section>
    ))}
  </>;
}
