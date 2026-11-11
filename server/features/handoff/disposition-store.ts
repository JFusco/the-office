import { randomUUID } from 'node:crypto';
import type { FeatureEvidenceRef } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { FEATURE_PLANNING } from '../../office/config';
import { featurePolicy } from '../progression/policy';

export const ASSESSMENT_DEADLINE_MS = 10 * 60_000;
export type AssessmentOutcome = 'ordinary-by-release' | 'ordinary-by-model' | 'ordinary-by-rule' | 'ordinary-by-start' | 'ordinary-by-admission' | 'ordinary-by-deadline' | 'ordinary-by-unavailable' | 'planning-enrolled' | 'departed';
export interface AssessmentResult {
 disposition: 'ordinary' | 'planning'; rationale: string; requirements: string[]; acceptanceCriteria: string[]; settledDecisions: string[]; openQuestions: string[];
 imageObservations: { evidenceId: string; observation: string }[];
}
export interface AssessmentEpisode {
 id: string; projectId: string; key: string; openedAt: string; eligibleAt?: string; departedAt?: string; closedAt?: string; outcome?: AssessmentOutcome;
 disposition: 'pending' | 'ordinary' | 'planning' | 'unavailable'; generation: number; providerVersion: string; evidence?: FeatureEvidenceRef;
 policyDigest: string; enqueuedAt: string; attempts: number; nextAt?: string; startedAt?: string; attemptId?: string; recoveredAttemptId?: string;
 reason: string; featureId?: string; result?: AssessmentResult; decidedBy?: 'harness' | 'pm'; rule?: string; observedFields?: unknown;
}
export function assessmentEnabled(store: Store) { return featurePolicy(store.project.id, FEATURE_PLANNING).assessment.enabled; }
export function assessmentEpisodes(store: Store): AssessmentEpisode[] {
 return (store.db.prepare('SELECT body FROM feature_assessments WHERE project_id=? ORDER BY rowid').all(store.project.id) as {body:string}[]).map(r=>JSON.parse(r.body));
}
export function assessmentEpisode(store: Store, id: string): AssessmentEpisode | undefined {
 const row=store.db.prepare('SELECT body FROM feature_assessments WHERE project_id=? AND id=?').get(store.project.id,id) as {body:string}|undefined;
 return row&&JSON.parse(row.body);
}
export function latestAssessment(store: Store, key: string): AssessmentEpisode | undefined {
 const row=store.db.prepare('SELECT body FROM feature_assessments WHERE project_id=? AND ticket_key=? ORDER BY rowid DESC LIMIT 1').get(store.project.id,key) as {body:string}|undefined;
 return row&&JSON.parse(row.body);
}
export function saveAssessment(store: Store, episode: AssessmentEpisode) {
 if(episode.projectId!==store.project.id) throw new Error('Assessment belongs to another project');
 store.db.prepare('INSERT INTO feature_assessments(id,project_id,ticket_key,body) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(episode.id,episode.projectId,episode.key,JSON.stringify(episode));
}
export function openAssessment(store: Store, key: string, providerVersion: string, eligible: boolean, now=store.clock.now()): AssessmentEpisode {
 const at=now.toISOString();
 const episode:AssessmentEpisode={id:randomUUID(),projectId:store.project.id,key,openedAt:at,...(eligible?{eligibleAt:at}:{}),disposition:'pending',generation:0,providerVersion,
 policyDigest:featurePolicy(store.project.id,FEATURE_PLANNING).digest,enqueuedAt:at,attempts:0,reason:'Waiting for ticket evidence capture'};
 saveAssessment(store,episode);return episode;
}
export function closeAssessment(store: Store, episode: AssessmentEpisode, outcome: AssessmentOutcome, now=store.clock.now(), reason=episode.reason) {
 if(episode.closedAt)return;
 episode.closedAt=now.toISOString();episode.outcome=outcome;episode.reason=reason;
 episode.disposition=outcome==='planning-enrolled'?'planning':outcome==='ordinary-by-unavailable'?'unavailable':'ordinary';saveAssessment(store,episode);
}
export function assessmentExpired(episode: AssessmentEpisode, now: Date) {
 return !!episode.eligibleAt && now.getTime()-Date.parse(episode.eligibleAt)>=ASSESSMENT_DEADLINE_MS;
}
export type DeadlineQueueObservation = (episode: AssessmentEpisode) => { wait?: string; outranked?: boolean };
/** No claims or capacity mutation. Cancellation is invoked after the terminal commit by the caller. */
export function progressAssessmentDeadlines(store: Store, now: Date, capacityObservation:(projectId:string)=>boolean, queueObservation:DeadlineQueueObservation): AssessmentEpisode[] {
 if(!assessmentEnabled(store)) return [];
 const due=assessmentEpisodes(store).filter(e=>!e.closedAt&&assessmentExpired(e,now));
 const closed:AssessmentEpisode[]=[];
 for(const episode of due) {
  let reason=episode.reason;
  if(!episode.startedAt) {
   const observed=queueObservation(episode);
   reason=observed.wait || (capacityObservation(store.project.id)?'assessment not started: delivery lane occupied':observed.outranked?'assessment not started: outranked by queued delivery work':'assessment not started: deadline reached before dispatch');
  }
  store.transaction(()=>{const current=assessmentEpisode(store,episode.id);if(!current||current.closedAt||!assessmentExpired(current,now))return;closeAssessment(store,current,'ordinary-by-deadline',now,reason);closed.push(current);store.emit('assessment-deadline',current.key+': '+reason,'pm',current.key);});
 }
 return closed;
}
