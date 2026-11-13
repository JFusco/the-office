import {expect,test} from 'vitest';
import {normalizeRound} from '../../../../server/features/questions/normalize-round';
import {RawDiscoverySchema,RawPlanSchema} from '../../../../server/features/feature-schema';
import {fixture} from '../test-store';
import {beginReader,acceptReader} from '../../../../server/features/reader-attempts';
test('raw worker schemas retain five choices and unmatched recommendations until canonical acceptance',()=>{
 const f=fixture();try{
 const question={question:'Which?',choices:[' A ','a','B','C','D','E'],recommendation:'F'};
 const output={summary:'s',brief:'b',ready:false,questions:[question]};
 expect(RawDiscoverySchema.parse(output).questions[0].choices).toHaveLength(6);
 expect(RawPlanSchema.parse({summary:'s',markdown:'m',scope:['app.ts'],questions:[question]}).questions).toHaveLength(1);
 f.feature.baseline={repository:f.store.project.repository,path:f.root,ref:'main',sha:'a',scope:[],files:{}};
 expect(acceptReader(f.store,f.feature,beginReader(f.store,f.feature),output)).toBe(true);
 const q=f.feature.rounds[0].questions[0];expect(q.options?.map(o=>o.label)).toEqual(['F','A','B']);expect(q.recommendedOptionId).toBe(q.options?.[0].id);
 expect(normalizeRound([{...q,id:'FIND-001'}])[0].id).toBe('FIND-001');
 expect(()=>normalizeRound(Array(4).fill(question))).toThrow();
 }finally{f.close();}
});
test('fewer than two distinct choices retain free text; structured recommendation IDs survive normalization',()=>{
 expect(normalizeRound([{question:'Why?',recommendation:'A',choices:['A',' a ']}])[0].options).toEqual([]);
 const q=normalizeRound([{id:'saved',question:'Choose',recommendation:'Reason',options:[{id:'x',label:'X',tradeoff:'one'},{id:'y',label:'Y',tradeoff:'two'}],recommendedOptionId:'y'}])[0];
 expect(q.id).toBe('saved');expect(q.recommendedOptionId).toBe(q.options![0].id);expect(q.options![0].tradeoff).toBe('two');
});
test('duplicate worker question IDs persist as distinct IDs and the whole round can be answered',()=>{
 const f=fixture();try{
 const question=(text:string)=>({id:'q',question:text,recommendation:'Editors',choices:['Editors','Everyone']});
 f.feature.baseline={repository:f.store.project.repository,path:f.root,ref:'main',sha:'a',scope:[],files:{}};
 expect(acceptReader(f.store,f.feature,beginReader(f.store,f.feature),{summary:'s',brief:'b',ready:false,questions:[question('First?'),question('Second?')]})).toBe(true);
 const round=f.feature.rounds[0],ids=round.questions.map(q=>q.id);
 expect(ids[0]).toBe('q');expect(new Set(ids).size).toBe(2);
 const answers=Object.fromEntries(ids.map(id=>[id,'Editors']));
 commandFeature(f.store,f.feature.id,{action:'answer',requestId:'answer',expectedRevision:f.feature.revision,roundId:round.id,answers});
 expect(f.feature.rounds[0].answers).toEqual(answers);expect(f.feature.revision).toBe(2);
 }finally{f.close();}
});
import {commandFeature} from '../../../../server/features/commands';
