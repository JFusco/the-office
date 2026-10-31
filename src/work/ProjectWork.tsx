import {DependencyNotice} from './DependencyNotice';
import {prerequisiteKeys} from './pm-queue';
import { deliveryLabel } from './work-summary';
import type {OfficeSnapshot} from '../shared';
import {Section,SectionTitle,cx,envelopeCard,errorText,eyebrow,mutedCopy,summary} from '../ui';
export function projectRows(s:OfficeSnapshot){
 const github=s.project?.provider==='github';
 const rows=github?(s.github?.board?.items||[]).filter(i=>i.repository===s.project?.repository).map(i=>({key:`GH-${i.number}`,title:i.title,lane:i.status,state:i.state})):s.tickets.map(t=>({key:t.key,title:t.summary,lane:t.status,state:t.status}));
 if(github)for(const t of s.tickets)if(t.status==='open'&&!rows.some(r=>r.key===t.key))rows.push({key:t.key,title:t.summary,lane:s.github?.board&&!s.github.board.error?'Not on board':'Board lane unavailable',state:t.status});
 return rows.map(row=>{
  const job=s.coordination?.jobs?.find(j=>j.key===row.key&&j.status!=='cancelled'),review=s.coordination?.listener.reviews.slice().reverse().find(r=>r.key===row.key);
  const pr=job?.pr||s.github?.prs.find(p=>p.linkedIssues?.includes(Number(row.key.slice(3))))?.number;
  return {...row,pr,blockedBy:review?prerequisiteKeys(review):[],office:job?deliveryLabel(job):review?prerequisiteKeys(review).length?`Waiting for ${prerequisiteKeys(review).join(', ')}`:`Intake · ${review.status}`:'Not started in the Office'};
 });
}
export function ProjectWork({snapshot,onOpen}:{snapshot:OfficeSnapshot;onOpen:(key:string)=>void}){
 const rows=projectRows(snapshot),github=snapshot.project?.provider==='github',lanes=[...new Set([...(github?snapshot.github?.board?.lanes||[]:[]),...rows.map(r=>r.lane)])];
 const openPRs=github?snapshot.github?.prs.filter(p=>p.state==='open').length:snapshot.azure.prs.filter(p=>p.status==='active').length;
 return <Section aria-label="Project source statuses"><SectionTitle className="mb-4">{github?'GitHub project lanes':'Jira statuses'}</SectionTitle><p className={mutedCopy}>{openPRs||0} open PRs · {github?'Board lane, issue state, and Office delivery are shown separately.':'Current Jira statuses for tracked parent tickets assigned to you. Office intake does not reset them to To Do.'}</p>{github&&snapshot.github?.board?.error?<p className={errorText}>{snapshot.github.board.error}</p>:null}{lanes.map(lane=>{const items=rows.filter(r=>r.lane===lane);return <details key={lane} className="my-3.5 border-t border-line pt-3" open={['Ready','To Do','In progress','In Progress','In review','In Review'].includes(lane)}><summary className={cx(summary,'mb-3 text-13 font-heading')}>{lane} · {items.length}</summary>{items.map(r=><article key={r.key}><button type="button" className={envelopeCard} onClick={()=>onOpen(r.key)}><span className={cx(eyebrow,'text-8 text-envelope-label')}>{r.key}{github?` · ${r.state.toLowerCase()}`:''}</span><strong className="max-w-57.5 text-13 leading-relaxed font-emphasis">{r.title}</strong><small className="mt-2 block text-11 leading-relaxed">{r.pr?`PR #${r.pr} · `:''}{r.office}</small></button><DependencyNotice keys={r.blockedBy} snapshot={snapshot} onOpen={(_project,key)=>onOpen(key)}/></article>)}</details>;})}{!rows.length?<p className={mutedCopy}>No source records observed yet.</p>:null}</Section>;
}
