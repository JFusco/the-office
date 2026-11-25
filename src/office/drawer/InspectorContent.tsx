import { Mailbox } from '../../work/Mailbox';
import { QueueEvidenceLinks, QueueTicketDetail, queueTicketRecord, queueValidationArtifacts } from '../../work/QueueTicketDetail';
import { Outbox } from '../../conversations/Outbox';
import { withoutIdentifiers } from '../without-identifiers';
import { PanelHeader } from '../../ui/PanelHeader';
import { TelemetryPanel } from '../../telemetry/TelemetryPanel';
import { ServiceHealthPanel } from '../../health/ServiceHealthPanel';
import { PMQueue } from '../../work/PMQueue';
import { WorkSummary } from '../../work/WorkSummary';
import { ProjectSettings, SettingsPanel } from '../settings/SettingsPanel';
import { FileText, MessageCircle } from '../../ui/icons';
import { PanelTitle, Section, SectionTitle, mutedCopy } from '../../ui';
import { ROLE_NAMES } from '../../shared';
import { Conversation } from '../../conversations/Conversation';
import { Goals } from '../../leadership/Goals';
import { GitHubPanel } from '../../work/GitHubPanel';
import { PeoplePanel } from '../../people/PeoplePanel';
import { TicketPlanningAction } from '../../features/questions/TicketPlanningAction';
import { FeatureWorkspace } from '../../features/FeatureWorkspace';
import { DrawerRow, DrawerTopic } from './DrawerTopic';
import type { InspectorProps } from './inspector-props';
import { AgentDesk } from '../../people/AgentDesk';
import { AzureOperations } from '../../work/AzureOperations';
import { TicketDetail, TicketEvidence, TicketHeading } from '../../work/TicketDetail';
import { TicketTimeline } from '../../work/timeline/TicketTimeline';
import { currentJob } from '../../work/timeline/ticket-progress';
import { TimeBook } from '../../timing/TimeBook';
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
          initialFeature={selection.initialFeature}
          sourceGoalId={selection.sourceGoalId}
          sourceTicket={selection.sourceTicket}
          onOpen={(project, id, created) => created
            ? onSelect({kind: 'features', id, initialFeature: created})
            : onOpenProject(project, 'feature:' + id)}
        />
      ) : null}
      {selection.kind === 'people' ? <PeoplePanel snapshot={snapshot} names={names} onSelect={onSelect} /> : null}
      {selection.kind === 'settings' && preferences ? (
        selection.page === 'project'
          ? <ProjectSettings snapshot={snapshot} refresh={refresh} />
          : <SettingsPanel snapshot={snapshot} preferences={preferences} osReduced={osReduced} refresh={refresh} />
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
      {selection.kind === 'ticket' && <SelectedTicket key={selection.id} {...props} selection={selection} pmName={pmName} />}
      {selection.kind === 'pm-queue' ? <PMQueue reduced={props.reduced} snapshot={snapshot} onOpen={onOpenProject} /> : null}
      {selection.kind === 'agent' && <AgentDesk {...props} />}
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

function SelectedTicket({ selection, snapshot, reduced, act, onSelect, pmName }: Pick<InspectorProps, 'snapshot' | 'reduced' | 'act' | 'onSelect'> & {
  selection: Extract<InspectorProps['selection'], { kind: 'ticket' }>;
  pmName: string;
}) {
  const key = selection.id;
  const github = snapshot.project?.provider === 'github';
  const ticket = snapshot.tickets.find(ticket => ticket.key === key);
  const queue = ticket ? undefined : queueTicketRecord(snapshot, key);
  const job = ticket ? currentJob(snapshot.coordination?.jobs || [], key) : queue?.job;
  const artifacts = !ticket && job ? queueValidationArtifacts(job, snapshot.project?.id) : undefined;

  if (!ticket && !queue) return <p className={mutedCopy}>This ticket is no longer in the queue.</p>;

  return (
    <div className={github ? 'flex min-w-0 flex-col gap-4' : undefined} data-github-ticket={github || undefined}>
      <TicketHeading ticket={key} url={ticket?.url || queue?.issue?.url || ''}
        label={ticket && !github ? 'View in Jira' : ticket || queue?.issue ? 'View GitHub issue' : ''} />
      <PanelTitle className={github ? 'max-w-full break-words' : 'mt-3 mb-4'}>{ticket?.summary || queue?.title}</PanelTitle>
      <TicketTimeline ticket={ticket || { key }} snapshot={snapshot} job={job} reduced={reduced} />
      {ticket
        ? <TicketDetail ticket={ticket} snapshot={snapshot} job={job} act={act} onOpen={id => onSelect({ kind: 'ticket', id })} />
        : <QueueTicketDetail job={job} />}
      {(ticket || !!artifacts?.size) && (
        <DrawerTopic initial={selection.page === 'evidence'} title="Evidence"
          detail={ticket && !github ? ticket.evidence.length || undefined : undefined}>
          {ticket ? <TicketEvidence ticket={ticket} job={job} github={github} /> :
            artifacts && <QueueEvidenceLinks artifacts={artifacts} />}
        </DrawerTopic>
      )}
      {(ticket || job) && <DrawerTopic title="Time"><TimeBook snapshot={snapshot} ticket={key} /></DrawerTopic>}
      {ticket && <TicketPlanningAction snapshot={snapshot} ticket={key}
        open={id => onSelect(id ? { kind: 'features', id } : { kind: 'features', sourceTicket: key })} />}
      {(ticket || job) && <DrawerRow title={`Discuss ${key} with ${pmName}`}
        onOpen={() => onSelect({ kind: 'chat', ticket: key })} />}
    </div>
  );
}
