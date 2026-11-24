import { useState } from 'react';
import { LoadingMark } from '../ui/LoadingState';
import { PanelHeader } from '../ui/PanelHeader';
import { Button, Notice, Section, SectionTitle, interactive, mutedCopy, noticeIcon } from '../ui';
import { AlertCircle, Clock3, ChevronRight, Inbox } from '../ui/icons';
import { STAGE_LABELS } from '../shared';
import { DrawerRow, DrawerTopic } from '../office/drawer/DrawerTopic';
import type { InspectorProps } from '../office/drawer/inspector-props';
import { Checkpoints } from './Checkpoints';
import { InboxQueue } from './InboxQueue';
import { ProjectWork } from './ProjectWork';

const textRow = `-mx-2 flex w-[calc(100%+16px)] justify-between rounded-5 border-b border-row-rule px-2 py-2.5 text-left text-11 hover:bg-icon-hover ${interactive}`;

export function Mailbox({snapshot,act,busy,preferences,onSelect}: Pick<InspectorProps,'snapshot'|'act'|'busy'|'preferences'|'onSelect'>) {
  const [openedPriority, setOpenedPriority] = useState<string>();
  const priority = snapshot.tickets.find(ticket => ticket.activity === 'blocked') || snapshot.tickets.find(ticket => ticket.activity === 'working') || snapshot.tickets.find(ticket => ticket.stage !== 'complete');
  const previousPriority = openedPriority !== priority?.key
    ? snapshot.tickets.find(ticket => ticket.key === openedPriority)
    : undefined;
  const withTeam = snapshot.tickets.filter(ticket => ticket.stage !== 'mailbox');
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
      {[priority, previousPriority].map(ticket => ticket && (
        <div className="my-section-gap" key={ticket.key}>
          <SectionTitle className="mb-2">{ticket !== priority ? 'Previously opened' : ticket.activity === 'blocked' ? 'Needs attention' : 'Current ticket'}</SectionTitle>
          <DrawerRow title={ticket.key + ' · ' + ticket.summary} detail={STAGE_LABELS[ticket.stage]} onOpen={() => {
            setOpenedPriority(ticket.key);
            onSelect({kind: 'ticket', id: ticket.key});
          }}/>
        </div>
      ))}
      <InboxQueue snapshot={snapshot} onOpen={(key) => onSelect({ kind: 'ticket', id: key })} />
      <DrawerRow title="Project settings" disabled={!preferences?.preferences} onOpen={() => onSelect({kind:'settings', page:'project'})} />
      <DrawerTopic title="Checkpoints">
        <Checkpoints snapshot={snapshot} />
      </DrawerTopic>
      <DrawerTopic title="Project board">
        <ProjectWork snapshot={snapshot} onOpen={(key) => onSelect({ kind: 'ticket', id: key })} />
      </DrawerTopic>
      <DrawerTopic title="Already with the team" detail={withTeam.length} available={withTeam.length > 0}>
        <Section>
          <SectionTitle className="mb-4">Already with the team</SectionTitle>
          {!withTeam.length && <p className={mutedCopy}>No tickets with the team.</p>}
          {withTeam.map((ticket) => (
            <button
              type="button"
              key={ticket.key}
              className={textRow}
              onClick={() => onSelect({ kind: 'ticket', id: ticket.key })}
            >
              <span>
                {ticket.key}
                <small className="mt-1 block text-9 leading-relaxed text-row-detail">
                  {STAGE_LABELS[ticket.stage]}
                </small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </Section>
      </DrawerTopic>
    </>
  );
}
