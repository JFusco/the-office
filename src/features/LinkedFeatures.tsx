import {useState} from 'react';
import type {Feature} from '../contracts/features';
import type {OfficeSnapshot} from '../shared';
import {Button,field,fieldFocus,Select,interactive} from '../ui';
export function LinkedFeatures({feature,projects,send,onOpen}:{feature:Feature;projects:OfficeSnapshot['projects'];send:(action:string,values:Record<string,unknown>)=>Promise<boolean>;onOpen:(project:string,id:string)=>void}){
 const [project,setProject]=useState(feature.projectId),[id,setId]=useState('');
 return <details className="mt-4"><summary className={interactive}>Linked features</summary>
 <p>Each feature keeps its own project, approval and delivery.</p><ul>{feature.links?.map(link=><li key={link.projectId+link.id}><button className={interactive+' text-link underline'} onClick={()=>onOpen(link.projectId,link.id)}>{link.title} · {link.projectId}</button></li>)}</ul>
 <form className="mt-3 grid gap-2" onSubmit={async e=>{e.preventDefault();if(await send('link',{projectId:project,featureId:id}))setId('');}}>
 <label>Owning project<Select value={project} onChange={e=>setProject(e.target.value)}>{projects?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></label>
 <label>Feature ID<input className={field+' '+fieldFocus+' rounded-6 p-2'} required value={id} onChange={e=>setId(e.target.value)}/></label><Button type="submit">Link feature</Button></form><p className="mt-2 break-all text-11">This feature: {feature.id}</p>
 </details>;
}
