import {DailyCTO,GoalHistory} from './DailyCTO';
import {SaveFeedback} from '../office/SaveFeedback';
import { useRef, useState } from 'react';
import { Plus, ArrowUpRight, MessageCircle } from '../ui/icons';
import { Button, PanelIcon, PanelTitle, Section, SectionTitle, Count, Select, cx, field, fieldFocus, interactive, eyebrow, mutedCopy } from '../ui';
const goalLabel='my-3 flex flex-col gap-1.5 text-12';
const goalInput=cx(field,fieldFocus,'rounded-6 bg-field p-2.5');
const goalSelect='rounded-6 border-goal-select-line bg-field p-2.5';
import { officeUrl } from '../shared';
import type { OfficeSnapshot, ProjectGoal } from '../shared';
import type { SendMessage } from '../conversations/Conversation';
const blank=(project='')=>({id:crypto.randomUUID() as string,expectedUpdatedAt:'',project,title:'',detail:'',priority:3 as ProjectGoal['priority'],status:'idea' as ProjectGoal['status']});
export function Goals({snapshot,sendMessage,onDiscuss}:{snapshot:OfficeSnapshot;sendMessage:SendMessage;onDiscuss:()=>void}){
  const projects=snapshot.projects?.length?snapshot.projects:snapshot.project?[snapshot.project]:[];
  const currentProject=projects.find(project=>project.id===snapshot.project?.id)||projects[0];
  const [draft,setDraft]=useState(()=>blank(currentProject?.name)),[projectId,setProjectId]=useState(()=>currentProject?.id||'');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(''),[unmapped,setUnmapped]=useState(false);
  const owningProject=useRef('');
  const editing=!!draft.expectedUpdatedAt;
  const selectedProject=projects.find(project=>project.id===(editing?owningProject.current:projectId));
  const needsMapping=editing&&(unmapped||!selectedProject);
  function resetDraft(){owningProject.current='';setUnmapped(false);setProjectId(currentProject?.id||'');setDraft(blank(currentProject?.name));}
  function edit(goal:ProjectGoal){
    owningProject.current=goal.projectId||'';setUnmapped(goal.mapping==='unmapped');
    setDraft({id:goal.id,expectedUpdatedAt:goal.updatedAt,project:goal.project,title:goal.title,detail:goal.detail,priority:goal.priority,status:goal.status});setSaved('');setError('');
  }
  const reportId=useRef<string|null>(null);
  const goals=[...(snapshot.ctoGoals?.length?snapshot.ctoGoals:snapshot.goals||[])].sort((a,b)=>Number(a.status==='done')-Number(b.status==='done')||a.priority-b.priority||a.title.localeCompare(b.title));
  async function save(){
    setBusy(true);setError('');setSaved('');
    try{
      if(!selectedProject||needsMapping)throw new Error('Choose a configured Office project for this goal');
      const payload={...draft,project:editing?draft.project:selectedProject.name};
      const response=await fetch(officeUrl('/api/goals',selectedProject.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save the goal');
      resetDraft();setSaved('Goal saved.');
    }catch(e){setError(String(e));}finally{setBusy(false);}
  }
  async function report(){setBusy(true);setError('');reportId.current??=crypto.randomUUID();try{await sendMessage({id:reportId.current,role:'pm',ticket:'',actionId:'',body:`Please prepare a delivery report for the CTO Office from the current observed ${snapshot.project?.name||'CEC'} issues, checks, blockers and deployments, and hand it to the CTO Office for review against our project goals and priorities. Distinguish verified results from work still waiting. No Slack messages or external changes.`,recheck:false});setSaved('Morgan’s report is queued. The CTO Office will review it when a desk is free.');reportId.current=null;}catch(e){setError(String(e));}finally{setBusy(false);}}
  return <><PanelIcon tone="review"><MessageCircle size={25}/></PanelIcon><PanelTitle className="mt-3 mb-4">Goals & ideas</PanelTitle><p className={mutedCopy}>Goals and ideas across Office projects: what we want to build, why it matters, and what comes first.</p>
    <div className="my-3.5 flex flex-wrap gap-2"><Button className="text-12" onClick={onDiscuss}>Talk to Avery <ArrowUpRight size={14}/></Button><Button className="text-12" disabled={busy||snapshot.mode==='demo'} onClick={()=>void report()}>Request delivery report</Button></div>
    <Section><SectionTitle className="mb-4">Project priorities <Count>{goals.length}</Count></SectionTitle>{!goals.length?<div className="flex gap-3 text-11 text-empty"><p className="leading-body">No goals recorded yet. Start with an idea or a project outcome you want the team to work toward.</p></div>:goals.map(g=><button type="button" className={cx('my-2.5 flex w-full flex-col gap-2 rounded-8 border border-l-3 border-goal-line bg-goal p-4 text-left enabled:hover:border-goal-hover-line enabled:hover:bg-goal-hover',g.priority===1?'border-l-goal-first':'border-l-goal-rank',interactive)} key={`${g.projectId}:${g.id}`} disabled={busy||snapshot.mode==='demo'} onClick={()=>edit(g)}><span className={cx(eyebrow,'text-9')}>{g.project} · {['','First','Next','Later','Someday'][g.priority]} · {g.status}</span><strong className="text-14">{g.title}</strong><span className="text-12 leading-relaxed whitespace-pre-wrap">{g.detail}</span>{g.progress?.note?<span className="text-12 leading-relaxed">Avery: {g.progress.note}</span>:null}{g.mapping==='unmapped'?<small>Project mapping needs review · owned by {g.projectId}</small>:null}<small className="block text-10 leading-relaxed text-goal-detail">Updated {new Date(g.updatedAt).toLocaleString()} · select to edit</small></button>)}</Section>
    <form className="mt-6" onSubmit={e=>{e.preventDefault();void save();}}><SectionTitle className="mb-4">{draft.expectedUpdatedAt?'Edit goal':'Add a goal or idea'}</SectionTitle><label className={goalLabel}>Project<Select aria-label="Project" className={goalSelect} value={needsMapping?'unmapped':selectedProject?.id||''} required disabled={busy||snapshot.mode==='demo'||editing} onChange={e=>{setProjectId(e.target.value);const project=projects.find(project=>project.id===e.target.value);setDraft({...draft,project:project?.name||''});}}>
      <option value="" disabled>Choose a configured project</option>
      {needsMapping?<option value="unmapped" disabled>{draft.project} · project mapping needs review</option>:null}
      {projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}
    </Select></label>{editing?<p className={mutedCopy}>{needsMapping?'Project mapping needs review before this goal can be saved.':'Saved goals stay with their owning project.'}</p>:null}<label className={goalLabel}>Goal<input className={goalInput} value={draft.title} maxLength={200} required disabled={busy||snapshot.mode==='demo'} onChange={e=>setDraft({...draft,title:e.target.value})}/></label><label className={goalLabel}>Why it matters<textarea className={goalInput} value={draft.detail} maxLength={6000} rows={3} disabled={busy||snapshot.mode==='demo'} onChange={e=>setDraft({...draft,detail:e.target.value})}/></label><div className="grid grid-cols-2 gap-3"><label className={goalLabel}>Priority<Select aria-label="Priority" className={goalSelect} value={draft.priority} disabled={busy||snapshot.mode==='demo'} onChange={e=>setDraft({...draft,priority:Number(e.target.value) as ProjectGoal['priority']})}><option value={1}>First</option><option value={2}>Next</option><option value={3}>Later</option><option value={4}>Someday</option></Select></label><label className={goalLabel}>State<Select aria-label="State" className={goalSelect} value={draft.status} disabled={busy||snapshot.mode==='demo'} onChange={e=>setDraft({...draft,status:e.target.value as ProjectGoal['status']})}>{['idea','planned','active','blocked','done'].map(s=><option key={s} value={s}>{s}</option>)}</Select></label></div><div className="my-3.5 flex flex-wrap gap-2"><Button type="submit" variant="primary" className="text-12" disabled={busy||snapshot.mode==='demo'||!selectedProject||needsMapping}><Plus size={14}/>{draft.expectedUpdatedAt?'Save changes':'Save goal'}</Button>{draft.expectedUpdatedAt?<Button className="text-12" onClick={resetDraft}>Cancel edit</Button>:null}</div></form>
    {draft.expectedUpdatedAt?<GoalHistory key={`${owningProject.current}:${draft.id}`} projectId={owningProject.current} goalId={draft.id}/>:null}<DailyCTO snapshot={snapshot}/>
    <SaveFeedback message={error||saved} error={!!error} pending={busy}/>
    <Section><SectionTitle className="mb-4">Reports from Delivery</SectionTitle>{(snapshot.leadershipReports||[]).length?(snapshot.leadershipReports||[]).slice(-8).reverse().map(r=><article className="my-3 rounded-8 bg-report p-4" key={r.id}><small className="block text-11 leading-relaxed">{new Date(r.createdAt).toLocaleString()} · {r.ticket||'CEC'}</small><p className="mt-1.5 text-12 leading-body whitespace-pre-wrap">{r.summary}</p><button type="button" className={cx('-mx-2 flex w-[calc(100%+16px)] justify-between rounded-5 border-b border-row-rule px-2 py-2.5 text-left text-11 hover:bg-icon-hover',interactive)} onClick={onDiscuss}>View the CTO conversation <ArrowUpRight size={13}/></button></article>):<p className={mutedCopy}>Morgan’s delivery reports and blockers will arrive here.</p>}</Section><p className={cx(mutedCopy,'mt-4')}>Goals and priorities are saved locally and guide future delivery plans. Jira changes still follow the ticket workflow.</p></>;
}
