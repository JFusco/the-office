import { useLayoutEffect, useRef } from 'react';
import { OWNER } from '../contracts/people';
import type { OfficeSnapshot, Role } from '../shared';
import type { Selection } from '../scene/OfficeScene';
import { StatusDot, cardButtonIdle, cx, interactive } from '../ui';
import { hasDesk, personName } from './directory-view';
import type { OrgNode } from './org-tree';
import { ROSTER_AVATAR, rosterAvatar } from './person-avatar';
type ChartProps={snapshot:Pick<OfficeSnapshot,'agents'>;names:Record<Role,string>;onSelect:(selection:Selection)=>void};
const card='relative z-1 flex w-52 items-center gap-3 rounded-9 border p-3 text-left text-card-button-ink';
// Connectors are pseudo-element borders: each list drops a line from its manager, and each sibling
// draws half of the shared horizontal rail plus its own drop (the classic nested-list org chart).
const row='relative m-0 flex list-none justify-center p-0 pt-5 before:absolute before:top-0 before:left-1/2 before:h-5 before:border-l before:border-field-line';
const rowItem='relative flex flex-col items-center px-2 pt-5 before:absolute before:top-0 before:right-1/2 before:h-5 before:w-1/2 before:border-t before:border-field-line after:absolute after:top-0 after:left-1/2 after:h-5 after:w-1/2 after:border-t after:border-l after:border-field-line first:before:border-0 last:after:border-0 last:before:border-r only:pt-0 only:before:hidden only:after:hidden';
// Reports who manage no one stack in a column on a spine, so a growing team grows taller, not wider.
const stack='relative m-0 flex list-none flex-col items-center gap-3 p-0 pt-5 before:absolute before:top-0 before:bottom-4 before:left-1/2 before:border-l before:border-field-line';
function Person({node,snapshot,names,onSelect}:{node:OrgNode}&ChartProps){
  const agent=snapshot.agents.find(candidate=>candidate.id===node.id);
  if(!node.persona)return <div data-org-node={OWNER.id} className={cx(card,'border-card-line bg-card')}><span aria-hidden="true" data-initial={OWNER.name[0]} className={cx(rosterAvatar,'bg-user-avatar text-user-avatar-ink')}/><span className="grid gap-0.5"><strong className="text-13 font-heading">{OWNER.name}</strong><span className="text-11 text-muted">{OWNER.title}</span></span></div>;
  const persona=node.persona,name=personName(persona.id,snapshot,names),activity=agent?.activity??'disconnected';
  const content=<>
    <span aria-hidden="true" data-initial={name[0]} className={cx(rosterAvatar,ROSTER_AVATAR[persona.id])}/>
    <span className="grid min-w-0 gap-0.5"><strong className="text-13 font-heading">{name}</strong><span className="text-11 text-muted">{persona.title}</span><span className="flex items-center gap-1.5 text-10"><StatusDot status={activity}/>{activity}</span></span>
  </>;
  return hasDesk(persona.id,snapshot)?<button type="button" data-org-node={persona.id} className={cx(card,cardButtonIdle,interactive)} onClick={()=>onSelect({kind:'agent',id:persona.id})}>{content}</button>:<div data-org-node={persona.id} className={cx(card,'border-card-button-line bg-card-button')}>{content}</div>;
}
function Reports({node,...props}:{node:OrgNode}&ChartProps){
  if(!node.reports.length)return null;
  return <ul className={node.stack?stack:row}>{node.reports.map(report=><li key={report.id} className={node.stack?'relative':rowItem}><Person node={report} {...props}/><Reports node={report} {...props}/></li>)}</ul>;
}
/** Top-down org chart from the reporting tree. The nested lists carry the hierarchy for assistive technology. */
export function OrgChart({root,visible,...props}:{root:OrgNode;visible:boolean}&ChartProps){
  const scroller=useRef<HTMLDivElement>(null);
  // A chart wider than the drawer opens centered on the top of the hierarchy, not on its left edge.
  useLayoutEffect(()=>{const el=scroller.current;if(visible&&el)el.scrollLeft=(el.scrollWidth-el.clientWidth)/2;},[visible]);
  return <div ref={scroller} data-org-chart className="overflow-x-auto pb-4">
    <ul aria-label="Org chart" className="m-0 mx-auto flex w-max min-w-full list-none justify-center p-0 pt-2"><li className="flex flex-col items-center"><Person node={root} {...props}/><Reports node={root} {...props}/></li></ul>
  </div>;
}
