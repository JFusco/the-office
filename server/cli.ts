import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { PORT } from './config';
const [cmd,...rawArgs]=process.argv.slice(2);const projectIndex=rawArgs.indexOf('--project');const project=projectIndex>=0?rawArgs[projectIndex+1]:'cec';if(!project)throw new Error('--project requires a project ID');const args=rawArgs.filter((_,i)=>i!==projectIndex&&i!==projectIndex+1||projectIndex<0);const key=args.find(arg=>!arg.startsWith('--'));
const scoped=(path:string)=>`${path}${path.includes('?')?'&':'?'}project=${encodeURIComponent(project)}`;
const commands:Record<string,string>={intake:'check-mail',pause:'pause',resume:'resume',pilot:'start-pilot',continue:'resume-ticket',azure:'refresh-azure',activate:'activate-nightly',maintenance:'maintenance',checkpoints:'activate-checkpoints',review:'review-assignment'};
const base=`http://127.0.0.1:${PORT}`;
try{
  if(cmd==='projects'){console.log(JSON.stringify(await(await fetch(`${base}/api/projects`)).json(),null,2));}
  else if(cmd==='outbox'){const r=await fetch(`${base}${scoped("/api/office")}`);const s=await r.json();console.log(JSON.stringify(s.outbox.filter((a:any)=>a.status==='open'),null,2));}
  else if(cmd==='chat'||cmd==='reply'){
    const option=(flag:string)=>{const index=args.indexOf(flag);return index<0?'':args[index+1]||'';};
    const s=await (await fetch(`${base}${scoped("/api/office")}`)).json();
    const action=cmd==='reply'?s.outbox.find((a:any)=>a.id===args[0]):null;
    if(cmd==='reply'&&!action)throw new Error('Outbox item not found; use pnpm office outbox for item IDs');
    const file=option('--file');const body=file?await readFile(file,'utf8'):await new Response(Readable.toWeb(process.stdin) as ReadableStream).text();
    const id=option('--id')||crypto.randomUUID();
    const r=await fetch(`${base}${scoped("/api/messages")}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,role:'pm',ticket:action?.ticket||option('--ticket'),actionId:action?.id||'',body,recheck:args.includes('--recheck')})});
    console.log(JSON.stringify(await r.json(),null,2));if(!r.ok)process.exitCode=1;
    else if(args.includes('--wait')){
      const deadline=Date.now()+45*60*1000;const seen=new Set<string>();let complete=false;
      while(Date.now()<deadline){await sleep(2000);const state=await(await fetch(`${base}${scoped("/api/office")}`)).json();
        for(const m of state.messages.filter((m:any)=>m.requestId===id&&m.from!=='human'))if(!seen.has(m.id)){seen.add(m.id);console.log(JSON.stringify(m,null,2));}
        const request=state.messages.find((m:any)=>m.id===id);
        if(request&&['answered','failed','interrupted'].includes(request.status)){complete=true;console.log(JSON.stringify({id,status:request.status,error:request.error},null,2));if(request.status!=='answered')process.exitCode=1;break;}
      }
      if(!complete){console.error(`Still waiting. Request ${id} is saved; do not resubmit with a new ID.`);process.exitCode=1;}
    }
  }
  else if(cmd==='time'){const key=args[0]||'';const response=await fetch(`${base}${scoped(`/api/time?ticket=${encodeURIComponent(key)}`)}`);console.log(JSON.stringify(await response.json(),null,2));if(!response.ok)process.exitCode=1;}
  else if(cmd==='status'){const r=await fetch(`${base}${scoped("/api/office")}`);console.log(JSON.stringify(await r.json(),null,2));}
  else if(commands[cmd]){
    const r=await fetch(`${base}${scoped("/api/commands")}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:commands[cmd],key,scheduled:args.includes('--scheduled'),authorization:args.includes('--authorized-handover')?'user-directed-handover-2026-10-27':undefined})});
    const body=await r.json();console.log(JSON.stringify(body,null,2));if(!r.ok)process.exitCode=1;
    else if(cmd==='maintenance'&&args.includes('--wait')){
      const id=body.run.id,deadline=Date.now()+8*60*60*1000;let finished=false;
      while(Date.now()<deadline){const state=await(await fetch(`${base}${scoped('/api/office')}`)).json();const run=state.maintenance?.runs.find((r:any)=>r.id===id);if(run&&!['queued','working'].includes(run.status)){finished=true;console.log(JSON.stringify({run,ledger:state.maintenance.ledger},null,2));if(run.status!=='completed')process.exitCode=1;break;}await sleep(5000);}
      if(!finished){console.error(`Maintenance ${id} is still saved; do not submit a duplicate.`);process.exitCode=1;}
    }
    else if(cmd==='intake'&&args.includes('--wait')){
      const deadline=Date.now()+8*60*60*1000;let revision=-1;
      while(Date.now()<deadline){await sleep(5000);const s=await (await fetch(`${base}${scoped("/api/office")}`)).json();
        if(s.revision!==revision){revision=s.revision;console.log(JSON.stringify({at:s.serverTime,intake:s.intake.status,dispatching:!!s.nightlyDispatching,active:s.agents.filter((a:any)=>a.activity==='working').map((a:any)=>({role:a.id,ticket:a.ticket,task:a.task}))}));}
        if(s.intake.status!=='working'&&!s.pendingMail&&!s.nightlyDispatching&&!s.deliveryQueue?.some((r:any)=>['queued','working'].includes(r.status))&&!s.agents.some((a:any)=>a.activity==='working')){console.log(JSON.stringify({outcome:s.intake.error?'blocked':s.tickets.length?'completed-or-waiting':'no-eligible-tickets',intake:s.intake,tickets:s.tickets.map((t:any)=>({key:t.key,stage:t.stage,activity:t.activity,blocker:t.blocker,prId:t.prId,commit:t.commit})),azureObservedAt:s.azure.observedAt},null,2));if(s.intake.error)process.exitCode=1;break;}
      }
    }
  }
  else {console.log('The Office · add --project cms-field-vocabulary to select CMS\n\n  pnpm office projects\n  pnpm office maintenance --project cms-field-vocabulary --scheduled --wait\n  pnpm office status\n  pnpm office outbox\n  pnpm office time [CEC-123]\n  pnpm office chat --file message.txt [--ticket CEC-123] --wait\n  pnpm office reply ITEM_ID --file reply.txt --recheck --wait\n  pnpm office intake\n  pnpm office pilot CEC-123\n  pnpm office continue CEC-123\n  pnpm office pause | resume | azure\n\nStart the service first: pnpm start');process.exitCode=cmd?1:0;}
}catch(e){console.error(`Office request failed at ${base}: ${String(e)}`);process.exitCode=1;}
