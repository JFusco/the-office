import { OWNER, PERSONAS, type EmployeeId } from '../contracts/people';
import type { OfficeSnapshot, Role } from '../shared';
import type { Selection } from '../scene/OfficeScene';
import { Section, SectionTitle, linkClass, mutedCopy } from '../ui';
import { hasDesk, personName } from './directory-view';
/** The agent drawer's reporting line: manager and direct reports, each opening their own drawer. */
export function ReportsTo({id,snapshot,names,onSelect}:{id:EmployeeId;snapshot:Pick<OfficeSnapshot,'agents'>;names:Record<Role,string>;onSelect:(selection:Selection)=>void}){
  const manager=PERSONAS[id].reportsTo;
  const reports=Object.values(PERSONAS).filter(persona=>persona.reportsTo===id);
  const person=(target:EmployeeId)=>hasDesk(target,snapshot)?<button type="button" className={linkClass} onClick={()=>onSelect({kind:'agent',id:target})}>{personName(target,snapshot,names)}</button>:<span>{personName(target,snapshot,names)}</span>;
  return <Section data-reports-to>
    <SectionTitle className="mb-4">Reporting line</SectionTitle>
    <p className={mutedCopy}>Reports to {manager===OWNER.id?<strong>{OWNER.name}</strong>:person(manager)}</p>
    {reports.length?<p className={mutedCopy}>Direct reports: {reports.map((report,index)=><span key={report.id}>{index?', ':''}{person(report.id)}</span>)}</p>:null}
  </Section>;
}
