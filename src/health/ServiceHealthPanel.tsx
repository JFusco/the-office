import {useEffect,useState} from 'react';
import {HeartPulse,RefreshCw} from '../ui/icons';
import {Button,Notice,PanelIcon,PanelTitle,Section,SectionTitle,Tag,cx,mutedCopy,summary} from '../ui';
const next='mt-2.5 rounded-7 bg-health-next p-2.5 text-11 leading-body text-health-next-ink';
import type {HealthReport,ITFollowUp,ITState} from '../shared';
import {ServiceHealthRow} from './ServiceHealthRow';
import {currentServices} from './service-health-view';
export function ServiceHealthPanel({project='cec',liveIT,onChat}:{project?:string;liveIT?:ITState;onChat?:()=>void}){
 const [report,setReport]=useState<HealthReport|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[refresh,setRefresh]=useState(0);
 const it=liveIT&&(!report?.it||Date.parse(liveIT.checkedAt)>=Date.parse(report.it.checkedAt))?liveIT:report?.it,latest=it?.reports.at(-1);
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),15000);return()=>clearInterval(timer);},[]);
 const services=currentServices(report,it,now);
 const followUps=(latest?.followUps||[]).filter(f=>{
  const id=f.id.replace(/^(?:probe|login):/,''),service=services.find(s=>s.id===id);
  return !service||service.status!=='connected';
 });
 const human=followUps.filter(f=>f.owner==='You').length;
 const itLabel=human?'Needs your help':followUps.some(f=>f.owner==='Morgan')?'Team follow-up':followUps.length?'Follow-up pending':'Monitoring';
 const checked=services.filter(s=>s.status==='connected').length,unverified=services.filter(s=>s.status==='unknown').length,unavailable=services.filter(s=>s.status==='disconnected').length;
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError('');
  const deadline=setTimeout(()=>{setError('Health refresh timed out. Saved results retain their original timestamps; the Office will retry automatically.');setLoading(false);controller.abort();},75000);
  void fetch(`/api/service-health?project=${encodeURIComponent(project)}`,{signal:controller.signal}).then(async response=>{if(!response.ok)throw new Error('Service health checks are unavailable. The Office server may need the latest update.');return response.json() as Promise<HealthReport>;}).then(value=>{if(!controller.signal.aborted)setReport(value);}).catch(error=>{if(!controller.signal.aborted)setError(String(error));}).finally(()=>{clearTimeout(deadline);if(!controller.signal.aborted)setLoading(false);});
  return()=>{clearTimeout(deadline);controller.abort();};
 },[refresh,project]);
 useEffect(()=>{if(loading)return;const timer=setTimeout(()=>setRefresh(n=>n+1),60000);return()=>clearTimeout(timer);},[loading,project,refresh]);
 async function checkIT(){setLoading(true);setError('');try{const response=await fetch(`/api/commands?project=${encodeURIComponent(project)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check-it'})});if(!response.ok)throw new Error('IT check could not finish; refresh health to read the current state.');setRefresh(n=>n+1);}catch(e){setError(String(e));setLoading(false);}}
 function followUp(f:ITFollowUp){return <p className={next} key={f.id}><b>Next owner: {f.owner}</b><br/>{f.detail}</p>;}
 return <><PanelIcon><HeartPulse size={26}/></PanelIcon><PanelTitle className="mt-3 mb-4">Service health</PanelTitle><p className={mutedCopy}>Login checks, assignment polling, confirmed Slack activity, and public provider status. Each uses its own evidence and timestamp.</p>
  <div className="mt-5 flex flex-wrap gap-2">{onChat?<Button onClick={onChat}>Chat with Ellis</Button>:null}
  <Button disabled={loading} onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={14} className={cx(loading&&'animate-spin reduce-motion:animate-none')}/>{loading?'Checking connections…':'Refresh health'}</Button></div>
  {loading?<p className={cx(mutedCopy,'mt-3')} role="status">Checking login status and read access. Checks can take up to a minute; no model calls or login changes.</p>:null}
  {error?<Notice className="mt-5" role="alert">{error}</Notice>:null}
  {services.length?<p className="mt-3 text-12 leading-body">{checked} healthy or recently verified · {unverified} awaiting fresh evidence{unavailable?` · ${unavailable} login unavailable`:''}{services.some(s=>s.status==='warning')?' · Read checks need follow-up':''}</p>:null}
  {report?.readiness?.length?<Section><SectionTitle className="mb-4">Application readiness</SectionTitle>{report.readiness.map(item=><article key={item.projectId} className="my-3 text-12"><strong>{item.projectId} · {item.stall?'Dispatch needs attention':item.stopping.length?'Stopping workers':item.ownershipFresh?'Ownership inventory fresh':'Ownership inventory needs refresh'}</strong><p>{item.runnable} ready · {item.running} running · {item.waiting} waiting · {item.blocked} blocked · {item.publishingBacklog} time entries awaiting publication</p><p className={mutedCopy}>Provider observation: {item.providerAgeMs===null?'unavailable':`${Math.floor(item.providerAgeMs/1000)}s old`}. Ownership checked: {item.ownershipObservedAt?new Date(item.ownershipObservedAt).toLocaleString():'unavailable'}.</p></article>)}<p className={mutedCopy}>Daily CTO review: {report.dailyCTO?`${report.dailyCTO.date} · ${report.dailyCTO.status}`:'No report collected yet'}. Loaded revision: <code>{report.loadedHash?.slice(0,12)||'unavailable'}</code>.</p></Section>:null}
  {it?<section className="my-4.5 rounded-14 border border-it-line border-t-section-rule bg-it p-4" aria-label="Ellis IT specialist"><SectionTitle className="mb-4 justify-between gap-2.5">Ellis · IT specialist <Tag>{itLabel}</Tag></SectionTitle>
   <p className="leading-body">{human?`${human} confirmed access follow-up${human===1?' needs':'s need'} your help.`:followUps.length?'Ellis and Morgan own the remaining checks. No login action is requested from you.':'No current IT follow-up.'}</p>
   <Button className="mt-5" disabled={loading} onClick={()=>void checkIT()}>Check IT again</Button>
   {it.checkedAt?<p className={cx(mutedCopy,'mt-3')}>Last IT review {new Date(it.checkedAt).toLocaleString()}</p>:null}
   {followUps.filter(f=>!f.id.startsWith('probe:')&&!f.id.startsWith('login:')).map(followUp)}
   {latest?.actions.length?<p className={mutedCopy}>Last report ({new Date(latest.at).toLocaleString()}) recorded {latest.actions.length} operational action{latest.actions.length===1?'':'s'}. Report shared with the team.</p>:null}
  </section>:null}
  {services.length?<><p className={cx(mutedCopy,'mt-4')}>{report?.context||'Showing the latest saved checks while fresh checks finish.'}</p><div role="group" aria-label="Service connections">{services.map(service=><ServiceHealthRow key={service.id} service={service}/>)}</div></>:null}
  {it?.reports.length?<details className="mt-3.5 border-t border-it-rule pt-3.5 text-12"><summary className={cx(summary,'font-semibold')}>IT report history</summary><p className={mutedCopy}>Historical observations; current status is shown above.</p>{it.reports.slice(-4).reverse().map(r=><article className="mt-3.5 border-t border-it-rule pt-3.5" key={r.id}><strong className="block text-13 leading-normal">{r.summary}</strong>{r.actions.map((a,i)=><p key={i} className="text-12 leading-body"><span aria-hidden="true">✓</span><span className="sr-only">Done:</span> {a}</p>)}{r.followUps.map(followUp)}<small className="block text-11 leading-relaxed">{new Date(r.at).toLocaleString()} · Shared with the team</small></article>)}</details>:null}
 </>;
}
