import type {Feature} from '../contracts/features';
import type {OfficeSnapshot} from '../shared';
import {interactive,summary} from '../ui';
export function FeatureDelivery({feature,snapshot}:{feature:Feature;snapshot?:OfficeSnapshot}){
 return <><h3 className="text-16 font-bold">Ordered ticket preview</h3><p>Approval includes the exact changes below.</p><ol>{feature.manifest?.items.map(item=>{
 const publication=feature.publication.find(p=>p.id===item.id),approval=feature.approvals.find(a=>a.id===(publication?.startedApprovalId||publication?.approvalId));
 const job=snapshot?.coordination?.jobs?.find(j=>j.id===publication?.ownerId),ticket=snapshot?.tickets.find(t=>t.key===publication?.key);
 return <li className="my-4" key={item.id}><h4 className="font-bold">{item.title}</h4>
 <p>{publication?.url?<a className={interactive+' text-link underline'} href={publication.url} target="_blank" rel="noreferrer">{publication.key}</a>:item.key||'New ticket'} · {job?job.stage+' · '+job.status:ticket?.pilot?ticket.stage:publication?.startedApprovalId?'Delivery started':publication?.verified?'Publication verified':'Awaiting publication'}</p>
 {approval&&<p>Approved feature revision {approval.featureRevision}{publication?.startedApprovalId?' · retained for started work':''}</p>}
 {job?.prUrl&&<a className={interactive+' text-link underline'} href={job.prUrl} target="_blank" rel="noreferrer">Pull request #{job.pr}</a>}
 {(job?.detail||ticket?.blocker)&&<p>{job?.detail||ticket?.blocker}</p>}
 <ul>{item.criteria.map(c=><li className="my-2" key={c}>{c}</li>)}</ul>
 {item.predecessor&&<p>Starts after verified completion of {feature.manifest?.items.find(i=>i.id===item.predecessor)?.title}.</p>}
 {job?.steps.filter(s=>['review','validate','ci'].includes(s.stage)).slice(-3).map((s,i)=><p key={i}>{s.stage}: {s.result.outcome} · {s.result.summary}</p>)}
 <details><summary className={summary}>Exact provider changes</summary><pre className="whitespace-pre-wrap break-words text-11">{JSON.stringify(item.operations,null,2)}</pre></details>
 </li>;
 })}</ol>{!feature.manifest&&<p>The technical plan will propose the ticket breakdown.</p>}</>;
}
