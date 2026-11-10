import {expect,test,vi} from 'vitest';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {assetDownloader} from '../../../../server/features/handoff/asset-download';
import {handoffFixture} from './fixture';
test('asset reader refuses arbitrary redirects and sends no authorization',async()=>{
 const f=handoffFixture();try{
 const fetcher=vi.fn(async()=>new Response(null,{status:302,headers:{location:'https://untrusted.invalid/secret'}}));
 await expect(assetDownloader(fetcher as typeof fetch)('https://github.com/user-attachments/assets/id',resolve(f.root,'asset'),new AbortController().signal,10)).rejects.toThrow('redirect');
 expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0]).toHaveLength(2);expect((fetcher.mock.calls[0] as unknown as any[])[1]).toMatchObject({credentials:'omit',redirect:'manual'});
 }finally{f.close();}
});
test('stream and declared byte bounds are enforced',async()=>{
 const f=handoffFixture();try{
 const url='https://github.com/user-attachments/assets/id',signal=new AbortController().signal;
 await expect(assetDownloader(async()=>new Response('0123456789'))(url,resolve(f.root,'too-big'),signal,5)).rejects.toThrow('byte limit');
 const path=resolve(f.root,'small');await assetDownloader(async()=>new Response('ok'))(url,path,signal,5);expect(readFileSync(path,'utf8')).toBe('ok');
 }finally{f.close();}
});
