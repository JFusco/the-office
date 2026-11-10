import {afterEach,expect,test,vi} from 'vitest';
afterEach(()=>vi.unstubAllGlobals());
test('real Motion flushes the complete projection before visibility and detaches on disposal',async()=>{
    vi.resetModules();const frames:FrameRequestCallback[]=[];vi.stubGlobal('requestAnimationFrame',(fn:FrameRequestCallback)=>{frames.push(fn);return frames.length;});
    const {focusOverlayMotion}=await import('../../../../src/knowledge/map/focus-overlay-motion'),{styleEffect}=await import('motion');
    const styles=new Map<string,string>();let hidden=true;let expected='350px';
    class Surface extends EventTarget {
        offsetHeight=400;style={setProperty:(key:string,value:string)=>styles.set(key,value)};
        get hidden(){return hidden;}set hidden(value:boolean){if(!value)expect(styles.get('--map-focus-x')).toBe(expected);hidden=value;}
    }
    const element=new Surface() as unknown as HTMLElement,overlay=focusOverlayMotion(element);
    const names=['--map-focus-x','--map-focus-y','--map-focus-label-width','--map-focus-label-shift'];
    const values=names.map(name=>styleEffect.get(element,name)!);const destroy=values.map(value=>vi.spyOn(value,'destroy'));
    requestAnimationFrame(()=>overlay.render({x:350,y:200,labelLeft:true,labelWidth:318}));frames.pop()!(16);
    expect(element.hidden).toBe(false);expect(styles.get('--map-focus-y')).toBe('200px');
    overlay.render();expect(element.hidden).toBe(true);expected='120px';overlay.render({x:120,y:75});expect(element.hidden).toBe(false);expect(styles.get('--map-focus-y')).toBe('75px');
    overlay.dispose();for(const spy of destroy)expect(spy).toHaveBeenCalledOnce();for(const name of names)expect(styleEffect.get(element,name)).toBeUndefined();
    for(const fn of frames.splice(0))fn(32);expect(element.hidden).toBe(true);
});
