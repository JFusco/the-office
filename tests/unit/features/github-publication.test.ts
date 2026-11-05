import { expect,test } from 'vitest';
import { GitHubFeaturePublisher } from '../../../server/features/github-publication';
import { fixture } from './test-store';
test('GitHub read-back rejects ambiguous provenance and verifies final content independently of initial assignment',async()=>{
 const f=fixture();try{
  const body='office-feature-'+f.feature.id+'-item-one';
  const issue={number:10,html_url:'https://github.com/JFusco/brain/issues/10',state:'open',title:'Feature',body,labels:[],assignees:[{login:'JFusco'}]};
  let matches=[issue,issue];
  const run=async(_program:string,args:string[])=>JSON.stringify(args.includes('--slurp')?[matches]:issue);
  const p=new GitHubFeaturePublisher(f.store,f.feature,run);
  const create={id:'create',kind:'create',payload:{title:'Feature',body,labels:[],assignees:[]},expected:{}};
  const item={id:'one',operations:[create,{id:'assign',kind:'assign',payload:{assignees:['JFusco']},expected:{}}]} as any;
  expect(await p.verifyFinal(item,{key:'GH-10',url:issue.html_url})).toBe(true);
  expect((await p.readBack({payload:{operation:create,key:'',marker:body}} as any)).verified).toBe(false);
  matches=[issue];issue.assignees=[];
  expect((await p.readBack({payload:{operation:create,key:'',marker:body}} as any)).verified).toBe(true);
  expect(await p.verifyFinal(item,{key:'GH-10',url:issue.html_url})).toBe(false);
 }finally{f.close();}
});
test('changed issue content blocks an update before dispatch',async()=>{
 const f=fixture();try{
 const p=new GitHubFeaturePublisher(f.store,f.feature,async()=>JSON.stringify({title:'Changed',body:'Original',labels:[],assignees:[]}));
 const content={title:'Original',body:'Original',labels:[],assignees:[]};
 await expect(p.preflight({} as any,{kind:'update',payload:content,expected:content} as any,'GH-10')).rejects.toThrow('changed');
 }finally{f.close();}
});
