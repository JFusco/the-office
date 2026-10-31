import type {Agent,OfficeSnapshot} from '../shared';
export function itAgent(snapshot:OfficeSnapshot,now=Date.now()):Agent{
 const saved=snapshot.agents.find(a=>a.id==='it');
 if(saved?.activity==='working')return saved;
 const it=snapshot.it,stale=!it?.checkedAt||now-Date.parse(it.checkedAt)>150000;
 return {...saved,id:'it',name:'Ellis',title:'IT specialist',activity:stale?'disconnected':it.status==='retrying'?'working':it.status==='needs-attention'?'blocked':'idle',task:it?.reports.at(-1)?.summary||'Waiting for a connection check',ticket:'',sessionId:saved?.sessionId||'',lastSeen:it?.checkedAt||''};
}
