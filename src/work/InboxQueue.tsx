import { DrawerTopic, useDrawerReturnRow } from '../office/drawer/DrawerTopic';
import { prerequisiteKeys } from './pm-queue';
import type { OfficeSnapshot } from '../shared';
import { ticketUpdates } from './TeamUpdates';
import { Count, Section, SectionTitle, cx, interactive, mutedCopy } from '../ui';

const card = cx('my-2.5 flex w-full flex-col gap-2 rounded-8 border border-secondary-line bg-secondary p-4 text-left hover:border-control-hover-line hover:bg-secondary-hover', interactive);
const meta = 'block text-11 leading-relaxed text-muted';

export function InboxQueue({ snapshot, onOpen }: { snapshot: OfficeSnapshot; onOpen: (key: string) => void }) {
  const { opened, remember, release } = useDrawerReturnRow<
    { group: 'active'; key: string; row: ReturnType<typeof ticketUpdates>[number] } |
    { group: 'intake' | 'ready' | 'waiting'; key: string }
  >();
  const coordination = snapshot.coordination;
  const latest = [...new Map((coordination?.listener.reviews || []).map(review => [review.key, review])).values()];
  const queued = latest.filter(review => review.status === 'queued').sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
  const updates = ticketUpdates(snapshot);
  const active = updates.filter(row => ['working', 'watching', 'retrying'].includes(row.status));
  const retainedActive = opened?.group === 'active' && !active.some(row => row.key === opened.key)
    ? updates.find(row => row.key === opened.key) ?? opened.row
    : undefined;
  const activeRows = retainedActive ? [...active, retainedActive] : active;
  const remainingWorking = latest.filter(review => review.status === 'working' && !active.some(row => row.key === review.key));
  const intake = [...remainingWorking, ...queued];
  const retainedIntake = opened?.group === 'intake' && !intake.some(review => review.key === opened.key)
    ? latest.find(review => review.key === opened.key)
    : undefined;
  const intakeRows = retainedIntake ? [...intake, retainedIntake] : intake;

  const assigned = coordination?.listener.assigned || [];
  const pickupStatus = coordination?.pickup?.status || (snapshot.project?.provider === 'azure' ? 'To Do' : 'Ready');
  const ready = assigned.filter(item => (item.pickupStatus ?? item.status) === pickupStatus &&
    !coordination?.jobs?.some(job => job.key === item.key && job.status !== 'cancelled') &&
    !latest.some(review => review.key === item.key && ['queued', 'working'].includes(review.status)));
  const waiting = assigned.filter(item => (item.pickupStatus ?? item.status) !== pickupStatus &&
    !coordination?.jobs?.some(job => job.key === item.key && !['cancelled', 'completed'].includes(job.status)));
  const readyRows = assigned.filter(item => ready.includes(item) || (opened?.group === 'ready' && opened.key === item.key));
  const waitingRows = assigned.filter(item => waiting.includes(item) || (opened?.group === 'waiting' && opened.key === item.key));

  return <>
    <DrawerTopic title="In progress" detail={active.length}>
      <Section aria-label="In progress">
        <SectionTitle className="mb-4">In progress <Count>{active.length}</Count></SectionTitle>
        {activeRows.map(row => <button type="button" className={card} key={row.key} onBlur={release} onClick={event => {
          remember({ group: 'active', key: row.key, row }, event.currentTarget);
          onOpen(row.key);
        }}>
          <small className={meta}>{row.key} · {row.phase}</small>
          <strong className="text-13 leading-normal">{row.title}</strong>
          <span className="text-12 leading-normal">{row.summary}</span>
          <span className="text-12 leading-normal">Next: {row.next}</span>
          <small className={meta}>Last update {row.at ? new Date(row.at).toLocaleTimeString() : 'unavailable'}{snapshot.serverTime && Date.now()-Date.parse(snapshot.serverTime)>35000 ? ' · Connection stale; progress unconfirmed' : ''}</small>
        </button>)}
        {!active.length && <p className={mutedCopy}>No delivery or intake worker currently active in this project.</p>}
      </Section>
    </DrawerTopic>
    <DrawerTopic title="Queued for Morgan" detail={intake.length}>
      <Section aria-label="Queued for Morgan">
        <SectionTitle className="mb-4">Queued for Morgan <Count>{intake.length}</Count></SectionTitle>
        {intakeRows.map(review => <button type="button" className={card} key={review.key} onBlur={release} onClick={event => {
          remember({ group: 'intake', key: review.key }, event.currentTarget);
          onOpen(review.key);
        }}>
          <small className={meta}>{review.status === 'queued' ? `#${queued.indexOf(review) + 1} in this project’s intake queue` : 'With Morgan now'} · {review.key}</small>
          <strong className="text-13 leading-normal">{review.summary}</strong>
          <span className="text-12 leading-normal">{review.status !== 'queued' ? 'Checking ownership and the next delivery step.' :
            review.workRequested ? 'Next: Morgan checks ownership, then queues eligible team work.' : 'Next: Morgan investigates and reports her recommendation.'}</span>
        </button>)}
        <p className={mutedCopy}>{intake.length ? 'Intake waits while the shared team finishes its current delivery.' : 'No tickets waiting for Morgan’s intake.'}</p>
      </Section>
    </DrawerTopic>
    <DrawerTopic title="Ready for pickup" detail={ready.length} available={ready.length > 0}>
      <Section aria-label="Ready assignments waiting">
        <SectionTitle className="mb-4">{pickupStatus} · waiting <Count>{ready.length}</Count></SectionTitle>
        {!ready.length && <p className={mutedCopy}>No assignments ready for pickup.</p>}
        {readyRows.map(item => {
          const review = latest.find(row => row.key === item.key);
          const dependencies = review ? prerequisiteKeys(review) : [];
          const next = dependencies.length
            ? `Waiting for ${dependencies.join(', ')}. Morgan rechecks this ticket after the prerequisite completes.`
            : review ? `Intake ${review.status}: ${review.detail.split('\n')[0]}` : 'Waiting for Morgan’s next eligibility check.';
          return <button type="button" className={card} key={item.key} onBlur={release} onClick={event => {
            remember({ group: 'ready', key: item.key }, event.currentTarget);
            onOpen(item.key);
          }}>
            <small className={meta}>{item.key} · {item.pickupStatus ?? item.status}</small>
            <strong className="text-13 leading-normal">{item.summary}</strong>
            <span className="text-12 leading-normal">{next}</span>
          </button>;
        })}
      </Section>
    </DrawerTopic>
    <DrawerTopic title="Waiting for pickup" detail={waiting.length} available={waiting.length > 0}>
      <Section aria-label="Assigned, waiting for pickup status">
        <SectionTitle className="mb-4">Assigned · waiting for {pickupStatus}</SectionTitle>
        <p className={mutedCopy}>{waiting.length
          ? 'These assignments are visible for planning. No automatic team work is queued.'
          : 'No assignments waiting for pickup.'}</p>
        {waitingRows.map(item => <button type="button" className={card} key={item.key} onBlur={release} onClick={event => {
          remember({ group: 'waiting', key: item.key }, event.currentTarget);
          onOpen(item.key);
        }}>
          <small className={meta}>{item.key} · {item.pickupStatus ?? item.status}</small>
          <strong className="text-13 leading-normal">{item.summary}</strong>
        </button>)}
      </Section>
    </DrawerTopic>
  </>;
}
