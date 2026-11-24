import { DrawerTopic } from '../office/drawer/DrawerTopic';
import { useState } from 'react';
import { Send, Check, ExternalLink } from '../ui/icons';
import { Button, Section, SectionTitle, Tag, checkbox, cardButton, cardButtonIdle, cardButtonSelected, cx, eyebrow, linkBase, mutedCopy } from '../ui';
import { PanelHeader } from '../ui/PanelHeader';
import { ROLE_NAMES, type OfficeSnapshot, type Role } from '../shared';
import { Conversation, type SendMessage } from './Conversation';
import { OutboxMaintenanceStatus } from './OutboxMaintenanceStatus';
import { OutboxLessonDecision } from './OutboxLessonDecision';
import { WorkSummary } from '../work/WorkSummary';
import { actionSummary, shortSummary } from '../work/work-summary';
import { MergeApproval } from '../work/MergeApproval';
import { withoutIdentifiers } from '../office/without-identifiers';
import { savedPlanFollowup } from './saved-plan-followup';
import { savedImplementationFollowup } from './saved-implementation-followup';
import { OutboxSavedImplementation } from './OutboxSavedImplementation';
import { OutboxSavedPlan } from './OutboxSavedPlan';
import { OutboxQuestionRound } from './OutboxQuestionRound';
import { LESSON_DIGEST, isLessonDecision } from './lesson-digest';
import { OutboxLessonDigest } from './OutboxLessonDigest';
import { OutboxCTOInput, ctoInputFailure } from './OutboxCTOInput';
import { OutboxOwnerSteps } from './OutboxOwnerSteps';
import { ownerStepsFirst } from './owner-steps-first';
export function Outbox({snapshot,names=ROLE_NAMES,sendMessage,initialId,refresh,onOpen}:{snapshot:OfficeSnapshot;names?:Record<Role,string>;sendMessage:SendMessage;initialId?:string;onOpen?:(id:string)=>void;refresh?:()=>Promise<void>}){
  const [chosen,setChosen]=useState(initialId||'');
  const open=snapshot.outbox.filter(a=>a.status==='open'),items=ownerStepsFirst(snapshot.outbox);
  const selected=snapshot.outbox.find(a=>a.id===chosen);
  const beingHandled = (id:string) => snapshot.messages.some(m=>m.from==='human' && m.actionId===id && ['queued','working'].includes(m.status));
  const rounds=(snapshot.featureQuestions||[]).filter(round=>round.projectId===snapshot.project?.id);
  const question=rounds.find(round=>'feature-round:'+round.roundId===chosen);
  const plan=selected&&savedPlanFollowup(snapshot,selected.id);
  const implementation=selected&&savedImplementationFollowup(snapshot,selected.id);
  const ctoInput=selected&&ctoInputFailure(snapshot,selected.id);
  return <>{selected||question?<p className="text-18 font-semibold">Your outbox</p>:<><PanelHeader icon={<Send size={26}/>}>Your outbox</PanelHeader><p className={mutedCopy}>Open an item to answer its question or see the next action.</p></>}

    {!open.length&&!rounds.length&&!selected&&!question?<div className="rounded-8 border border-dashed border-mail-empty-line bg-mail-empty px-4 py-6 text-center text-mail-empty-ink"><Check size={30} className="mx-auto mt-0.75 mb-4 block text-mail-empty-icon"/><strong className="block text-12 font-medium text-mail-empty-title">Nothing needs you right now.</strong><p className="mt-2 text-10 leading-body">Questions and blockers that need your input will arrive here.</p></div>:null}
    {!selected&&!question&&(['open','handling','approval','resolved'] as const).map(status=>{
      const group=items.filter(item => {
        if (item.status === 'resolved') return status === 'resolved';
        if (beingHandled(item.id)) return status === 'handling';
        if (item.id.startsWith('merge-approval:')) return status === 'approval';
        return status === 'open';
      });
      return <DrawerTopic available={group.length > 0} key={status} title={{open:'Needs your reply',handling:'With the team',approval:'Awaiting approval',resolved:'Resolved items'}[status]} detail={group.length}>
        {!group.length && <p className={mutedCopy}>No items in this group.</p>}
        {group.map(a=><button type="button" key={a.id} data-outbox-item className={cx(cardButton,chosen===a.id?cardButtonSelected:cardButtonIdle)} onClick={()=>onOpen ? onOpen(a.id) : setChosen(a.id)} aria-pressed={chosen===a.id}><span className={cx(eyebrow,'text-9')}>{a.ticket||'Office'} · {a.status==='resolved'?'Resolved':`From ${snapshot.agents.find(agent=>agent.id===a.role)?.name||names[a.role]}`}{a.ownerSteps&&a.status==='open'?<> <Tag tone="waiting">Only you</Tag></>:null}</span><strong className="text-14">{a.title}</strong><span className="text-13 leading-relaxed">{shortSummary(a.detail)}</span><small className="mt-1 block text-11 leading-relaxed"><b>{snapshot.messages.some(m=>m.from==='human'&&m.actionId===a.id&&['queued','working'].includes(m.status))?'Team handling:':'Action:'}</b> {snapshot.messages.some(m=>m.from==='human'&&m.actionId===a.id&&['queued','working'].includes(m.status))?'Read-back is queued or running; no additional reply needed.':savedImplementationFollowup(snapshot,a.id)?'Review the saved draft and choose whether Office should continue.':savedPlanFollowup(snapshot,a.id)?'Office must verify and link the original saved plan. No product answer is needed.':actionSummary(a.id)}</small><span className="mt-2 font-semibold underline">{a.status==='resolved'?'View details':isLessonDecision(a.id)?'Review lesson':'Open follow-up'} →</span></button>)}
      </DrawerTopic>;
    })}
    {!selected&&!question&&rounds.map(round=><button type="button" key={round.roundId} data-outbox-question className={cx(cardButton,cardButtonIdle)} onClick={()=>(onOpen || setChosen)('feature-round:'+round.roundId)}><span className={eyebrow}>{round.ticket||round.projectName} · Question for you</span><strong>{round.title}</strong><span>{round.questions[0]?.question}</span><span className="mt-2 font-semibold underline">Answer question →</span></button>)}
    {question?<Section><OutboxQuestionRound key={question.roundId} round={question} disabled={snapshot.mode==='demo'} refresh={refresh}/></Section>:null}
    {selected?<Section data-outbox-detail className="flex flex-col gap-3.5"><Tag className="self-start" tone={selected.status==='resolved'?'passed':'waiting'}>{selected.status==='resolved'?'Resolved':isLessonDecision(selected.id)?'Lesson decision':plan?'Office follow-up':selected.ownerSteps?'Only you':'Needs follow-up'}</Tag><SectionTitle className="leading-relaxed">{selected.id===LESSON_DIGEST?selected.title:isLessonDecision(selected.id)?"Review Harper’s lesson":selected.title}</SectionTitle>{selected.ownerSteps?<OutboxOwnerSteps ownerSteps={selected.ownerSteps}/>:!plan&&!implementation&&!ctoInput&&!isLessonDecision(selected.id)?<><p className="text-13 leading-relaxed"><b>Action:</b> {actionSummary(selected.id)}</p><WorkSummary detail={withoutIdentifiers(selected.detail)}/></>:null}{snapshot.coordination?.jobs?.filter(j=>selected.id===`merge-approval:${j.id}`).map(job=><MergeApproval key={job.id} snapshot={snapshot} job={job}/>)}{/^https:\/\//.test(selected.url)?<a className={cx(linkBase,'mb-1.5 self-start text-12 text-outbox-link')} href={selected.url} target="_blank" rel="noreferrer">{selected.url.includes('dev.azure.com')?'Open in Azure':'Open ticket'} <ExternalLink size={12}/></a>:null}{ctoInput?<OutboxCTOInput key={selected.id} snapshot={snapshot} actionId={selected.id} refresh={refresh}/>:implementation?<OutboxSavedImplementation key={selected.id} snapshot={snapshot} ticket={implementation} refresh={refresh}/>:plan?<OutboxSavedPlan key={selected.id} snapshot={snapshot} ticket={plan} refresh={refresh}/>: selected.id===LESSON_DIGEST?<OutboxLessonDigest key={`${snapshot.project?.id}:digest`} snapshot={snapshot} refresh={refresh}/>:isLessonDecision(selected.id)?<OutboxLessonDecision key={`${snapshot.project?.id}:${selected.id}`} snapshot={snapshot} actionId={selected.id} refresh={refresh}/>:selected.ownerSteps?null:<><OutboxMaintenanceStatus snapshot={snapshot} actionId={selected.id}/><Conversation key={selected.id} snapshot={snapshot} names={names} sendMessage={sendMessage} initialTicket={selected.ticket} actionId={selected.id} role={selected.role}/></>}</Section>:null}
  </>;
}
