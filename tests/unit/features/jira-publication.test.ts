import {expect,test} from 'vitest';
import {JiraFeaturePublisher} from '../../../server/features/jira-publication';
import {CEC} from '../../../server/office/config';
import {fixture} from './test-store';
test('CEC metadata uses native base types and board scope, and staging eligibility is read back',async()=>{
 const f=fixture('cec');try{
 const calls:string[][]=[];const marker='office-feature-'+f.feature.id+'-item-one';
 const content={space:'CEC',type:'Build Task',summary:'Feature',description:marker,labels:[marker]};
 const issue={key:'CEC-10',summary:'Feature',description:marker,labels:[marker],assignee:{accountId:CEC.account},status:{name:'Open',id:'1'},issueType:{name:'Build Task',subtask:false},subtask:false};
 const run=async(_p:string,args:string[])=>{
  calls.push(args);
  const data=args.includes('scope')?{filter:{id:'53671'}}:args.includes('types')?[{name:'Build Task',hierarchyLevel:0,subtask:false}]:args.includes('create-metadata')?{fields:[]}:args.includes('query')?{issues:[issue]}:issue;
  return JSON.stringify({data});
 };
 const p=new JiraFeaturePublisher(f.store,f.feature,run);
 const item={id:'one',operations:[{kind:'create',payload:content},{kind:'assign',payload:{assignee:CEC.account}}]} as any;
 expect(JSON.parse(await p.context()).recommendedType).toBe('Build Task');
 expect(calls.some(a=>a.slice(1,4).join(' ')==='board scope query')).toBe(true);
 expect(await p.verifyFinal(item,{key:'CEC-10',url:'https://example.test/CEC-10'})).toBe(true);
 issue.status={name:'Done',id:'10001'};
 expect(await p.verifyFinal(item,{key:'CEC-10',url:'https://example.test/CEC-10'})).toBe(false);
 }finally{f.close();}
});
test.each([
 {type:'doc',content:[{type:'table',content:[]}]},
 {type:'doc',content:[{type:'mediaSingle',content:[]}]},
 {type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Text',marks:[{type:'link',attrs:{href:'https://example.test'}}]}]}]},
])('rich Jira descriptions are rejected before a plain-text update: %j',async description=>{
 const f=fixture('cec');try{
  let writes=0;
  const p=new JiraFeaturePublisher(f.store,f.feature,async(_p,args,options)=>{
   if(options?.readOnly===false)writes++;
   return JSON.stringify({data:args.includes('types')?[{name:'Build Task',hierarchyLevel:0,subtask:false}]:args.includes('create-metadata')?{fields:[]}:{key:'CEC-10',fields:{summary:'Feature',description,labels:['keep']}}});
  });
  await expect(p.preflight({} as any,{kind:'update',payload:{space:'CEC',type:'Build Task',summary:'Feature',description:'Text',labels:['keep']},expected:{summary:'Feature',description:'Text',labels:['keep']}} as any,'CEC-10')).rejects.toThrow('changed since approval preview');
  expect(writes).toBe(0);
 }finally{f.close();}
});
test('plain Jira paragraphs may be updated while existing labels must survive validation',async()=>{
 const f=fixture('cec');try{
  const marker='office-feature-'+f.feature.id+'-item-one';
  const p=new JiraFeaturePublisher(f.store,f.feature,async(_p,args)=>{
   const data=args.includes('scope')?{filter:{id:'53671'}}:args.includes('types')?[{name:'Build Task',hierarchyLevel:0,subtask:false}]:args.includes('create-metadata')?{fields:[]}:
    {key:'CEC-10',fields:{summary:'Feature',description:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Text'}]}]},labels:['keep']}};
   return JSON.stringify({data});
  });
  const operation={id:'update',kind:'update',payload:{space:'CEC',type:'Build Task',summary:'Feature',description:marker,labels:['keep',marker]},expected:{summary:'Feature',description:'Text',labels:['keep']}} as any;
  await expect(p.preflight({} as any,operation,'CEC-10')).resolves.toBeUndefined();
  operation.payload.labels=[marker];
  await expect(p.validate({provider:'azure',destination:f.store.project.repository,items:[{id:'one',key:'CEC-10',operations:[operation,{id:'assign',kind:'assign',payload:{assignee:CEC.account},expected:{}}]}]} as any)).rejects.toThrow('preserve existing labels');
 }finally{f.close();}
});
test('required unsupported Jira fields stop publication rather than being silently omitted',async()=>{
 const f=fixture('cec');try{
 const p=new JiraFeaturePublisher(f.store,f.feature,async(_p,args)=>JSON.stringify({data:args.includes('types')?[{name:'Build Task',hierarchyLevel:0,subtask:false}]:{fields:[{id:'customfield_required',required:true}]}}));
 await expect(p.preflight({} as any,{kind:'create',payload:{space:'CEC',type:'Build Task',summary:'Feature',description:'Text',labels:[]}} as any,'')).rejects.toThrow('Unsupported required CEC fields');
 }finally{f.close();}
});
