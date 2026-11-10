import {expect,test} from 'vitest';
import {writeFileSync,symlinkSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {blankEvidence} from '../../../../server/features/handoff/evidence-contract';
import {storeEvidence,readEvidence,evidenceDirectory} from '../../../../server/features/handoff/evidence-artifacts';
import {handoffFixture} from './fixture';
test('private artifacts verify byte and semantic identities and refuse changed bytes or path escapes',()=>{
 const f=handoffFixture();try{
 const evidence=blankEvidence('brain','GH-1','github','repo#1');evidence.description={type:'doc',content:[{type:'paragraph'}]};evidence.coverage.issue={state:'complete'};
 const ref=storeEvidence(f.store,evidence);expect(readEvidence(f.store,'GH-1',ref).description).toEqual(evidence.description);
 expect(()=>readEvidence(f.store,'GH-2',ref)).toThrow('not owned');writeFileSync(ref.artifact,'changed');expect(()=>readEvidence(f.store,'GH-1',ref)).toThrow('read-back');
 expect(()=>evidenceDirectory(f.store,'../escape')).toThrow('owner');
 }finally{f.close();}
});
test('owned evidence directories cannot traverse symlinks',()=>{
 const f=handoffFixture();try{const other=resolve(f.root,'other');mkdirSync(other);symlinkSync(other,resolve(f.root,'assessments'));expect(()=>evidenceDirectory(f.store,'GH-1')).toThrow('not owned');}finally{f.close();}
});
