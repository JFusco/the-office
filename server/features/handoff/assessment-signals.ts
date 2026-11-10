import type { featurePolicy } from '../progression/policy';
export interface AssessmentSignals { activeFeatureId?:string;explicitStart?:boolean;ownerId?:string;adoptedPr?:number;type?:string;labels:string[] }
export function assessmentSignal(input:AssessmentSignals,policy:ReturnType<typeof featurePolicy>):{disposition:'planning'|'ordinary';rule:string;observedFields:unknown}|undefined {
 const result=(disposition:'planning'|'ordinary',rule:string,observedFields:unknown)=>({disposition,rule,observedFields});
 if(input.activeFeatureId)return result('planning','active-feature',{featureId:input.activeFeatureId});
 if(input.explicitStart)return result('ordinary','explicit-start',{explicitStart:true});
 if(input.ownerId||input.adoptedPr)return result('ordinary','existing-owner',{ownerId:input.ownerId,adoptedPr:input.adoptedPr});
 if(input.type==='Epic')return result('ordinary','epic-decomposition',{type:input.type});
 const planning=input.labels.filter(l=>policy.assessment.planningLabels.includes(l)),ordinary=input.labels.filter(l=>policy.assessment.ordinaryLabels.includes(l));
 if(!!planning.length===!!ordinary.length)return;
 return result(planning.length?'planning':'ordinary',planning.length?'planning-label':'ordinary-label',{labels:planning.length?planning:ordinary});
}
