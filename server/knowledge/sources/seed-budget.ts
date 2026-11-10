import type { SourceRegistry } from './registry';
export interface SeedBudget { version:1; limit:number; members:{sourceId:string;sourceDigest:string;completedAt?:string}[]; importedCompletion?:string }
/** The approved seed group may use the higher global ceiling; subscriptions never add capacity. */
export function sourceLaunchLimit(registry:SourceRegistry,sourceId:string):number {
    const program=registry.meta<SeedBudget>('seed-budget'),source=registry.get(sourceId),member=program?.members.find(m=>m.sourceId===sourceId);
    return program?.version===1&&source?.state==='active'&&member&&!member.completedAt&&member.sourceDigest===source.sourceDigest?Math.max(8,Math.min(32,program.limit)):8;
}
export function completeSeedMember(registry:SourceRegistry,sourceId:string,sourceDigest:string,completedAt:string):void {
    registry.transaction(()=>{const program=registry.meta<SeedBudget>('seed-budget'),member=program?.members.find(m=>m.sourceId===sourceId&&m.sourceDigest===sourceDigest);if(!program||!member||member.completedAt)return;member.completedAt=completedAt;registry.setMeta('seed-budget',program);});
}
