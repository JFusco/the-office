import type { Store } from '../../store/store';
export interface CaptureRequest { target:string;key:string;generation:number;enqueuedAt:string;dueAt:string;status:'queued'|'working'|'complete'|'failed';attempts?:number;requestedFor:'observation'|'provider-version'|'authorization'|'periodic';providerVersion:string;completedAt?:string;authorizationRevision?:number;error?:string }
export function captureRequests(store:Store):CaptureRequest[]{return (store.db.prepare('SELECT body FROM feature_evidence_captures WHERE project_id=? ORDER BY rowid').all(store.project.id) as {body:string}[]).map(r=>JSON.parse(r.body));}
export function captureRequest(store:Store,target:string):CaptureRequest|undefined {const row=store.db.prepare('SELECT body FROM feature_evidence_captures WHERE project_id=? AND target=?').get(store.project.id,target) as {body:string}|undefined;return row&&JSON.parse(row.body);}
export function saveCaptureRequest(store:Store,request:CaptureRequest){store.db.prepare('INSERT INTO feature_evidence_captures(project_id,target,body) VALUES(?,?,?) ON CONFLICT(project_id,target) DO UPDATE SET body=excluded.body').run(store.project.id,request.target,JSON.stringify(request));}
/** FIFO belongs to each generation, not to the long-lived target or scheduler claim. */
export function requestCapture(store:Store,target:string,key:string,reason:CaptureRequest['requestedFor'],providerVersion:string,at=store.clock.now().toISOString()):CaptureRequest {
 const old=captureRequest(store,target);
 if(old&&['queued','working'].includes(old.status)&&old.providerVersion===providerVersion&&reason!=='authorization')return old;
 const request:CaptureRequest={target,key,generation:(old?.generation??0)+1,enqueuedAt:at,dueAt:at,status:'queued',requestedFor:reason,providerVersion};saveCaptureRequest(store,request);return request;
}

export function failCapture(store: Store, request: CaptureRequest, error: unknown): boolean {
 request.error=String(error);request.completedAt=store.clock.now().toISOString();
 const exhausted=(request.attempts??1)>=3;
 if(exhausted)request.status='failed';
 else {request.status='queued';request.dueAt=new Date(store.clock.now().getTime()+((request.attempts??1)<=1?30_000:120_000)).toISOString();request.enqueuedAt=request.dueAt;}
 saveCaptureRequest(store,request);return exhausted;
}
