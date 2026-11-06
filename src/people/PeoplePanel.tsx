import { useId, useState, type KeyboardEvent } from 'react';
import { DEPARTMENTS, PERSONAS } from '../contracts/people';
import type { OfficeSnapshot, Role } from '../shared';
import type { Selection } from '../scene/OfficeScene';
import { Notice, PanelTitle, cx, interactive, mutedCopy, noticeIcon } from '../ui';
import { AlertCircle } from '../ui/icons';
import { Directory } from './Directory';
import { OrgChart } from './OrgChart';
import { buildOrgTree } from './org-tree';
const TABS=[['directory','Directory'],['org-chart','Org chart']] as const;
type Tab=typeof TABS[number][0];
const STORAGE_KEY='office.people.tab';
function savedTab():Tab{try{return globalThis.localStorage?.getItem(STORAGE_KEY)==='org-chart'?'org-chart':'directory';}catch{return 'directory';}}
/** The People drawer: the employee directory and the org chart, both projected from the persona registry. */
export function PeoplePanel({snapshot,names,onSelect,initialTab}:{snapshot:Pick<OfficeSnapshot,'agents'>;names:Record<Role,string>;onSelect:(selection:Selection)=>void;initialTab?:Tab}){
  const [tab,setTab]=useState<Tab>(()=>initialTab??savedTab());
  const id=useId();
  const personas=Object.values(PERSONAS);
  const tree=buildOrgTree(personas);
  const departments=new Set(personas.map(persona=>persona.department)).size;
  const choose=(next:Tab)=>{setTab(next);try{globalThis.localStorage?.setItem(STORAGE_KEY,next);}catch{/* The tab is a convenience; storage may be unavailable. */}};
  const keys=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?TABS.length-1:(index+(event.key==='ArrowRight'?1:TABS.length-1))%TABS.length;
    choose(TABS[next][0]);document.getElementById(`${id}-${TABS[next][0]}`)?.focus();
  };
  return <div data-people>
    <PanelTitle size="md" className="mb-2">People</PanelTitle>
    <p className={mutedCopy}>{personas.length} employees across {departments} departments ({Object.values(DEPARTMENTS).sort((a,b)=>a.order-b.order).map(department=>department.label).join(', ')}). Select anyone to open their desk.</p>
    {tree.problems.length?<Notice className="mt-4" role="alert"><AlertCircle size={15} className={noticeIcon}/><span>{tree.problems.join(' ')}</span></Notice>:null}
    <div className="mt-5 flex gap-2" role="tablist" aria-label="People views">{TABS.map(([value,label],index)=><button key={value} type="button" role="tab" id={`${id}-${value}`} aria-controls={`${id}-${value}-panel`} aria-selected={tab===value} tabIndex={tab===value?0:-1} className={cx(interactive,'rounded-6 border border-drawer-line px-3 py-2 text-11 aria-selected:bg-roster-hover aria-selected:font-emphasis')} onClick={()=>choose(value)} onKeyDown={event=>keys(event,index)}>{label}</button>)}</div>
    <div id={`${id}-directory-panel`} role="tabpanel" aria-labelledby={`${id}-directory`} className="mt-5" hidden={tab!=='directory'}><Directory snapshot={snapshot} names={names} onSelect={onSelect}/></div>
    <div id={`${id}-org-chart-panel`} role="tabpanel" aria-labelledby={`${id}-org-chart`} className="mt-5" hidden={tab!=='org-chart'}><OrgChart root={tree.root} visible={tab==='org-chart'} snapshot={snapshot} names={names} onSelect={onSelect}/></div>
  </div>;
}
