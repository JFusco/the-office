import {afterEach,expect,test,vi} from 'vitest';
afterEach(()=>vi.unstubAllGlobals());
test('caches a complete layout and retries missing tokens without caching partial reads',async()=>{
    vi.resetModules();const {knowledgeLayout}=await import('../../../src/tokens/knowledge-layout');
    const values=new Map([['--spacing-card-padding','16px']]),read=vi.fn(()=>({getPropertyValue:(name:string)=>values.get(name)||''}));
    vi.stubGlobal('document',{documentElement:{}});vi.stubGlobal('getComputedStyle',read);
    expect(()=>knowledgeLayout()).toThrow('Knowledge layout token --spacing-map-label-min is not defined');expect(()=>knowledgeLayout()).toThrow('Knowledge layout token');expect(read).toHaveBeenCalledTimes(2);
    values.set('--spacing-map-label-min','120px');const first=knowledgeLayout();expect(first).toEqual({gap:16,minimum:120});expect(knowledgeLayout()).toBe(first);expect(read).toHaveBeenCalledTimes(3);
});
