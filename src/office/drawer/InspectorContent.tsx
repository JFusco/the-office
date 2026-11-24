import { Mailbox } from '../../work/Mailbox';
import {QueueTicketDetail} from '../../work/QueueTicketDetail';
import { Outbox } from '../../conversations/Outbox';
import { withoutIdentifiers } from '../without-identifiers';
import { PanelHeader } from '../../ui/PanelHeader';
import { TelemetryPanel } from '../../telemetry/TelemetryPanel';
import { ServiceHealthPanel } from '../../health/ServiceHealthPanel';
import { PMQueue } from '../../work/PMQueue';
import { WorkSummary } from '../../work/WorkSummary';
import { SettingsPanel } from '../settings/SettingsPanel';
import { FileText, MessageCircle } from '../../ui/icons';
import { Section, SectionTitle, mutedCopy } from '../../ui';
import { ROLE_NAMES } from '../../shared';
import { Conversation } from '../../conversations/Conversation';
import { Goals } from '../../leadership/Goals';
import { GitHubPanel } from '../../work/GitHubPanel';
import { PeoplePanel } from '../../people/PeoplePanel';
import { TicketPlanningAction } from '../../features/questions/TicketPlanningAction';
import { FeatureWorkspace } from '../../features/FeatureWorkspace';
import { DrawerRow } from './DrawerTopic';
import type { InspectorProps } from './inspector-props';
import { AgentDesk } from '../../people/AgentDesk';
import { AzureOperations } from '../../work/AzureOperations';
import { TicketDetail } from '../../work/TicketDetail';
export function InspectorContent(props: InspectorProps) {
  const {
    selection,
    snapshot,
    names = ROLE_NAMES,
    onSelect,
    act,
    busy,
    sendMessage,
    onOpenProject,
    preferences,
    osReduced = false,
    refresh,
  } = props;
  const ticket = selection.kind === 'ticket' ? snapshot.tickets.find((t) => t.key === selection.id) : null;
  const github = snapshot.project?.provider === 'github';
  const pmName = snapshot.agents.find((a) => a.id === 'pm')?.name || names.pm,
    ctoName = snapshot.agents.find((a) => a.id === 'cto')?.name || names.cto;
  return (
    <>
      {selection.kind === 'features' ? (
        <FeatureWorkspace
          key={[snapshot.project?.id, selection.id, selection.sourceGoalId, selection.sourceTicket].join(':')}
          snapshot={snapshot}
          initialId={selection.id}
          sourceGoalId={selection.sourceGoalId}
          sourceTicket={selection.sourceTicket}
          onOpen={(project, id) => onOpenProject(project, 'feature:' + id)}
        />
      ) : null}
      {selection.kind === 'people' ? <PeoplePanel snapshot={snapshot} names={names} onSelect={onSelect} /> : null}
      {selection.kind === 'settings' && preferences ? (
        <SettingsPanel snapshot={snapshot} preferences={preferences} osReduced={osReduced} refresh={refresh} />
      ) : null}
      {selection.kind === 'telemetry' ? (
        <TelemetryPanel projects={snapshot.projects || []} defaultProject={snapshot.project?.id} />
      ) : null}
      {selection.kind === 'health' ? (
        <ServiceHealthPanel
          project={snapshot.project?.id}
          liveIT={snapshot.it}
          onChat={() => onSelect({ kind: 'chat', role: 'it' })}
        />
      ) : null}
      {selection.kind === 'chat' ? (
        <>
          <PanelHeader icon={<MessageCircle size={26} />}>Chat with {selection.role ? names[selection.role] : pmName}</PanelHeader>
          <p className="text-11 leading-normal text-muted">
            {selection.role === 'it' ? 'Talk through a service issue with your IT specialist.' : 'Your PM coordinates the team and keeps the work up to date.'}
          </p>
          <Conversation
            role={selection.role || 'pm'}
            key={selection.ticket || 'office'}
            snapshot={snapshot}
            names={names}
            sendMessage={sendMessage}
            initialTicket={selection.ticket || ''}
            fill
          />
        </>
      ) : null}
      {selection.kind === 'goals' ? (
        <Goals
          snapshot={snapshot}
          sendMessage={sendMessage}
          onDiscuss={() => onSelect({ kind: 'cto-chat' })}
          onPlan={(project, goal) => onOpenProject(project, 'feature-goal:' + goal)}
        />
      ) : null}
      {selection.kind === 'cto-chat' ? (
        <>
          <PanelHeader icon={<MessageCircle size={26} />}>Chat with {ctoName}</PanelHeader>
          <p className="text-11 leading-normal text-muted">
            Discuss any Office project and save goals or ideas in the existing panel. {pmName} brings delivery reports
            here.
          </p>
          <Conversation snapshot={snapshot} names={names} sendMessage={sendMessage} role="cto" fill />
        </>
      ) : null}
      {selection.kind === 'outbox' ? (
        <Outbox
          onOpen={(id) => onSelect({ kind: 'outbox', id })}
          key={selection.id || 'tray'}
          snapshot={snapshot}
          names={names}
          sendMessage={sendMessage}
          initialId={selection.id}
          refresh={refresh}
        />
      ) : null}
      {ticket ? (
        <>
          <TicketDetail reduced={props.reduced}
            showEvidence={selection.kind === 'ticket' && selection.page === 'evidence'}
            ticket={ticket}
            snapshot={snapshot}
            act={act}
            onOpen={(key) => onSelect({ kind: 'ticket', id: key })}
          />
          <TicketPlanningAction
            snapshot={snapshot}
            ticket={ticket.key}
            open={(id) => onSelect(id ? { kind: 'features', id } : { kind: 'features', sourceTicket: ticket.key })}
          />
          <DrawerRow title={`Discuss ${ticket.key} with ${pmName}`} onOpen={() => onSelect({ kind: 'chat', ticket: ticket.key })} />
        </>
      ) : null}
      {selection.kind==='ticket' && !ticket && <QueueTicketDetail pmName={pmName} reduced={props.reduced} snapshot={snapshot} ticketKey={selection.id} onDiscuss={key=>onSelect({kind:'chat',ticket:key})}/>}
      {selection.kind === 'pm-queue' ? <PMQueue reduced={props.reduced} snapshot={snapshot} onOpen={onOpenProject} /> : null}
      {selection.kind === 'mailbox' && <Mailbox snapshot={snapshot} act={act} busy={busy} preferences={preferences} onSelect={onSelect}/>}
      {selection.kind === 'azure' && github ? <GitHubPanel snapshot={snapshot} act={act} busy={busy} /> : null}
      {selection.kind === 'azure' && !github && <AzureOperations {...props} />}
      {selection.kind === 'meeting' ? (
        <>
          <PanelHeader icon={<FileText size={26} />} tone="review">
            Reviews
          </PanelHeader>
          <p className={mutedCopy}>
            The team chooses the planning, review and verification each task needs. Decisions are recorded with reasons;
            skipped steps stay distinct from work that passed.
          </p>
          <Section>
            <SectionTitle className="mb-4">Handoffs</SectionTitle>
            {snapshot.events
              .filter((e) => ['stage-passed', 'fix-requested', 'stage-started'].includes(e.kind))
              .slice(0, 12)
              .map((e) => (
                <div className="flex items-start gap-3 border-b border-log-entry-rule py-3 text-10" key={e.id}>
                  <time className="min-w-9.75 pt-0.5 text-8 text-log-entry-time">{e.ticket}</time>
                  <WorkSummary
                    detail={withoutIdentifiers(e.message)}
                    textClassName="text-log-entry-ink wrap-anywhere"
                  />
                </div>
              ))}
            {!snapshot.events.some((e) => e.kind === 'stage-passed') ? (
              <p className={mutedCopy}>
                The table is ready. Reviewed plans and handoffs will appear here as tickets move through the office.
              </p>
            ) : null}
          </Section>
        </>
      ) : null}
    </>
  );
}
