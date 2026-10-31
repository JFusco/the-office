import {expect,test} from 'vitest';
import {displayAgentTask} from '../../../src/scene/agent-activity';
test('closeout tool progress keeps the delivery phase visible for already closed issues',()=>{
 const agent={id:'pm',activity:'working',ticket:'GH-263',task:'GH-263 · Inspecting the pull request'} as any;
 const snapshot={workLog:[{role:'pm',status:'running',stage:'github-closeout',ticket:'GH-263'}]} as any;
 expect(displayAgentTask(agent,snapshot)).toBe('GH-263 · Closing out merged work · Inspecting the pull request');
 agent.task='GH-263 · Closing out merged work · Reading ticket details';expect(displayAgentTask(agent,snapshot)).toBe(agent.task);
 agent.activity='idle';expect(displayAgentTask(agent,snapshot)).toBe(agent.task);
});
test('publication of an existing PR is described as an update, not a new draft',()=>{
 const agent={id:'developer',activity:'working',task:'GH-255 · Linking a draft PR · Inspecting the pull request'} as any;
 const snapshot={coordination:{jobs:[{id:'repair',pr:272}]},workLog:[{role:'developer',requestId:'repair',status:'running',stage:'github-draft',ticket:'GH-255',elapsedMs:2000}]} as any;
 expect(displayAgentTask(agent,snapshot)).toBe('GH-255 · Updating the existing PR · Inspecting the pull request · 2s elapsed');
});
test('a long command keeps its observed activity and shows measured elapsed time',()=>{
 const agent={id:'developer',activity:'working',task:'GH-255 · Updating the candidate base · Waiting for required check results'} as any;
 const snapshot={workLog:[{role:'developer',status:'running',stage:'github-update-base',elapsedMs:125000}]} as any;
 expect(displayAgentTask(agent,snapshot)).toBe(agent.task+' · 2m 5s elapsed');
 expect(displayAgentTask({...agent,task:displayAgentTask(agent,snapshot)},snapshot)).toBe(agent.task+' · 2m 5s elapsed');
 snapshot.workLog[0].elapsedMs=130000;expect(displayAgentTask(agent,snapshot)).toContain('2m 10s elapsed');
});
test('hour-long and stale task clocks replace their prior suffix without accumulating estimates',()=>{
 const agent={id:'developer',activity:'working',task:'GH-255 · Updating the candidate base · Waiting for required check results'} as any;
 const snapshot={workLog:[{role:'developer',status:'running',stage:'github-update-base',elapsedMs:4084000,timerStatus:'live'}]} as any;
 const formatted=displayAgentTask(agent,snapshot);
 expect(formatted).toBe(agent.task+' · 1h 8m 04s elapsed');
 expect(displayAgentTask({...agent,task:formatted},snapshot)).toBe(formatted);
 snapshot.workLog[0].timerStatus='last-confirmed';snapshot.workLog[0].elapsedMs=4083000;
 const stale=displayAgentTask({...agent,activity:'disconnected',task:'Connection lost. Last observed: '+formatted},snapshot);
 expect(stale).toBe('Connection lost. Last observed: '+agent.task+' · 1h 8m 03s elapsed · last confirmed');
 expect(displayAgentTask({...agent,activity:'disconnected',task:stale},snapshot)).toBe(stale);
});
