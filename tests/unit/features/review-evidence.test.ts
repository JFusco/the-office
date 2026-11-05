import {expect,test} from 'vitest';
import {readReview} from '../../../server/features/review-evidence';
import {fixture} from './test-store';
test('review inspection rejects helper drift and parses only canonical evidence',async()=>{
 const f=fixture();try{
 const install={helper:'/fixture/scripts/review_cli.py',python:'/fixture/python',root:'/fixture'};
 f.feature.baseline={path:f.root} as any;f.feature.review={helper:install.helper,helperCommit:'saved',run:'run'} as any;
 await expect(readReview(f.feature,async()=> 'different',install)).rejects.toThrow('changed');
 const calls:string[][]=[];
 const evidence={run:'run',status:'ready',stage:'research',revision:0,fingerprint:'fingerprint',researchDigest:'',timeout:60,profiles:{},fallbacks:{},error:'',findings:[],plan:'',artifact:''};
 expect(await readReview(f.feature,async(program,args)=>{calls.push(args);return program==='git'?'saved':JSON.stringify(evidence);},install)).toEqual(evidence);
 expect(calls[1][0]).toMatch(/helper-evidence.py$/);
 }finally{f.close();}
});
