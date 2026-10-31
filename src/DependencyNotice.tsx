import {deliveryLabel} from './work-summary';
import type {OfficeSnapshot} from './shared';
import {cx,interactive} from './ui';
export function DependencyNotice({keys,snapshot,onOpen,project=snapshot.project?.id||'cec'}:{keys:string[];snapshot:OfficeSnapshot;project?:string;onOpen:(project:string,key:string)=>void}){
 if(!keys.length)return null;
 return <div className="mt-2 mb-3.5 rounded-7 border border-l-3 border-dependency-line border-l-dependency-accent bg-dependency p-3 text-11 text-dependency-ink" role="note"><strong>Blocked by {keys.map((key,i)=><span key={key}>{i?', ':''}<button type="button" className={cx('rounded-3 font-heading text-dependency-link underline decoration-current underline-offset-3 hover:decoration-transparent',interactive)} onClick={()=>onOpen(project,key)}>{key}</button></span>)}</strong><p className="mt-1 text-11 leading-body">This work cannot start until {keys.length===1?'this prerequisite is':'these prerequisites are'} completed.</p>{keys.map(key=>{const job=snapshot.teamQueue?.find(row=>row.project===project&&row.job.key===key&&row.job.status!=='cancelled')?.job||(project===snapshot.project?.id?snapshot.coordination?.jobs?.find(job=>job.key===key&&job.status!=='cancelled'):undefined);return <small className="mt-1.5 block text-11 leading-relaxed" key={key}>{key}: {job?deliveryLabel(job):'Completion has not been verified.'}</small>;})}</div>;
}
