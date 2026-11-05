import type {Agent,OfficeSnapshot} from '../shared';
import {itDiagnostics} from './it-diagnostics';
export function itAgent(snapshot:OfficeSnapshot,now=Date.now()):Agent{
 const saved=snapshot.agents.find(a=>a.id==='it');
 if(saved?.activity==='working')return saved;
 const it=snapshot.it,diagnostics=itDiagnostics(it,snapshot.project?.id||'cec',now);
 const task=!diagnostics.fresh?'Current IT diagnostics need a fresh check.':diagnostics.followUps.length?`${diagnostics.followUps.length} operational follow-up${diagnostics.followUps.length===1?'':'s'} remain.`:'No current IT follow-up.';
 return {...saved,id:'it',name:'Ellis',title:'IT specialist',activity:!diagnostics.fresh?'disconnected':diagnostics.status==='retrying'?'working':diagnostics.status==='needs-attention'?'blocked':'idle',task,ticket:'',sessionId:saved?.sessionId||'',lastSeen:it?.checkedAt||''};
}
