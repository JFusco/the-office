import { displayAgentTask } from './agent-activity';
import { useLiveTiming } from './useLiveTiming';
import type { Agent, OfficeSnapshot } from './shared';

type Props={agent:Agent;snapshot:OfficeSnapshot;compact?:boolean;visible?:boolean};
const text=(task:string,compact:boolean)=>compact?task.split(' · ').slice(1).join(' · ')||task:task;

/** Only the small running-task text subscribes to the single shared clock. */
export function LiveAgentTask({agent,snapshot,compact=false,visible=true}:Props){
  const running=visible&&(agent.activity==='working'||agent.activity==='disconnected')&&snapshot.workLog?.some(work=>work.role===agent.id&&work.status==='running');
  return running?<RunningTask agent={agent} snapshot={snapshot} compact={compact}/>:<>{text(displayAgentTask(agent,snapshot),compact)}</>;
}
function RunningTask({agent,snapshot,compact=false}:Props){
  const timed=useLiveTiming(snapshot);
  return <span data-live-agent-task={agent.id} aria-live="off">{text(displayAgentTask(agent,timed),compact)}</span>;
}
