import type {OfficeSnapshot} from '../shared';
import {shortSummary,maintenanceIssue} from './work-summary';

const ACTIVE=['working','blocked','interrupted','queued'];

/** The latest maintenance run as a Team updates row: live while it runs, its outcome once it completes. */
export function maintenanceUpdate(snapshot:OfficeSnapshot){
 const run=snapshot.maintenance?.runs.at(-1);
 // Only a verified Brain run reports its outcome; gate refusals (`skipped: …`) did no work and CMS runs keep their existing view.
 const completed=run?.status==='completed'&&run.stage==='brain-completed';
 if(!run||!completed&&!ACTIVE.includes(run.status))return undefined;
 // Completion renames the stage, and checkpoint read-backs may append later steps: the outcome lives on the Brain run step.
 const outcome=completed?run.steps.filter(step=>step.stage==='brain-maintenance').at(-1):run.steps.at(-1);
 const key=maintenanceIssue(completed?{...run,stage:'brain-maintenance'}:run,snapshot.project?.repository||'');
 if(!key)return undefined;
 const retrying=!!run.readbackRetry&&!run.readbackRetry.exhausted,stopped=['blocked','interrupted'].includes(run.status);
 return {key,
  title:completed?'Nightly maintenance':snapshot.github?.issues.find(i=>i.key===key)?.title||'Project maintenance',
  status:retrying&&!completed?'queued':run.status,
  phase:completed?'Maintenance complete':retrying?'Recovery queued for Morgan':stopped?'Maintenance stopped':'Project maintenance',
  summary:shortSummary(outcome?.result.summary||run.error||'Maintenance is queued.',240),
  next:completed?'Finished. Open the issue for the run’s saved evidence.':stopped?'Next needed: Morgan reconciles the failed sources and catalog changes. Preserve the native retry gate; no automatic publication.':'Morgan coordinates maintenance through the project’s native gate.',
  at:run.endedAt||run.startedAt||run.requestedAt};
}
