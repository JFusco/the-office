import {afterEach,expect,test,vi} from 'vitest';
import {knowledgeLayout} from '../../../src/tokens/knowledge-layout';
afterEach(()=>vi.unstubAllGlobals());
test('resolves fixed map spacing at startup and rejects missing tokens',()=>{
    const values=new Map([['--spacing-card-padding','16px'],['--spacing-map-label-min','120px']]),read=vi.fn(()=>({getPropertyValue:(name:string)=>values.get(name)||''}));
    vi.stubGlobal('document',{documentElement:{}});vi.stubGlobal('getComputedStyle',read);
    expect(knowledgeLayout()).toEqual({gap:16,minimum:120});expect(read).toHaveBeenCalledOnce();values.delete('--spacing-map-label-min');expect(()=>knowledgeLayout()).toThrow('Knowledge layout token --spacing-map-label-min is not defined');
});
