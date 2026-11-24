import { LoadingMark } from '../ui/LoadingState';
import { PanelHeader } from '../ui/PanelHeader';
import { Button, Notice, Section, SectionTitle, interactive, noticeIcon } from '../ui';
import { AlertCircle, Clock3, ChevronRight, Inbox } from '../ui/icons';
import { STAGE_LABELS } from '../shared';
import { DrawerRow, DrawerTopic } from '../office/drawer/DrawerTopic';
import type { InspectorProps } from '../office/drawer/inspector-props';
import { Checkpoints } from './Checkpoints';
import { InboxQueue } from './InboxQueue';
import { ProjectWork } from './ProjectWork';

const textRow = `-mx-2 flex w-[calc(100%+16px)] justify-between rounded-5 border-b border-row-rule px-2 py-2.5 text-left text-11 hover:bg-icon-hover ${interactive}`;

export function Mailbox({snapshot,act,busy,preferences,onSelect}: Pick<InspectorProps,'snapshot'|'act'|'busy'|'preferences'|'onSelect'>) {
  const priority = snapshot.tickets.find(ticket => ticket.activity === 'blocked') || snapshot.tickets.find(ticket => ticket.activity === 'working') || snapshot.tickets.find(ticket => ticket.stage !== 'complete');
  return (
    <>
      <PanelHeader icon={<Inbox size={26} />}>PM mailbox</PanelHeader>
      <Button
        variant="primary"
        full
        className="mt-5"
        disabled={
          busy ||
          !!snapshot.pendingMail ||
          snapshot.intake.status === 'working' ||
          snapshot.mode === 'demo' ||
          snapshot.paused
        }
        onClick={() => act('check-mail')}
      >
        {snapshot.intake.status === 'working' ? <LoadingMark /> : <Inbox size={16} />}{' '}
        {snapshot.pendingMail ? 'Mail check queued' : 'Check mail now'}
      </Button>
      <div className="mt-4 flex items-start gap-2 text-9 text-schedule">
        <Clock3 size={14} />
        <span>
          {snapshot.intake.schedule}
          <small className="mt-1 block text-8 leading-relaxed text-schedule-detail">
            {snapshot.intake.lastChecked
              ? `Last checked ${new Date(snapshot.intake.lastChecked).toLocaleString()}`
              : 'Mailbox has not been checked yet'}
          </small>
        </span>
      </div>
      {snapshot.intake.error ? (
        <Notice className="mt-5">
          <AlertCircle className={noticeIcon} size={17} />
          <span>{snapshot.intake.error}</span>
        </Notice>
      ) : null}
      {priority && <div className="my-section-gap">
        <SectionTitle className="mb-2">{priority.activity === 'blocked' ? 'Needs attention' : 'Current ticket'}</SectionTitle>
        <DrawerRow key={priority.key} title={priority.key + ' · ' + priority.summary}
          detail={STAGE_LABELS[priority.stage]} onOpen={() => onSelect({kind:'ticket',id:priority.key})}/>
      </div>}
      <InboxQueue snapshot={snapshot} onOpen={(key) => onSelect({ kind: 'ticket', id: key })} />
      <DrawerRow title="Project settings" disabled={!preferences?.preferences} onOpen={() => onSelect({kind:'settings'})} />
      <DrawerTopic title="Checkpoints">
        <Checkpoints snapshot={snapshot} />
      </DrawerTopic>
      <DrawerTopic title="Project board">
        <ProjectWork snapshot={snapshot} onOpen={(key) => onSelect({ kind: 'ticket', id: key })} />
      </DrawerTopic>
      {snapshot.tickets.some((t) => t.stage !== 'mailbox') ? (
        <DrawerTopic
          title="Already with the team"
          detail={snapshot.tickets.filter((t) => t.stage !== 'mailbox').length}
        >
          <Section>
            <SectionTitle className="mb-4">Already with the team</SectionTitle>
            {snapshot.tickets
              .filter((t) => t.stage !== 'mailbox')
              .map((t) => (
                <button
                  type="button"
                  key={t.key}
                  className={textRow}
                  onClick={() => onSelect({ kind: 'ticket', id: t.key })}
                >
                  <span>
                    {t.key}
                    <small className="mt-1 block text-9 leading-relaxed text-row-detail">
                      {STAGE_LABELS[t.stage]}
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
          </Section>
        </DrawerTopic>
      ) : null}
        </>
  );
}
