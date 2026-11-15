import { expect,test } from 'vitest';
import { referencedQAArtifact } from '../../../server/qa/report-access';
test('GitHub report access only includes exact referenced QA report/evidence paths',()=>{
    const state={tickets:[],coordination:{jobs:[{steps:[{stage:'validate',result:{qa:{version:1},qaRunDir:'/tmp/job/office-qa/validate-0',evidence:[{path:'/tmp/job/output.txt'}]}}]}]}} as any;
    expect(referencedQAArtifact(state,'/tmp/job/office-qa/validate-0/report.json')).toBe(true);
    expect(referencedQAArtifact(state,'/tmp/job/output.txt')).toBe(true);
    expect(referencedQAArtifact(state,'/tmp/job/provider.json')).toBe(false);
});
test('retained and deterministic QA results can expose their recorded evidence, never unrelated job files',()=>{
    const state={tickets:[],coordination:{jobs:[{steps:[{stage:'validate',result:{qaRunDir:'',evidence:[{path:'/tmp/job/checks.txt'}]}}]}]}} as any;
    expect(referencedQAArtifact(state,'/tmp/job/checks.txt')).toBe(true);
    expect(referencedQAArtifact(state,'/tmp/job/report.json')).toBe(false);
    expect(referencedQAArtifact(state,'/tmp/job/session.json')).toBe(false);
});
