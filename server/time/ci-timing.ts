import { observedDuration } from '../../src/timing';
import type { AzureBuild, AzurePR, OfficeSnapshot } from '../../src/shared';
import { sanitize } from '../office/security';
export function buildTiming(raw:any,observedAt:string):Partial<AzureBuild> {
  const queuedAt=raw.queueTime||'',startedAt=raw.startTime||'',finishedAt=raw.finishTime||'';
  return {queuedAt,startedAt,finishedAt,observedAt,queueMs:queuedAt?observedDuration(queuedAt,startedAt||undefined,observedAt):null,durationMs:raw.status==='completed'&&!finishedAt?null:observedDuration(startedAt,finishedAt,observedAt)};
}
export function timelineTiming(records:any[],observedAt:string):AzureBuild['stages'] {
  return records.filter(x=>['Stage','Job','Task'].includes(x.type)).map(x=>({id:x.id,parentId:x.parentId||'',type:x.type,attempt:Number(x.attempt)||1,name:sanitize(x.name||x.type),state:x.state||'',result:x.result||'',issues:(x.issues||[]).map((i:any)=>sanitize(i.message||'')),startedAt:x.startTime||'',finishedAt:x.finishTime||'',durationMs:x.state==='completed'&&!x.finishTime?null:observedDuration(x.startTime,x.finishTime,observedAt)}));
}
function keys(text:string):string[]{return [...new Set((text.match(/\bCEC-\d+\b/gi)||[]).map(x=>x.toUpperCase()))];}
export function rememberCi(state:OfficeSnapshot,builds:AzureBuild[],prs:AzurePR[]) {
  state.ciHistory??=[];
  for(const build of builds){
    const related=prs.filter(p=>build.branch===`refs/pull/${p.id}/merge`||p.policies.some(x=>x.buildId===build.id)||(!!build.commit&&(p.commit===build.commit||p.mergeCommit===build.commit)));
    build.relatedPrIds=related.map(p=>p.id);build.linkedTickets=[...new Set([...keys([build.branch,...related.map(p=>`${p.title} ${p.source}`)].join(' ')),...state.tickets.filter(t=>related.some(p=>p.id===t.prId)||(!!build.commit&&t.commit===build.commit)).map(t=>t.key)])];
    const old=state.ciHistory.find(b=>b.id===build.id);
    if(old){const attempts=new Map(old.stages.filter(s=>s.id).map(s=>[`${s.id}:${s.attempt||1}`,s]));for(const s of build.stages)if(s.id)attempts.set(`${s.id}:${s.attempt||1}`,s);
      Object.assign(old,build,{linkedTickets:[...new Set([...(old.linkedTickets||[]),...(build.linkedTickets||[])])],relatedPrIds:[...new Set([...(old.relatedPrIds||[]),...(build.relatedPrIds||[])])],stages:attempts.size?[...attempts.values()]:build.stages});
    }else state.ciHistory.push({...build,stages:[...build.stages]});
  }
}
