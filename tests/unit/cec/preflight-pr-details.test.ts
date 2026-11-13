import { expect, test } from 'vitest';
import { CEC } from '../../../server/office/config';
import { fullActivePRs } from '../../../server/cec/preflight-pr-details';
import { az } from '../../../server/cec/azure';
const pr = () => ({ pullRequestId: 42, status: 'active', repository: { id: CEC.repositoryId, name: CEC.repository },
    title: 'A fixture PR', isDraft: false, sourceRefName: 'refs/heads/feature', targetRefName: 'refs/heads/staging',
    lastMergeSourceCommit: { commitId: 'a'.repeat(40) }, description: 'x'.repeat(400) });

test('uses the complete detail body rather than the abbreviated list text, preserving a late ticket reference', async () => {
    const body='x'.repeat(400)+'\nRelated to CEC-900\nBearer sk-fixture-secret';
    const result=await fullActivePRs([pr()],async args=>{
        expect(args).toEqual(['repos','pr','show','--id','42','--detect','false']);
        return {...pr(),description:body};
    });
    expect(result[0].description).toContain('Related to CEC-900');
    expect(result[0].description).toContain('Bearer [redacted]');
    expect(result[0].description).not.toContain('sk-fixture-secret');
});
test.each([
    {pullRequestId:43}, {status:'completed'}, {repository:{id:'foreign',name:CEC.repository}},
    {lastMergeSourceCommit:{commitId:'b'.repeat(40)}}, {sourceRefName:'refs/heads/other'},
    {targetRefName:'refs/heads/other'}, {isDraft:true}, {description:{invalid:true}},
])('refuses changed or incomplete detail identity without falling back to list evidence: %j',async patch=>{
    await expect(fullActivePRs([pr()],async()=>({...pr(),...patch}))).rejects.toThrow(/incomplete|changed/);
});
test('native PR show uses only its supported organization scope and retains the read-only execution boundary',async()=>{
    const result=await az(['repos','pr','show','--id','42','--detect','false'],true,55000,async(file,args,options)=>{
        expect(file).toBe('az');
        expect(args).toEqual(['repos','pr','show','--id','42','--detect','false','--organization',CEC.organization,'--output','json']);
        expect(options).toEqual({timeout:55000,readOnly:true});
        return JSON.stringify(pr());
    });
    expect(result).toEqual(pr());
});
