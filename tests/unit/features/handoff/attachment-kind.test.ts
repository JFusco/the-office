import {expect,test} from 'vitest';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {attachmentKind} from '../../../../server/features/handoff/attachment-kind';
import {handoffFixture} from './fixture';
test('extensionless provider images remain explicitly unread images',()=>{
 const f=handoffFixture();try{const path=resolve(f.root,'asset');writeFileSync(path,Buffer.from([137,80,78,71,13,10,26,10]));expect(attachmentKind(path,'application/octet-stream','uuid')).toBe('image');writeFileSync(path,'%PDF-1.4');expect(attachmentKind(path,'application/octet-stream','uuid')).toBe('pdf');writeFileSync(path,'unknown');expect(attachmentKind(path,'application/octet-stream','uuid')).toBe('unsupported');}finally{f.close();}
});
