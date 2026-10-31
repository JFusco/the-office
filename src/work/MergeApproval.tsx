import {useState} from 'react';
import type {OfficeSnapshot,TicketJob} from '../shared';
import {Button,SectionTitle,TextLink,errorText} from '../ui';
export function MergeApproval({snapshot,job}:{snapshot:OfficeSnapshot;job:TicketJob}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 if(!job.mergeApprovalRequired)return null;
 async function approve(){
  setBusy(true);setError('');
  try{
   const response=await fetch(`/api/commands?project=${encodeURIComponent(snapshot.project?.id||'cec')}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve-merge',key:job.key,head:job.head})});
   if(!response.ok){const body=await response.json();throw new Error(body.error||'Approval could not be verified. Refresh the current PR before trying again.');}
  }catch(e){setError(String(e));}finally{setBusy(false);}
 }
 return <section className="my-3.5 rounded-12 border border-merge-line border-t-section-rule bg-merge p-4"><SectionTitle className="mb-4">Approve this reviewed PR</SectionTitle><p className="leading-body">Sam’s review passed for PR #{job.pr}, commit <code className="text-11 break-all">{job.head.slice(0,10)}</code>. The Office will recheck the current PR and required checks before merging.</p><TextLink href={job.prUrl} target="_blank" rel="noreferrer">Review PR #{job.pr} ↗</TextLink><Button variant="primary" className="mt-3 flex" disabled={busy||snapshot.paused||snapshot.mode==='demo'} onClick={()=>void approve()}>{busy?'Recording approval…':`Approve merge of PR #${job.pr}`}</Button>{error?<p className={errorText} role="alert">{error}</p>:null}</section>;
}
