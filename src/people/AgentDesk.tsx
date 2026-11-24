import { lessonsView } from '../knowledge/lessons-view';
import { withoutIdentifiers } from '../office/without-identifiers';
import { WorkSummary } from '../work/WorkSummary';
import { useIsPresent } from 'motion/react';
import { ArrowUpRight } from '../ui/icons';
import { PanelTitle, Section, SectionTitle, StatusDot, Tag, cx, envelopeCard, eyebrow, mutedCopy } from '../ui';
import { ROLE_NAMES, PERSONAS, type Role } from '../shared';
import { Conversation } from '../conversations/Conversation';
import { TimeBook } from '../timing/TimeBook';
import { LiveAgentTask } from '../scene/LiveAgentTask';
import { LessonsPanel } from '../knowledge/LessonsPanel';
import { ReportsTo } from './ReportsTo';
import { DrawerRow, DrawerTopic } from '../office/drawer/DrawerTopic';
import type { InspectorProps } from '../office/drawer/inspector-props';
const PORTRAIT: Record<Role, string> = {
  pm: 'bg-portrait-pm',
  lead: 'bg-portrait-lead',
  qa: 'bg-portrait-qa',
  developer: 'bg-portrait-default',
  cto: 'bg-portrait-default',
  it: 'bg-portrait-default',
  analyst: 'bg-portrait-default',
  knowledge: 'bg-portrait-default',
};
export function AgentDesk({
  selection,
  snapshot,
  names = ROLE_NAMES,
  onSelect,
  onOpenBrain,
  sendMessage,
  refresh,
}: InspectorProps) {
  const agent = selection.kind === 'agent' ? snapshot.agents.find((a) => a.id === selection.id) : undefined;
  const present = useIsPresent(),
    pmName = names.pm;
  const lessons = lessonsView(snapshot.knowledge, snapshot.officeKnowledge);
  const awaiting =
    lessons.officeProposals.length +
    lessons.agentsSuggestions.filter((item) => item.repositoryInstruction?.status === 'proposed').length;
  return agent ? (
    <>
      <div
        className={cx(
          'relative mb-6 grid h-19 w-17.25 place-items-center rounded-20 text-39 font-heading text-portrait-ink inset-shadow-portrait',
          PORTRAIT[agent.id],
        )}
      >
        <span aria-hidden="true">{agent.name[0]}</span>
        <StatusDot
          status={agent.activity}
          size="lg"
          className="absolute right-0 bottom-0 outline-4 outline-drawer-dot-ring"
        />
      </div>
      <span className={cx(eyebrow, 'text-9')}>{agent.title}</span>
      <PanelTitle className="mt-3 mb-4">{agent.name}</PanelTitle>
      <Tag tone={agent.activity}>{agent.activity}</Tag>
      <p className={cx(mutedCopy, 'mt-4')}>
        <LiveAgentTask agent={agent} snapshot={snapshot} visible={present} />
      </p>
      {agent.lastOutcome ? (
        <DrawerTopic title="Last report" detail={agent.lastOutcome?.status}>
          <Section data-last-report className="flex flex-col items-start gap-3">
            <SectionTitle>Last report · {agent.lastOutcome.ticket || 'Office'}</SectionTitle>
            <Tag>{agent.lastOutcome.status}</Tag>
            <WorkSummary detail={agent.lastOutcome.summary} className="w-full min-w-0 wrap-anywhere" />
            <small className="block text-11 leading-relaxed">Open the ticket for its current delivery status.</small>
          </Section>
        </DrawerTopic>
      ) : null}
      {agent.ticket ? (
        <button type="button" className={envelopeCard} onClick={() => onSelect({ kind: 'ticket', id: agent.ticket })}>
          <span className={cx(eyebrow, 'text-8 text-envelope-label')}>At this desk</span>
          <strong className="max-w-57.5 text-13 leading-relaxed font-emphasis">{agent.ticket}</strong>
          <span>{snapshot.tickets.find((t) => t.key === agent.ticket)?.summary}</span>
          <ArrowUpRight size={18} className="absolute right-4 bottom-4 text-envelope-icon" />
        </button>
      ) : (
        <Section className="flex gap-3 text-11 text-empty">
          <p className="leading-body">{PERSONAS[agent.id].summary}</p>
        </Section>
      )}
      {agent.id === 'it' ? (
        <>
          <DrawerTopic title="Conversation">
            <Conversation snapshot={snapshot} names={names} sendMessage={sendMessage} role="it" />
          </DrawerTopic>
          <DrawerRow title="Service health" onOpen={() => onSelect({ kind: 'health' })} />
        </>
      ) : agent.id === 'knowledge' ? (
        <>
          <DrawerTopic title="Conversation">
            <Conversation snapshot={snapshot} names={names} sendMessage={sendMessage} role="knowledge" />
          </DrawerTopic>
          <DrawerRow title="Open Harper’s knowledge" onOpen={() => onOpenBrain?.()} />
          <DrawerTopic title="Lessons" detail={awaiting ? awaiting + ' to review' : lessons.active.length || undefined}>
            <LessonsPanel snapshot={snapshot} refresh={refresh} />
          </DrawerTopic>
        </>
      ) : (
        <DrawerRow title="Conversation" detail={pmName} onOpen={() => onSelect({ kind: 'chat', ticket: agent.ticket || undefined })} />
      )}
      <DrawerTopic title="Responsibilities">
        <Section>
          <SectionTitle className="mb-4">Responsibilities</SectionTitle>
          <p className={mutedCopy}>{PERSONAS[agent.id].responsibilities}</p>
          <div data-panel-foot className="my-3 text-12 text-muted">
            {agent.id === 'developer' && agent.model && <p>Configured model: {agent.model === 'claude-opus-5-5' ? 'Opus 5.5' : agent.model} · {agent.effort} effort</p>}
            <p>{agent.sessionId ? 'Session running' : 'No session running'}</p>
          </div>
          <ReportsTo id={agent.id} snapshot={snapshot} names={names} onSelect={onSelect} />
        </Section>
      </DrawerTopic>
      {agent.id === 'pm' ? (
        <DrawerTopic title="Time">
          <TimeBook snapshot={snapshot} />
        </DrawerTopic>
      ) : null}
      <DrawerTopic title="Recent activity">
        <Section>
          <SectionTitle className="mb-4">Recent activity</SectionTitle>
          {snapshot.events
            .filter((e) => e.role === agent.id)
            .slice(0, 8)
            .map((e) => (
              <div className="flex items-start gap-3 border-b border-log-entry-rule py-3 text-10" key={e.id}>
                <time className="min-w-9.75 pt-0.5 text-8 text-log-entry-time">
                  {new Date(e.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
                <WorkSummary detail={withoutIdentifiers(e.message)} textClassName="text-log-entry-ink wrap-anywhere" />
              </div>
            ))}
          {!snapshot.events.some((e) => e.role === agent.id) ? (
            <p className={mutedCopy}>No work has been dispatched yet.</p>
          ) : null}
        </Section>
      </DrawerTopic>
    </>
  ) : null;
}
