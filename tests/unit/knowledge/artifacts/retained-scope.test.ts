import { expect,test } from 'vitest';
import { mkdirSync,writeFileSync,symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { intakeFixture } from '../slack-intake/fixture';
import { apiRoute } from '../../../../server/office/http/api-routes';
test('run artifact reads remain scoped and noncacheable even when the original ticket is pruned',async()=>{const f=intakeFixture();try{
    const run=crypto.randomUUID(),path=resolve(f.store.dataRoot,'runs',run,'result.txt');mkdirSync(resolve(f.store.dataRoot,'runs',run),{recursive:true});writeFileSync(path,'SYNTHETIC PRIVATE RUN ARTIFACT');
    f.store.state.knowledge!.exposures=[{id:'attempt',stage:'implement',at:'now',dispatchedAt:'now',digest:'hash',eligible:[],selected:[],omitted:[],subject:{kind:'ticket',id:run},sourceBindings:[{sourceId:f.source.id}]}];
    const context={store:f.store,project:'brain',offices:{sources:f.registry,stores:()=>new Map([['brain',f.store]])}} as any,url=new URL('http://localhost/api/artifact?path='+encodeURIComponent(path));
    const allowed=await apiRoute(new Request(url),url,context);expect(allowed!.status).toBe(200);expect(allowed!.headers.get('Cache-Control')).toBe('private, no-store');
    const alias=resolve(f.store.dataRoot,'runs','alias');symlinkSync(resolve(f.store.dataRoot,'runs',run),alias,'dir');const aliasUrl=new URL('http://localhost/api/artifact?path='+encodeURIComponent(resolve(alias,'result.txt')));f.registry.subscribe(f.source.id,'brain',false);expect((await apiRoute(new Request(aliasUrl),aliasUrl,context))!.status).toBe(403);const denied=await apiRoute(new Request(url),url,context);expect(denied!.status).toBe(403);expect(await denied!.text()).not.toContain('SYNTHETIC PRIVATE RUN ARTIFACT');
}finally{f.close();}});
