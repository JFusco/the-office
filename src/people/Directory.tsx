import { useId, useState } from 'react';
import type { OfficeSnapshot, Role } from '../shared';
import type { Selection } from '../scene/OfficeScene';
import { Count, SectionTitle, StatusDot, cardButton, cardButtonIdle, cx, fieldLabel, inputField } from '../ui';
import { directoryGroups, directoryRows, hasDesk } from './directory-view';
import { ROSTER_AVATAR, rosterAvatar } from './person-avatar';
/** Searchable employee directory, grouped by department. Selecting a person opens their agent drawer. */
export function Directory({snapshot,names,onSelect}:{snapshot:Pick<OfficeSnapshot,'agents'>;names:Record<Role,string>;onSelect:(selection:Selection)=>void}){
  const [query,setQuery]=useState('');
  const id=useId();
  const rows=directoryRows(snapshot,names);
  const groups=directoryGroups(rows,query);
  const shown=groups.reduce((total,group)=>total+group.rows.length,0);
  return <div data-directory>
    <label className={cx(fieldLabel,'max-w-96')}>Search people<input type="search" className={inputField} value={query} placeholder="Name, title or department" onChange={event=>setQuery(event.target.value)}/></label>
    <p className="mt-2 text-11 text-muted" aria-live="polite">{shown===rows.length?`${rows.length} people`:`${shown} of ${rows.length} people`}</p>
    {groups.length?groups.map(group=><section key={group.department} aria-labelledby={`${id}-${group.department}`} data-department={group.department}>
      <SectionTitle id={`${id}-${group.department}`} className="mt-6 mb-1">{group.label} <Count>{group.rows.length}</Count></SectionTitle>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-3 p-0">{group.rows.map(row=>{
        const content=<>
          <span className="flex items-center gap-3"><span aria-hidden="true" data-initial={row.name[0]} className={cx(rosterAvatar,ROSTER_AVATAR[row.id])}/><span className="grid gap-0.5"><strong className="text-13 font-heading">{row.name}</strong><span className="text-11 text-muted">{row.title}</span></span></span>
          <span className="text-11">Reports to {row.managerName}{row.directReports?` · ${row.directReports} direct ${row.directReports===1?'report':'reports'}`:''}</span>
          <span className="flex items-center gap-2 text-11"><StatusDot status={row.activity}/>{row.activity}{row.runtime?` · ${row.runtime}`:''}</span>
        </>;
        return <li key={row.id}>{hasDesk(row.id,snapshot)?<button type="button" data-person={row.id} className={cx(cardButton,cardButtonIdle)} onClick={()=>onSelect({kind:'agent',id:row.id})}>{content}</button>:<div data-person={row.id} className="my-2.5 flex w-full flex-col items-start gap-3 rounded-9 border border-card-button-line bg-card-button p-4 text-left text-card-button-ink">{content}</div>}</li>;
      })}</ul>
    </section>):<p className="mt-6 text-12 text-muted">No one matches “{query.trim()}”.</p>}
  </div>;
}
