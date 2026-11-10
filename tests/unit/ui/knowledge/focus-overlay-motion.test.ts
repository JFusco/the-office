import {expect,test,vi} from 'vitest';
const state=vi.hoisted(()=>({values:[] as {set:ReturnType<typeof vi.fn>;destroy:ReturnType<typeof vi.fn>}[],detach:vi.fn(),bind:vi.fn()}));
vi.mock('motion',()=>({motionValue:()=>{const value={set:vi.fn(),destroy:vi.fn()};state.values.push(value);return value;},styleEffect:(...args:unknown[])=>{state.bind(...args);return state.detach;}}));
import {focusOverlayMotion} from '../../../../src/knowledge/map/focus-overlay-motion';
test('Motion binds projected values once and releases all bindings on disposal',()=>{
    const element={hidden:true} as HTMLElement,overlay=focusOverlayMotion(element);
    overlay.render({x:350,y:200,labelLeft:true,labelWidth:318});expect(element.hidden).toBe(false);
    const values=state.bind.mock.calls[0][1];expect(values['--map-focus-x'].set).toHaveBeenLastCalledWith('350px');expect(values['--map-focus-label-width'].set).toHaveBeenLastCalledWith('318px');
    overlay.render();expect(element.hidden).toBe(true);expect(state.bind).toHaveBeenCalledOnce();overlay.dispose();expect(state.detach).toHaveBeenCalledOnce();for(const value of state.values)expect(value.destroy).toHaveBeenCalledOnce();
});
